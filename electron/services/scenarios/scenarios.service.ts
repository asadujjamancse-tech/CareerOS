import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export type ScenarioCategory =
  | 'it-support' | 'msp' | 'cloud' | 'interview' | 'troubleshooting' | 'custom'
  | 'active-directory' | 'windows-server' | 'networking' | 'microsoft-365' | 'azure' | 'cybersecurity' | 'hyper-v'
export type ScenarioDifficulty = 'beginner' | 'medium' | 'advanced' | 'expert'
export type AttemptStatus = 'in-progress' | 'completed' | 'abandoned'

export interface ScenarioRow {
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
}

export interface ScenarioStepRow {
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

export interface ScenarioAttemptRow {
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

export interface ScenarioWithStats extends ScenarioRow {
  total_attempts: number
  completed_attempts: number
  best_score: number | null
  avg_time_min: number | null
  step_count: number
}

export interface CreateScenarioParams {
  title: string
  description?: string | null
  category?: ScenarioCategory
  difficulty?: ScenarioDifficulty
  estimated_minutes?: number
  context_story: string
  success_criteria: string
  hints?: string | null
  solution?: string | null
  tags?: string[]
}

export interface CreateStepParams {
  scenario_id: string
  step_number: number
  title: string
  instruction: string
  expected_action?: string | null
  hint?: string | null
  is_checkpoint?: boolean
}

function nowIso(): string { return new Date().toISOString() }

export function getAllScenarios(db: Database, category?: ScenarioCategory, difficulty?: ScenarioDifficulty): ScenarioWithStats[] {
  let where = `s.is_active = 1`
  const bind: (string)[] = []
  if (category) { where += ` AND s.category = ?`; bind.push(category) }
  if (difficulty) { where += ` AND s.difficulty = ?`; bind.push(difficulty) }

  return db.prepare(`
    SELECT s.*,
      COUNT(DISTINCT sa.id) AS total_attempts,
      COUNT(DISTINCT CASE WHEN sa.status = 'completed' THEN sa.id END) AS completed_attempts,
      MAX(sa.score) AS best_score,
      AVG(CASE WHEN sa.status = 'completed' THEN sa.time_spent_min END) AS avg_time_min,
      (SELECT COUNT(*) FROM scenario_steps ss WHERE ss.scenario_id = s.id) AS step_count
    FROM learning_scenarios s
    LEFT JOIN scenario_attempts sa ON sa.scenario_id = s.id
    WHERE ${where}
    GROUP BY s.id
    ORDER BY s.category ASC, s.difficulty ASC
  `).all(...bind) as ScenarioWithStats[]
}

export function getScenarioById(db: Database, id: string): ScenarioWithStats | null {
  return db.prepare(`
    SELECT s.*,
      COUNT(DISTINCT sa.id) AS total_attempts,
      COUNT(DISTINCT CASE WHEN sa.status = 'completed' THEN sa.id END) AS completed_attempts,
      MAX(sa.score) AS best_score,
      AVG(CASE WHEN sa.status = 'completed' THEN sa.time_spent_min END) AS avg_time_min,
      (SELECT COUNT(*) FROM scenario_steps ss WHERE ss.scenario_id = s.id) AS step_count
    FROM learning_scenarios s
    LEFT JOIN scenario_attempts sa ON sa.scenario_id = s.id
    WHERE s.id = ?
    GROUP BY s.id
  `).get(id) as ScenarioWithStats | null
}

export function getScenarioSteps(db: Database, scenarioId: string): ScenarioStepRow[] {
  return db.prepare(`
    SELECT * FROM scenario_steps WHERE scenario_id = ? ORDER BY step_number ASC
  `).all(scenarioId) as ScenarioStepRow[]
}

export function createScenario(db: Database, params: CreateScenarioParams): ScenarioRow {
  const id = `scn_${nanoid(10)}`
  const now = nowIso()
  db.prepare(`
    INSERT INTO learning_scenarios
      (id, title, description, category, difficulty, estimated_minutes, context_story, success_criteria, hints, solution, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, params.title, params.description ?? null,
    params.category ?? 'custom', params.difficulty ?? 'medium',
    params.estimated_minutes ?? 30,
    params.context_story, params.success_criteria,
    params.hints ?? null, params.solution ?? null,
    JSON.stringify(params.tags ?? []),
    now, now
  )
  return db.prepare(`SELECT * FROM learning_scenarios WHERE id = ?`).get(id) as ScenarioRow
}

export function updateScenario(db: Database, id: string, params: Partial<CreateScenarioParams>): ScenarioRow {
  const sets: string[] = ['updated_at = ?']
  const vals: (string | number | null)[] = [nowIso()]

  if (params.title !== undefined) { sets.push('title = ?'); vals.push(params.title) }
  if (params.description !== undefined) { sets.push('description = ?'); vals.push(params.description) }
  if (params.category !== undefined) { sets.push('category = ?'); vals.push(params.category) }
  if (params.difficulty !== undefined) { sets.push('difficulty = ?'); vals.push(params.difficulty) }
  if (params.estimated_minutes !== undefined) { sets.push('estimated_minutes = ?'); vals.push(params.estimated_minutes) }
  if (params.context_story !== undefined) { sets.push('context_story = ?'); vals.push(params.context_story) }
  if (params.success_criteria !== undefined) { sets.push('success_criteria = ?'); vals.push(params.success_criteria) }
  if (params.hints !== undefined) { sets.push('hints = ?'); vals.push(params.hints) }
  if (params.solution !== undefined) { sets.push('solution = ?'); vals.push(params.solution) }
  if (params.tags !== undefined) { sets.push('tags = ?'); vals.push(JSON.stringify(params.tags)) }

  vals.push(id)
  db.prepare(`UPDATE learning_scenarios SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return db.prepare(`SELECT * FROM learning_scenarios WHERE id = ?`).get(id) as ScenarioRow
}

export function deleteScenario(db: Database, id: string): void {
  db.prepare(`UPDATE learning_scenarios SET is_active = 0, updated_at = ? WHERE id = ?`).run(nowIso(), id)
}

export function addStep(db: Database, params: CreateStepParams): ScenarioStepRow {
  const id = `step_${nanoid(10)}`
  const now = nowIso()
  db.prepare(`
    INSERT INTO scenario_steps (id, scenario_id, step_number, title, instruction, expected_action, hint, is_checkpoint, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, params.scenario_id, params.step_number, params.title, params.instruction, params.expected_action ?? null, params.hint ?? null, params.is_checkpoint ? 1 : 0, now)
  return db.prepare(`SELECT * FROM scenario_steps WHERE id = ?`).get(id) as ScenarioStepRow
}

export function updateStep(db: Database, id: string, params: Partial<Omit<CreateStepParams, 'scenario_id'>>): ScenarioStepRow {
  const sets: string[] = []
  const vals: (string | number | null)[] = []
  if (params.title !== undefined) { sets.push('title = ?'); vals.push(params.title) }
  if (params.instruction !== undefined) { sets.push('instruction = ?'); vals.push(params.instruction) }
  if (params.expected_action !== undefined) { sets.push('expected_action = ?'); vals.push(params.expected_action) }
  if (params.hint !== undefined) { sets.push('hint = ?'); vals.push(params.hint) }
  if (params.is_checkpoint !== undefined) { sets.push('is_checkpoint = ?'); vals.push(params.is_checkpoint ? 1 : 0) }
  if (sets.length === 0) return db.prepare(`SELECT * FROM scenario_steps WHERE id = ?`).get(id) as ScenarioStepRow
  vals.push(id)
  db.prepare(`UPDATE scenario_steps SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return db.prepare(`SELECT * FROM scenario_steps WHERE id = ?`).get(id) as ScenarioStepRow
}

export function deleteStep(db: Database, id: string): void {
  db.prepare(`DELETE FROM scenario_steps WHERE id = ?`).run(id)
}

export function startAttempt(db: Database, scenarioId: string): ScenarioAttemptRow {
  const id = `att_${nanoid(10)}`
  const now = nowIso()
  const stepCount = (db.prepare(`SELECT COUNT(*) AS c FROM scenario_steps WHERE scenario_id = ?`).get(scenarioId) as { c: number }).c
  db.prepare(`
    INSERT INTO scenario_attempts (id, scenario_id, status, steps_completed, total_steps, started_at)
    VALUES (?, ?, 'in-progress', 0, ?, ?)
  `).run(id, scenarioId, stepCount, now)
  return db.prepare(`SELECT * FROM scenario_attempts WHERE id = ?`).get(id) as ScenarioAttemptRow
}

export function updateAttempt(db: Database, id: string, updates: {
  status?: AttemptStatus
  steps_completed?: number
  notes?: string | null
  lessons_learned?: string | null
  time_spent_min?: number
  score?: number | null
}): ScenarioAttemptRow {
  const sets: string[] = []
  const vals: (string | number | null)[] = []

  if (updates.status !== undefined) {
    sets.push('status = ?'); vals.push(updates.status)
    if (updates.status === 'completed' || updates.status === 'abandoned') {
      sets.push('completed_at = ?'); vals.push(nowIso())
    }
  }
  if (updates.steps_completed !== undefined) { sets.push('steps_completed = ?'); vals.push(updates.steps_completed) }
  if (updates.notes !== undefined) { sets.push('notes = ?'); vals.push(updates.notes) }
  if (updates.lessons_learned !== undefined) { sets.push('lessons_learned = ?'); vals.push(updates.lessons_learned) }
  if (updates.time_spent_min !== undefined) { sets.push('time_spent_min = ?'); vals.push(updates.time_spent_min) }
  if (updates.score !== undefined) { sets.push('score = ?'); vals.push(updates.score) }

  if (sets.length === 0) return db.prepare(`SELECT * FROM scenario_attempts WHERE id = ?`).get(id) as ScenarioAttemptRow
  vals.push(id)
  db.prepare(`UPDATE scenario_attempts SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return db.prepare(`SELECT * FROM scenario_attempts WHERE id = ?`).get(id) as ScenarioAttemptRow
}

export function getAttemptsByScenario(db: Database, scenarioId: string): ScenarioAttemptRow[] {
  return db.prepare(`SELECT * FROM scenario_attempts WHERE scenario_id = ? ORDER BY started_at DESC`).all(scenarioId) as ScenarioAttemptRow[]
}

export function getScenarioStats(db: Database): {
  total_scenarios: number
  completed_scenarios: number
  total_attempts: number
  avg_score: number
} {
  const total_scenarios = (db.prepare(`SELECT COUNT(*) AS c FROM learning_scenarios WHERE is_active = 1`).get() as { c: number }).c
  const completed_scenarios = (db.prepare(`
    SELECT COUNT(DISTINCT scenario_id) AS c FROM scenario_attempts WHERE status = 'completed'
  `).get() as { c: number }).c
  const total_attempts = (db.prepare(`SELECT COUNT(*) AS c FROM scenario_attempts`).get() as { c: number }).c
  const avgRow = db.prepare(`SELECT AVG(score) AS avg_s FROM scenario_attempts WHERE status = 'completed' AND score IS NOT NULL`).get() as { avg_s: number | null }
  return { total_scenarios, completed_scenarios, total_attempts, avg_score: avgRow.avg_s ?? 0 }
}

export interface FeynmanRow {
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

export function getAllFeynmanEntries(db: Database): FeynmanRow[] {
  return db.prepare(`SELECT * FROM feynman_entries ORDER BY updated_at DESC`).all() as FeynmanRow[]
}

export function createFeynmanEntry(db: Database, params: {
  topic: string
  entity_type?: string | null
  entity_id?: string | null
  explanation: string
  gaps_identified?: string | null
  understanding_score?: number
}): FeynmanRow {
  const id = `feyn_${nanoid(10)}`
  const now = nowIso()
  db.prepare(`
    INSERT INTO feynman_entries (id, topic, entity_type, entity_id, explanation, gaps_identified, understanding_score, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, params.topic, params.entity_type ?? null, params.entity_id ?? null, params.explanation, params.gaps_identified ?? null, params.understanding_score ?? 0, now, now)
  return db.prepare(`SELECT * FROM feynman_entries WHERE id = ?`).get(id) as FeynmanRow
}

export function updateFeynmanEntry(db: Database, id: string, params: {
  explanation?: string
  gaps_identified?: string | null
  revised_explanation?: string | null
  understanding_score?: number
}): FeynmanRow {
  const sets: string[] = ['updated_at = ?']
  const vals: (string | number | null)[] = [nowIso()]
  if (params.explanation !== undefined) { sets.push('explanation = ?'); vals.push(params.explanation) }
  if (params.gaps_identified !== undefined) { sets.push('gaps_identified = ?'); vals.push(params.gaps_identified) }
  if (params.revised_explanation !== undefined) { sets.push('revised_explanation = ?'); vals.push(params.revised_explanation) }
  if (params.understanding_score !== undefined) { sets.push('understanding_score = ?'); vals.push(params.understanding_score) }
  vals.push(id)
  db.prepare(`UPDATE feynman_entries SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return db.prepare(`SELECT * FROM feynman_entries WHERE id = ?`).get(id) as FeynmanRow
}

export function deleteFeynmanEntry(db: Database, id: string): void {
  db.prepare(`DELETE FROM feynman_entries WHERE id = ?`).run(id)
}
