export const version = '014_document_comments'
export const name = '014_document_comments.sql'

export const sql = `
-- Dedicated comments table for the DOCX Viewer.
-- Anchors each comment to a paragraph (by index in the converted HTML)
-- and an optional character-range within that paragraph.

CREATE TABLE IF NOT EXISTS document_comments (
  id                 TEXT    NOT NULL PRIMARY KEY,
  document_id        TEXT    NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  paragraph_index    INTEGER NOT NULL DEFAULT 0,
  char_offset_start  INTEGER NOT NULL DEFAULT 0,
  char_offset_end    INTEGER NOT NULL DEFAULT 0,
  selected_text      TEXT,
  content            TEXT    NOT NULL DEFAULT '',
  color_hex          TEXT    NOT NULL DEFAULT '#FBBF24',
  resolved           INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0, 1)),
  created_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_doc_comments_document
  ON document_comments(document_id, paragraph_index);
`
