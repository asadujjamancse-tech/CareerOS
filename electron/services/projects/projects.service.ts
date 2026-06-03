import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

// ─── Row types ───────────────────────────────────────────────────────────────

export interface ProjectRow {
  id: string
  title: string
  slug: string
  summary: string | null
  description: string | null
  status: string
  type: string
  repo_url: string | null
  live_url: string | null
  cover_image_path: string | null
  is_featured: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProjectWithMeta extends ProjectRow {
  skill_count: number
  asset_count: number
  tag_count: number
}

export interface ProjectAssetRow {
  id: string
  project_id: string
  title: string
  description: string | null
  type: string
  file_path: string | null
  url: string | null
  mime_type: string | null
  file_size_bytes: number | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface SkillRefRow {
  id: string
  name: string
  proficiency_level: string
  status: string
  category_name: string
  category_color: string
}

export interface TagRow {
  id: string
  name: string
  slug: string
  color_hex: string
}

export interface ProjectDetail extends ProjectWithMeta {
  assets: ProjectAssetRow[]
  skills: SkillRefRow[]
  tags: TagRow[]
}

export interface PaginatedProjects {
  items: ProjectWithMeta[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetAllProjectsParams {
  search?: string | undefined
  status?: string | undefined
  type?: string | undefined
  is_featured?: boolean | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

export interface CreateProjectParams {
  title: string
  summary?: string | null
  description?: string | null
  status?: string
  type?: string
  repo_url?: string | null
  live_url?: string | null
  is_featured?: number
  started_at?: string | null
  completed_at?: string | null
  skill_ids?: string[]
  tag_ids?: string[]
}

export type UpdateProjectParams = Partial<CreateProjectParams>

export interface CreateProjectAssetParams {
  project_id: string
  title: string
  type: string
  description?: string | null
  file_path?: string | null
  url?: string | null
  mime_type?: string | null
  file_size_bytes?: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildFtsQuery(search: string): string {
  return search
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => `"${word.replace(/"/g, '')}"*`)
    .join(' ')
}

function nowIso(): string {
  return new Date().toISOString()
}

function uniqueSlug(db: Database, title: string, excludeId?: string): string {
  const base = slugify(title) || nanoid(8)
  const stmt = excludeId
    ? db.prepare('SELECT slug FROM projects WHERE slug LIKE ? AND id != ?')
    : db.prepare('SELECT slug FROM projects WHERE slug LIKE ?')
  const rows = (excludeId ? stmt.all(`${base}%`, excludeId) : stmt.all(`${base}%`)) as { slug: string }[]
  const taken = new Set(rows.map(r => r.slug))
  if (!taken.has(base)) return base
  for (let i = 2; i < 100; i++) {
    const c = `${base}-${i}`
    if (!taken.has(c)) return c
  }
  return `${base}-${nanoid(4)}`
}

// ─── Projects ─────────────────────────────────────────────────────────────────

const PROJECT_SELECT = `
  p.*,
  (SELECT COUNT(*) FROM project_skills ps WHERE ps.project_id = p.id) AS skill_count,
  (SELECT COUNT(*) FROM project_assets pa WHERE pa.project_id = p.id) AS asset_count,
  (SELECT COUNT(*) FROM entity_tags et WHERE et.entity_type = 'project' AND et.entity_id = p.id) AS tag_count
`

export function getAllProjects(db: Database, params: GetAllProjectsParams): PaginatedProjects {
  const { search, status, type, is_featured, page = 1, pageSize = 24 } = params
  const offset = (page - 1) * pageSize

  if (search?.trim()) {
    return searchProjectsFts(db, { search, status, type, is_featured, page, pageSize })
  }

  const bindParams = {
    status: status ?? null,
    type: type ?? null,
    is_featured: is_featured !== undefined ? (is_featured ? 1 : 0) : null,
    limit: pageSize,
    offset,
  }

  const WHERE = `
    WHERE p.deleted_at IS NULL
      AND (p.status = :status OR :status IS NULL)
      AND (p.type = :type OR :type IS NULL)
      AND (p.is_featured = :is_featured OR :is_featured IS NULL)
  `

  const total = (
    db.prepare(`SELECT COUNT(*) AS total FROM projects p ${WHERE}`).get(bindParams) as { total: number }
  ).total

  const items = db.prepare(`
    SELECT ${PROJECT_SELECT} FROM projects p ${WHERE}
    ORDER BY p.updated_at DESC
    LIMIT :limit OFFSET :offset
  `).all(bindParams) as ProjectWithMeta[]

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

function searchProjectsFts(db: Database, params: GetAllProjectsParams & { search: string; page: number; pageSize: number }): PaginatedProjects {
  const { search, status, type, is_featured, page, pageSize } = params
  const ftsQuery = buildFtsQuery(search)
  const offset = (page - 1) * pageSize

  const conditions: string[] = ['p.deleted_at IS NULL']
  const extra: Record<string, string | number | null> = {}

  if (status) { conditions.push('p.status = :status'); extra['status'] = status }
  if (type) { conditions.push('p.type = :type'); extra['type'] = type }
  if (is_featured !== undefined) {
    conditions.push('p.is_featured = :is_featured')
    extra['is_featured'] = is_featured ? 1 : 0
  }

  const extraWhere = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''
  const bind = { fts: ftsQuery, ...extra, limit: pageSize, offset }

  const total = (
    db.prepare(`
      SELECT COUNT(*) AS total
      FROM projects_fts
      JOIN projects p ON p.rowid = projects_fts.rowid
      WHERE projects_fts MATCH :fts ${extraWhere}
    `).get(bind) as { total: number }
  ).total

  const items = db.prepare(`
    SELECT ${PROJECT_SELECT}
    FROM projects_fts
    JOIN projects p ON p.rowid = projects_fts.rowid
    WHERE projects_fts MATCH :fts ${extraWhere}
    ORDER BY rank
    LIMIT :limit OFFSET :offset
  `).all(bind) as ProjectWithMeta[]

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export function getProjectById(db: Database, id: string): ProjectDetail | null {
  const project = db.prepare(`
    SELECT ${PROJECT_SELECT} FROM projects p
    WHERE p.id = ? AND p.deleted_at IS NULL
  `).get(id) as ProjectWithMeta | undefined

  if (!project) return null

  const assets = db.prepare(`
    SELECT * FROM project_assets WHERE project_id = ? ORDER BY order_index, created_at
  `).all(id) as ProjectAssetRow[]

  const skills = db.prepare(`
    SELECT s.id, s.name, s.proficiency_level, s.status,
           sc.name AS category_name, sc.color_hex AS category_color
    FROM skills s
    JOIN project_skills ps ON ps.skill_id = s.id
    JOIN skill_categories sc ON sc.id = s.category_id
    WHERE ps.project_id = ? AND s.deleted_at IS NULL
    ORDER BY s.name
  `).all(id) as SkillRefRow[]

  const tags = db.prepare(`
    SELECT t.id, t.name, t.slug, t.color_hex
    FROM tags t
    JOIN entity_tags et ON et.tag_id = t.id
    WHERE et.entity_type = 'project' AND et.entity_id = ?
    ORDER BY t.name
  `).all(id) as TagRow[]

  return { ...project, assets, skills, tags }
}

export function createProject(db: Database, params: CreateProjectParams): ProjectRow {
  const id = nanoid()
  const slug = uniqueSlug(db, params.title)
  const now = nowIso()

  db.prepare(`
    INSERT INTO projects (
      id, title, slug, summary, description, status, type,
      repo_url, live_url, is_featured, started_at, completed_at, created_at, updated_at
    ) VALUES (
      :id, :title, :slug, :summary, :description, :status, :type,
      :repo_url, :live_url, :is_featured, :started_at, :completed_at, :now, :now
    )
  `).run({
    id, slug, now,
    title: params.title,
    summary: params.summary ?? null,
    description: params.description ?? null,
    status: params.status ?? 'planning',
    type: params.type ?? 'personal',
    repo_url: params.repo_url ?? null,
    live_url: params.live_url ?? null,
    is_featured: params.is_featured ?? 0,
    started_at: params.started_at ?? null,
    completed_at: params.completed_at ?? null,
  })

  if (params.skill_ids?.length) syncProjectSkills(db, id, params.skill_ids)
  if (params.tag_ids?.length) syncProjectTags(db, id, params.tag_ids)

  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow
}

export function updateProject(db: Database, id: string, params: UpdateProjectParams): ProjectRow | null {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL').get(id) as ProjectRow | undefined
  if (!existing) return null

  const slug = params.title && params.title !== existing.title
    ? uniqueSlug(db, params.title, id)
    : existing.slug

  db.prepare(`
    UPDATE projects SET
      title        = COALESCE(:title, title),
      slug         = :slug,
      summary      = COALESCE(:summary, summary),
      description  = COALESCE(:description, description),
      status       = COALESCE(:status, status),
      type         = COALESCE(:type, type),
      repo_url     = COALESCE(:repo_url, repo_url),
      live_url     = COALESCE(:live_url, live_url),
      is_featured  = COALESCE(:is_featured, is_featured),
      started_at   = COALESCE(:started_at, started_at),
      completed_at = COALESCE(:completed_at, completed_at),
      updated_at   = :now
    WHERE id = :id AND deleted_at IS NULL
  `).run({
    id, slug, now: nowIso(),
    title: params.title ?? null,
    summary: params.summary ?? null,
    description: params.description ?? null,
    status: params.status ?? null,
    type: params.type ?? null,
    repo_url: params.repo_url ?? null,
    live_url: params.live_url ?? null,
    is_featured: params.is_featured ?? null,
    started_at: params.started_at ?? null,
    completed_at: params.completed_at ?? null,
  })

  if (params.skill_ids !== undefined) syncProjectSkills(db, id, params.skill_ids)
  if (params.tag_ids !== undefined) syncProjectTags(db, id, params.tag_ids)

  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow
}

export function softDeleteProject(db: Database, id: string): boolean {
  const result = db.prepare(
    'UPDATE projects SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL',
  ).run(nowIso(), id)
  return result.changes > 0
}

// ─── Project Assets ───────────────────────────────────────────────────────────

export function getProjectAssets(db: Database, projectId: string): ProjectAssetRow[] {
  return db.prepare(
    'SELECT * FROM project_assets WHERE project_id = ? ORDER BY order_index, created_at',
  ).all(projectId) as ProjectAssetRow[]
}

export function createProjectAsset(db: Database, params: CreateProjectAssetParams): ProjectAssetRow {
  const id = nanoid()
  const now = nowIso()
  const nextOrder = (
    db.prepare(
      'SELECT COALESCE(MAX(order_index), 0) + 1 AS next FROM project_assets WHERE project_id = ?',
    ).get(params.project_id) as { next: number }
  ).next

  db.prepare(`
    INSERT INTO project_assets (
      id, project_id, title, description, type, file_path, url,
      mime_type, file_size_bytes, order_index, created_at, updated_at
    ) VALUES (
      :id, :project_id, :title, :description, :type, :file_path, :url,
      :mime_type, :file_size_bytes, :order_index, :now, :now
    )
  `).run({
    id,
    project_id: params.project_id,
    title: params.title,
    description: params.description ?? null,
    type: params.type,
    file_path: params.file_path ?? null,
    url: params.url ?? null,
    mime_type: params.mime_type ?? null,
    file_size_bytes: params.file_size_bytes ?? null,
    order_index: nextOrder,
    now,
  })

  return db.prepare('SELECT * FROM project_assets WHERE id = ?').get(id) as ProjectAssetRow
}

export function deleteProjectAsset(db: Database, id: string): boolean {
  const result = db.prepare('DELETE FROM project_assets WHERE id = ?').run(id)
  return result.changes > 0
}

export function reorderProjectAssets(db: Database, projectId: string, orderedIds: string[]): void {
  const update = db.prepare(
    'UPDATE project_assets SET order_index = ? WHERE id = ? AND project_id = ?',
  )
  db.transaction(() => {
    orderedIds.forEach((id, idx) => update.run(idx, id, projectId))
  })()
}

// ─── Sync helpers ─────────────────────────────────────────────────────────────

function syncProjectSkills(db: Database, projectId: string, skillIds: string[]): void {
  db.prepare('DELETE FROM project_skills WHERE project_id = ?').run(projectId)
  const insert = db.prepare(
    'INSERT OR IGNORE INTO project_skills (project_id, skill_id) VALUES (?, ?)',
  )
  for (const skillId of skillIds) insert.run(projectId, skillId)
}

function syncProjectTags(db: Database, projectId: string, tagIds: string[]): void {
  db.prepare(`DELETE FROM entity_tags WHERE entity_type = 'project' AND entity_id = ?`).run(projectId)
  const insert = db.prepare(
    `INSERT OR IGNORE INTO entity_tags (tag_id, entity_type, entity_id) VALUES (?, 'project', ?)`,
  )
  for (const tagId of tagIds) insert.run(tagId, projectId)
}
