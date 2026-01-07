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
      clients: {
        Row: {
          company_slug: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
          whop_company_id: string | null
        }
        Insert: {
          company_slug?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
          whop_company_id?: string | null
        }
        Update: {
          company_slug?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
          whop_company_id?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          chapter_id: string | null
          company_slug: string | null
          course_id: string | null
          created_at: string | null
          embed_id: string | null
          embed_type: string | null
          error_message: string | null
          experience_id: string | null
          id: number
          lesson_id: string | null
          lesson_summary_pdf: string | null
          lesson_url: string | null
          metadata: Json | null
          playback_id: string | null
          signed_video_playback_url: string | null
          status: string | null
          title: string | null
          trained_at: string | null
          transcription_file: string | null
          updated_at: string | null
          video_id: string | null
          video_source_type: string | null
          webhook_error: string | null
          webhook_sent_at: string | null
          webhook_status: string | null
          whop_company_id: string
        }
        Insert: {
          chapter_id?: string | null
          company_slug?: string | null
          course_id?: string | null
          created_at?: string | null
          embed_id?: string | null
          embed_type?: string | null
          error_message?: string | null
          experience_id?: string | null
          id?: number
          lesson_id?: string | null
          lesson_summary_pdf?: string | null
          lesson_url?: string | null
          metadata?: Json | null
          playback_id?: string | null
          signed_video_playback_url?: string | null
          status?: string | null
          title?: string | null
          trained_at?: string | null
          transcription_file?: string | null
          updated_at?: string | null
          video_id?: string | null
          video_source_type?: string | null
          webhook_error?: string | null
          webhook_sent_at?: string | null
          webhook_status?: string | null
          whop_company_id: string
        }
        Update: {
          chapter_id?: string | null
          company_slug?: string | null
          course_id?: string | null
          created_at?: string | null
          embed_id?: string | null
          embed_type?: string | null
          error_message?: string | null
          experience_id?: string | null
          id?: number
          lesson_id?: string | null
          lesson_summary_pdf?: string | null
          lesson_url?: string | null
          metadata?: Json | null
          playback_id?: string | null
          signed_video_playback_url?: string | null
          status?: string | null
          title?: string | null
          trained_at?: string | null
          transcription_file?: string | null
          updated_at?: string | null
          video_id?: string | null
          video_source_type?: string | null
          webhook_error?: string | null
          webhook_sent_at?: string | null
          webhook_status?: string | null
          whop_company_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          assistant_name: string | null
          created_at: string | null
          disclaimer_text: string | null
          id: number
          installed_at: string | null
          is_active: boolean | null
          is_read: boolean | null
          logo_url: string | null
          message: string | null
          metadata: Json | null
          notification_tool_enabled: boolean | null
          notification_tool_output: string | null
          notification_tool_trigger: string | null
          pre_onboarding_message: string | null
          primary_color: string | null
          profiling_tool_data_fields: string | null
          profiling_tool_description: string | null
          profiling_tool_enabled: boolean | null
          questions_intro_message: string | null
          read_at: string | null
          read_by: string | null
          reengage_prompt: string | null
          show_disclaimer: boolean | null
          show_pre_onboarding: boolean | null
          show_questions_intro: boolean | null
          show_welcome: boolean | null
          title: string | null
          type: string | null
          uninstalled_at: string | null
          updated_at: string | null
          welcome_message: string | null
          welcome_message_audio_url: string | null
          whop_company_id: string
        }
        Insert: {
          assistant_name?: string | null
          created_at?: string | null
          disclaimer_text?: string | null
          id?: number
          installed_at?: string | null
          is_active?: boolean | null
          is_read?: boolean | null
          logo_url?: string | null
          message?: string | null
          metadata?: Json | null
          notification_tool_enabled?: boolean | null
          notification_tool_output?: string | null
          notification_tool_trigger?: string | null
          pre_onboarding_message?: string | null
          primary_color?: string | null
          profiling_tool_data_fields?: string | null
          profiling_tool_description?: string | null
          profiling_tool_enabled?: boolean | null
          questions_intro_message?: string | null
          read_at?: string | null
          read_by?: string | null
          reengage_prompt?: string | null
          show_disclaimer?: boolean | null
          show_pre_onboarding?: boolean | null
          show_questions_intro?: boolean | null
          show_welcome?: boolean | null
          title?: string | null
          type?: string | null
          uninstalled_at?: string | null
          updated_at?: string | null
          welcome_message?: string | null
          welcome_message_audio_url?: string | null
          whop_company_id: string
        }
        Update: {
          assistant_name?: string | null
          created_at?: string | null
          disclaimer_text?: string | null
          id?: number
          installed_at?: string | null
          is_active?: boolean | null
          is_read?: boolean | null
          logo_url?: string | null
          message?: string | null
          metadata?: Json | null
          notification_tool_enabled?: boolean | null
          notification_tool_output?: string | null
          notification_tool_trigger?: string | null
          pre_onboarding_message?: string | null
          primary_color?: string | null
          profiling_tool_data_fields?: string | null
          profiling_tool_description?: string | null
          profiling_tool_enabled?: boolean | null
          questions_intro_message?: string | null
          read_at?: string | null
          read_by?: string | null
          reengage_prompt?: string | null
          show_disclaimer?: boolean | null
          show_pre_onboarding?: boolean | null
          show_questions_intro?: boolean | null
          show_welcome?: boolean | null
          title?: string | null
          type?: string | null
          uninstalled_at?: string | null
          updated_at?: string | null
          welcome_message?: string | null
          welcome_message_audio_url?: string | null
          whop_company_id?: string
        }
        Relationships: []
      }
      profile_recommendations: {
        Row: {
          created_at: string | null
          id: number
          lesson_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          lesson_id: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          lesson_id?: string
          profile_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          characteristics: string | null
          created_at: string | null
          id: number
          name: string
          tag: string | null
          updated_at: string | null
          whop_company_id: string
        }
        Insert: {
          characteristics?: string | null
          created_at?: string | null
          id?: number
          name: string
          tag?: string | null
          updated_at?: string | null
          whop_company_id: string
        }
        Update: {
          characteristics?: string | null
          created_at?: string | null
          id?: number
          name?: string
          tag?: string | null
          updated_at?: string | null
          whop_company_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          date_range_end: string | null
          date_range_start: string | null
          error_message: string | null
          id: number
          report_data: Json | null
          report_summary: string | null
          report_type: string | null
          status: string | null
          title: string | null
          total_conversations: number | null
          whop_company_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          error_message?: string | null
          id?: number
          report_data?: Json | null
          report_summary?: string | null
          report_type?: string | null
          status?: string | null
          title?: string | null
          total_conversations?: number | null
          whop_company_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          date_range_end?: string | null
          date_range_start?: string | null
          error_message?: string | null
          id?: number
          report_data?: Json | null
          report_summary?: string | null
          report_type?: string | null
          status?: string | null
          title?: string | null
          total_conversations?: number | null
          whop_company_id?: string
        }
        Relationships: []
      }
      user_profile_matches: {
        Row: {
          id: number
          is_primary: boolean | null
          manually_set: boolean | null
          match_percentage: number | null
          matched_at: string | null
          profile_id: number
          reason: string | null
          whop_company_id: string
          whop_profile: string
        }
        Insert: {
          id?: number
          is_primary?: boolean | null
          manually_set?: boolean | null
          match_percentage?: number | null
          matched_at?: string | null
          profile_id: number
          reason?: string | null
          whop_company_id: string
          whop_profile: string
        }
        Update: {
          id?: number
          is_primary?: boolean | null
          manually_set?: boolean | null
          match_percentage?: number | null
          matched_at?: string | null
          profile_id?: number
          reason?: string | null
          whop_company_id?: string
          whop_profile?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_matches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          access_to_ai: boolean | null
          created_at: string | null
          id: number
          json_data: Json | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_responses: Json | null
          updated_at: string | null
          user_summary: string | null
          whop_company_id: string
          whop_profile: string
        }
        Insert: {
          access_to_ai?: boolean | null
          created_at?: string | null
          id?: number
          json_data?: Json | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_responses?: Json | null
          updated_at?: string | null
          user_summary?: string | null
          whop_company_id: string
          whop_profile: string
        }
        Update: {
          access_to_ai?: boolean | null
          created_at?: string | null
          id?: number
          json_data?: Json | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_responses?: Json | null
          updated_at?: string | null
          user_summary?: string | null
          whop_company_id?: string
          whop_profile?: string
        }
        Relationships: []
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
