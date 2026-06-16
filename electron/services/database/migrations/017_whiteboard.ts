export const version = '017'
export const name = 'whiteboard'

export const sql = `
CREATE TABLE IF NOT EXISTS whiteboards (
  id           TEXT NOT NULL PRIMARY KEY,
  title        TEXT NOT NULL,
  board_type   TEXT NOT NULL DEFAULT 'free-drawing',
  description  TEXT,
  canvas_data  TEXT NOT NULL DEFAULT '{"version":"1","background":"#1e1e2e","zoom":1,"pan":{"x":0,"y":0},"elements":[]}',
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS whiteboard_links (
  id            TEXT NOT NULL PRIMARY KEY,
  whiteboard_id TEXT NOT NULL REFERENCES whiteboards(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(whiteboard_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_whiteboard_links_whiteboard ON whiteboard_links(whiteboard_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_links_entity    ON whiteboard_links(entity_type, entity_id);
`
