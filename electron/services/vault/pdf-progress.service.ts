import type { Database } from 'better-sqlite3'

export interface PDFProgressRow {
  document_id: string
  current_page: number
  total_pages: number | null
  zoom_level: number
  is_dark_mode: 0 | 1
  scroll_percent: number
  reading_time_sec: number
  completed: 0 | 1
  last_read_at: string
  created_at: string
  updated_at: string
}

export interface UpsertPDFProgressParams {
  current_page?: number | undefined
  total_pages?: number | undefined
  zoom_level?: number | undefined
  is_dark_mode?: 0 | 1 | undefined
  scroll_percent?: number | undefined
  reading_time_sec_delta?: number | undefined
  completed?: 0 | 1 | undefined
}

function nowIso(): string {
  return new Date().toISOString()
}

// ── Pure business-logic helpers (testable without a database) ────────────────

export function computeCompletedFlag(
  currentPage: number,
  totalPages: number | null | undefined,
  existingCompleted: 0 | 1,
  overrideCompleted?: 0 | 1,
): 0 | 1 {
  if (overrideCompleted !== undefined) return overrideCompleted
  if (totalPages && currentPage >= totalPages) return 1
  return existingCompleted
}

export function computeNewReadingTime(existing: number, delta: number | undefined): number {
  return existing + (delta ?? 0)
}

export function computeScrollPercent(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
): number {
  const denominator = scrollHeight - clientHeight
  if (denominator <= 0) return 0
  return Math.min(1, Math.max(0, scrollTop / denominator))
}

export function getPDFProgress(db: Database, documentId: string): PDFProgressRow | null {
  return (
    db
      .prepare('SELECT * FROM pdf_reading_progress WHERE document_id = ?')
      .get(documentId) as PDFProgressRow | undefined
  ) ?? null
}

export function upsertPDFProgress(
  db: Database,
  documentId: string,
  params: UpsertPDFProgressParams,
): PDFProgressRow {
  const now = nowIso()
  const existing = getPDFProgress(db, documentId)

  if (existing) {
    const newReadingTime = existing.reading_time_sec + (params.reading_time_sec_delta ?? 0)
    const newPage = params.current_page ?? existing.current_page
    const newTotalPages = params.total_pages ?? existing.total_pages
    const completed: 0 | 1 =
      params.completed !== undefined
        ? params.completed
        : newTotalPages && newPage >= newTotalPages
        ? 1
        : existing.completed

    db.prepare(`
      UPDATE pdf_reading_progress SET
        current_page      = :current_page,
        total_pages       = COALESCE(:total_pages, total_pages),
        zoom_level        = COALESCE(:zoom_level, zoom_level),
        is_dark_mode      = COALESCE(:is_dark_mode, is_dark_mode),
        scroll_percent    = COALESCE(:scroll_percent, scroll_percent),
        reading_time_sec  = :reading_time_sec,
        completed         = :completed,
        last_read_at      = :now,
        updated_at        = :now
      WHERE document_id = :document_id
    `).run({
      document_id: documentId,
      current_page: newPage,
      total_pages: params.total_pages ?? null,
      zoom_level: params.zoom_level ?? null,
      is_dark_mode: params.is_dark_mode ?? null,
      scroll_percent: params.scroll_percent ?? null,
      reading_time_sec: newReadingTime,
      completed,
      now,
    })
  } else {
    db.prepare(`
      INSERT INTO pdf_reading_progress
        (document_id, current_page, total_pages, zoom_level, is_dark_mode,
         scroll_percent, reading_time_sec, completed, last_read_at, created_at, updated_at)
      VALUES
        (:document_id, :current_page, :total_pages, :zoom_level, :is_dark_mode,
         :scroll_percent, :reading_time_sec, :completed, :now, :now, :now)
    `).run({
      document_id: documentId,
      current_page: params.current_page ?? 1,
      total_pages: params.total_pages ?? null,
      zoom_level: params.zoom_level ?? 1.25,
      is_dark_mode: params.is_dark_mode ?? 0,
      scroll_percent: params.scroll_percent ?? 0,
      reading_time_sec: params.reading_time_sec_delta ?? 0,
      completed: params.completed ?? 0,
      now,
    })
  }

  return getPDFProgress(db, documentId)!
}

export function deletePDFProgress(db: Database, documentId: string): boolean {
  return db.prepare('DELETE FROM pdf_reading_progress WHERE document_id = ?').run(documentId).changes > 0
}

export function getRecentlyReadPDFs(db: Database, limit = 10): PDFProgressRow[] {
  return db
    .prepare('SELECT * FROM pdf_reading_progress ORDER BY last_read_at DESC LIMIT ?')
    .all(limit) as PDFProgressRow[]
}

export function getReadingStats(db: Database): {
  total_pdfs: number
  completed_pdfs: number
  total_reading_time_sec: number
  avg_completion_percent: number
} {
  const row = db.prepare(`
    SELECT
      COUNT(*)                                      AS total_pdfs,
      SUM(completed)                                AS completed_pdfs,
      COALESCE(SUM(reading_time_sec), 0)            AS total_reading_time_sec,
      COALESCE(AVG(
        CASE WHEN total_pages > 0
          THEN CAST(current_page AS REAL) / total_pages * 100
          ELSE 0
        END
      ), 0)                                         AS avg_completion_percent
    FROM pdf_reading_progress
  `).get() as {
    total_pdfs: number
    completed_pdfs: number
    total_reading_time_sec: number
    avg_completion_percent: number
  }
  return row
}
