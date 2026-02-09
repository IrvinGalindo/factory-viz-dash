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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          acknowledged_notes: string | null
          alert_id: string
          alert_type: string
          column_name: string | null
          created_at: string
          deviation: number
          item: string | null
          lower_limit: number
          machine_id: string
          measurement_index: number
          nominal: number
          process_id: string
          process_number: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_notes: string | null
          result_process_id: string
          severity: string | null
          status: string | null
          upper_limit: number
          value: number
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledged_notes?: string | null
          alert_id?: string
          alert_type: string
          column_name?: string | null
          created_at?: string
          deviation: number
          item?: string | null
          lower_limit: number
          machine_id: string
          measurement_index: number
          nominal: number
          process_id: string
          process_number?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_notes?: string | null
          result_process_id: string
          severity?: string | null
          status?: string | null
          upper_limit: number
          value: number
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledged_notes?: string | null
          alert_id?: string
          alert_type?: string
          column_name?: string | null
          created_at?: string
          deviation?: number
          item?: string | null
          lower_limit?: number
          machine_id?: string
          measurement_index?: number
          nominal?: number
          process_id?: string
          process_number?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_notes?: string | null
          result_process_id?: string
          severity?: string | null
          status?: string | null
          upper_limit?: number
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "alerts_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["machine_id"]
          },
          {
            foreignKeyName: "alerts_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["process_id"]
          },
          {
            foreignKeyName: "alerts_result_process_id_fkey"
            columns: ["result_process_id"]
            isOneToOne: false
            referencedRelation: "result_process"
            referencedColumns: ["result_process_id"]
          },
        ]
      }
      machines: {
        Row: {
          cmm_name: string | null
          created_at: string
          line: string | null
          machine_id: string
          process: string | null
        }
        Insert: {
          cmm_name?: string | null
          created_at?: string
          line?: string | null
          machine_id?: string
          process?: string | null
        }
        Update: {
          cmm_name?: string | null
          created_at?: string
          line?: string | null
          machine_id?: string
          process?: string | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          created_at: string
          measurements: Json | null
          process_id: string
          result_process_id: string | null
        }
        Insert: {
          created_at?: string
          measurements?: Json | null
          process_id?: string
          result_process_id?: string | null
        }
        Update: {
          created_at?: string
          measurements?: Json | null
          process_id?: string
          result_process_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processes_result_process_id_fkey"
            columns: ["result_process_id"]
            isOneToOne: false
            referencedRelation: "result_process"
            referencedColumns: ["result_process_id"]
          },
        ]
      }
      profile: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string | null
          emp_id: string | null
          id: string
          inspector_name: string
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          emp_id?: string | null
          id?: string
          inspector_name: string
          phone?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string | null
          emp_id?: string | null
          id?: string
          inspector_name?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      result_process: {
        Row: {
          created_at: string
          date: string | null
          inspector_name: string | null
          machine_id: string
          result_process_id: string
          turn: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          inspector_name?: string | null
          machine_id: string
          result_process_id?: string
          turn?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          inspector_name?: string | null
          machine_id?: string
          result_process_id?: string
          turn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "result_process_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["machine_id"]
          },
        ]
      }
      smart_flows_chat_history: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      spc_statistics: {
        Row: {
          created_at: string | null
          id: string
          measurement_name: string
          result_process_id: string
          stats: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          measurement_name: string
          result_process_id: string
          stats: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          measurement_name?: string
          result_process_id?: string
          stats?: Json
        }
        Relationships: [
          {
            foreignKeyName: "spc_statistics_result_process_id_fkey"
            columns: ["result_process_id"]
            isOneToOne: false
            referencedRelation: "result_process"
            referencedColumns: ["result_process_id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "engineer" | "inspector"
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
      app_role: ["admin", "engineer", "inspector"],
    },
  },
} as const
