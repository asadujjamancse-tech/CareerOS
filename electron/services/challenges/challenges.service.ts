import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export type ChallengeType = 'daily' | 'weekly' | 'lab' | 'project' | 'custom'
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type ChallengeStatus = 'in-progress' | 'completed' | 'failed'

export interface ChallengeRow {
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
}

export interface ChallengeWithCompletion extends ChallengeRow {
  completion_id: string | null
  completion_status: ChallengeStatus | null
  completion_progress: number | null
  completed_at: string | null
}

export interface ChallengeCompletionRow {
  id: string
  challenge_id: string
  status: ChallengeStatus
  progress: number
  notes: string | null
  completed_at: string | null
  started_at: string
}

export interface CreateChallengeParams {
  title: string
  description: string
  type?: ChallengeType
  difficulty?: ChallengeDifficulty
  category?: string | null
  xp_reward?: number
  target_count?: number
  linked_entity_type?: string | null
  linked_entity_id?: string | null
  challenge_date?: string
  expires_at?: string | null
}

function nowIso(): string { return new Date().toISOString() }
function todayStr(): string { return new Date().toISOString().slice(0, 10) }

export function getTodaysChallenges(db: Database): ChallengeWithCompletion[] {
  const today = todayStr()
  return db.prepare(`
    SELECT c.*,
      cc.id AS completion_id,
      cc.status AS completion_status,
      cc.progress AS completion_progress,
      cc.completed_at
    FROM challenges c
    LEFT JOIN challenge_completions cc ON cc.challenge_id = c.id
    WHERE c.challenge_date = ? OR c.type IN ('weekly','custom')
    ORDER BY c.type ASC, c.difficulty ASC
  `).all(today) as ChallengeWithCompletion[]
}

export function getWeekChallenges(db: Database): ChallengeWithCompletion[] {
  return db.prepare(`
    SELECT c.*,
      cc.id AS completion_id,
      cc.status AS completion_status,
      cc.progress AS completion_progress,
      cc.completed_at
    FROM challenges c
    LEFT JOIN challenge_completions cc ON cc.challenge_id = c.id
    WHERE c.challenge_date >= date('now', '-6 days')
    ORDER BY c.challenge_date DESC, c.type ASC
  `).all() as ChallengeWithCompletion[]
}

export function getAllChallenges(db: Database, type?: ChallengeType): ChallengeWithCompletion[] {
  if (type) {
    return db.prepare(`
      SELECT c.*,
        cc.id AS completion_id,
        cc.status AS completion_status,
        cc.progress AS completion_progress,
        cc.completed_at
      FROM challenges c
      LEFT JOIN challenge_completions cc ON cc.challenge_id = c.id
      WHERE c.type = ?
      ORDER BY c.challenge_date DESC
    `).all(type) as ChallengeWithCompletion[]
  }
  return db.prepare(`
    SELECT c.*,
      cc.id AS completion_id,
      cc.status AS completion_status,
      cc.progress AS completion_progress,
      cc.completed_at
    FROM challenges c
    LEFT JOIN challenge_completions cc ON cc.challenge_id = c.id
    ORDER BY c.challenge_date DESC
  `).all() as ChallengeWithCompletion[]
}

