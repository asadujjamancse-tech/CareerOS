export type ScenarioCategory =
  | 'it-support' | 'msp' | 'cloud' | 'interview' | 'troubleshooting' | 'custom'
  | 'active-directory' | 'windows-server' | 'networking' | 'microsoft-365' | 'azure' | 'cybersecurity' | 'hyper-v'
export type ScenarioDifficulty = 'beginner' | 'medium' | 'advanced' | 'expert'
export type AttemptStatus = 'in-progress' | 'completed' | 'abandoned'

export interface Scenario {
  id: string
  title: string
  description: string | null
  category: ScenarioCategory
  difficulty: ScenarioDifficulty
  estimated_minutes: number
  context_story: string
  success_criteria: string
  hints: string | null
  solution: string | null
  tags: string
  is_active: 0 | 1
  created_at: string
  updated_at: string
  // stats
  total_attempts: number
  completed_attempts: number
  best_score: number | null
  avg_time_min: number | null
  step_count: number
}

export interface ScenarioStep {
  id: string
  scenario_id: string
  step_number: number
  title: string
  instruction: string
  expected_action: string | null
  hint: string | null
  is_checkpoint: 0 | 1
  created_at: string
}

export interface ScenarioAttempt {
  id: string
  scenario_id: string
  status: AttemptStatus
  steps_completed: number
  total_steps: number
  notes: string | null
  lessons_learned: string | null
  time_spent_min: number
  score: number | null
  started_at: string
  completed_at: string | null
}

export interface ScenarioFormData {
  title: string
  description: string
  category: ScenarioCategory
  difficulty: ScenarioDifficulty
  estimated_minutes: number
  context_story: string
  success_criteria: string
  solution: string
  hints: string[]
  tags: string[]
}
