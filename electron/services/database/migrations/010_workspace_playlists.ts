export const version = '010_workspace_playlists'
export const name = '010_workspace_playlists.sql'

export const sql = `
-- ── Playlists ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS playlists (
  id          TEXT NOT NULL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  source      TEXT NOT NULL DEFAULT 'custom'
              CHECK (source IN ('youtube', 'custom')),
  source_url  TEXT,
  thumbnail   TEXT,
  skill_id    TEXT REFERENCES skills(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_playlists_skill_id ON playlists (skill_id);

CREATE TABLE IF NOT EXISTS playlist_items (
  id               TEXT    NOT NULL PRIMARY KEY,
  playlist_id      TEXT    NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id         TEXT    REFERENCES videos(id) ON DELETE SET NULL,
  title            TEXT    NOT NULL,
  url              TEXT,
  source           TEXT    NOT NULL DEFAULT 'youtube',
  duration_seconds INTEGER,
  position         INTEGER NOT NULL DEFAULT 0,
  watch_status     TEXT    NOT NULL DEFAULT 'unwatched'
                   CHECK (watch_status IN ('unwatched', 'watching', 'completed')),
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON playlist_items (playlist_id, position);

-- ── Workspace Session (singleton JSON state) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS workspace_state (
  id         TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
  state_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT OR IGNORE INTO workspace_state (id, state_json) VALUES ('singleton', '{}');
`
