-- ============ 1. TEAR DOWN PREVIOUS RESIDENCE SYSTEM ============
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS
  public.application_documents, public.applications, public.referrals,
  public.ledger_entries, public.monthly_rent_tracking, public.payments,
  public.complaints, public.leases, public.lease_terms, public.student_reservations,
  public.students, public.beds, public.rooms, public.building_configs,
  public.matchmaker_settings, public.roommate_swipes, public.roommate_matches,
  public.roommate_profiles, public.rent_rules, public.pricing_config,
  public.viewing_requests, public.documents, public.announcements,
  public.buildings, public.system_audit_log, public.user_roles, public.profiles
CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.tg_rooms_sync_occupied() CASCADE;
DROP FUNCTION IF EXISTS public.tg_set_updated_at() CASCADE;

DROP TYPE IF EXISTS public.app_role, public.applicant_type, public.application_status,
  public.complaint_status, public.lease_status, public.payment_status,
  public.rent_period_status CASCADE;

-- ============ 2. SHARED HELPERS ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TYPE public.app_role AS ENUM
  ('user','verified_user','verified_investor','verified_organisation','moderator','admin','super_admin');

CREATE TYPE public.visibility_level AS ENUM ('public','community','protected','private');
CREATE TYPE public.project_stage AS ENUM
  ('idea','research','concept','prototype','testing','pilot','early_market','growth','established');
CREATE TYPE public.post_type AS ENUM
  ('post','build_reel','project_update','research','collaboration_request','opportunity');
CREATE TYPE public.reaction_type AS ENUM
  ('support','innovative','great_potential','i_can_help','lets_collaborate','interested_in_investing');
CREATE TYPE public.access_request_status AS ENUM ('pending','approved','rejected','revoked');
CREATE TYPE public.report_status AS ENUM ('open','triaged','restricted','responded','under_review','resolved','dismissed','referred');

-- ============ 3. PROFILES & IDENTITY ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  bio text,
  avatar_url text,
  cover_url text,
  country text, province text, city text,
  institution text, website text, portfolio_url text,
  open_to_collaboration boolean NOT NULL DEFAULT false,
  open_to_mentorship boolean NOT NULL DEFAULT false,
  investor_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  under_35_optin boolean NOT NULL DEFAULT false,
  profile_visibility public.visibility_level NOT NULL DEFAULT 'community',
  onboarding_completed_at timestamptz,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.private_profile_data (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  legal_name text, phone text, contact_email text,
  date_of_birth date, address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL, label text NOT NULL, sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL, label text NOT NULL, is_approved boolean NOT NULL DEFAULT true
);
CREATE TABLE public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL, label text NOT NULL, is_approved boolean NOT NULL DEFAULT true
);
CREATE TABLE public.profile_identities (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL REFERENCES public.identities(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, identity_id)
);
CREATE TABLE public.profile_skills (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, skill_id)
);
CREATE TABLE public.profile_sectors (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sector_id uuid NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, sector_id)
);

-- ============ 4. ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('moderator','admin','super_admin'));
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','super_admin'));
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base_username text;
BEGIN
  base_username := lower(regexp_replace(split_part(NEW.email,'@',1),'[^a-z0-9_]','','g'));
  IF base_username = '' OR base_username IS NULL THEN base_username := 'member'; END IF;
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, base_username || '_' || substr(NEW.id::text,1,6),
          COALESCE(NEW.raw_user_meta_data->>'display_name',''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ 5. AGREEMENTS ============
CREATE TABLE public.agreement_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_key text NOT NULL,
  version text NOT NULL,
  title text NOT NULL,
  body_markdown text NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  requires_reacceptance boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agreement_key, version)
);
CREATE TABLE public.agreement_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_version_id uuid NOT NULL REFERENCES public.agreement_versions(id) ON DELETE RESTRICT,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  acceptance_method text NOT NULL DEFAULT 'checkbox',
  superseded boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, agreement_version_id)
);

-- ============ 6. PROJECTS ============
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text, cover_url text,
  pitch text, problem text, solution text, target_audience text,
  sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL,
  technologies text[] NOT NULL DEFAULT '{}',
  stage public.project_stage NOT NULL DEFAULT 'idea',
  country text, province text, city text,
  required_skills text[] NOT NULL DEFAULT '{}',
  seeking_collaborators boolean NOT NULL DEFAULT false,
  seeking_funding boolean NOT NULL DEFAULT false,
  funding_status text, funding_amount numeric,
  website_url text, demo_url text, repository_url text, research_url text,
  visibility public.visibility_level NOT NULL DEFAULT 'private',
  ownership_declaration text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title text, can_edit boolean NOT NULL DEFAULT false,
  contribution_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE OR REPLACE FUNCTION public.can_edit_project(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.project_members m
                 WHERE m.project_id = _project_id AND m.user_id = _user_id AND m.can_edit);
