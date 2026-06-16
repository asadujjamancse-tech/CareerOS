# CareerOS Developer Guide

## Prerequisites

| Tool | Required Version | Notes |
|---|---|---|
| Node.js | 20.x or 22.x LTS | Required for Electron 41 |
| npm | 10.x (bundled with Node) | Used for package management |
| Git | Any recent version | |
| macOS / Linux / Windows | — | macOS recommended for development |

> **Note for macOS users:** If you encounter `ELECTRON_RUN_AS_NODE` errors on macOS 16+, see the startup fix documented in project memory. The `dev` script clears this variable: `"dev": "ELECTRON_RUN_AS_NODE= electron-vite dev"`.

---

## Clone and Install

```bash
git clone https://github.com/asadujjamancse-tech/careeros.git
cd careeros
npm install
npm run rebuild   # Rebuilds better-sqlite3 native bindings for your Electron version
```

The `postinstall` script runs `electron-builder install-app-deps` automatically.

---

## Development

```bash
npm run dev          # Start Electron app in development mode with hot-reload
```

This runs `electron-vite dev` which starts:
- Main process (Electron) with watch mode
- Preload script with watch mode
- Renderer (React/Vite) dev server with HMR

---

## Build and Package

```bash
npm run build              # Compile all three targets (main, preload, renderer)
npm run package            # Package as unpacked app in dist/
npm run package:mac        # Build .dmg for macOS (arm64 + x64)
npm run package:win        # Build .exe NSIS installer for Windows x64
npm run package:linux      # Build .AppImage for Linux x64
```

---

## Type Checking and Linting

```bash
npm run typecheck          # Run both node and web typechecks
npm run typecheck:node     # Check electron/ code against tsconfig.node.json
npm run typecheck:web      # Check src/ code against tsconfig.web.json
npm run lint               # ESLint with zero warnings allowed
```

---

## Annotated Folder Structure

```
careeros/
├── electron/                    # Electron-side code (Node.js runtime)
│   ├── main/
│   │   ├── index.ts             # Electron app entry: app lifecycle, window creation, IPC registration
│   │   └── window.ts            # BrowserWindow factory (frame, size, webPreferences)
│   ├── preload/
│   │   └── index.ts             # contextBridge API — the ONLY bridge between renderer and main
│   ├── ipc/
│   │   ├── channels.ts          # ALL IPC channel name constants + ok()/fail() helpers
│   │   ├── index.ts             # Registers all IPC handlers in one call
│   │   ├── registry.ts          # (Optional) handler registry utilities
│   │   ├── app.ipc.ts           # App version and paths handlers
│   │   ├── skills.ipc.ts        # Skills module IPC handlers
│   │   ├── [module].ipc.ts      # One IPC handler file per module
│   │   └── search.ipc.ts        # Global and module FTS5 search (service-in-handler pattern)
│   └── services/
│       ├── database/
│       │   ├── connection.ts    # SQLite connection singleton (better-sqlite3)
│       │   └── migrations/
│       │       ├── runner.ts    # Applies pending migrations in order
│       │       ├── 001_initial_schema.ts
│       │       ├── 002_fts5_search.ts
│       │       └── ... (018 total)
│       ├── career-intelligence/ # career-intelligence.service.ts
│       ├── challenges/          # challenges.service.ts
│       ├── code-workspace/      # code-workspace.service.ts
│       ├── knowledge-graph/     # knowledge-graph.service.ts
│       ├── markdown/            # markdown.service.ts
│       ├── occupations/         # occupations.service.ts
│       ├── playlists/           # playlists.service.ts
│       ├── scenarios/           # scenarios.service.ts
│       ├── skills/              # skills.service.ts
│       ├── tags/                # tags.service.ts
│       ├── whiteboard/          # whiteboard.service.ts
│       ├── workspace/           # workspace.service.ts
│       └── [module]/            # One directory per module
├── src/                         # React renderer code (browser runtime)
│   ├── app/
│   │   ├── App.tsx              # RouterProvider root
│   │   └── Router.tsx           # createHashRouter with all routes; each wrapped in ErrorBoundary
│   ├── shared/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Shell.tsx    # Root layout: TitleBar + Sidebar + <Outlet>
│   │   │   │   ├── Sidebar.tsx  # Navigation sidebar with all module links
│   │   │   │   ├── Header.tsx   # Per-page header slot
│   │   │   │   ├── PageLayout.tsx # Standard page padding wrapper
│   │   │   │   └── TitleBar.tsx # Custom electron title bar (draggable)
│   │   │   ├── common/
│   │   │   │   └── ErrorBoundary.tsx  # Catches render errors per route
│   │   │   └── ui/              # shadcn/ui components (Button, Dialog, Select, etc.)
│   │   ├── lib/
│   │   │   ├── ipc-client.ts    # api object — type-safe wrapper; switches between
│   │   │   │                    #   window.api (Electron) and nullApi (browser)
│   │   │   ├── platform.ts      # isElectron() detection
│   │   │   └── utils.ts         # cn() class merging utility (clsx + tailwind-merge)
│   │   └── types/
│   │       ├── ipc.types.ts     # All request/response types for every IPC channel
│   │       ├── entities.ts      # Shared domain entity types
│   │       └── common.types.ts  # IpcResult<T>, PaginatedResult<T>
│   └── features/
│       └── [module]/            # One directory per module
│           ├── components/      # React pages and components
│           ├── store/           # Zustand store
│           ├── types/           # Module-specific types
│           └── schemas/         # Zod validation schemas (where present)
├── docs/                        # All project documentation
├── resources/                   # App icons, build resources
├── index.html                   # Electron renderer HTML entry point
├── electron.vite.config.ts      # electron-vite build config (main/preload/renderer)
├── tsconfig.json                # Base TS config (paths)
├── tsconfig.node.json           # Electron-side config (strict mode)
├── tsconfig.web.json            # React-side config (strict mode)
├── tailwind.config.js           # Tailwind CSS configuration
└── package.json                 # Scripts, dependencies, electron-builder config
```

