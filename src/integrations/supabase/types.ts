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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agent_activity_log: {
        Row: {
          actions_taken: number
          agent_id: string
          automation_id: string
          club_id: string | null
          error_message: string | null
          id: string
          ran_at: string
          records_found: number
          status: string
          summary: string | null
        }
        Insert: {
          actions_taken?: number
          agent_id: string
          automation_id: string
          club_id?: string | null
          error_message?: string | null
          id?: string
          ran_at?: string
          records_found?: number
          status: string
          summary?: string | null
        }
        Update: {
          actions_taken?: number
          agent_id?: string
          automation_id?: string
          club_id?: string | null
          error_message?: string | null
          id?: string
          ran_at?: string
          records_found?: number
          status?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_activity_log_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_body_info: {
        Row: {
          accident_insurance: string | null
          allergies: string | null
          athlete_id: string
          blood_type: string | null
          club_id: string
          eps: string | null
          fractures: string | null
          height_cm: number | null
          id: string
          imc: number | null
          lycra_size: string | null
          physical_limitations: string | null
          surgeries: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          accident_insurance?: string | null
          allergies?: string | null
          athlete_id: string
          blood_type?: string | null
          club_id: string
          eps?: string | null
          fractures?: string | null
          height_cm?: number | null
          id?: string
          imc?: number | null
          lycra_size?: string | null
          physical_limitations?: string | null
          surgeries?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          accident_insurance?: string | null
          allergies?: string | null
          athlete_id?: string
          blood_type?: string | null
          club_id?: string
          eps?: string | null
          fractures?: string | null
          height_cm?: number | null
          id?: string
          imc?: number | null
          lycra_size?: string | null
          physical_limitations?: string | null
          surgeries?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_body_info_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_body_info_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_body_info_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_equipment: {
        Row: {
          athlete_id: string
          boot_brand: string | null
          boot_size: string | null
          frame_brand: string | null
          frame_size: string | null
          helmet_brand: string | null
          helmet_size: string | null
          id: string
          other_equipment: string | null
          road_wheel_brand: string | null
          road_wheel_diameter: number | null
          track_wheel_brand: string | null
          track_wheel_diameter: number | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          boot_brand?: string | null
          boot_size?: string | null
          frame_brand?: string | null
          frame_size?: string | null
          helmet_brand?: string | null
          helmet_size?: string | null
          id?: string
          other_equipment?: string | null
          road_wheel_brand?: string | null
          road_wheel_diameter?: number | null
          track_wheel_brand?: string | null
          track_wheel_diameter?: number | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          boot_brand?: string | null
          boot_size?: string | null
          frame_brand?: string | null
          frame_size?: string | null
          helmet_brand?: string | null
          helmet_size?: string | null
          id?: string
          other_equipment?: string | null
          road_wheel_brand?: string | null
          road_wheel_diameter?: number | null
          track_wheel_brand?: string | null
          track_wheel_diameter?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_equipment_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_equipment_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_family: {
        Row: {
          athlete_id: string
          father_email: string | null
          father_name: string | null
          father_phone: string | null
          guardian_email: string | null
          guardian_id_number: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          id: string
          mother_email: string | null
          mother_name: string | null
          mother_phone: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          father_email?: string | null
          father_name?: string | null
          father_phone?: string | null
          guardian_email?: string | null
          guardian_id_number?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          mother_email?: string | null
          mother_name?: string | null
          mother_phone?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          father_email?: string | null
          father_name?: string | null
          father_phone?: string | null
          guardian_email?: string | null
          guardian_id_number?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          mother_email?: string | null
          mother_name?: string | null
          mother_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_family_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_family_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_gallery: {
        Row: {
          athlete_id: string
          caption: string | null
          club_id: string
          created_at: string
          display_order: number
          id: string
          image_url: string
        }
        Insert: {
          athlete_id: string
          caption?: string | null
          club_id: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
        }
        Update: {
          athlete_id?: string
          caption?: string | null
          club_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_gallery_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_gallery_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_gallery_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_history: {
        Row: {
          achievements_text: string | null
          athlete_id: string
          category_history: Json
          club_entry_date: string | null
          club_id: string
          federation_date: string | null
          federation_number: string | null
          id: string
          is_federated: boolean
          is_in_league: boolean
          is_national_team: boolean
          league_date: string | null
          national_team_years: string | null
          previous_club: string | null
          previous_clubs: Json
          start_date: string | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          achievements_text?: string | null
          athlete_id: string
          category_history?: Json
          club_entry_date?: string | null
          club_id: string
          federation_date?: string | null
          federation_number?: string | null
          id?: string
          is_federated?: boolean
          is_in_league?: boolean
          is_national_team?: boolean
          league_date?: string | null
          national_team_years?: string | null
          previous_club?: string | null
          previous_clubs?: Json
          start_date?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          achievements_text?: string | null
          athlete_id?: string
          category_history?: Json
          club_entry_date?: string | null
          club_id?: string
          federation_date?: string | null
          federation_number?: string | null
          id?: string
          is_federated?: boolean
          is_in_league?: boolean
          is_national_team?: boolean
          league_date?: string | null
          national_team_years?: string | null
          previous_club?: string | null
          previous_clubs?: Json
          start_date?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_history_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_history_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_history_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_international_competitions: {
        Row: {
          athlete_id: string
          category: Database["public"]["Enums"]["athlete_category"] | null
          city: string
          competition_date: string | null
          competition_name: string
          competition_year: number
          country: string
          created_at: string
          event_name: string
          gender: Database["public"]["Enums"]["athlete_gender"] | null
          id: string
          is_national_team_rep: boolean
          medal_type: string | null
          notes: string | null
          organizer: string | null
          points: number | null
          position: number | null
          status: string | null
          time_seconds: number | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          category?: Database["public"]["Enums"]["athlete_category"] | null
          city: string
          competition_date?: string | null
          competition_name: string
          competition_year: number
          country: string
          created_at?: string
          event_name: string
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          is_national_team_rep?: boolean
          medal_type?: string | null
          notes?: string | null
          organizer?: string | null
          points?: number | null
          position?: number | null
          status?: string | null
          time_seconds?: number | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          category?: Database["public"]["Enums"]["athlete_category"] | null
          city?: string
          competition_date?: string | null
          competition_name?: string
          competition_year?: number
          country?: string
          created_at?: string
          event_name?: string
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          is_national_team_rep?: boolean
          medal_type?: string | null
          notes?: string | null
          organizer?: string | null
          points?: number | null
          position?: number | null
          status?: string | null
          time_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_international_competitions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_international_competitions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_performance_predictions: {
        Row: {
          athlete_id: string
          id: string
          injury_risk: string | null
          medal_potential: string | null
          model_data: Json
          predicted_at: string
          recommendations: string | null
          training_load_status: string | null
        }
        Insert: {
          athlete_id: string
          id?: string
          injury_risk?: string | null
          medal_potential?: string | null
          model_data?: Json
          predicted_at?: string
          recommendations?: string | null
          training_load_status?: string | null
        }
        Update: {
          athlete_id?: string
          id?: string
          injury_risk?: string | null
          medal_potential?: string | null
          model_data?: Json
          predicted_at?: string
          recommendations?: string | null
          training_load_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_performance_predictions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_performance_predictions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_socials: {
        Row: {
          athlete_id: string
          facebook: string | null
          id: string
          instagram: string | null
          tiktok: string | null
          twitter: string | null
          updated_at: string
          whatsapp: string | null
          youtube: string | null
        }
        Insert: {
          athlete_id: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Update: {
          athlete_id?: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          whatsapp?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_socials_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_socials_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_studies: {
        Row: {
          athlete_id: string
          current_grade: string | null
          education_level: Database["public"]["Enums"]["study_level"] | null
          id: string
          school_address: string | null
          school_email: string | null
          school_name: string | null
          school_phone: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          current_grade?: string | null
          education_level?: Database["public"]["Enums"]["study_level"] | null
          id?: string
          school_address?: string | null
          school_email?: string | null
          school_name?: string | null
          school_phone?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          current_grade?: string | null
          education_level?: Database["public"]["Enums"]["study_level"] | null
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
            isOneToOne: true
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_studies_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_testimonials: {
        Row: {
          approved: boolean
          athlete_id: string
          content: string
          created_at: string
          id: string
          trigger_result_id: string | null
          used_in: string | null
        }
        Insert: {
          approved?: boolean
          athlete_id: string
          content: string
          created_at?: string
          id?: string
          trigger_result_id?: string | null
          used_in?: string | null
        }
        Update: {
          approved?: boolean
          athlete_id?: string
          content?: string
          created_at?: string
          id?: string
          trigger_result_id?: string | null
          used_in?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_testimonials_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_testimonials_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_testimonials_trigger_result_id_fkey"
            columns: ["trigger_result_id"]
            isOneToOne: false
            referencedRelation: "competition_results"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_wheels: {
        Row: {
          athlete_id: string
          brand: string
          category_limit_mm: number | null
          created_at: string
          diameter_mm: number
          exceeds_limit: boolean | null
          hardness_a: number | null
          id: string
          is_current: boolean
          model: string | null
          notes: string | null
          purchase_date: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          brand: string
          category_limit_mm?: number | null
          created_at?: string
          diameter_mm: number
          exceeds_limit?: boolean | null
          hardness_a?: number | null
          id?: string
          is_current?: boolean
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          brand?: string
          category_limit_mm?: number | null
          created_at?: string
          diameter_mm?: number
          exceeds_limit?: boolean | null
          hardness_a?: number | null
          id?: string
          is_current?: boolean
          model?: string | null
          notes?: string | null
          purchase_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_wheels_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_wheels_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          accident_insurance: string | null
          address: string | null
          allergies: string | null
          athlete_number: string | null
          bio: string | null
          blood_type: string | null
          category: Database["public"]["Enums"]["athlete_category"]
          checkin_token: string | null
          city: string | null
          city_of_birth: string | null
          club_id: string
          coach_id: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          dominant_distances: string[]
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          eps: string | null
          fedepatin_license: string | null
          first_name: string
          fractures: string | null
          gender: Database["public"]["Enums"]["athlete_gender"] | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_name_2: string | null
          guardian_phone: string | null
          guardian_phone_2: string | null
          guardian_relationship: string | null
          guardian_relationship_2: string | null
          height_cm: number | null
          id: string
          identification_number: string | null
          identification_type: string | null
          imc: number | null
          is_elite_athlete: boolean
          join_date: string | null
          last_evaluation_date: string | null
          last_name: string
          level: Database["public"]["Enums"]["athlete_level"]
          long_term_goals: string | null
          lycra_size: string | null
          main_discipline: string | null
          membership_expires_at: string | null
          nationality: string | null
          neighborhood: string | null
          nfc_tag_uid: string | null
          notes: string | null
          performance_score: number
          personal_phone: string | null
          personal_values: string | null
          photo_url: string | null
          physical_limitations: string | null
          registration_number: string | null
          registration_type: Database["public"]["Enums"]["athlete_registration_type"]
          registration_valid_until: string | null
          school_grade: string | null
          school_name: string | null
          short_term_goals: string | null
          specialty: Database["public"]["Enums"]["athlete_specialty"] | null
          status: Database["public"]["Enums"]["athlete_status"]
          study_level: Database["public"]["Enums"]["study_level"] | null
          surgeries: string | null
          updated_at: string
          user_id: string | null
          weight_kg: number | null
          world_skate_id: string | null
        }
        Insert: {
          accident_insurance?: string | null
          address?: string | null
          allergies?: string | null
          athlete_number?: string | null
          bio?: string | null
          blood_type?: string | null
          category?: Database["public"]["Enums"]["athlete_category"]
          checkin_token?: string | null
          city?: string | null
          city_of_birth?: string | null
          club_id: string
          coach_id?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          dominant_distances?: string[]
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          eps?: string | null
          fedepatin_license?: string | null
          first_name: string
          fractures?: string | null
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_name_2?: string | null
          guardian_phone?: string | null
          guardian_phone_2?: string | null
          guardian_relationship?: string | null
          guardian_relationship_2?: string | null
          height_cm?: number | null
          id?: string
          identification_number?: string | null
          identification_type?: string | null
          imc?: number | null
          is_elite_athlete?: boolean
          join_date?: string | null
          last_evaluation_date?: string | null
          last_name: string
          level?: Database["public"]["Enums"]["athlete_level"]
          long_term_goals?: string | null
          lycra_size?: string | null
          main_discipline?: string | null
          membership_expires_at?: string | null
          nationality?: string | null
          neighborhood?: string | null
          nfc_tag_uid?: string | null
          notes?: string | null
          performance_score?: number
          personal_phone?: string | null
          personal_values?: string | null
          photo_url?: string | null
          physical_limitations?: string | null
          registration_number?: string | null
          registration_type?: Database["public"]["Enums"]["athlete_registration_type"]
          registration_valid_until?: string | null
          school_grade?: string | null
          school_name?: string | null
          short_term_goals?: string | null
          specialty?: Database["public"]["Enums"]["athlete_specialty"] | null
          status?: Database["public"]["Enums"]["athlete_status"]
          study_level?: Database["public"]["Enums"]["study_level"] | null
          surgeries?: string | null
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
          world_skate_id?: string | null
        }
        Update: {
          accident_insurance?: string | null
          address?: string | null
          allergies?: string | null
          athlete_number?: string | null
          bio?: string | null
          blood_type?: string | null
          category?: Database["public"]["Enums"]["athlete_category"]
          checkin_token?: string | null
          city?: string | null
          city_of_birth?: string | null
          club_id?: string
          coach_id?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          dominant_distances?: string[]
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          eps?: string | null
          fedepatin_license?: string | null
          first_name?: string
          fractures?: string | null
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_name_2?: string | null
          guardian_phone?: string | null
          guardian_phone_2?: string | null
          guardian_relationship?: string | null
          guardian_relationship_2?: string | null
          height_cm?: number | null
          id?: string
          identification_number?: string | null
          identification_type?: string | null
          imc?: number | null
          is_elite_athlete?: boolean
          join_date?: string | null
          last_evaluation_date?: string | null
          last_name?: string
          level?: Database["public"]["Enums"]["athlete_level"]
          long_term_goals?: string | null
          lycra_size?: string | null
          main_discipline?: string | null
          membership_expires_at?: string | null
          nationality?: string | null
          neighborhood?: string | null
          nfc_tag_uid?: string | null
          notes?: string | null
          performance_score?: number
          personal_phone?: string | null
          personal_values?: string | null
          photo_url?: string | null
          physical_limitations?: string | null
          registration_number?: string | null
          registration_type?: Database["public"]["Enums"]["athlete_registration_type"]
          registration_valid_until?: string | null
          school_grade?: string | null
          school_name?: string | null
          short_term_goals?: string | null
          specialty?: Database["public"]["Enums"]["athlete_specialty"] | null
          status?: Database["public"]["Enums"]["athlete_status"]
          study_level?: Database["public"]["Enums"]["study_level"] | null
          surgeries?: string | null
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
          world_skate_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          athlete_id: string
          club_id: string
          id: string
          notes: string | null
          recorded_at: string
          session_id: string
          status: string
        }
        Insert: {
          athlete_id: string
          club_id: string
          id?: string
          notes?: string | null
          recorded_at?: string
          session_id: string
          status?: string
        }
        Update: {
          athlete_id?: string
          club_id?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_alerts: {
        Row: {
          alert_level: string
          athlete_id: string
          club_id: string
          consecutive_absences: number
          created_at: string
          id: string
          notified_admin: boolean
          notified_coach: boolean
          resolved_at: string | null
        }
        Insert: {
          alert_level: string
          athlete_id: string
          club_id: string
          consecutive_absences?: number
          created_at?: string
          id?: string
          notified_admin?: boolean
          notified_coach?: boolean
          resolved_at?: string | null
        }
        Update: {
          alert_level?: string
          athlete_id?: string
          club_id?: string
          consecutive_absences?: number
          created_at?: string
          id?: string
          notified_admin?: boolean
          notified_coach?: boolean
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_alerts_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_alerts_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_alerts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          club_id: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          performed_at: string
          performed_by: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          club_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          performed_at?: string
          performed_by?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          club_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          performed_at?: string
          performed_by?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_config: {
        Row: {
          automation_id: string
          club_id: string
          custom_params: Json
          enabled: boolean
          schedule_day_of_month: string | null
          schedule_day_of_week: string | null
          schedule_hour: number | null
          schedule_minute: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          automation_id: string
          club_id: string
          custom_params?: Json
          enabled?: boolean
          schedule_day_of_month?: string | null
          schedule_day_of_week?: string | null
          schedule_hour?: number | null
          schedule_minute?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          automation_id?: string
          club_id?: string
          custom_params?: Json
          enabled?: boolean
          schedule_day_of_month?: string | null
          schedule_day_of_week?: string | null
          schedule_hour?: number | null
          schedule_minute?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_config_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      award_scheme_configs: {
        Row: {
          club_id: string
          created_at: string
          created_by: string | null
          custom_config: Json | null
          id: string
          is_active: boolean
          name: string
          scheme_type: Database["public"]["Enums"]["award_scheme_type"]
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by?: string | null
          custom_config?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          scheme_type?: Database["public"]["Enums"]["award_scheme_type"]
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by?: string | null
          custom_config?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          scheme_type?: Database["public"]["Enums"]["award_scheme_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "award_scheme_configs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      awards: {
        Row: {
          athlete_id: string
          award_date: string
          club_id: string
          competition_id: string | null
          created_at: string
          description: string | null
          id: string
          medal_type: string | null
          title: string
        }
        Insert: {
          athlete_id: string
          award_date?: string
          club_id: string
          competition_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          medal_type?: string | null
          title: string
        }
        Update: {
          athlete_id?: string
          award_date?: string
          club_id?: string
          competition_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          medal_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "awards_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awards_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
      backup_log: {
        Row: {
          alert_sent: boolean
          details: string | null
          id: string
          ran_at: string
          status: string
        }
        Insert: {
          alert_sent?: boolean
          details?: string | null
          id?: string
          ran_at?: string
          status: string
        }
        Update: {
          alert_sent?: boolean
          details?: string | null
          id?: string
          ran_at?: string
          status?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          blocked_at: string
          expires_at: string | null
          ip_address: unknown
          reason: string | null
        }
        Insert: {
          blocked_at?: string
          expires_at?: string | null
          ip_address: unknown
          reason?: string | null
        }
        Update: {
          blocked_at?: string
          expires_at?: string | null
          ip_address?: unknown
          reason?: string | null
        }
        Relationships: []
      }
      clubs: {
        Row: {
          address: string | null
          admin_invite_token: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          currency: string
          custom_domain: string | null
          delegate_name: string | null
          delegate_phone: string | null
          description: string | null
          founded_year: number | null
          id: string
          is_active: boolean
          league: string | null
          logo_url: string | null
          mobile_phone: string | null
          name: string
          onboarding_completed: boolean
          president_email: string | null
          president_name: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string | null
          target_athletes: number | null
          target_revenue: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          admin_invite_token?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          delegate_name?: string | null
          delegate_phone?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          is_active?: boolean
          league?: string | null
          logo_url?: string | null
          mobile_phone?: string | null
          name: string
          onboarding_completed?: boolean
          president_email?: string | null
          president_name?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          target_athletes?: number | null
          target_revenue?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          admin_invite_token?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          delegate_name?: string | null
          delegate_phone?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          is_active?: boolean
          league?: string | null
          logo_url?: string | null
          mobile_phone?: string | null
          name?: string
          onboarding_completed?: boolean
          president_email?: string | null
          president_name?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          target_athletes?: number | null
          target_revenue?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      coach_athletes: {
        Row: {
          assigned_at: string
          athlete_id: string
          coach_id: string
          id: string
          is_primary: boolean
        }
        Insert: {
          assigned_at?: string
          athlete_id: string
          coach_id: string
          id?: string
          is_primary?: boolean
        }
        Update: {
          assigned_at?: string
          athlete_id?: string
          coach_id?: string
          id?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "coach_athletes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
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
          bio: string | null
          certification_level: string | null
          club_id: string
          created_at: string
          id: string
          is_active: boolean
          license_number: string | null
          specialization: string | null
          updated_at: string
          user_id: string
          years_experience: number
        }
        Insert: {
          bio?: string | null
          certification_level?: string | null
          club_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          specialization?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number
        }
        Update: {
          bio?: string | null
          certification_level?: string | null
          club_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "coaches_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_events: {
        Row: {
          category: Database["public"]["Enums"]["athlete_category"] | null
          club_id: string
          competition_id: string
          created_at: string
          event_name: string
          gender: Database["public"]["Enums"]["athlete_gender"] | null
          id: string
          location: string | null
          max_athletes: number | null
          notes: string | null
          race_event_id: string | null
          scheduled_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_id: string
          competition_id: string
          created_at?: string
          event_name: string
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          location?: string | null
          max_athletes?: number | null
          notes?: string | null
          race_event_id?: string | null
          scheduled_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_id?: string
          competition_id?: string
          created_at?: string
          event_name?: string
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          location?: string | null
          max_athletes?: number | null
          notes?: string | null
          race_event_id?: string | null
          scheduled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_events_race_event_id_fkey"
            columns: ["race_event_id"]
            isOneToOne: false
            referencedRelation: "race_events"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_registrations: {
        Row: {
          athlete_id: string
          competition_id: string
          event_id: string | null
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["transaction_status"]
          registered_by: string | null
          registration_date: string
        }
        Insert: {
          athlete_id: string
          competition_id: string
          event_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["transaction_status"]
          registered_by?: string | null
          registration_date?: string
        }
        Update: {
          athlete_id?: string
          competition_id?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["transaction_status"]
          registered_by?: string | null
          registration_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_registrations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "competition_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "competition_events"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_resolutions: {
        Row: {
          competition_id: string
          created_at: string
          document_url: string
          id: string
          issued_at: string | null
          issued_by: string | null
          notes: string | null
          resolution_number: string | null
          resolution_type: Database["public"]["Enums"]["resolution_type"]
          uploaded_by: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          document_url: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          resolution_number?: string | null
          resolution_type?: Database["public"]["Enums"]["resolution_type"]
          uploaded_by?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          document_url?: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          resolution_number?: string | null
          resolution_type?: Database["public"]["Enums"]["resolution_type"]
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_resolutions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_results: {
        Row: {
          athlete_id: string | null
          bib_number: string | null
          competition_id: string
          created_at: string
          event_name: string
          external_athlete_id: string | null
          id: string
          medal_type: string | null
          notes: string | null
          points: number | null
          position: number | null
          race_event_id: string | null
          result_import_id: string | null
          status: Database["public"]["Enums"]["result_status"]
          time_diff_seconds: number | null
          time_seconds: number | null
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          bib_number?: string | null
          competition_id: string
          created_at?: string
          event_name: string
          external_athlete_id?: string | null
          id?: string
          medal_type?: string | null
          notes?: string | null
          points?: number | null
          position?: number | null
          race_event_id?: string | null
          result_import_id?: string | null
          status?: Database["public"]["Enums"]["result_status"]
          time_diff_seconds?: number | null
          time_seconds?: number | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          bib_number?: string | null
          competition_id?: string
          created_at?: string
          event_name?: string
          external_athlete_id?: string | null
          id?: string
          medal_type?: string | null
          notes?: string | null
          points?: number | null
          position?: number | null
          race_event_id?: string | null
          result_import_id?: string | null
          status?: Database["public"]["Enums"]["result_status"]
          time_diff_seconds?: number | null
          time_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_results_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "competition_results_external_athlete_id_fkey"
            columns: ["external_athlete_id"]
            isOneToOne: false
            referencedRelation: "external_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_results_race_event_id_fkey"
            columns: ["race_event_id"]
            isOneToOne: false
            referencedRelation: "race_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_results_result_import_id_fkey"
            columns: ["result_import_id"]
            isOneToOne: false
            referencedRelation: "result_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          category: Database["public"]["Enums"]["athlete_category"] | null
          club_id: string
          competition_type: Database["public"]["Enums"]["competition_type"]
          created_at: string
          description: string | null
          end_date: string | null
          federation_code: string | null
          id: string
          level: Database["public"]["Enums"]["athlete_level"] | null
          location: string | null
          max_athletes_per_event: number | null
          name: string
          notes: string | null
          organized_by: string | null
          registration_deadline: string | null
          responsible_coach_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_id: string
          competition_type?: Database["public"]["Enums"]["competition_type"]
          created_at?: string
          description?: string | null
          end_date?: string | null
          federation_code?: string | null
          id?: string
          level?: Database["public"]["Enums"]["athlete_level"] | null
          location?: string | null
          max_athletes_per_event?: number | null
          name: string
          notes?: string | null
          organized_by?: string | null
          registration_deadline?: string | null
          responsible_coach_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_id?: string
          competition_type?: Database["public"]["Enums"]["competition_type"]
          created_at?: string
          description?: string | null
          end_date?: string | null
          federation_code?: string | null
          id?: string
          level?: Database["public"]["Enums"]["athlete_level"] | null
          location?: string | null
          max_athletes_per_event?: number | null
          name?: string
          notes?: string | null
          organized_by?: string | null
          registration_deadline?: string | null
          responsible_coach_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      courtesy_classes: {
        Row: {
          address: string | null
          age: number | null
          class_date: string
          club_id: string
          created_at: string
          email: string | null
          guardian_name: string | null
          id: string
          notes: string | null
          outcome: string | null
          person_name: string
          phone: string | null
          responsible_coach_id: string | null
          skating_experience_years: number | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          class_date?: string
          club_id: string
          created_at?: string
          email?: string | null
          guardian_name?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          person_name: string
          phone?: string | null
          responsible_coach_id?: string | null
          skating_experience_years?: number | null
        }
        Update: {
          address?: string | null
          age?: number | null
          class_date?: string
          club_id?: string
          created_at?: string
          email?: string | null
          guardian_name?: string | null
          id?: string
          notes?: string | null
          outcome?: string | null
          person_name?: string
          phone?: string | null
          responsible_coach_id?: string | null
          skating_experience_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courtesy_classes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          attendance_rate: number
          club_id: string
          created_at: string
          id: string
          net: number | null
          report_date: string
          report_type: string
          sessions_held: number
          summary_json: Json
          total_expense: number
          total_income: number
        }
        Insert: {
          attendance_rate?: number
          club_id: string
          created_at?: string
          id?: string
          net?: number | null
          report_date: string
          report_type: string
          sessions_held?: number
          summary_json?: Json
          total_expense?: number
          total_income?: number
        }
        Update: {
          attendance_rate?: number
          club_id?: string
          created_at?: string
          id?: string
          net?: number | null
          report_date?: string
          report_type?: string
          sessions_held?: number
          summary_json?: Json
          total_expense?: number
          total_income?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          club_id: string
          content: string
          created_at: string
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json
        }
        Insert: {
          chunk_index?: number
          club_id: string
          content: string
          created_at?: string
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          chunk_index?: number
          club_id?: string
          content?: string
          created_at?: string
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          club_id: string
          document_id: string | null
          document_title: string
          id: string
          signature_data: string
          signed_at: string | null
          signer_name: string
          signer_role: string | null
          signer_user_id: string | null
        }
        Insert: {
          club_id: string
          document_id?: string | null
          document_title: string
          id?: string
          signature_data: string
          signed_at?: string | null
          signer_name: string
          signer_role?: string | null
          signer_user_id?: string | null
        }
        Update: {
          club_id?: string
          document_id?: string | null
          document_title?: string
          id?: string
          signature_data?: string
          signed_at?: string | null
          signer_name?: string
          signer_role?: string | null
          signer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          club_id: string
          created_at: string
          created_by: string | null
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          is_active: boolean
          name: string
          template_html: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id?: string
          is_active?: boolean
          name: string
          template_html: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          is_active?: boolean
          name?: string
          template_html?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          athlete_id: string | null
          club_id: string
          competition_id: string | null
          created_at: string
          doc_status: string
          document_type: Database["public"]["Enums"]["document_type"]
          expires_at: string | null
          expiry_date: string | null
          file_name: string | null
          file_size_kb: number | null
          file_url: string | null
          generated_pdf: boolean
          id: string
          is_signed: boolean
          issued_at: string | null
          issued_by: string | null
          notes: string | null
          signed_at: string | null
          title: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          athlete_id?: string | null
          club_id: string
          competition_id?: string | null
          created_at?: string
          doc_status?: string
          document_type: Database["public"]["Enums"]["document_type"]
          expires_at?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_size_kb?: number | null
          file_url?: string | null
          generated_pdf?: boolean
          id?: string
          is_signed?: boolean
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          signed_at?: string | null
          title?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          athlete_id?: string | null
          club_id?: string
          competition_id?: string | null
          created_at?: string
          doc_status?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          expires_at?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_size_kb?: number | null
          file_url?: string | null
          generated_pdf?: boolean
          id?: string
          is_signed?: boolean
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          signed_at?: string | null
          title?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          brand: string | null
          chassis_size: string | null
          club_id: string
          condition_notes: string | null
          created_at: string
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id: string
          last_maintenance_at: string | null
          model: string | null
          name: string
          next_maintenance_at: string | null
          purchase_date: string | null
          purchase_value: number | null
          serial_number: string | null
          skate_size: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
          wheel_diameter: number | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          brand?: string | null
          chassis_size?: string | null
          club_id: string
          condition_notes?: string | null
          created_at?: string
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id?: string
          last_maintenance_at?: string | null
          model?: string | null
          name: string
          next_maintenance_at?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          serial_number?: string | null
          skate_size?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
          wheel_diameter?: number | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          brand?: string | null
          chassis_size?: string | null
          club_id?: string
          condition_notes?: string | null
          created_at?: string
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          id?: string
          last_maintenance_at?: string | null
          model?: string | null
          name?: string
          next_maintenance_at?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          serial_number?: string | null
          skate_size?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
          wheel_diameter?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance: {
        Row: {
          club_id: string
          cost: number | null
          created_at: string
          description: string
          equipment_id: string
          id: string
          maintenance_date: string
          maintenance_type: string
          next_maintenance: string | null
          parts_replaced: string | null
          performed_by: string | null
        }
        Insert: {
          club_id: string
          cost?: number | null
          created_at?: string
          description: string
          equipment_id: string
          id?: string
          maintenance_date?: string
          maintenance_type: string
          next_maintenance?: string | null
          parts_replaced?: string | null
          performed_by?: string | null
        }
        Update: {
          club_id?: string
          cost?: number | null
          created_at?: string
          description?: string
          equipment_id?: string
          id?: string
          maintenance_date?: string
          maintenance_type?: string
          next_maintenance?: string | null
          parts_replaced?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          areas_to_improve: string | null
          athlete_id: string
          athlete_notes: string | null
          club_id: string
          coach_id: string | null
          coach_notes: string | null
          created_at: string
          endurance_score: number | null
          evaluation_date: string
          evaluation_type: string
          goals: string | null
          height_cm: number | null
          id: string
          imc: number | null
          next_eval_date: string | null
          overall_score: number | null
          speed_score: number | null
          status: Database["public"]["Enums"]["evaluation_status"]
          strength_score: number | null
          strengths: string | null
          technique_score: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          areas_to_improve?: string | null
          athlete_id: string
          athlete_notes?: string | null
          club_id: string
          coach_id?: string | null
          coach_notes?: string | null
          created_at?: string
          endurance_score?: number | null
          evaluation_date?: string
          evaluation_type: string
          goals?: string | null
          height_cm?: number | null
          id?: string
          imc?: number | null
          next_eval_date?: string | null
          overall_score?: number | null
          speed_score?: number | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          strength_score?: number | null
          strengths?: string | null
          technique_score?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          areas_to_improve?: string | null
          athlete_id?: string
          athlete_notes?: string | null
          club_id?: string
          coach_id?: string | null
          coach_notes?: string | null
          created_at?: string
          endurance_score?: number | null
          evaluation_date?: string
          evaluation_type?: string
          goals?: string | null
          height_cm?: number | null
          id?: string
          imc?: number | null
          next_eval_date?: string | null
          overall_score?: number | null
          speed_score?: number | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          strength_score?: number | null
          strengths?: string | null
          technique_score?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      external_athletes: {
        Row: {
          category: Database["public"]["Enums"]["athlete_category"] | null
          club_id: string
          club_name: string
          country: string
          created_at: string
          full_name: string
          gender: Database["public"]["Enums"]["athlete_gender"] | null
          id: string
          notes: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_id: string
          club_name: string
          country?: string
          created_at?: string
          full_name: string
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          notes?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_id?: string
          club_name?: string
          country?: string
          created_at?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_athletes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      federation_documents: {
        Row: {
          athlete_id: string
          club_id: string
          created_at: string
          doc_type: string
          file_url: string | null
          id: string
          season: string
          status: string
          submitted_at: string | null
        }
        Insert: {
          athlete_id: string
          club_id: string
          created_at?: string
          doc_type: string
          file_url?: string | null
          id?: string
          season: string
          status?: string
          submitted_at?: string | null
        }
        Update: {
          athlete_id?: string
          club_id?: string
          created_at?: string
          doc_type?: string
          file_url?: string | null
          id?: string
          season?: string
          status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "federation_documents_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "federation_documents_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "federation_documents_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          athlete_id: string | null
          category: string | null
          club_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          payer_email: string | null
          payer_identification: string | null
          payer_name: string | null
          payer_phone: string | null
          payment_status: Database["public"]["Enums"]["transaction_status"]
          receipt_url: string | null
          team_id: string | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount?: number
          athlete_id?: string | null
          category?: string | null
          club_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payer_email?: string | null
          payer_identification?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_status?: Database["public"]["Enums"]["transaction_status"]
          receipt_url?: string | null
          team_id?: string | null
          transaction_date?: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          athlete_id?: string | null
          category?: string | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payer_email?: string | null
          payer_identification?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_status?: Database["public"]["Enums"]["transaction_status"]
          receipt_url?: string | null
          team_id?: string | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_transactions_athlete_id"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_financial_transactions_athlete_id"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          athlete_id: string
          club_id: string
          concept: string
          created_at: string
          created_by: string | null
          due_date: string
          id: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          pdf_url: string | null
          period_month: number
          period_year: number
          sent_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          athlete_id: string
          club_id: string
          concept?: string
          created_at?: string
          created_by?: string | null
          due_date: string
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          period_month: number
          period_year: number
          sent_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          athlete_id?: string
          club_id?: string
          concept?: string
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          period_month?: number
          period_year?: number
          sent_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          agent_ids: string[]
          category: string
          content: string
          created_at: string
          created_by: string | null
          embedding: string | null
          id: string
          is_active: boolean
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agent_ids?: string[]
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agent_ids?: string[]
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          id?: string
          is_active?: boolean
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_documents: {
        Row: {
          chunks_count: number
          club_id: string
          created_at: string
          created_by: string | null
          document_type: string
          file_url: string
          filename: string
          id: string
          indexed_at: string | null
          title: string
        }
        Insert: {
          chunks_count?: number
          club_id: string
          created_at?: string
          created_by?: string | null
          document_type: string
          file_url?: string
          filename: string
          id?: string
          indexed_at?: string | null
          title: string
        }
        Update: {
          chunks_count?: number
          club_id?: string
          created_at?: string
          created_by?: string | null
          document_type?: string
          file_url?: string
          filename?: string
          id?: string
          indexed_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      league_stages: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          league_id: string
          stage_name: string | null
          stage_number: number
          weight_factor: number
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          league_id: string
          stage_name?: string | null
          stage_number: number
          weight_factor?: number
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          league_id?: string
          stage_name?: string | null
          stage_number?: number
          weight_factor?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_stages_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_stages_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      league_standings: {
        Row: {
          athlete_id: string | null
          best_time_seconds: number | null
          category: Database["public"]["Enums"]["athlete_category"]
          external_athlete_id: string | null
          gender: Database["public"]["Enums"]["athlete_gender"] | null
          id: string
          league_id: string
          position: number | null
          races_count: number
          total_points: number
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          best_time_seconds?: number | null
          category: Database["public"]["Enums"]["athlete_category"]
          external_athlete_id?: string | null
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          league_id: string
          position?: number | null
          races_count?: number
          total_points?: number
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          best_time_seconds?: number | null
          category?: Database["public"]["Enums"]["athlete_category"]
          external_athlete_id?: string | null
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          league_id?: string
          position?: number | null
          races_count?: number
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_standings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_standings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_standings_external_athlete_id_fkey"
            columns: ["external_athlete_id"]
            isOneToOne: false
            referencedRelation: "external_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_standings_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          categories: Database["public"]["Enums"]["athlete_category"][]
          club_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          organizer: string
          point_table_id: string | null
          season_year: number
          start_date: string | null
        }
        Insert: {
          categories?: Database["public"]["Enums"]["athlete_category"][]
          club_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          organizer?: string
          point_table_id?: string | null
          season_year?: number
          start_date?: string | null
        }
        Update: {
          categories?: Database["public"]["Enums"]["athlete_category"][]
          club_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organizer?: string
          point_table_id?: string | null
          season_year?: number
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leagues_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leagues_point_table_id_fkey"
            columns: ["point_table_id"]
            isOneToOne: false
            referencedRelation: "point_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_sessions: {
        Row: {
          athlete_id: string
          club_id: string
          created_at: string
          diagnosis: string | null
          follow_up_date: string | null
          id: string
          notes: string | null
          provider_name: string | null
          recorded_by: string | null
          session_date: string
          session_type: string
          status: string
          treatment: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          club_id: string
          created_at?: string
          diagnosis?: string | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          provider_name?: string | null
          recorded_by?: string | null
          session_date?: string
          session_type: string
          status?: string
          treatment?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          club_id?: string
          created_at?: string
          diagnosis?: string | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          provider_name?: string | null
          recorded_by?: string | null
          session_date?: string
          session_type?: string
          status?: string
          treatment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_sessions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_sessions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          club_id: string
          created_at: string
          from_user_id: string
          id: string
          parent_id: string | null
          read_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          subject: string
          to_role: Database["public"]["Enums"]["user_role"] | null
          to_user_id: string | null
        }
        Insert: {
          body: string
          club_id: string
          created_at?: string
          from_user_id: string
          id?: string
          parent_id?: string | null
          read_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject: string
          to_role?: Database["public"]["Enums"]["user_role"] | null
          to_user_id?: string | null
        }
        Update: {
          body?: string
          club_id?: string
          created_at?: string
          from_user_id?: string
          id?: string
          parent_id?: string | null
          read_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string
          to_role?: Database["public"]["Enums"]["user_role"] | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      motivational_phrases: {
        Row: {
          active: boolean
          author: string | null
          category: string
          created_at: string
          id: string
          last_used_at: string | null
          phrase: string
          used_count: number
        }
        Insert: {
          active?: boolean
          author?: string | null
          category?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          phrase: string
          used_count?: number
        }
        Update: {
          active?: boolean
          author?: string | null
          category?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          phrase?: string
          used_count?: number
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          automation_id: string
          body: string
          channel: string
          club_id: string
          id: string
          recipient_id: string | null
          recipient_ref: string | null
          sent_at: string
          status: string
          subject: string | null
        }
        Insert: {
          automation_id: string
          body: string
          channel: string
          club_id: string
          id?: string
          recipient_id?: string | null
          recipient_ref?: string | null
          sent_at?: string
          status?: string
          subject?: string | null
        }
        Update: {
          automation_id?: string
          body?: string
          channel?: string
          club_id?: string
          id?: string
          recipient_id?: string | null
          recipient_ref?: string | null
          sent_at?: string
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          club_id: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_athletes: {
        Row: {
          athlete_id: string
          club_id: string
          created_at: string
          id: string
          parent_user_id: string
        }
        Insert: {
          athlete_id: string
          club_id: string
          created_at?: string
          id?: string
          parent_user_id: string
        }
        Update: {
          athlete_id?: string
          club_id?: string
          created_at?: string
          id?: string
          parent_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_athletes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_athletes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_athletes_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_fitness_tests: {
        Row: {
          athlete_id: string
          bench_press_kg: number | null
          body_fat_pct: number | null
          club_id: string
          cooper_m: number | null
          created_at: string
          created_by: string | null
          evaluator: string | null
          flexibility_cm: number | null
          height_cm: number | null
          id: string
          leg_press_kg: number | null
          max_hr: number | null
          notes: string | null
          plank_sec: number | null
          resting_hr: number | null
          sprint_30m_sec: number | null
          test_date: string
          vo2max: number | null
          weight_kg: number | null
        }
        Insert: {
          athlete_id: string
          bench_press_kg?: number | null
          body_fat_pct?: number | null
          club_id: string
          cooper_m?: number | null
          created_at?: string
          created_by?: string | null
          evaluator?: string | null
          flexibility_cm?: number | null
          height_cm?: number | null
          id?: string
          leg_press_kg?: number | null
          max_hr?: number | null
          notes?: string | null
          plank_sec?: number | null
          resting_hr?: number | null
          sprint_30m_sec?: number | null
          test_date: string
          vo2max?: number | null
          weight_kg?: number | null
        }
        Update: {
          athlete_id?: string
          bench_press_kg?: number | null
          body_fat_pct?: number | null
          club_id?: string
          cooper_m?: number | null
          created_at?: string
          created_by?: string | null
          evaluator?: string | null
          flexibility_cm?: number | null
          height_cm?: number | null
          id?: string
          leg_press_kg?: number | null
          max_hr?: number | null
          notes?: string | null
          plank_sec?: number | null
          resting_hr?: number | null
          sprint_30m_sec?: number | null
          test_date?: string
          vo2max?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "physical_fitness_tests_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_fitness_tests_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physical_fitness_tests_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          created_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      point_tables: {
        Row: {
          competition_type:
            | Database["public"]["Enums"]["competition_type"]
            | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          points_config: Json
          season_year: number
        }
        Insert: {
          competition_type?:
            | Database["public"]["Enums"]["competition_type"]
            | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          points_config?: Json
          season_year?: number
        }
        Update: {
          competition_type?:
            | Database["public"]["Enums"]["competition_type"]
            | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points_config?: Json
          season_year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string
          id: string
          language_code: string
          last_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name?: string
          id: string
          language_code?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string
          id?: string
          language_code?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      race_events: {
        Row: {
          category: Database["public"]["Enums"]["athlete_category"] | null
          club_id: string
          created_at: string
          description: string | null
          distance_m: number | null
          event_type: Database["public"]["Enums"]["race_event_type"]
          id: string
          name: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_id: string
          created_at?: string
          description?: string | null
          distance_m?: number | null
          event_type: Database["public"]["Enums"]["race_event_type"]
          id?: string
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_id?: string
          created_at?: string
          description?: string | null
          distance_m?: number | null
          event_type?: Database["public"]["Enums"]["race_event_type"]
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_cache: {
        Row: {
          count: number
          expires_at: string
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          expires_at?: string
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          expires_at?: string
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      relay_results: {
        Row: {
          created_at: string
          id: string
          points: number | null
          position: number | null
          relay_team_id: string
          result_import_id: string | null
          status: Database["public"]["Enums"]["result_status"]
          time_diff_seconds: number | null
          time_seconds: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number | null
          position?: number | null
          relay_team_id: string
          result_import_id?: string | null
          status?: Database["public"]["Enums"]["result_status"]
          time_diff_seconds?: number | null
          time_seconds?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          points?: number | null
          position?: number | null
          relay_team_id?: string
          result_import_id?: string | null
          status?: Database["public"]["Enums"]["result_status"]
          time_diff_seconds?: number | null
          time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "relay_results_relay_team_id_fkey"
            columns: ["relay_team_id"]
            isOneToOne: false
            referencedRelation: "relay_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_results_result_import_id_fkey"
            columns: ["result_import_id"]
            isOneToOne: false
            referencedRelation: "result_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      relay_team_members: {
        Row: {
          athlete_id: string | null
          external_athlete_id: string | null
          id: string
          leg_order: number
          relay_team_id: string
        }
        Insert: {
          athlete_id?: string | null
          external_athlete_id?: string | null
          id?: string
          leg_order: number
          relay_team_id: string
        }
        Update: {
          athlete_id?: string | null
          external_athlete_id?: string | null
          id?: string
          leg_order?: number
          relay_team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relay_team_members_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_team_members_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_team_members_external_athlete_id_fkey"
            columns: ["external_athlete_id"]
            isOneToOne: false
            referencedRelation: "external_athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_team_members_relay_team_id_fkey"
            columns: ["relay_team_id"]
            isOneToOne: false
            referencedRelation: "relay_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      relay_teams: {
        Row: {
          category: Database["public"]["Enums"]["athlete_category"] | null
          club_name: string
          competition_id: string
          created_at: string
          event_id: string | null
          gender: Database["public"]["Enums"]["athlete_gender"] | null
          id: string
          race_event_id: string | null
          team_name: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_name: string
          competition_id: string
          created_at?: string
          event_id?: string | null
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          race_event_id?: string | null
          team_name?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_name?: string
          competition_id?: string
          created_at?: string
          event_id?: string | null
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          race_event_id?: string | null
          team_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relay_teams_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "competition_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relay_teams_race_event_id_fkey"
            columns: ["race_event_id"]
            isOneToOne: false
            referencedRelation: "race_events"
            referencedColumns: ["id"]
          },
        ]
      }
      result_imports: {
        Row: {
          club_id: string
          competition_id: string | null
          completed_at: string | null
          created_at: string
          error_log: Json | null
          file_name: string | null
          file_type: string
          file_url: string
          id: string
          imported_by: string
          raw_extracted: Json | null
          rows_imported: number
          rows_skipped: number
          rows_total: number
          status: Database["public"]["Enums"]["import_status"]
          validated_data: Json | null
        }
        Insert: {
          club_id: string
          competition_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          file_name?: string | null
          file_type: string
          file_url: string
          id?: string
          imported_by: string
          raw_extracted?: Json | null
          rows_imported?: number
          rows_skipped?: number
          rows_total?: number
          status?: Database["public"]["Enums"]["import_status"]
          validated_data?: Json | null
        }
        Update: {
          club_id?: string
          competition_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          file_name?: string | null
          file_type?: string
          file_url?: string
          id?: string
          imported_by?: string
          raw_extracted?: Json | null
          rows_imported?: number
          rows_skipped?: number
          rows_total?: number
          status?: Database["public"]["Enums"]["import_status"]
          validated_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "result_imports_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_imports_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_campaigns: {
        Row: {
          athlete_id: string
          campaign_type: string
          club_id: string
          escalated_at: string | null
          id: string
          message_sent: string
          period: string
          responded_at: string | null
          response: string | null
          sent_at: string
        }
        Insert: {
          athlete_id: string
          campaign_type?: string
          club_id: string
          escalated_at?: string | null
          id?: string
          message_sent: string
          period: string
          responded_at?: string | null
          response?: string | null
          sent_at?: string
        }
        Update: {
          athlete_id?: string
          campaign_type?: string
          club_id?: string
          escalated_at?: string | null
          id?: string
          message_sent?: string
          period?: string
          responded_at?: string | null
          response?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_campaigns_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_campaigns_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retention_campaigns_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_surveys: {
        Row: {
          answered_at: string | null
          club_id: string
          id: string
          nps_score: number | null
          period: string
          respondent_role: string
          responses: Json
          sent_at: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          club_id: string
          id?: string
          nps_score?: number | null
          period: string
          respondent_role: string
          responses?: Json
          sent_at?: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          club_id?: string
          id?: string
          nps_score?: number | null
          period?: string
          respondent_role?: string
          responses?: Json
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_surveys_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          club_id: string | null
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          operation: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          operation?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          operation?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_log_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      special_event_participants: {
        Row: {
          athlete_id: string
          attended: boolean | null
          club_id: string
          confirmed: boolean
          created_at: string
          event_id: string
          id: string
          notes: string | null
        }
        Insert: {
          athlete_id: string
          attended?: boolean | null
          club_id: string
          confirmed?: boolean
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          athlete_id?: string
          attended?: boolean | null
          club_id?: string
          confirmed?: boolean
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_event_participants_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_event_participants_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_event_participants_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "special_events"
            referencedColumns: ["id"]
          },
        ]
      }
      special_events: {
        Row: {
          club_id: string
          created_at: string
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          is_public: boolean
          location: string | null
          max_participants: number | null
          organized_by: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type: string
          id?: string
          is_public?: boolean
          location?: string | null
          max_participants?: number | null
          organized_by?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_public?: boolean
          location?: string | null
          max_participants?: number | null
          organized_by?: string | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          club_id: string
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
          club_id: string
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
          club_id?: string
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      time_records: {
        Row: {
          athlete_id: string
          club_id: string
          competition_id: string | null
          conditions: string | null
          id: string
          is_club_record: boolean
          is_personal_best: boolean
          notes: string | null
          position: number | null
          race_event_id: string
          recorded_at: string
          recorded_by: string | null
          session_id: string | null
          time_formatted: string | null
          time_ms: number
        }
        Insert: {
          athlete_id: string
          club_id: string
          competition_id?: string | null
          conditions?: string | null
          id?: string
          is_club_record?: boolean
          is_personal_best?: boolean
          notes?: string | null
          position?: number | null
          race_event_id: string
          recorded_at?: string
          recorded_by?: string | null
          session_id?: string | null
          time_formatted?: string | null
          time_ms: number
        }
        Update: {
          athlete_id?: string
          club_id?: string
          competition_id?: string | null
          conditions?: string | null
          id?: string
          is_club_record?: boolean
          is_personal_best?: boolean
          notes?: string | null
          position?: number | null
          race_event_id?: string
          recorded_at?: string
          recorded_by?: string | null
          session_id?: string | null
          time_formatted?: string | null
          time_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "time_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_records_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_records_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_records_race_event_id_fkey"
            columns: ["race_event_id"]
            isOneToOne: false
            referencedRelation: "race_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_attendance: {
        Row: {
          athlete_id: string
          attended: boolean
          check_in_time: string | null
          created_at: string
          id: string
          notes: string | null
          performance_rating: number | null
          training_session_id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          attended?: boolean
          check_in_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          performance_rating?: number | null
          training_session_id: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          attended?: boolean
          check_in_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          performance_rating?: number | null
          training_session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attendance_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
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
          athlete_id: string
          attendance_percentage: number
          avg_performance_score: number | null
          calculated_at: string
          club_id: string
          coach_id: string | null
          id: string
          period_month: string
          sessions_attended: number
          total_hours: number
          total_kilometers: number
          total_sessions: number
          training_type_distribution: Json
        }
        Insert: {
          athlete_id: string
          attendance_percentage?: number
          avg_performance_score?: number | null
          calculated_at?: string
          club_id: string
          coach_id?: string | null
          id?: string
          period_month: string
          sessions_attended?: number
          total_hours?: number
          total_kilometers?: number
          total_sessions?: number
          training_type_distribution?: Json
        }
        Update: {
          athlete_id?: string
          attendance_percentage?: number
          avg_performance_score?: number | null
          calculated_at?: string
          club_id?: string
          coach_id?: string | null
          id?: string
          period_month?: string
          sessions_attended?: number
          total_hours?: number
          total_kilometers?: number
          total_sessions?: number
          training_type_distribution?: Json
        }
        Relationships: [
          {
            foreignKeyName: "training_kpis_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_kpis_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_kpis_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
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
          category: Database["public"]["Enums"]["athlete_category"] | null
          club_id: string
          coach_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          exercises: Json | null
          id: string
          intensity: string | null
          kilometers: number | null
          location: string | null
          max_athletes: number | null
          notes_coach: string | null
          scheduled_at: string
          title: string
          training_type: Database["public"]["Enums"]["training_type"]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_id: string
          coach_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          exercises?: Json | null
          id?: string
          intensity?: string | null
          kilometers?: number | null
          location?: string | null
          max_athletes?: number | null
          notes_coach?: string | null
          scheduled_at: string
          title: string
          training_type?: Database["public"]["Enums"]["training_type"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          club_id?: string
          coach_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          exercises?: Json | null
          id?: string
          intensity?: string | null
          kilometers?: number | null
          location?: string | null
          max_athletes?: number | null
          notes_coach?: string | null
          scheduled_at?: string
          title?: string
          training_type?: Database["public"]["Enums"]["training_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_coach_id_profiles_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          athlete_id: string
          club_id: string
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payer_name: string | null
          period_month: number | null
          period_year: number | null
          receipt_number: string | null
          receipt_url: string | null
          received_by_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          athlete_id: string
          club_id: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payer_name?: string | null
          period_month?: number | null
          period_year?: number | null
          receipt_number?: string | null
          receipt_url?: string | null
          received_by_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          athlete_id?: string
          club_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payer_name?: string | null
          period_month?: number | null
          period_year?: number | null
          receipt_number?: string | null
          receipt_url?: string | null
          received_by_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      ui_translations: {
        Row: {
          created_at: string
          de: string
          en: string
          es: string
          fr: string
          id: string
          it: string
          key: string
          pt: string
        }
        Insert: {
          created_at?: string
          de?: string
          en?: string
          es?: string
          fr?: string
          id?: string
          it?: string
          key: string
          pt?: string
        }
        Update: {
          created_at?: string
          de?: string
          en?: string
          es?: string
          fr?: string
          id?: string
          it?: string
          key?: string
          pt?: string
        }
        Relationships: []
      }
      user_claims: {
        Row: {
          club_id: string | null
          is_active: boolean
          role_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          club_id?: string | null
          is_active?: boolean
          role_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          club_id?: string | null
          is_active?: boolean
          role_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_claims_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          club_id: string
          created_at: string
          document_name: string
          document_type: string
          document_url: string
          id: string
          uploaded_by: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          document_name: string
          document_type: string
          document_url: string
          id?: string
          uploaded_by?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          document_name?: string
          document_type?: string
          document_url?: string
          id?: string
          uploaded_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          club_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          club_id?: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccine_records: {
        Row: {
          athlete_id: string
          club_id: string
          created_at: string
          created_by: string | null
          dose_number: string | null
          expiry_date: string | null
          id: string
          lot_number: string | null
          notes: string | null
          provider: string | null
          vaccine_date: string
          vaccine_name: string
        }
        Insert: {
          athlete_id: string
          club_id: string
          created_at?: string
          created_by?: string | null
          dose_number?: string | null
          expiry_date?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          provider?: string | null
          vaccine_date: string
          vaccine_name: string
        }
        Update: {
          athlete_id?: string
          club_id?: string
          created_at?: string
          created_by?: string | null
          dose_number?: string | null
          expiry_date?: string | null
          id?: string
          lot_number?: string | null
          notes?: string | null
          provider?: string | null
          vaccine_date?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccine_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccine_records_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccine_records_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_log: {
        Row: {
          club_id: string
          errors_count: number
          id: string
          image_source: string | null
          image_url: string | null
          phrase_id: string | null
          recipients_count: number
          sent_at: string
          status: string
        }
        Insert: {
          club_id: string
          errors_count?: number
          id?: string
          image_source?: string | null
          image_url?: string | null
          phrase_id?: string | null
          recipients_count?: number
          sent_at?: string
          status?: string
        }
        Update: {
          club_id?: string
          errors_count?: number
          id?: string
          image_source?: string | null
          image_url?: string | null
          phrase_id?: string | null
          recipients_count?: number
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_log_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_log_phrase_id_fkey"
            columns: ["phrase_id"]
            isOneToOne: false
            referencedRelation: "motivational_phrases"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_subscribers: {
        Row: {
          active: boolean
          athlete_id: string | null
          club_id: string
          created_at: string
          id: string
          name: string | null
          opted_in_at: string
          opted_out_at: string | null
          phone_number: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          athlete_id?: string | null
          club_id: string
          created_at?: string
          id?: string
          name?: string | null
          opted_in_at?: string
          opted_out_at?: string | null
          phone_number: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          athlete_id?: string | null
          club_id?: string
          created_at?: string
          id?: string
          name?: string | null
          opted_in_at?: string
          opted_out_at?: string | null
          phone_number?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_subscribers_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_cv_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_subscribers_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_subscribers_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      athlete_cv_summary: {
        Row: {
          bio: string | null
          category: Database["public"]["Enums"]["athlete_category"] | null
          category_history: Json | null
          city: string | null
          club_entry_date: string | null
          coach_name: string | null
          country: string | null
          date_of_birth: string | null
          department: string | null
          dominant_distances: string[] | null
          email: string | null
          facebook: string | null
          fedepatin_license: string | null
          federation_number: string | null
          first_name: string | null
          gender: Database["public"]["Enums"]["athlete_gender"] | null
          id: string | null
          instagram: string | null
          is_elite_athlete: boolean | null
          is_federated: boolean | null
          is_in_league: boolean | null
          is_national_team: boolean | null
          is_national_team_rep: boolean | null
          last_name: string | null
          level: Database["public"]["Enums"]["athlete_level"] | null
          long_term_goals: string | null
          medals_summary: Json | null
          national_team_years: string | null
          personal_bests: Json | null
          personal_phone: string | null
          personal_values: string | null
          photo_url: string | null
          previous_clubs: Json | null
          short_term_goals: string | null
          specialty: Database["public"]["Enums"]["athlete_specialty"] | null
          tiktok: string | null
          whatsapp: string | null
          world_skate_id: string | null
          years_experience: number | null
          youtube: string | null
        }
        Relationships: []
      }
      wheel_limits_by_category: {
        Row: {
          applies_from_age: number | null
          applies_to_age: number | null
          category_name: string | null
          max_diameter_mm: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _policy_hereda_de_padre: {
        Args: { p_fk: string; p_hija: string; p_padre: string; p_pk?: string }
        Returns: undefined
      }
      athlete_checkin: {
        Args: { p_session_id: string; p_token: string }
        Returns: Json
      }
      athlete_checkin_by_nfc: {
        Args: { p_session_id: string; p_uid: string }
        Returns: Json
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      default_club_id: { Args: never; Returns: string }
      get_athlete_by_checkin_token: { Args: { p_token: string }; Returns: Json }
      get_athlete_by_nfc_uid: { Args: { p_uid: string }; Returns: Json }
      get_club_by_domain: {
        Args: { p_domain: string }
        Returns: {
          id: string
          logo_url: string
          name: string
          primary_color: string
          secondary_color: string
        }[]
      }
      get_financial_summary: { Args: never; Returns: Json }
      get_invoice_summary_by_month: {
        Args: { p_month: number; p_year: number }
        Returns: Json
      }
      get_points_for_position: {
        Args: { p_point_table_id: string; p_position: number }
        Returns: number
      }
      get_user_club_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_wheel_limit_for_age: {
        Args: { p_sport_age: number }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      mark_invoice_paid: {
        Args: { p_invoice_id: string; p_transaction_id?: string }
        Returns: Json
      }
      match_document_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      recalculate_league_positions: {
        Args: { p_league_id: string }
        Returns: undefined
      }
      refresh_document_statuses: { Args: never; Returns: undefined }
      same_club: { Args: { row_club_id: string }; Returns: boolean }
      search_knowledge_base: {
        Args: {
          filter_category?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          content: string
          id: string
          similarity: number
          title: string
        }[]
      }
      set_athlete_nfc_tag: {
        Args: { p_athlete_id: string; p_tag_uid: string }
        Returns: Json
      }
      user_club_id: { Args: never; Returns: string }
    }
    Enums: {
      athlete_category:
        | "escuela"
        | "menores"
        | "transicion"
        | "prejuvenil"
        | "juvenil"
        | "mayores"
        | "preclub"
        | "adultos"
      athlete_gender: "masculino" | "femenino"
      athlete_level:
        | "escuela"
        | "escuela_menores"
        | "transicion"
        | "pre_juvenil"
        | "juvenil_primer_ano"
        | "juvenil_segundo_ano"
        | "juvenil_tercer_ano"
        | "mayores"
        | "mayores_unica"
      athlete_registration_type: "ligado" | "federado" | "escuela" | "nuevo"
      athlete_specialty: "fondista" | "velocista" | "omnium"
      athlete_status: "active" | "inactive" | "suspended"
      award_scheme_type: "clasico" | "resolucion_061" | "personalizado"
      competition_type:
        | "distrital"
        | "nacional"
        | "panamericano"
        | "maraton"
        | "internacional"
        | "regional"
      document_type:
        | "certificado_medico"
        | "poliza_seguro"
        | "contrato"
        | "autorizacion_imagen"
        | "autorizacion_menor"
        | "carta_permiso_colegio"
        | "carnet_deportista"
        | "planilla_inscripcion"
        | "recibo_pago"
        | "otro"
        | "documento_identidad"
        | "tarjeta_eps"
        | "registro_civil"
        | "licencia_fedepatin"
        | "certificado_medico_deportivo"
        | "consentimiento_imagen"
        | "firma_digital"
        | "medical"
        | "contract"
        | "other"
      equipment_status: "available" | "assigned" | "maintenance" | "retired"
      equipment_type:
        | "patin"
        | "bicicleta"
        | "casco"
        | "chaleco"
        | "proteccion"
        | "uniforme"
        | "otro"
      evaluation_status: "pending" | "completed" | "reviewed"
      import_status:
        | "pending"
        | "extracted"
        | "validated"
        | "imported"
        | "failed"
      message_status: "sent" | "read" | "archived"
      race_event_type:
        | "contra_reloj"
        | "corta_distancia"
        | "medio_fondo"
        | "fondo"
        | "maraton"
        | "puntos"
        | "eliminacion"
        | "combinada"
        | "relevos"
      resolution_type:
        | "resultado"
        | "sancion"
        | "protesta"
        | "acta"
        | "inscripcion"
        | "otro"
      result_status: "normal" | "dsq" | "dns" | "dnf"
      study_level: "primaria" | "secundaria" | "universidad" | "carrera_tecnica"
      training_type: "regular" | "bicicleta" | "cortesia"
      transaction_status: "pending" | "paid" | "overdue" | "cancelled"
      transaction_type:
        | "mensualidad"
        | "poliza_deportiva"
        | "anualidad"
        | "psicologia"
        | "otro"
        | "prendas_deportivas"
        | "inscripcion_competencia"
        | "competition_district"
        | "competition_departmental"
        | "competition_marathon"
        | "competition_panamerican"
        | "competition_interleague"
        | "accident_insurance"
        | "league_registration_renewal"
        | "federation_registration_renewal"
        | "registration_fee"
        | "equipment"
        | "travel"
        | "other"
      user_role:
        | "admin"
        | "leader"
        | "coach"
        | "delegate"
        | "finance"
        | "athlete"
        | "parent"
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
        "escuela",
        "menores",
        "transicion",
        "prejuvenil",
        "juvenil",
        "mayores",
        "preclub",
        "adultos",
      ],
      athlete_gender: ["masculino", "femenino"],
      athlete_level: [
        "escuela",
        "escuela_menores",
        "transicion",
        "pre_juvenil",
        "juvenil_primer_ano",
        "juvenil_segundo_ano",
        "juvenil_tercer_ano",
        "mayores",
        "mayores_unica",
      ],
      athlete_registration_type: ["ligado", "federado", "escuela", "nuevo"],
      athlete_specialty: ["fondista", "velocista", "omnium"],
      athlete_status: ["active", "inactive", "suspended"],
      award_scheme_type: ["clasico", "resolucion_061", "personalizado"],
      competition_type: [
        "distrital",
        "nacional",
        "panamericano",
        "maraton",
        "internacional",
        "regional",
      ],
      document_type: [
        "certificado_medico",
        "poliza_seguro",
        "contrato",
        "autorizacion_imagen",
        "autorizacion_menor",
        "carta_permiso_colegio",
        "carnet_deportista",
        "planilla_inscripcion",
        "recibo_pago",
        "otro",
        "documento_identidad",
        "tarjeta_eps",
        "registro_civil",
        "licencia_fedepatin",
        "certificado_medico_deportivo",
        "consentimiento_imagen",
        "firma_digital",
        "medical",
        "contract",
        "other",
      ],
      equipment_status: ["available", "assigned", "maintenance", "retired"],
      equipment_type: [
        "patin",
        "bicicleta",
        "casco",
        "chaleco",
        "proteccion",
        "uniforme",
        "otro",
      ],
      evaluation_status: ["pending", "completed", "reviewed"],
      import_status: [
        "pending",
        "extracted",
        "validated",
        "imported",
        "failed",
      ],
      message_status: ["sent", "read", "archived"],
      race_event_type: [
        "contra_reloj",
        "corta_distancia",
        "medio_fondo",
        "fondo",
        "maraton",
        "puntos",
        "eliminacion",
        "combinada",
        "relevos",
      ],
      resolution_type: [
        "resultado",
        "sancion",
        "protesta",
        "acta",
        "inscripcion",
        "otro",
      ],
      result_status: ["normal", "dsq", "dns", "dnf"],
      study_level: ["primaria", "secundaria", "universidad", "carrera_tecnica"],
      training_type: ["regular", "bicicleta", "cortesia"],
      transaction_status: ["pending", "paid", "overdue", "cancelled"],
      transaction_type: [
        "mensualidad",
        "poliza_deportiva",
        "anualidad",
        "psicologia",
        "otro",
        "prendas_deportivas",
        "inscripcion_competencia",
        "competition_district",
        "competition_departmental",
        "competition_marathon",
        "competition_panamerican",
        "competition_interleague",
        "accident_insurance",
        "league_registration_renewal",
        "federation_registration_renewal",
        "registration_fee",
        "equipment",
        "travel",
        "other",
      ],
      user_role: [
        "admin",
        "leader",
        "coach",
        "delegate",
        "finance",
        "athlete",
        "parent",
      ],
    },
  },
} as const
