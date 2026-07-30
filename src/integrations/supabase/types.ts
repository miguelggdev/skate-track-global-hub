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
      athlete_body_info: {
        Row: {
          accident_insurance: string | null
          allergies: string | null
          athlete_id: string
          blood_type: string | null
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
          created_at: string
          display_order: number
          id: string
          image_url: string
        }
        Insert: {
          athlete_id: string
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
        }
        Update: {
          athlete_id?: string
          caption?: string | null
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
        ]
      }
      athlete_history: {
        Row: {
          achievements_text: string | null
          athlete_id: string
          category_history: Json
          club_entry_date: string | null
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
      athletes: {
        Row: {
          accident_insurance: string | null
          address: string | null
          allergies: string | null
          athlete_number: string | null
          bio: string | null
          blood_type: string | null
          category: Database["public"]["Enums"]["athlete_category"]
          city: string | null
          city_of_birth: string | null
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
          last_name: string
          level: Database["public"]["Enums"]["athlete_level"]
          long_term_goals: string | null
          lycra_size: string | null
          main_discipline: string | null
          nationality: string | null
          neighborhood: string | null
          notes: string | null
          performance_score: number
          personal_phone: string | null
          personal_values: string | null
          photo_url: string | null
          physical_limitations: string | null
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
          city?: string | null
          city_of_birth?: string | null
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
          last_name: string
          level?: Database["public"]["Enums"]["athlete_level"]
          long_term_goals?: string | null
          lycra_size?: string | null
          main_discipline?: string | null
          nationality?: string | null
          neighborhood?: string | null
          notes?: string | null
          performance_score?: number
          personal_phone?: string | null
          personal_values?: string | null
          photo_url?: string | null
          physical_limitations?: string | null
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
          city?: string | null
          city_of_birth?: string | null
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
          last_name?: string
          level?: Database["public"]["Enums"]["athlete_level"]
          long_term_goals?: string | null
          lycra_size?: string | null
          main_discipline?: string | null
          nationality?: string | null
          neighborhood?: string | null
          notes?: string | null
          performance_score?: number
          personal_phone?: string | null
          personal_values?: string | null
          photo_url?: string | null
          physical_limitations?: string | null
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
        Relationships: []
      }
      attendance: {
        Row: {
          athlete_id: string
          id: string
          notes: string | null
          recorded_at: string
          session_id: string
          status: string
        }
        Insert: {
          athlete_id: string
          id?: string
          notes?: string | null
          recorded_at?: string
          session_id: string
          status?: string
        }
        Update: {
          athlete_id?: string
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
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_attendance: {
        Row: {
          id: string
          training_session_id: string
          athlete_id: string
          attended: boolean
          performance_rating: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          training_session_id: string
          athlete_id: string
          attended?: boolean
          performance_rating?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          training_session_id?: string
          athlete_id?: string
          attended?: boolean
          performance_rating?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attendance_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_attendance_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
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
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          performed_at?: string
          performed_by?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      awards: {
        Row: {
          athlete_id: string
          award_date: string
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
          club_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          club_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          club_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
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
          created_at?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: []
      }
      competition_events: {
        Row: {
          category: Database["public"]["Enums"]["athlete_category"] | null
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
        Relationships: []
      }
      courtesy_classes: {
        Row: {
          address: string | null
          age: number | null
          class_date: string
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
        Relationships: []
      }
      document_templates: {
        Row: {
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
        Relationships: []
      }
      documents: {
        Row: {
          athlete_id: string | null
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
          title: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          athlete_id?: string | null
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
            foreignKeyName: "documents_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          id: string
          athlete_id: string | null
          team_id: string | null
          amount: number
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          payment_status: Database["public"]["Enums"]["transaction_status"]
          transaction_date: string
          due_date: string | null
          description: string | null
          payer_name: string | null
          payer_phone: string | null
          payer_email: string | null
          notes: string | null
          category: string | null
          receipt_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          athlete_id?: string | null
          team_id?: string | null
          amount: number
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          payment_status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string
          due_date?: string | null
          description?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payer_email?: string | null
          notes?: string | null
          category?: string | null
          receipt_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string | null
          team_id?: string | null
          amount?: number
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          payment_status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string
          due_date?: string | null
          description?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payer_email?: string | null
          notes?: string | null
          category?: string | null
          receipt_url?: string | null
          created_by?: string | null
          created_at?: string
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
        ]
      }
      equipment: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          brand: string | null
          chassis_size: string | null
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
        ]
      }
      equipment_maintenance: {
        Row: {
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
        ]
      }
      external_athletes: {
        Row: {
          category: Database["public"]["Enums"]["athlete_category"] | null
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
          club_name?: string
          country?: string
          created_at?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["athlete_gender"] | null
          id?: string
          notes?: string | null
        }
        Relationships: []
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
        ]
      }
      messages: {
        Row: {
          body: string
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
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
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
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
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
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      race_events: {
        Row: {
          category: Database["public"]["Enums"]["athlete_category"] | null
          created_at: string
          description: string | null
          distance_m: number | null
          event_type: Database["public"]["Enums"]["race_event_type"]
          id: string
          name: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          created_at?: string
          description?: string | null
          distance_m?: number | null
          event_type: Database["public"]["Enums"]["race_event_type"]
          id?: string
          name: string
        }
        Update: {
          category?: Database["public"]["Enums"]["athlete_category"] | null
          created_at?: string
          description?: string | null
          distance_m?: number | null
          event_type?: Database["public"]["Enums"]["race_event_type"]
          id?: string
          name?: string
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
            foreignKeyName: "result_imports_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      special_event_participants: {
        Row: {
          athlete_id: string
          attended: boolean | null
          confirmed: boolean
          created_at: string
          event_id: string
          id: string
          notes: string | null
        }
        Insert: {
          athlete_id: string
          attended?: boolean | null
          confirmed?: boolean
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          athlete_id?: string
          attended?: boolean | null
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
      time_records: {
        Row: {
          athlete_id: string
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
      training_kpis: {
        Row: {
          athlete_id: string
          attendance_percentage: number
          avg_performance_score: number | null
          calculated_at: string
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
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          athlete_id: string
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
    }
    Functions: {
      get_points_for_position: {
        Args: { p_point_table_id: string; p_position: number }
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
      recalculate_league_positions: {
        Args: { p_league_id: string }
        Returns: undefined
      }
      refresh_document_statuses: { Args: never; Returns: undefined }
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
      athlete_specialty: "fondista" | "velocista" | "omnium"
      athlete_status: "active" | "inactive" | "suspended"
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
        | "other"
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
      user_role:
        | "admin"
        | "leader"
        | "coach"
        | "delegate"
        | "finance"
        | "athlete"
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
      athlete_specialty: ["fondista", "velocista", "omnium"],
      athlete_status: ["active", "inactive", "suspended"],
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
        "other",
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
      ],
      user_role: ["admin", "leader", "coach", "delegate", "finance", "athlete"],
    },
  },
} as const
