export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          new_state: Json | null;
          previous_state: Json | null;
          reason: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          new_state?: Json | null;
          previous_state?: Json | null;
          reason?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          new_state?: Json | null;
          previous_state?: Json | null;
          reason?: string | null;
        };
        Relationships: [];
      };
      agreement_acceptances: {
        Row: {
          acceptance_method: string;
          accepted_at: string;
          agreement_version_id: string;
          id: string;
          superseded: boolean;
          user_id: string;
        };
        Insert: {
          acceptance_method?: string;
          accepted_at?: string;
          agreement_version_id: string;
          id?: string;
          superseded?: boolean;
          user_id: string;
        };
        Update: {
          acceptance_method?: string;
          accepted_at?: string;
          agreement_version_id?: string;
          id?: string;
          superseded?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agreement_acceptances_agreement_version_id_fkey";
            columns: ["agreement_version_id"];
            isOneToOne: false;
            referencedRelation: "agreement_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      agreement_versions: {
        Row: {
          agreement_key: string;
          body_markdown: string;
          id: string;
          is_current: boolean;
          published_at: string;
          requires_reacceptance: boolean;
          title: string;
          version: string;
        };
        Insert: {
          agreement_key: string;
          body_markdown: string;
          id?: string;
          is_current?: boolean;
          published_at?: string;
          requires_reacceptance?: boolean;
          title: string;
          version: string;
        };
        Update: {
          agreement_key?: string;
          body_markdown?: string;
          id?: string;
          is_current?: boolean;
          published_at?: string;
          requires_reacceptance?: boolean;
          title?: string;
          version?: string;
        };
        Relationships: [];
      };
      appeals: {
        Row: {
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          decision_notes: string | null;
          id: string;
          moderation_action_id: string | null;
          statement: string;
          status: Database["public"]["Enums"]["report_status"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_notes?: string | null;
          id?: string;
          moderation_action_id?: string | null;
          statement: string;
          status?: Database["public"]["Enums"]["report_status"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_notes?: string | null;
          id?: string;
          moderation_action_id?: string | null;
          statement?: string;
          status?: Database["public"]["Enums"]["report_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appeals_moderation_action_id_fkey";
            columns: ["moderation_action_id"];
            isOneToOne: false;
            referencedRelation: "moderation_actions";
            referencedColumns: ["id"];
          },
        ];
      };
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
          id: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
          id?: string;
        };
        Relationships: [];
      };
      collaboration_applications: {
        Row: {
          applicant_id: string;
          created_at: string;
          id: string;
          message: string | null;
          request_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          applicant_id: string;
          created_at?: string;
          id?: string;
          message?: string | null;
          request_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          applicant_id?: string;
          created_at?: string;
          id?: string;
          message?: string | null;
          request_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collaboration_applications_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "collaboration_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      collaboration_requests: {
        Row: {
          commitment: string | null;
          compensation_disclosure: string | null;
          created_at: string;
          created_by: string;
          deadline: string | null;
          description: string | null;
          id: string;
          is_remote: boolean;
          location: string | null;
          project_id: string;
          requirement: string;
          skills: string[];
          status: string;
          updated_at: string;
          visibility: Database["public"]["Enums"]["visibility_level"];
        };
        Insert: {
          commitment?: string | null;
          compensation_disclosure?: string | null;
          created_at?: string;
          created_by: string;
          deadline?: string | null;
          description?: string | null;
          id?: string;
          is_remote?: boolean;
          location?: string | null;
          project_id: string;
          requirement: string;
          skills?: string[];
          status?: string;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["visibility_level"];
        };
        Update: {
          commitment?: string | null;
          compensation_disclosure?: string | null;
          created_at?: string;
          created_by?: string;
          deadline?: string | null;
          description?: string | null;
          id?: string;
          is_remote?: boolean;
          location?: string | null;
          project_id?: string;
          requirement?: string;
          skills?: string[];
          status?: string;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["visibility_level"];
        };
        Relationships: [
          {
            foreignKeyName: "collaboration_requests_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          is_removed: boolean;
          parent_id: string | null;
          post_id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          is_removed?: boolean;
          parent_id?: string | null;
          post_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          is_removed?: boolean;
          parent_id?: string | null;
          post_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      content_reports: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          reporter_id: string;
          status: Database["public"]["Enums"]["report_status"];
          subject_id: string;
          subject_type: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          reporter_id: string;
          status?: Database["public"]["Enums"]["report_status"];
          subject_id: string;
          subject_type: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          reporter_id?: string;
          status?: Database["public"]["Enums"]["report_status"];
          subject_id?: string;
          subject_type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          last_read_at: string | null;
          user_id: string;
        };
        Insert: {
          conversation_id: string;
          last_read_at?: string | null;
          user_id: string;
        };
        Update: {
          conversation_id?: string;
          last_read_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          subject: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          subject?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          subject?: string | null;
        };
        Relationships: [];
      };
      evidence_events: {
        Row: {
          actor_id: string | null;
          content_type: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          event_type: string;
          file_hash: string | null;
          id: string;
          metadata: Json;
          original_filename: string | null;
          project_id: string | null;
          size_bytes: number | null;
          storage_path: string | null;
          version: number | null;
        };
        Insert: {
          actor_id?: string | null;
          content_type?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          event_type: string;
          file_hash?: string | null;
          id?: string;
          metadata?: Json;
          original_filename?: string | null;
          project_id?: string | null;
          size_bytes?: number | null;
          storage_path?: string | null;
          version?: number | null;
        };
        Update: {
          actor_id?: string | null;
          content_type?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          event_type?: string;
          file_hash?: string | null;
          id?: string;
          metadata?: Json;
          original_filename?: string | null;
          project_id?: string | null;
          size_bytes?: number | null;
          storage_path?: string | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "evidence_events_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      expert_session_registrations: {
        Row: {
          decided_at: string | null;
          decided_by: string | null;
          motivation: string | null;
          registered_at: string;
          session_id: string;
          status: Database["public"]["Enums"]["registration_status"];
          user_id: string;
        };
        Insert: {
          decided_at?: string | null;
          decided_by?: string | null;
          motivation?: string | null;
          registered_at?: string;
          session_id: string;
          status?: Database["public"]["Enums"]["registration_status"];
          user_id: string;
        };
        Update: {
          decided_at?: string | null;
          decided_by?: string | null;
          motivation?: string | null;
          registered_at?: string;
          session_id?: string;
          status?: Database["public"]["Enums"]["registration_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expert_session_registrations_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "expert_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      expert_sessions: {
        Row: {
          capacity: number | null;
          created_at: string;
          ends_at: string;
          external_meeting_url: string | null;
          host_id: string;
          id: string;
          organization_id: string | null;
          sector: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["session_status"];
          summary: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          capacity?: number | null;
          created_at?: string;
          ends_at: string;
          external_meeting_url?: string | null;
          host_id: string;
          id?: string;
          organization_id?: string | null;
          sector?: string | null;
          starts_at: string;
          status?: Database["public"]["Enums"]["session_status"];
          summary: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          capacity?: number | null;
          created_at?: string;
          ends_at?: string;
          external_meeting_url?: string | null;
          host_id?: string;
          id?: string;
          organization_id?: string | null;
          sector?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["session_status"];
          summary?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expert_sessions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      follows: {
        Row: {
          created_at: string;
          followee_id: string | null;
          follower_id: string;
          id: string;
          project_id: string | null;
        };
        Insert: {
          created_at?: string;
          followee_id?: string | null;
          follower_id: string;
          id?: string;
          project_id?: string | null;
        };
        Update: {
          created_at?: string;
          followee_id?: string | null;
          follower_id?: string;
          id?: string;
          project_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "follows_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      hashtags: {
        Row: {
          id: string;
          tag: string;
        };
        Insert: {
          id?: string;
          tag: string;
        };
        Update: {
          id?: string;
          tag?: string;
        };
        Relationships: [];
      };
      identities: {
        Row: {
          id: string;
          label: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          label: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          label?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      ip_misuse_reports: {
        Row: {
          claimant_id: string;
          created_at: string;
          description: string;
          disputed_subject_id: string | null;
          disputed_subject_type: string;
          evidence_urls: string[];
          good_faith_declaration: boolean;
          id: string;
          original_dates: string | null;
          original_project_id: string | null;
          registration_information: string | null;
          requested_outcome: string | null;
          respondent_responded_at: string | null;
          respondent_response: string | null;
          status: Database["public"]["Enums"]["report_status"];
          updated_at: string;
        };
        Insert: {
          claimant_id: string;
          created_at?: string;
          description: string;
          disputed_subject_id?: string | null;
          disputed_subject_type: string;
          evidence_urls?: string[];
          good_faith_declaration?: boolean;
          id?: string;
          original_dates?: string | null;
          original_project_id?: string | null;
          registration_information?: string | null;
          requested_outcome?: string | null;
          respondent_responded_at?: string | null;
          respondent_response?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
        };
        Update: {
          claimant_id?: string;
          created_at?: string;
          description?: string;
          disputed_subject_id?: string | null;
          disputed_subject_type?: string;
          evidence_urls?: string[];
          good_faith_declaration?: boolean;
          id?: string;
          original_dates?: string | null;
          original_project_id?: string | null;
          registration_information?: string | null;
          requested_outcome?: string | null;
          respondent_responded_at?: string | null;
          respondent_response?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ip_misuse_reports_original_project_id_fkey";
            columns: ["original_project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          sender_id: string;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          sender_id: string;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      moderation_actions: {
        Row: {
          action: string;
          actor_id: string;
          created_at: string;
          id: string;
          new_state: Json | null;
          previous_state: Json | null;
          reason: string;
          requires_human_review: boolean;
          subject_id: string;
          subject_type: string;
        };
        Insert: {
          action: string;
          actor_id: string;
          created_at?: string;
          id?: string;
          new_state?: Json | null;
          previous_state?: Json | null;
          reason: string;
          requires_human_review?: boolean;
          subject_id: string;
          subject_type: string;
        };
        Update: {
          action?: string;
          actor_id?: string;
          created_at?: string;
          id?: string;
          new_state?: Json | null;
          previous_state?: Json | null;
          reason?: string;
          requires_human_review?: boolean;
          subject_id?: string;
          subject_type?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          kind: string;
          link_path: string | null;
          read_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          link_path?: string | null;
          read_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          link_path?: string | null;
          read_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          joined_at: string;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_member_role"];
          user_id: string;
        };
        Insert: {
          joined_at?: string;
          organization_id: string;
          role?: Database["public"]["Enums"]["organization_member_role"];
          user_id: string;
        };
        Update: {
          joined_at?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["organization_member_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          city: string | null;
          country: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          is_verified: boolean;
          logo_path: string | null;
          name: string;
          organization_type: string;
          slug: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          is_verified?: boolean;
          logo_path?: string | null;
          name: string;
          organization_type: string;
          slug: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_verified?: boolean;
          logo_path?: string | null;
          name?: string;
          organization_type?: string;
          slug?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      post_hashtags: {
        Row: {
          hashtag_id: string;
          post_id: string;
        };
        Insert: {
          hashtag_id: string;
          post_id: string;
        };
        Update: {
          hashtag_id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey";
            columns: ["hashtag_id"];
            isOneToOne: false;
            referencedRelation: "hashtags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_media: {
        Row: {
          created_at: string;
          duration_seconds: number | null;
          id: string;
          media_type: string;
          position: number;
          post_id: string;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds?: number | null;
          id?: string;
          media_type: string;
          position?: number;
          post_id: string;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number | null;
          id?: string;
          media_type?: string;
          position?: number;
          post_id?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          author_id: string;
          caption: string | null;
          created_at: string;
          id: string;
          is_removed: boolean;
          post_type: Database["public"]["Enums"]["post_type"];
          project_id: string | null;
          purpose: string | null;
          reduced_distribution: boolean;
          requested_help: string | null;
          sector_id: string | null;
          updated_at: string;
          visibility: Database["public"]["Enums"]["visibility_level"];
        };
        Insert: {
          author_id: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          is_removed?: boolean;
          post_type?: Database["public"]["Enums"]["post_type"];
          project_id?: string | null;
          purpose?: string | null;
          reduced_distribution?: boolean;
          requested_help?: string | null;
          sector_id?: string | null;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["visibility_level"];
        };
        Update: {
          author_id?: string;
          caption?: string | null;
          created_at?: string;
          id?: string;
          is_removed?: boolean;
          post_type?: Database["public"]["Enums"]["post_type"];
          project_id?: string | null;
          purpose?: string | null;
          reduced_distribution?: boolean;
          requested_help?: string | null;
          sector_id?: string | null;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["visibility_level"];
        };
        Relationships: [
          {
            foreignKeyName: "posts_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
        ];
      };
      private_profile_data: {
        Row: {
          address: string | null;
          contact_email: string | null;
          created_at: string;
          date_of_birth: string | null;
          id: string;
          legal_name: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          contact_email?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          id: string;
          legal_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          contact_email?: string | null;
          created_at?: string;
          date_of_birth?: string | null;
          id?: string;
          legal_name?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "private_profile_data_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_identities: {
        Row: {
          identity_id: string;
          profile_id: string;
        };
        Insert: {
          identity_id: string;
          profile_id: string;
        };
        Update: {
          identity_id?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_identities_identity_id_fkey";
            columns: ["identity_id"];
            isOneToOne: false;
            referencedRelation: "identities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_identities_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_sectors: {
        Row: {
          profile_id: string;
          sector_id: string;
        };
        Insert: {
          profile_id: string;
          sector_id: string;
        };
        Update: {
          profile_id?: string;
          sector_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_sectors_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_sectors_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_skills: {
        Row: {
          profile_id: string;
          skill_id: string;
        };
        Insert: {
          profile_id: string;
          skill_id: string;
        };
        Update: {
          profile_id?: string;
          skill_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          country: string | null;
          cover_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          institution: string | null;
          investor_preferences: Json;
          is_verified: boolean;
          onboarding_completed_at: string | null;
          open_to_collaboration: boolean;
          open_to_mentorship: boolean;
          portfolio_url: string | null;
          profile_visibility: Database["public"]["Enums"]["visibility_level"];
          province: string | null;
          under_35_optin: boolean;
          updated_at: string;
          username: string;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          country?: string | null;
          cover_url?: string | null;
          created_at?: string;
          display_name?: string;
          id: string;
          institution?: string | null;
          investor_preferences?: Json;
          is_verified?: boolean;
          onboarding_completed_at?: string | null;
          open_to_collaboration?: boolean;
          open_to_mentorship?: boolean;
          portfolio_url?: string | null;
          profile_visibility?: Database["public"]["Enums"]["visibility_level"];
          province?: string | null;
          under_35_optin?: boolean;
          updated_at?: string;
          username: string;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          country?: string | null;
          cover_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          institution?: string | null;
          investor_preferences?: Json;
          is_verified?: boolean;
          onboarding_completed_at?: string | null;
          open_to_collaboration?: boolean;
          open_to_mentorship?: boolean;
          portfolio_url?: string | null;
          profile_visibility?: Database["public"]["Enums"]["visibility_level"];
          province?: string | null;
          under_35_optin?: boolean;
          updated_at?: string;
          username?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      project_media: {
        Row: {
          caption: string | null;
          created_at: string;
          file_hash: string | null;
          file_size: number | null;
          id: string;
          media_type: string;
          project_id: string;
          storage_path: string;
          uploaded_by: string;
          visibility: Database["public"]["Enums"]["visibility_level"];
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          file_hash?: string | null;
          file_size?: number | null;
          id?: string;
          media_type: string;
          project_id: string;
          storage_path: string;
          uploaded_by: string;
          visibility?: Database["public"]["Enums"]["visibility_level"];
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          file_hash?: string | null;
          file_size?: number | null;
          id?: string;
          media_type?: string;
          project_id?: string;
          storage_path?: string;
          uploaded_by?: string;
          visibility?: Database["public"]["Enums"]["visibility_level"];
        };
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_members: {
        Row: {
          can_edit: boolean;
          contribution_summary: string | null;
          created_at: string;
          id: string;
          project_id: string;
          role_title: string | null;
          user_id: string;
        };
        Insert: {
          can_edit?: boolean;
          contribution_summary?: string | null;
          created_at?: string;
          id?: string;
          project_id: string;
          role_title?: string | null;
          user_id: string;
        };
        Update: {
          can_edit?: boolean;
          contribution_summary?: string | null;
          created_at?: string;
          id?: string;
          project_id?: string;
          role_title?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_milestones: {
        Row: {
          contributor_ids: string[];
          created_at: string;
          created_by: string;
          description: string | null;
          file_urls: string[];
          id: string;
          media_urls: string[];
          milestone_date: string | null;
          project_id: string;
          stage: Database["public"]["Enums"]["project_stage"] | null;
          title: string;
          updated_at: string;
          version: number;
          visibility: Database["public"]["Enums"]["visibility_level"];
        };
        Insert: {
          contributor_ids?: string[];
          created_at?: string;
          created_by: string;
          description?: string | null;
          file_urls?: string[];
          id?: string;
          media_urls?: string[];
          milestone_date?: string | null;
          project_id: string;
          stage?: Database["public"]["Enums"]["project_stage"] | null;
          title: string;
          updated_at?: string;
          version?: number;
          visibility?: Database["public"]["Enums"]["visibility_level"];
        };
        Update: {
          contributor_ids?: string[];
          created_at?: string;
          created_by?: string;
          description?: string | null;
          file_urls?: string[];
          id?: string;
          media_urls?: string[];
          milestone_date?: string | null;
          project_id?: string;
          stage?: Database["public"]["Enums"]["project_stage"] | null;
          title?: string;
          updated_at?: string;
          version?: number;
          visibility?: Database["public"]["Enums"]["visibility_level"];
        };
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          city: string | null;
          country: string | null;
          cover_url: string | null;
          created_at: string;
          demo_url: string | null;
          funding_amount: number | null;
          funding_status: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string;
          ownership_declaration: string | null;
          pitch: string | null;
          problem: string | null;
          province: string | null;
          repository_url: string | null;
          required_skills: string[];
          research_url: string | null;
          sector_id: string | null;
          seeking_collaborators: boolean;
          seeking_funding: boolean;
          slug: string;
          solution: string | null;
          stage: Database["public"]["Enums"]["project_stage"];
          target_audience: string | null;
          technologies: string[];
          updated_at: string;
          visibility: Database["public"]["Enums"]["visibility_level"];
          website_url: string | null;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          cover_url?: string | null;
          created_at?: string;
          demo_url?: string | null;
          funding_amount?: number | null;
          funding_status?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          ownership_declaration?: string | null;
          pitch?: string | null;
          problem?: string | null;
          province?: string | null;
          repository_url?: string | null;
          required_skills?: string[];
          research_url?: string | null;
          sector_id?: string | null;
          seeking_collaborators?: boolean;
          seeking_funding?: boolean;
          slug: string;
          solution?: string | null;
          stage?: Database["public"]["Enums"]["project_stage"];
          target_audience?: string | null;
          technologies?: string[];
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["visibility_level"];
          website_url?: string | null;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          cover_url?: string | null;
          created_at?: string;
          demo_url?: string | null;
          funding_amount?: number | null;
          funding_status?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          ownership_declaration?: string | null;
          pitch?: string | null;
          problem?: string | null;
          province?: string | null;
          repository_url?: string | null;
          required_skills?: string[];
          research_url?: string | null;
          sector_id?: string | null;
          seeking_collaborators?: boolean;
          seeking_funding?: boolean;
          slug?: string;
          solution?: string | null;
          stage?: Database["public"]["Enums"]["project_stage"];
          target_audience?: string | null;
          technologies?: string[];
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["visibility_level"];
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_sector_id_fkey";
            columns: ["sector_id"];
            isOneToOne: false;
            referencedRelation: "sectors";
            referencedColumns: ["id"];
          },
        ];
      };
      protected_access_requests: {
        Row: {
          confidentiality_accepted: boolean;
          confidentiality_accepted_at: string | null;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          expires_at: string | null;
          id: string;
          project_id: string;
          reason: string | null;
          requester_id: string;
          revocation_reason: string | null;
          revoked_at: string | null;
          status: Database["public"]["Enums"]["access_request_status"];
          terms_version: string;
          updated_at: string;
        };
        Insert: {
          confidentiality_accepted?: boolean;
          confidentiality_accepted_at?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          expires_at?: string | null;
          id?: string;
          project_id: string;
          reason?: string | null;
          requester_id: string;
          revocation_reason?: string | null;
          revoked_at?: string | null;
          status?: Database["public"]["Enums"]["access_request_status"];
          terms_version?: string;
          updated_at?: string;
        };
        Update: {
          confidentiality_accepted?: boolean;
          confidentiality_accepted_at?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          expires_at?: string | null;
          id?: string;
          project_id?: string;
          reason?: string | null;
          requester_id?: string;
          revocation_reason?: string | null;
          revoked_at?: string | null;
          status?: Database["public"]["Enums"]["access_request_status"];
          terms_version?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "protected_access_requests_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      reactions: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          reaction: Database["public"]["Enums"]["reaction_type"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          reaction: Database["public"]["Enums"]["reaction_type"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          reaction?: Database["public"]["Enums"]["reaction_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      saves: {
        Row: {
          created_at: string;
          id: string;
          post_id: string | null;
          project_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id?: string | null;
          project_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string | null;
          project_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saves_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saves_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      sectors: {
        Row: {
          id: string;
          is_approved: boolean;
          label: string;
          slug: string;
        };
        Insert: {
          id?: string;
          is_approved?: boolean;
          label: string;
          slug: string;
        };
        Update: {
          id?: string;
          is_approved?: boolean;
          label?: string;
          slug?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          is_approved: boolean;
          label: string;
          slug: string;
        };
        Insert: {
          id?: string;
          is_approved?: boolean;
          label: string;
          slug: string;
        };
        Update: {
          id?: string;
          is_approved?: boolean;
          label?: string;
          slug?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          granted_by: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          consent_confirmed: boolean;
          created_at: string;
          decision_reason: string | null;
          document_paths: string[];
          id: string;
          kind: Database["public"]["Enums"]["verification_kind"];
          organization_id: string | null;
          requester_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          statement: string;
          status: Database["public"]["Enums"]["verification_status"];
          updated_at: string;
        };
        Insert: {
          consent_confirmed?: boolean;
          created_at?: string;
          decision_reason?: string | null;
          document_paths?: string[];
          id?: string;
          kind: Database["public"]["Enums"]["verification_kind"];
          organization_id?: string | null;
          requester_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          statement: string;
          status?: Database["public"]["Enums"]["verification_status"];
          updated_at?: string;
        };
        Update: {
          consent_confirmed?: boolean;
          created_at?: string;
          decision_reason?: string | null;
          document_paths?: string[];
          id?: string;
          kind?: Database["public"]["Enums"]["verification_kind"];
          organization_id?: string | null;
          requester_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          statement?: string;
          status?: Database["public"]["Enums"]["verification_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "verification_requests_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      access_request_status: "pending" | "approved" | "rejected" | "revoked";
      app_role:
        | "user"
        | "verified_user"
        | "verified_investor"
        | "verified_organisation"
        | "moderator"
        | "admin"
        | "super_admin";
      organization_member_role: "owner" | "admin" | "member";
      post_type:
        | "post"
        | "build_reel"
        | "project_update"
        | "research"
        | "collaboration_request"
        | "opportunity";
      project_stage:
        | "idea"
        | "research"
        | "concept"
        | "prototype"
        | "testing"
        | "pilot"
        | "early_market"
        | "growth"
        | "established";
      reaction_type:
        | "support"
        | "innovative"
        | "great_potential"
        | "i_can_help"
        | "lets_collaborate"
        | "interested_in_investing";
      registration_status: "pending" | "approved" | "rejected" | "cancelled" | "attended";
      report_status:
        | "open"
        | "triaged"
        | "restricted"
        | "responded"
        | "under_review"
        | "resolved"
        | "dismissed"
        | "referred";
      session_status: "draft" | "published" | "cancelled" | "completed";
      verification_kind: "identity" | "investor" | "organization";
      verification_status: "pending" | "in_review" | "approved" | "rejected" | "withdrawn";
      visibility_level: "public" | "community" | "protected" | "private";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      access_request_status: ["pending", "approved", "rejected", "revoked"],
      app_role: [
        "user",
        "verified_user",
        "verified_investor",
        "verified_organisation",
        "moderator",
        "admin",
        "super_admin",
      ],
      organization_member_role: ["owner", "admin", "member"],
      post_type: [
        "post",
        "build_reel",
        "project_update",
        "research",
        "collaboration_request",
        "opportunity",
      ],
      project_stage: [
        "idea",
        "research",
        "concept",
        "prototype",
        "testing",
        "pilot",
        "early_market",
        "growth",
        "established",
      ],
      reaction_type: [
        "support",
        "innovative",
        "great_potential",
        "i_can_help",
        "lets_collaborate",
        "interested_in_investing",
      ],
      registration_status: ["pending", "approved", "rejected", "cancelled", "attended"],
      report_status: [
        "open",
        "triaged",
        "restricted",
        "responded",
        "under_review",
        "resolved",
        "dismissed",
        "referred",
      ],
      session_status: ["draft", "published", "cancelled", "completed"],
      verification_kind: ["identity", "investor", "organization"],
      verification_status: ["pending", "in_review", "approved", "rejected", "withdrawn"],
      visibility_level: ["public", "community", "protected", "private"],
    },
  },
} as const;
