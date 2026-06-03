import { getDatabase } from '../connection'
import { sql as sql001, version as v001, name as n001 } from './001_initial_schema'
import { sql as sql002, version as v002, name as n002 } from './002_fts5_search'
import { sql as sql003, version as v003, name as n003 } from './003_seed_categories'
import { sql as sql004, version as v004, name as n004 } from './004_skill_project_assets'

interface Migration {
  version: string
  name: string
  sql: string
}

const MIGRATIONS: Migration[] = [
  { version: v001, name: n001, sql: sql001 },
  { version: v002, name: n002, sql: sql002 },
  { version: v003, name: n003, sql: sql003 },
  { version: v004, name: n004, sql: sql004 },
]

export function runMigrations(): void {
  const db = getDatabase()

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT NOT NULL PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `)

  const applied = new Set<string>(
    db.prepare('SELECT version FROM schema_migrations').pluck().all() as string[],
  )

  const pending = MIGRATIONS.filter((m) => !applied.has(m.version))

  if (pending.length === 0) return

  for (const migration of pending) {
    db.transaction(() => {
      db.exec(migration.sql)
      db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(
        migration.version,
        migration.name,
      )
    })()
  }
}
