import { getDatabase } from '../connection'
import { sql as sql001, version as v001, name as n001 } from './001_initial_schema'
import { sql as sql002, version as v002, name as n002 } from './002_fts5_search'
import { sql as sql003, version as v003, name as n003 } from './003_seed_categories'
import { sql as sql004, version as v004, name as n004 } from './004_skill_project_assets'
import { sql as sql005, version as v005, name as n005 } from './005_career_intelligence'
import { sql as sql006, version as v006, name as n006 } from './006_home_lab_interview'
import { sql as sql007, version as v007, name as n007 } from './007_skill_hub'
import { sql as sql008, version as v008, name as n008 } from './008_learning_system'
import { sql as sql009, version as v009, name as n009 } from './009_learning_coach'
import { sql as sql010, version as v010, name as n010 } from './010_workspace_playlists'
import { sql as sql011, version as v011, name as n011 } from './011_knowledge_vault'
import { sql as sql012, version as v012, name as n012 } from './012_pdf_reading_progress'
import { sql as sql013, version as v013, name as n013 } from './013_markdown_workspace'
import { sql as sql014, version as v014, name as n014 } from './014_document_comments'
import { sql as sql015, version as v015, name as n015 } from './015_code_workspace'
import { sql as sql016, version as v016, name as n016 } from './016_search_index'
import { sql as sql017, version as v017, name as n017 } from './017_whiteboard'
import { sql as sql018, version as v018, name as n018 } from './018_knowledge_graph'

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
  { version: v005, name: n005, sql: sql005 },
  { version: v006, name: n006, sql: sql006 },
  { version: v007, name: n007, sql: sql007 },
  { version: v008, name: n008, sql: sql008 },
  { version: v009, name: n009, sql: sql009 },
  { version: v010, name: n010, sql: sql010 },
  { version: v011, name: n011, sql: sql011 },
  { version: v012, name: n012, sql: sql012 },
  { version: v013, name: n013, sql: sql013 },
  { version: v014, name: n014, sql: sql014 },
  { version: v015, name: n015, sql: sql015 },
  { version: v016, name: n016, sql: sql016 },
  { version: v017, name: n017, sql: sql017 },
  { version: v018, name: n018, sql: sql018 },
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
