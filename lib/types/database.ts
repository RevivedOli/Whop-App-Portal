export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_config: {
        Row: {
          assistant_name: string
          avatar_url: string | null
          client_id: string
          created_at: string | null
          id: string
          prompt: string | null
          updated_at: string | null
        }
        Insert: {
          assistant_name?: string
          avatar_url?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          prompt?: string | null
          updated_at?: string | null
        }
        Update: {
          assistant_name?: string
          avatar_url?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          prompt?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      knowledge_modules: {
        Row: {
          chapter_count: number | null
          client_id: string
          created_at: string | null
          id: string
          is_start_here: boolean | null
          title: string
          total_count: number | null
          trained_count: number | null
          updated_at: string | null
        }
        Insert: {
          chapter_count?: number | null
          client_id: string
          created_at?: string | null
          id?: string
          is_start_here?: boolean | null
          title: string
          total_count?: number | null
          trained_count?: number | null
          updated_at?: string | null
        }
        Update: {
          chapter_count?: number | null
          client_id?: string
          created_at?: string | null
          id?: string
          is_start_here?: boolean | null
          title?: string
          total_count?: number | null
          trained_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_modules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          client_id: string
          created_at: string | null
          has_ai_access: boolean | null
          id: string
          is_onboarded: boolean | null
          last_updated: string | null
          name: string | null
          profile_tags: string[] | null
          updated_at: string | null
          username: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          has_ai_access?: boolean | null
          id?: string
          is_onboarded?: boolean | null
          last_updated?: string | null
          name?: string | null
          profile_tags?: string[] | null
          updated_at?: string | null
          username: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          has_ai_access?: boolean | null
          id?: string
          is_onboarded?: boolean | null
          last_updated?: string | null
          name?: string | null
          profile_tags?: string[] | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          client_id: string
          conversations: number | null
          created_at: string | null
          end_date: string
          id: string
          start_date: string
          status: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          conversations?: number | null
          created_at?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          conversations?: number | null
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      welcome_config: {
        Row: {
          client_id: string
          created_at: string | null
          disclaimer: string | null
          id: string
          primary_color: string | null
          questions_intro: string | null
          show_disclaimer: boolean | null
          show_questions_intro: boolean | null
          show_welcome: boolean | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          disclaimer?: string | null
          id?: string
          primary_color?: string | null
          questions_intro?: string | null
          show_disclaimer?: boolean | null
          show_questions_intro?: boolean | null
          show_welcome?: boolean | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          disclaimer?: string | null
          id?: string
          primary_color?: string | null
          questions_intro?: string | null
          show_disclaimer?: boolean | null
          show_questions_intro?: boolean | null
          show_welcome?: boolean | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "welcome_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

