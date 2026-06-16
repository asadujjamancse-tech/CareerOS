# CareerOS — Senior Technical Product Review

**Review date:** June 2026  
**Reviewer:** Documentation analysis from source code reading  
**Version reviewed:** 1.0.0 (18 migrations, 33 IPC modules)

---

## Strengths

### Architecture Pattern

The contextBridge / ipcMain / ipcRenderer architecture is implemented correctly. `contextBridge.exposeInMainWorld` is used exclusively to expose a typed API object — no direct `ipcRenderer` exposure. This is the correct and secure Electron pattern for preventing renderer scripts from accessing Node.js APIs directly.

The three-layer separation (React renderer → preload bridge → Electron main → SQLite service) is clean and consistent across all 33 IPC modules. Adding a new module requires predictable steps at each layer.

### Migration System

The migration runner is well designed: sequential, idempotent (`CREATE TABLE IF NOT EXISTS`), transaction-wrapped, and tracked in a `schema_migrations` table. With 18 migrations spanning a realistic feature history, the system has proven its scalability. Migrations are never modified after application — the right constraint.

### Service Layer

All database service functions accept `db: Database` as their first parameter rather than importing a connection. This makes services testable in isolation (pass a test database). The consistent use of `nanoid()` for IDs, ISO timestamps, and `COALESCE` partial update patterns shows deliberate code discipline.

### Type Safety

