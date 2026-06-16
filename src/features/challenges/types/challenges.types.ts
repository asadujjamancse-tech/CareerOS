export type ChallengeType = 'daily' | 'weekly' | 'lab' | 'project' | 'custom'
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type ChallengeStatus = 'in-progress' | 'completed' | 'failed'

export interface Challenge {
  id: string
  title: string
  description: string
  type: ChallengeType
  difficulty: ChallengeDifficulty
  category: string | null
  xp_reward: number
  target_count: number
  linked_entity_type: string | null
  linked_entity_id: string | null
  challenge_date: string
  expires_at: string | null
  created_at: string
  // From join
  completion_id: string | null
  completion_status: ChallengeStatus | null
  completion_progress: number | null
  completed_at: string | null
}

export interface ChallengeStats {
  total_challenges: number
  completed: number
  in_progress: number
  total_xp_earned: number
  streak_days: number
}
