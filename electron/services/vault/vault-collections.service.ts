import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'
import fs from 'fs'
import path from 'path'

export interface VaultCollection {
  id: string
  name: string
  description: string | null
  color_hex: string
  icon: string
  parent_id: string | null
  order_index: number
  doc_count: number
  created_at: string
  updated_at: string
}

export interface VaultFavorite {
  document_id: string
  created_at: string
}

export interface VaultRecentFile {
  document_id: string
  opened_at: string
}

function nowIso(): string { return new Date().toISOString() }

// ── Collections ───────────────────────────────────────────────────────────────

export function getAllCollections(db: Database): VaultCollection[] {
  return db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM vault_collection_documents WHERE collection_id = c.id) AS doc_count
    FROM vault_collections c
    ORDER BY c.order_index ASC, c.name ASC
  `).all() as VaultCollection[]
}

export function createCollection(
  db: Database,
  params: { name: string; description?: string | null; color_hex?: string; icon?: string; parent_id?: string | null },
): VaultCollection {
  const id = nanoid()
  const now = nowIso()
  const maxOrder = (db.prepare('SELECT COALESCE(MAX(order_index), 0) AS m FROM vault_collections').get() as { m: number }).m
  db.prepare(`
    INSERT INTO vault_collections (id, name, description, color_hex, icon, parent_id, order_index, created_at, updated_at)
    VALUES (:id, :name, :description, :color_hex, :icon, :parent_id, :order_index, :now, :now)
  `).run({
    id,
    name: params.name,
    description: params.description ?? null,
    color_hex: params.color_hex ?? '#6B7280',
    icon: params.icon ?? 'folder',
    parent_id: params.parent_id ?? null,
    order_index: maxOrder + 1,
    now,
  })
  return db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM vault_collection_documents WHERE collection_id = c.id) AS doc_count
    FROM vault_collections c WHERE c.id = ?
  `).get(id) as VaultCollection
}

export function updateCollection(
  db: Database,
  id: string,
  params: { name?: string; description?: string | null; color_hex?: string; icon?: string },
): VaultCollection | null {
  const existing = db.prepare('SELECT id FROM vault_collections WHERE id = ?').get(id)
  if (!existing) return null
  db.prepare(`
    UPDATE vault_collections SET
      name        = COALESCE(:name, name),
      description = COALESCE(:description, description),
      color_hex   = COALESCE(:color_hex, color_hex),
      icon        = COALESCE(:icon, icon),
      updated_at  = :now
    WHERE id = :id
  `).run({ id, name: params.name ?? null, description: params.description ?? null, color_hex: params.color_hex ?? null, icon: params.icon ?? null, now: nowIso() })
  return db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM vault_collection_documents WHERE collection_id = c.id) AS doc_count
    FROM vault_collections c WHERE c.id = ?
  `).get(id) as VaultCollection
}

export function deleteCollection(db: Database, id: string): boolean {
  return (db.prepare('DELETE FROM vault_collections WHERE id = ?').run(id)).changes > 0
}

export function addDocumentToCollection(db: Database, collectionId: string, documentId: string): void {
  db.prepare(`
    INSERT OR IGNORE INTO vault_collection_documents (collection_id, document_id, added_at) VALUES (?, ?, ?)
  `).run(collectionId, documentId, nowIso())
}

export function removeDocumentFromCollection(db: Database, collectionId: string, documentId: string): void {
  db.prepare('DELETE FROM vault_collection_documents WHERE collection_id = ? AND document_id = ?').run(collectionId, documentId)
}

export function getCollectionDocumentIds(db: Database, collectionId: string): string[] {
  return (db.prepare('SELECT document_id FROM vault_collection_documents WHERE collection_id = ? ORDER BY added_at DESC').all(collectionId) as { document_id: string }[]).map(r => r.document_id)
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export function getFavoriteDocumentIds(db: Database): string[] {
  return (db.prepare('SELECT document_id FROM vault_favorites ORDER BY created_at DESC').all() as { document_id: string }[]).map(r => r.document_id)
}

export function toggleFavorite(db: Database, documentId: string): { is_favorite: boolean } {
  const existing = db.prepare('SELECT document_id FROM vault_favorites WHERE document_id = ?').get(documentId)
  if (existing) {
    db.prepare('DELETE FROM vault_favorites WHERE document_id = ?').run(documentId)
    return { is_favorite: false }
  } else {
    db.prepare('INSERT OR IGNORE INTO vault_favorites (document_id, created_at) VALUES (?, ?)').run(documentId, nowIso())
    return { is_favorite: true }
  }
}

// ── Recent Files ──────────────────────────────────────────────────────────────

export function trackRecentFile(db: Database, documentId: string): void {
  db.prepare(`
    INSERT INTO vault_recent_files (document_id, opened_at) VALUES (?, ?)
    ON CONFLICT(document_id) DO UPDATE SET opened_at = excluded.opened_at
  `).run(documentId, nowIso())
}

export function getRecentDocumentIds(db: Database, limit = 20): string[] {
  return (db.prepare('SELECT document_id FROM vault_recent_files ORDER BY opened_at DESC LIMIT ?').all(limit) as { document_id: string }[]).map(r => r.document_id)
}

export function clearRecentFiles(db: Database): void {
  db.prepare('DELETE FROM vault_recent_files').run()
}

// ── Rename ────────────────────────────────────────────────────────────────────

export function renameDocument(
  db: Database,
  id: string,
  newTitle: string,
  newFilename?: string,
): { id: string; title: string; original_filename: string; file_path: string } | null {
  const row = db.prepare('SELECT id, title, original_filename, file_path FROM documents WHERE id = ? AND deleted_at IS NULL').get(id) as
    | { id: string; title: string; original_filename: string; file_path: string }
    | undefined
  if (!row) return null

  const now = nowIso()

  if (newFilename && newFilename !== row.original_filename) {
    const dir = path.dirname(row.file_path)
    const newPath = path.join(dir, newFilename)
    if (fs.existsSync(row.file_path) && !fs.existsSync(newPath)) {
      fs.renameSync(row.file_path, newPath)
      db.prepare('UPDATE documents SET title = ?, original_filename = ?, file_path = ?, updated_at = ? WHERE id = ?')
        .run(newTitle, newFilename, newPath, now, id)
    } else {
      db.prepare('UPDATE documents SET title = ?, updated_at = ? WHERE id = ?').run(newTitle, now, id)
    }
  } else {
    db.prepare('UPDATE documents SET title = ?, updated_at = ? WHERE id = ?').run(newTitle, now, id)
  }

  return db.prepare('SELECT id, title, original_filename, file_path FROM documents WHERE id = ?').get(id) as {
    id: string; title: string; original_filename: string; file_path: string
  }
}
