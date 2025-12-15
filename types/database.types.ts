/**
 * Database types generated from Supabase
 * Run: npx supabase gen types typescript --project-id <your-project-id> > types/database.types.ts
 * Or use the Supabase CLI to generate these automatically
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
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          kind: 'agency' | 'client'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          kind?: 'agency' | 'client'
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