---

## How to Add a New Module

Follow these 13 steps in order. Use `[name]` as the module name placeholder (e.g., `habits`).

### Step 1 — Create the Database Migration

Create `electron/services/database/migrations/019_[name].ts`:

```typescript
export const version = '019_[name]'
export const name = '019_[name].sql'

export const sql = `
CREATE TABLE IF NOT EXISTS [name]_entries (
  id         TEXT NOT NULL PRIMARY KEY,
  title      TEXT NOT NULL,
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`
```

> Migration versions must be unique strings. The convention is `NNN_descriptive_name`. Never modify an already-applied migration — create a new one instead.

### Step 2 — Register in Migrations Runner

Edit `electron/services/database/migrations/runner.ts`:

```typescript
import { sql as sql019, version as v019, name as n019 } from './019_[name]'

const MIGRATIONS: Migration[] = [
  // ... existing entries ...
  { version: v019, name: n019, sql: sql019 },
]
```

### Step 3 — Create the Service

Create `electron/services/[name]/[name].service.ts`:

```typescript
import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export interface [Name]Row { id: string; title: string; /* ... */ }

export function getAll(db: Database): [Name]Row[] {
  return db.prepare('SELECT * FROM [name]_entries ORDER BY created_at DESC').all() as [Name]Row[]
}

export function create(db: Database, params: { title: string }): [Name]Row {
  const id = nanoid()
  db.prepare('INSERT INTO [name]_entries (id, title) VALUES (?, ?)').run(id, params.title)
  return db.prepare('SELECT * FROM [name]_entries WHERE id = ?').get(id) as [Name]Row
}
// ... update, delete
```

### Step 4 — Add IPC Channels to channels.ts

Edit `electron/ipc/channels.ts`:

```typescript
export const IPC = {
  // ... existing channels ...
  [NAME]: {
    GET_ALL: '[name]:get-all',
    GET_BY_ID: '[name]:get-by-id',
    CREATE: '[name]:create',
    UPDATE: '[name]:update',
    DELETE: '[name]:delete',
  },
} as const
```

### Step 5 — Create the IPC Handler

Create `electron/ipc/[name].ipc.ts`:

```typescript
import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import * as [Name]Service from '../services/[name]/[name].service'

export function register[Name]Handlers(): void {
  ipcMain.handle(IPC.[NAME].GET_ALL, () => {
    try {
      return ok([Name]Service.getAll(getDatabase()))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Unknown error')
    }
  })

  ipcMain.handle(IPC.[NAME].CREATE, (_e, params) => {
    try {
      return ok([Name]Service.create(getDatabase(), params))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Unknown error')
    }
  })
  // ... other handlers
}
```

### Step 6 — Register the Handler in index.ts

Edit `electron/ipc/index.ts`:

```typescript
import { register[Name]Handlers } from './[name].ipc'

export function registerIpcHandlers(): void {
  // ... existing registrations ...
  register[Name]Handlers()
}
```

### Step 7 — Update the Preload Bridge

Edit `electron/preload/index.ts` — add to the `api` object inside `contextBridge.exposeInMainWorld`:

```typescript
[name]: {
  getAll:  () => invoke(IPC.[NAME].GET_ALL),
  getById: (id: string) => invoke(IPC.[NAME].GET_BY_ID, id),
  create:  (data: unknown) => invoke(IPC.[NAME].CREATE, data),
  update:  (id: string, data: unknown) => invoke(IPC.[NAME].UPDATE, id, data),
  delete:  (id: string) => invoke(IPC.[NAME].DELETE, id),
},
```

### Step 8 — Add Types to ipc.types.ts

Edit `src/shared/types/ipc.types.ts` — define request/response types and add to `CareerOsApi`:

```typescript
export interface [Name]Item { id: string; title: string; /* ... */ }
export interface Create[Name]Input { title: string; }

// Add to CareerOsApi interface:
[name]: {
  getAll: () => Promise<IpcResult<[Name]Item[]>>
  getById: (id: string) => Promise<IpcResult<[Name]Item>>
  create: (data: Create[Name]Input) => Promise<IpcResult<[Name]Item>>
  update: (id: string, data: Partial<Create[Name]Input>) => Promise<IpcResult<[Name]Item>>
  delete: (id: string) => Promise<IpcResult<boolean>>
}
```

### Step 9 — Add Browser Fallback to ipc-client.ts

Edit `src/shared/lib/ipc-client.ts` — add to `nullApi`:

```typescript
[name]: {
  getAll:  () => Promise.resolve(ok([])),
  getById: () => browserOnly(),
  create:  () => browserOnly(),
  update:  () => browserOnly(),
  delete:  () => browserOnly(),
},
```

### Step 10 — Create the Zustand Store

Create `src/features/[name]/store/[name].store.ts`:

```typescript
import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { [Name]Item, Create[Name]Input } from '@shared/types/ipc.types'

interface [Name]State {
  items: [Name]Item[]
  isLoading: boolean
  isFormOpen: boolean
  editingId: string | null

  fetchItems: () => Promise<void>
  createItem: (data: Create[Name]Input) => Promise<boolean>
  updateItem: (id: string, data: Partial<Create[Name]Input>) => Promise<boolean>
  deleteItem: (id: string) => Promise<boolean>
  openCreate: () => void
  openEdit: (id: string) => void
  closeForm: () => void
}

export const use[Name]Store = create<[Name]State>((set, get) => ({
  items: [],
  isLoading: false,
  isFormOpen: false,
  editingId: null,

  async fetchItems() {
    set({ isLoading: true })
    const result = await api.[name].getAll()
    if (result.success) set({ items: result.data })
    set({ isLoading: false })
  },

  async createItem(data) {
    const result = await api.[name].create(data)
    if (result.success) { void get().fetchItems(); return true }
    return false
  },
  // ... other actions
}))
```

### Step 11 — Create React Components

Create `src/features/[name]/components/[Name]Page.tsx`:

```typescript
import { useEffect } from 'react'
import { use[Name]Store } from '../store/[name].store'
import { PageLayout } from '@shared/components/layout/PageLayout'

export function [Name]Page() {
  const { items, isLoading, fetchItems } = use[Name]Store()
  useEffect(() => { void fetchItems() }, [fetchItems])

  if (isLoading) return <div>Loading...</div>
  return (
    <PageLayout title="[Name]">
      {items.map(item => <div key={item.id}>{item.title}</div>)}
    </PageLayout>
  )
}
```

### Step 12 — Add Route to Router.tsx

Edit `src/app/Router.tsx`:

```typescript
import { [Name]Page } from '@features/[name]/components/[Name]Page'

// Inside the children array:
{ path: '[name]', element: wrap(<[Name]Page />) },
```

### Step 13 — Add Navigation Entry to Sidebar.tsx

Edit `src/shared/components/layout/Sidebar.tsx` — add a navigation item with a Lucide icon:

```typescript
import { [Icon] } from 'lucide-react'
// Add to the nav items array:
{ label: '[Name]', href: '/[name]', icon: [Icon] },
```

---

## IPC Pattern Reference

**Response format** (from `channels.ts`):

```typescript
type IpcResult<T> = { success: true; data: T } | { success: false; error: string; code?: string }

ok<T>(data: T): IpcResult<T>          // success response
fail(error: string, code?: string)     // error response
```

**Standard handler pattern:**

```typescript
ipcMain.handle(IPC.MODULE.ACTION, (_event, arg1, arg2) => {
  try {
    const result = service.doSomething(getDatabase(), arg1, arg2)
    return ok(result)
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Unknown error')
  }
})
```

Never use `ipcMain.on` for request/response patterns; always use `ipcMain.handle` + `ipcRenderer.invoke`.

---

## Migration Naming Convention

| Pattern | Example |
|---|---|
| `NNN_descriptive_name` | `019_habits` |
| Version string must be unique | Used as PRIMARY KEY in `schema_migrations` |
| SQL inside must be idempotent | Use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` |
| Never modify an applied migration | Create a new migration to alter existing tables |
| Wrap related tables in one migration | `010_workspace_playlists` created both tables together |

---

## TypeScript Strict Mode Notes

The project uses the most aggressive TypeScript settings:

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "exactOptionalPropertyTypes": true,
  "noUncheckedIndexedAccess": true
}
```

Key implications:
- `exactOptionalPropertyTypes`: `{ a?: string }` does not accept `{ a: undefined }` — omit the key entirely
- `noUncheckedIndexedAccess`: array indexing returns `T | undefined`; always check `row[0]` before using
- `noUnusedLocals`: even underscore-prefixed unused variables may need explicit type suppression

---

## Coding Standards

Based on reading the existing codebase:

1. **Service functions receive `db: Database` as first argument** — never import connection inside a service
2. **IPC handlers call `getDatabase()` per invocation** — connection singleton is cached, this is safe
3. **Nanoid for IDs** — most entities use `nanoid()` (21 chars); some use prefixed IDs (`chl_`, `scn_`, `att_`, `feyn_`, `step_`) for human readability
4. **ISO timestamps** — always `new Date().toISOString()` or SQLite's `strftime('%Y-%m-%dT%H:%M:%fZ','now')`
5. **Soft-delete pattern** — major entities use `deleted_at TEXT NULL`; filter with `WHERE deleted_at IS NULL`
6. **COALESCE update pattern** — for partial updates: `SET title = COALESCE(:title, title)` with null for unchanged fields
7. **Transaction pattern** — use `db.transaction(() => { ... })()` for multi-statement mutations
8. **Dynamic SET builders** — service functions build `SET col = ?` arrays for truly partial updates (whiteboard, markdown patterns)
9. **Replace-all pattern** — for list associations (roadmap skills, occupation skills), DELETE then INSERT batch
10. **Zustand store naming** — `use[Module]Store` exported from `[module].store.ts`
11. **Error boundaries** — each route wrapped in `<ErrorBoundary>` in Router.tsx
12. **Type imports** — use `import type` for types to satisfy `verbatimModuleSyntax`
