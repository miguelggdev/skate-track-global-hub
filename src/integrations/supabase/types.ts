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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      athlete_body_info: {
        Row: {
          allergies: string | null
          athlete_id: string
          blood_type: string | null
          created_at: string
          height: number | null
          id: string
          injuries: string | null
          limitations: string | null
          size: string | null
          surgeries: string | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          allergies?: string | null
          athlete_id: string
          blood_type?: string | null
          created_at?: string
          height?: number | null
          id?: string
          injuries?: string | null
          limitations?: string | null
          size?: string | null
          surgeries?: string | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          allergies?: string | null
          athlete_id?: string
          blood_type?: string | null
          created_at?: string
          height?: number | null
          id?: string
          injuries?: string | null
          limitations?: string | null
          size?: string | null
          surgeries?: string | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_body_info_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_equipment: {
        Row: {
          athlete_id: string
          boot_brand: string | null
          boot_size: number | null
          created_at: string
          frame_brand: string | null
          frame_size: string | null
          helmet_brand: string | null
          id: string
          track_wheels_brand: string | null
          updated_at: string
          wheel_diameter: number | null
        }
        Insert: {
          athlete_id: string
          boot_brand?: string | null
          boot_size?: number | null
          created_at?: string
          frame_brand?: string | null
          frame_size?: string | null
          helmet_brand?: string | null
          id?: string
          track_wheels_brand?: string | null
          updated_at?: string
          wheel_diameter?: number | null
        }
        Update: {
          athlete_id?: string
          boot_brand?: string | null
          boot_size?: number | null
          created_at?: string
          frame_brand?: string | null
          frame_size?: string | null
          helmet_brand?: string | null
          id?: string
          track_wheels_brand?: string | null
          updated_at?: string
          wheel_diameter?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_equipment_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_family: {
        Row: {
          athlete_id: string
          created_at: string
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          id: string
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_family_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_history: {
        Row: {
          athlete_id: string
          created_at: string
          federation_date: string | null
          id: string
          is_federated: boolean | null
          is_league: boolean | null
          league_date: string | null
          previous_club: string | null
          start_date: string | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          athlete_id: string
          created_at?: string
          federation_date?: string | null
          id?: string
          is_federated?: boolean | null
          is_league?: boolean | null
          league_date?: string | null
          previous_club?: string | null
          start_date?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          athlete_id?: string
          created_at?: string
          federation_date?: string | null
          id?: string
          is_federated?: boolean | null
          is_league?: boolean | null
          league_date?: string | null
          previous_club?: string | null
          start_date?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_history_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_studies: {
        Row: {
          athlete_id: string
          created_at: string
          current_grade: string | null
          education_level: string | null
          id: string
          school_address: string | null
          school_email: string | null
          school_name: string | null
          school_phone: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          current_grade?: string | null
          education_level?: string | null
          id?: string
          school_address?: string | null
          school_email?: string | null
          school_name?: string | null
          school_phone?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          current_grade?: string | null
          education_level?: string | null
          id?: string
          school_address?: string | null
          school_email?: string | null
          school_name?: string | null
          school_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_studies_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          achievements: string | null
          athlete_number: string | null
          category: Database["public"]["Enums"]["athlete_category"]
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          gender: Database["public"]["Enums"]["athlete_gender"] | null
          id: string
          join_date: string
          last_name: string | null
          level: Database["public"]["Enums"]["athlete_level"]
          medical_notes: string | null
          performance_score: number | null
          status: Database["public"]["Enums"]["athlete_status"]
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          achievements?: string | null
          athlete_number?: string | null
          category: Database["public"]["Enums"]["athlete_category"]
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          join_date?: string
          last_name?: string | null
          level: Database["public"]["Enums"]["athlete_level"]
          medical_notes?: string | null
          performance_score?: number | null
          status?: Database["public"]["Enums"]["athlete_status"]
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          achievements?: string | null
          athlete_number?: string | null
          category?: Database["public"]["Enums"]["athlete_category"]
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          join_date?: string
          last_name?: string | null
          level?: Database["public"]["Enums"]["athlete_level"]
          medical_notes?: string | null
          performance_score?: number | null
          status?: Database["public"]["Enums"]["athlete_status"]
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_summaries: {
        Row: {
          athlete_id: string | null
          attendance_rate: number | null
          attended_sessions: number | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          total_sessions: number | null
          training_session_id: string | null
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          attendance_rate?: number | null
          attended_sessions?: number | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          total_sessions?: number | null
          training_session_id?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          attendance_rate?: number | null
          attended_sessions?: number | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          total_sessions?: number | null
          training_session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_summaries_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_summaries_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      awards: {
        Row: {
          athlete_id: string | null
          award_date: string
          award_name: string
          award_type: string
          competition_id: string | null
          created_at: string
          id: string
          points_earned: number | null
        }
        Insert: {
          athlete_id?: string | null
          award_date: string
          award_name: string
          award_type: string
          competition_id?: string | null
          created_at?: string
          id?: string
          points_earned?: number | null
        }
        Update: {
          athlete_id?: string | null
          award_date?: string
          award_name?: string
          award_type?: string
          competition_id?: string | null
          created_at?: string
          id?: string
          points_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "awards_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      club_settings: {
        Row: {
          address: string | null
          club_description: string | null
          club_logo_url: string | null
          club_name: string
          coach_email: string | null
          coach_name: string | null
          coach_phone: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          currency: string | null
          delegate_email: string | null
          delegate_name: string | null
          delegate_phone: string | null
          doctor_name: string | null
          doctor_phone: string | null
          id: string
          language: string | null
          league: string | null
          physiotherapist_name: string | null
          physiotherapist_phone: string | null
          president_email: string | null
          president_id: string | null
          president_name: string | null
          president_phone: string | null
          report_header_style: string | null
          report_include_address: boolean | null
          report_include_contact: boolean | null
          report_include_delegate: boolean | null
          report_include_league: boolean | null
          report_include_logo: boolean | null
          report_include_president: boolean | null
          report_include_social: boolean | null
          social_facebook: string | null
          social_instagram: string | null
          social_twitter: string | null
          timezone: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          club_description?: string | null
          club_logo_url?: string | null
          club_name?: string
          coach_email?: string | null
          coach_name?: string | null
          coach_phone?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          delegate_email?: string | null
          delegate_name?: string | null
          delegate_phone?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          id?: string
          language?: string | null
          league?: string | null
          physiotherapist_name?: string | null
          physiotherapist_phone?: string | null
          president_email?: string | null
          president_id?: string | null
          president_name?: string | null
          president_phone?: string | null
          report_header_style?: string | null
          report_include_address?: boolean | null
          report_include_contact?: boolean | null
          report_include_delegate?: boolean | null
          report_include_league?: boolean | null
          report_include_logo?: boolean | null
          report_include_president?: boolean | null
          report_include_social?: boolean | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          timezone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          club_description?: string | null
          club_logo_url?: string | null
          club_name?: string
          coach_email?: string | null
          coach_name?: string | null
          coach_phone?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          delegate_email?: string | null
          delegate_name?: string | null
          delegate_phone?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          id?: string
          language?: string | null
          league?: string | null
          physiotherapist_name?: string | null
          physiotherapist_phone?: string | null
          president_email?: string | null
          president_id?: string | null
          president_name?: string | null
          president_phone?: string | null
          report_header_style?: string | null
          report_include_address?: boolean | null
          report_include_contact?: boolean | null
          report_include_delegate?: boolean | null
          report_include_league?: boolean | null
          report_include_logo?: boolean | null
          report_include_president?: boolean | null
          report_include_social?: boolean | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          timezone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      coach_athletes: {
        Row: {
          athlete_id: string
          coach_id: string
          created_at: string
          end_date: string | null
          id: string
          is_primary: boolean | null
          start_date: string
        }
        Insert: {
          athlete_id: string
          coach_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          start_date?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_athletes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_athletes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          certification_level: string | null
          created_at: string
          hourly_rate: number | null
          id: string
          license_number: string | null
          specialization: string | null
          team_id: string | null
          updated_at: string
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          certification_level?: string | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          license_number?: string | null
          specialization?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          certification_level?: string | null
          created_at?: string
          hourly_rate?: number | null
          id?: string
          license_number?: string | null
          specialization?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_registrations: {
        Row: {
          athlete_id: string
          competition_id: string
          created_at: string
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          registration_date: string
        }
        Insert: {
          athlete_id: string
          competition_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          registration_date?: string
        }
        Update: {
          athlete_id?: string
          competition_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          registration_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_registrations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_results: {
        Row: {
          athlete_id: string
          competition_id: string
          created_at: string
          id: string
          notes: string | null
          points: number | null
          position: number | null
          score: number | null
        }
        Insert: {
          athlete_id: string
          competition_id: string
          created_at?: string
          id?: string
          notes?: string | null
          points?: number | null
          position?: number | null
          score?: number | null
        }
        Update: {
          athlete_id?: string
          competition_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          points?: number | null
          position?: number | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_results_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_results_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          category: Database["public"]["Enums"]["athlete_category"] | null
          created_at: string
          description: string | null
          end_date: string
          entry_fee: number | null
          id: string
          level: Database["public"]["Enums"]["athlete_level"] | null
          location: string
          max_participants: number | null
          name: string
          organizer_id: string | null
          prize_pool: number | null
          registration_deadline: string | null
          start_date: string
          status: Database["public"]["Enums"]["competition_status"]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          created_at?: string
          description?: string | null
          end_date: string
          entry_fee?: number | null
          id?: string
          level?: Database["public"]["Enums"]["athlete_level"] | null
          location: string
          max_participants?: number | null
          name: string
          organizer_id?: string | null
          prize_pool?: number | null
          registration_deadline?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["competition_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          created_at?: string
          description?: string | null
          end_date?: string
          entry_fee?: number | null
          id?: string
          level?: Database["public"]["Enums"]["athlete_level"] | null
          location?: string
          max_participants?: number | null
          name?: string
          organizer_id?: string | null
          prize_pool?: number | null
          registration_deadline?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["competition_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          assigned_to: string | null
          brand: string | null
          category: string
          condition: string | null
          cost: number | null
          created_at: string
          id: string
          model: string | null
          name: string
          purchase_date: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          brand?: string | null
          category: string
          condition?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          model?: string | null
          name: string
          purchase_date?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          brand?: string | null
          category?: string
          condition?: string | null
          cost?: number | null
          created_at?: string
          id?: string
          model?: string | null
          name?: string
          purchase_date?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance: {
        Row: {
          cost: number | null
          created_at: string
          description: string | null
          equipment_id: string | null
          id: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date: string | null
          status: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description?: string | null
          equipment_id?: string | null
          id?: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance_date?: string | null
          status?: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string | null
          equipment_id?: string | null
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          next_maintenance_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          athlete_id: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          payer_email: string | null
          payer_identification: string | null
          payer_name: string | null
          payer_phone: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          receipt_url: string | null
          team_id: string | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          athlete_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          due_date?: string | null
          id?: string
          payer_email?: string | null
          payer_identification?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          receipt_url?: string | null
          team_id?: string | null
          transaction_date?: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          athlete_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          payer_email?: string | null
          payer_identification?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          receipt_url?: string | null
          team_id?: string | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      member_retention: {
        Row: {
          athlete_id: string | null
          churn_reason: string | null
          created_at: string
          end_date: string | null
          id: string
          retention_period: string
          start_date: string
          status: string
        }
        Insert: {
          athlete_id?: string | null
          churn_reason?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          retention_period: string
          start_date: string
          status?: string
        }
        Update: {
          athlete_id?: string | null
          churn_reason?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          retention_period?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_retention_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_targets: {
        Row: {
          athlete_target: number
          attendance_target: number
          created_at: string
          id: string
          month: string
          retention_target: number
          revenue_target: number
          updated_at: string
        }
        Insert: {
          athlete_target?: number
          attendance_target?: number
          created_at?: string
          id?: string
          month: string
          retention_target?: number
          revenue_target?: number
          updated_at?: string
        }
        Update: {
          athlete_target?: number
          attendance_target?: number
          created_at?: string
          id?: string
          month?: string
          retention_target?: number
          revenue_target?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          notification_type: string
          recipient_id: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sender_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          notification_type?: string
          recipient_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          recipient_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sender_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string
          id: string
          id_number: string | null
          id_type: Database["public"]["Enums"]["id_type"] | null
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name: string
          id: string
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          last_name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string
          id?: string
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sponsorships: {
        Row: {
          contact_email: string | null
          contact_person: string | null
          contract_value: number
          created_at: string
          end_date: string
          id: string
          roi_metrics: Json | null
          sponsor_name: string
          sponsor_type: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_person?: string | null
          contract_value?: number
          created_at?: string
          end_date: string
          id?: string
          roi_metrics?: Json | null
          sponsor_name: string
          sponsor_type: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_person?: string | null
          contract_value?: number
          created_at?: string
          end_date?: string
          id?: string
          roi_metrics?: Json | null
          sponsor_name?: string
          sponsor_type?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          founded_date: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          founded_date?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          founded_date?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_attendance: {
        Row: {
          athlete_id: string
          attended: boolean | null
          created_at: string
          id: string
          notes: string | null
          performance_rating: number | null
          training_session_id: string
        }
        Insert: {
          athlete_id: string
          attended?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          performance_rating?: number | null
          training_session_id: string
        }
        Update: {
          athlete_id?: string
          attended?: boolean | null
          created_at?: string
          id?: string
          notes?: string | null
          performance_rating?: number | null
          training_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attendance_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_attendance_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_kpis: {
        Row: {
          athlete_id: string | null
          attendance_percentage: number | null
          coach_id: string | null
          created_at: string
          id: string
          month: string
          total_hours: number | null
          training_type_distribution: Json | null
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          attendance_percentage?: number | null
          coach_id?: string | null
          created_at?: string
          id?: string
          month: string
          total_hours?: number | null
          training_type_distribution?: Json | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          attendance_percentage?: number | null
          coach_id?: string | null
          created_at?: string
          id?: string
          month?: string
          total_hours?: number | null
          training_type_distribution?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_kpis_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_kpis_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          coach_id: string | null
          created_at: string
          date: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          max_participants: number | null
          name: string
          start_time: string
          training_type: Database["public"]["Enums"]["training_type"]
          updated_at: string
          week_start_date: string | null
        }
        Insert: {
          coach_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          max_participants?: number | null
          name: string
          start_time: string
          training_type: Database["public"]["Enums"]["training_type"]
          updated_at?: string
          week_start_date?: string | null
        }
        Update: {
          coach_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          name?: string
          start_time?: string
          training_type?: Database["public"]["Enums"]["training_type"]
          updated_at?: string
          week_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_training_duration: {
        Args: { end_time: string; start_time: string }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      register_attendance: {
        Args: {
          p_athlete_id: string
          p_attended: boolean
          p_notes?: string
          p_performance_rating?: number
          p_training_session_id: string
        }
        Returns: {
          athlete_id: string
          attended: boolean | null
          created_at: string
          id: string
          notes: string | null
          performance_rating: number | null
          training_session_id: string
        }
      }
      register_bulk_attendance: {
        Args: { rows: Json }
        Returns: number
      }
      send_notification_to_athletes: {
        Args: {
          message_param: string
          notification_type_param?: string
          related_entity_id_param?: string
          related_entity_type_param?: string
          sender_id_param: string
          title_param: string
        }
        Returns: number
      }
    }
    Enums: {
      athlete_category:
        | "youth"
        | "junior"
        | "senior"
        | "masters"
        | "escuela"
        | "menores"
        | "transicion"
        | "prejuvenil"
        | "juvenil"
        | "mayores"
      athlete_gender: "masculino" | "femenino"
      athlete_level:
        | "beginner"
        | "intermediate"
        | "advanced"
        | "professional"
        | "escuela_menores"
        | "transicion"
        | "mayores"
        | "escuela"
        | "mini_infantil"
        | "pre_infantil"
        | "infantil"
        | "junior"
        | "pre_juvenil"
        | "prejuveniles"
        | "juvenil_primer_ano"
        | "juvenil_segundo_ano"
        | "juvenil_tercer_ano"
        | "mayores_unica"
      athlete_status: "active" | "inactive" | "injured" | "suspended"
      competition_status: "upcoming" | "ongoing" | "completed" | "cancelled"
      id_type:
        | "Tarjeta de identidad"
        | "Cedula de Ciudadania"
        | "Pasaporte"
        | "Cedula de Extranjeria"
      payment_status: "pending" | "paid" | "overdue" | "cancelled"
      training_type:
        | "technical"
        | "physical"
        | "mental"
        | "recovery"
        | "gym"
        | "road_skating"
        | "track_skating"
        | "bicycle"
        | "static_bicycle"
        | "simulator"
      transaction_type:
        | "registration_fee"
        | "equipment"
        | "travel"
        | "coaching"
        | "other"
        | "mensualidad"
        | "poliza_deportiva"
        | "anualidad"
        | "psicologia"
      user_role:
        | "admin"
        | "coach"
        | "athlete"
        | "delegate"
        | "leader"
        | "finance"
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
      athlete_category: [
        "youth",
        "junior",
        "senior",
        "masters",
        "escuela",
        "menores",
        "transicion",
        "prejuvenil",
        "juvenil",
        "mayores",
      ],
      athlete_gender: ["masculino", "femenino"],
      athlete_level: [
        "beginner",
        "intermediate",
        "advanced",
        "professional",
        "escuela_menores",
        "transicion",
        "mayores",
        "escuela",
        "mini_infantil",
        "pre_infantil",
        "infantil",
        "junior",
        "pre_juvenil",
        "prejuveniles",
        "juvenil_primer_ano",
        "juvenil_segundo_ano",
        "juvenil_tercer_ano",
        "mayores_unica",
      ],
      athlete_status: ["active", "inactive", "injured", "suspended"],
      competition_status: ["upcoming", "ongoing", "completed", "cancelled"],
      id_type: [
        "Tarjeta de identidad",
        "Cedula de Ciudadania",
        "Pasaporte",
        "Cedula de Extranjeria",
      ],
      payment_status: ["pending", "paid", "overdue", "cancelled"],
      training_type: [
        "technical",
        "physical",
        "mental",
        "recovery",
        "gym",
        "road_skating",
        "track_skating",
        "bicycle",
        "static_bicycle",
        "simulator",
      ],
      transaction_type: [
        "registration_fee",
        "equipment",
        "travel",
        "coaching",
        "other",
        "mensualidad",
        "poliza_deportiva",
        "anualidad",
        "psicologia",
      ],
      user_role: ["admin", "coach", "athlete", "delegate", "leader", "finance"],
    },
  },
} as const
