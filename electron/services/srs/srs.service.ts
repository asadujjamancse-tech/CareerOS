import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export type SrsEntityType = 'note' | 'interview_question' | 'skill' | 'document' | 'scenario' | 'custom'

export interface SrsCardRow {
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

export interface SrsReviewRow {
  id: string
  card_id: string
  rating: number
  time_spent_ms: number
  reviewed_at: string
}

export interface DueCard extends SrsCardRow {
  overdue_days: number
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

export interface CreateCardParams {
  entity_type: SrsEntityType
  entity_id: string
  front: string
  back: string
}

export interface UpdateCardParams {
  front?: string
  back?: string
  is_suspended?: 0 | 1
}

// SM-2 Algorithm Implementation
// rating: 0=complete blackout, 1=wrong but remembered, 2=wrong+easy, 3=hard, 4=good, 5=perfect
function sm2(card: SrsCardRow, rating: number): Pick<SrsCardRow, 'interval_days' | 'ease_factor' | 'repetitions' | 'due_date' | 'retention_score'> {
  let { interval_days, ease_factor, repetitions } = card

  if (rating >= 3) {
    if (repetitions === 0) interval_days = 1
    else if (repetitions === 1) interval_days = 6
    else interval_days = Math.round(interval_days * ease_factor)

    repetitions += 1
    ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  } else {
    repetitions = 0
    interval_days = 1
  }

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + interval_days)
  const due_date = dueDate.toISOString().slice(0, 10)

  const retention_score = Math.min(1.0, (repetitions / Math.max(1, repetitions + 1)) * (ease_factor / 2.5))

