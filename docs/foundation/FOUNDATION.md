# CareerOS — Phase 3: Electron Foundation

**Version:** 1.0.0  
**Date:** 2026-06-03  
**Status:** Ready for `npm install`

---

## Overview

Phase 3 delivers a working Electron application with React, TypeScript, Vite, and SQLite wired together end-to-end. The app starts, creates the database, runs all migrations, exposes a typed IPC bridge, and renders the full navigation shell with empty state pages for every module.

---

## Folder Structure

```
careeros/
├── electron/
│   ├── main/
│   │   ├── index.ts                  App entry — bootstraps DB, IPC, window
│   │   └── window.ts                 BrowserWindow factory
│   ├── preload/
│   │   └── index.ts                  contextBridge — exposes window.api
│   ├── ipc/
│   │   ├── channels.ts               IPC channel constants + IpcResult type + ok/fail helpers
│   │   ├── index.ts                  Registers all IPC handlers
│   │   └── app.ipc.ts                app:get-version, app:get-paths handlers
│   └── services/
│       └── database/
│           ├── connection.ts         better-sqlite3 singleton + data directory setup
│           └── migrations/
│               ├── runner.ts         Sequential migration runner
│               ├── 001_initial_schema.ts
│               ├── 002_fts5_search.ts
│               └── 003_seed_categories.ts
│
├── src/
│   ├── main.tsx                      React entry point
│   ├── app/
│   │   ├── App.tsx                   Root — ErrorBoundary + RouterProvider
│   │   └── Router.tsx                createHashRouter — all module routes
│   ├── features/
│   │   ├── skills/components/SkillsPage.tsx
│   │   ├── occupations/components/OccupationsPage.tsx
│   │   ├── projects/components/ProjectsPage.tsx
│   │   ├── certifications/components/CertificationsPage.tsx
│   │   ├── videos/components/VideosPage.tsx
│   │   ├── notes/components/NotesPage.tsx
│   │   ├── documents/components/DocumentsPage.tsx
│   │   ├── journal/components/JournalPage.tsx
│   │   └── tags/components/TagsPage.tsx
│   ├── shared/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Shell.tsx         Sidebar + Outlet
│   │   │   │   ├── Sidebar.tsx       Navigation with NavLink active states
│   │   │   │   ├── Header.tsx        Page header + search trigger + actions slot
│   │   │   │   └── PageLayout.tsx    Title + description + content area
│   │   │   └── common/
│   │   │       ├── EmptyState.tsx    Reusable empty state with icon + CTA
│   │   │       ├── LoadingSpinner.tsx Spinner + PageLoader
│   │   │       └── ErrorBoundary.tsx React class error boundary
│   │   ├── types/
│   │   │   ├── common.types.ts       BaseEntity, IpcResult, PaginatedResult, ListFilters
│   │   │   ├── entities.ts           All domain entity types from the Phase 2 schema
│   │   │   └── ipc.types.ts          Window.api interface + global declaration
│   │   └── lib/
│   │       ├── ipc-client.ts         window.api re-exported as typed `api`
│   │       └── utils.ts              cn(), formatDate(), slugify(), etc.
│   └── styles/
│       └── globals.css               Tailwind + CSS variables + scrollbar + drag region
│
├── docs/
│   ├── architecture/ARCHITECTURE.md  Phase 1
│   ├── database/DATABASE.md          Phase 2
│   └── foundation/FOUNDATION.md      Phase 3 (this file)
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── electron.vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json
└── .eslintrc.cjs
```

---

## Setup Commands

```bash
# 1. Install all dependencies (also rebuilds better-sqlite3 for Electron)
npm install

# 2. Start development server with hot reload
npm run dev

# 3. Type check both main and renderer processes
npm run typecheck

# 4. Lint
npm run lint

# 5. Build for production
npm run build

# 6. Package for distribution
npm run package:mac    # macOS .dmg
npm run package:win    # Windows .exe (NSIS)
npm run package:linux  # Linux .AppImage
```

---

## Environment Configuration

### Development

`electron-vite` manages the dev environment automatically:

