# CareerOS — Architecture

**Version:** 1.0.0
**Status:** Production

---

## Table of Contents

1. [Overview](#1-overview)
2. [Folder Structure](#2-folder-structure)
3. [Feature Modules](#3-feature-modules)
4. [Database Architecture](#4-database-architecture)
5. [Electron Architecture](#5-electron-architecture)
6. [Storage Architecture](#6-storage-architecture)
7. [Search Architecture](#7-search-architecture)
8. [State Management](#8-state-management)

---

## 1. Overview

CareerOS is a **local-first, offline Electron desktop application**. All data is stored on the user's machine — no cloud sync, no remote API calls, no authentication server.

The architecture enforces a hard boundary between the **Electron main process** (privileged Node.js) and the **renderer process** (sandboxed React). The main process owns all I/O: database reads/writes, file system operations, and search. The renderer owns all UI and user interaction. They communicate exclusively through a typed IPC bridge.

### System Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Electron Application                                    │
│                                                         │
│  ┌──────────────────────────────────┐                   │
│  │  Main Process (Node.js)          │                   │
│  │  ├── Window Manager              │                   │
│  │  ├── IPC Router (12 modules)     │◄──────────────┐  │
│  │  ├── Database Service (SQLite)   │               │  │
│  │  ├── File System Service         │               │  │
│  │  └── Search Service (FTS5)       │               │  │
│  └──────────────────────────────────┘               │  │
│           │                                         │  │
│  ┌────────▼──────────────────────┐                  │  │
│  │  Preload (contextBridge)      │                  │  │
│  │  window.api — typed IPC shim  │                  │  │
│  └────────┬──────────────────────┘                  │  │
│           │                                         │  │
│  ┌────────▼──────────────────────┐                  │  │
│  │  Renderer (React, sandboxed)  │                  │  │
│  │  ├── React Router             │                  │  │
│  │  ├── Zustand stores           │──────────────────┘  │
│  │  ├── React Hook Form + Zod    │                      │
│  │  └── Shadcn UI + Tailwind     │                      │
│  └───────────────────────────────┘                      │
│                                                         │
│  ~/CareerOS/careeros.db  (SQLite)                       │
│  ~/CareerOS/attachments/ (uploaded files)               │
└─────────────────────────────────────────────────────────┘
```

### Core Principles

| Principle | Decision |
|---|---|
| **Local-first** | All data stored in SQLite on the user's machine |
| **Privacy-preserving** | No network calls; no telemetry |
| **Process isolation** | Renderer is sandboxed; no direct Node.js access |
| **Typed contracts** | All IPC channels are fully typed end-to-end |
| **Feature isolation** | Each module is self-contained: types, store, components, IPC |
| **Single source of truth** | SQLite is authoritative; Zustand is a read cache |

---

## 2. Folder Structure

```
careeros/
│
├── electron/                          # Main process — Node.js (privileged)
│   ├── main/
│   │   ├── index.ts                   # App entry: bootstraps DB, IPC, window
│   │   └── window.ts                  # BrowserWindow factory & lifecycle
│   │
│   ├── preload/
│   │   └── index.ts                   # contextBridge — exposes window.api
│   │
│   ├── ipc/                           # IPC handlers (main-side)
│   │   ├── index.ts                   # Registers all handlers at startup
│   │   ├── channels.ts                # Channel constants + IpcResult + ok/fail helpers
│   │   ├── app.ipc.ts                 # app:get-version, app:get-paths
│   │   ├── skills.ipc.ts
│   │   ├── occupations.ipc.ts
│   │   ├── projects.ipc.ts
│   │   ├── certifications.ipc.ts
│   │   ├── videos.ipc.ts
│   │   ├── notes.ipc.ts
│   │   ├── documents.ipc.ts
│   │   ├── journal.ipc.ts
│   │   ├── tags.ipc.ts
│   │   ├── search.ipc.ts
│   │   └── storage.ipc.ts
│   │
│   └── services/                      # Main process business logic
│       ├── database/
│       │   ├── connection.ts          # better-sqlite3 singleton (WAL, FK enforcement)
│       │   └── migrations/
│       │       ├── runner.ts          # Migration runner (sequential, versioned)
│       │       ├── 001_initial_schema.ts
│       │       ├── 002_fts5_search.ts
│       │       ├── 003_seed_categories.ts
│       │       └── 004_skill_project_assets.ts
│       ├── skills/
│       ├── occupations/
│       ├── projects/
│       ├── certifications/
│       ├── videos/
│       ├── notes/
│       ├── documents/
│       ├── journal/
│       └── tags/
│
├── src/                               # Renderer process — React (sandboxed)
│   ├── app/
│   │   ├── App.tsx                    # Root component + error boundary
│   │   └── Router.tsx                 # HashRouter (required for file://)
│   │
│   ├── features/                      # Feature-based modules
│   │   ├── skills/
│   │   ├── occupations/
│   │   ├── projects/
│   │   ├── certifications/
│   │   ├── videos/
│   │   ├── notes/
│   │   ├── documents/
│   │   ├── journal/
│   │   └── tags/
│   │
│   └── shared/
│       ├── components/
│       │   ├── ui/                    # Shadcn UI primitives
│       │   ├── layout/                # Shell, Sidebar, Header, PageLayout
│       │   └── common/                # EmptyState, PageLoader, SearchInput, Pagination
│       ├── lib/
│       │   ├── ipc-client.ts          # window.api typed wrapper
│       │   └── utils.ts               # cn(), formatRelativeDate()
│       └── types/
│           ├── entities.ts            # Domain entity interfaces
│           ├── ipc.types.ts           # Full CareerOsApi interface
│           └── common.types.ts        # BaseEntity, IpcResult, PaginatedResult
│
├── docs/
│   ├── architecture/ARCHITECTURE.md   # This document
│   ├── database/DATABASE.md           # Full schema, indexes, FTS5, migrations
│   └── features/                      # Per-module feature documentation
│
├── package.json
├── electron.vite.config.ts
├── tailwind.config.ts
├── components.json                    # Shadcn UI config
├── tsconfig.json
├── tsconfig.node.json
└── tsconfig.web.json
```

### Feature Module Structure

Every feature module follows the same layout:

```
src/features/<module>/
├── components/
│   └── <Module>Page.tsx    # All UI in one file: Page, Card, Form, DeleteDialog
├── schemas/
│   └── <entity>.schema.ts  # Zod schema + form defaults
├── store/
│   └── <entity>.store.ts   # Zustand store with full CRUD + pagination
└── types/
    └── <entity>.types.ts   # Local type interfaces
```

---

## 3. Feature Modules

### Module Inventory

| Module | Key Features | DB Tables |
|---|---|---|
| **Skills** | CRUD, categories, proficiency/status levels, FTS5, tags | `skills`, `skill_categories`, `entity_tags` |
| **Occupations** | Career targets, skill requirements with importance, acquisition tracking | `occupations`, `occupation_skills`, `entity_tags` |
| **Projects** | Portfolio projects, assets (images/docs/links), skill linking, FTS5 | `projects`, `project_assets`, `project_skills`, `entity_tags` |
| **Certifications** | Credentials, expiry tracking, file attachment, skill linking | `certifications`, `certification_skills`, `entity_tags` |
| **Videos** | YouTube/Udemy/local, watch status, progress, skill linking | `videos`, `video_skills`, `entity_tags` |
| **Notes** | Typed notes (meeting/research/idea/etc.), pin support, FTS5 | `notes`, `entity_tags` |
| **Documents** | File import (PDF/DOCX/TXT), type categorisation, open with system app | `documents`, `entity_tags` |
| **Career Journal** | Daily entries, mood/energy tracking, categories, privacy flag | `journal_entries`, `entity_tags` |
| **Tags** | Global cross-entity tags with colour coding | `tags`, `entity_tags` |

### CRUD Lifecycle (all modules)

```
List page (paginated, filtered, searched)
  │
  ├── Create → Sheet form → IPC create → re-fetch
  ├── Edit   → fetch detail → Sheet form → IPC update → re-fetch
  └── Delete → confirm dialog → IPC soft-delete → re-fetch
```

---

## 4. Database Architecture

See [DATABASE.md](../database/DATABASE.md) for the complete schema, index strategy, FTS5 setup, and migration files.

**Summary:**
- **Engine:** SQLite via `better-sqlite3` (synchronous — no async overhead)
- **Location:** `~/CareerOS/careeros.db`
- **Tables:** 17 tables (9 entity, 5 junction, 2 FTS shadow, 1 migration tracking)
- **FTS5:** 8 virtual tables with trigger-based sync for instant full-text search
- **Soft deletes:** `deleted_at TEXT` column on all entity tables
- **IDs:** `nanoid()` 21-character random IDs (collision-resistant, export-safe)
- **Pragmas:** WAL mode, foreign keys ON, 32 MB cache, NORMAL synchronous

---

## 5. Electron Architecture

### Process Model

```
Main Process (Node.js)
└── electron/main/index.ts
    ├── runMigrations()         Run pending DB migrations
    ├── registerIpcHandlers()   Register all 12 IPC handler groups
    └── createMainWindow()      Create BrowserWindow

Preload Script
└── electron/preload/index.ts
    └── contextBridge.exposeInMainWorld('api', { ... })
        All API methods return Promise<IpcResult<T>>

Renderer Process (React)
└── src/app/App.tsx
    └── window.api              Accessed via src/shared/lib/ipc-client.ts
```

### IPC Channel Pattern

All channels follow `module:action`:

```
skills:get-all          skills:get-by-id        skills:create
skills:update           skills:delete

occupations:get-all     occupations:get-by-id   occupations:create
occupations:update      occupations:delete
occupations:skills:get  occupations:skills:set  occupations:skills:update
occupations:skills:remove

projects:get-all        projects:get-by-id      projects:create
projects:update         projects:delete
project-assets:get-all  project-assets:create   project-assets:update
project-assets:delete   project-assets:reorder

certifications:get-all  certifications:get-by-id certifications:create
certifications:update   certifications:delete

videos:get-all          videos:get-by-id        videos:create
videos:update           videos:delete           videos:update-progress

notes:get-all           notes:get-by-id         notes:create
notes:update            notes:delete

documents:get-all       documents:get-by-id     documents:create
documents:update        documents:delete        documents:open

journal:get-all         journal:get-by-id       journal:create
journal:update          journal:delete

tags:get-all            tags:create             tags:update
tags:delete             tags:get-entity-tags    tags:set-entity-tags

search:global           search:module

storage:import-file     storage:open-file       storage:show-in-folder
app:get-version         app:get-paths
```

### IPC Response Envelope

Every handler returns a consistent result shape:

```typescript
type IpcResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string; code?: string }
```

### Security Model

| Layer | Mechanism |
|---|---|
| Renderer isolation | `contextIsolation: true`, `nodeIntegration: false` |
| Preload boundary | Only typed methods exposed via `contextBridge` |
| File access | Only `~/CareerOS/attachments/` written to |

---

## 6. Storage Architecture

### Directory Layout

```
~/CareerOS/
├── careeros.db                  # Primary SQLite database
└── attachments/
    ├── certifications/          # Certification PDFs / images
    ├── documents/               # Imported documents
    └── videos/                  # Local video files (future)
```

### File Import Flow

```
User clicks "Browse File"
  → storage:import-file IPC call
  → showOpenDialog (native file picker)
  → Copy selected file to ~/CareerOS/attachments/<category>/
  → Rename: {timestamp}_{original-name}.{ext}
  → Return: { path, originalName, size, mimeType }
  → Renderer stores absolute path in DB record
```

---

## 7. Search Architecture

### Technology: SQLite FTS5

Each content-bearing module has a corresponding FTS5 virtual table that indexes its searchable text columns. FTS tables use `content=` pointing to the source table, and three triggers (AFTER INSERT / DELETE / UPDATE) keep the index in sync.

| Module | FTS Table | Indexed Columns |
|---|---|---|
| Skills | `skills_fts` | name, description, notes |
| Occupations | `occupations_fts` | title, description, industry, notes |
| Projects | `projects_fts` | title, summary, description |
| Certifications | `certifications_fts` | name, issuer, description, notes |
| Videos | `videos_fts` | title, description, channel, notes |
| Notes | `notes_fts` | title, content |
| Documents | `documents_fts` | title, description, notes |
| Journal | `journal_entries_fts` | title, content |

### Query Processing

```typescript
// Input: "react hooks"
// Transformed to FTS5 prefix query:
"react"* "hooks"*
// Matches: "react", "react-hooks", "hooks", "hookstate", etc.
```

Results are ranked by BM25 relevance and paginated.

---

## 8. State Management

### Technology: Zustand

One isolated store per feature module. No cross-store communication — all data fetching goes through the IPC bridge.

### Standard Store Shape

Every feature store implements:

```typescript
interface FeatureStore {
  // List state
  items: T[]
  total: number; page: number; pageSize: number; totalPages: number
  isLoading: boolean; listError: string | null
  filters: FilterState

  // Detail state (for edit form pre-population)
  detail: TDetail | null; isLoadingDetail: boolean

  // Form state
  isFormOpen: boolean; editingId: string | null
  isSubmitting: boolean; formError: string | null

  // Delete state
  deletingId: string | null; isDeleting: boolean

  // Actions
  fetch(): Promise<void>
  setPage(p: number): void
  setSearch(s: string): void
  setFilterField(k, v): void
  clearFilters(): void
  openCreate(): void
  openEdit(id: string): void
  closeForm(): void
  submit(values: FormValues): Promise<boolean>
  confirmDelete(id: string): void
  cancelDelete(): void
  executeDelete(): Promise<boolean>
}
```

### Data Flow

```
Component calls store.openCreate()
  → store sets isFormOpen = true
  → Form component renders (Sheet)
  → User fills form, clicks submit
  → store.submit(values) called
  → IPC call: api.module.create(payload)
  → Main process validates, inserts to SQLite
  → Returns IpcResult<T>
  → Store updates isFormOpen = false, calls fetch()
  → List re-renders with new data
```

Zustand stores are **not persisted**. They are in-memory read caches over SQLite. On navigation, data is fetched fresh. SQLite is the single source of truth.
