import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

function now(): string { return new Date().toISOString() }

// ─── Row Types ───────────────────────────────────────────────────────────────

export interface PlaylistRow {
  id: string
  title: string
  description: string | null
  source: 'youtube' | 'custom'
  source_url: string | null
  thumbnail: string | null
  skill_id: string | null
  created_at: string
  updated_at: string
}

export interface PlaylistWithProgressRow extends PlaylistRow {
  item_count: number
  completed_count: number
  total_duration_seconds: number
  skill_name: string | null
}

export interface PlaylistItemRow {
  id: string
  playlist_id: string
  video_id: string | null
  title: string
  url: string | null
  source: string
  duration_seconds: number | null
  position: number
  watch_status: 'unwatched' | 'watching' | 'completed'
  progress_seconds: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PlaylistDetailRow extends PlaylistRow {
  items: PlaylistItemRow[]
  skill_name: string | null
}

// ─── Params ──────────────────────────────────────────────────────────────────

export interface CreatePlaylistParams {
  title: string
  description?: string | null
  source?: 'youtube' | 'custom'
  source_url?: string | null
  thumbnail?: string | null
  skill_id?: string | null
}

export type UpdatePlaylistParams = Partial<CreatePlaylistParams>

export interface CreatePlaylistItemParams {
  playlist_id: string
  title: string
  url?: string | null
  source?: string
  duration_seconds?: number | null
  video_id?: string | null
}

export interface UpdatePlaylistItemParams {
  title?: string
  url?: string | null
  source?: string
  duration_seconds?: number | null
  watch_status?: 'unwatched' | 'watching' | 'completed'
  progress_seconds?: number
  notes?: string | null
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function getAllPlaylists(db: Database, skillId?: string): PlaylistWithProgressRow[] {
  const where = skillId ? 'WHERE p.skill_id = ?' : ''
  const args = skillId ? [skillId] : []
  return db.prepare(`
    SELECT
      p.*,
      s.name AS skill_name,
      COUNT(pi.id)                                                    AS item_count,
      SUM(CASE WHEN pi.watch_status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
      COALESCE(SUM(pi.duration_seconds), 0)                           AS total_duration_seconds
    FROM playlists p
    LEFT JOIN skills s ON s.id = p.skill_id
    LEFT JOIN playlist_items pi ON pi.playlist_id = p.id
    ${where}
    GROUP BY p.id
    ORDER BY p.updated_at DESC
  `).all(...args) as PlaylistWithProgressRow[]
}

export function getPlaylistById(db: Database, id: string): PlaylistDetailRow | null {
  const playlist = db.prepare(`
    SELECT p.*, s.name AS skill_name
    FROM playlists p
    LEFT JOIN skills s ON s.id = p.skill_id
    WHERE p.id = ?
  `).get(id) as (PlaylistRow & { skill_name: string | null }) | undefined
  if (!playlist) return null
  const items = db.prepare(
    'SELECT * FROM playlist_items WHERE playlist_id = ? ORDER BY position ASC',
  ).all(id) as PlaylistItemRow[]
  return { ...playlist, items }
}

export function createPlaylist(db: Database, params: CreatePlaylistParams): PlaylistRow {
  const id = nanoid()
  const ts = now()
  db.prepare(`
    INSERT INTO playlists (id, title, description, source, source_url, thumbnail, skill_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, params.title, params.description ?? null, params.source ?? 'custom',
    params.source_url ?? null, params.thumbnail ?? null, params.skill_id ?? null, ts, ts,
  )
  return db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as PlaylistRow
}

export function updatePlaylist(db: Database, id: string, params: UpdatePlaylistParams): PlaylistRow | null {
  const existing = db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as PlaylistRow | undefined
  if (!existing) return null
  const merged = { ...existing, ...params }
  db.prepare(`
    UPDATE playlists
    SET title = ?, description = ?, source = ?, source_url = ?, thumbnail = ?, skill_id = ?, updated_at = ?
    WHERE id = ?
  `).run(
    merged.title, merged.description, merged.source, merged.source_url,
    merged.thumbnail, merged.skill_id, now(), id,
  )
  return db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as PlaylistRow
}

export function deletePlaylist(db: Database, id: string): boolean {
  return db.prepare('DELETE FROM playlists WHERE id = ?').run(id).changes > 0
}

export function createPlaylistItem(db: Database, params: CreatePlaylistItemParams): PlaylistItemRow {
  const id = nanoid()
  const ts = now()
  const { m } = db.prepare(
    'SELECT COALESCE(MAX(position), -1) AS m FROM playlist_items WHERE playlist_id = ?',
  ).get(params.playlist_id) as { m: number }
  db.prepare(`
    INSERT INTO playlist_items (id, playlist_id, video_id, title, url, source, duration_seconds, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, params.playlist_id, params.video_id ?? null, params.title,
    params.url ?? null, params.source ?? 'youtube', params.duration_seconds ?? null, m + 1, ts, ts,
  )
  return db.prepare('SELECT * FROM playlist_items WHERE id = ?').get(id) as PlaylistItemRow
}

export function updatePlaylistItem(db: Database, id: string, params: UpdatePlaylistItemParams): PlaylistItemRow | null {
  const existing = db.prepare('SELECT * FROM playlist_items WHERE id = ?').get(id) as PlaylistItemRow | undefined
  if (!existing) return null
  const merged = { ...existing, ...params }
  db.prepare(`
    UPDATE playlist_items
    SET title = ?, url = ?, source = ?, duration_seconds = ?, watch_status = ?,
        progress_seconds = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).run(
    merged.title, merged.url, merged.source, merged.duration_seconds,
    merged.watch_status, merged.progress_seconds, merged.notes, now(), id,
  )
  return db.prepare('SELECT * FROM playlist_items WHERE id = ?').get(id) as PlaylistItemRow
}

export function deletePlaylistItem(db: Database, id: string): boolean {
  return db.prepare('DELETE FROM playlist_items WHERE id = ?').run(id).changes > 0
}

export function reorderPlaylistItems(db: Database, playlistId: string, orderedIds: string[]): void {
  const ts = now()
  const update = db.prepare(
    'UPDATE playlist_items SET position = ?, updated_at = ? WHERE id = ? AND playlist_id = ?',
  )
  db.transaction(() => {
    orderedIds.forEach((itemId, index) => update.run(index, ts, itemId, playlistId))
  })()
}
