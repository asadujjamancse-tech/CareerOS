import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export interface VideoRow {
  id: string; title: string; description: string | null; url: string | null; local_path: string | null
  source: string; channel: string | null; duration_seconds: number | null; watch_status: string
  progress_seconds: number; thumbnail_path: string | null; published_at: string | null; notes: string | null
  created_at: string; updated_at: string; deleted_at: string | null
}

export interface VideoWithMeta extends VideoRow {
  skill_count: number; tag_count: number
}

export interface SkillRefRow {
  id: string; name: string; category_name: string; category_color: string; proficiency_level: string
}
export interface TagRow { id: string; name: string; slug: string; color_hex: string; created_at: string; updated_at: string }

export interface VideoDetail extends VideoWithMeta { skills: SkillRefRow[]; tags: TagRow[] }

export interface PaginatedVideos {
  items: VideoWithMeta[]; total: number; page: number; pageSize: number; totalPages: number
}

export interface GetAllVideosParams {
  search?: string | undefined; source?: string | undefined; watch_status?: string | undefined
  page?: number | undefined; pageSize?: number | undefined
}

export interface CreateVideoParams {
  title: string; description?: string | null; url?: string | null; local_path?: string | null
  source?: string; channel?: string | null; duration_seconds?: number | null; watch_status?: string
  thumbnail_path?: string | null; published_at?: string | null; notes?: string | null
  skill_ids?: string[]; tag_ids?: string[]
}

export type UpdateVideoParams = Partial<CreateVideoParams>

function buildFtsQuery(s: string): string {
  return s.trim().split(/\s+/).filter(Boolean).map(w => `"${w.replace(/"/g, '')}"*`).join(' ')
}
function nowIso(): string { return new Date().toISOString() }

const VIDEO_SELECT = `
  v.id, v.title, v.description, v.url, v.local_path, v.source, v.channel,
  v.duration_seconds, v.watch_status, v.progress_seconds, v.thumbnail_path,
  v.published_at, v.notes, v.created_at, v.updated_at, v.deleted_at,
  (SELECT COUNT(*) FROM video_skills WHERE video_id = v.id) AS skill_count,
  (SELECT COUNT(*) FROM entity_tags WHERE entity_type = 'video' AND entity_id = v.id) AS tag_count
`