  return { interval_days, ease_factor, repetitions, due_date, retention_score }
}

function nowIso(): string { return new Date().toISOString() }
function todayStr(): string { return new Date().toISOString().slice(0, 10) }

export function getDueCards(db: Database, limit = 50): DueCard[] {
  return db.prepare(`
    SELECT c.*,
      MAX(0, julianday('now') - julianday(c.due_date)) AS overdue_days
    FROM srs_cards c
    WHERE c.is_suspended = 0 AND c.due_date <= date('now')
    ORDER BY c.due_date ASC, c.ease_factor ASC
    LIMIT ?
  `).all(limit) as DueCard[]
}

export function getUpcomingCards(db: Database, days = 7): SrsCardRow[] {
  return db.prepare(`
    SELECT * FROM srs_cards
    WHERE is_suspended = 0
      AND due_date > date('now')
      AND due_date <= date('now', '+' || ? || ' days')
    ORDER BY due_date ASC
  `).all(days) as SrsCardRow[]
}

export function getAllCards(db: Database, entityType?: SrsEntityType, entityId?: string): SrsCardRow[] {
  if (entityType && entityId) {
    return db.prepare(`
      SELECT * FROM srs_cards WHERE entity_type = ? AND entity_id = ? ORDER BY due_date ASC
    `).all(entityType, entityId) as SrsCardRow[]
  }
  if (entityType) {
    return db.prepare(`SELECT * FROM srs_cards WHERE entity_type = ? ORDER BY due_date ASC`).all(entityType) as SrsCardRow[]
  }
  return db.prepare(`SELECT * FROM srs_cards ORDER BY due_date ASC`).all() as SrsCardRow[]
}

export function getCardById(db: Database, id: string): SrsCardRow | null {
  return db.prepare(`SELECT * FROM srs_cards WHERE id = ?`).get(id) as SrsCardRow | null
}

export function createCard(db: Database, params: CreateCardParams): SrsCardRow {
  const id = `srs_${nanoid(10)}`
  const now = nowIso()
  db.prepare(`
    INSERT INTO srs_cards (id, entity_type, entity_id, front, back, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, date('now'), ?, ?)
  `).run(id, params.entity_type, params.entity_id, params.front, params.back, now, now)
  return getCardById(db, id)!
}

export function updateCard(db: Database, id: string, params: UpdateCardParams): SrsCardRow {
  const sets: string[] = ['updated_at = ?']
  const vals: (string | number)[] = [nowIso()]
  if (params.front !== undefined) { sets.push('front = ?'); vals.push(params.front) }
  if (params.back !== undefined) { sets.push('back = ?'); vals.push(params.back) }
  if (params.is_suspended !== undefined) { sets.push('is_suspended = ?'); vals.push(params.is_suspended) }
  vals.push(id)
  db.prepare(`UPDATE srs_cards SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return getCardById(db, id)!
}

export function recordReview(db: Database, cardId: string, rating: number, timeSpentMs: number): SrsCardRow {
  const card = getCardById(db, cardId)
  if (!card) throw new Error(`SRS card not found: ${cardId}`)

  const updates = sm2(card, rating)
  const now = nowIso()

  db.transaction(() => {
    db.prepare(`
      INSERT INTO srs_reviews (id, card_id, rating, time_spent_ms, reviewed_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(`rev_${nanoid(10)}`, cardId, rating, timeSpentMs, now)

    db.prepare(`
      UPDATE srs_cards SET
        interval_days = ?, ease_factor = ?, repetitions = ?,
        due_date = ?, retention_score = ?, last_review_at = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updates.interval_days, updates.ease_factor, updates.repetitions,
      updates.due_date, updates.retention_score, now, now, cardId
    )
  })()

  return getCardById(db, cardId)!
}

export function deleteCard(db: Database, id: string): void {
  db.prepare(`DELETE FROM srs_cards WHERE id = ?`).run(id)
}

export function getReviewHistory(db: Database, cardId: string): SrsReviewRow[] {
  return db.prepare(`
    SELECT * FROM srs_reviews WHERE card_id = ? ORDER BY reviewed_at DESC LIMIT 50
  `).all(cardId) as SrsReviewRow[]
}

export function getSrsStats(db: Database): SrsStats {
  const today = todayStr()

  const total_cards = (db.prepare(`SELECT COUNT(*) AS c FROM srs_cards WHERE is_suspended = 0`).get() as { c: number }).c
  const due_today = (db.prepare(`SELECT COUNT(*) AS c FROM srs_cards WHERE is_suspended = 0 AND due_date = ?`).get(today) as { c: number }).c
  const due_overdue = (db.prepare(`SELECT COUNT(*) AS c FROM srs_cards WHERE is_suspended = 0 AND due_date < ?`).get(today) as { c: number }).c
  const mastered = (db.prepare(`SELECT COUNT(*) AS c FROM srs_cards WHERE is_suspended = 0 AND repetitions >= 5`).get() as { c: number }).c
  const new_cards = (db.prepare(`SELECT COUNT(*) AS c FROM srs_cards WHERE is_suspended = 0 AND repetitions = 0`).get() as { c: number }).c
  const learning = total_cards - mastered - new_cards

  const easeRow = db.prepare(`SELECT AVG(ease_factor) AS avg_e, AVG(retention_score) AS avg_r FROM srs_cards WHERE is_suspended = 0`).get() as { avg_e: number | null; avg_r: number | null }
  const avg_ease = easeRow.avg_e ?? 2.5
  const avg_retention = easeRow.avg_r ?? 0.0

  const reviews_today = (db.prepare(`SELECT COUNT(*) AS c FROM srs_reviews WHERE date(reviewed_at) = ?`).get(today) as { c: number }).c
  const reviews_this_week = (db.prepare(`SELECT COUNT(*) AS c FROM srs_reviews WHERE date(reviewed_at) >= date('now', '-6 days')`).get() as { c: number }).c

  // Streak: consecutive days with at least 1 review
  const reviewDays = db.prepare(`
    SELECT DISTINCT date(reviewed_at) AS d FROM srs_reviews
    WHERE date(reviewed_at) <= ? ORDER BY d DESC LIMIT 365
  `).pluck().all(today) as string[]

  let streak_days = 0
  const check = new Date(today)
  for (const d of reviewDays) {
    if (d === check.toISOString().slice(0, 10)) {
      streak_days++
      check.setDate(check.getDate() - 1)
    } else break
  }

  return { total_cards, due_today, due_overdue, mastered, learning, new_cards, avg_ease, avg_retention, reviews_today, reviews_this_week, streak_days }
}

export function bulkCreateFromInterviewQuestions(db: Database): number {
  const questions = db.prepare(`
    SELECT id, question, COALESCE(ideal_answer, personal_answer, 'No answer yet') AS answer
    FROM interview_questions WHERE deleted_at IS NULL
  `).all() as { id: string; question: string; answer: string }[]

  const existing = new Set<string>(
    db.prepare(`SELECT entity_id FROM srs_cards WHERE entity_type = 'interview_question'`).pluck().all() as string[]
  )

  let created = 0
  for (const q of questions) {
    if (existing.has(q.id)) continue
    createCard(db, { entity_type: 'interview_question', entity_id: q.id, front: q.question, back: q.answer })
    created++
  }
  return created
}

export function bulkCreateFromNotes(db: Database): number {
  const notes = db.prepare(`
    SELECT id, title, COALESCE(content, '') AS content FROM notes WHERE deleted_at IS NULL
  `).all() as { id: string; title: string; content: string }[]

  const existing = new Set<string>(
    db.prepare(`SELECT entity_id FROM srs_cards WHERE entity_type = 'note'`).pluck().all() as string[]
  )

  let created = 0
  for (const n of notes) {
    if (existing.has(n.id)) continue
    createCard(db, { entity_type: 'note', entity_id: n.id, front: n.title, back: n.content.slice(0, 500) || 'No content yet' })
    created++
  }
  return created
}
