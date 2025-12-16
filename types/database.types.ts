/**
 * Database types generated from Supabase
 * Use this to fix "type never" errors permanently
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string
          name: string
          kind: 'agency' | 'client'
          clerk_org_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          kind: 'agency' | 'client'
          clerk_org_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          kind?: 'agency' | 'client'
          clerk_org_id?: string | null
          created_at?: string
        }
      }
      org_members: {
        Row: {
          org_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
        }
        Insert: {
          org_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Update: {
          org_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
        }
      }
      agency_clients: {
        Row: {
          agency_org_id: string
          client_org_id: string
          created_at: string
        }
        Insert: {
          agency_org_id: string
          client_org_id: string
          created_at?: string
        }
        Update: {
          agency_org_id?: string
          client_org_id?: string
          created_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          org_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          user_id: string
          full_name: string | null
          active_org_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name?: string | null
          active_org_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          full_name?: string | null
          active_org_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          org_id: string
          title: string
          summary: string | null
          period_start: string | null
          period_end: string | null
          status: 'draft' | 'published'
          client_visible: boolean
          created_by: string
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          summary?: string | null
          period_start?: string | null
          period_end?: string | null
          status?: 'draft' | 'published'
          client_visible?: boolean
          created_by: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          summary?: string | null
          period_start?: string | null
          period_end?: string | null
          status?: 'draft' | 'published'
          client_visible?: boolean
          created_by?: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      report_sections: {
        Row: {
          id: string
          report_id: string
          section_type: string
          title: string | null
          content: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          section_type: string
          title?: string | null
          content?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          section_type?: string
          title?: string | null
          content?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      metrics: {
        Row: {
          id: string
          org_id: string
          period_start: string
          period_end: string
          leads: number
          spend: number
          revenue: number
          website_traffic: number
          conversions: number
          cpl: number | null
          roas: number | null
          conversion_rate: number | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          period_start: string
          period_end: string
          leads?: number
          spend?: number
          revenue?: number
          website_traffic?: number
          conversions?: number
          cpl?: number | null
          roas?: number | null
          conversion_rate?: number | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          period_start?: string
          period_end?: string
          leads?: number
          spend?: number
          revenue?: number
          website_traffic?: number
          conversions?: number
          cpl?: number | null
          roas?: number | null
          conversion_rate?: number | null
          created_by?: string
          created_at?: string
        }
      }
      deliverables: {
        Row: {
          id: string
          org_id: string
          title: string
          type: string
          description: string | null
          due_date: string | null
          status: 'draft' | 'in_review' | 'approved' | 'delivered'
          client_visible: boolean
          created_by: string
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          type: string
          description?: string | null
          due_date?: string | null
          status?: 'draft' | 'in_review' | 'approved' | 'delivered'
          client_visible?: boolean
          created_by: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          type?: string
          description?: string | null
          due_date?: string | null
          status?: 'draft' | 'in_review' | 'approved' | 'delivered'
          client_visible?: boolean
          created_by?: string
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deliverable_assets: {
        Row: {
          id: string
          deliverable_id: string
          name: string
          url: string
          type: string
          size: number | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          deliverable_id: string
          name: string
          url: string
          type: string
          size?: number | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          deliverable_id?: string
          name?: string
          url?: string
          type?: string
          size?: number | null
          created_by?: string
          created_at?: string
        }
      }
      deliverable_comments: {
        Row: {
          id: string
          deliverable_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          deliverable_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          deliverable_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      onboarding_flows: {
        Row: {
          id: string
          org_id: string
          name: string
          status: 'draft' | 'published' | 'archived'
          version: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          status?: 'draft' | 'published' | 'archived'
          version?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          status?: 'draft' | 'published' | 'archived'
          version?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_nodes: {
        Row: {
          id: string
          flow_id: string
          type: string
          title: string
          description: string | null
          required: boolean
          config: Json
          position: Json
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          flow_id: string
          type: string
          title: string
          description?: string | null
          required?: boolean
          config?: Json
          position?: Json
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          flow_id?: string
          type?: string
          title?: string
          description?: string | null
          required?: boolean
          config?: Json
          position?: Json
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_edges: {
        Row: {
          id: string
          flow_id: string
          source_node_id: string
          target_node_id: string
          condition: string | null
          created_at: string
        }
        Insert: {
          id?: string
          flow_id: string
          source_node_id: string
          target_node_id: string
          condition?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          flow_id?: string
          source_node_id?: string
          target_node_id?: string
          condition?: string | null
          created_at?: string
        }
      }
      onboarding_progress: {
        Row: {
          id: string
          org_id: string
          user_id: string
          node_id: string
          status: string
          completed_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          node_id: string
          status?: string
          completed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          node_id?: string
          status?: string
          completed_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      contract_signatures: {
        Row: {
          id: string
          org_id: string
          user_id: string
          node_id: string
          signed_name: string
          signature_image_url: string
          contract_sha256: string | null
          terms_version: string | null
          privacy_version: string | null
          ip: string | null
          user_agent: string | null
          signed_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          node_id: string
          signed_name: string
          signature_image_url: string
          contract_sha256?: string | null
          terms_version?: string | null
          privacy_version?: string | null
          ip?: string | null
          user_agent?: string | null
          signed_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          node_id?: string
          signed_name?: string
          signature_image_url?: string
          contract_sha256?: string | null
          terms_version?: string | null
          privacy_version?: string | null
          ip?: string | null
          user_agent?: string | null
          signed_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          org_id: string
          client_user_id: string | null
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          client_user_id?: string | null
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          client_user_id?: string | null
          title?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          org_id: string
          author_user_id: string
          author_role: 'agency' | 'client'
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          org_id: string
          author_user_id: string
          author_role: 'agency' | 'client'
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          org_id?: string
          author_user_id?: string
          author_role?: 'agency' | 'client'
          body?: string
          created_at?: string
        }
      }
      message_reads: {
        Row: {
          conversation_id: string
          user_id: string
          last_read_at: string
        }
        Insert: {
          conversation_id: string
          user_id: string
          last_read_at?: string
        }
        Update: {
          conversation_id?: string
          user_id?: string
          last_read_at?: string
        }
      }
      roadmap_items: {
        Row: {
          id: string
          org_id: string
          title: string
          description: string | null
          status: 'planned' | 'in_progress' | 'completed'
          quarter: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          description?: string | null
          status?: 'planned' | 'in_progress' | 'completed'
          quarter?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          description?: string | null
          status?: 'planned' | 'in_progress' | 'completed'
          quarter?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      weekly_updates: {
        Row: {
          id: string
          org_id: string
          title: string
          content: string
          status: 'draft' | 'published'
          client_visible: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          content: string
          status?: 'draft' | 'published'
          client_visible?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          content?: string
          status?: 'draft' | 'published'
          client_visible?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      portal_settings: {
        Row: {
          id: string
          org_id: string
          brand_color: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          brand_color?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          brand_color?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      client_portal_config: {
        Row: {
          org_id: string
          services: Json
          dashboard_layout: Json
          onboarding_enabled: boolean
          updated_at: string
        }
        Insert: {
          org_id: string
          services?: Json
          dashboard_layout?: Json
          onboarding_enabled?: boolean
          updated_at?: string
        }
        Update: {
          org_id?: string
          services?: Json
          dashboard_layout?: Json
          onboarding_enabled?: boolean
          updated_at?: string
        }
      }
      onboarding_items: {
        Row: {
          id: string
          org_id: string
          title: string
          description: string | null
          type: 'doc' | 'form' | 'contract' | 'connect' | 'payment' | 'call'
          required: boolean
          url: string | null
          file_url: string | null
          sort_order: number
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          description?: string | null
          type: 'doc' | 'form' | 'contract' | 'connect' | 'payment' | 'call'
          required?: boolean
          url?: string | null
          file_url?: string | null
          sort_order?: number
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          description?: string | null
          type?: 'doc' | 'form' | 'contract' | 'connect' | 'payment' | 'call'
          required?: boolean
          url?: string | null
          file_url?: string | null
          sort_order?: number
          published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      org_kind: 'agency' | 'client'
      member_role: 'owner' | 'admin' | 'member'
    }
  }
}