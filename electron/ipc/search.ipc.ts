import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'

export interface SearchHit {
  entity_type: string
  entity_id: string
  title: string
  excerpt: string
  rank: number
}

function buildFtsQuery(q: string): string {
  return q.trim().split(/\s+/).filter(Boolean).map(w => `"${w.replace(/"/g, '')}"*`).join(' ')
}

export function registerSearchHandlers(): void {
  ipcMain.handle(IPC.SEARCH.GLOBAL, (_e, query: string) => {
    try {
      if (!query?.trim()) return ok([])
      const db = getDatabase()
      const fts = buildFtsQuery(query)
      const limit = 50
      const results: SearchHit[] = []

      const searches: Array<{ table: string; ftsTable: string; type: string; titleCol: string; excerptCol: string }> = [
        { table: 'skills',          ftsTable: 'skills_fts',          type: 'skill',         titleCol: 'name',    excerptCol: 'description' },
        { table: 'occupations',     ftsTable: 'occupations_fts',     type: 'occupation',    titleCol: 'title',   excerptCol: 'description' },
        { table: 'projects',        ftsTable: 'projects_fts',        type: 'project',       titleCol: 'title',   excerptCol: 'summary' },
        { table: 'certifications',  ftsTable: 'certifications_fts',  type: 'certification', titleCol: 'name',    excerptCol: 'description' },
        { table: 'videos',          ftsTable: 'videos_fts',          type: 'video',         titleCol: 'title',   excerptCol: 'description' },
        { table: 'notes',           ftsTable: 'notes_fts',           type: 'note',          titleCol: 'title',   excerptCol: 'content' },
        { table: 'documents',       ftsTable: 'documents_fts',       type: 'document',      titleCol: 'title',   excerptCol: 'description' },
        { table: 'journal_entries', ftsTable: 'journal_entries_fts', type: 'journal_entry', titleCol: 'title',   excerptCol: 'content' },
      ]

      for (const s of searches) {
        try {
          const rows = db.prepare(`
            SELECT t.id, t.${s.titleCol} AS title,
              COALESCE(SUBSTR(t.${s.excerptCol}, 1, 120), '') AS excerpt,
              rank
            FROM ${s.ftsTable} f
            JOIN ${s.table} t ON t.rowid = f.rowid
            WHERE f MATCH ? AND t.deleted_at IS NULL
            ORDER BY rank
            LIMIT ?
          `).all(fts, limit) as Array<{ id: string; title: string; excerpt: string; rank: number }>
          for (const row of rows) {
            results.push({ entity_type: s.type, entity_id: row.id, title: row.title, excerpt: row.excerpt ?? '', rank: row.rank })
          }
        } catch {
          // Skip tables that error (e.g. no rows, FTS not rebuilt)
        }
      }

      results.sort((a, b) => a.rank - b.rank)
      return ok(results.slice(0, limit))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Search failed')
    }
  })

  ipcMain.handle(IPC.SEARCH.MODULE, (_e, module: string, query: string) => {
    try {
      if (!query?.trim()) return ok([])
      const db = getDatabase()
      const fts = buildFtsQuery(query)
      // Map module → fts config
      const configs: Record<string, { table: string; ftsTable: string; titleCol: string; excerptCol: string }> = {
        skill: { table: 'skills', ftsTable: 'skills_fts', titleCol: 'name', excerptCol: 'description' },
        occupation: { table: 'occupations', ftsTable: 'occupations_fts', titleCol: 'title', excerptCol: 'description' },
        project: { table: 'projects', ftsTable: 'projects_fts', titleCol: 'title', excerptCol: 'summary' },
        certification: { table: 'certifications', ftsTable: 'certifications_fts', titleCol: 'name', excerptCol: 'description' },
        video: { table: 'videos', ftsTable: 'videos_fts', titleCol: 'title', excerptCol: 'description' },
        note: { table: 'notes', ftsTable: 'notes_fts', titleCol: 'title', excerptCol: 'content' },
        document: { table: 'documents', ftsTable: 'documents_fts', titleCol: 'title', excerptCol: 'description' },
        journal_entry: { table: 'journal_entries', ftsTable: 'journal_entries_fts', titleCol: 'title', excerptCol: 'content' },
      }
      const cfg = configs[module]
      if (!cfg) return fail(`Unknown module: ${module}`)
      const rows = db.prepare(`
        SELECT t.id, t.${cfg.titleCol} AS title,
          COALESCE(SUBSTR(t.${cfg.excerptCol}, 1, 120), '') AS excerpt, rank
        FROM ${cfg.ftsTable} f
        JOIN ${cfg.table} t ON t.rowid = f.rowid
        WHERE f MATCH ? AND t.deleted_at IS NULL
        ORDER BY rank LIMIT 50
      `).all(fts) as Array<{ id: string; title: string; excerpt: string; rank: number }>
      return ok(rows.map(r => ({ entity_type: module, entity_id: r.id, title: r.title, excerpt: r.excerpt ?? '', rank: r.rank })))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Module search failed')
    }
  })
}
