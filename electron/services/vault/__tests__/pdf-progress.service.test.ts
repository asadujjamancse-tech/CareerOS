/**
 * Tests for pdf-progress.service.ts
 *
 * This file has two sections:
 *
 * 1. Pure-logic tests — test the business-logic helpers extracted from the service.
 *    These run anywhere (no native deps, no DB required).
 *
 * 2. SQLite integration tests — test the actual DB queries.
 *    These require better-sqlite3 to be compiled for the running Node.js version.
 *    When running under vitest (system Node.js) vs the Electron Node.js the native
 *    binary may not load.  The suite detects this at boot and skips DB tests instead
 *    of crashing the entire run.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  computeCompletedFlag,
  computeNewReadingTime,
  computeScrollPercent,
  getPDFProgress,
  upsertPDFProgress,
  deletePDFProgress,
  getRecentlyReadPDFs,
  getReadingStats,
} from '../pdf-progress.service'

// ── 1. Pure business-logic helpers (always run) ───────────────────────────────

describe('computeCompletedFlag', () => {
  it('marks completed when currentPage equals totalPages', () => {
    expect(computeCompletedFlag(100, 100, 0)).toBe(1)
  })

  it('marks completed when currentPage exceeds totalPages', () => {
    expect(computeCompletedFlag(101, 100, 0)).toBe(1)
  })

  it('does not mark completed when page < total', () => {
    expect(computeCompletedFlag(50, 100, 0)).toBe(0)
  })

  it('preserves existing completed flag when pages not at end', () => {
    expect(computeCompletedFlag(50, 100, 1)).toBe(1)
  })

  it('honours explicit override=1 even on page 1', () => {
    expect(computeCompletedFlag(1, 100, 0, 1)).toBe(1)
  })

  it('honours explicit override=0 even when page=totalPages', () => {
    expect(computeCompletedFlag(100, 100, 0, 0)).toBe(0)
  })

  it('treats null totalPages as not completed', () => {
    expect(computeCompletedFlag(50, null, 0)).toBe(0)
  })

  it('treats undefined totalPages as not completed', () => {
    expect(computeCompletedFlag(50, undefined, 0)).toBe(0)
  })
})

describe('computeNewReadingTime', () => {
  it('accumulates delta on top of existing', () => {
    expect(computeNewReadingTime(120, 60)).toBe(180)
  })

  it('handles zero existing time', () => {
    expect(computeNewReadingTime(0, 90)).toBe(90)
  })

  it('handles undefined delta (no session time added)', () => {
    expect(computeNewReadingTime(300, undefined)).toBe(300)
  })

  it('handles zero delta', () => {
    expect(computeNewReadingTime(100, 0)).toBe(100)
  })

  it('handles large values', () => {
    expect(computeNewReadingTime(86400, 3600)).toBe(90000)
  })
})

describe('computeScrollPercent', () => {
  it('returns 0 at top of document', () => {
    expect(computeScrollPercent(0, 1000, 500)).toBe(0)
  })

  it('returns 1 at bottom of document', () => {
    expect(computeScrollPercent(500, 1000, 500)).toBe(1)
  })

  it('returns 0.5 at midpoint', () => {
    expect(computeScrollPercent(250, 1000, 500)).toBeCloseTo(0.5, 5)
  })

  it('clamps to 0 when scrollTop < 0 (defensive)', () => {
    expect(computeScrollPercent(-10, 1000, 500)).toBe(0)
  })

  it('clamps to 1 when scrollTop exceeds max (defensive)', () => {
    expect(computeScrollPercent(600, 1000, 500)).toBe(1)
  })

  it('returns 0 when content fits entirely in viewport (no scrollbar)', () => {
    expect(computeScrollPercent(0, 400, 500)).toBe(0)
  })

  it('returns 0 when scrollHeight equals clientHeight', () => {
    expect(computeScrollPercent(0, 500, 500)).toBe(0)
  })
})

// ── 2. SQLite integration tests (skipped if native module unavailable) ─────────

// Detect whether better-sqlite3 can load under the current Node.js binary.
// The module is compiled for Electron's Node.js; it may fail under system Node.js.
// better-sqlite3 uses `export =` (CJS); the module itself IS the constructor.
type BetterSqlite3Ctor = typeof import('better-sqlite3')
let DatabaseCtor: BetterSqlite3Ctor | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('better-sqlite3') as BetterSqlite3Ctor
  const probe = new mod(':memory:')
  probe.close()
  DatabaseCtor = mod
} catch {
  DatabaseCtor = null
}

const describeDb = DatabaseCtor ? describe : describe.skip

describeDb('SQLite integration — getPDFProgress / upsertPDFProgress / deletePDFProgress', () => {
  const svcDb = { getPDFProgress, upsertPDFProgress, deletePDFProgress, getRecentlyReadPDFs, getReadingStats }
  let db: import('better-sqlite3').Database

  function createDb(): import('better-sqlite3').Database {
    const d = new DatabaseCtor!(':memory:')
    d.exec(`
      CREATE TABLE documents (id TEXT NOT NULL PRIMARY KEY, title TEXT NOT NULL DEFAULT '');
      CREATE TABLE pdf_reading_progress (
        document_id       TEXT    NOT NULL PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
        current_page      INTEGER NOT NULL DEFAULT 1,
        total_pages       INTEGER,
        zoom_level        REAL    NOT NULL DEFAULT 1.25,
        is_dark_mode      INTEGER NOT NULL DEFAULT 0,
        scroll_percent    REAL    NOT NULL DEFAULT 0,
        reading_time_sec  INTEGER NOT NULL DEFAULT 0,
        completed         INTEGER NOT NULL DEFAULT 0,
        last_read_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
    `)
    d.prepare('INSERT INTO documents (id, title) VALUES (?, ?)').run('doc_1', 'Test PDF 1')
    d.prepare('INSERT INTO documents (id, title) VALUES (?, ?)').run('doc_2', 'Test PDF 2')
    d.prepare('INSERT INTO documents (id, title) VALUES (?, ?)').run('doc_3', 'Test PDF 3')
    return d
  }

  beforeEach(() => { db = createDb() })
  afterEach(() => { db.close() })

  it('getPDFProgress returns null for unknown document', () => {
    expect(svcDb.getPDFProgress(db, 'doc_1')).toBeNull()
  })

  it('upsertPDFProgress creates a new row', () => {
    const row = svcDb.upsertPDFProgress(db, 'doc_1', { current_page: 5, total_pages: 100 })
    expect(row.current_page).toBe(5)
    expect(row.total_pages).toBe(100)
    expect(row.zoom_level).toBe(1.25)
    expect(row.completed).toBe(0)
  })

  it('upsertPDFProgress updates existing row', () => {
    svcDb.upsertPDFProgress(db, 'doc_1', { current_page: 1, total_pages: 50 })
    svcDb.upsertPDFProgress(db, 'doc_1', { current_page: 25 })
    expect(svcDb.getPDFProgress(db, 'doc_1')?.current_page).toBe(25)
  })

  it('accumulates reading_time_sec across calls', () => {
    svcDb.upsertPDFProgress(db, 'doc_1', { reading_time_sec_delta: 60 })
    svcDb.upsertPDFProgress(db, 'doc_1', { reading_time_sec_delta: 90 })
    expect(svcDb.getPDFProgress(db, 'doc_1')?.reading_time_sec).toBe(150)
  })

  it('auto-marks completed when currentPage >= totalPages', () => {
    svcDb.upsertPDFProgress(db, 'doc_1', { current_page: 100, total_pages: 100 })
    expect(svcDb.getPDFProgress(db, 'doc_1')?.completed).toBe(1)
  })

  it('deletePDFProgress removes the row and returns true', () => {
    svcDb.upsertPDFProgress(db, 'doc_1', { current_page: 3 })
    expect(svcDb.deletePDFProgress(db, 'doc_1')).toBe(true)
    expect(svcDb.getPDFProgress(db, 'doc_1')).toBeNull()
  })

  it('deletePDFProgress returns false for non-existent row', () => {
    expect(svcDb.deletePDFProgress(db, 'doc_1')).toBe(false)
  })

  it('getRecentlyReadPDFs respects limit', () => {
    svcDb.upsertPDFProgress(db, 'doc_1', { current_page: 1 })
    svcDb.upsertPDFProgress(db, 'doc_2', { current_page: 1 })
    svcDb.upsertPDFProgress(db, 'doc_3', { current_page: 1 })
    expect(svcDb.getRecentlyReadPDFs(db, 2)).toHaveLength(2)
  })

  it('getReadingStats totals reading time', () => {
    svcDb.upsertPDFProgress(db, 'doc_1', { reading_time_sec_delta: 300 })
    svcDb.upsertPDFProgress(db, 'doc_2', { reading_time_sec_delta: 600 })
    const stats = svcDb.getReadingStats(db)
    expect(stats.total_reading_time_sec).toBe(900)
    expect(stats.total_pdfs).toBe(2)
  })
})