export function getAllVideos(db: Database, params: GetAllVideosParams): PaginatedVideos {
  const { search, source, watch_status, page = 1, pageSize = 24 } = params
  const offset = (page - 1) * pageSize
  if (search?.trim()) return searchVideosFts(db, { search, source, watch_status, page, pageSize })
  const bind: Record<string, string | number | null> = { source: source ?? null, watch_status: watch_status ?? null, limit: pageSize, offset }
  const WHERE = `WHERE v.deleted_at IS NULL AND (v.source = :source OR :source IS NULL) AND (v.watch_status = :watch_status OR :watch_status IS NULL)`
  const total = (db.prepare(`SELECT COUNT(*) AS total FROM videos v ${WHERE}`).get(bind) as { total: number }).total
  const items = db.prepare(`SELECT ${VIDEO_SELECT} FROM videos v ${WHERE} ORDER BY v.updated_at DESC LIMIT :limit OFFSET :offset`).all(bind) as VideoWithMeta[]
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

function searchVideosFts(db: Database, params: GetAllVideosParams & { search: string; page: number; pageSize: number }): PaginatedVideos {
  const { search, source, watch_status, page, pageSize } = params
  const ftsQuery = buildFtsQuery(search); const offset = (page - 1) * pageSize
  const cond: string[] = ['v.deleted_at IS NULL']; const extra: Record<string, string | null> = {}
  if (source) { cond.push('v.source = :source'); extra['source'] = source }
  if (watch_status) { cond.push('v.watch_status = :watch_status'); extra['watch_status'] = watch_status }
  const extraWhere = cond.length ? 'AND ' + cond.join(' AND ') : ''
  const bind = { fts: ftsQuery, ...extra, limit: pageSize, offset }
  const total = (db.prepare(`SELECT COUNT(*) AS total FROM videos_fts JOIN videos v ON v.rowid = videos_fts.rowid WHERE videos_fts MATCH :fts ${extraWhere}`).get(bind) as { total: number }).total
  const items = db.prepare(`SELECT ${VIDEO_SELECT} FROM videos_fts JOIN videos v ON v.rowid = videos_fts.rowid WHERE videos_fts MATCH :fts ${extraWhere} ORDER BY rank LIMIT :limit OFFSET :offset`).all(bind) as VideoWithMeta[]
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export function getVideoById(db: Database, id: string): VideoDetail | null {
  const video = db.prepare(`SELECT ${VIDEO_SELECT} FROM videos v WHERE v.id = ? AND v.deleted_at IS NULL`).get(id) as VideoWithMeta | undefined
  if (!video) return null
  const skills = db.prepare(`SELECT s.id, s.name, sc.name AS category_name, sc.color_hex AS category_color, s.proficiency_level FROM skills s JOIN skill_categories sc ON sc.id = s.category_id JOIN video_skills vs ON vs.skill_id = s.id WHERE vs.video_id = ? AND s.deleted_at IS NULL ORDER BY s.name`).all(id) as SkillRefRow[]
  const tags = db.prepare(`SELECT t.* FROM tags t JOIN entity_tags et ON et.tag_id = t.id WHERE et.entity_type = 'video' AND et.entity_id = ? ORDER BY t.name`).all(id) as TagRow[]
  return { ...video, skills, tags }
}

export function createVideo(db: Database, params: CreateVideoParams): VideoRow {
  const id = nanoid(); const now = nowIso()
  db.transaction(() => {
    db.prepare(`INSERT INTO videos (id, title, description, url, local_path, source, channel, duration_seconds, watch_status, progress_seconds, thumbnail_path, published_at, notes, created_at, updated_at) VALUES (:id,:title,:description,:url,:local_path,:source,:channel,:duration_seconds,:watch_status,0,:thumbnail_path,:published_at,:notes,:now,:now)`)
      .run({ id, title: params.title, description: params.description ?? null, url: params.url ?? null, local_path: params.local_path ?? null, source: params.source ?? 'other', channel: params.channel ?? null, duration_seconds: params.duration_seconds ?? null, watch_status: params.watch_status ?? 'unwatched', thumbnail_path: params.thumbnail_path ?? null, published_at: params.published_at ?? null, notes: params.notes ?? null, now })
    if (params.skill_ids?.length) syncSkills(db, id, params.skill_ids)
    if (params.tag_ids?.length) syncTags(db, id, params.tag_ids)
  })()
  return db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as VideoRow
}

export function updateVideo(db: Database, id: string, params: UpdateVideoParams): VideoRow | null {
  const existing = db.prepare('SELECT * FROM videos WHERE id = ? AND deleted_at IS NULL').get(id) as VideoRow | undefined
  if (!existing) return null
  db.transaction(() => {
    db.prepare(`UPDATE videos SET title=COALESCE(:title,title), description=COALESCE(:description,description), url=COALESCE(:url,url), local_path=COALESCE(:local_path,local_path), source=COALESCE(:source,source), channel=COALESCE(:channel,channel), duration_seconds=COALESCE(:duration_seconds,duration_seconds), watch_status=COALESCE(:watch_status,watch_status), thumbnail_path=COALESCE(:thumbnail_path,thumbnail_path), published_at=COALESCE(:published_at,published_at), notes=COALESCE(:notes,notes), updated_at=:now WHERE id=:id AND deleted_at IS NULL`)
      .run({ id, title: params.title ?? null, description: params.description ?? null, url: params.url ?? null, local_path: params.local_path ?? null, source: params.source ?? null, channel: params.channel ?? null, duration_seconds: params.duration_seconds ?? null, watch_status: params.watch_status ?? null, thumbnail_path: params.thumbnail_path ?? null, published_at: params.published_at ?? null, notes: params.notes ?? null, now: nowIso() })
    if (params.skill_ids !== undefined) syncSkills(db, id, params.skill_ids)
    if (params.tag_ids !== undefined) syncTags(db, id, params.tag_ids)
  })()
  return db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as VideoRow
}

export function updateVideoProgress(db: Database, id: string, progressSeconds: number): boolean {
  const result = db.prepare('UPDATE videos SET progress_seconds = ?, watch_status = CASE WHEN ? > 0 AND watch_status = ? THEN ? ELSE watch_status END, updated_at = ? WHERE id = ? AND deleted_at IS NULL')
    .run(progressSeconds, progressSeconds, 'unwatched', 'watching', nowIso(), id)
  return result.changes > 0
}

export function softDeleteVideo(db: Database, id: string): boolean {
  return (db.prepare('UPDATE videos SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL').run(nowIso(), id)).changes > 0
}

function syncSkills(db: Database, videoId: string, skillIds: string[]): void {
  db.prepare('DELETE FROM video_skills WHERE video_id = ?').run(videoId)
  const ins = db.prepare('INSERT OR IGNORE INTO video_skills (video_id, skill_id) VALUES (?, ?)')
  for (const s of skillIds) ins.run(videoId, s)
}

function syncTags(db: Database, entityId: string, tagIds: string[]): void {
  db.prepare(`DELETE FROM entity_tags WHERE entity_type = 'video' AND entity_id = ?`).run(entityId)
  const ins = db.prepare(`INSERT OR IGNORE INTO entity_tags (tag_id, entity_type, entity_id) VALUES (?, 'video', ?)`)
  for (const t of tagIds) ins.run(t, entityId)
}
