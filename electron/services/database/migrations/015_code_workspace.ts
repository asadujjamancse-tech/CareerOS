export const version = '015'
export const name = 'code_workspace'

export const sql = `
CREATE TABLE IF NOT EXISTS code_folders (
  id         TEXT NOT NULL PRIMARY KEY,
  parent_id  TEXT REFERENCES code_folders(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS code_files (
  id         TEXT NOT NULL PRIMARY KEY,
  folder_id  TEXT REFERENCES code_folders(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  language   TEXT NOT NULL DEFAULT 'typescript',
  content    TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`
