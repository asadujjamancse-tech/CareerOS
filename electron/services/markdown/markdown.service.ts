import type { Database } from 'better-sqlite3'
import { randomUUID } from 'crypto'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MarkdownDocument {
  id: string
  title: string
  content: string
  frontmatter: string
  word_count: number
  tags: string
  created_at: string
  updated_at: string
}

export interface MarkdownVersion {
  id: string
  document_id: string
  content: string
  title: string
  version_number: number
  label: string | null
  created_at: string
}

export interface CreateDocumentParams {
  title?: string
  content?: string
  tags?: string[]
}

export interface UpdateDocumentParams {
  title?: string
  content?: string
  tags?: string[]
  snapshot?: boolean
  snapshot_label?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString()
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

export function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(content)
  if (!match) return { frontmatter: {}, body: content }
  try {
    // Basic YAML key: value parser (no nesting, just primitives and strings)
    const yaml = match[1] ?? ''
    const fm: Record<string, unknown> = {}
    for (const line of yaml.split('\n')) {
      const sep = line.indexOf(':')
      if (sep === -1) continue
      const key = line.slice(0, sep).trim()
      const val = line.slice(sep + 1).trim()
      fm[key] = val === '' ? null : /^\d+$/.test(val) ? parseInt(val, 10) : val.replace(/^["']|["']$/g, '')
    }
    return { frontmatter: fm, body: (match[2] ?? '').trimStart() }
  } catch {
    return { frontmatter: {}, body: content }
  }
}

// ── Documents ─────────────────────────────────────────────────────────────────

export function getAllDocuments(db: Database): MarkdownDocument[] {
  return db
    .prepare('SELECT * FROM markdown_documents ORDER BY updated_at DESC')
    .all() as MarkdownDocument[]
}

export function getDocumentById(db: Database, id: string): MarkdownDocument | null {
  return (
    (db.prepare('SELECT * FROM markdown_documents WHERE id = ?').get(id) as MarkdownDocument | undefined) ?? null
  )
}

export function createDocument(db: Database, params: CreateDocumentParams = {}): MarkdownDocument {
  const id = randomUUID()
  const now = nowIso()
  const content = params.content ?? ''
  const { frontmatter } = parseFrontmatter(content)
  db.prepare(`
    INSERT INTO markdown_documents (id, title, content, frontmatter, word_count, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.title ?? 'Untitled',
    content,
    JSON.stringify(frontmatter),
    countWords(content),
    JSON.stringify(params.tags ?? []),
    now,
    now,
  )
  return getDocumentById(db, id)!
}

export function updateDocument(db: Database, id: string, params: UpdateDocumentParams): MarkdownDocument {
  const existing = getDocumentById(db, id)
  if (!existing) throw new Error(`Markdown document not found: ${id}`)

  const now = nowIso()
  const content = params.content ?? existing.content
  const title = params.title ?? existing.title
  const { frontmatter } = parseFrontmatter(content)

  // Auto-snapshot when caller requests it
  if (params.snapshot) {
    const nextVersion = getNextVersionNumber(db, id)
    createVersion(db, {
      document_id: id,
      content: existing.content,
      title: existing.title,
      version_number: nextVersion,
      label: params.snapshot_label ?? null,
    })
    pruneVersions(db, id)
  }

  db.prepare(`
    UPDATE markdown_documents SET
      title       = ?,
      content     = ?,
      frontmatter = ?,
      word_count  = ?,
      tags        = COALESCE(?, tags),
      updated_at  = ?
    WHERE id = ?
  `).run(
    title,
    content,
    JSON.stringify(frontmatter),
    countWords(content),
    params.tags !== undefined ? JSON.stringify(params.tags) : null,
    now,
    id,
  )

  return getDocumentById(db, id)!
}

export function deleteDocument(db: Database, id: string): boolean {
  return db.prepare('DELETE FROM markdown_documents WHERE id = ?').run(id).changes > 0
}

// ── Version history ───────────────────────────────────────────────────────────

const MAX_VERSIONS = 50

function getNextVersionNumber(db: Database, documentId: string): number {
  const row = db
    .prepare('SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM markdown_versions WHERE document_id = ?')
    .get(documentId) as { next: number }
  return row.next
}

function createVersion(
  db: Database,
  params: { document_id: string; content: string; title: string; version_number: number; label: string | null },
): MarkdownVersion {
  const id = randomUUID()
  const now = nowIso()
  db.prepare(`
    INSERT INTO markdown_versions (id, document_id, content, title, version_number, label, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, params.document_id, params.content, params.title, params.version_number, params.label, now)
  return db.prepare('SELECT * FROM markdown_versions WHERE id = ?').get(id) as MarkdownVersion
}

function pruneVersions(db: Database, documentId: string): void {
  const rows = db
    .prepare('SELECT id FROM markdown_versions WHERE document_id = ? ORDER BY version_number DESC')
    .all(documentId) as { id: string }[]
  if (rows.length > MAX_VERSIONS) {
    const toDelete = rows.slice(MAX_VERSIONS).map((r) => r.id)
    const placeholders = toDelete.map(() => '?').join(',')
    db.prepare(`DELETE FROM markdown_versions WHERE id IN (${placeholders})`).run(...toDelete)
  }
}

export function getVersions(db: Database, documentId: string): MarkdownVersion[] {
  return db
    .prepare('SELECT * FROM markdown_versions WHERE document_id = ? ORDER BY version_number DESC')
    .all(documentId) as MarkdownVersion[]
}

export function saveManualSnapshot(db: Database, documentId: string, label?: string): MarkdownVersion {
  const doc = getDocumentById(db, documentId)
  if (!doc) throw new Error(`Markdown document not found: ${documentId}`)
  const nextVersion = getNextVersionNumber(db, documentId)
  const version = createVersion(db, {
    document_id: documentId,
    content: doc.content,
    title: doc.title,
    version_number: nextVersion,
    label: label ?? null,
  })
  pruneVersions(db, documentId)
  return version
}

export function restoreVersion(db: Database, documentId: string, versionId: string): MarkdownDocument {
  const ver = db
    .prepare('SELECT * FROM markdown_versions WHERE id = ? AND document_id = ?')
    .get(versionId, documentId) as MarkdownVersion | undefined
  if (!ver) throw new Error(`Version not found: ${versionId}`)
  return updateDocument(db, documentId, {
    content: ver.content,
    title: ver.title,
    snapshot: true,
    snapshot_label: `Before restore to v${ver.version_number}`,
  })
}

export function deleteVersion(db: Database, versionId: string): boolean {
  return db.prepare('DELETE FROM markdown_versions WHERE id = ?').run(versionId).changes > 0
}