$$;

CREATE TABLE public.protected_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  confidentiality_accepted boolean NOT NULL DEFAULT false,
  confidentiality_accepted_at timestamptz,
  status public.access_request_status NOT NULL DEFAULT 'pending',
  decided_by uuid, decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, requester_id)
);

CREATE OR REPLACE FUNCTION public.can_view_project(_project_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = _project_id AND (
      p.visibility = 'public'
      OR (p.visibility = 'community' AND _user_id IS NOT NULL)
      OR p.owner_id = _user_id
      OR EXISTS (SELECT 1 FROM public.project_members m WHERE m.project_id = p.id AND m.user_id = _user_id)
      OR (p.visibility = 'protected' AND EXISTS (
            SELECT 1 FROM public.protected_access_requests r
            WHERE r.project_id = p.id AND r.requester_id = _user_id AND r.status = 'approved'))
    ));
$$;

CREATE TABLE public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL, description text,
  milestone_date date, stage public.project_stage,
  media_urls text[] NOT NULL DEFAULT '{}',
  file_urls text[] NOT NULL DEFAULT '{}',
  contributor_ids uuid[] NOT NULL DEFAULT '{}',
  visibility public.visibility_level NOT NULL DEFAULT 'private',
  version int NOT NULL DEFAULT 1,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.project_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storage_path text NOT NULL, media_type text NOT NULL,
  caption text, file_hash text, file_size bigint,
  visibility public.visibility_level NOT NULL DEFAULT 'private',
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ 7. POSTS & SOCIAL GRAPH ============
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type public.post_type NOT NULL DEFAULT 'post',
  caption text,
  purpose text,
  requested_help text,
  sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  visibility public.visibility_level NOT NULL DEFAULT 'community',
  is_removed boolean NOT NULL DEFAULT false,
  reduced_distribution boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  storage_path text NOT NULL, media_type text NOT NULL,
  position int NOT NULL DEFAULT 0, duration_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_removed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction public.reaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, reaction)
);
CREATE TABLE public.saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag text UNIQUE NOT NULL
);
CREATE TABLE public.post_hashtags (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, hashtag_id)
);
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

-- ============ 8. COLLABORATION ============
CREATE TABLE public.collaboration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requirement text NOT NULL,
  description text,
  skills text[] NOT NULL DEFAULT '{}',
  location text, is_remote boolean NOT NULL DEFAULT false,
  commitment text, compensation_disclosure text,
  deadline date,
  visibility public.visibility_level NOT NULL DEFAULT 'community',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.collaboration_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.collaboration_requests(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text, status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, applicant_id)
);

-- ============ 9. MESSAGING & NOTIFICATIONS ============
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id AND user_id = _user_id);
$$;
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL, title text NOT NULL, body text,
  link_path text, read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ 10. TRUST, SAFETY & EVIDENCE ============
CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_type text NOT NULL, subject_id uuid NOT NULL,
  category text NOT NULL, description text,
  status public.report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ip_misuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  disputed_subject_type text NOT NULL, disputed_subject_id uuid,
  description text NOT NULL,
  original_dates text, evidence_urls text[] NOT NULL DEFAULT '{}',
  registration_information text, requested_outcome text,
  good_faith_declaration boolean NOT NULL DEFAULT false,
  status public.report_status NOT NULL DEFAULT 'open',
  respondent_response text, respondent_responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_type text NOT NULL, subject_id uuid NOT NULL,
  action text NOT NULL, reason text NOT NULL,
  previous_state jsonb, new_state jsonb,
  requires_human_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moderation_action_id uuid REFERENCES public.moderation_actions(id) ON DELETE SET NULL,
  statement text NOT NULL,
  status public.report_status NOT NULL DEFAULT 'open',
  decided_by uuid, decided_at timestamptz, decision_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL, reason text,
  entity_type text, entity_id uuid,
  previous_state jsonb, new_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.evidence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text, entity_id uuid,
  version int, file_hash text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ 11. UPDATED_AT TRIGGERS ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','private_profile_data','projects','project_milestones',
    'posts','comments','collaboration_requests','collaboration_applications',
    'protected_access_requests','content_reports','ip_misuse_reports']
  LOOP
    EXECUTE format('CREATE TRIGGER tg_%1$s_upd BEFORE UPDATE ON public.%1$s
      FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()', t);
  END LOOP;
END $$;

-- ============ 12. GRANTS + RLS (DENY BY DEFAULT) ============
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- Reference lists readable by everyone
GRANT SELECT ON public.identities, public.skills, public.sectors, public.hashtags,
  public.agreement_versions TO anon;
CREATE POLICY "identities readable" ON public.identities FOR SELECT USING (true);
CREATE POLICY "skills readable" ON public.skills FOR SELECT USING (true);
CREATE POLICY "sectors readable" ON public.sectors FOR SELECT USING (true);
CREATE POLICY "hashtags readable" ON public.hashtags FOR SELECT USING (true);
CREATE POLICY "agreements readable" ON public.agreement_versions FOR SELECT USING (true);
CREATE POLICY "admins manage identities" ON public.identities FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admins manage skills" ON public.skills FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admins manage sectors" ON public.sectors FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "admins manage agreements" ON public.agreement_versions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "members add hashtags" ON public.hashtags FOR INSERT TO authenticated WITH CHECK (true);

-- Profiles
GRANT SELECT ON public.profiles TO anon;
CREATE POLICY "public profiles readable" ON public.profiles FOR SELECT
  USING (profile_visibility = 'public' OR (auth.uid() IS NOT NULL AND profile_visibility = 'community')
         OR id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "own private data" ON public.private_profile_data FOR ALL TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Profile link tables
CREATE POLICY "profile identities readable" ON public.profile_identities FOR SELECT TO authenticated USING (true);
CREATE POLICY "profile identities own" ON public.profile_identities FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "profile skills readable" ON public.profile_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "profile skills own" ON public.profile_skills FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "profile sectors readable" ON public.profile_sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "profile sectors own" ON public.profile_sectors FOR ALL TO authenticated
  USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Roles: read own, only admins may grant
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Agreement acceptances: insert + read own, never edit or delete
CREATE POLICY "read own acceptances" ON public.agreement_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "record own acceptance" ON public.agreement_acceptances FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Projects
GRANT SELECT ON public.projects TO anon;
CREATE POLICY "projects visible" ON public.projects FOR SELECT
  USING (visibility = 'public' OR public.can_view_project(id, auth.uid()) OR public.is_staff(auth.uid()));
CREATE POLICY "create own project" ON public.projects FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "edit own project" ON public.projects FOR UPDATE TO authenticated
  USING (public.can_edit_project(id, auth.uid())) WITH CHECK (public.can_edit_project(id, auth.uid()));
CREATE POLICY "delete own project" ON public.projects FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "members visible" ON public.project_members FOR SELECT TO authenticated
  USING (public.can_view_project(project_id, auth.uid()) OR user_id = auth.uid());
CREATE POLICY "manage members" ON public.project_members FOR ALL TO authenticated
  USING (public.can_edit_project(project_id, auth.uid()))
  WITH CHECK (public.can_edit_project(project_id, auth.uid()));

CREATE POLICY "milestones visible" ON public.project_milestones FOR SELECT TO authenticated
  USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "manage milestones" ON public.project_milestones FOR ALL TO authenticated
  USING (public.can_edit_project(project_id, auth.uid()))
  WITH CHECK (public.can_edit_project(project_id, auth.uid()));

CREATE POLICY "project media visible" ON public.project_media FOR SELECT TO authenticated
  USING (public.can_view_project(project_id, auth.uid()));
CREATE POLICY "manage project media" ON public.project_media FOR ALL TO authenticated
  USING (public.can_edit_project(project_id, auth.uid()))
  WITH CHECK (public.can_edit_project(project_id, auth.uid()));

CREATE POLICY "access requests visible" ON public.protected_access_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.can_edit_project(project_id, auth.uid()) OR public.is_staff(auth.uid()));
CREATE POLICY "create access request" ON public.protected_access_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY "decide access request" ON public.protected_access_requests FOR UPDATE TO authenticated
  USING (public.can_edit_project(project_id, auth.uid()))
  WITH CHECK (public.can_edit_project(project_id, auth.uid()));

-- Posts
GRANT SELECT ON public.posts, public.post_media TO anon;
CREATE POLICY "posts visible" ON public.posts FOR SELECT
  USING (
    is_removed = false AND (
      visibility = 'public'
      OR (visibility = 'community' AND auth.uid() IS NOT NULL)
      OR author_id = auth.uid()
      OR (project_id IS NOT NULL AND public.can_view_project(project_id, auth.uid()))
    ) OR public.is_staff(auth.uid()));
CREATE POLICY "create own post" ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "edit own post" ON public.posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (author_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "delete own post" ON public.posts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "post media visible" ON public.post_media FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));
CREATE POLICY "manage own post media" ON public.post_media FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));

CREATE POLICY "comments visible" ON public.comments FOR SELECT TO authenticated
  USING (is_removed = false OR public.is_staff(auth.uid()));
