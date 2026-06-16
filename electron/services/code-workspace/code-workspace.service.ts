import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

// ── Row types ─────────────────────────────────────────────────────────────────

export interface CodeFolderRow {
  id: string
  parent_id: string | null
  name: string
  sort_order: number
  created_at: string
}

export interface CodeFileRow {
  id: string
  folder_id: string | null
  title: string
  language: string
  content: string
  sort_order: number
  created_at: string
  updated_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function now(): string { return new Date().toISOString() }

// ── Folders ───────────────────────────────────────────────────────────────────

export function getAllFolders(db: Database): CodeFolderRow[] {
  return db
    .prepare('SELECT * FROM code_folders ORDER BY sort_order, name')
    .all() as CodeFolderRow[]
}

export function createFolder(
  db: Database,
  params: { name: string; parent_id?: string | null },
): CodeFolderRow {
  const id = nanoid()
  db.prepare(`
    INSERT INTO code_folders (id, parent_id, name)
    VALUES (?, ?, ?)
  `).run(id, params.parent_id ?? null, params.name)
  return db.prepare('SELECT * FROM code_folders WHERE id = ?').get(id) as CodeFolderRow
}

export function updateFolder(
  db: Database,
  id: string,
  params: { name?: string; parent_id?: string | null },
): CodeFolderRow {
  const sets: string[] = []
  const vals: unknown[] = []
  if (params.name !== undefined) { sets.push('name = ?'); vals.push(params.name) }
  if ('parent_id' in params) { sets.push('parent_id = ?'); vals.push(params.parent_id ?? null) }
  if (sets.length > 0) {
    vals.push(id)
    db.prepare(`UPDATE code_folders SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  }
  return db.prepare('SELECT * FROM code_folders WHERE id = ?').get(id) as CodeFolderRow
}

export function deleteFolder(db: Database, id: string): void {
  db.prepare('DELETE FROM code_folders WHERE id = ?').run(id)
}

// ── Files ─────────────────────────────────────────────────────────────────────

export function getAllFiles(db: Database): CodeFileRow[] {
  return db
    .prepare('SELECT id, folder_id, title, language, sort_order, created_at, updated_at, "" AS content FROM code_files ORDER BY folder_id, sort_order, title')
    .all() as CodeFileRow[]
}

export function getFileById(db: Database, id: string): CodeFileRow | undefined {
  return db.prepare('SELECT * FROM code_files WHERE id = ?').get(id) as CodeFileRow | undefined
}

export function createFile(
  db: Database,
  params: { title: string; language?: string; content?: string; folder_id?: string | null },
): CodeFileRow {
  const id = nanoid()
  const ts = now()
  db.prepare(`
    INSERT INTO code_files (id, folder_id, title, language, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.folder_id ?? null,
    params.title,
    params.language ?? 'typescript',
    params.content ?? '',
    ts,
    ts,
  )
  return db.prepare('SELECT * FROM code_files WHERE id = ?').get(id) as CodeFileRow
}

export function updateFile(
  db: Database,
  id: string,
  params: { title?: string; language?: string; folder_id?: string | null },
): CodeFileRow {
  const sets: string[] = ['updated_at = ?']
  const vals: unknown[] = [now()]
  if (params.title !== undefined) { sets.push('title = ?'); vals.push(params.title) }
  if (params.language !== undefined) { sets.push('language = ?'); vals.push(params.language) }
  if ('folder_id' in params) { sets.push('folder_id = ?'); vals.push(params.folder_id ?? null) }
  vals.push(id)
  db.prepare(`UPDATE code_files SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
  return db.prepare('SELECT id, folder_id, title, language, sort_order, created_at, updated_at, "" AS content FROM code_files WHERE id = ?').get(id) as CodeFileRow
}

export function saveFileContent(db: Database, id: string, content: string): void {
  db.prepare('UPDATE code_files SET content = ?, updated_at = ? WHERE id = ?').run(content, now(), id)
}

export function deleteFile(db: Database, id: string): void {
  db.prepare('DELETE FROM code_files WHERE id = ?').run(id)
}
