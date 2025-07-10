export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      athletes: {
        Row: {
          achievements: string | null
          athlete_number: string | null
          category: Database["public"]["Enums"]["athlete_category"]
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
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
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
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
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
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
            isOneToOne: false
            referencedRelation: "profiles"
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
      financial_transactions: {
        Row: {
          amount: number
          athlete_id: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string
          id: string
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
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      athlete_category: "youth" | "junior" | "senior" | "masters"
      athlete_level: "beginner" | "intermediate" | "advanced" | "professional"
      athlete_status: "active" | "inactive" | "injured" | "suspended"
      competition_status: "upcoming" | "ongoing" | "completed" | "cancelled"
      payment_status: "pending" | "paid" | "overdue" | "cancelled"
      training_type: "technical" | "physical" | "mental" | "recovery"
      transaction_type:
        | "registration_fee"
        | "equipment"
        | "travel"
        | "coaching"
        | "other"
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
      athlete_category: ["youth", "junior", "senior", "masters"],
      athlete_level: ["beginner", "intermediate", "advanced", "professional"],
      athlete_status: ["active", "inactive", "injured", "suspended"],
      competition_status: ["upcoming", "ongoing", "completed", "cancelled"],
      payment_status: ["pending", "paid", "overdue", "cancelled"],
      training_type: ["technical", "physical", "mental", "recovery"],
      transaction_type: [
        "registration_fee",
        "equipment",
        "travel",
        "coaching",
        "other",
      ],
      user_role: ["admin", "coach", "athlete", "delegate", "leader", "finance"],
    },
  },
} as const
