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
      file_uploads: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_hash: string
          file_size: number | null
          filename: string
          id: string
          inspection_date: string | null
          inspector_name: string | null
          machine_id: string | null
          machine_name: string | null
          original_filename: string | null
          processed_at: string | null
          processing_status: string | null
          qr_code: string | null
          shift: string | null
          updated_at: string | null
          upload_timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_hash: string
          file_size?: number | null
          filename: string
          id?: string
          inspection_date?: string | null
          inspector_name?: string | null
          machine_id?: string | null
          machine_name?: string | null
          original_filename?: string | null
          processed_at?: string | null
          processing_status?: string | null
          qr_code?: string | null
          shift?: string | null
          updated_at?: string | null
          upload_timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_hash?: string
          file_size?: number | null
          filename?: string
          id?: string
          inspection_date?: string | null
          inspector_name?: string | null
          machine_id?: string | null
          machine_name?: string | null
          original_filename?: string | null
          processed_at?: string | null
          processing_status?: string | null
          qr_code?: string | null
          shift?: string | null
          updated_at?: string | null
          upload_timestamp?: string | null
        }
        Relationships: []
      }
      line_estadistics: {
        Row: {
          date: string | null
          id: number
          inspector: string | null
          line_values: Json | null
          machine_name: string
          turn: string | null
        }
        Insert: {
          date?: string | null
          id?: number
          inspector?: string | null
          line_values?: Json | null
          machine_name: string
          turn?: string | null
        }
        Update: {
          date?: string | null
          id?: number
          inspector?: string | null
          line_values?: Json | null
          machine_name?: string
          turn?: string | null
        }
        Relationships: []
      }
      machines: {
        Row: {
          created_at: string
          machine_id: string
          machine_name: string | null
          process: string | null
          qr_code: string | null
        }
        Insert: {
          created_at?: string
          machine_id?: string
          machine_name?: string | null
          process?: string | null
          qr_code?: string | null
        }
        Update: {
          created_at?: string
          machine_id?: string
          machine_name?: string | null
          process?: string | null
          qr_code?: string | null
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
          column_name: string | null
          created_at: string
          item: string | null
          process_id: string
          process_number: string | null
          result_process_id: string | null
          value: number | null
        }
        Insert: {
          column_name?: string | null
          created_at?: string
          item?: string | null
          process_id?: string
          process_number?: string | null
          result_process_id?: string | null
          value?: number | null
        }
        Update: {
          column_name?: string | null
          created_at?: string
          item?: string | null
          process_id?: string
          process_number?: string | null
          result_process_id?: string | null
          value?: number | null
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
      spc_statistics: {
        Row: {
          avg: number | null
          calculation_method: string | null
          cp: number | null
          cpk: number | null
          created_at: string | null
          id: number
          lcl: number | null
          max: number | null
          measurement_name: string
          min: number | null
          result_process_id: string
          sample_count: number | null
          spec: string | null
          std: number | null
          ucl: number | null
        }
        Insert: {
          avg?: number | null
          calculation_method?: string | null
          cp?: number | null
          cpk?: number | null
          created_at?: string | null
          id?: number
          lcl?: number | null
          max?: number | null
          measurement_name: string
          min?: number | null
          result_process_id: string
          sample_count?: number | null
          spec?: string | null
          std?: number | null
          ucl?: number | null
        }
        Update: {
          avg?: number | null
          calculation_method?: string | null
          cp?: number | null
          cpk?: number | null
          created_at?: string | null
          id?: number
          lcl?: number | null
          max?: number | null
          measurement_name?: string
          min?: number | null
          result_process_id?: string
          sample_count?: number | null
          spec?: string | null
          std?: number | null
          ucl?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_spc_stats: {
        Args: {
          p_column_type: string
          p_date: string
          p_item: string
          p_machine_name: string
          p_process_number: number
          p_shift: string
        }
        Returns: Json
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
