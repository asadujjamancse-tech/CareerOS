export const version = '011_knowledge_vault'
export const name = '011_knowledge_vault.sql'

export const sql = `
-- ── Vault Collections ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vault_collections (
  id          TEXT    NOT NULL PRIMARY KEY,
  name        TEXT    NOT NULL,
  description TEXT,
  color_hex   TEXT    NOT NULL DEFAULT '#6B7280',
  icon        TEXT    NOT NULL DEFAULT 'folder',
  parent_id   TEXT    REFERENCES vault_collections(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_vault_collections_parent ON vault_collections (parent_id);
CREATE INDEX IF NOT EXISTS idx_vault_collections_order  ON vault_collections (order_index);

-- Many-to-many: documents can belong to multiple collections
CREATE TABLE IF NOT EXISTS vault_collection_documents (
  collection_id TEXT NOT NULL REFERENCES vault_collections(id) ON DELETE CASCADE,
  document_id   TEXT NOT NULL REFERENCES documents(id)         ON DELETE CASCADE,
  added_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (collection_id, document_id)
);
CREATE INDEX IF NOT EXISTS idx_vcd_collection ON vault_collection_documents (collection_id);
CREATE INDEX IF NOT EXISTS idx_vcd_document   ON vault_collection_documents (document_id);

-- ── Vault Favorites ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vault_favorites (
  document_id TEXT NOT NULL PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ── Vault Recent Files ────────────────────────────────────────────────────────
-- One row per document; opened_at is updated (upserted) on every open.
-- Query ORDER BY opened_at DESC LIMIT N for recent list.

CREATE TABLE IF NOT EXISTS vault_recent_files (
  document_id TEXT NOT NULL PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  opened_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_vault_recent_opened ON vault_recent_files (opened_at DESC);

-- ── Seed default collections ─────────────────────────────────────────────────

INSERT OR IGNORE INTO vault_collections (id, name, description, color_hex, icon, order_index) VALUES
  ('vc_study',    'Study Materials',   'Textbooks, guides, and course content',         '#3B82F6', 'book-open',    1),
  ('vc_certs',    'Certifications',    'Exam guides, practice tests, and study notes',  '#F59E0B', 'award',        2),
  ('vc_projects', 'Project Docs',      'Documentation for home lab and projects',        '#10B981', 'folder-open',  3),
  ('vc_work',     'Work & Career',     'Resumes, cover letters, and work samples',       '#8B5CF6', 'briefcase',    4),
  ('vc_ref',      'Reference',         'Quick reference sheets and cheat sheets',        '#EC4899', 'file-text',    5);
`
