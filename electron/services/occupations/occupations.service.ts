import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

// ─── Row types (mirror DB schema exactly) ────────────────────────────────────

export interface OccupationRow {
  id: string
  title: string
  description: string | null
  industry: string | null
  seniority_level: string | null
  status: string
  target_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface OccupationWithStats extends OccupationRow {
  skill_count: number
  acquired_count: number
  critical_count: number
  tag_count: number
}

export interface OccupationSkillRow {
  id: string
  occupation_id: string
  skill_id: string
  importance: string
  is_acquired: number
  order_index: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OccupationSkillWithSkill extends OccupationSkillRow {
  skill_name: string
  skill_category_name: string
  skill_category_color: string
  skill_proficiency_level: string
  skill_status: string
}

export interface TagRefRow {
  id: string
  name: string
  slug: string
  color_hex: string
  created_at: string
  updated_at: string
}

export interface OccupationDetail extends OccupationWithStats {
  skills: OccupationSkillWithSkill[]
  tags: TagRefRow[]
}

export interface PaginatedOccupations {
  items: OccupationWithStats[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetAllOccupationsParams {
  search?: string | undefined
  status?: string | undefined
  seniority_level?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

export interface SkillEntry {
  skill_id: string
  importance: string
}

export interface CreateOccupationParams {
  title: string
  description?: string | null
  industry?: string | null
  seniority_level?: string | null
  status?: string
  target_date?: string | null
  notes?: string | null
  skill_entries?: SkillEntry[]
  tag_ids?: string[]
}

export type UpdateOccupationParams = Partial<CreateOccupationParams>

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Select fragments ─────────────────────────────────────────────────────────

const OCC_STATS_SELECT = `
  o.id, o.title, o.description, o.industry, o.seniority_level,
  o.status, o.target_date, o.notes, o.created_at, o.updated_at, o.deleted_at,
  (SELECT COUNT(*) FROM occupation_skills WHERE occupation_id = o.id)                                    AS skill_count,
  (SELECT COUNT(*) FROM occupation_skills WHERE occupation_id = o.id AND is_acquired = 1)               AS acquired_count,
  (SELECT COUNT(*) FROM occupation_skills WHERE occupation_id = o.id AND importance = 'critical')       AS critical_count,
  (SELECT COUNT(*) FROM entity_tags     WHERE entity_type = 'occupation' AND entity_id = o.id)          AS tag_count
`

// ─── Query: list ──────────────────────────────────────────────────────────────

export function getAllOccupations(db: Database, params: GetAllOccupationsParams): PaginatedOccupations {
  const { search, status, seniority_level, page = 1, pageSize = 24 } = params
  const offset = (page - 1) * pageSize

  if (search?.trim()) {
    return searchOccupationsFts(db, { search, status, seniority_level, page, pageSize })
  }

  const bind = {
    status: status ?? null,
    seniority_level: seniority_level ?? null,
    limit: pageSize,
    offset,
  }

  const WHERE = `
    WHERE o.deleted_at IS NULL
      AND (o.status          = :status          OR :status          IS NULL)
      AND (o.seniority_level = :seniority_level OR :seniority_level IS NULL)
  `

  const total = (
    db.prepare(`SELECT COUNT(*) AS total FROM occupations o ${WHERE}`).get(bind) as { total: number }
  ).total

  const items = db.prepare(`
    SELECT ${OCC_STATS_SELECT} FROM occupations o ${WHERE}
    ORDER BY o.updated_at DESC
    LIMIT :limit OFFSET :offset
  `).all(bind) as OccupationWithStats[]

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

function searchOccupationsFts(
  db: Database,
  params: GetAllOccupationsParams & { search: string; page: number; pageSize: number },
): PaginatedOccupations {
  const { search, status, seniority_level, page, pageSize } = params
  const ftsQuery = buildFtsQuery(search)
  const offset = (page - 1) * pageSize

  const conditions: string[] = ['o.deleted_at IS NULL']
  const extraParams: Record<string, string | number | null> = {}

  if (status) {
    conditions.push('o.status = :status')
    extraParams['status'] = status
  }
  if (seniority_level) {
    conditions.push('o.seniority_level = :seniority_level')
    extraParams['seniority_level'] = seniority_level
  }

  const extraWhere = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''
  const bind = { fts: ftsQuery, ...extraParams, limit: pageSize, offset }

  const total = (
    db.prepare(`
      SELECT COUNT(*) AS total
      FROM occupations_fts
      JOIN occupations o ON o.rowid = occupations_fts.rowid
      WHERE occupations_fts MATCH :fts ${extraWhere}
    `).get(bind) as { total: number }
  ).total

  const items = db.prepare(`
    SELECT ${OCC_STATS_SELECT}
    FROM occupations_fts
    JOIN occupations o ON o.rowid = occupations_fts.rowid
    WHERE occupations_fts MATCH :fts ${extraWhere}
    ORDER BY rank
    LIMIT :limit OFFSET :offset
  `).all(bind) as OccupationWithStats[]

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ─── Query: detail ────────────────────────────────────────────────────────────

export function getOccupationById(db: Database, id: string): OccupationDetail | null {
  const occupation = db.prepare(`
    SELECT ${OCC_STATS_SELECT} FROM occupations o
    WHERE o.id = ? AND o.deleted_at IS NULL
  `).get(id) as OccupationWithStats | undefined

  if (!occupation) return null

  const skills = db.prepare(`
    SELECT
      os.id, os.occupation_id, os.skill_id, os.importance, os.is_acquired,
      os.order_index, os.notes, os.created_at, os.updated_at,
      s.name  AS skill_name,
      sc.name AS skill_category_name,
      sc.color_hex AS skill_category_color,
      s.proficiency_level AS skill_proficiency_level,
      s.status AS skill_status
    FROM occupation_skills os
    JOIN skills s  ON s.id  = os.skill_id
    JOIN skill_categories sc ON sc.id = s.category_id
    WHERE os.occupation_id = ?
    ORDER BY os.order_index, os.importance
  `).all(id) as OccupationSkillWithSkill[]

  const tags = db.prepare(`
    SELECT t.id, t.name, t.slug, t.color_hex, t.created_at, t.updated_at
    FROM tags t
    JOIN entity_tags et ON et.tag_id = t.id
    WHERE et.entity_type = 'occupation' AND et.entity_id = ?
    ORDER BY t.name
  `).all(id) as TagRefRow[]

  return { ...occupation, skills, tags }
}

// ─── Mutation: create ─────────────────────────────────────────────────────────

export function createOccupation(db: Database, params: CreateOccupationParams): OccupationRow {
  const id = nanoid()
  const now = nowIso()

  const insert = db.transaction(() => {
    db.prepare(`
      INSERT INTO occupations (
        id, title, description, industry, seniority_level,
        status, target_date, notes, created_at, updated_at
      ) VALUES (
        :id, :title, :description, :industry, :seniority_level,
        :status, :target_date, :notes, :now, :now
      )
    `).run({
      id,
      title: params.title,
      description: params.description ?? null,
      industry: params.industry ?? null,
      seniority_level: params.seniority_level ?? null,
      status: params.status ?? 'aspirational',
      target_date: params.target_date ?? null,
      notes: params.notes ?? null,
      now,
    })

    if (params.skill_entries?.length) {
      insertSkillEntries(db, id, params.skill_entries)
    }

    if (params.tag_ids?.length) {
      syncTags(db, id, params.tag_ids)
    }
  })

  insert()
  return db.prepare('SELECT * FROM occupations WHERE id = ?').get(id) as OccupationRow
}

// ─── Mutation: update ─────────────────────────────────────────────────────────

export function updateOccupation(
  db: Database,
  id: string,
  params: UpdateOccupationParams,
): OccupationRow | null {
  const existing = db.prepare(
    'SELECT * FROM occupations WHERE id = ? AND deleted_at IS NULL',
  ).get(id) as OccupationRow | undefined
  if (!existing) return null

  const doUpdate = db.transaction(() => {
    db.prepare(`
      UPDATE occupations SET
        title           = COALESCE(:title,           title),
        description     = COALESCE(:description,     description),
        industry        = COALESCE(:industry,        industry),
        seniority_level = COALESCE(:seniority_level, seniority_level),
        status          = COALESCE(:status,          status),
        target_date     = COALESCE(:target_date,     target_date),
        notes           = COALESCE(:notes,           notes),
        updated_at      = :now
      WHERE id = :id AND deleted_at IS NULL
    `).run({
      id,
      title:           params.title           ?? null,
      description:     params.description     ?? null,
      industry:        params.industry        ?? null,
      seniority_level: params.seniority_level ?? null,
      status:          params.status          ?? null,
      target_date:     params.target_date     ?? null,
      notes:           params.notes           ?? null,
      now: nowIso(),
    })

    if (params.skill_entries !== undefined) {
      db.prepare('DELETE FROM occupation_skills WHERE occupation_id = ?').run(id)
      if (params.skill_entries.length) {
        insertSkillEntries(db, id, params.skill_entries)
      }
    }

    if (params.tag_ids !== undefined) {
      syncTags(db, id, params.tag_ids)
    }
  })

  doUpdate()
  return db.prepare('SELECT * FROM occupations WHERE id = ?').get(id) as OccupationRow
}

// ─── Mutation: soft delete ───────────────────────────────────────────────────

export function softDeleteOccupation(db: Database, id: string): boolean {
  const result = db.prepare(
    'UPDATE occupations SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL',
  ).run(nowIso(), id)
  return result.changes > 0
}

// ─── Occupation skills ────────────────────────────────────────────────────────

export function getOccupationSkills(db: Database, occupationId: string): OccupationSkillWithSkill[] {
  return db.prepare(`
    SELECT
      os.id, os.occupation_id, os.skill_id, os.importance, os.is_acquired,
      os.order_index, os.notes, os.created_at, os.updated_at,
      s.name  AS skill_name,
      sc.name AS skill_category_name,
      sc.color_hex AS skill_category_color,
      s.proficiency_level AS skill_proficiency_level,
      s.status AS skill_status
    FROM occupation_skills os
    JOIN skills s  ON s.id  = os.skill_id
    JOIN skill_categories sc ON sc.id = s.category_id
    WHERE os.occupation_id = ?
    ORDER BY os.order_index, os.importance
  `).all(occupationId) as OccupationSkillWithSkill[]
}

export function setOccupationSkills(
  db: Database,
  occupationId: string,
  entries: SkillEntry[],
): void {
  const doSet = db.transaction(() => {
    db.prepare('DELETE FROM occupation_skills WHERE occupation_id = ?').run(occupationId)
    if (entries.length) {
      insertSkillEntries(db, occupationId, entries)
    }
    db.prepare(
      'UPDATE occupations SET updated_at = ? WHERE id = ?',
    ).run(nowIso(), occupationId)
  })
  doSet()
}

export function updateOccupationSkill(
  db: Database,
  id: string,
  params: Partial<{ importance: string; is_acquired: number; notes: string | null }>,
): OccupationSkillRow | null {
  const existing = db.prepare(
    'SELECT * FROM occupation_skills WHERE id = ?',
  ).get(id) as OccupationSkillRow | undefined
  if (!existing) return null

  db.prepare(`
    UPDATE occupation_skills SET
      importance  = COALESCE(:importance,  importance),
      is_acquired = COALESCE(:is_acquired, is_acquired),
      notes       = COALESCE(:notes,       notes),
      updated_at  = :now
    WHERE id = :id
  `).run({
    id,
    importance:  params.importance  ?? null,
    is_acquired: params.is_acquired ?? null,
    notes:       params.notes       ?? null,
    now: nowIso(),
  })

  db.prepare(
    'UPDATE occupations SET updated_at = ? WHERE id = ?',
  ).run(nowIso(), existing.occupation_id)

  return db.prepare('SELECT * FROM occupation_skills WHERE id = ?').get(id) as OccupationSkillRow
}

export function removeOccupationSkill(db: Database, id: string): boolean {
  const result = db.prepare('DELETE FROM occupation_skills WHERE id = ?').run(id)
  return result.changes > 0
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function insertSkillEntries(db: Database, occupationId: string, entries: SkillEntry[]): void {
  const now = nowIso()
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO occupation_skills
      (id, occupation_id, skill_id, importance, is_acquired, order_index, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?)
  `)
  entries.forEach((entry, idx) => {
    stmt.run(nanoid(), occupationId, entry.skill_id, entry.importance, idx, now, now)
  })
}

function syncTags(db: Database, entityId: string, tagIds: string[]): void {
  db.prepare(
    `DELETE FROM entity_tags WHERE entity_type = 'occupation' AND entity_id = ?`,
  ).run(entityId)
  const insert = db.prepare(
    `INSERT OR IGNORE INTO entity_tags (tag_id, entity_type, entity_id) VALUES (?, 'occupation', ?)`,
  )
  for (const tagId of tagIds) {
    insert.run(tagId, entityId)
  }
}
