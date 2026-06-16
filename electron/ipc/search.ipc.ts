import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'

export interface SearchHit {
  entity_type: string
  entity_id: string
  title: string
  excerpt: string
  subtitle: string
  rank: number
}

export interface SearchHistoryItem {
  id: number
  query: string
  result_count: number
  searched_at: string
}

/** Wrap each word as a quoted prefix term for FTS5: "word"* */
function buildFtsQuery(q: string): string {
  return q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `"${w.replace(/"/g, '')}"*`)
    .join(' ')
}

interface SearchTable {
  table: string
  ftsTable: string
  type: string
  titleCol: string
  excerptCol: string
  subtitleSql: string
}

const SEARCH_TABLES: SearchTable[] = [
  {
    table: 'skills',
    ftsTable: 'skills_fts',
    type: 'skill',
    titleCol: 'name',
    excerptCol: 'description',
    subtitleSql: `COALESCE((SELECT name FROM skill_categories WHERE id = t.category_id), '') AS subtitle`,
  },
  {
    table: 'projects',
    ftsTable: 'projects_fts',
    type: 'project',
    titleCol: 'title',
    excerptCol: 'summary',
    subtitleSql: `COALESCE(t.type, '') AS subtitle`,
  },
  {
    table: 'certifications',
    ftsTable: 'certifications_fts',
    type: 'certification',
    titleCol: 'name',
    excerptCol: 'description',
    subtitleSql: `COALESCE(t.issuer, '') AS subtitle`,
  },
  {
    table: 'notes',
    ftsTable: 'notes_fts',
    type: 'note',
    titleCol: 'title',
    excerptCol: 'content',
    subtitleSql: `'' AS subtitle`,
  },
  {
    table: 'documents',
    ftsTable: 'documents_fts',
    type: 'document',
    titleCol: 'title',
    excerptCol: 'description',
    subtitleSql: `COALESCE(t.type, '') AS subtitle`,
  },
  {
    table: 'home_labs',
    ftsTable: 'home_labs_fts',
    type: 'home_lab',
    titleCol: 'title',
    excerptCol: 'description',
    subtitleSql: `COALESCE(t.status, '') AS subtitle`,
  },
  {
    table: 'interview_questions',
    ftsTable: 'interview_questions_fts',
    type: 'interview_question',
    titleCol: 'question',
    excerptCol: 'ideal_answer',
    subtitleSql: `COALESCE((SELECT name FROM interview_categories WHERE id = t.category_id), '') AS subtitle`,
  },
]

export function registerSearchHandlers(): void {
  const db = () => getDatabase()

  ipcMain.handle(IPC.SEARCH.GLOBAL, (_e, query: string) => {
    try {
      if (!query?.trim()) return ok([])
      const database = db()
      const fts = buildFtsQuery(query)
      const perTable = 25
      const results: SearchHit[] = []

      for (const s of SEARCH_TABLES) {
        try {
          const rows = database
            .prepare(
              `SELECT t.id,
                      t.${s.titleCol} AS title,
                      COALESCE(SUBSTR(t.${s.excerptCol}, 1, 160), '') AS excerpt,
                      ${s.subtitleSql},
                      f.rank
               FROM ${s.ftsTable} f
               JOIN ${s.table} t ON t.rowid = f.rowid
               WHERE f MATCH ? AND t.deleted_at IS NULL
               ORDER BY f.rank
               LIMIT ?`,
            )
            .all(fts, perTable) as Array<{
              id: string
              title: string
              excerpt: string
              subtitle: string
              rank: number
            }>

          for (const row of rows) {
            results.push({
              entity_type: s.type,
              entity_id: row.id,
              title: row.title ?? '',
              excerpt: row.excerpt ?? '',
              subtitle: row.subtitle ?? '',
              rank: row.rank,
            })
          }
        } catch {
          // FTS table may not be populated yet — skip silently
        }
      }

      // Sort all hits by BM25 rank (lower = better in SQLite FTS5)
      results.sort((a, b) => a.rank - b.rank)
      const limited = results.slice(0, 100)

      // Upsert into search history (deduplicated by UNIQUE(query))
      try {
        database
          .prepare(
            `INSERT INTO search_history (query, result_count)
             VALUES (?, ?)
             ON CONFLICT(query) DO UPDATE SET
               result_count = excluded.result_count,
               searched_at  = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
          )
          .run(query.trim(), limited.length)
      } catch {
        // History table may not exist in older DBs — don't fail the search
      }

      return ok(limited)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Search failed')
    }
  })

  ipcMain.handle(IPC.SEARCH.MODULE, (_e, module: string, query: string) => {
    try {
      if (!query?.trim()) return ok([])
      const database = db()
      const fts = buildFtsQuery(query)
      const s = SEARCH_TABLES.find((t) => t.type === module)
      if (!s) return fail(`Unknown search module: ${module}`)

      const rows = database
        .prepare(
          `SELECT t.id,
                  t.${s.titleCol} AS title,
                  COALESCE(SUBSTR(t.${s.excerptCol}, 1, 160), '') AS excerpt,
                  ${s.subtitleSql},
                  f.rank
           FROM ${s.ftsTable} f
           JOIN ${s.table} t ON t.rowid = f.rowid
           WHERE f MATCH ? AND t.deleted_at IS NULL
           ORDER BY f.rank
           LIMIT 50`,
        )
        .all(fts) as Array<{
          id: string
          title: string
          excerpt: string
          subtitle: string
          rank: number
        }>

      return ok(
        rows.map((r) => ({
          entity_type: module,
          entity_id: r.id,
          title: r.title ?? '',
          excerpt: r.excerpt ?? '',
          subtitle: r.subtitle ?? '',
          rank: r.rank,
        })),
      )
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Module search failed')
    }
  })

  ipcMain.handle(IPC.SEARCH.HISTORY.GET, (_e, limit = 20) => {
    try {
      const rows = db()
        .prepare(
          `SELECT id, query, result_count, searched_at
           FROM search_history
           ORDER BY searched_at DESC
           LIMIT ?`,
        )
        .all(limit) as SearchHistoryItem[]
      return ok(rows)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to get search history')
    }
  })

  ipcMain.handle(IPC.SEARCH.HISTORY.CLEAR, () => {
    try {
      db().prepare('DELETE FROM search_history').run()
      return ok(null)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to clear search history')
    }
  })
}
