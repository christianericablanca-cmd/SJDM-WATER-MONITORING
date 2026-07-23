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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_official: boolean
          source: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_official?: boolean
          source?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_official?: boolean
          source?: string
          title?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          contact: string | null
          created_at: string
          description: string
          id: string
          identifier: string | null
          page: string | null
          resolved: boolean
        }
        Insert: {
          contact?: string | null
          created_at?: string
          description: string
          id?: string
          identifier?: string | null
          page?: string | null
          resolved?: boolean
        }
        Update: {
          contact?: string | null
          created_at?: string
          description?: string
          id?: string
          identifier?: string | null
          page?: string | null
          resolved?: boolean
        }
        Relationships: []
      }
      business_claims: {
        Row: {
          address: string
          barangay: string
          category: string
          contact: string | null
          coverage_area: string | null
          created_at: string
          delivery_available: boolean | null
          estimated_fee: string | null
          facebook: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          operating_hours: string | null
          photo_url: string | null
          status: string
          submitted_by_session: string
        }
        Insert: {
          address: string
          barangay: string
          category: string
          contact?: string | null
          coverage_area?: string | null
          created_at?: string
          delivery_available?: boolean | null
          estimated_fee?: string | null
          facebook?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          operating_hours?: string | null
          photo_url?: string | null
          status?: string
          submitted_by_session: string
        }
        Update: {
          address?: string
          barangay?: string
          category?: string
          contact?: string | null
          coverage_area?: string | null
          created_at?: string
          delivery_available?: boolean | null
          estimated_fee?: string | null
          facebook?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          operating_hours?: string | null
          photo_url?: string | null
          status?: string
          submitted_by_session?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          address: string
          barangay: string
          category: string
          claimed_by: string | null
          contact: string | null
          coverage_area: string | null
          created_at: string
          delivery_available: boolean | null
          delivery_schedule: string | null
          estimated_fee: string | null
          facebook: string | null
          id: string
          last_verified: string | null
          latitude: number | null
          longitude: number | null
          name: string
          operating_hours: string | null
          payment_options: string | null
          photo_url: string | null
          verified: boolean
        }
        Insert: {
          address: string
          barangay: string
          category: string
          claimed_by?: string | null
          contact?: string | null
          coverage_area?: string | null
          created_at?: string
          delivery_available?: boolean | null
          delivery_schedule?: string | null
          estimated_fee?: string | null
          facebook?: string | null
          id?: string
          last_verified?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          operating_hours?: string | null
          payment_options?: string | null
          photo_url?: string | null
          verified?: boolean
        }
        Update: {
          address?: string
          barangay?: string
          category?: string
          claimed_by?: string | null
          contact?: string | null
          coverage_area?: string | null
          created_at?: string
          delivery_available?: boolean | null
          delivery_schedule?: string | null
          estimated_fee?: string | null
          facebook?: string | null
          id?: string
          last_verified?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          operating_hours?: string | null
          payment_options?: string | null
          photo_url?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          address: string | null
          category: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          messenger: string | null
          name: string
          phone: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          messenger?: string | null
          name: string
          phone?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          messenger?: string | null
          name?: string
          phone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string
          id: string
          identifier: string
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          identifier: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      report_confirmations: {
        Row: {
          created_at: string
          id: string
          report_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_confirmations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_sequence: {
        Row: {
          id: number
          last_value: number
        }
        Insert: {
          id?: number
          last_value?: number
        }
        Update: {
          id?: number
          last_value?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          barangay: string
          confirmation_count: number
          created_at: string
          denied: boolean | null
          denied_reason: string | null
          description: string | null
          id: string
          issue_type: string
          latitude: number
          longitude: number
          photo_url: string | null
          report_id_display: string
          resolved_at: string | null
          started_at: string
          status: string
          street_sitio: string | null
          updated_at: string
          user_id: string | null
          verified: boolean
          water_provider: string
        }
        Insert: {
          barangay: string
          confirmation_count?: number
          created_at?: string
          denied?: boolean | null
          denied_reason?: string | null
          description?: string | null
          id?: string
          issue_type: string
          latitude: number
          longitude: number
          photo_url?: string | null
          report_id_display: string
          resolved_at?: string | null
          started_at: string
          status?: string
          street_sitio?: string | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          water_provider?: string
        }
        Update: {
          barangay?: string
          confirmation_count?: number
          created_at?: string
          denied?: boolean | null
          denied_reason?: string | null
          description?: string | null
          id?: string
          issue_type?: string
          latitude?: number
          longitude?: number
          photo_url?: string | null
          report_id_display?: string
          resolved_at?: string | null
          started_at?: string
          status?: string
          street_sitio?: string | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          water_provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rate_limits: { Args: never; Returns: undefined }
      get_next_report_sequence: { Args: never; Returns: number }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
