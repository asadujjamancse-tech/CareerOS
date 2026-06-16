import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

// ── Row types ─────────────────────────────────────────────────────────────────

export interface WhiteboardRow {
  id: string
  title: string
  board_type: string
  description: string | null
  canvas_data: string
  created_at: string
  updated_at: string
}

export interface WhiteboardLinkRow {
  id: string
  whiteboard_id: string
  entity_type: string
  entity_id: string
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function now(): string { return new Date().toISOString() }

const DEFAULT_CANVAS = JSON.stringify({
  version: '1',
  background: '#1e1e2e',
  zoom: 1,
  pan: { x: 0, y: 0 },
  elements: [],
})

// ── Whiteboards ───────────────────────────────────────────────────────────────

export function getAllWhiteboards(db: Database): WhiteboardRow[] {
  return db
    .prepare('SELECT id, title, board_type, description, created_at, updated_at FROM whiteboards ORDER BY updated_at DESC')
    .all() as WhiteboardRow[]
}

export function getWhiteboardById(db: Database, id: string): WhiteboardRow | undefined {
  return db.prepare('SELECT * FROM whiteboards WHERE id = ?').get(id) as WhiteboardRow | undefined
}

export function createWhiteboard(
  db: Database,
  params: { title: string; board_type?: string; description?: string | null },
): WhiteboardRow {
  const id = nanoid()
  const ts = now()
  db.prepare(`
    INSERT INTO whiteboards (id, title, board_type, description, canvas_data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.title,
    params.board_type ?? 'free-drawing',
    params.description ?? null,
    DEFAULT_CANVAS,
    ts,
    ts,
  )
  return db.prepare('SELECT * FROM whiteboards WHERE id = ?').get(id) as WhiteboardRow
}

export function updateWhiteboard(
  db: Database,
  id: string,
  params: { title?: string; board_type?: string; description?: string | null },
): WhiteboardRow {
  const sets: string[] = ['updated_at = ?']
  const vals: unknown[] = [now()]
  if (params.title !== undefined) { sets.push('title = ?'); vals.push(params.title) }
  if (params.board_type !== undefined) { sets.push('board_type = ?'); vals.push(params.board_type) }
  if ('description' in params) { sets.push('description = ?'); vals.push(params.description ?? null) }
  vals.push(id)
  db.prepare(`UPDATE whiteboards SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return db.prepare('SELECT id, title, board_type, description, created_at, updated_at FROM whiteboards WHERE id = ?').get(id) as WhiteboardRow
}

export function deleteWhiteboard(db: Database, id: string): void {
  db.prepare('DELETE FROM whiteboards WHERE id = ?').run(id)
}

export function saveCanvasData(db: Database, id: string, canvasData: string): void {
  db.prepare('UPDATE whiteboards SET canvas_data = ?, updated_at = ? WHERE id = ?').run(canvasData, now(), id)
}

// ── Links ─────────────────────────────────────────────────────────────────────

export function getLinks(db: Database, whiteboardId: string): WhiteboardLinkRow[] {
  return db
    .prepare('SELECT * FROM whiteboard_links WHERE whiteboard_id = ? ORDER BY created_at')
    .all(whiteboardId) as WhiteboardLinkRow[]
}

export function addLink(
  db: Database,
  whiteboardId: string,
  entityType: string,
  entityId: string,
): WhiteboardLinkRow {
  const existing = db
    .prepare('SELECT * FROM whiteboard_links WHERE whiteboard_id = ? AND entity_type = ? AND entity_id = ?')
    .get(whiteboardId, entityType, entityId) as WhiteboardLinkRow | undefined
  if (existing) return existing

  const id = nanoid()
  db.prepare(`
    INSERT INTO whiteboard_links (id, whiteboard_id, entity_type, entity_id)
    VALUES (?, ?, ?, ?)
  `).run(id, whiteboardId, entityType, entityId)
  return db
    .prepare('SELECT * FROM whiteboard_links WHERE id = ?')
    .get(id) as WhiteboardLinkRow
}

export function removeLink(
  db: Database,
  whiteboardId: string,
  entityType: string,
  entityId: string,
): void {
  db.prepare(
    'DELETE FROM whiteboard_links WHERE whiteboard_id = ? AND entity_type = ? AND entity_id = ?',
  ).run(whiteboardId, entityType, entityId)
}
