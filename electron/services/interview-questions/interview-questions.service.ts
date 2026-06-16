import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

// ── Row Types ────────────────────────────────────────────────────────────────

export interface InterviewCategoryRow {
  id: string
  name: string
  description: string | null
  color_hex: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface InterviewQuestionRow {
  id: string
  category_id: string
  question: string
  difficulty: string
  personal_answer: string | null
  ideal_answer: string | null
  notes: string | null
  mastery_score: number
  last_reviewed_at: string | null
  review_count: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface InterviewQuestionWithMeta extends InterviewQuestionRow {
  category_name: string
  category_color: string
}

export interface PaginatedInterviewQuestions {
  items: InterviewQuestionWithMeta[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetAllQuestionsParams {
  search?: string | undefined
  category_id?: string | undefined
  difficulty?: string | undefined
  mastery_min?: number | undefined
  mastery_max?: number | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

export interface CreateQuestionParams {
  category_id: string
  question: string
  difficulty?: string
  personal_answer?: string | null
  ideal_answer?: string | null
  notes?: string | null
  mastery_score?: number
}

export type UpdateQuestionParams = Partial<CreateQuestionParams> & {
  mastery_score?: number
  last_reviewed_at?: string | null
}

export interface CreateCategoryParams {
  name: string
  description?: string | null
  color_hex?: string
  order_index?: number
}

export type UpdateCategoryParams = Partial<CreateCategoryParams>

// ── Helpers ──────────────────────────────────────────────────────────────────

function nowIso(): string { return new Date().toISOString() }

const Q_SELECT = `
  q.id, q.category_id, q.question, q.difficulty, q.personal_answer, q.ideal_answer,
  q.notes, q.mastery_score, q.last_reviewed_at, q.review_count,
  q.created_at, q.updated_at, q.deleted_at,
  ic.name AS category_name, ic.color_hex AS category_color
`

// ── Categories ───────────────────────────────────────────────────────────────

export function getAllCategories(db: Database): InterviewCategoryRow[] {
  return db.prepare(
    'SELECT * FROM interview_categories ORDER BY order_index, name',
  ).all() as InterviewCategoryRow[]
}

export function createCategory(db: Database, params: CreateCategoryParams): InterviewCategoryRow {
  const id = nanoid()
  const now = nowIso()
  const maxOrder = (db.prepare('SELECT COALESCE(MAX(order_index), 0) AS m FROM interview_categories').get() as { m: number }).m
  db.prepare(
    'INSERT INTO interview_categories (id, name, description, color_hex, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, params.name, params.description ?? null, params.color_hex ?? '#6B7280', params.order_index ?? maxOrder + 1, now, now)
  return db.prepare('SELECT * FROM interview_categories WHERE id = ?').get(id) as InterviewCategoryRow
}

export function updateCategory(db: Database, id: string, params: UpdateCategoryParams): InterviewCategoryRow | null {
  if (!db.prepare('SELECT id FROM interview_categories WHERE id = ?').get(id)) return null
  db.prepare(`
    UPDATE interview_categories SET
      name        = COALESCE(:name, name),
      description = COALESCE(:description, description),
      color_hex   = COALESCE(:color_hex, color_hex),
      order_index = COALESCE(:order_index, order_index),
      updated_at  = :now
    WHERE id = :id
  `).run({ id, now: nowIso(), name: params.name ?? null, description: params.description ?? null, color_hex: params.color_hex ?? null, order_index: params.order_index ?? null })
  return db.prepare('SELECT * FROM interview_categories WHERE id = ?').get(id) as InterviewCategoryRow
}

export function deleteCategory(db: Database, id: string): boolean {
  const inUse = (db.prepare('SELECT COUNT(*) AS c FROM interview_questions WHERE category_id = ? AND deleted_at IS NULL').get(id) as { c: number }).c
  if (inUse > 0) return false
  return (db.prepare('DELETE FROM interview_categories WHERE id = ?').run(id)).changes > 0
}

// ── Questions ─────────────────────────────────────────────────────────────────

export function getAllQuestions(db: Database, params: GetAllQuestionsParams): PaginatedInterviewQuestions {
  const { search, category_id, difficulty, mastery_min, mastery_max, page = 1, pageSize = 24 } = params
  const offset = (page - 1) * pageSize

  const bind: Record<string, string | number | null> = {
    category_id: category_id ?? null,
    difficulty: difficulty ?? null,
    mastery_min: mastery_min ?? null,
    mastery_max: mastery_max ?? null,
    search: search?.trim() ? `%${search.trim()}%` : null,
    limit: pageSize,
    offset,
  }

  const WHERE = `
    WHERE q.deleted_at IS NULL
    AND (q.category_id = :category_id OR :category_id IS NULL)
    AND (q.difficulty = :difficulty OR :difficulty IS NULL)
    AND (q.mastery_score >= :mastery_min OR :mastery_min IS NULL)
    AND (q.mastery_score <= :mastery_max OR :mastery_max IS NULL)
    AND (:search IS NULL OR q.question LIKE :search OR q.personal_answer LIKE :search OR q.ideal_answer LIKE :search)
  `

  const FROM = 'FROM interview_questions q JOIN interview_categories ic ON ic.id = q.category_id'

  const total = (
    db.prepare(`SELECT COUNT(*) AS total ${FROM} ${WHERE}`).get(bind) as { total: number }
  ).total

  const items = db.prepare(
    `SELECT ${Q_SELECT} ${FROM} ${WHERE} ORDER BY q.mastery_score ASC, q.updated_at DESC LIMIT :limit OFFSET :offset`,
  ).all(bind) as InterviewQuestionWithMeta[]

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export function getQuestionById(db: Database, id: string): InterviewQuestionWithMeta | null {
  return db.prepare(
    `SELECT ${Q_SELECT} FROM interview_questions q
     JOIN interview_categories ic ON ic.id = q.category_id
     WHERE q.id = ? AND q.deleted_at IS NULL`,
  ).get(id) as InterviewQuestionWithMeta | null
}

export function getRandomQuestions(db: Database, params: {
  category_id?: string
  difficulty?: string
  count?: number
}): InterviewQuestionWithMeta[] {
  const { category_id, difficulty, count = 10 } = params
  const bind: Record<string, string | number | null> = {
    category_id: category_id ?? null,
    difficulty: difficulty ?? null,
    limit: count,
  }
  return db.prepare(`
    SELECT ${Q_SELECT} FROM interview_questions q
    JOIN interview_categories ic ON ic.id = q.category_id
    WHERE q.deleted_at IS NULL
    AND (q.category_id = :category_id OR :category_id IS NULL)
    AND (q.difficulty = :difficulty OR :difficulty IS NULL)
    ORDER BY RANDOM()
    LIMIT :limit
  `).all(bind) as InterviewQuestionWithMeta[]
}

export function createQuestion(db: Database, params: CreateQuestionParams): InterviewQuestionWithMeta {
  const id = nanoid()
  const now = nowIso()
  db.prepare(`
    INSERT INTO interview_questions
      (id, category_id, question, difficulty, personal_answer, ideal_answer, notes, mastery_score, created_at, updated_at)
    VALUES
      (:id, :category_id, :question, :difficulty, :personal_answer, :ideal_answer, :notes, :mastery_score, :now, :now)
  `).run({
    id, now,
    category_id: params.category_id,
    question: params.question,
    difficulty: params.difficulty ?? 'medium',
    personal_answer: params.personal_answer ?? null,
    ideal_answer: params.ideal_answer ?? null,
    notes: params.notes ?? null,
    mastery_score: params.mastery_score ?? 0,
  })
  return getQuestionById(db, id)!
}

export function updateQuestion(db: Database, id: string, params: UpdateQuestionParams): InterviewQuestionWithMeta | null {
  if (!db.prepare('SELECT id FROM interview_questions WHERE id = ? AND deleted_at IS NULL').get(id)) return null
  db.prepare(`
    UPDATE interview_questions SET
      category_id      = COALESCE(:category_id, category_id),
      question         = COALESCE(:question, question),
      difficulty       = COALESCE(:difficulty, difficulty),
      personal_answer  = COALESCE(:personal_answer, personal_answer),
      ideal_answer     = COALESCE(:ideal_answer, ideal_answer),
      notes            = COALESCE(:notes, notes),
      mastery_score    = COALESCE(:mastery_score, mastery_score),
      last_reviewed_at = COALESCE(:last_reviewed_at, last_reviewed_at),
      updated_at       = :now
    WHERE id = :id AND deleted_at IS NULL
  `).run({
    id, now: nowIso(),
    category_id: params.category_id ?? null,
    question: params.question ?? null,
    difficulty: params.difficulty ?? null,
    personal_answer: params.personal_answer ?? null,
    ideal_answer: params.ideal_answer ?? null,
    notes: params.notes ?? null,
    mastery_score: params.mastery_score ?? null,
    last_reviewed_at: params.last_reviewed_at ?? null,
  })
  return getQuestionById(db, id)
}

export function recordReview(db: Database, id: string, mastery_score: number): InterviewQuestionWithMeta | null {
  if (!db.prepare('SELECT id FROM interview_questions WHERE id = ? AND deleted_at IS NULL').get(id)) return null
  db.prepare(`
    UPDATE interview_questions SET
      mastery_score    = :mastery_score,
      last_reviewed_at = :now,
      review_count     = review_count + 1,
      updated_at       = :now
    WHERE id = :id AND deleted_at IS NULL
  `).run({ id, mastery_score, now: nowIso() })
  return getQuestionById(db, id)
}

export function softDeleteQuestion(db: Database, id: string): boolean {
  return (
    db.prepare('UPDATE interview_questions SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL').run(nowIso(), id)
  ).changes > 0
}

// ── Progress stats ────────────────────────────────────────────────────────────

export interface QuestionProgressStats {
  total: number
  by_difficulty: Array<{ difficulty: string; count: number }>
  by_mastery: Array<{ score: number; count: number }>
  by_category: Array<{ category_id: string; category_name: string; total: number; mastered: number }>
  mastered_count: number
  avg_mastery: number
}

export function getProgressStats(db: Database): QuestionProgressStats {
  const total = (
    db.prepare('SELECT COUNT(*) AS c FROM interview_questions WHERE deleted_at IS NULL').get() as { c: number }
  ).c

  const mastered_count = (
    db.prepare('SELECT COUNT(*) AS c FROM interview_questions WHERE deleted_at IS NULL AND mastery_score >= 4').get() as { c: number }
  ).c

  const avg_row = db.prepare(
    'SELECT COALESCE(AVG(mastery_score), 0) AS avg FROM interview_questions WHERE deleted_at IS NULL',
  ).get() as { avg: number }

  const by_difficulty = db.prepare(
    'SELECT difficulty, COUNT(*) AS count FROM interview_questions WHERE deleted_at IS NULL GROUP BY difficulty ORDER BY difficulty',
  ).all() as Array<{ difficulty: string; count: number }>

  const by_mastery = db.prepare(
    'SELECT mastery_score AS score, COUNT(*) AS count FROM interview_questions WHERE deleted_at IS NULL GROUP BY mastery_score ORDER BY mastery_score',
  ).all() as Array<{ score: number; count: number }>

  const by_category = db.prepare(`
    SELECT ic.id AS category_id, ic.name AS category_name,
      COUNT(q.id) AS total,
      SUM(CASE WHEN q.mastery_score >= 4 THEN 1 ELSE 0 END) AS mastered
    FROM interview_categories ic
    LEFT JOIN interview_questions q ON q.category_id = ic.id AND q.deleted_at IS NULL
    GROUP BY ic.id, ic.name
    ORDER BY ic.order_index
  `).all() as Array<{ category_id: string; category_name: string; total: number; mastered: number }>

  return { total, mastered_count, avg_mastery: Math.round(avg_row.avg * 10) / 10, by_difficulty, by_mastery, by_category }
}