TypeScript `strict` mode is enabled along with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noUnusedLocals`. These settings catch an entire class of bugs at compile time. The dual `tsconfig.node.json` / `tsconfig.web.json` ensures both Electron and React code are type-checked against appropriate targets.

### Feature Breadth

33 active modules covering the full IT career lifecycle: skill tracking, certification management, project portfolio, video learning, document management, notes, journaling, SRS flashcards, learning paths, career roadmaps, challenges, practice scenarios, knowledge graphs, code editing, whiteboard drawing, and full-text search. This breadth is genuinely impressive for a v1.0 product.

### Browser Fallback Pattern

The `nullApi` in `ipc-client.ts` returns safe empty results for reads and a graceful `BROWSER_MODE` failure for writes. This allows the React code to be tested or previewed in a browser without crashing. Most applications skip this entirely.

### Error Boundaries

Every route is individually wrapped in `<ErrorBoundary>`. A rendering crash in one module cannot cascade to take down the rest of the application.

---

## Weaknesses

### No Tests

There are no unit tests, integration tests, or end-to-end tests anywhere in the codebase. The `vitest` and `@testing-library/react` devDependencies are installed but unused. This is the single largest risk to maintainability. Any refactoring of service functions or IPC handlers operates without a safety net.

### Inconsistent Patterns in Deletion

Some entities use soft-delete (`deleted_at`): skills, projects, certifications, videos, notes, documents, occupations, career roadmaps, home labs, interview questions.  
Others use hard-delete: markdown documents, code files/folders, whiteboards, playlists, knowledge nodes, tags.  
There is no documented rule for which approach is used when. This inconsistency could cause data integrity confusion.

### Heuristic "AI Coach" Labeling

The `AICoachTab` is labeled and marketed as AI-driven, but it is entirely rule-based SQL computation. No external API is called. The "AI" label may set incorrect expectations for users. The underlying readiness scoring model is simplistic (5 years = 100% experience, 45/25/20/10 weighting with no justification from research).

### Missing Error Handling in UI

Service-level errors returned as `IpcResult<T>` with `success: false` are handled in Zustand stores, but it is not confirmed that every error is surfaced to the user. Store slices set error state (e.g., `roadmapError`, `analyticsError`) but individual components may not render these error states consistently.

### Dynamic SQL Construction

`career-intelligence.service.ts` builds parameterized IN-clause placeholders dynamically: `skillIds.map(() => '?').join(',')`. This is repeated 10 times in one function. While not a SQL injection risk (only controlled data is substituted), it is verbose and fragile. A helper function would reduce duplication.

### No Pagination in Most List Views

The Occupations module implements pagination (default 24/page). No other module does. Skills, Projects, Videos, Notes, and Interview Questions all load all records in a single query. On a database with hundreds or thousands of entries, these queries will become slow with no remedy available.

### Tags Limited to Occupations

The `entity_tags` table and Tags service are designed generically (any `entity_type`, any `entity_id`). However, only the Occupations module actively uses it. Skills, Projects, Notes, and Videos do not have tag support in their current services or IPC handlers.

---

## Technical Debt

### Repeated Pattern Code

The delete/then/insert batch pattern for setting roadmap skills, certifications, projects, and milestones is repeated four times (`setRoadmapSkills`, `setRoadmapCertifications`, `setRoadmapProjects`, `setRoadmapMilestones`). These could be abstracted into a generic `replaceBatchFor(table, fk, rows)` helper.

### Placeholder SQL String Building

`getKnowledgeGraph` in `career-intelligence.service.ts` runs 5 separate queries with the same IN-clause placeholder string. This function is 160 lines. It would benefit from decomposition.

### Mixed ID Strategies

Some entities use plain `nanoid()` (21 chars), others use prefixed IDs (`chl_`, `scn_`, `att_`, `step_`, `feyn_`). The knowledge-graph service uses `nanoid()`. The challenges service uses `chl_${nanoid(10)}`. There is no project-wide ID convention documented.

### Two Knowledge Graphs

There are two separate "knowledge graph" concepts: the auto-generated relational graph in `career-intelligence.service.ts::getKnowledgeGraph()` (accessible via `career:knowledge-graph:get`) and the user-curated explicit graph module (`knowledge-graph.service.ts`) with dedicated tables. These overlap in purpose and may confuse users. The relationship between them is not surfaced in the UI.

---

## Missing Features (for a Production App)

| Feature | Impact |
|---|---|
| Authentication / multi-user | No access control; anyone with filesystem access can read the database |
| Cloud sync / backup | Data only exists on one machine; no automatic backup |
| Export (PDF, Markdown, JSON, CSV) | Cannot extract data for use outside CareerOS |
| Import from external sources | Cannot import skills from a LinkedIn profile or certifications from a Credly badge |
| Push notifications | No reminders for due SRS cards, milestone deadlines, or challenge streaks |
| Undo / redo | No undo for deletions; soft-delete helps for some entities but not all |
| Data migration on major version change | No migration path if schema changes break existing data |
| Offline indicator | No status indicator; app is always local-only but this is not communicated in UI |

---

## Performance Risks

### SQLite on Large Datasets

FTS5 global search runs 7 separate queries and merges results in memory. With thousands of documents, this could be slow. There is no caching layer.

### Auto-Generated Knowledge Graph

`getKnowledgeGraph` in the career intelligence service runs 10 parameterized queries, expanding a skill ID array as an IN clause. At 40 skills and hundreds of related entities, this is fine. At 400 skills, the intermediate array manipulations and multiple JOINs could be slow.

### No Pagination in Core Lists

Skills, Projects, Videos, Notes, and Interview Questions load all rows unconditionally. At 500+ skills, the `SELECT *` with multiple JOINs for category/status will produce measurable latency.

### Missing Database Indexes

The initial schema (`001_initial_schema`) creates some indexes but it is not confirmed that all foreign key columns and filtered columns (e.g., `deleted_at`, `challenge_date`, `session_date`) are indexed. Missing indexes become critical at scale.

---

## Security Risks

### contextBridge Correctly Used

The Electron security model is implemented correctly. `contextBridge.exposeInMainWorld` exposes a typed API object with no access to Node.js APIs. The renderer cannot access `require`, `process`, or filesystem directly.

### Input Sanitization

All database queries use parameterized statements (better-sqlite3's `prepare().run(params)`). There is no string interpolation of user input into SQL. SQL injection is not a risk through the IPC layer.

### File Path Handling

The Storage IPC (`storage.ipc.ts`) handles file import, open, and show-in-folder operations. These use Electron's `shell.openPath` and `dialog.showOpenDialog` APIs which are sandboxed by the OS. File path traversal outside the expected directories is not a risk via these APIs.

### Database Location

The SQLite file is stored in Electron's `app.getPath('userData')` directory. On macOS this is `~/Library/Application Support/CareerOS/`. No encryption is applied. If the machine's filesystem is not encrypted (FileVault), the database is accessible to anyone with OS-level access.

---

## UX Problems (Based on Component Reading)

- **No empty states documented**: it is not confirmed whether list pages show helpful onboarding messages when a module has no data
- **No confirmation on hard deletes**: modules using hard-delete (whiteboard, code files, markdown documents) may delete without a confirmation dialog (not confirmed from source)
- **No loading skeletons**: loading states use simple boolean flags; skeleton placeholder UI is not confirmed
- **Single-column forms**: complex entities (roadmap with 4 sub-lists, skill hub with 8 tabs) may have congested UIs
- **The two knowledge graphs**: the overlapping KnowledgeGraphTab (auto-generated) inside Career Intelligence and the standalone Knowledge Graph module serve similar visual purposes but are implemented completely differently, which may confuse users

---

## Maintainability Score: 7/10

**Rationale:**
- (+) Clean architecture with predictable layering
- (+) Strict TypeScript catches regressions at compile time
- (+) Migration system ensures schema evolution is safe
- (+) Consistent service patterns across modules
- (-) No tests — the highest maintainability risk
- (-) Some large functions that need decomposition
- (-) Inconsistent ID and delete strategies across modules
- (-) No documented architecture decision records (ADRs)

---

## Scalability Analysis

**Horizontally:** Not applicable — desktop application, single user.

**Vertically (data growth):** The current architecture handles hundreds of records per entity comfortably. At thousands of records, pagination gaps in Skills, Videos, and Notes will cause UX degradation. At tens of thousands of records, FTS5 search and the auto-generated knowledge graph queries will require optimization. SQLite is adequate for a personal application at any realistic scale (personal knowledge bases rarely exceed 100k records).

---

## Future Opportunities

1. **AI integration** — Claude API for natural language coaching, smart suggestions, and content generation would differentiate CareerOS from simple CRUD tools
2. **Mobile companion** — a read-only iOS/Android app synchronized via a local network share or iCloud would expand utility significantly
3. **Plugin system** — allow community-contributed scenarios, challenge sets, and learning paths
4. **Job market integration** — scrape or import job postings to automatically suggest skill gaps against current demand
5. **Export/portfolio generation** — auto-generate a PDF career portfolio from skills, projects, and certifications
