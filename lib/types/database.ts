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
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          level: number
          xp: number
          streak_days: number
          last_active_date: string | null
          current_goal: string
          english_level: string
          learning_style: string
          daily_goal_minutes: number
          total_study_minutes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          level?: number
          xp?: number
          streak_days?: number
          last_active_date?: string | null
          current_goal?: string
          english_level?: string
          learning_style?: string
          daily_goal_minutes?: number
          total_study_minutes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          level?: number
          xp?: number
          streak_days?: number
          last_active_date?: string | null
          current_goal?: string
          english_level?: string
          learning_style?: string
          daily_goal_minutes?: number
          total_study_minutes?: number
          created_at?: string
          updated_at?: string
        }
      }
      skill_stats: {
        Row: {
          id: string
          user_id: string
          skill: string
          level: number
          xp: number
          total_sessions: number
          accuracy_rate: number
          last_practiced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill: string
          level?: number
          xp?: number
          total_sessions?: number
          accuracy_rate?: number
          last_practiced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill?: string
          level?: number
          xp?: number
          total_sessions?: number
          accuracy_rate?: number
          last_practiced_at?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          scenario: string | null
          messages: Json
          ai_feedback: string | null
          xp_earned: number
          duration_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          scenario?: string | null
          messages?: Json
          ai_feedback?: string | null
          xp_earned?: number
          duration_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          scenario?: string | null
          messages?: Json
          ai_feedback?: string | null
          xp_earned?: number
          duration_seconds?: number
          created_at?: string
        }
      }
      vocabulary: {
        Row: {
          id: string
          user_id: string
          word: string
          definition: string | null
          example_sentence: string | null
          pronunciation: string | null
          part_of_speech: string | null
          difficulty: string
          topic: string | null
          ease_factor: number
          interval_days: number
          repetitions: number
          next_review_date: string
          last_reviewed_at: string | null
          is_mastered: boolean
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          word: string
          definition?: string | null
          example_sentence?: string | null
          pronunciation?: string | null
          part_of_speech?: string | null
          difficulty?: string
          topic?: string | null
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          next_review_date?: string
          last_reviewed_at?: string | null
          is_mastered?: boolean
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          word?: string
          definition?: string | null
          example_sentence?: string | null
          pronunciation?: string | null
          part_of_speech?: string | null
          difficulty?: string
          topic?: string | null
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          next_review_date?: string
          last_reviewed_at?: string | null
          is_mastered?: boolean
          source?: string
          created_at?: string
        }
      }
      writing_submissions: {
        Row: {
          id: string
          user_id: string
          prompt: string | null
          content: string
          writing_type: string
          overall_score: number | null
          grammar_score: number | null
          vocabulary_score: number | null
          coherence_score: number | null
          task_achievement_score: number | null
          ai_feedback: string | null
          corrections: Json
          word_count: number | null
          xp_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt?: string | null
          content: string
          writing_type?: string
          overall_score?: number | null
          grammar_score?: number | null
          vocabulary_score?: number | null
          coherence_score?: number | null
          task_achievement_score?: number | null
          ai_feedback?: string | null
          corrections?: Json
          word_count?: number | null
          xp_earned?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string | null
          content?: string
          writing_type?: string
          overall_score?: number | null
          grammar_score?: number | null
          vocabulary_score?: number | null
          coherence_score?: number | null
          task_achievement_score?: number | null
          ai_feedback?: string | null
          corrections?: Json
          word_count?: number | null
          xp_earned?: number
          created_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          user_id: string
          title: string | null
          skill: string | null
          content: Json
          source_url: string | null
          source_type: string
          difficulty: string
          completed: boolean
          score: number | null
          xp_earned: number
          time_spent_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          skill?: string | null
          content?: Json
          source_url?: string | null
          source_type?: string
          difficulty?: string
          completed?: boolean
          score?: number | null
          xp_earned?: number
          time_spent_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          skill?: string | null
          content?: Json
          source_url?: string | null
          source_type?: string
          difficulty?: string
          completed?: boolean
          score?: number | null
          xp_earned?: number
          time_spent_seconds?: number
          created_at?: string
        }
      }
      daily_challenges: {
        Row: {
          id: string
          user_id: string
          challenge_date: string
          skill: string | null
          content: Json
          completed: boolean
          completed_at: string | null
          xp_reward: number
        }
        Insert: {
          id?: string
          user_id: string
          challenge_date?: string
          skill?: string | null
          content?: Json
          completed?: boolean
          completed_at?: string | null
          xp_reward?: number
        }
        Update: {
          id?: string
          user_id?: string
          challenge_date?: string
          skill?: string | null
          content?: Json
          completed?: boolean
          completed_at?: string | null
          xp_reward?: number
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          achievement_key: string
          achievement_name: string | null
          description: string | null
          icon: string | null
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_key: string
          achievement_name?: string | null
          description?: string | null
          icon?: string | null
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_key?: string
          achievement_name?: string | null
          description?: string | null
          icon?: string | null
          earned_at?: string
        }
      }
      mistake_patterns: {
        Row: {
          id: string
          user_id: string
          error_type: string
          error_category: string
          example: string | null
          correction: string | null
          frequency: number
          last_occurred_at: string
          skill_source: string | null
        }
        Insert: {
          id?: string
          user_id: string
          error_type: string
          error_category: string
          example?: string | null
          correction?: string | null
          frequency?: number
          last_occurred_at?: string
          skill_source?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          error_type?: string
          error_category?: string
          example?: string | null
          correction?: string | null
          frequency?: number
          last_occurred_at?: string
          skill_source?: string | null
        }
      }
      battle_sessions: {
        Row: {
          id: string
          player1_id: string | null
          player2_id: string | null
          winner_id: string | null
          battle_type: string
          questions: Json
          player1_score: number
          player2_score: number
          status: string
          started_at: string | null
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          player1_id?: string | null
          player2_id?: string | null
          winner_id?: string | null
          battle_type?: string
          questions?: Json
          player1_score?: number
          player2_score?: number
          status?: string
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          player1_id?: string | null
          player2_id?: string | null
          winner_id?: string | null
          battle_type?: string
          questions?: Json
          player1_score?: number
          player2_score?: number
          status?: string
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          skill: string | null
          duration_seconds: number | null
          xp_earned: number
          session_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill?: string | null
          duration_seconds?: number | null
          xp_earned?: number
          session_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill?: string | null
          duration_seconds?: number | null
          xp_earned?: number
          session_date?: string
          created_at?: string
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
      [_ in never]: never
    }
  }
}
export interface UserProfile {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  level: number;
  xp: number;
  streak_days: number;
  last_active_date?: string | null;
  current_goal: string;
  english_level: string;
  learning_style: string;
  daily_goal_minutes: number;
  total_study_minutes: number;
  created_at: string;
}

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type SkillStatRow = Database['public']['Tables']['skill_stats']['Row'];
export type ConversationRow = Database['public']['Tables']['conversations']['Row'];
export type VocabularyRow = Database['public']['Tables']['vocabulary']['Row'];
export type WritingSubmissionRow = Database['public']['Tables']['writing_submissions']['Row'];
export type LessonRow = Database['public']['Tables']['lessons']['Row'];
export type DailyChallengeRow = Database['public']['Tables']['daily_challenges']['Row'];
export type AchievementRow = Database['public']['Tables']['achievements']['Row'];
export type MistakePatternRow = Database['public']['Tables']['mistake_patterns']['Row'];
export type StudySessionRow = Database['public']['Tables']['study_sessions']['Row'];
export type BattleSessionRow = Database['public']['Tables']['battle_sessions']['Row'];
