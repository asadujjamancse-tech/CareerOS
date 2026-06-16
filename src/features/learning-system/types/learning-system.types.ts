export type SrsEntityType = 'note' | 'interview_question' | 'skill' | 'document' | 'scenario' | 'custom'

export interface SrsCard {
  id: string
  entity_type: SrsEntityType
  entity_id: string
  front: string
  back: string
  interval_days: number
  ease_factor: number
  repetitions: number
  due_date: string
  last_review_at: string | null
  retention_score: number
  is_suspended: 0 | 1
  created_at: string
  updated_at: string
}

export interface DueCard extends SrsCard {
  overdue_days: number
}

export interface SrsReview {
  id: string
  card_id: string
  rating: number
  time_spent_ms: number
  reviewed_at: string
}

export interface SrsStats {
  total_cards: number
  due_today: number
  due_overdue: number
  mastered: number
  learning: number
  new_cards: number
  avg_ease: number
  avg_retention: number
  reviews_today: number
  reviews_this_week: number
  streak_days: number
}

export interface FeynmanEntry {
  id: string
  topic: string
  entity_type: string | null
  entity_id: string | null
  explanation: string
  gaps_identified: string | null
  revised_explanation: string | null
  understanding_score: number
  created_at: string
  updated_at: string
}

export type LearningMode = 'dashboard' | 'review' | 'active-recall' | 'feynman'
