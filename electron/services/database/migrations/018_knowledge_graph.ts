export const version = '018_knowledge_graph'
export const name = '018_knowledge_graph.sql'

export const sql = `
-- ─── Knowledge Nodes ─────────────────────────────────────────────────────────
-- Explicit graph nodes. Each node either references an existing entity
-- (entity_type + entity_id set) or is a standalone concept node (entity_id NULL).
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id          TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK(entity_type IN (
                 'skill','project','lab','document','video',
                 'interview_question','certification','note','concept'
               )),
  entity_id   TEXT,
  label       TEXT NOT NULL,
  description TEXT,
  color       TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_entity
  ON knowledge_nodes (entity_type, entity_id);

-- ─── Knowledge Links ──────────────────────────────────────────────────────────
-- Directed connections between nodes. UNIQUE constraint prevents duplicate edges.
CREATE TABLE IF NOT EXISTS knowledge_links (
  id         TEXT PRIMARY KEY,
  source_id  TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  target_id  TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  label      TEXT,
  link_type  TEXT NOT NULL DEFAULT 'custom',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(source_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_links_source ON knowledge_links (source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_target ON knowledge_links (target_id);
`
