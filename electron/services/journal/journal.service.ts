import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export interface JournalRow {
  id: string
  title: string
  content: string
  entry_date: string
  mood: string | null
  energy_level: number | null
  category: string
  is_private: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface JournalWithTags extends JournalRow {
  tag_count: number
}

export interface TagRow { id: string; name: string; slug: string; color_hex: string; created_at: string; updated_at: string }

export interface JournalDetail extends JournalWithTags { tags: TagRow[] }

export interface PaginatedJournal {
  items: JournalWithTags[]
  total: number; page: number; pageSize: number; totalPages: number
}

export interface GetAllJournalParams {
  search?: string | undefined
  category?: string | undefined
  mood?: string | undefined
  from_date?: string | undefined
  to_date?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

export interface CreateJournalParams {
  title: string
  content?: string
  entry_date: string
  mood?: string | null
  energy_level?: number | null
  category?: string
  is_private?: boolean
  tag_ids?: string[]
}

export type UpdateJournalParams = Partial<CreateJournalParams>

function buildFtsQuery(s: string): string {
  return s.trim().split(/\s+/).filter(Boolean).map(w => `"${w.replace(/"/g, '')}"*`).join(' ')
}
function nowIso(): string { return new Date().toISOString() }

const JE_SELECT = `
  j.id, j.title, j.content, j.entry_date, j.mood, j.energy_level,
  j.category, j.is_private, j.created_at, j.updated_at, j.deleted_at,
  (SELECT COUNT(*) FROM entity_tags WHERE entity_type = 'journal_entry' AND entity_id = j.id) AS tag_count
`

export function getAllJournalEntries(db: Database, params: GetAllJournalParams): PaginatedJournal {
  const { search, category, mood, from_date, to_date, page = 1, pageSize = 30 } = params
  const offset = (page - 1) * pageSize

  if (search?.trim()) return searchJournalFts(db, { search, category, mood, from_date, to_date, page, pageSize })

  const bind: Record<string, string | number | null> = {
    category: category ?? null, mood: mood ?? null,
    from_date: from_date ?? null, to_date: to_date ?? null,
    limit: pageSize, offset,
  }
  const WHERE = `
    WHERE j.deleted_at IS NULL
      AND (j.category = :category OR :category IS NULL)
      AND (j.mood = :mood OR :mood IS NULL)
      AND (j.entry_date >= :from_date OR :from_date IS NULL)
      AND (j.entry_date <= :to_date OR :to_date IS NULL)
  `
  const total = (db.prepare(`SELECT COUNT(*) AS total FROM journal_entries j ${WHERE}`).get(bind) as { total: number }).total
  const items = db.prepare(`SELECT ${JE_SELECT} FROM journal_entries j ${WHERE} ORDER BY j.entry_date DESC, j.created_at DESC LIMIT :limit OFFSET :offset`).all(bind) as JournalWithTags[]
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

function searchJournalFts(db: Database, params: GetAllJournalParams & { search: string; page: number; pageSize: number }): PaginatedJournal {
  const { search, category, mood, from_date, to_date, page, pageSize } = params
  const ftsQuery = buildFtsQuery(search)
  const offset = (page - 1) * pageSize
  const cond: string[] = ['j.deleted_at IS NULL']
  const extra: Record<string, string | null> = {}
  if (category) { cond.push('j.category = :category'); extra['category'] = category }
  if (mood) { cond.push('j.mood = :mood'); extra['mood'] = mood }
  if (from_date) { cond.push('j.entry_date >= :from_date'); extra['from_date'] = from_date }
  if (to_date) { cond.push('j.entry_date <= :to_date'); extra['to_date'] = to_date }
  const extraWhere = cond.length ? 'AND ' + cond.join(' AND ') : ''
  const bind = { fts: ftsQuery, ...extra, limit: pageSize, offset }
  const total = (db.prepare(`SELECT COUNT(*) AS total FROM journal_entries_fts JOIN journal_entries j ON j.rowid = journal_entries_fts.rowid WHERE journal_entries_fts MATCH :fts ${extraWhere}`).get(bind) as { total: number }).total
  const items = db.prepare(`SELECT ${JE_SELECT} FROM journal_entries_fts JOIN journal_entries j ON j.rowid = journal_entries_fts.rowid WHERE journal_entries_fts MATCH :fts ${extraWhere} ORDER BY rank LIMIT :limit OFFSET :offset`).all(bind) as JournalWithTags[]
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export function getJournalEntryById(db: Database, id: string): JournalDetail | null {
  const entry = db.prepare(`SELECT ${JE_SELECT} FROM journal_entries j WHERE j.id = ? AND j.deleted_at IS NULL`).get(id) as JournalWithTags | undefined
  if (!entry) return null
  const tags = db.prepare(`SELECT t.* FROM tags t JOIN entity_tags et ON et.tag_id = t.id WHERE et.entity_type = 'journal_entry' AND et.entity_id = ? ORDER BY t.name`).all(id) as TagRow[]
  return { ...entry, tags }
}

export function createJournalEntry(db: Database, params: CreateJournalParams): JournalRow {
  const id = nanoid(); const now = nowIso()
  db.transaction(() => {
    db.prepare(`INSERT INTO journal_entries (id, title, content, entry_date, mood, energy_level, category, is_private, created_at, updated_at) VALUES (:id, :title, :content, :entry_date, :mood, :energy_level, :category, :is_private, :now, :now)`)
      .run({ id, title: params.title, content: params.content ?? '', entry_date: params.entry_date, mood: params.mood ?? null, energy_level: params.energy_level ?? null, category: params.category ?? 'general', is_private: params.is_private ? 1 : 0, now })
    if (params.tag_ids?.length) syncTags(db, id, params.tag_ids)
  })()
  return db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id) as JournalRow
}

export function updateJournalEntry(db: Database, id: string, params: UpdateJournalParams): JournalRow | null {
  const existing = db.prepare('SELECT * FROM journal_entries WHERE id = ? AND deleted_at IS NULL').get(id) as JournalRow | undefined
  if (!existing) return null
  db.transaction(() => {
    db.prepare(`UPDATE journal_entries SET title = COALESCE(:title, title), content = COALESCE(:content, content), entry_date = COALESCE(:entry_date, entry_date), mood = COALESCE(:mood, mood), energy_level = COALESCE(:energy_level, energy_level), category = COALESCE(:category, category), is_private = COALESCE(:is_private, is_private), updated_at = :now WHERE id = :id AND deleted_at IS NULL`)
      .run({ id, title: params.title ?? null, content: params.content ?? null, entry_date: params.entry_date ?? null, mood: params.mood ?? null, energy_level: params.energy_level ?? null, category: params.category ?? null, is_private: params.is_private !== undefined ? (params.is_private ? 1 : 0) : null, now: nowIso() })
    if (params.tag_ids !== undefined) syncTags(db, id, params.tag_ids)
  })()
  return db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id) as JournalRow
}

export function softDeleteJournalEntry(db: Database, id: string): boolean {
  return (db.prepare('UPDATE journal_entries SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL').run(nowIso(), id)).changes > 0
}

function syncTags(db: Database, entityId: string, tagIds: string[]): void {
  db.prepare(`DELETE FROM entity_tags WHERE entity_type = 'journal_entry' AND entity_id = ?`).run(entityId)
  const ins = db.prepare(`INSERT OR IGNORE INTO entity_tags (tag_id, entity_type, entity_id) VALUES (?, 'journal_entry', ?)`)
  for (const t of tagIds) ins.run(t, entityId)
}