CREATE POLICY "create own comment" ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "edit own comment" ON public.comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (author_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "delete own comment" ON public.comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "reactions visible" ON public.reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage own reactions" ON public.reactions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own saves" ON public.saves FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "follows visible" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage own follows" ON public.follows FOR ALL TO authenticated
  USING (follower_id = auth.uid()) WITH CHECK (follower_id = auth.uid());

CREATE POLICY "post hashtags visible" ON public.post_hashtags FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage own post hashtags" ON public.post_hashtags FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));

CREATE POLICY "own blocks" ON public.blocks FOR ALL TO authenticated
  USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());

-- Collaboration
CREATE POLICY "collab requests visible" ON public.collaboration_requests FOR SELECT TO authenticated
  USING (visibility IN ('public','community') OR public.can_view_project(project_id, auth.uid()));
CREATE POLICY "manage collab requests" ON public.collaboration_requests FOR ALL TO authenticated
  USING (public.can_edit_project(project_id, auth.uid()))
  WITH CHECK (public.can_edit_project(project_id, auth.uid()));

CREATE POLICY "collab applications visible" ON public.collaboration_applications FOR SELECT TO authenticated
  USING (applicant_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.collaboration_requests r
    WHERE r.id = request_id AND public.can_edit_project(r.project_id, auth.uid())));
CREATE POLICY "apply to collab" ON public.collaboration_applications FOR INSERT TO authenticated
  WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "decide collab application" ON public.collaboration_applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collaboration_requests r
    WHERE r.id = request_id AND public.can_edit_project(r.project_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collaboration_requests r
    WHERE r.id = request_id AND public.can_edit_project(r.project_id, auth.uid())));

-- Messaging
CREATE POLICY "conversations visible" ON public.conversations FOR SELECT TO authenticated
  USING (public.is_conversation_participant(id, auth.uid()));
CREATE POLICY "start conversation" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "participants visible" ON public.conversation_participants FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "add participants" ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid()));
CREATE POLICY "update own participation" ON public.conversation_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "messages visible" ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "send message" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "mark own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Trust & safety
CREATE POLICY "own reports visible" ON public.content_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "file report" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "staff update reports" ON public.content_reports FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "own ip reports visible" ON public.ip_misuse_reports FOR SELECT TO authenticated
  USING (claimant_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "file ip report" ON public.ip_misuse_reports FOR INSERT TO authenticated
  WITH CHECK (claimant_id = auth.uid());
CREATE POLICY "staff update ip reports" ON public.ip_misuse_reports FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff read moderation" ON public.moderation_actions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write moderation" ON public.moderation_actions FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND actor_id = auth.uid());

CREATE POLICY "own appeals" ON public.appeals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "file appeal" ON public.appeals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff decide appeal" ON public.appeals FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "admins read audit" ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "evidence visible to project" ON public.evidence_events FOR SELECT TO authenticated
  USING (project_id IS NULL AND actor_id = auth.uid()
         OR public.can_edit_project(project_id, auth.uid())
         OR public.is_staff(auth.uid()));

-- ============ 13. REFERENCE DATA ============
INSERT INTO public.identities (slug, label, sort_order) VALUES
 ('innovator','Innovator',1),('founder','Founder',2),('entrepreneur','Entrepreneur',3),
 ('developer','Developer',4),('engineer','Engineer',5),('technician','Technician',6),
 ('artisan','Artisan',7),('researcher','Researcher',8),('academic','Academic',9),
 ('designer','Designer',10),('student_innovator','Student Innovator',11),('mentor','Mentor',12),
 ('investor','Investor',13),('incubator','Incubator or Accelerator',14),
 ('institution','University or TVET Institution',15),('corporate','Corporate Innovation Partner',16),
 ('government','Government or Development Organisation',17);

INSERT INTO public.sectors (slug, label) VALUES
 ('agritech','Agritech'),('healthtech','Health Technology'),('fintech','Fintech'),
 ('edtech','Education Technology'),('energy','Energy and Renewables'),('manufacturing','Manufacturing'),
 ('mobility','Mobility and Logistics'),('water','Water and Sanitation'),('construction','Construction'),
 ('creative','Creative Industries'),('software','Software and AI'),('hardware','Hardware and Robotics'),
 ('mining','Mining Technology'),('environment','Environment and Climate'),('socialimpact','Social Impact');

INSERT INTO public.skills (slug, label) VALUES
 ('software-engineering','Software Engineering'),('mechanical-engineering','Mechanical Engineering'),
 ('electrical-engineering','Electrical Engineering'),('industrial-design','Industrial Design'),
 ('ux-design','UX Design'),('data-science','Data Science'),('embedded-systems','Embedded Systems'),
 ('fabrication','Fabrication and Prototyping'),('research','Research Methodology'),
 ('business-development','Business Development'),('fundraising','Fundraising'),
 ('product-management','Product Management'),('marketing','Marketing'),('legal','Legal and IP');