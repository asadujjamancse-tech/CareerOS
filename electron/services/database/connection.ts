import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

function getDataDirectory(): string {
  const dataDir = path.join(app.getPath('home'), 'CareerOS')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  return dataDir
}

export function getDatabasePath(): string {
  return path.join(getDataDirectory(), 'careeros.db')
}

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = getDatabasePath()
    db = new Database(dbPath)

    // Performance and correctness pragmas
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.pragma('busy_timeout = 5000')
    db.pragma('synchronous = NORMAL')
    db.pragma('cache_size = -32000') // 32 MB
    db.pragma('temp_store = MEMORY')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
