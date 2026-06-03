import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export interface DocumentRow {
  id: string; title: string; description: string | null; file_path: string
  original_filename: string; mime_type: string | null; file_size_bytes: number | null
  type: string; version: string; notes: string | null
  created_at: string; updated_at: string; deleted_at: string | null
}

export interface DocumentWithTags extends DocumentRow {
  tag_count: number
}

export interface TagRow { id: string; name: string; slug: string; color_hex: string; created_at: string; updated_at: string }
export interface DocumentDetail extends DocumentWithTags { tags: TagRow[] }

export interface PaginatedDocuments {
  items: DocumentWithTags[]; total: number; page: number; pageSize: number; totalPages: number
}

export interface GetAllDocsParams {
  search?: string | undefined; type?: string | undefined; page?: number | undefined; pageSize?: number | undefined
}

export interface CreateDocumentParams {
  title: string; description?: string | null; file_path: string; original_filename: string
  mime_type?: string | null; file_size_bytes?: number | null; type?: string; version?: string
  notes?: string | null; tag_ids?: string[]
}

export type UpdateDocumentParams = Partial<Omit<CreateDocumentParams, 'file_path' | 'original_filename'>> & {
  title?: string; version?: string
}

function buildFtsQuery(s: string): string {
  return s.trim().split(/\s+/).filter(Boolean).map(w => `"${w.replace(/"/g, '')}"*`).join(' ')
}
function nowIso(): string { return new Date().toISOString() }

const DOC_SELECT = `
  d.id, d.title, d.description, d.file_path, d.original_filename, d.mime_type,
  d.file_size_bytes, d.type, d.version, d.notes, d.created_at, d.updated_at, d.deleted_at,
  (SELECT COUNT(*) FROM entity_tags WHERE entity_type = 'document' AND entity_id = d.id) AS tag_count
`

export function getAllDocuments(db: Database, params: GetAllDocsParams): PaginatedDocuments {
  const { search, type, page = 1, pageSize = 30 } = params
  const offset = (page - 1) * pageSize
  if (search?.trim()) return searchDocsFts(db, { search, type, page, pageSize })
  const bind: Record<string, string | number | null> = { type: type ?? null, limit: pageSize, offset }
  const WHERE = `WHERE d.deleted_at IS NULL AND (d.type = :type OR :type IS NULL)`
  const total = (db.prepare(`SELECT COUNT(*) AS total FROM documents d ${WHERE}`).get(bind) as { total: number }).total
  const items = db.prepare(`SELECT ${DOC_SELECT} FROM documents d ${WHERE} ORDER BY d.updated_at DESC LIMIT :limit OFFSET :offset`).all(bind) as DocumentWithTags[]
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

function searchDocsFts(db: Database, params: GetAllDocsParams & { search: string; page: number; pageSize: number }): PaginatedDocuments {
  const { search, type, page, pageSize } = params
  const ftsQuery = buildFtsQuery(search); const offset = (page - 1) * pageSize
  const cond: string[] = ['d.deleted_at IS NULL']; const extra: Record<string, string | null> = {}
  if (type) { cond.push('d.type = :type'); extra['type'] = type }
  const extraWhere = cond.length ? 'AND ' + cond.join(' AND ') : ''
  const bind = { fts: ftsQuery, ...extra, limit: pageSize, offset }
  const total = (db.prepare(`SELECT COUNT(*) AS total FROM documents_fts JOIN documents d ON d.rowid = documents_fts.rowid WHERE documents_fts MATCH :fts ${extraWhere}`).get(bind) as { total: number }).total
  const items = db.prepare(`SELECT ${DOC_SELECT} FROM documents_fts JOIN documents d ON d.rowid = documents_fts.rowid WHERE documents_fts MATCH :fts ${extraWhere} ORDER BY rank LIMIT :limit OFFSET :offset`).all(bind) as DocumentWithTags[]
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export function getDocumentById(db: Database, id: string): DocumentDetail | null {
  const doc = db.prepare(`SELECT ${DOC_SELECT} FROM documents d WHERE d.id = ? AND d.deleted_at IS NULL`).get(id) as DocumentWithTags | undefined
  if (!doc) return null
  const tags = db.prepare(`SELECT t.* FROM tags t JOIN entity_tags et ON et.tag_id = t.id WHERE et.entity_type = 'document' AND et.entity_id = ? ORDER BY t.name`).all(id) as TagRow[]
  return { ...doc, tags }
}

export function createDocument(db: Database, params: CreateDocumentParams): DocumentRow {
  const id = nanoid(); const now = nowIso()
  db.transaction(() => {
    db.prepare(`INSERT INTO documents (id, title, description, file_path, original_filename, mime_type, file_size_bytes, type, version, notes, created_at, updated_at) VALUES (:id,:title,:description,:file_path,:original_filename,:mime_type,:file_size_bytes,:type,:version,:notes,:now,:now)`)
      .run({ id, title: params.title, description: params.description ?? null, file_path: params.file_path, original_filename: params.original_filename, mime_type: params.mime_type ?? null, file_size_bytes: params.file_size_bytes ?? null, type: params.type ?? 'other', version: params.version ?? '1.0', notes: params.notes ?? null, now })
    if (params.tag_ids?.length) syncTags(db, id, params.tag_ids)
  })()
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocumentRow
}

export function updateDocument(db: Database, id: string, params: UpdateDocumentParams): DocumentRow | null {
  const existing = db.prepare('SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL').get(id) as DocumentRow | undefined
  if (!existing) return null
  db.transaction(() => {
    db.prepare(`UPDATE documents SET title=COALESCE(:title,title), description=COALESCE(:description,description), type=COALESCE(:type,type), version=COALESCE(:version,version), notes=COALESCE(:notes,notes), updated_at=:now WHERE id=:id AND deleted_at IS NULL`)
      .run({ id, title: params.title ?? null, description: params.description ?? null, type: params.type ?? null, version: params.version ?? null, notes: params.notes ?? null, now: nowIso() })
    if (params.tag_ids !== undefined) syncTags(db, id, params.tag_ids)
  })()
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocumentRow
}

export function softDeleteDocument(db: Database, id: string): boolean {
  return (db.prepare('UPDATE documents SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL').run(nowIso(), id)).changes > 0
}

function syncTags(db: Database, entityId: string, tagIds: string[]): void {
  db.prepare(`DELETE FROM entity_tags WHERE entity_type = 'document' AND entity_id = ?`).run(entityId)
  const ins = db.prepare(`INSERT OR IGNORE INTO entity_tags (tag_id, entity_type, entity_id) VALUES (?, 'document', ?)`)
  for (const t of tagIds) ins.run(t, entityId)
}
