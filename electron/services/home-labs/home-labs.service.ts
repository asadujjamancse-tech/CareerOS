import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

// ── Row Types ────────────────────────────────────────────────────────────────

export interface HomeLabRow {
  id: string
  title: string
  slug: string
  description: string | null
  status: string
  notes: string | null
  lessons_learned: string | null
  completion_pct: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface HomeLabWithMeta extends HomeLabRow {
  task_count: number
  done_task_count: number
  total_minutes: number
  skill_count: number
  problem_count: number
  asset_count: number
}

export interface HomeLabTask {
  id: string
  lab_id: string
  title: string
  is_done: number
  order_index: number
  created_at: string
  updated_at: string
}

export interface HomeLabProblem {
  id: string
  lab_id: string
  problem: string
  solution: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface HomeLabTimeEntry {
  id: string
  lab_id: string
  duration_min: number
  note: string | null
  logged_date: string
  created_at: string
}

export interface HomeLabAsset {
  id: string
  lab_id: string
  title: string
  type: string
  file_path: string | null
  url: string | null
  notes: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface SkillRefRow {
  id: string
  name: string
  category_name: string
  category_color: string
  proficiency_level: string
}

export interface CertRefRow {
  id: string
  name: string
  issuer: string
  status: string
}

export interface HomeLabDetail extends HomeLabWithMeta {
  tasks: HomeLabTask[]
  problems: HomeLabProblem[]
  time_entries: HomeLabTimeEntry[]
  assets: HomeLabAsset[]
  skills: SkillRefRow[]
  certifications: CertRefRow[]
}

export interface PaginatedHomeLabs {
  items: HomeLabWithMeta[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetAllHomeLabsParams {
  search?: string | undefined
  status?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

export interface CreateHomeLabParams {
  title: string
  description?: string | null
  status?: string
  notes?: string | null
  lessons_learned?: string | null
  completion_pct?: number
  started_at?: string | null
  completed_at?: string | null
  skill_ids?: string[]
  certification_ids?: string[]
}

export type UpdateHomeLabParams = Partial<CreateHomeLabParams>

export interface CreateTaskParams {
  lab_id: string
  title: string
  order_index?: number
}

export interface UpdateTaskParams {
  title?: string
  is_done?: number
  order_index?: number
}

export interface CreateProblemParams {
  lab_id: string
  problem: string
  solution?: string | null
  order_index?: number
}

export interface UpdateProblemParams {
  problem?: string
  solution?: string | null
  order_index?: number
}

export interface LogTimeParams {
  lab_id: string
  duration_min: number
  note?: string | null
  logged_date?: string
}

export interface CreateAssetParams {
  lab_id: string
  title: string
  type?: string
  file_path?: string | null
  url?: string | null
  notes?: string | null
  order_index?: number
}

export interface UpdateAssetParams {
  title?: string
  notes?: string | null
  order_index?: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function nowIso(): string { return new Date().toISOString() }

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || nanoid(8)
}

function uniqueSlug(db: Database, base: string, excludeId?: string): string {
  const exists = (s: string) => {
    const row = excludeId
      ? db.prepare('SELECT id FROM home_labs WHERE slug = ? AND id != ?').get(s, excludeId)
      : db.prepare('SELECT id FROM home_labs WHERE slug = ?').get(s)
    return !!row
  }
  if (!exists(base)) return base
  for (let i = 1; i < 100; i++) {
    const candidate = `${base}-${i}`
    if (!exists(candidate)) return candidate
  }
  return `${base}-${nanoid(6)}`
}

const LAB_SELECT = `
  l.id, l.title, l.slug, l.description, l.status, l.notes, l.lessons_learned,
  l.completion_pct, l.started_at, l.completed_at, l.created_at, l.updated_at, l.deleted_at,
  (SELECT COUNT(*) FROM home_lab_tasks WHERE lab_id = l.id) AS task_count,
  (SELECT COUNT(*) FROM home_lab_tasks WHERE lab_id = l.id AND is_done = 1) AS done_task_count,
  (SELECT COALESCE(SUM(duration_min), 0) FROM home_lab_time_entries WHERE lab_id = l.id) AS total_minutes,
  (SELECT COUNT(*) FROM home_lab_skills WHERE lab_id = l.id) AS skill_count,
  (SELECT COUNT(*) FROM home_lab_problems WHERE lab_id = l.id) AS problem_count,
  (SELECT COUNT(*) FROM home_lab_assets WHERE lab_id = l.id) AS asset_count
`

// ── CRUD ─────────────────────────────────────────────────────────────────────

export function getAllHomeLabs(db: Database, params: GetAllHomeLabsParams): PaginatedHomeLabs {
  const { search, status, page = 1, pageSize = 24 } = params
  const offset = (page - 1) * pageSize

  const bind: Record<string, string | number | null> = {
    status: status ?? null,
    search: search?.trim() ? `%${search.trim()}%` : null,
    limit: pageSize,
    offset,
  }

  const WHERE = `WHERE l.deleted_at IS NULL
    AND (l.status = :status OR :status IS NULL)
    AND (:search IS NULL OR l.title LIKE :search OR l.description LIKE :search)`

  const total = (
    db.prepare(`SELECT COUNT(*) AS total FROM home_labs l ${WHERE}`).get(bind) as { total: number }
  ).total

  const items = db.prepare(
    `SELECT ${LAB_SELECT} FROM home_labs l ${WHERE} ORDER BY l.updated_at DESC LIMIT :limit OFFSET :offset`,
  ).all(bind) as HomeLabWithMeta[]

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export function getHomeLabById(db: Database, id: string): HomeLabDetail | null {
  const lab = db.prepare(
    `SELECT ${LAB_SELECT} FROM home_labs l WHERE l.id = ? AND l.deleted_at IS NULL`,
  ).get(id) as HomeLabWithMeta | undefined
  if (!lab) return null

  const tasks = db.prepare(
    'SELECT * FROM home_lab_tasks WHERE lab_id = ? ORDER BY order_index, created_at',
  ).all(id) as HomeLabTask[]

  const problems = db.prepare(
    'SELECT * FROM home_lab_problems WHERE lab_id = ? ORDER BY order_index, created_at',
  ).all(id) as HomeLabProblem[]

  const time_entries = db.prepare(
    'SELECT * FROM home_lab_time_entries WHERE lab_id = ? ORDER BY logged_date DESC, created_at DESC',
  ).all(id) as HomeLabTimeEntry[]

  const assets = db.prepare(
    'SELECT * FROM home_lab_assets WHERE lab_id = ? ORDER BY order_index, created_at',
  ).all(id) as HomeLabAsset[]

  const skills = db.prepare(
    `SELECT s.id, s.name, sc.name AS category_name, sc.color_hex AS category_color, s.proficiency_level
     FROM skills s
     JOIN skill_categories sc ON sc.id = s.category_id
     JOIN home_lab_skills hls ON hls.skill_id = s.id
     WHERE hls.lab_id = ? AND s.deleted_at IS NULL
     ORDER BY s.name`,
  ).all(id) as SkillRefRow[]

  const certifications = db.prepare(
    `SELECT c.id, c.name, c.issuer, c.status
     FROM certifications c
     JOIN home_lab_certifications hlc ON hlc.certification_id = c.id
     WHERE hlc.lab_id = ? AND c.deleted_at IS NULL
     ORDER BY c.name`,
  ).all(id) as CertRefRow[]

  return { ...lab, tasks, problems, time_entries, assets, skills, certifications }
}

export function createHomeLab(db: Database, params: CreateHomeLabParams): HomeLabRow {
  const id = nanoid()
  const now = nowIso()
  const slug = uniqueSlug(db, slugify(params.title))

  db.transaction(() => {
    db.prepare(`
      INSERT INTO home_labs (id, title, slug, description, status, notes, lessons_learned,
        completion_pct, started_at, completed_at, created_at, updated_at)
      VALUES (:id, :title, :slug, :description, :status, :notes, :lessons_learned,
        :completion_pct, :started_at, :completed_at, :now, :now)
    `).run({
      id, slug, now,
      title: params.title,
      description: params.description ?? null,
      status: params.status ?? 'planned',
      notes: params.notes ?? null,
      lessons_learned: params.lessons_learned ?? null,
      completion_pct: params.completion_pct ?? 0,
      started_at: params.started_at ?? null,
      completed_at: params.completed_at ?? null,
    })
    if (params.skill_ids?.length) syncSkills(db, id, params.skill_ids)
    if (params.certification_ids?.length) syncCertifications(db, id, params.certification_ids)
  })()

  return db.prepare('SELECT * FROM home_labs WHERE id = ?').get(id) as HomeLabRow
}

export function updateHomeLab(db: Database, id: string, params: UpdateHomeLabParams): HomeLabRow | null {
  const existing = db.prepare('SELECT * FROM home_labs WHERE id = ? AND deleted_at IS NULL').get(id) as HomeLabRow | undefined
  if (!existing) return null

  const newSlug = params.title && params.title !== existing.title
    ? uniqueSlug(db, slugify(params.title), id)
    : undefined

  db.transaction(() => {
    db.prepare(`
      UPDATE home_labs SET
        title           = COALESCE(:title, title),
        slug            = COALESCE(:slug, slug),
        description     = COALESCE(:description, description),
        status          = COALESCE(:status, status),
        notes           = COALESCE(:notes, notes),
        lessons_learned = COALESCE(:lessons_learned, lessons_learned),
        completion_pct  = COALESCE(:completion_pct, completion_pct),
        started_at      = COALESCE(:started_at, started_at),
        completed_at    = COALESCE(:completed_at, completed_at),
        updated_at      = :now
      WHERE id = :id AND deleted_at IS NULL
    `).run({
      id, now: nowIso(),
      title: params.title ?? null,
      slug: newSlug ?? null,
      description: params.description ?? null,
      status: params.status ?? null,
      notes: params.notes ?? null,
      lessons_learned: params.lessons_learned ?? null,
      completion_pct: params.completion_pct ?? null,
      started_at: params.started_at ?? null,
      completed_at: params.completed_at ?? null,
    })
    if (params.skill_ids !== undefined) syncSkills(db, id, params.skill_ids)
    if (params.certification_ids !== undefined) syncCertifications(db, id, params.certification_ids)
  })()

  return db.prepare('SELECT * FROM home_labs WHERE id = ?').get(id) as HomeLabRow
}

export function softDeleteHomeLab(db: Database, id: string): boolean {
  return (
    db.prepare('UPDATE home_labs SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL').run(nowIso(), id)
  ).changes > 0
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export function getLabTasks(db: Database, labId: string): HomeLabTask[] {
  return db.prepare(
    'SELECT * FROM home_lab_tasks WHERE lab_id = ? ORDER BY order_index, created_at',
  ).all(labId) as HomeLabTask[]
}

export function createTask(db: Database, params: CreateTaskParams): HomeLabTask {
  const id = nanoid()
  const now = nowIso()
  const maxOrder = (db.prepare(
    'SELECT COALESCE(MAX(order_index), -1) AS m FROM home_lab_tasks WHERE lab_id = ?',
  ).get(params.lab_id) as { m: number }).m
  db.prepare(
    'INSERT INTO home_lab_tasks (id, lab_id, title, is_done, order_index, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?, ?)',
  ).run(id, params.lab_id, params.title, params.order_index ?? maxOrder + 1, now, now)
  return db.prepare('SELECT * FROM home_lab_tasks WHERE id = ?').get(id) as HomeLabTask
}

export function updateTask(db: Database, id: string, params: UpdateTaskParams): HomeLabTask | null {
  const existing = db.prepare('SELECT * FROM home_lab_tasks WHERE id = ?').get(id) as HomeLabTask | undefined
  if (!existing) return null
  db.prepare(`
    UPDATE home_lab_tasks SET
      title       = COALESCE(:title, title),
      is_done     = COALESCE(:is_done, is_done),
      order_index = COALESCE(:order_index, order_index),
      updated_at  = :now
    WHERE id = :id
  `).run({ id, now: nowIso(), title: params.title ?? null, is_done: params.is_done ?? null, order_index: params.order_index ?? null })
  return db.prepare('SELECT * FROM home_lab_tasks WHERE id = ?').get(id) as HomeLabTask
}

export function deleteTask(db: Database, id: string): boolean {
  return (db.prepare('DELETE FROM home_lab_tasks WHERE id = ?').run(id)).changes > 0
}

// ── Problems ─────────────────────────────────────────────────────────────────

export function createProblem(db: Database, params: CreateProblemParams): HomeLabProblem {
  const id = nanoid()
  const now = nowIso()
  const maxOrder = (db.prepare(
    'SELECT COALESCE(MAX(order_index), -1) AS m FROM home_lab_problems WHERE lab_id = ?',
  ).get(params.lab_id) as { m: number }).m
  db.prepare(
    'INSERT INTO home_lab_problems (id, lab_id, problem, solution, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, params.lab_id, params.problem, params.solution ?? null, params.order_index ?? maxOrder + 1, now, now)
  return db.prepare('SELECT * FROM home_lab_problems WHERE id = ?').get(id) as HomeLabProblem
}

export function updateProblem(db: Database, id: string, params: UpdateProblemParams): HomeLabProblem | null {
  if (!db.prepare('SELECT id FROM home_lab_problems WHERE id = ?').get(id)) return null
  db.prepare(`
    UPDATE home_lab_problems SET
      problem     = COALESCE(:problem, problem),
      solution    = COALESCE(:solution, solution),
      order_index = COALESCE(:order_index, order_index),
      updated_at  = :now
    WHERE id = :id
  `).run({ id, now: nowIso(), problem: params.problem ?? null, solution: params.solution ?? null, order_index: params.order_index ?? null })
  return db.prepare('SELECT * FROM home_lab_problems WHERE id = ?').get(id) as HomeLabProblem
}

export function deleteProblem(db: Database, id: string): boolean {
  return (db.prepare('DELETE FROM home_lab_problems WHERE id = ?').run(id)).changes > 0
}

// ── Time Entries ─────────────────────────────────────────────────────────────

export function logTime(db: Database, params: LogTimeParams): HomeLabTimeEntry {
  const id = nanoid()
  const now = nowIso()
  db.prepare(
    'INSERT INTO home_lab_time_entries (id, lab_id, duration_min, note, logged_date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(id, params.lab_id, params.duration_min, params.note ?? null, params.logged_date ?? now.slice(0, 10), now)
  return db.prepare('SELECT * FROM home_lab_time_entries WHERE id = ?').get(id) as HomeLabTimeEntry
}

export function deleteTimeEntry(db: Database, id: string): boolean {
  return (db.prepare('DELETE FROM home_lab_time_entries WHERE id = ?').run(id)).changes > 0
}

export function getTimeEntries(db: Database, labId: string): HomeLabTimeEntry[] {
  return db.prepare(
    'SELECT * FROM home_lab_time_entries WHERE lab_id = ? ORDER BY logged_date DESC, created_at DESC',
  ).all(labId) as HomeLabTimeEntry[]
}

// ── Assets ───────────────────────────────────────────────────────────────────

export function createAsset(db: Database, params: CreateAssetParams): HomeLabAsset {
  const id = nanoid()
  const now = nowIso()
  const maxOrder = (db.prepare(
    'SELECT COALESCE(MAX(order_index), -1) AS m FROM home_lab_assets WHERE lab_id = ?',
  ).get(params.lab_id) as { m: number }).m
  db.prepare(
    'INSERT INTO home_lab_assets (id, lab_id, title, type, file_path, url, notes, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, params.lab_id, params.title, params.type ?? 'screenshot', params.file_path ?? null, params.url ?? null, params.notes ?? null, params.order_index ?? maxOrder + 1, now, now)
  return db.prepare('SELECT * FROM home_lab_assets WHERE id = ?').get(id) as HomeLabAsset
}

export function updateAsset(db: Database, id: string, params: UpdateAssetParams): HomeLabAsset | null {
  if (!db.prepare('SELECT id FROM home_lab_assets WHERE id = ?').get(id)) return null
  db.prepare(`
    UPDATE home_lab_assets SET
      title       = COALESCE(:title, title),
      notes       = COALESCE(:notes, notes),
      order_index = COALESCE(:order_index, order_index),
      updated_at  = :now
    WHERE id = :id
  `).run({ id, now: nowIso(), title: params.title ?? null, notes: params.notes ?? null, order_index: params.order_index ?? null })
  return db.prepare('SELECT * FROM home_lab_assets WHERE id = ?').get(id) as HomeLabAsset
}

export function deleteAsset(db: Database, id: string): boolean {
  return (db.prepare('DELETE FROM home_lab_assets WHERE id = ?').run(id)).changes > 0
}

// ── Sync helpers ─────────────────────────────────────────────────────────────

function syncSkills(db: Database, labId: string, skillIds: string[]): void {
  db.prepare('DELETE FROM home_lab_skills WHERE lab_id = ?').run(labId)
  const ins = db.prepare('INSERT OR IGNORE INTO home_lab_skills (lab_id, skill_id) VALUES (?, ?)')
  for (const sid of skillIds) ins.run(labId, sid)
}

function syncCertifications(db: Database, labId: string, certIds: string[]): void {
  db.prepare('DELETE FROM home_lab_certifications WHERE lab_id = ?').run(labId)
  const ins = db.prepare('INSERT OR IGNORE INTO home_lab_certifications (lab_id, certification_id) VALUES (?, ?)')
  for (const cid of certIds) ins.run(labId, cid)
}

// ── Recompute completion_pct from tasks ───────────────────────────────────────

export function recomputeCompletion(db: Database, labId: string): void {
  const row = db.prepare(
    'SELECT COUNT(*) AS total, SUM(is_done) AS done FROM home_lab_tasks WHERE lab_id = ?',
  ).get(labId) as { total: number; done: number | null }
  if (row.total === 0) return
  const pct = Math.round(((row.done ?? 0) / row.total) * 100)
  db.prepare('UPDATE home_labs SET completion_pct = ?, updated_at = ? WHERE id = ?').run(pct, nowIso(), labId)
}
