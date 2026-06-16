import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

// ─── Types ────────────────────────────────────────────────────────────────────

export type KgEntityType =
  | 'skill'
  | 'project'
  | 'lab'
  | 'document'
  | 'video'
  | 'interview_question'
  | 'certification'
  | 'note'
  | 'concept'

export interface KgNodeRow {
  id: string
  entity_type: KgEntityType
  entity_id: string | null
  label: string
  description: string | null
  color: string | null
  created_at: string
  updated_at: string
  link_count: number
}

export interface KgLinkRow {
  id: string
  source_id: string
  target_id: string
  label: string | null
  link_type: string
  created_at: string
  source_label: string
  target_label: string
}

export interface KgGraphData {
  nodes: KgNodeRow[]
  links: KgLinkRow[]
}

export interface CreateNodeParams {
  entity_type: KgEntityType
  entity_id?: string | null
  label: string
  description?: string | null
  color?: string | null
}

export interface UpdateNodeParams {
  label?: string
  description?: string | null
  color?: string | null
}

export interface CreateLinkParams {
  source_id: string
  target_id: string
  label?: string | null
  link_type?: string
}

export interface EntitySearchResult {
  id: string
  label: string
  entity_type: KgEntityType
  subtitle: string | null
}

// ─── Node CRUD ────────────────────────────────────────────────────────────────

export function getAllNodes(db: Database): KgNodeRow[] {
  return db.prepare(`
    SELECT n.*,
           (SELECT COUNT(*) FROM knowledge_links kl
            WHERE kl.source_id = n.id OR kl.target_id = n.id) AS link_count
    FROM knowledge_nodes n
    ORDER BY n.updated_at DESC
  `).all() as KgNodeRow[]
}

export function getNodeById(db: Database, id: string): KgNodeRow | null {
  return db.prepare(`
    SELECT n.*,
           (SELECT COUNT(*) FROM knowledge_links kl
            WHERE kl.source_id = n.id OR kl.target_id = n.id) AS link_count
    FROM knowledge_nodes n
    WHERE n.id = ?
  `).get(id) as KgNodeRow | null
}

export function createNode(db: Database, params: CreateNodeParams): KgNodeRow {
  const id = nanoid()
  db.prepare(`
    INSERT INTO knowledge_nodes (id, entity_type, entity_id, label, description, color)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, params.entity_type, params.entity_id ?? null, params.label, params.description ?? null, params.color ?? null)
  return getNodeById(db, id)!
}

export function updateNode(db: Database, id: string, params: UpdateNodeParams): KgNodeRow | null {
  const node = getNodeById(db, id)
  if (!node) return null

  db.prepare(`
    UPDATE knowledge_nodes
    SET label = ?,
        description = ?,
        color = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id = ?
  `).run(
    params.label ?? node.label,
    params.description !== undefined ? params.description : node.description,
    params.color !== undefined ? params.color : node.color,
    id,
  )
  return getNodeById(db, id)!
}

export function deleteNode(db: Database, id: string): boolean {
  const result = db.prepare('DELETE FROM knowledge_nodes WHERE id = ?').run(id)
  return result.changes > 0
}

// ─── Link CRUD ────────────────────────────────────────────────────────────────

export function getAllLinks(db: Database): KgLinkRow[] {
  return db.prepare(`
    SELECT kl.*,
           s.label AS source_label,
           t.label AS target_label
    FROM knowledge_links kl
    JOIN knowledge_nodes s ON s.id = kl.source_id
    JOIN knowledge_nodes t ON t.id = kl.target_id
    ORDER BY kl.created_at DESC
  `).all() as KgLinkRow[]
}

export function createLink(db: Database, params: CreateLinkParams): KgLinkRow | null {
  const id = nanoid()
  try {
    db.prepare(`
      INSERT INTO knowledge_links (id, source_id, target_id, label, link_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      params.source_id,
      params.target_id,
      params.label ?? null,
      params.link_type ?? 'custom',
    )
    return db.prepare(`
      SELECT kl.*, s.label AS source_label, t.label AS target_label
      FROM knowledge_links kl
      JOIN knowledge_nodes s ON s.id = kl.source_id
      JOIN knowledge_nodes t ON t.id = kl.target_id
      WHERE kl.id = ?
    `).get(id) as KgLinkRow
  } catch {
    return null
  }
}

