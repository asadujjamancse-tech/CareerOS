import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

function nowIso(): string {
  return new Date().toISOString()
}

// ─── Row Types ───────────────────────────────────────────────────────────────

export interface SkillHubOverviewRow {
  // Skill base
  id: string
  name: string
  slug: string
  description: string | null
  proficiency_level: string
  status: string
  years_experience: number
  category_name: string
  category_color: string
  // Modules
  modules_total: number
  modules_complete: number
  // Study / practice hours
  hours_studied: number
  hours_practiced: number
  // Labs
  labs_total: number
  labs_complete: number
  // Projects
  projects_total: number
  projects_complete: number
  // Interview
  interview_total: number
  interview_avg_mastery: number
  // Resources
  resources_total: number
  resources_complete: number
  // Certs
  certs_total: number
  certs_earned: number
  // Misc
  last_activity_at: string | null
}

export interface SkillModuleRow {
  id: string
  skill_id: string
  title: string
  description: string | null
  order_index: number
  is_complete: number
  hours_spent: number
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface SkillModuleWithTopics extends SkillModuleRow {
  topics: SkillModuleTopicRow[]
}

export interface SkillModuleTopicRow {
  id: string
  module_id: string
  title: string
  is_complete: number
  order_index: number
  created_at: string
  updated_at: string
}

export interface SkillResourceRow {
  id: string
  skill_id: string
  title: string
  provider: string
  url: string | null
  difficulty: string
  est_hours: number
  notes: string | null
  is_completed: number
  order_index: number
  created_at: string
  updated_at: string
}

export interface SkillExperienceEntryRow {
  id: string
  skill_id: string
  date: string
  task: string
  hours: number
  what_learned: string | null
  created_at: string
  updated_at: string
}

export interface SkillQuizQuestionRow {
  id: string
  skill_id: string
  question: string
  type: string
  answer: string | null
  options_json: string | null
  explanation: string | null
  difficulty: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface QuizAttemptStatsRow {
  total_attempts: number
  correct_attempts: number
  accuracy_pct: number
}

export interface LinkedLabRow {
  id: string
  title: string
  status: string
  completion_pct: number
  total_minutes: number
  started_at: string | null
  completed_at: string | null
}

export interface LinkedProjectRow {
  id: string
  title: string
  status: string
  type: string
  repo_url: string | null
  live_url: string | null
  completed_at: string | null
}

export interface LinkedCertificationRow {
  id: string
  name: string
  issuer: string
  status: string
  issue_date: string | null
  expiry_date: string | null
}

export interface LinkedInterviewQuestionRow {
  id: string
  question: string
  difficulty: string
  mastery_score: number
  last_reviewed_at: string | null
  category_name: string
  category_color: string
}

export interface LinkedVideoRow {
  id: string
  title: string
  source: string
  watch_status: string
  duration_seconds: number | null
  thumbnail_path: string | null
  url: string | null
}

export interface RelatedSkillRow {
  id: string
  name: string
  slug: string
  proficiency_level: string
  status: string
  category_name: string
  category_color: string
}

// ─── Overview ─────────────────────────────────────────────────────────────────

export function getSkillHubOverview(db: Database, skillId: string): SkillHubOverviewRow | null {
  const row = db.prepare(`
    SELECT
      s.id, s.name, s.slug, s.description, s.proficiency_level, s.status, s.years_experience,
      sc.name  AS category_name,
      sc.color_hex AS category_color,
      COALESCE((SELECT COUNT(*) FROM skill_modules       WHERE skill_id = s.id), 0)                                           AS modules_total,
      COALESCE((SELECT COUNT(*) FROM skill_modules       WHERE skill_id = s.id AND is_complete = 1), 0)                       AS modules_complete,
      COALESCE((SELECT SUM(ss.duration_minutes) FROM study_sessions ss WHERE ss.skill_id = s.id), 0) / 60.0                   AS hours_studied,
      COALESCE((SELECT SUM(el.hours) FROM skill_experience_log el WHERE el.skill_id = s.id), 0)                               AS hours_practiced,
      COALESCE((SELECT COUNT(*) FROM home_lab_skills     WHERE skill_id = s.id), 0)                                           AS labs_total,
      COALESCE((SELECT COUNT(*) FROM home_labs hl JOIN home_lab_skills hls ON hls.lab_id = hl.id
                WHERE hls.skill_id = s.id AND hl.status = 'completed' AND hl.deleted_at IS NULL), 0)                         AS labs_complete,
      COALESCE((SELECT COUNT(*) FROM project_skills      WHERE skill_id = s.id), 0)                                           AS projects_total,
      COALESCE((SELECT COUNT(*) FROM projects p JOIN project_skills ps ON ps.project_id = p.id
                WHERE ps.skill_id = s.id AND p.status = 'completed' AND p.deleted_at IS NULL), 0)                            AS projects_complete,
      COALESCE((SELECT COUNT(*) FROM interview_question_skills WHERE skill_id = s.id), 0)                                    AS interview_total,
      COALESCE((SELECT AVG(iq.mastery_score) FROM interview_questions iq
                JOIN interview_question_skills iqs ON iqs.question_id = iq.id
                WHERE iqs.skill_id = s.id AND iq.deleted_at IS NULL), 0)                                                     AS interview_avg_mastery,
      COALESCE((SELECT COUNT(*) FROM skill_resources     WHERE skill_id = s.id), 0)                                           AS resources_total,
      COALESCE((SELECT COUNT(*) FROM skill_resources     WHERE skill_id = s.id AND is_completed = 1), 0)                     AS resources_complete,
      COALESCE((SELECT COUNT(*) FROM certification_skills WHERE skill_id = s.id), 0)                                         AS certs_total,
      COALESCE((SELECT COUNT(*) FROM certifications c JOIN certification_skills cs ON cs.certification_id = c.id
                WHERE cs.skill_id = s.id AND c.status = 'earned' AND c.deleted_at IS NULL), 0)                               AS certs_earned,
      (SELECT MAX(occurred_at) FROM (
        SELECT created_at AS occurred_at FROM study_sessions          WHERE skill_id = s.id
        UNION ALL
        SELECT created_at AS occurred_at FROM skill_experience_log    WHERE skill_id = s.id
        UNION ALL
        SELECT updated_at AS occurred_at FROM skill_resources         WHERE skill_id = s.id
        UNION ALL
        SELECT updated_at AS occurred_at FROM skill_modules           WHERE skill_id = s.id
      ) x)                                                                                                                    AS last_activity_at
    FROM skills s
    JOIN skill_categories sc ON sc.id = s.category_id
    WHERE s.id = ? AND s.deleted_at IS NULL
  `).get(skillId) as SkillHubOverviewRow | undefined

  return row ?? null
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export function getSkillModules(db: Database, skillId: string): SkillModuleWithTopics[] {
  const modules = db.prepare(`
    SELECT * FROM skill_modules WHERE skill_id = ? ORDER BY order_index ASC, created_at ASC
  `).all(skillId) as SkillModuleRow[]

  const topicsStmt = db.prepare(`
    SELECT * FROM skill_module_topics WHERE module_id = ? ORDER BY order_index ASC, created_at ASC
  `)

  return modules.map(m => ({
    ...m,
    topics: topicsStmt.all(m.id) as SkillModuleTopicRow[],
  }))
}

export function createSkillModule(
  db: Database,
  params: { skill_id: string; title: string; description?: string | null; order_index?: number },
): SkillModuleRow {
  const id = nanoid()
  const now = nowIso()
  const order_index = params.order_index ?? (
    (db.prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM skill_modules WHERE skill_id = ?').get(params.skill_id) as { next: number }).next
  )
  db.prepare(`
    INSERT INTO skill_modules (id, skill_id, title, description, order_index, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, params.skill_id, params.title, params.description ?? null, order_index, now, now)
  return db.prepare('SELECT * FROM skill_modules WHERE id = ?').get(id) as SkillModuleRow
}

export function updateSkillModule(
  db: Database,
  id: string,
  params: Partial<{ title: string; description: string | null; order_index: number; is_complete: number; hours_spent: number; notes: string | null }>,
): SkillModuleRow | null {
  const existing = db.prepare('SELECT * FROM skill_modules WHERE id = ?').get(id) as SkillModuleRow | undefined
  if (!existing) return null

  const now = nowIso()
  const isComplete = params.is_complete ?? existing.is_complete
  const completed_at = isComplete === 1 && existing.is_complete === 0 ? now : (isComplete === 0 ? null : existing.completed_at)

  db.prepare(`
    UPDATE skill_modules SET
      title       = COALESCE(:title, title),
      description = COALESCE(:description, description),
      order_index = COALESCE(:order_index, order_index),
      is_complete = COALESCE(:is_complete, is_complete),
      hours_spent = COALESCE(:hours_spent, hours_spent),
      notes       = COALESCE(:notes, notes),
      completed_at = :completed_at,
      updated_at  = :now
    WHERE id = :id
  `).run({
    title: params.title ?? null,
    description: params.description ?? null,
    order_index: params.order_index ?? null,
    is_complete: params.is_complete ?? null,
    hours_spent: params.hours_spent ?? null,
    notes: params.notes ?? null,
    completed_at,
    now,
    id,
  })
  return db.prepare('SELECT * FROM skill_modules WHERE id = ?').get(id) as SkillModuleRow
}

export function deleteSkillModule(db: Database, id: string): boolean {
  return db.prepare('DELETE FROM skill_modules WHERE id = ?').run(id).changes > 0
}

export function reorderSkillModules(db: Database, skillId: string, orderedIds: string[]): void {
  const stmt = db.prepare('UPDATE skill_modules SET order_index = ?, updated_at = ? WHERE id = ? AND skill_id = ?')
  const now = nowIso()
  db.transaction(() => {
    orderedIds.forEach((id, idx) => stmt.run(idx, now, id, skillId))
  })()
}

// ─── Module Topics ────────────────────────────────────────────────────────────

export function createSkillModuleTopic(
  db: Database,
  params: { module_id: string; title: string; order_index?: number },
): SkillModuleTopicRow {
  const id = nanoid()
  const now = nowIso()
  const order_index = params.order_index ?? (
    (db.prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM skill_module_topics WHERE module_id = ?').get(params.module_id) as { next: number }).next
  )
  db.prepare(`
    INSERT INTO skill_module_topics (id, module_id, title, order_index, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, params.module_id, params.title, order_index, now, now)
  return db.prepare('SELECT * FROM skill_module_topics WHERE id = ?').get(id) as SkillModuleTopicRow
}

export function updateSkillModuleTopic(
  db: Database,
  id: string,
  params: { title?: string; is_complete?: number; order_index?: number },
): SkillModuleTopicRow | null {
  const existing = db.prepare('SELECT * FROM skill_module_topics WHERE id = ?').get(id)
  if (!existing) return null
  db.prepare(`
    UPDATE skill_module_topics SET
      title       = COALESCE(:title, title),
      is_complete = COALESCE(:is_complete, is_complete),
      order_index = COALESCE(:order_index, order_index),
      updated_at  = :now
    WHERE id = :id
  `).run({ title: params.title ?? null, is_complete: params.is_complete ?? null, order_index: params.order_index ?? null, now: nowIso(), id })
  return db.prepare('SELECT * FROM skill_module_topics WHERE id = ?').get(id) as SkillModuleTopicRow
}

export function deleteSkillModuleTopic(db: Database, id: string): boolean {
  return db.prepare('DELETE FROM skill_module_topics WHERE id = ?').run(id).changes > 0
}

// ─── Resources ───────────────────────────────────────────────────────────────

export function getSkillResources(db: Database, skillId: string): SkillResourceRow[] {
  return db.prepare(`
    SELECT * FROM skill_resources WHERE skill_id = ? ORDER BY order_index ASC, created_at ASC
  `).all(skillId) as SkillResourceRow[]
}

export function createSkillResource(
  db: Database,
  params: {
    skill_id: string; title: string; provider?: string; url?: string | null
    difficulty?: string; est_hours?: number; notes?: string | null
  },
): SkillResourceRow {
  const id = nanoid()
  const now = nowIso()
  const order_index = (db.prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM skill_resources WHERE skill_id = ?').get(params.skill_id) as { next: number }).next
  db.prepare(`
    INSERT INTO skill_resources (id, skill_id, title, provider, url, difficulty, est_hours, notes, order_index, created_at, updated_at)
    VALUES (:id, :skill_id, :title, :provider, :url, :difficulty, :est_hours, :notes, :order_index, :now, :now)
  `).run({
    id, skill_id: params.skill_id, title: params.title,
    provider: params.provider ?? 'other', url: params.url ?? null,
    difficulty: params.difficulty ?? 'beginner', est_hours: params.est_hours ?? 0,
    notes: params.notes ?? null, order_index, now,
  })
  return db.prepare('SELECT * FROM skill_resources WHERE id = ?').get(id) as SkillResourceRow
}

export function updateSkillResource(
  db: Database,
  id: string,
  params: Partial<{ title: string; provider: string; url: string | null; difficulty: string; est_hours: number; notes: string | null; is_completed: number; order_index: number }>,
): SkillResourceRow | null {
  if (!db.prepare('SELECT id FROM skill_resources WHERE id = ?').get(id)) return null
  db.prepare(`
    UPDATE skill_resources SET
      title        = COALESCE(:title, title),
      provider     = COALESCE(:provider, provider),
      url          = COALESCE(:url, url),
      difficulty   = COALESCE(:difficulty, difficulty),
      est_hours    = COALESCE(:est_hours, est_hours),
      notes        = COALESCE(:notes, notes),
      is_completed = COALESCE(:is_completed, is_completed),
      order_index  = COALESCE(:order_index, order_index),
      updated_at   = :now
    WHERE id = :id
  `).run({
    title: params.title ?? null, provider: params.provider ?? null, url: params.url ?? null,
    difficulty: params.difficulty ?? null, est_hours: params.est_hours ?? null,
    notes: params.notes ?? null, is_completed: params.is_completed ?? null,
    order_index: params.order_index ?? null, now: nowIso(), id,
  })
  return db.prepare('SELECT * FROM skill_resources WHERE id = ?').get(id) as SkillResourceRow
}

export function deleteSkillResource(db: Database, id: string): boolean {
  return db.prepare('DELETE FROM skill_resources WHERE id = ?').run(id).changes > 0
}

// ─── Experience Log ───────────────────────────────────────────────────────────

export function getSkillExperienceLog(db: Database, skillId: string): SkillExperienceEntryRow[] {
  return db.prepare(`
    SELECT * FROM skill_experience_log WHERE skill_id = ? ORDER BY date DESC, created_at DESC
  `).all(skillId) as SkillExperienceEntryRow[]
}

export function createSkillExperienceEntry(
  db: Database,
  params: { skill_id: string; task: string; hours: number; date?: string; what_learned?: string | null },
): SkillExperienceEntryRow {
  const id = nanoid()
  const now = nowIso()
  db.prepare(`
    INSERT INTO skill_experience_log (id, skill_id, date, task, hours, what_learned, created_at, updated_at)
    VALUES (:id, :skill_id, :date, :task, :hours, :what_learned, :now, :now)
  `).run({
    id, skill_id: params.skill_id,
    date: params.date ?? new Date().toISOString().slice(0, 10),
    task: params.task, hours: params.hours,
    what_learned: params.what_learned ?? null, now,
  })
  return db.prepare('SELECT * FROM skill_experience_log WHERE id = ?').get(id) as SkillExperienceEntryRow
}

export function updateSkillExperienceEntry(
  db: Database,
  id: string,
  params: Partial<{ date: string; task: string; hours: number; what_learned: string | null }>,
): SkillExperienceEntryRow | null {
  if (!db.prepare('SELECT id FROM skill_experience_log WHERE id = ?').get(id)) return null
  db.prepare(`
    UPDATE skill_experience_log SET
      date         = COALESCE(:date, date),
      task         = COALESCE(:task, task),
      hours        = COALESCE(:hours, hours),
      what_learned = COALESCE(:what_learned, what_learned),
      updated_at   = :now
    WHERE id = :id
  `).run({ date: params.date ?? null, task: params.task ?? null, hours: params.hours ?? null, what_learned: params.what_learned ?? null, now: nowIso(), id })
  return db.prepare('SELECT * FROM skill_experience_log WHERE id = ?').get(id) as SkillExperienceEntryRow
}

export function deleteSkillExperienceEntry(db: Database, id: string): boolean {
  return db.prepare('DELETE FROM skill_experience_log WHERE id = ?').run(id).changes > 0
}

// ─── Quiz Questions ───────────────────────────────────────────────────────────

export function getSkillQuizQuestions(db: Database, skillId: string): SkillQuizQuestionRow[] {
  return db.prepare(`
    SELECT * FROM skill_quiz_questions WHERE skill_id = ? ORDER BY order_index ASC, created_at ASC
  `).all(skillId) as SkillQuizQuestionRow[]
}

export function createSkillQuizQuestion(
  db: Database,
  params: {
    skill_id: string; question: string; type?: string; answer?: string | null
    options_json?: string | null; explanation?: string | null; difficulty?: string
  },
): SkillQuizQuestionRow {
  const id = nanoid()
  const now = nowIso()
  const order_index = (db.prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM skill_quiz_questions WHERE skill_id = ?').get(params.skill_id) as { next: number }).next
  db.prepare(`
    INSERT INTO skill_quiz_questions (id, skill_id, question, type, answer, options_json, explanation, difficulty, order_index, created_at, updated_at)
    VALUES (:id, :skill_id, :question, :type, :answer, :options_json, :explanation, :difficulty, :order_index, :now, :now)
  `).run({
    id, skill_id: params.skill_id, question: params.question,
    type: params.type ?? 'flashcard', answer: params.answer ?? null,
    options_json: params.options_json ?? null, explanation: params.explanation ?? null,
    difficulty: params.difficulty ?? 'medium', order_index, now,
  })
  return db.prepare('SELECT * FROM skill_quiz_questions WHERE id = ?').get(id) as SkillQuizQuestionRow
}

export function updateSkillQuizQuestion(
  db: Database,
  id: string,
  params: Partial<{ question: string; type: string; answer: string | null; options_json: string | null; explanation: string | null; difficulty: string; order_index: number }>,
): SkillQuizQuestionRow | null {
  if (!db.prepare('SELECT id FROM skill_quiz_questions WHERE id = ?').get(id)) return null
  db.prepare(`
    UPDATE skill_quiz_questions SET
      question     = COALESCE(:question, question),
      type         = COALESCE(:type, type),
      answer       = COALESCE(:answer, answer),
      options_json = COALESCE(:options_json, options_json),
      explanation  = COALESCE(:explanation, explanation),
      difficulty   = COALESCE(:difficulty, difficulty),
      order_index  = COALESCE(:order_index, order_index),
      updated_at   = :now
    WHERE id = :id
  `).run({
    question: params.question ?? null, type: params.type ?? null,
    answer: params.answer ?? null, options_json: params.options_json ?? null,
    explanation: params.explanation ?? null, difficulty: params.difficulty ?? null,
    order_index: params.order_index ?? null, now: nowIso(), id,
  })
  return db.prepare('SELECT * FROM skill_quiz_questions WHERE id = ?').get(id) as SkillQuizQuestionRow
}

export function deleteSkillQuizQuestion(db: Database, id: string): boolean {
  return db.prepare('DELETE FROM skill_quiz_questions WHERE id = ?').run(id).changes > 0
}

export function logSkillQuizAttempt(
  db: Database,
  params: { skill_id: string; question_id: string | null; is_correct: number; time_taken_s?: number | null; attempt_date?: string },
): void {
  db.prepare(`
    INSERT INTO skill_quiz_attempts (id, skill_id, question_id, is_correct, time_taken_s, attempt_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    nanoid(), params.skill_id, params.question_id ?? null, params.is_correct,
    params.time_taken_s ?? null,
    params.attempt_date ?? new Date().toISOString().slice(0, 10),
    nowIso(),
  )
}

export function getSkillQuizAttemptStats(db: Database, skillId: string): QuizAttemptStatsRow {
  const row = db.prepare(`
    SELECT
      COUNT(*)                                                          AS total_attempts,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END)                 AS correct_attempts,
      ROUND(
        CASE WHEN COUNT(*) > 0
             THEN SUM(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0 END) / COUNT(*)
             ELSE 0 END, 1
      )                                                                AS accuracy_pct
    FROM skill_quiz_attempts WHERE skill_id = ?
  `).get(skillId) as QuizAttemptStatsRow
  return row
}

// ─── Linked Labs ─────────────────────────────────────────────────────────────

export function getLinkedLabs(db: Database, skillId: string): LinkedLabRow[] {
  return db.prepare(`
    SELECT
      hl.id, hl.title, hl.status, hl.completion_pct, hl.started_at, hl.completed_at,
      COALESCE((SELECT SUM(duration_min) FROM home_lab_time_entries WHERE lab_id = hl.id), 0) AS total_minutes
    FROM home_labs hl
    JOIN home_lab_skills hls ON hls.lab_id = hl.id
    WHERE hls.skill_id = ? AND hl.deleted_at IS NULL
    ORDER BY hl.updated_at DESC
  `).all(skillId) as LinkedLabRow[]
}

export function linkLab(db: Database, skillId: string, labId: string): void {
  db.prepare('INSERT OR IGNORE INTO home_lab_skills (lab_id, skill_id) VALUES (?, ?)').run(labId, skillId)
}

export function unlinkLab(db: Database, skillId: string, labId: string): void {
  db.prepare('DELETE FROM home_lab_skills WHERE lab_id = ? AND skill_id = ?').run(labId, skillId)
}

// ─── Linked Projects ──────────────────────────────────────────────────────────

export function getLinkedProjects(db: Database, skillId: string): LinkedProjectRow[] {
  return db.prepare(`
    SELECT p.id, p.title, p.status, p.type, p.repo_url, p.live_url, p.completed_at
    FROM projects p
    JOIN project_skills ps ON ps.project_id = p.id
    WHERE ps.skill_id = ? AND p.deleted_at IS NULL
    ORDER BY p.updated_at DESC
  `).all(skillId) as LinkedProjectRow[]
}

export function linkProject(db: Database, skillId: string, projectId: string): void {
  db.prepare('INSERT OR IGNORE INTO project_skills (project_id, skill_id) VALUES (?, ?)').run(projectId, skillId)
}

export function unlinkProject(db: Database, skillId: string, projectId: string): void {
  db.prepare('DELETE FROM project_skills WHERE project_id = ? AND skill_id = ?').run(projectId, skillId)
}

// ─── Linked Certifications ────────────────────────────────────────────────────

export function getLinkedCertifications(db: Database, skillId: string): LinkedCertificationRow[] {
  return db.prepare(`
    SELECT c.id, c.name, c.issuer, c.status, c.issue_date, c.expiry_date
    FROM certifications c
    JOIN certification_skills cs ON cs.certification_id = c.id
    WHERE cs.skill_id = ? AND c.deleted_at IS NULL
    ORDER BY c.updated_at DESC
  `).all(skillId) as LinkedCertificationRow[]
}

export function linkCertification(db: Database, skillId: string, certId: string): void {
  db.prepare('INSERT OR IGNORE INTO certification_skills (certification_id, skill_id) VALUES (?, ?)').run(certId, skillId)
}

export function unlinkCertification(db: Database, skillId: string, certId: string): void {
  db.prepare('DELETE FROM certification_skills WHERE certification_id = ? AND skill_id = ?').run(certId, skillId)
}

// ─── Linked Interview Questions ───────────────────────────────────────────────

export function getLinkedInterviewQuestions(db: Database, skillId: string): LinkedInterviewQuestionRow[] {
  return db.prepare(`
    SELECT
      iq.id, iq.question, iq.difficulty, iq.mastery_score, iq.last_reviewed_at,
      ic.name  AS category_name,
      ic.color_hex AS category_color
    FROM interview_questions iq
    JOIN interview_categories ic ON ic.id = iq.category_id
    JOIN interview_question_skills iqs ON iqs.question_id = iq.id
    WHERE iqs.skill_id = ? AND iq.deleted_at IS NULL
    ORDER BY iq.mastery_score ASC, iq.difficulty ASC
  `).all(skillId) as LinkedInterviewQuestionRow[]
}

export function linkInterviewQuestion(db: Database, skillId: string, questionId: string): void {
  db.prepare('INSERT OR IGNORE INTO interview_question_skills (question_id, skill_id) VALUES (?, ?)').run(questionId, skillId)
}

export function unlinkInterviewQuestion(db: Database, skillId: string, questionId: string): void {
  db.prepare('DELETE FROM interview_question_skills WHERE question_id = ? AND skill_id = ?').run(questionId, skillId)
}

// ─── Linked Videos ────────────────────────────────────────────────────────────

export function getLinkedVideos(db: Database, skillId: string): LinkedVideoRow[] {
  return db.prepare(`
    SELECT v.id, v.title, v.source, v.watch_status, v.duration_seconds, v.thumbnail_path, v.url
    FROM videos v
    JOIN video_skills vs ON vs.video_id = v.id
    WHERE vs.skill_id = ? AND v.deleted_at IS NULL
    ORDER BY v.updated_at DESC
  `).all(skillId) as LinkedVideoRow[]
}

// ─── Related Skills ───────────────────────────────────────────────────────────

export function getRelatedSkills(db: Database, skillId: string): RelatedSkillRow[] {
  return db.prepare(`
    SELECT s.id, s.name, s.slug, s.proficiency_level, s.status,
           sc.name  AS category_name,
           sc.color_hex AS category_color
    FROM skills s
    JOIN skill_categories sc ON sc.id = s.category_id
    WHERE s.category_id = (SELECT category_id FROM skills WHERE id = ?)
      AND s.id != ?
      AND s.deleted_at IS NULL
    ORDER BY s.name ASC
    LIMIT 20
  `).all(skillId, skillId) as RelatedSkillRow[]
}
