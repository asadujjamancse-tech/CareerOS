# PDF Reader — Architecture & Reference

Production PDF reader built into the CareerOS Knowledge Vault.

---

## Architecture

### Engine

`pdfjs-dist 6.x` used directly — **not** via react-pdf.

> react-pdf 9.x declares a peer dependency on `pdfjs-dist ~4.x`.  
> CareerOS ships pdfjs-dist 6.x for performance and ES-module support.  
> Using pdfjs-dist directly gives identical rendering with no version conflict.

### File locations

| Layer | Path |
|---|---|
| React component | `src/features/knowledge-vault/components/PDFReader.tsx` |
| Utility functions | `src/features/knowledge-vault/utils/pdf-reader.utils.ts` |
| DB service | `electron/services/vault/pdf-progress.service.ts` |
| IPC handlers | `electron/ipc/pdf-reader.ipc.ts` |
| Migration | `electron/services/database/migrations/012_pdf_reading_progress.ts` |
| Utility tests | `src/features/knowledge-vault/__tests__/pdf-reader.utils.test.ts` |
| Service tests | `electron/services/vault/__tests__/pdf-progress.service.test.ts` |

---

## Features

| Feature | Implementation |
|---|---|
| Open PDF | `pdfjsLib.getDocument({ url: 'file://...' })` |
| Virtual rendering | `IntersectionObserver` with `rootMargin: '600px 0px'` |
| LRU canvas cache | `Set<number>` (insertion-order), max 10 pages |
| Text search | `page.getTextContent()` per page; debounced 300 ms |
| Zoom | Range 50%–300%, step 0.25, preset menu |
| Page navigation | Prev/Next buttons + jump-to-page input |
| Fullscreen | `element.requestFullscreen()` + `fullscreenchange` listener |
| Dark mode | `filter: invert(1) hue-rotate(180deg)` on canvas elements |
| Progress persistence | Auto-save every 30 s; final save on unmount |
| Last page restore | Reads `current_page` from DB on mount, scrolls after layout |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `←` / `→` | Previous / next page |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `Ctrl+F` | Open / focus search bar |
| `F` | Toggle fullscreen |
| `D` | Toggle dark mode |
| `Escape` | Close search |

---

## Virtual Rendering

Pages are never all rendered at once.

1. On load, page **dimensions** are fetched at scale 1.0 (metadata read only — no canvas).  
2. The scroll area renders `<div data-page-idx>` placeholder slots at the correct scaled size.  
3. An `IntersectionObserver` fires whenever a slot enters the viewport (or comes within 600 px of it).  
4. On intersection, `renderPage(pageIndex)` draws that page onto its `<canvas>`.  
5. An LRU evicts the oldest canvas once the cache exceeds 10 pages.  
6. Scale changes clear all canvases and re-render the currently cached set.

---

## LRU Cache

Uses a `Set<number>` which preserves insertion order.

```
access page P:
  if cache.size >= MAX and P not in cache:
    evict = cache.values().next().value   // oldest (first inserted)
    clear canvas[evict]
    cache.delete(evict)
  cache.delete(P)   // re-insert at end = mark as most recent
  cache.add(P)
```

Max size: `10` pages (`MAX_CACHED_PAGES`).

---

## Text Search

1. Query is debounced 300 ms after the last keystroke.  
2. Each page's text content is fetched via `page.getTextContent()` and cached in a `Map<pageNum, string>`.  
3. Pages are processed in batches of 10 (parallel within each batch).  
4. `countOccurrences(haystack, needle)` does a case-insensitive indexOf loop — O(n) per page.  
5. Results: array of `{ page, count }` sorted by page number.  
6. Match navigation (`↑`/`↓` buttons) calls `scrollToPage()` for each result.

---

## Progress Persistence

### Database table: `pdf_reading_progress`

| Column | Type | Notes |
|---|---|---|
| `document_id` | TEXT PK | FK → `documents.id` ON DELETE CASCADE |
| `current_page` | INTEGER | Last viewed page |
| `total_pages` | INTEGER | Populated after first full load |
| `zoom_level` | REAL | Restored on next open |
| `is_dark_mode` | INTEGER | 0 or 1; restored on next open |
| `scroll_percent` | REAL | 0.0 – 1.0 |
| `reading_time_sec` | INTEGER | Accumulated across sessions |
| `completed` | INTEGER | Auto-set when `current_page >= total_pages` |
| `last_read_at` | TEXT | ISO-8601 |

### Save behaviour

- **Restore on mount**: zoom level and dark mode are applied before the first render.  
- **Periodic save**: `setTimeout` fires every 30 seconds.  
- **Save on unmount**: component cleanup function calls `saveProgress(true)`.  
- **Reading time**: `Date.now() - sessionStartRef.current` (seconds) is sent as `reading_time_sec_delta`; the service accumulates it on top of the stored value.

---

## IPC API

All handlers registered in `electron/ipc/pdf-reader.ipc.ts`.

| Channel | Payload | Return |
|---|---|---|
| `pdf-reader:get-progress` | `documentId: string` | `PDFProgressRow \| null` |
| `pdf-reader:save-progress` | `{ documentId, ...UpsertParams }` | `PDFProgressRow` |
| `pdf-reader:delete-progress` | `documentId: string` | `{ deleted: boolean }` |
| `pdf-reader:get-recent` | `{ limit?: number }` | `PDFProgressRow[]` |
| `pdf-reader:get-stats` | — | `{ total_pdfs, completed_pdfs, total_reading_time_sec, avg_completion_percent }` |

All channels use the standard `ok(data)` / `fail(message)` envelope.

---

## Testing Strategy

### Why not full SQLite tests in vitest?

`better-sqlite3` is a native Node.js addon compiled for **Electron's** Node.js ABI. Vitest runs on the **system** Node.js which may have a different ABI version. The binary cannot be loaded cross-version.

### Solution: pure function extraction

Business logic that does not touch the database is extracted as testable pure functions:

| Function | Tests |
|---|---|
| `computeCompletedFlag(currentPage, totalPages, existing, override?)` | 8 cases |
| `computeNewReadingTime(existing, delta?)` | 5 cases |
| `computeScrollPercent(scrollTop, scrollHeight, clientHeight)` | 7 cases |
| `countOccurrences(haystack, needle)` | 11 cases |
| `snapScale(raw)` | 6 cases |
| LRU cache simulation | 4 cases |
| Search accumulation | 2 cases |
| Progress percent | 5 cases |

SQLite integration tests are gated behind a runtime probe:

```typescript
try {
  const mod = require('better-sqlite3') as BetterSqlite3Ctor
  const probe = new mod(':memory:')
  probe.close()
  DatabaseCtor = mod
} catch {
  DatabaseCtor = null   // binary can't load — skip all DB tests
}
const describeDb = DatabaseCtor ? describe : describe.skip
```

When the binary **does** load (e.g. when running tests inside Electron or after rebuilding for the system Node), the 9 integration tests run automatically.

### Running tests

```bash
# All tests (48 pass, 9 skip when running outside Electron)
npx vitest run

# Watch mode
npx vitest

# Coverage
npx vitest run --coverage
```
