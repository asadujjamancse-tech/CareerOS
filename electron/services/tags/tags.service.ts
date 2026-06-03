import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export interface TagRow {
  id: string
  name: string
  slug: string
  color_hex: string
  created_at: string
  updated_at: string
}

export interface TagWithCount extends TagRow {
  usage_count: number
}

export interface CreateTagParams {
  name: string
  color_hex?: string
}

export type UpdateTagParams = Partial<CreateTagParams>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

function nowIso(): string {
  return new Date().toISOString()
}

function uniqueSlug(db: Database, name: string, excludeId?: string): string {
  const base = slugify(name) || nanoid(8)
  const rows = excludeId
    ? (db.prepare(`SELECT slug FROM tags WHERE slug LIKE ? AND id != ?`).all(`${base}%`, excludeId) as { slug: string }[])
    : (db.prepare(`SELECT slug FROM tags WHERE slug LIKE ?`).all(`${base}%`) as { slug: string }[])

  const taken = new Set(rows.map(r => r.slug))
  if (!taken.has(base)) return base
  for (let i = 2; i < 100; i++) {
    const c = `${base}-${i}`; if (!taken.has(c)) return c
  }
  return `${base}-${nanoid(4)}`
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export function getAllTags(db: Database): TagWithCount[] {
  return db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM entity_tags WHERE tag_id = t.id) AS usage_count
    FROM tags t
    ORDER BY t.name
  `).all() as TagWithCount[]
}

export function getTagById(db: Database, id: string): TagRow | null {
  return (db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow | undefined) ?? null
}

export function createTag(db: Database, params: CreateTagParams): TagRow {
  const id = nanoid()
  const now = nowIso()
  db.prepare(`
    INSERT INTO tags (id, name, slug, color_hex, created_at, updated_at)
    VALUES (:id, :name, :slug, :color_hex, :now, :now)
  `).run({ id, name: params.name, slug: uniqueSlug(db, params.name), color_hex: params.color_hex ?? '#6B7280', now })
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow
}

export function updateTag(db: Database, id: string, params: UpdateTagParams): TagRow | null {
  const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow | undefined
  if (!existing) return null
  const slug = params.name && params.name !== existing.name ? uniqueSlug(db, params.name, id) : existing.slug
  db.prepare(`
    UPDATE tags SET
      name      = COALESCE(:name,      name),
      slug      = :slug,
      color_hex = COALESCE(:color_hex, color_hex),
      updated_at = :now
    WHERE id = :id
  `).run({ id, name: params.name ?? null, slug, color_hex: params.color_hex ?? null, now: nowIso() })
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow
}

export function deleteTag(db: Database, id: string): boolean {
  const result = db.prepare('DELETE FROM tags WHERE id = ?').run(id)
  return result.changes > 0
}

export function getEntityTags(db: Database, entityType: string, entityId: string): TagRow[] {
  return db.prepare(`
    SELECT t.* FROM tags t
    JOIN entity_tags et ON et.tag_id = t.id
    WHERE et.entity_type = ? AND et.entity_id = ?
    ORDER BY t.name
  `).all(entityType, entityId) as TagRow[]
}

export function setEntityTags(db: Database, entityType: string, entityId: string, tagIds: string[]): void {
  db.transaction(() => {
    db.prepare('DELETE FROM entity_tags WHERE entity_type = ? AND entity_id = ?').run(entityType, entityId)
    const ins = db.prepare('INSERT OR IGNORE INTO entity_tags (tag_id, entity_type, entity_id) VALUES (?, ?, ?)')
    for (const tagId of tagIds) ins.run(tagId, entityType, entityId)
  })()
}
