export type UserRole = 'admin' | 'client'

export interface User {
  id: string
  email?: string
  role: UserRole
}

export interface Client {
  id: string
  name: string
  whop_company_id: string | null
  company_slug: string | null
  user_id: string | null
  is_active: boolean | null
  enabled: boolean | null
  created_at: string
  updated_at: string
}

export interface AIConfig {
  id: string
  client_id: string
  assistant_name: string
  avatar_url: string
  prompt: string
  created_at: string
  updated_at: string
}

export interface WelcomeConfig {
  id: string
  client_id: string
  welcome_message: string
  show_welcome: boolean
  disclaimer: string
  show_disclaimer: boolean
  questions_intro: string
  show_questions_intro: boolean
  primary_color: string
  created_at: string
  updated_at: string
}

export interface KnowledgeModule {
  id: string
  client_id: string
  title: string
  is_start_here: boolean
  trained_count: number
  total_count: number
  chapter_count: number
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  client_id: string
  username: string
  name: string
  profile_tags: string[]
  is_onboarded: boolean
  has_ai_access: boolean
  last_updated: string
  created_at: string
}

export interface Report {
  id: string
  client_id: string
  title: string | null
  start_date: string
  end_date: string
  conversations: number
  status: 'completed' | 'pending' | 'failed'
  created_at: string
}

