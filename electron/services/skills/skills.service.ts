import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

// ─── Row types (mirror DB schema exactly) ───────────────────────────────────

export interface SkillRow {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string
  proficiency_level: string
  status: string
  years_experience: number
  notes: string | null
  is_public: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface SkillWithCategory extends SkillRow {
  category_name: string
  category_color: string
  tag_count: number
}

export interface TagRow {
  id: string
  name: string
  slug: string
  color_hex: string
  created_at: string
  updated_at: string
}

export interface OccupationRefRow {
  id: string
  title: string
  seniority_level: string | null
  status: string
  importance: string
  is_acquired: number
}

export interface VideoRefRow {
  id: string
  title: string
  source: string
  watch_status: string
  duration_seconds: number | null
  thumbnail_path: string | null
}

export interface SkillDetail extends SkillWithCategory {
  tags: TagRow[]
  related_occupations: OccupationRefRow[]
  related_videos: VideoRefRow[]
}

export interface PaginatedSkills {
  items: SkillWithCategory[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetAllParams {
  search?: string | undefined
  category_id?: string | undefined
  proficiency_level?: string | undefined
  status?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

export interface CreateSkillParams {
  name: string
  category_id: string
  description?: string | null
  proficiency_level?: string
  status?: string
  years_experience?: number
  notes?: string | null
  is_public?: number
  tag_ids?: string[]
}

export type UpdateSkillParams = Partial<CreateSkillParams>

export interface SkillCategoryRow {
  id: string
  name: string
  description: string | null
  color_hex: string
  icon: string | null
  parent_id: string | null
  order_index: number
  created_at: string
  updated_at: string
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

function uniqueSlug(db: Database, name: string, excludeId?: string): string {
  const base = slugify(name) || nanoid(8)
  const stmt = excludeId
    ? db.prepare(`SELECT slug FROM skills WHERE slug LIKE ? AND id != ?`)
    : db.prepare(`SELECT slug FROM skills WHERE slug LIKE ?`)

  const rows = (
    excludeId ? stmt.all(`${base}%`, excludeId) : stmt.all(`${base}%`)
  ) as { slug: string }[]

  const taken = new Set(rows.map(r => r.slug))
  if (!taken.has(base)) return base

  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`
    if (!taken.has(candidate)) return candidate
  }
  return `${base}-${nanoid(4)}`
}

// ─── Skills ──────────────────────────────────────────────────────────────────

const SKILL_SELECT = `
  s.id, s.name, s.slug, s.description, s.category_id,
  s.proficiency_level, s.status, s.years_experience, s.notes,
  s.is_public, s.created_at, s.updated_at, s.deleted_at,
  sc.name AS category_name, sc.color_hex AS category_color,
  (SELECT COUNT(*) FROM entity_tags WHERE entity_type = 'skill' AND entity_id = s.id) AS tag_count
`

const SKILL_FROM = `
  FROM skills s
  JOIN skill_categories sc ON sc.id = s.category_id
`

export function getAllSkills(db: Database, params: GetAllParams): PaginatedSkills {
  const { search, category_id, proficiency_level, status, page = 1, pageSize = 24 } = params
  const offset = (page - 1) * pageSize

  if (search?.trim()) {
    return searchSkillsFts(db, { search, category_id, proficiency_level, status, page, pageSize })
  }

  const bindParams = {
    category_id: category_id ?? null,
    proficiency_level: proficiency_level ?? null,
    status: status ?? null,
    limit: pageSize,
    offset,
  }

  const WHERE = `
    WHERE s.deleted_at IS NULL
      AND (s.category_id = :category_id OR :category_id IS NULL)
      AND (s.proficiency_level = :proficiency_level OR :proficiency_level IS NULL)
      AND (s.status = :status OR :status IS NULL)
  `

  const total = (
    db.prepare(`SELECT COUNT(*) AS total ${SKILL_FROM} ${WHERE}`).get(bindParams) as { total: number }
  ).total

  const items = db.prepare(`
    SELECT ${SKILL_SELECT} ${SKILL_FROM} ${WHERE}
    ORDER BY s.updated_at DESC
    LIMIT :limit OFFSET :offset
  `).all(bindParams) as SkillWithCategory[]

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

function searchSkillsFts(
  db: Database,
  params: GetAllParams & { search: string; page: number; pageSize: number },
): PaginatedSkills {
  const { search, category_id, proficiency_level, status, page, pageSize } = params
  const ftsQuery = buildFtsQuery(search)
  const offset = (page - 1) * pageSize

  const conditions: string[] = ['s.deleted_at IS NULL']
  const extraParams: Record<string, string | number | null> = {}

  if (category_id) {
    conditions.push('s.category_id = :category_id')
    extraParams['category_id'] = category_id
  }
  if (proficiency_level) {
    conditions.push('s.proficiency_level = :proficiency_level')
    extraParams['proficiency_level'] = proficiency_level
  }
  if (status) {
    conditions.push('s.status = :status')
    extraParams['status'] = status
  }

  const extraWhere = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''
  const bindParams = { fts: ftsQuery, ...extraParams, limit: pageSize, offset }

  const total = (
    db.prepare(`
      SELECT COUNT(*) AS total
      FROM skills_fts
      JOIN skills s ON s.rowid = skills_fts.rowid
      WHERE skills_fts MATCH :fts ${extraWhere}
    `).get(bindParams) as { total: number }
  ).total

  const items = db.prepare(`
    SELECT ${SKILL_SELECT}
    FROM skills_fts
    JOIN skills s ON s.rowid = skills_fts.rowid
    JOIN skill_categories sc ON sc.id = s.category_id
    WHERE skills_fts MATCH :fts ${extraWhere}
    ORDER BY rank
    LIMIT :limit OFFSET :offset
  `).all(bindParams) as SkillWithCategory[]

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export function getSkillById(db: Database, id: string): SkillDetail | null {
  const skill = db.prepare(`
    SELECT ${SKILL_SELECT} ${SKILL_FROM}
    WHERE s.id = ? AND s.deleted_at IS NULL
  `).get(id) as SkillWithCategory | undefined

  if (!skill) return null

  const tags = db.prepare(`
    SELECT t.id, t.name, t.slug, t.color_hex, t.created_at, t.updated_at
    FROM tags t
    JOIN entity_tags et ON et.tag_id = t.id
    WHERE et.entity_type = 'skill' AND et.entity_id = ?
    ORDER BY t.name
  `).all(id) as TagRow[]

  const related_occupations = db.prepare(`
    SELECT o.id, o.title, o.seniority_level, o.status,
           os.importance, os.is_acquired
    FROM occupations o
    JOIN occupation_skills os ON os.occupation_id = o.id
    WHERE os.skill_id = ? AND o.deleted_at IS NULL
    ORDER BY os.importance, o.title
  `).all(id) as OccupationRefRow[]

  const related_videos = db.prepare(`
    SELECT v.id, v.title, v.source, v.watch_status, v.duration_seconds, v.thumbnail_path
    FROM videos v
    JOIN video_skills vs ON vs.video_id = v.id
    WHERE vs.skill_id = ? AND v.deleted_at IS NULL
    ORDER BY v.title
  `).all(id) as VideoRefRow[]

  return { ...skill, tags, related_occupations, related_videos }
}

export function createSkill(db: Database, params: CreateSkillParams): SkillRow {
  const id = nanoid()
  const slug = uniqueSlug(db, params.name)
  const now = nowIso()

  db.prepare(`
    INSERT INTO skills (
      id, name, slug, description, category_id,
      proficiency_level, status, years_experience, notes, is_public,
      created_at, updated_at
    ) VALUES (
      :id, :name, :slug, :description, :category_id,
      :proficiency_level, :status, :years_experience, :notes, :is_public,
      :now, :now
    )
  `).run({
    id,
    name: params.name,
    slug,
    description: params.description ?? null,
    category_id: params.category_id,
    proficiency_level: params.proficiency_level ?? 'beginner',
    status: params.status ?? 'learning',
    years_experience: params.years_experience ?? 0,
    notes: params.notes ?? null,
    is_public: params.is_public ?? 1,
    now,
  })

  if (params.tag_ids?.length) {
    syncTags(db, id, params.tag_ids)
  }

  return db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as SkillRow
}

export function updateSkill(db: Database, id: string, params: UpdateSkillParams): SkillRow | null {
  const existing = db.prepare('SELECT * FROM skills WHERE id = ? AND deleted_at IS NULL').get(id) as SkillRow | undefined
  if (!existing) return null

  const now = nowIso()
  const slug = params.name && params.name !== existing.name
    ? uniqueSlug(db, params.name, id)
    : existing.slug

  db.prepare(`
    UPDATE skills SET
      name              = COALESCE(:name, name),
      slug              = :slug,
      description       = COALESCE(:description, description),
      category_id       = COALESCE(:category_id, category_id),
      proficiency_level = COALESCE(:proficiency_level, proficiency_level),
      status            = COALESCE(:status, status),
      years_experience  = COALESCE(:years_experience, years_experience),
      notes             = COALESCE(:notes, notes),
      is_public         = COALESCE(:is_public, is_public),
      updated_at        = :now
    WHERE id = ? AND deleted_at IS NULL
  `).run(
    {
      name: params.name ?? null,
      slug,
      description: params.description ?? null,
      category_id: params.category_id ?? null,
      proficiency_level: params.proficiency_level ?? null,
      status: params.status ?? null,
      years_experience: params.years_experience ?? null,
      notes: params.notes ?? null,
      is_public: params.is_public ?? null,
      now,
    },
    id,
  )

  if (params.tag_ids !== undefined) {
    syncTags(db, id, params.tag_ids)
  }

  return db.prepare('SELECT * FROM skills WHERE id = ?').get(id) as SkillRow
}

export function softDeleteSkill(db: Database, id: string): boolean {
  const result = db.prepare(
    `UPDATE skills SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL`,
  ).run(nowIso(), id)
  return result.changes > 0
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

function syncTags(db: Database, entityId: string, tagIds: string[]): void {
  db.prepare(`DELETE FROM entity_tags WHERE entity_type = 'skill' AND entity_id = ?`).run(entityId)
  const insert = db.prepare(
    `INSERT OR IGNORE INTO entity_tags (tag_id, entity_type, entity_id) VALUES (?, 'skill', ?)`,
  )
  for (const tagId of tagIds) {
    insert.run(tagId, entityId)
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function getAllCategories(db: Database): SkillCategoryRow[] {
  return db.prepare(`
    SELECT * FROM skill_categories ORDER BY order_index, name
  `).all() as SkillCategoryRow[]
}

export function createCategory(
  db: Database,
  params: { name: string; description?: string | null; color_hex?: string; icon?: string | null; parent_id?: string | null; order_index?: number },
): SkillCategoryRow {
  const id = nanoid()
  const now = nowIso()
  db.prepare(`
    INSERT INTO skill_categories (id, name, description, color_hex, icon, parent_id, order_index, created_at, updated_at)
    VALUES (:id, :name, :description, :color_hex, :icon, :parent_id, :order_index, :now, :now)
  `).run({
    id,
    name: params.name,
    description: params.description ?? null,
    color_hex: params.color_hex ?? '#6B7280',
    icon: params.icon ?? null,
    parent_id: params.parent_id ?? null,
    order_index: params.order_index ?? 0,
    now,
  })
  return db.prepare('SELECT * FROM skill_categories WHERE id = ?').get(id) as SkillCategoryRow
}

export function updateCategory(
  db: Database,
  id: string,
  params: Partial<{ name: string; description: string | null; color_hex: string; icon: string | null; parent_id: string | null; order_index: number }>,
): SkillCategoryRow | null {
  const existing = db.prepare('SELECT * FROM skill_categories WHERE id = ?').get(id)
  if (!existing) return null
  db.prepare(`
    UPDATE skill_categories SET
      name        = COALESCE(:name, name),
      description = COALESCE(:description, description),
      color_hex   = COALESCE(:color_hex, color_hex),
      icon        = COALESCE(:icon, icon),
      parent_id   = COALESCE(:parent_id, parent_id),
      order_index = COALESCE(:order_index, order_index),
      updated_at  = :now
    WHERE id = :id
  `).run({ ...params, id, now: nowIso() })
  return db.prepare('SELECT * FROM skill_categories WHERE id = ?').get(id) as SkillCategoryRow
}

export function deleteCategory(db: Database, id: string): boolean {
  const hasSkills = (
    db.prepare('SELECT COUNT(*) AS n FROM skills WHERE category_id = ? AND deleted_at IS NULL').get(id) as { n: number }
  ).n > 0
  if (hasSkills) return false
  const result = db.prepare('DELETE FROM skill_categories WHERE id = ?').run(id)
  return result.changes > 0
}
