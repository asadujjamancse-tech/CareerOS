import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export interface KnowledgeColorRow {
  id: string
  color_hex: string
  name: string
  meaning: string
  description: string | null
  order_index: number
  is_system: 0 | 1
  created_at: string
  updated_at: string
}

export interface CreateColorParams {
  color_hex: string
  name: string
  meaning: string
  description?: string | null
}

export interface UpdateColorParams {
  color_hex?: string
  name?: string
  meaning?: string
  description?: string | null
  order_index?: number
}

function nowIso(): string { return new Date().toISOString() }

export function getAllColors(db: Database): KnowledgeColorRow[] {
  return db.prepare(`
    SELECT * FROM knowledge_colors ORDER BY order_index ASC
  `).all() as KnowledgeColorRow[]
}

export function getColorByHex(db: Database, colorHex: string): KnowledgeColorRow | null {
  return db.prepare(`SELECT * FROM knowledge_colors WHERE color_hex = ?`).get(colorHex) as KnowledgeColorRow | null
}

export function createColor(db: Database, params: CreateColorParams): KnowledgeColorRow {
  const id = `kc_${nanoid(8)}`
  const now = nowIso()
  const maxOrder = (db.prepare(`SELECT MAX(order_index) AS m FROM knowledge_colors`).get() as { m: number | null }).m ?? 0

  db.prepare(`
    INSERT INTO knowledge_colors (id, color_hex, name, meaning, description, order_index, is_system, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(id, params.color_hex, params.name, params.meaning, params.description ?? null, maxOrder + 1, now, now)

  return db.prepare(`SELECT * FROM knowledge_colors WHERE id = ?`).get(id) as KnowledgeColorRow
}

export function updateColor(db: Database, id: string, params: UpdateColorParams): KnowledgeColorRow {
  const sets: string[] = ['updated_at = ?']
  const vals: (string | number | null)[] = [nowIso()]

  if (params.color_hex !== undefined) { sets.push('color_hex = ?'); vals.push(params.color_hex) }
  if (params.name !== undefined) { sets.push('name = ?'); vals.push(params.name) }
  if (params.meaning !== undefined) { sets.push('meaning = ?'); vals.push(params.meaning) }
  if (params.description !== undefined) { sets.push('description = ?'); vals.push(params.description) }
  if (params.order_index !== undefined) { sets.push('order_index = ?'); vals.push(params.order_index) }

  vals.push(id)
  db.prepare(`UPDATE knowledge_colors SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return db.prepare(`SELECT * FROM knowledge_colors WHERE id = ?`).get(id) as KnowledgeColorRow
}

export function deleteColor(db: Database, id: string): void {
  const color = db.prepare(`SELECT is_system FROM knowledge_colors WHERE id = ?`).get(id) as { is_system: number } | null
  if (color?.is_system === 1) throw new Error('Cannot delete system colors')
  db.prepare(`DELETE FROM knowledge_colors WHERE id = ?`).run(id)
}

export function reorderColors(db: Database, orderedIds: string[]): void {
  const update = db.prepare(`UPDATE knowledge_colors SET order_index = ? WHERE id = ?`)
  db.transaction(() => {
    orderedIds.forEach((id, index) => update.run(index + 1, id))
  })()
}
