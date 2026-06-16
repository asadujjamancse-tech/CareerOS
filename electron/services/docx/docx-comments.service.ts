import type { Database } from 'better-sqlite3'
import { randomUUID } from 'crypto'

export interface DocumentComment {
  id: string
  document_id: string
  paragraph_index: number
  char_offset_start: number
  char_offset_end: number
  selected_text: string | null
  content: string
  color_hex: string
  resolved: 0 | 1
  created_at: string
  updated_at: string
}

export interface CreateCommentParams {
  document_id: string
  paragraph_index: number
  char_offset_start?: number
  char_offset_end?: number
  selected_text?: string | null
  content: string
  color_hex?: string
}

export interface UpdateCommentParams {
  content?: string
  color_hex?: string
  resolved?: 0 | 1
}

function now(): string {
  return new Date().toISOString()
}

export function getComments(db: Database, documentId: string): DocumentComment[] {
  return db
    .prepare(`
      SELECT * FROM document_comments
      WHERE document_id = ?
      ORDER BY paragraph_index ASC, char_offset_start ASC, created_at ASC
    `)
    .all(documentId) as DocumentComment[]
}

export function createComment(db: Database, params: CreateCommentParams): DocumentComment {
  const id = randomUUID()
  const ts = now()
  db.prepare(`
    INSERT INTO document_comments
      (id, document_id, paragraph_index, char_offset_start, char_offset_end,
       selected_text, content, color_hex, resolved, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    id,
    params.document_id,
    params.paragraph_index,
    params.char_offset_start ?? 0,
    params.char_offset_end ?? 0,
    params.selected_text ?? null,
    params.content,
    params.color_hex ?? '#FBBF24',
    ts,
    ts,
  )
  return db.prepare('SELECT * FROM document_comments WHERE id = ?').get(id) as DocumentComment
}

export function updateComment(db: Database, id: string, params: UpdateCommentParams): DocumentComment {
  const ts = now()
  if (params.content !== undefined) {
    db.prepare('UPDATE document_comments SET content = ?, updated_at = ? WHERE id = ?')
      .run(params.content, ts, id)
  }
  if (params.color_hex !== undefined) {
    db.prepare('UPDATE document_comments SET color_hex = ?, updated_at = ? WHERE id = ?')
      .run(params.color_hex, ts, id)
  }
  if (params.resolved !== undefined) {
    db.prepare('UPDATE document_comments SET resolved = ?, updated_at = ? WHERE id = ?')
      .run(params.resolved, ts, id)
  }
  return db.prepare('SELECT * FROM document_comments WHERE id = ?').get(id) as DocumentComment
}

export function deleteComment(db: Database, id: string): boolean {
  return db.prepare('DELETE FROM document_comments WHERE id = ?').run(id).changes > 0
}

export function resolveComment(db: Database, id: string): DocumentComment {
  return updateComment(db, id, { resolved: 1 })
}
