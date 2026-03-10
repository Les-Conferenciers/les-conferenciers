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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      google_reviews: {
        Row: {
          author_name: string
          author_photo_url: string | null
          avatar_color: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          relative_time: string | null
          review_date: string | null
          updated_at: string
        }
        Insert: {
          author_name: string
          author_photo_url?: string | null
          avatar_color?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          relative_time?: string | null
          review_date?: string | null
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_photo_url?: string | null
          avatar_color?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          relative_time?: string | null
          review_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proposal_speakers: {
        Row: {
          agency_commission: number | null
          created_at: string
          display_order: number | null
          id: string
          proposal_id: string
          selected_conference_ids: string[] | null
          speaker_fee: number | null
          speaker_id: string
          total_price: number | null
          travel_costs: number | null
        }
        Insert: {
          agency_commission?: number | null
          created_at?: string
          display_order?: number | null
          id?: string
          proposal_id: string
          selected_conference_ids?: string[] | null
          speaker_fee?: number | null
          speaker_id: string
          total_price?: number | null
          travel_costs?: number | null
        }
        Update: {
          agency_commission?: number | null
          created_at?: string
          display_order?: number | null
          id?: string
          proposal_id?: string
          selected_conference_ids?: string[] | null
          speaker_fee?: number | null
          speaker_id?: string
          total_price?: number | null
          travel_costs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_speakers_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          client_email: string
          client_name: string
          created_at: string
          expires_at: string
          id: string
          message: string | null
          recipient_name: string | null
          sent_at: string | null
          status: string
          token: string
        }
        Insert: {
          client_email: string
          client_name: string
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Update: {
          client_email?: string
          client_name?: string
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string
          author_title: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          speaker_id: string
        }
        Insert: {
          author_name: string
          author_title?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          speaker_id: string
        }
        Update: {
          author_name?: string
          author_title?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          speaker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      simulator_leads: {
        Row: {
          additional_info: string | null
          audience_size: string | null
          budget: string | null
          created_at: string
          email: string
          event_type: string | null
          first_name: string
          id: string
          last_name: string
          location: string | null
          objective: string | null
          suggested_speakers: string[] | null
          themes: string[] | null
        }
        Insert: {
          additional_info?: string | null
          audience_size?: string | null
          budget?: string | null
          created_at?: string
          email: string
          event_type?: string | null
          first_name: string
          id?: string
          last_name: string
          location?: string | null
          objective?: string | null
          suggested_speakers?: string[] | null
          themes?: string[] | null
        }
        Update: {
          additional_info?: string | null
          audience_size?: string | null
          budget?: string | null
          created_at?: string
          email?: string
          event_type?: string | null
          first_name?: string
          id?: string
          last_name?: string
          location?: string | null
          objective?: string | null
          suggested_speakers?: string[] | null
          themes?: string[] | null
        }
        Relationships: []
      }
      speaker_conferences: {
        Row: {
          bonus: string | null
          bullet_points: string[] | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          speaker_id: string
          title: string
        }
        Insert: {
          bonus?: string | null
          bullet_points?: string[] | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          speaker_id: string
          title: string
        }
        Update: {
          bonus?: string | null
          bullet_points?: string[] | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          speaker_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaker_conferences_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      speakers: {
        Row: {
          archived: boolean
          base_fee: number | null
          biography: string | null
          city: string | null
          created_at: string
          featured: boolean | null
          gender: string | null
          id: string
          image_url: string | null
          key_points: string[] | null
          languages: string[] | null
          meta_description: string | null
          name: string
          role: string | null
          seo_title: string | null
          slug: string
          specialty: string | null
          themes: string[] | null
          updated_at: string
          video_url: string | null
          why_expertise: string | null
          why_impact: string | null
        }
        Insert: {
          archived?: boolean
          base_fee?: number | null
          biography?: string | null
          city?: string | null
          created_at?: string
          featured?: boolean | null
          gender?: string | null
          id?: string
          image_url?: string | null
          key_points?: string[] | null
          languages?: string[] | null
          meta_description?: string | null
          name: string
          role?: string | null
          seo_title?: string | null
          slug: string
          specialty?: string | null
          themes?: string[] | null
          updated_at?: string
          video_url?: string | null
          why_expertise?: string | null
          why_impact?: string | null
        }
        Update: {
          archived?: boolean
          base_fee?: number | null
          biography?: string | null
          city?: string | null
          created_at?: string
          featured?: boolean | null
          gender?: string | null
          id?: string
          image_url?: string | null
          key_points?: string[] | null
          languages?: string[] | null
          meta_description?: string | null
          name?: string
          role?: string | null
          seo_title?: string | null
          slug?: string
          specialty?: string | null
          themes?: string[] | null
          updated_at?: string
          video_url?: string | null
          why_expertise?: string | null
          why_impact?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