export function deleteLink(db: Database, id: string): boolean {
  const result = db.prepare('DELETE FROM knowledge_links WHERE id = ?').run(id)
  return result.changes > 0
}

// ─── Full Graph ───────────────────────────────────────────────────────────────

export function getGraph(db: Database): KgGraphData {
  const nodes = getAllNodes(db)
  const links = getAllLinks(db)
  return { nodes, links }
}

// ─── Entity Search ────────────────────────────────────────────────────────────
// Search across all entity types so the UI can pick entities to add as nodes.

export function searchEntities(db: Database, query: string, entityType?: KgEntityType): EntitySearchResult[] {
  const q = `%${query}%`
  const results: EntitySearchResult[] = []

  const types = entityType ? [entityType] : [
    'skill', 'project', 'lab', 'document', 'video',
    'interview_question', 'certification', 'note',
  ] as KgEntityType[]

  if (types.includes('skill')) {
    const rows = db.prepare(`
      SELECT id, name AS label, proficiency_level AS subtitle
      FROM skills WHERE deleted_at IS NULL AND name LIKE ?
      ORDER BY name LIMIT 20
    `).all(q) as Array<{ id: string; label: string; subtitle: string | null }>
    results.push(...rows.map(r => ({ ...r, entity_type: 'skill' as const })))
  }

  if (types.includes('project')) {
    const rows = db.prepare(`
      SELECT id, title AS label, status AS subtitle
      FROM projects WHERE deleted_at IS NULL AND title LIKE ?
      ORDER BY title LIMIT 20
    `).all(q) as Array<{ id: string; label: string; subtitle: string | null }>
    results.push(...rows.map(r => ({ ...r, entity_type: 'project' as const })))
  }

  if (types.includes('lab')) {
    const rows = db.prepare(`
      SELECT id, title AS label, status AS subtitle
      FROM home_labs WHERE deleted_at IS NULL AND title LIKE ?
      ORDER BY title LIMIT 20
    `).all(q) as Array<{ id: string; label: string; subtitle: string | null }>
    results.push(...rows.map(r => ({ ...r, entity_type: 'lab' as const })))
  }

  if (types.includes('document')) {
    const rows = db.prepare(`
      SELECT id, original_name AS label, file_type AS subtitle
      FROM documents WHERE deleted_at IS NULL AND original_name LIKE ?
      ORDER BY original_name LIMIT 20
    `).all(q) as Array<{ id: string; label: string; subtitle: string | null }>
    results.push(...rows.map(r => ({ ...r, entity_type: 'document' as const })))
  }

  if (types.includes('video')) {
    const rows = db.prepare(`
      SELECT id, title AS label, watch_status AS subtitle
      FROM videos WHERE deleted_at IS NULL AND title LIKE ?
      ORDER BY title LIMIT 20
    `).all(q) as Array<{ id: string; label: string; subtitle: string | null }>
    results.push(...rows.map(r => ({ ...r, entity_type: 'video' as const })))
  }

  if (types.includes('interview_question')) {
    const rows = db.prepare(`
      SELECT id, question AS label, difficulty AS subtitle
      FROM interview_questions WHERE deleted_at IS NULL AND question LIKE ?
      ORDER BY question LIMIT 20
    `).all(q) as Array<{ id: string; label: string; subtitle: string | null }>
    results.push(...rows.map(r => ({ ...r, entity_type: 'interview_question' as const })))
  }

  if (types.includes('certification')) {
    const rows = db.prepare(`
      SELECT id, name AS label, status AS subtitle
      FROM certifications WHERE deleted_at IS NULL AND name LIKE ?
      ORDER BY name LIMIT 20
    `).all(q) as Array<{ id: string; label: string; subtitle: string | null }>
    results.push(...rows.map(r => ({ ...r, entity_type: 'certification' as const })))
  }

  if (types.includes('note')) {
    const rows = db.prepare(`
      SELECT id, title AS label, NULL AS subtitle
      FROM notes WHERE deleted_at IS NULL AND title LIKE ?
      ORDER BY title LIMIT 20
    `).all(q) as Array<{ id: string; label: string; subtitle: string | null }>
    results.push(...rows.map(r => ({ ...r, entity_type: 'note' as const })))
  }

  if (!query) return results.slice(0, 60)
  return results
}
