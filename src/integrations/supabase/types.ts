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
      clients: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          siret: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          siret?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          siret?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_signed_received_at: string | null
          contract_lines: Json | null
          created_at: string
          discount_percent: number | null
          event_date: string | null
          event_description: string | null
          event_format: string | null
          event_location: string | null
          event_time: string | null
          id: string
          proposal_id: string
          signed_at: string | null
          signer_ip: string | null
          signer_name: string | null
          status: string
          token: string | null
        }
        Insert: {
          client_signed_received_at?: string | null
          contract_lines?: Json | null
          created_at?: string
          discount_percent?: number | null
          event_date?: string | null
          event_description?: string | null
          event_format?: string | null
          event_location?: string | null
          event_time?: string | null
          id?: string
          proposal_id: string
          signed_at?: string | null
          signer_ip?: string | null
          signer_name?: string | null
          status?: string
          token?: string | null
        }
        Update: {
          client_signed_received_at?: string | null
          contract_lines?: Json | null
          created_at?: string
          discount_percent?: number | null
          event_date?: string | null
          event_description?: string | null
          event_format?: string | null
          event_location?: string | null
          event_time?: string | null
          id?: string
          proposal_id?: string
          signed_at?: string | null
          signer_ip?: string | null
          signer_name?: string | null
          status?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: true
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          arrival_info: string | null
          audience_size: string | null
          bdc_number: string | null
          client_deposit_paid_at: string | null
          client_invoice_paid_at: string | null
          client_invoice_sent_at: string | null
          conference_duration: string | null
          conference_title: string | null
          contact_on_site_email: string | null
          contact_on_site_name: string | null
          contact_on_site_phone: string | null
          contract_sent_speaker_at: string | null
          created_at: string
          dress_code: string | null
          event_date: string | null
          event_title: string | null
          hotel_info: string | null
          id: string
          info_sent_speaker_at: string | null
          liaison_sheet_sent_at: string | null
          logistics_info: string | null
          notes: string | null
          parking_info: string | null
          proposal_id: string
          room_setup: string | null
          selected_speaker_id: string | null
          speaker_acknowledgment_at: string | null
          speaker_budget: number | null
          speaker_deposit_paid_at: string | null
          speaker_paid_at: string | null
          speaker_signed_contract_at: string | null
          special_requests: string | null
          tech_needs: string | null
          theme: string | null
          updated_at: string
          visio_date: string | null
          visio_notes: string | null
          visio_time: string | null
        }
        Insert: {
          arrival_info?: string | null
          audience_size?: string | null
          bdc_number?: string | null
          client_deposit_paid_at?: string | null
          client_invoice_paid_at?: string | null
          client_invoice_sent_at?: string | null
          conference_duration?: string | null
          conference_title?: string | null
          contact_on_site_email?: string | null
          contact_on_site_name?: string | null
          contact_on_site_phone?: string | null
          contract_sent_speaker_at?: string | null
          created_at?: string
          dress_code?: string | null
          event_date?: string | null
          event_title?: string | null
          hotel_info?: string | null
          id?: string
          info_sent_speaker_at?: string | null
          liaison_sheet_sent_at?: string | null
          logistics_info?: string | null
          notes?: string | null
          parking_info?: string | null
          proposal_id: string
          room_setup?: string | null
          selected_speaker_id?: string | null
          speaker_acknowledgment_at?: string | null
          speaker_budget?: number | null
          speaker_deposit_paid_at?: string | null
          speaker_paid_at?: string | null
          speaker_signed_contract_at?: string | null
          special_requests?: string | null
          tech_needs?: string | null
          theme?: string | null
          updated_at?: string
          visio_date?: string | null
          visio_notes?: string | null
          visio_time?: string | null
        }
        Update: {
          arrival_info?: string | null
          audience_size?: string | null
          bdc_number?: string | null
          client_deposit_paid_at?: string | null
          client_invoice_paid_at?: string | null
          client_invoice_sent_at?: string | null
          conference_duration?: string | null
          conference_title?: string | null
          contact_on_site_email?: string | null
          contact_on_site_name?: string | null
          contact_on_site_phone?: string | null
          contract_sent_speaker_at?: string | null
          created_at?: string
          dress_code?: string | null
          event_date?: string | null
          event_title?: string | null
          hotel_info?: string | null
          id?: string
          info_sent_speaker_at?: string | null
          liaison_sheet_sent_at?: string | null
          logistics_info?: string | null
          notes?: string | null
          parking_info?: string | null
          proposal_id?: string
          room_setup?: string | null
          selected_speaker_id?: string | null
          speaker_acknowledgment_at?: string | null
          speaker_budget?: number | null
          speaker_deposit_paid_at?: string | null
          speaker_paid_at?: string | null
          speaker_signed_contract_at?: string | null
          special_requests?: string | null
          tech_needs?: string | null
          theme?: string | null
          updated_at?: string
          visio_date?: string | null
          visio_notes?: string | null
          visio_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: true
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_selected_speaker_id_fkey"
            columns: ["selected_speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
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
      invoices: {
        Row: {
          amount_ht: number
          amount_ttc: number
          contract_id: string | null
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          invoice_type: string
          paid_at: string | null
          proposal_id: string
          sent_at: string | null
          status: string
          tva_rate: number
        }
        Insert: {
          amount_ht: number
          amount_ttc: number
          contract_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_type?: string
          paid_at?: string | null
          proposal_id: string
          sent_at?: string | null
          status?: string
          tva_rate?: number
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number
          contract_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string
          paid_at?: string | null
          proposal_id?: string
          sent_at?: string | null
          status?: string
          tva_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
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
      proposal_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string
          id: string
          note: string | null
          proposal_id: string
          status: string
          task_type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date: string
          id?: string
          note?: string | null
          proposal_id: string
          status?: string
          task_type?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string
          id?: string
          note?: string | null
          proposal_id?: string
          status?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_tasks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_templates: {
        Row: {
          created_at: string
          id: string
          is_preset: boolean
          name: string
          speaker_ids: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          is_preset?: boolean
          name: string
          speaker_ids?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          is_preset?: boolean
          name?: string
          speaker_ids?: string[]
        }
        Relationships: []
      }
      proposals: {
        Row: {
          accepted_at: string | null
          audience_size: string | null
          client_email: string
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          email_body: string | null
          email_subject: string | null
          event_date_text: string | null
          event_location: string | null
          expires_at: string
          id: string
          lost_at: string | null
          lost_reason: string | null
          message: string | null
          proposal_type: string
          recipient_name: string | null
          reminder1_sent_at: string | null
          reminder2_sent_at: string | null
          sent_at: string | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          audience_size?: string | null
          client_email: string
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          email_body?: string | null
          email_subject?: string | null
          event_date_text?: string | null
          event_location?: string | null
          expires_at?: string
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          message?: string | null
          proposal_type?: string
          recipient_name?: string | null
          reminder1_sent_at?: string | null
          reminder2_sent_at?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          audience_size?: string | null
          client_email?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          email_body?: string | null
          email_subject?: string | null
          event_date_text?: string | null
          event_location?: string | null
          expires_at?: string
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          message?: string | null
          proposal_type?: string
          recipient_name?: string | null
          reminder1_sent_at?: string | null
          reminder2_sent_at?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
          company: string | null
          created_at: string
          email: string
          event_date: string | null
          event_type: string | null
          first_name: string
          id: string
          last_name: string
          lead_type: string
          location: string | null
          objective: string | null
          phone: string | null
          suggested_speakers: string[] | null
          themes: string[] | null
        }
        Insert: {
          additional_info?: string | null
          audience_size?: string | null
          budget?: string | null
          company?: string | null
          created_at?: string
          email: string
          event_date?: string | null
          event_type?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_type?: string
          location?: string | null
          objective?: string | null
          phone?: string | null
          suggested_speakers?: string[] | null
          themes?: string[] | null
        }
        Update: {
          additional_info?: string | null
          audience_size?: string | null
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string
          event_date?: string | null
          event_type?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_type?: string
          location?: string | null
          objective?: string | null
          phone?: string | null
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
          agent_email: string | null
          agent_name: string | null
          agent_phone: string | null
          archived: boolean
          base_fee: number | null
          biography: string | null
          city: string | null
          created_at: string
          display_order: number | null
          email: string | null
          featured: boolean | null
          featured_order: number | null
          fee_details: string | null
          formal_address: boolean | null
          gender: string | null
          id: string
          image_position: string | null
          image_url: string | null
          interview_only: boolean | null
          key_points: string[] | null
          languages: string[] | null
          meta_description: string | null
          name: string
          phone: string | null
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
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          archived?: boolean
          base_fee?: number | null
          biography?: string | null
          city?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          featured?: boolean | null
          featured_order?: number | null
          fee_details?: string | null
          formal_address?: boolean | null
          gender?: string | null
          id?: string
          image_position?: string | null
          image_url?: string | null
          interview_only?: boolean | null
          key_points?: string[] | null
          languages?: string[] | null
          meta_description?: string | null
          name: string
          phone?: string | null
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
          agent_email?: string | null
          agent_name?: string | null
          agent_phone?: string | null
          archived?: boolean
          base_fee?: number | null
          biography?: string | null
          city?: string | null
          created_at?: string
          display_order?: number | null
          email?: string | null
          featured?: boolean | null
          featured_order?: number | null
          fee_details?: string | null
          formal_address?: boolean | null
          gender?: string | null
          id?: string
          image_position?: string | null
          image_url?: string | null
          interview_only?: boolean | null
          key_points?: string[] | null
          languages?: string[] | null
          meta_description?: string | null
          name?: string
          phone?: string | null
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
      generate_invoice_number: { Args: never; Returns: string }
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