export function createChallenge(db: Database, params: CreateChallengeParams): ChallengeRow {
  const id = `chl_${nanoid(10)}`
  const now = nowIso()

  db.prepare(`
    INSERT INTO challenges
      (id, title, description, type, difficulty, category, xp_reward, target_count,
       linked_entity_type, linked_entity_id, challenge_date, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, params.title, params.description,
    params.type ?? 'daily', params.difficulty ?? 'medium',
    params.category ?? null, params.xp_reward ?? 50, params.target_count ?? 1,
    params.linked_entity_type ?? null, params.linked_entity_id ?? null,
    params.challenge_date ?? todayStr(), params.expires_at ?? null, now
  )

  return db.prepare(`SELECT * FROM challenges WHERE id = ?`).get(id) as ChallengeRow
}

export function startChallenge(db: Database, challengeId: string): ChallengeCompletionRow {
  const existing = db.prepare(`SELECT * FROM challenge_completions WHERE challenge_id = ?`).get(challengeId) as ChallengeCompletionRow | null
  if (existing) return existing

  const id = `cc_${nanoid(10)}`
  const now = nowIso()
  db.prepare(`
    INSERT INTO challenge_completions (id, challenge_id, status, progress, started_at)
    VALUES (?, ?, 'in-progress', 0, ?)
  `).run(id, challengeId, now)
  return db.prepare(`SELECT * FROM challenge_completions WHERE id = ?`).get(id) as ChallengeCompletionRow
}

export function updateProgress(db: Database, challengeId: string, progress: number, notes?: string): ChallengeCompletionRow {
  const completion = db.prepare(`SELECT * FROM challenge_completions WHERE challenge_id = ?`).get(challengeId) as ChallengeCompletionRow | null
  if (!completion) return startChallenge(db, challengeId)

  const challenge = db.prepare(`SELECT target_count FROM challenges WHERE id = ?`).get(challengeId) as { target_count: number }
  const isComplete = progress >= challenge.target_count
  const now = nowIso()

  db.prepare(`
    UPDATE challenge_completions SET
      progress = ?, status = ?, notes = COALESCE(?, notes),
      completed_at = CASE WHEN ? THEN ? ELSE completed_at END
    WHERE challenge_id = ?
  `).run(progress, isComplete ? 'completed' : 'in-progress', notes ?? null, isComplete ? 1 : 0, now, challengeId)

  return db.prepare(`SELECT * FROM challenge_completions WHERE challenge_id = ?`).get(challengeId) as ChallengeCompletionRow
}

export function markChallengeComplete(db: Database, challengeId: string, notes?: string): ChallengeCompletionRow {
  const challenge = db.prepare(`SELECT target_count FROM challenges WHERE id = ?`).get(challengeId) as { target_count: number } | null
  if (!challenge) throw new Error(`Challenge not found: ${challengeId}`)
  return updateProgress(db, challengeId, challenge.target_count, notes)
}

export function generateDailyChallenges(db: Database): ChallengeRow[] {
  const today = todayStr()
  const existing = (db.prepare(`SELECT COUNT(*) AS c FROM challenges WHERE challenge_date = ? AND type = 'daily'`).get(today) as { c: number }).c

  if (existing >= 3) {
    return db.prepare(`SELECT * FROM challenges WHERE challenge_date = ? AND type = 'daily'`).all(today) as ChallengeRow[]
  }

  const created: ChallengeRow[] = []

  // Review challenge from interview questions
  const questionCount = (db.prepare(`SELECT COUNT(*) AS c FROM interview_questions WHERE deleted_at IS NULL`).get() as { c: number }).c
  if (questionCount > 0) {
    created.push(createChallenge(db, {
      title: 'Interview Practice Sprint',
      description: `Review ${Math.min(10, questionCount)} interview questions today. Rate yourself honestly.`,
      type: 'daily', difficulty: 'medium', category: 'Interview',
      xp_reward: 100, target_count: Math.min(10, questionCount), challenge_date: today,
    }))
  }

  // Lab challenge
  const labCount = (db.prepare(`SELECT COUNT(*) AS c FROM home_labs WHERE deleted_at IS NULL AND status != 'completed'`).get() as { c: number }).c
  if (labCount > 0) {
    created.push(createChallenge(db, {
      title: 'Lab Progress Push',
      description: 'Make progress on an active home lab — complete at least one task.',
      type: 'daily', difficulty: 'medium', category: 'Home Lab',
      xp_reward: 150, target_count: 1, challenge_date: today,
    }))
  }

  // SRS review challenge
  const dueCount = (db.prepare(`SELECT COUNT(*) AS c FROM srs_cards WHERE is_suspended = 0 AND due_date <= ?`).get(today) as { c: number }).c
  if (dueCount > 0) {
    created.push(createChallenge(db, {
      title: 'Spaced Repetition Review',
      description: `You have ${dueCount} cards due for review. Complete your SRS session.`,
      type: 'daily', difficulty: 'easy', category: 'Learning',
      xp_reward: 75, target_count: Math.min(dueCount, 20), challenge_date: today,
    }))
  }

  return created
}

export function generateWeeklyChallenge(db: Database): ChallengeRow | null {
  const today = todayStr()
  const existing = (db.prepare(`SELECT COUNT(*) AS c FROM challenges WHERE challenge_date = ? AND type = 'weekly'`).get(today) as { c: number }).c
  if (existing > 0) return null

  const skillCount = (db.prepare(`SELECT COUNT(*) AS c FROM skills WHERE deleted_at IS NULL`).get() as { c: number }).c
  if (skillCount === 0) return null

  return createChallenge(db, {
    title: 'Weekly Deep Dive',
    description: 'Pick one skill and deeply study it this week: watch a video, complete a lab, add 5 interview questions, and write a Feynman explanation.',
    type: 'weekly', difficulty: 'hard', category: 'Learning',
    xp_reward: 500, target_count: 4, challenge_date: today,
  })
}

export function getChallengeStats(db: Database): {
  total_challenges: number
  completed: number
  in_progress: number
  total_xp_earned: number
  streak_days: number
} {
  const total_challenges = (db.prepare(`SELECT COUNT(*) AS c FROM challenges`).get() as { c: number }).c
  const completed = (db.prepare(`SELECT COUNT(*) AS c FROM challenge_completions WHERE status = 'completed'`).get() as { c: number }).c
  const in_progress = (db.prepare(`SELECT COUNT(*) AS c FROM challenge_completions WHERE status = 'in-progress'`).get() as { c: number }).c

  const xpRow = db.prepare(`
    SELECT COALESCE(SUM(c.xp_reward), 0) AS total_xp
    FROM challenges c
    JOIN challenge_completions cc ON cc.challenge_id = c.id
    WHERE cc.status = 'completed'
  `).get() as { total_xp: number }
  const total_xp_earned = xpRow.total_xp

  const completionDays = db.prepare(`
    SELECT DISTINCT date(completed_at) AS d FROM challenge_completions
    WHERE status = 'completed' AND completed_at IS NOT NULL
    ORDER BY d DESC LIMIT 365
  `).pluck().all() as string[]

  let streak_days = 0
  const check = new Date()
  check.setHours(0, 0, 0, 0)
  for (const d of completionDays) {
    if (d === check.toISOString().slice(0, 10)) {
      streak_days++
      check.setDate(check.getDate() - 1)
    } else break
  }

  return { total_challenges, completed, in_progress, total_xp_earned, streak_days }
}
