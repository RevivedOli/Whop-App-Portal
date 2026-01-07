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

// Knowledge/Courses Types

export type TrainingStatus = 
  | 'pending' 
  | 'transcribing' 
  | 'transcribe_failed' 
  | 'transcribed' 
  | 'training' 
  | 'train_failed' 
  | 'trained'

export interface CourseTrainingStatus {
  id?: number
  whop_company_id: string
  course_id: string
  chapter_id?: string | null
  lesson_id: string
  title: string
  video_id?: string | null
  playback_id?: string | null
  signed_video_playback_token?: string | null
  video_source_type?: 'mux' | 'youtube' | 'loom' | null
  embed_id?: string | null
  embed_type?: 'youtube' | 'loom' | null
  status: TrainingStatus
  error_message?: string | null
  metadata?: Record<string, any> | null
  company_slug?: string | null
  experience_id?: string | null
  lesson_url?: string | null
  trained_at?: string | null
  transcription_file?: string | null
  lesson_summary_pdf?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface LessonThumbnail {
  url?: string
  optimized_url?: string
}

export interface VideoAsset {
  asset_id?: string
  playback_id?: string
  signed_playback_id?: string
  signed_video_playback_token?: string
  signedVideoPlaybackToken?: string
  status?: string
  id?: string
}

export interface Lesson {
  id: string
  title: string
  order: number
  lesson_type: 'multi' | 'pdf' | 'text' | string
  thumbnail?: LessonThumbnail | null
  video_asset?: VideoAsset | null
  embed_id?: string | null
  embed_type?: 'youtube' | 'loom' | null
  trainingStatus?: CourseTrainingStatus | null
}

export interface ChapterTrainingStats {
  total: number
  trained: number
  pending: number
  transcribing: number
  transcribe_failed: number
  transcribed: number
  training: number
  train_failed: number
}

export interface Chapter {
  id: string
  title: string
  order: number
  lessons: Lesson[]
  trainingStats: ChapterTrainingStats
}

export interface CourseTrainingStats {
  total: number
  trained: number
  pending: number
  transcribing: number
  transcribe_failed: number
  transcribed: number
  training: number
  train_failed: number
}

export interface CourseWithTrainingStatus {
  id: string
  title: string
  description?: string | null
  thumbnail?: LessonThumbnail | null
  chapters: Chapter[]
  trainingStats: CourseTrainingStats
}

