export const version = '012_pdf_reading_progress'
export const name = '012_pdf_reading_progress.sql'

export const sql = `
-- Dedicated PDF reading progress table — persists per-document reader state.
-- Separate from document_reading_progress (generic) and annotation tables.

CREATE TABLE IF NOT EXISTS pdf_reading_progress (
  document_id       TEXT    NOT NULL PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  current_page      INTEGER NOT NULL DEFAULT 1,
  total_pages       INTEGER,
  zoom_level        REAL    NOT NULL DEFAULT 1.25,
  is_dark_mode      INTEGER NOT NULL DEFAULT 0 CHECK (is_dark_mode IN (0, 1)),
  scroll_percent    REAL    NOT NULL DEFAULT 0,
  reading_time_sec  INTEGER NOT NULL DEFAULT 0,
  completed         INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  last_read_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_pdf_progress_last_read ON pdf_reading_progress (last_read_at DESC);
`
