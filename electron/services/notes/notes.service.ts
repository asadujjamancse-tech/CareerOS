import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export interface NoteRow {
  id: string
  title: string
  content: string
  type: string
  is_pinned: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface NoteWithTags extends NoteRow {
  tag_count: number
}

export interface TagRow {
  id: string; name: string; slug: string; color_hex: string; created_at: string; updated_at: string
}

export interface NoteDetail extends NoteWithTags {
  tags: TagRow[]
}

export interface PaginatedNotes {
  items: NoteWithTags[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GetAllNotesParams {
  search?: string | undefined
  type?: string | undefined
  is_pinned?: boolean | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

export interface CreateNoteParams {
  title: string
  content?: string
  type?: string
  is_pinned?: boolean
  tag_ids?: string[]
}

export type UpdateNoteParams = Partial<CreateNoteParams>

function buildFtsQuery(s: string): string {
  return s.trim().split(/\s+/).filter(Boolean).map(w => `"${w.replace(/"/g, '')}"*`).join(' ')
}
function nowIso(): string { return new Date().toISOString() }

const NOTE_SELECT = `
  n.id, n.title, n.content, n.type, n.is_pinned, n.created_at, n.updated_at, n.deleted_at,
  (SELECT COUNT(*) FROM entity_tags WHERE entity_type = 'note' AND entity_id = n.id) AS tag_count
`

export function getAllNotes(db: Database, params: GetAllNotesParams): PaginatedNotes {
  const { search, type, is_pinned, page = 1, pageSize = 30 } = params
  const offset = (page - 1) * pageSize

  if (search?.trim()) return searchNotesFts(db, { search, type, is_pinned, page, pageSize })

  const bind: Record<string, string | number | null> = {
    type: type ?? null,
    is_pinned: is_pinned !== undefined ? (is_pinned ? 1 : 0) : null,
    limit: pageSize, offset,
  }
  const WHERE = `
    WHERE n.deleted_at IS NULL
      AND (n.type = :type OR :type IS NULL)
      AND (n.is_pinned = :is_pinned OR :is_pinned IS NULL)
  `
  const total = (db.prepare(`SELECT COUNT(*) AS total FROM notes n ${WHERE}`).get(bind) as { total: number }).total
  const items = db.prepare(`
    SELECT ${NOTE_SELECT} FROM notes n ${WHERE}
    ORDER BY n.is_pinned DESC, n.updated_at DESC
    LIMIT :limit OFFSET :offset
  `).all(bind) as NoteWithTags[]

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

function searchNotesFts(db: Database, params: GetAllNotesParams & { search: string; page: number; pageSize: number }): PaginatedNotes {
  const { search, type, is_pinned, page, pageSize } = params
  const ftsQuery = buildFtsQuery(search)
  const offset = (page - 1) * pageSize
  const conditions: string[] = ['n.deleted_at IS NULL']
  const extra: Record<string, string | number | null> = {}
  if (type) { conditions.push('n.type = :type'); extra['type'] = type }
  if (is_pinned !== undefined) { conditions.push('n.is_pinned = :is_pinned'); extra['is_pinned'] = is_pinned ? 1 : 0 }
  const extraWhere = conditions.length ? 'AND ' + conditions.join(' AND ') : ''
  const bind = { fts: ftsQuery, ...extra, limit: pageSize, offset }
  const total = (db.prepare(`SELECT COUNT(*) AS total FROM notes_fts JOIN notes n ON n.rowid = notes_fts.rowid WHERE notes_fts MATCH :fts ${extraWhere}`).get(bind) as { total: number }).total
  const items = db.prepare(`
    SELECT ${NOTE_SELECT} FROM notes_fts
    JOIN notes n ON n.rowid = notes_fts.rowid
    WHERE notes_fts MATCH :fts ${extraWhere}
    ORDER BY n.is_pinned DESC, rank LIMIT :limit OFFSET :offset
  `).all(bind) as NoteWithTags[]
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export function getNoteById(db: Database, id: string): NoteDetail | null {
  const note = db.prepare(`SELECT ${NOTE_SELECT} FROM notes n WHERE n.id = ? AND n.deleted_at IS NULL`).get(id) as NoteWithTags | undefined
  if (!note) return null
  const tags = db.prepare(`SELECT t.* FROM tags t JOIN entity_tags et ON et.tag_id = t.id WHERE et.entity_type = 'note' AND et.entity_id = ? ORDER BY t.name`).all(id) as TagRow[]
  return { ...note, tags }
}

export function createNote(db: Database, params: CreateNoteParams): NoteRow {
  const id = nanoid(); const now = nowIso()
  db.transaction(() => {
    db.prepare(`INSERT INTO notes (id, title, content, type, is_pinned, created_at, updated_at) VALUES (:id, :title, :content, :type, :is_pinned, :now, :now)`)
      .run({ id, title: params.title, content: params.content ?? '', type: params.type ?? 'general', is_pinned: params.is_pinned ? 1 : 0, now })
    if (params.tag_ids?.length) syncTags(db, id, params.tag_ids)
  })()
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow
}

export function updateNote(db: Database, id: string, params: UpdateNoteParams): NoteRow | null {
  const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL').get(id) as NoteRow | undefined
  if (!existing) return null
  db.transaction(() => {
    db.prepare(`UPDATE notes SET title = COALESCE(:title, title), content = COALESCE(:content, content), type = COALESCE(:type, type), is_pinned = COALESCE(:is_pinned, is_pinned), updated_at = :now WHERE id = :id AND deleted_at IS NULL`)
      .run({ id, title: params.title ?? null, content: params.content ?? null, type: params.type ?? null, is_pinned: params.is_pinned !== undefined ? (params.is_pinned ? 1 : 0) : null, now: nowIso() })
    if (params.tag_ids !== undefined) syncTags(db, id, params.tag_ids)
  })()
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow
}

export function softDeleteNote(db: Database, id: string): boolean {
  return (db.prepare('UPDATE notes SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL').run(nowIso(), id)).changes > 0
}

function syncTags(db: Database, entityId: string, tagIds: string[]): void {
  db.prepare(`DELETE FROM entity_tags WHERE entity_type = 'note' AND entity_id = ?`).run(entityId)
  const ins = db.prepare(`INSERT OR IGNORE INTO entity_tags (tag_id, entity_type, entity_id) VALUES (?, 'note', ?)`)
  for (const t of tagIds) ins.run(t, entityId)
}
