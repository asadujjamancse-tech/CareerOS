export const version = '013_markdown_workspace'
export const name = '013_markdown_workspace.sql'

export const sql = `
-- Markdown Workspace: documents and version history.

CREATE TABLE IF NOT EXISTS markdown_documents (
  id              TEXT    NOT NULL PRIMARY KEY,
  title           TEXT    NOT NULL DEFAULT 'Untitled',
  content         TEXT    NOT NULL DEFAULT '',
  frontmatter     TEXT    NOT NULL DEFAULT '{}',
  word_count      INTEGER NOT NULL DEFAULT 0,
  tags            TEXT    NOT NULL DEFAULT '[]',
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS markdown_versions (
  id              TEXT    NOT NULL PRIMARY KEY,
  document_id     TEXT    NOT NULL REFERENCES markdown_documents(id) ON DELETE CASCADE,
  content         TEXT    NOT NULL,
  title           TEXT    NOT NULL,
  version_number  INTEGER NOT NULL,
  label           TEXT,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_markdown_versions_document
  ON markdown_versions(document_id, version_number DESC);
`
