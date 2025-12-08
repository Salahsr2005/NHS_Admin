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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applicants: {
        Row: {
          address: string | null
          age: number | null
          avatar_url: string | null
          created_at: string
          education: Json | null
          email: string
          experience: Json | null
          full_name: string
          gender: string | null
          id: string
          phone: string | null
          rating: number | null
          skills: Json | null
          updated_at: string
          wilaya: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          education?: Json | null
          email: string
          experience?: Json | null
          full_name: string
          gender?: string | null
          id?: string
          phone?: string | null
          rating?: number | null
          skills?: Json | null
          updated_at?: string
          wilaya?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          education?: Json | null
          email?: string
          experience?: Json | null
          full_name?: string
          gender?: string | null
          id?: string
          phone?: string | null
          rating?: number | null
          skills?: Json | null
          updated_at?: string
          wilaya?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          applicant_id: string
          applied_at: string
          cover_letter: string | null
          cv_url: string | null
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          applied_at?: string
          cover_letter?: string | null
          cv_url?: string | null
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          applied_at?: string
          cover_letter?: string | null
          cv_url?: string | null
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          image_url: string | null
          job_type: Database["public"]["Enums"]["job_type"]
          location: string
          max_applicants: number | null
          salary_range: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          job_type?: Database["public"]["Enums"]["job_type"]
          location: string
          max_applicants?: number | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          job_type?: Database["public"]["Enums"]["job_type"]
          location?: string
          max_applicants?: number | null
          salary_range?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_update_application_status: {
        Args: { application_ids: string[]; new_status: string }
        Returns: {
          message: string
          success: boolean
          updated_count: number
        }[]
      }
      get_all_jobs_with_counts: {
        Args: never
        Returns: {
          created_at: string
          deadline: string
          description: string
          id: string
          image_url: string
          is_deadline_passed: boolean
          job_type: string
          location: string
          max_applicants: number
          salary_range: string
          status: string
          title: string
          total_applications: number
        }[]
      }
      get_applicants_for_job: {
        Args: { job_id_param: string }
        Returns: {
          age: number
          applicant_id: string
          application_id: string
          application_status: string
          applied_at: string
          avatar_url: string
          cover_letter: string
          cv_url: string
          education: Json
          email: string
          experience: Json
          full_name: string
          gender: string
          phone: string
          rating: number
          skills: Json
          wilaya: string
        }[]
      }
      get_dashboard_stats: {
        Args: never
        Returns: {
          accepted_applications: number
          applications_this_month: number
          applications_this_week: number
          applications_today: number
          closed_jobs: number
          open_jobs: number
          pending_applications: number
          rejected_applications: number
          reviewing_applications: number
          shortlisted_applications: number
          total_applicants: number
          total_applications: number
          total_jobs: number
        }[]
      }
      get_job_demographics: {
        Args: { job_id_param: string }
        Returns: {
          avg_age: number
          female_count: number
          male_count: number
          top_wilaya: string
          total_applicants: number
          wilaya_distribution: Json
        }[]
      }
      get_job_with_stats: {
        Args: { job_id_param: string }
        Returns: {
          accepted_count: number
          created_at: string
          deadline: string
          description: string
          id: string
          image_url: string
          job_type: string
          location: string
          max_applicants: number
          pending_count: number
          rejected_count: number
          reviewing_count: number
          salary_range: string
          shortlisted_count: number
          status: string
          title: string
          total_applications: number
        }[]
      }
      get_recent_applications: {
        Args: { limit_count?: number }
        Returns: {
          applicant_avatar_url: string
          applicant_email: string
          applicant_id: string
          applicant_name: string
          application_id: string
          applied_at: string
          job_id: string
          job_title: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_applicants_filtered: {
        Args: {
          filter_gender?: string
          filter_wilaya?: string
          max_age?: number
          min_age?: number
          min_rating?: number
          search_term?: string
        }
        Returns: {
          age: number
          avatar_url: string
          email: string
          full_name: string
          gender: string
          id: string
          phone: string
          rating: number
          skills: Json
          total_applications: number
          wilaya: string
        }[]
      }
      update_application_status: {
        Args: { application_id_param: string; new_status: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      application_status:
        | "pending"
        | "reviewing"
        | "shortlisted"
        | "rejected"
        | "accepted"
      job_status: "open" | "closed" | "on_hold"
      job_type: "full_time" | "part_time" | "contract" | "internship" | "remote"
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
      app_role: ["admin", "user"],
      application_status: [
        "pending",
        "reviewing",
        "shortlisted",
        "rejected",
        "accepted",
      ],
      job_status: ["open", "closed", "on_hold"],
      job_type: ["full_time", "part_time", "contract", "internship", "remote"],
    },
  },
} as const
