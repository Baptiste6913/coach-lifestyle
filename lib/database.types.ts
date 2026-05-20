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
      exercise_1rm_history: {
        Row: {
          created_at: string
          estimated: boolean
          exercise_id: string
          id: string
          notes: string | null
          one_rm_kg: number
          source: string
          user_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          estimated?: boolean
          exercise_id: string
          id?: string
          notes?: string | null
          one_rm_kg: number
          source?: string
          user_id: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          estimated?: boolean
          exercise_id?: string
          id?: string
          notes?: string | null
          one_rm_kg?: number
          source?: string
          user_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_1rm_history_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_sets: {
        Row: {
          completed_at: string
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          prescribed_set_id: string | null
          program_exercise_id: string | null
          reps: number
          rest_seconds_actual: number | null
          rpe: number | null
          set_index: number
          user_id: string
          weight_kg: number
          workout_session_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          prescribed_set_id?: string | null
          program_exercise_id?: string | null
          reps: number
          rest_seconds_actual?: number | null
          rpe?: number | null
          set_index: number
          user_id: string
          weight_kg: number
          workout_session_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          prescribed_set_id?: string | null
          program_exercise_id?: string | null
          reps?: number
          rest_seconds_actual?: number | null
          rpe?: number | null
          set_index?: number
          user_id?: string
          weight_kg?: number
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_sets_prescribed_set_id_fkey"
            columns: ["prescribed_set_id"]
            isOneToOne: false
            referencedRelation: "prescribed_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_sets_program_exercise_id_fkey"
            columns: ["program_exercise_id"]
            isOneToOne: false
            referencedRelation: "program_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_sets_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: Database["public"]["Enums"]["exercise_category"]
          created_at: string
          equipment: string | null
          id: string
          name: string
          notes: string | null
          primary_muscle: string
          secondary_muscles: Json
          slug: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["exercise_category"]
          created_at?: string
          equipment?: string | null
          id?: string
          name: string
          notes?: string | null
          primary_muscle: string
          secondary_muscles?: Json
          slug: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["exercise_category"]
          created_at?: string
          equipment?: string | null
          id?: string
          name?: string
          notes?: string | null
          primary_muscle?: string
          secondary_muscles?: Json
          slug?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      prescribed_sets: {
        Row: {
          created_at: string
          id: string
          is_warmup: boolean
          program_exercise_id: string
          rpe_target: number | null
          set_index: number
          target_pct_of_working: number
          target_reps_high: number
          target_reps_low: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_warmup?: boolean
          program_exercise_id: string
          rpe_target?: number | null
          set_index: number
          target_pct_of_working: number
          target_reps_high: number
          target_reps_low: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_warmup?: boolean
          program_exercise_id?: string
          rpe_target?: number | null
          set_index?: number
          target_pct_of_working?: number
          target_reps_high?: number
          target_reps_low?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescribed_sets_program_exercise_id_fkey"
            columns: ["program_exercise_id"]
            isOneToOne: false
            referencedRelation: "program_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      program_exercises: {
        Row: {
          created_at: string
          execution_cues: string | null
          exercise_id: string
          id: string
          is_pyramidal: boolean
          notes: string | null
          order_index: number
          program_session_id: string
          rest_seconds_override: number | null
          superset_group: string | null
          superset_position: number | null
          target_reps_high: number
          target_reps_low: number
          target_sets: number
          user_id: string
          warmup_protocol: string | null
          working_weight_kg: number | null
        }
        Insert: {
          created_at?: string
          execution_cues?: string | null
          exercise_id: string
          id?: string
          is_pyramidal?: boolean
          notes?: string | null
          order_index: number
          program_session_id: string
          rest_seconds_override?: number | null
          superset_group?: string | null
          superset_position?: number | null
          target_reps_high: number
          target_reps_low: number
          target_sets: number
          user_id: string
          warmup_protocol?: string | null
          working_weight_kg?: number | null
        }
        Update: {
          created_at?: string
          execution_cues?: string | null
          exercise_id?: string
          id?: string
          is_pyramidal?: boolean
          notes?: string | null
          order_index?: number
          program_session_id?: string
          rest_seconds_override?: number | null
          superset_group?: string | null
          superset_position?: number | null
          target_reps_high?: number
          target_reps_low?: number
          target_sets?: number
          user_id?: string
          warmup_protocol?: string | null
          working_weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_exercises_program_session_id_fkey"
            columns: ["program_session_id"]
            isOneToOne: false
            referencedRelation: "program_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      program_sessions: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          name: string
          notes: string | null
          order_index: number
          program_id: string
          target_sets_total: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          name: string
          notes?: string | null
          order_index: number
          program_id: string
          target_sets_total?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          name?: string
          notes?: string | null
          order_index?: number
          program_id?: string
          target_sets_total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          duration_weeks: number | null
          frequency_per_week: number
          id: string
          name: string
          notes: string | null
          phase: string | null
          protected_params: Json
          raw_text: string | null
          started_at: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          duration_weeks?: number | null
          frequency_per_week: number
          id?: string
          name: string
          notes?: string | null
          phase?: string | null
          protected_params?: Json
          raw_text?: string | null
          started_at?: string | null
          updated_at?: string
          user_id: string
          version: number
        }
        Update: {
          created_at?: string
          duration_weeks?: number | null
          frequency_per_week?: number
          id?: string
          name?: string
          notes?: string | null
          phase?: string | null
          protected_params?: Json
          raw_text?: string | null
          started_at?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          bodyweight_kg: number | null
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          pre_workout_caffeine_mg: number | null
          pre_workout_rhr_bpm: number | null
          program_session_id: string | null
          session_date: string
          started_at: string
          status: Database["public"]["Enums"]["workout_status"]
          subjective_energy_1_10: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bodyweight_kg?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          pre_workout_caffeine_mg?: number | null
          pre_workout_rhr_bpm?: number | null
          program_session_id?: string | null
          session_date?: string
          started_at?: string
          status?: Database["public"]["Enums"]["workout_status"]
          subjective_energy_1_10?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bodyweight_kg?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          pre_workout_caffeine_mg?: number | null
          pre_workout_rhr_bpm?: number | null
          program_session_id?: string | null
          session_date?: string
          started_at?: string
          status?: Database["public"]["Enums"]["workout_status"]
          subjective_energy_1_10?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_program_session_id_fkey"
            columns: ["program_session_id"]
            isOneToOne: false
            referencedRelation: "program_sessions"
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
      exercise_category: "compound" | "isolation"
      workout_status: "in_progress" | "completed" | "abandoned"
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
      exercise_category: ["compound", "isolation"],
      workout_status: ["in_progress", "completed", "abandoned"],
    },
  },
} as const