| Variable | Set by | Purpose |
|---|---|---|
| `ELECTRON_RENDERER_URL` | electron-vite | Hot-reload URL for the renderer |
| `NODE_ENV` | electron-vite | `'development'` in dev, `'production'` in build |

### Data Directory

The application stores all data in `~/CareerOS/` (not `userData`):

| Path | Purpose |
|---|---|
| `~/CareerOS/careeros.db` | SQLite database |
| `~/CareerOS/attachments/` | Uploaded files |
| `~/CareerOS/exports/` | Exported documents |
| `~/CareerOS/backups/` | Automatic DB backups |

The directory is created automatically on first launch.

---

## IPC Architecture

### Flow

```
Renderer (React)
  └── api.skills.getAll(filters)          ← typed via Window.api in ipc.types.ts
        └── window.api.skills.getAll()    ← preload exports
              └── ipcRenderer.invoke('skills:get-all', filters)
                    └── ipcMain.handle('skills:get-all', handler)  ← registered in ipc/
                          └── SQLite query via getDatabase()
                                └── returns IpcResult<T>
```

### Calling the API in renderer code

```typescript
import { api } from '@shared/lib/ipc-client'

const result = await api.skills.getAll({ status: 'learning', page: 1, pageSize: 20 })

if (result.success) {
  console.log(result.data.items)   // Skill[]
} else {
  console.error(result.error)      // string
}
```

### Adding a new IPC handler (pattern for Phase 4+)

1. Add channel constants to `electron/ipc/channels.ts`
2. Create `electron/ipc/[module].ipc.ts`
3. Implement handlers using `ok()` / `fail()` helpers
4. Register in `electron/ipc/index.ts`
5. Channels are already exposed in `electron/preload/index.ts`
6. Types are already declared in `src/shared/types/ipc.types.ts`

---

## Security Architecture

| Layer | Mechanism | Setting |
|---|---|---|
| Renderer isolation | `contextIsolation: true` | Renderer cannot access Node.js |
| No direct Node.js | `nodeIntegration: false` | `require()` is unavailable in renderer |
| Typed bridge | `contextBridge.exposeInMainWorld` | Only declared `window.api` methods exposed |
| IPC validation | Zod (Phase 4+) | Every handler validates input before DB |
| File access | Storage service only | Renderer cannot access arbitrary paths |
| External links | `setWindowOpenHandler` | All external URLs open in system browser |
| CSP | `Content-Security-Policy` header | `index.html` — blocks inline scripts, XHR |
| Sandbox | `sandbox: false` | Required for `better-sqlite3` preload; `contextIsolation` still enforced |

### Content Security Policy

```
default-src 'self'
script-src 'self'
style-src 'self' 'unsafe-inline'   ← required for Tailwind CSS-in-JS
img-src 'self' data: blob:
font-src 'self' data:
connect-src 'self'
media-src 'self' blob:
```

---

## Database Startup Sequence

```
1. app.whenReady() fires
2. runMigrations() called
   a. getDatabase() creates ~/CareerOS/careeros.db if not exists
   b. Applies WAL, foreign_keys, busy_timeout pragmas
   c. Checks schema_migrations table
   d. Runs 001, 002, 003 in order (each in a transaction)
3. registerIpcHandlers() called
4. createMainWindow() opens the BrowserWindow
5. Renderer loads → React mounts → Router renders Shell
```

---

## Shadcn UI — Adding Components

With `components.json` configured, add Shadcn components as needed:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
```

Components are generated to `src/shared/components/ui/` per the alias in `components.json`.

---

## Phase 4 Preview

Phase 4 builds the **Skills** module end-to-end:

- `electron/ipc/skills.ipc.ts` — all 5 CRUD handlers + category handlers
- `src/features/skills/` — complete feature module:
  - `types/skill.types.ts`
  - `schemas/skill.schema.ts` (Zod)
  - `store/skills.store.ts` (Zustand)
  - `hooks/useSkills.ts`, `useSkillForm.ts`
  - `components/SkillsPage.tsx`, `SkillCard.tsx`, `SkillForm.tsx`, `SkillFilters.tsx`
