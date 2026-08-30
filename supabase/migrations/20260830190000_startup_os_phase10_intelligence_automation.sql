-- Start To Up — Startup OS Phase 10: Intelligence, Automation & Safe Assistance.
-- Suggestions are auditable/reversible; structured records are never silently overwritten.

create table if not exists public.intelligence_threads (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 title text not null default 'New workspace', mode text not null default 'general' check (mode in ('general','business_plan','seo','proposal','pitch','translation','workflow')),
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.intelligence_messages (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 thread_id uuid not null references public.intelligence_threads(id) on delete cascade, role text not null check(role in ('user','assistant','system')),
 content text not null, evidence jsonb not null default '[]'::jsonb, provider text, model text, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.intelligence_runs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 thread_id uuid references public.intelligence_threads(id) on delete set null, mode text not null, input_summary text, provider text, model text,
 status text not null default 'queued' check(status in ('queued','running','completed','failed','cancelled')), token_usage jsonb not null default '{}'::jsonb,
 safety_flags jsonb not null default '[]'::jsonb, started_at timestamptz, completed_at timestamptz, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table if not exists public.intelligence_change_sets (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 run_id uuid references public.intelligence_runs(id) on delete set null, title text not null, target_type text not null, target_id uuid,
 proposed_changes jsonb not null default '{}'::jsonb, previous_values jsonb not null default '{}'::jsonb,
 status text not null default 'proposed' check(status in ('proposed','approved','applied','rejected','reverted','expired')),
 created_by uuid references auth.users(id) on delete set null, approved_by uuid references auth.users(id) on delete set null, applied_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), approved_at timestamptz, applied_at timestamptz, reverted_at timestamptz
);
create table if not exists public.intelligence_next_actions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 source_module text not null, action_type text not null, title text not null, rationale text, priority integer not null default 50 check(priority between 0 and 100),
 target_path text not null, source_record_id uuid, evidence jsonb not null default '{}'::jsonb,
 status text not null default 'suggested' check(status in ('suggested','accepted','in_progress','done','dismissed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.intelligence_automation_rules (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null, trigger_type text not null check(trigger_type in ('schedule','record_change','deadline','threshold','manual')),
 trigger_config jsonb not null default '{}'::jsonb, action_type text not null check(action_type in ('create_task','create_next_action','send_notification','draft_content','webhook')),
 action_config jsonb not null default '{}'::jsonb, requires_approval boolean not null default true, is_enabled boolean not null default false,
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.intelligence_automation_runs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 rule_id uuid not null references public.intelligence_automation_rules(id) on delete cascade, status text not null default 'queued' check(status in ('queued','running','awaiting_approval','completed','failed','cancelled')),
 trigger_payload jsonb not null default '{}'::jsonb, result jsonb not null default '{}'::jsonb, error_code text,
 started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.intelligence_prompt_templates (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null, mode text not null, instructions text not null, output_schema jsonb not null default '{}'::jsonb, is_active boolean not null default true,
 version integer not null default 1, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.intelligence_localisation_jobs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 source_locale text not null, target_locale text not null, source_text text not null, translated_text text,
 status text not null default 'draft' check(status in ('draft','queued','completed','reviewed','applied','rejected')),
 provider text, created_by uuid references auth.users(id) on delete set null, reviewed_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.intelligence_audit_log (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null, event_type text not null, entity_type text, entity_id uuid, detail jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index if not exists intelligence_threads_org_idx on public.intelligence_threads(organization_id,updated_at desc);
create index if not exists intelligence_actions_org_idx on public.intelligence_next_actions(organization_id,status,priority desc);
create index if not exists intelligence_rules_org_idx on public.intelligence_automation_rules(organization_id,is_enabled,updated_at desc);
create index if not exists intelligence_audit_org_idx on public.intelligence_audit_log(organization_id,created_at desc);

create or replace function public.intelligence_next_best_actions(org_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare actions jsonb:='[]'::jsonb; open_pipeline integer:=0; active_campaigns integer:=0; critical_risks integer:=0; overdue_compliance integer:=0; readiness numeric:=0; saved_opps integer:=0;
begin
 if not private.startup_workspace_member(org_id,(select auth.uid())) then raise exception 'workspace access required'; end if;
 select count(*) into open_pipeline from public.revenue_opportunities where organization_id=org_id and status='open';
 select count(*) into active_campaigns from public.growth_campaigns where organization_id=org_id and status='active';
 select count(*) into critical_risks from public.ops_risks where organization_id=org_id and status in ('open','monitoring') and risk_score>=15;
 select count(*) into overdue_compliance from public.legal_obligations where organization_id=org_id and status not in ('complete','not_applicable') and due_date is not null and due_date<current_date;
 select coalesce((select overall_score from public.funding_readiness_snapshots where organization_id=org_id order by created_at desc limit 1),0) into readiness;
 select count(*) into saved_opps from public.ecosystem_saved_opportunities where organization_id=org_id and status in ('saved','reviewing','applying');
 if overdue_compliance>0 then actions:=actions||jsonb_build_array(jsonb_build_object('module','compliance','priority',95,'title','Resolve overdue compliance obligations','path','/app/compliance','evidence',jsonb_build_object('count',overdue_compliance))); end if;
 if critical_risks>0 then actions:=actions||jsonb_build_array(jsonb_build_object('module','operations','priority',90,'title','Mitigate critical operating risks','path','/app/operations','evidence',jsonb_build_object('count',critical_risks))); end if;
 if open_pipeline=0 then actions:=actions||jsonb_build_array(jsonb_build_object('module','revenue','priority',80,'title','Build your sales pipeline','path','/app/revenue','evidence',jsonb_build_object('open_opportunities',open_pipeline))); end if;
 if active_campaigns=0 then actions:=actions||jsonb_build_array(jsonb_build_object('module','growth','priority',65,'title','Launch a measurable growth campaign','path','/app/growth','evidence',jsonb_build_object('active_campaigns',active_campaigns))); end if;
 if readiness<70 then actions:=actions||jsonb_build_array(jsonb_build_object('module','funding','priority',60,'title','Close investor-readiness gaps','path','/app/funding','evidence',jsonb_build_object('readiness_score',readiness))); end if;
 if saved_opps>0 then actions:=actions||jsonb_build_array(jsonb_build_object('module','ecosystem','priority',55,'title','Progress saved ecosystem opportunities','path','/app/opportunities','evidence',jsonb_build_object('saved_opportunities',saved_opps))); end if;
 return actions;
end $$;
grant execute on function public.intelligence_next_best_actions(uuid) to authenticated;

create or replace function public.intelligence_approve_change_set(change_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare org_id uuid;
begin select organization_id into org_id from public.intelligence_change_sets where id=change_id;
 if org_id is null or not private.workspace_has_permission(org_id,(select auth.uid()),'company.manage') then raise exception 'manage permission required'; end if;
 update public.intelligence_change_sets set status='approved',approved_by=(select auth.uid()),approved_at=now() where id=change_id and status='proposed';
 insert into public.intelligence_audit_log(organization_id,actor_id,event_type,entity_type,entity_id) values(org_id,(select auth.uid()),'change_set_approved','intelligence_change_set',change_id);
 return found; end $$;
grant execute on function public.intelligence_approve_change_set(uuid) to authenticated;

do $$ declare t text; begin foreach t in array array['intelligence_threads','intelligence_messages','intelligence_runs','intelligence_change_sets','intelligence_next_actions','intelligence_automation_rules','intelligence_automation_runs','intelligence_prompt_templates','intelligence_localisation_jobs','intelligence_audit_log'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy %I on public.%I for select to authenticated using (private.startup_workspace_member(organization_id,(select auth.uid())))',t||'_workspace_select',t);
 execute format('create policy %I on public.%I for all to authenticated using (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage'')) with check (private.workspace_has_permission(organization_id,(select auth.uid()),''company.manage''))',t||'_workspace_manage',t);
end loop; end $$;
