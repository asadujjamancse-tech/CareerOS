import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export type AnnotationType = 'highlight' | 'note' | 'bookmark' | 'comment'

export interface AnnotationRow {
  id: string
  document_id: string
  type: AnnotationType
  color_hex: string
  color_meaning: string | null
  page_number: number | null
  position_json: string
  selected_text: string | null
  content: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface ReadingProgressRow {
  document_id: string
  current_page: number
  total_pages: number | null
  scroll_position: number
  reading_time_min: number
  completed: 0 | 1
  last_read_at: string
  first_opened_at: string
}

export interface CreateAnnotationParams {
  document_id: string
  type?: AnnotationType
  color_hex?: string
  color_meaning?: string | null
  page_number?: number | null
  position_json: Record<string, unknown>
  selected_text?: string | null
  content?: string | null
}

export interface UpdateAnnotationParams {
  color_hex?: string
  color_meaning?: string | null
  content?: string | null
}

function nowIso(): string { return new Date().toISOString() }

export function getAnnotationsByDocument(db: Database, documentId: string, type?: AnnotationType): AnnotationRow[] {
  if (type) {
    return db.prepare(`
      SELECT * FROM document_annotations
      WHERE document_id = ? AND type = ?
      ORDER BY COALESCE(page_number, 0) ASC, order_index ASC
    `).all(documentId, type) as AnnotationRow[]
  }
  return db.prepare(`
    SELECT * FROM document_annotations
    WHERE document_id = ?
    ORDER BY COALESCE(page_number, 0) ASC, order_index ASC
  `).all(documentId) as AnnotationRow[]
}

export function createAnnotation(db: Database, params: CreateAnnotationParams): AnnotationRow {
  const id = `ann_${nanoid(10)}`
  const now = nowIso()

  const maxOrder = (db.prepare(
    `SELECT MAX(order_index) AS m FROM document_annotations WHERE document_id = ?`
  ).get(params.document_id) as { m: number | null }).m ?? -1

  db.prepare(`
    INSERT INTO document_annotations
      (id, document_id, type, color_hex, color_meaning, page_number, position_json, selected_text, content, order_index, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.document_id,
    params.type ?? 'highlight',
    params.color_hex ?? '#EAB308',
    params.color_meaning ?? null,
    params.page_number ?? null,
    JSON.stringify(params.position_json),
    params.selected_text ?? null,
    params.content ?? null,
    maxOrder + 1,
    now,
    now
  )

  return db.prepare(`SELECT * FROM document_annotations WHERE id = ?`).get(id) as AnnotationRow
}

export function updateAnnotation(db: Database, id: string, params: UpdateAnnotationParams): AnnotationRow {
  const sets: string[] = ['updated_at = ?']
  const vals: (string | null)[] = [nowIso()]

  if (params.color_hex !== undefined) { sets.push('color_hex = ?'); vals.push(params.color_hex) }
  if (params.color_meaning !== undefined) { sets.push('color_meaning = ?'); vals.push(params.color_meaning) }
  if (params.content !== undefined) { sets.push('content = ?'); vals.push(params.content) }

  vals.push(id)
  db.prepare(`UPDATE document_annotations SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return db.prepare(`SELECT * FROM document_annotations WHERE id = ?`).get(id) as AnnotationRow
}

export function deleteAnnotation(db: Database, id: string): void {
  db.prepare(`DELETE FROM document_annotations WHERE id = ?`).run(id)
}

export function deleteAnnotationsByDocument(db: Database, documentId: string): void {
  db.prepare(`DELETE FROM document_annotations WHERE document_id = ?`).run(documentId)
}

export function getReadingProgress(db: Database, documentId: string): ReadingProgressRow | null {
  return db.prepare(`SELECT * FROM document_reading_progress WHERE document_id = ?`).get(documentId) as ReadingProgressRow | null
}

export function upsertReadingProgress(
  db: Database,
  documentId: string,
  currentPage: number,
  totalPages?: number | null,
  scrollPosition?: number,
  additionalMinutes?: number,
  completed?: boolean
): ReadingProgressRow {
  const existing = getReadingProgress(db, documentId)
  const now = nowIso()

  if (!existing) {
    db.prepare(`
      INSERT INTO document_reading_progress
        (document_id, current_page, total_pages, scroll_position, reading_time_min, completed, last_read_at, first_opened_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      documentId, currentPage, totalPages ?? null, scrollPosition ?? 0,
      additionalMinutes ?? 0, completed ? 1 : 0, now, now
    )
  } else {
    db.prepare(`
      UPDATE document_reading_progress SET
        current_page = ?, total_pages = COALESCE(?, total_pages),
        scroll_position = ?, reading_time_min = reading_time_min + ?,
        completed = ?, last_read_at = ?
      WHERE document_id = ?
    `).run(
      currentPage, totalPages ?? null, scrollPosition ?? existing.scroll_position,
      additionalMinutes ?? 0, completed ? 1 : (existing.completed),
      now, documentId
    )
  }

  return getReadingProgress(db, documentId)!
}

export function getDocumentReadingStats(db: Database): {
  total_read: number
  total_completed: number
  total_reading_time_min: number
  avg_reading_time: number
} {
  const row = db.prepare(`
    SELECT
      COUNT(*) AS total_read,
      SUM(completed) AS total_completed,
      SUM(reading_time_min) AS total_reading_time_min,
      AVG(reading_time_min) AS avg_reading_time
    FROM document_reading_progress
  `).get() as {
    total_read: number
    total_completed: number
    total_reading_time_min: number
    avg_reading_time: number
  }
  return {
    total_read: row.total_read ?? 0,
    total_completed: row.total_completed ?? 0,
    total_reading_time_min: row.total_reading_time_min ?? 0,
    avg_reading_time: row.avg_reading_time ?? 0,
  }
}
