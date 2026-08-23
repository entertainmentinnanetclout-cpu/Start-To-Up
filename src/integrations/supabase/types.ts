export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: string
          building_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          name: string | null
          title: string
        }
        Insert: {
          audience?: string
          building_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          name?: string | null
          title: string
        }
        Update: {
          audience?: string
          building_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          name?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string | null
          document_type: string
          file_path: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          application_id?: string | null
          document_type: string
          file_path: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          application_id?: string | null
          document_type?: string
          file_path?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string | null
          applicant_type: Database["public"]["Enums"]["applicant_type"]
          application_number: string | null
          building_id: string | null
          created_at: string
          document_url: string | null
          email: string | null
          first_name: string | null
          gender: string | null
          id: string
          id_number: string | null
          institution: string | null
          last_name: string | null
          notes: string | null
          nsfas_status: string | null
          personal_details: Json
          phone: string | null
          referral_code: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          room_preference: Json | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          applicant_id?: string | null
          applicant_type?: Database["public"]["Enums"]["applicant_type"]
          application_number?: string | null
          building_id?: string | null
          created_at?: string
          document_url?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          id_number?: string | null
          institution?: string | null
          last_name?: string | null
          notes?: string | null
          nsfas_status?: string | null
          personal_details?: Json
          phone?: string | null
          referral_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_preference?: Json | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          applicant_id?: string | null
          applicant_type?: Database["public"]["Enums"]["applicant_type"]
          application_number?: string | null
          building_id?: string | null
          created_at?: string
          document_url?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          id_number?: string | null
          institution?: string | null
          last_name?: string | null
          notes?: string | null
          nsfas_status?: string | null
          personal_details?: Json
          phone?: string | null
          referral_code?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_preference?: Json | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          bed_number: string
          created_at: string
          id: string
          occupant_id: string | null
          room_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bed_number: string
          created_at?: string
          id?: string
          occupant_id?: string | null
          room_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bed_number?: string
          created_at?: string
          id?: string
          occupant_id?: string | null
          room_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      building_configs: {
        Row: {
          base_rent: number
          beds_per_room: number
          building_id: string
          created_at: string
          default_capacity_per_room: number
          floors: number
          id: string
          layout: Json
          rooms_per_floor: number
          updated_at: string
        }
        Insert: {
          base_rent?: number
          beds_per_room?: number
          building_id: string
          created_at?: string
          default_capacity_per_room?: number
          floors?: number
          id?: string
          layout?: Json
          rooms_per_floor?: number
          updated_at?: string
        }
        Update: {
          base_rent?: number
          beds_per_room?: number
          building_id?: string
          created_at?: string
          default_capacity_per_room?: number
          floors?: number
          id?: string
          layout?: Json
          rooms_per_floor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_configs_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: true
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          brand_id: string | null
          city: string | null
          code: string | null
          created_at: string
          current_occupancy: number
          current_residents: number
          hero_image_url: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          total_capacity: number
          total_floors: number
          total_rooms: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          brand_id?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          current_occupancy?: number
          current_residents?: number
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          total_capacity?: number
          total_floors?: number
          total_rooms?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          brand_id?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          current_occupancy?: number
          current_residents?: number
          hero_image_url?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          total_capacity?: number
          total_floors?: number
          total_rooms?: number
          updated_at?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          assigned_to: string | null
          building_id: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          photos: string[] | null
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          building_id?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          photos?: string[] | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          building_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          photos?: string[] | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          building_id: string | null
          created_at: string
          file_url: string
          id: string
          is_public: boolean
          owner_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          file_url: string
          id?: string
          is_public?: boolean
          owner_id?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          file_url?: string
          id?: string
          is_public?: boolean
          owner_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_terms: {
        Row: {
          building_id: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          building_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          building_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "lease_terms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bed_id: string | null
          building_id: string | null
          created_at: string
          document_url: string | null
          end_date: string
          id: string
          lease_document_url: string | null
          monthly_rent: number
          rejected_at: string | null
          rejection_reason: string | null
          room_id: string | null
          signed_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["lease_status"]
          student_id: string | null
          terms_accepted: boolean
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bed_id?: string | null
          building_id?: string | null
          created_at?: string
          document_url?: string | null
          end_date: string
          id?: string
          lease_document_url?: string | null
          monthly_rent?: number
          rejected_at?: string | null
          rejection_reason?: string | null
          room_id?: string | null
          signed_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"]
          student_id?: string | null
          terms_accepted?: boolean
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bed_id?: string | null
          building_id?: string | null
          created_at?: string
          document_url?: string | null
          end_date?: string
          id?: string
          lease_document_url?: string | null
          monthly_rent?: number
          rejected_at?: string | null
          rejection_reason?: string | null
          room_id?: string | null
          signed_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"]
          student_id?: string | null
          terms_accepted?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          created_by: string | null
          description: string | null
          entry_date: string
          entry_type: string
          id: string
          reference: string | null
          rent_period: string | null
          status: string
          student_id: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          entry_type: string
          id?: string
          reference?: string | null
          rent_period?: string | null
          status?: string
          student_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          reference?: string | null
          rent_period?: string | null
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      matchmaker_settings: {
        Row: {
          building_id: string
          created_at: string
          enabled: boolean
          gender_separated: boolean
          id: string
          preferences: Json
          updated_at: string
        }
        Insert: {
          building_id: string
          created_at?: string
          enabled?: boolean
          gender_separated?: boolean
          id?: string
          preferences?: Json
          updated_at?: string
        }
        Update: {
          building_id?: string
          created_at?: string
          enabled?: boolean
          gender_separated?: boolean
          id?: string
          preferences?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchmaker_settings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: true
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_rent_tracking: {
        Row: {
          created_at: string
          expected_amount: number
          id: string
          last_payment_at: string | null
          paid_amount: number
          rent_period: string
          status: Database["public"]["Enums"]["rent_period_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expected_amount?: number
          id?: string
          last_payment_at?: string | null
          paid_amount?: number
          rent_period: string
          status?: Database["public"]["Enums"]["rent_period_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expected_amount?: number
          id?: string
          last_payment_at?: string | null
          paid_amount?: number
          rent_period?: string
          status?: Database["public"]["Enums"]["rent_period_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_rent_tracking_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          balance_after: number | null
          building_id: string | null
          collected_by: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_type: string
          reference: string | null
          reference_number: string | null
          rent_period: string | null
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          building_id?: string | null
          collected_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_type?: string
          reference?: string | null
          reference_number?: string | null
          rent_period?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          building_id?: string | null
          collected_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_type?: string
          reference?: string | null
          reference_number?: string | null
          rent_period?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          amount: number
          description: string | null
          id: string
          key: string
          label: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount?: number
          description?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          description?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          id_number: string | null
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          id_number?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          id_number?: string | null
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          applicant_type: Database["public"]["Enums"]["applicant_type"] | null
          application_id: string | null
          commission_amount: number
          created_at: string
          id: string
          marketer_id: string | null
          referral_code: string
          status: string
        }
        Insert: {
          applicant_type?: Database["public"]["Enums"]["applicant_type"] | null
          application_id?: string | null
          commission_amount?: number
          created_at?: string
          id?: string
          marketer_id?: string | null
          referral_code: string
          status?: string
        }
        Update: {
          applicant_type?: Database["public"]["Enums"]["applicant_type"] | null
          application_id?: string | null
          commission_amount?: number
          created_at?: string
          id?: string
          marketer_id?: string | null
          referral_code?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_rules: {
        Row: {
          building_id: string | null
          created_at: string
          funding_type: string
          id: string
          is_active: boolean
          monthly_rent: number
          updated_at: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          funding_type: string
          id?: string
          is_active?: boolean
          monthly_rent?: number
          updated_at?: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          funding_type?: string
          id?: string
          is_active?: boolean
          monthly_rent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rent_rules_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      roommate_matches: {
        Row: {
          building_id: string | null
          created_at: string
          id: string
          status: string
          user_a: string
          user_b: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          id?: string
          status?: string
          user_a: string
          user_b: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          id?: string
          status?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "roommate_matches_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      roommate_profiles: {
        Row: {
          bio: string | null
          building_id: string | null
          created_at: string
          id: string
          is_active: boolean
          photo_url: string | null
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          building_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          building_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          photo_url?: string | null
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roommate_profiles_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      roommate_swipes: {
        Row: {
          building_id: string | null
          created_at: string
          id: string
          liked: boolean
          swiper_id: string
          target_id: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          id?: string
          liked: boolean
          swiper_id: string
          target_id: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          id?: string
          liked?: boolean
          swiper_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roommate_swipes_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          block: string | null
          building_id: string
          capacity: number | null
          created_at: string
          description: string | null
          floor: string | null
          gender_restriction: string | null
          id: string
          is_available: boolean
          monthly_rent: number | null
          occupied: number
          occupied_beds: number
          photo_url: string | null
          room_number: string
          room_type: string
          status: string
          total_beds: number
          updated_at: string
        }
        Insert: {
          block?: string | null
          building_id: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          floor?: string | null
          gender_restriction?: string | null
          id?: string
          is_available?: boolean
          monthly_rent?: number | null
          occupied?: number
          occupied_beds?: number
          photo_url?: string | null
          room_number: string
          room_type?: string
          status?: string
          total_beds?: number
          updated_at?: string
        }
        Update: {
          block?: string | null
          building_id?: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          floor?: string | null
          gender_restriction?: string | null
          id?: string
          is_available?: boolean
          monthly_rent?: number | null
          occupied?: number
          occupied_beds?: number
          photo_url?: string | null
          room_number?: string
          room_type?: string
          status?: string
          total_beds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      student_reservations: {
        Row: {
          applicant_name: string
          bed_id: string | null
          building_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          reserved_until: string | null
          room_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_name: string
          bed_id?: string | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          reserved_until?: string | null
          room_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_name?: string
          bed_id?: string | null
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          reserved_until?: string | null
          room_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_reservations_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_reservations_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          applicant_type: Database["public"]["Enums"]["applicant_type"]
          balance: number
          bed_id: string | null
          building_id: string | null
          check_in_date: string | null
          check_out_date: string | null
          created_at: string
          custom_rent: number | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          funding_type: string | null
          gender: string | null
          id: string
          id_number: string | null
          institution: string | null
          is_active: boolean
          last_name: string
          move_in_date: string | null
          move_out_date: string | null
          notes: string | null
          nsfas_reference: string | null
          phone: string | null
          profile_id: string | null
          profile_image_url: string | null
          room_id: string | null
          status: string
          student_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          applicant_type?: Database["public"]["Enums"]["applicant_type"]
          balance?: number
          bed_id?: string | null
          building_id?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string
          custom_rent?: number | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          funding_type?: string | null
          gender?: string | null
          id?: string
          id_number?: string | null
          institution?: string | null
          is_active?: boolean
          last_name: string
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          nsfas_reference?: string | null
          phone?: string | null
          profile_id?: string | null
          profile_image_url?: string | null
          room_id?: string | null
          status?: string
          student_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          applicant_type?: Database["public"]["Enums"]["applicant_type"]
          balance?: number
          bed_id?: string | null
          building_id?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string
          custom_rent?: number | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          funding_type?: string | null
          gender?: string | null
          id?: string
          id_number?: string | null
          institution?: string | null
          is_active?: boolean
          last_name?: string
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          nsfas_reference?: string | null
          phone?: string | null
          profile_id?: string | null
          profile_image_url?: string | null
          room_id?: string | null
          status?: string
          student_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      system_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          building_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      viewing_requests: {
        Row: {
          applicant_name: string
          building_id: string | null
          comments: string | null
          created_at: string
          email: string | null
          id: string
          institution: string | null
          phone: string
          preferred_date: string | null
          preferred_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_name: string
          building_id?: string | null
          comments?: string | null
          created_at?: string
          email?: string | null
          id?: string
          institution?: string | null
          phone: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_name?: string
          building_id?: string | null
          comments?: string | null
          created_at?: string
          email?: string | null
          id?: string
          institution?: string | null
          phone?: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewing_requests_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "office_admin"
        | "building_admin"
        | "marketer"
        | "security"
        | "transport"
        | "student"
        | "tenant"
        | "developer"
      applicant_type:
        | "nsfas"
        | "self_pay_furnished"
        | "self_pay_unfurnished"
        | "private_tenant"
      application_status:
        | "draft"
        | "submitted"
        | "reviewing"
        | "approved"
        | "declined"
        | "moved_in"
        | "cancelled"
        | "pending"
        | "under_review"
      complaint_status:
        | "open"
        | "in_progress"
        | "resolved"
        | "closed"
        | "escalated"
        | "fixed"
        | "overdue"
        | "pending_parts"
      lease_status:
        | "draft"
        | "active"
        | "expired"
        | "terminated"
        | "pending_signature"
        | "signed"
        | "pending"
        | "sent"
        | "approved"
        | "rejected"
      payment_status:
        | "pending"
        | "confirmed"
        | "failed"
        | "refunded"
        | "partial"
      rent_period_status:
        | "pending"
        | "partial"
        | "paid"
        | "overpaid"
        | "overdue"
        | "waived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "office_admin",
        "building_admin",
        "marketer",
        "security",
        "transport",
        "student",
        "tenant",
        "developer",
      ],
      applicant_type: [
        "nsfas",
        "self_pay_furnished",
        "self_pay_unfurnished",
        "private_tenant",
      ],
      application_status: [
        "draft",
        "submitted",
        "reviewing",
        "approved",
        "declined",
        "moved_in",
        "cancelled",
        "pending",
        "under_review",
      ],
      complaint_status: [
        "open",
        "in_progress",
        "resolved",
        "closed",
        "escalated",
        "fixed",
        "overdue",
        "pending_parts",
      ],
      lease_status: [
        "draft",
        "active",
        "expired",
        "terminated",
        "pending_signature",
        "signed",
        "pending",
        "sent",
        "approved",
        "rejected",
      ],
      payment_status: ["pending", "confirmed", "failed", "refunded", "partial"],
      rent_period_status: [
        "pending",
        "partial",
        "paid",
        "overpaid",
        "overdue",
        "waived",
      ],
    },
  },
} as const
