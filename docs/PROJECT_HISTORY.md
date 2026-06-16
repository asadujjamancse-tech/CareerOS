# CareerOS — Project History

## Why CareerOS Exists

IT career management is fragmented. Professionals track certifications in one spreadsheet, skills in another, learning videos in browser bookmarks, study notes in a third-party app, and interview preparation in yet another tool. Nothing connects. Progress is invisible. Motivation is hard to sustain.

CareerOS was built to solve this problem: a single, integrated desktop application where everything about your IT career development lives together — tracked, connected, and owned entirely by you.

The feature set reflects the real concerns of an IT professional pursuing career growth: what skills do I have, what do I need, what am I studying, what have I built, how am I preparing for interviews, and am I actually making progress?

---

## Design Philosophy

**Local-first.** All data is stored in a single SQLite file on the user's machine. No accounts, no servers, no telemetry. Privacy is not a feature — it is the default.

**Offline-always.** The application is fully functional without an internet connection. There are no API dependencies for core functionality.

**Single-database simplicity.** SQLite was chosen over a cloud database, an embedded server (PostgreSQL), or a document store. For a single-user desktop application, SQLite provides excellent performance, zero configuration, and a portable single-file data store that users can copy and back up trivially.

**Electron over pure web.** Electron provides access to the filesystem, native menus, and system APIs that a web application cannot access. The Electron + Vite + React stack allows rapid UI development while maintaining native integration.

**Zustand over Redux.** Zustand's minimal boilerplate and direct `set()` mutation model is well-suited to a single-developer codebase. Redux's ceremony would add overhead with no practical benefit at this scale.

**Module isolation.** Each feature is an independent vertical slice: its own migration, service, IPC handler, Zustand store, and React components. This prevents cross-module coupling and allows modules to evolve independently.

---

## Evolution Through Migrations

### Phase 1 — Core Entities (Migration 001)
*`001_initial_schema`*

The foundation: `skill_categories`, `skills`, `occupations`, `occupation_skills`, `projects`, `project_skills`, `certifications`, `certification_skills`, `videos`, `video_skills`, `notes`, `note_skills`, `documents`, `document_skills`, `tags`, `entity_tags`, `journal_entries`, `journal_tags`.

Foreign keys enabled globally (`PRAGMA foreign_keys = ON`). WAL mode for better concurrent access performance. Partial indexes on `deleted_at IS NULL` columns for query efficiency.

The initial schema reveals the original focus: skills as the central entity, with all other entities (projects, certifications, videos, notes, documents) connecting to skills. Career tracking was the core use case from day one.

### Phase 2 — Full-Text Search (Migration 002)
*`002_fts5_search`*

Added FTS5 virtual tables for: `skills_fts`, `projects_fts`, `certifications_fts`, `notes_fts`, `documents_fts`, `interview_questions_fts` (added ahead of the interview questions tables — suggests FTS was planned from the start).

### Phase 3 — Category Seeding (Migration 003)
*`003_seed_categories`*

Pre-populated `skill_categories` with standard IT categories (networking, cloud, scripting, etc.). `INSERT OR IGNORE` makes this idempotent on re-runs.

### Phase 4 — Assets (Migration 004)
*`004_skill_project_assets`*

Added `skill_assets` and `project_assets` tables for file attachments. Added `project_skills` join table with `level_used` and `primary_skill` columns. Added `video_skills` and `home_lab_skills` cross-reference tables, suggesting Home Labs was planned at this stage.

### Phase 5 — Career Intelligence (Migration 005)
*`005_career_intelligence`*

Major feature addition: `career_roadmaps`, `roadmap_skills`, `roadmap_certifications`, `roadmap_projects`, `roadmap_milestones`, `skill_progress`, `study_sessions`. This shifted CareerOS from a simple tracker to a goal-oriented planning tool.

### Phase 6 — Home Labs and Interview Questions (Migration 006)
*`006_home_lab_interview`*

Added `home_labs`, `home_lab_tasks`, `home_lab_problems`, `home_lab_time_logs`, `home_lab_assets`, `home_lab_skills`. Added `interview_questions`, `interview_categories`, `interview_question_skills`, `interview_reviews`. This migration brought hands-on practice tracking into the app.

### Phase 7 — Skill Hub (Migration 007)
*`007_skill_hub`*

Added per-skill learning modules: `skill_modules`, `skill_module_topics`, `skill_resources`, `skill_experience_log`, `skill_quiz_questions`, `skill_quiz_attempts`, `skill_hub_linked_labs`, `skill_hub_linked_projects`, `skill_hub_linked_certifications`, `skill_hub_linked_interview_questions`. The Skill Hub turned each skill into its own mini-curriculum.

### Phase 8 — Learning System / SRS (Migration 008)
*`008_learning_system`*

Added the spaced repetition system: `srs_cards`, `srs_reviews`. SM-2 algorithm implementation. Also added `challenges`, `challenge_completions`, `learning_scenarios`, `scenario_steps`, `scenario_attempts`, `feynman_entries`. Gamification and practice scenarios entered the product.

### Phase 9 — Learning Coach (Migration 009)
*`009_learning_coach`*

Added structured learning management: `learning_paths`, `learning_path_skills`, `skill_learning_methods`, `skill_retention`, `skill_retention_logs`, `study_plans`, `study_plan_items`, `skill_dependencies`. The Learning Coach module became a full-featured structured learning planner.

### Phase 10 — Workspace and Playlists (Migration 010)
*`010_workspace_playlists`*

Added `playlists`, `playlist_items`, `workspace_state`. The multi-panel workspace and playlist organization for video learning were added as productivity features.

### Phase 11 — Knowledge Vault (Migration 011)
*`011_knowledge_vault`*

Added `vault_collections`, `vault_collection_documents`, `vault_favorites`, `vault_recent`. Specialized the document management into a PDF-focused knowledge vault with collections and favorites.

### Phase 12 — PDF Reading Progress (Migration 012)
*`012_pdf_reading_progress`*

Added `pdf_reading_progress` for per-document page tracking and reading statistics. Also added `pdf_annotations` for highlights and notes within PDFs.

### Phase 13 — Markdown Workspace (Migration 013)
*`013_markdown_workspace`*

Added `markdown_documents`, `markdown_versions`. Full in-app Markdown editor with version history.

### Phase 14 — Document Comments (Migration 014)
*`014_document_comments`*

Added `document_comments` for the DOCX viewer — collaborative-style commenting on Word documents.

### Phase 15 — Code Workspace (Migration 015)
*`015_code_workspace`*

Added `code_folders`, `code_files`. In-app Monaco code editor with folder hierarchy.

### Phase 16 — Search Index Improvements (Migration 016)
*`016_search_index`*

Added missing FTS5 tables (`home_labs_fts`, `interview_questions_fts` properly wired). Added `search_history` table for query persistence. Added `knowledge_colors` table for the knowledge color coding system.

### Phase 17 — Whiteboard (Migration 017)
*`017_whiteboard`*

Added `whiteboards`, `whiteboard_links`. Free-form drawing canvases with entity cross-linking.

### Phase 18 — Knowledge Graph (Migration 018)
*`018_knowledge_graph`*

Added `knowledge_nodes`, `knowledge_links`. User-curated explicit knowledge graph with directed edges. This completes the current feature set.

---

## Key Architectural Decisions

### Why SQLite instead of PostgreSQL or a cloud database

SQLite is the right choice for a local-first desktop application targeting a single user. It requires no server process, produces a single portable file, supports WAL mode for performance, includes FTS5 for full-text search, and handles all realistic personal data volumes without configuration.

PostgreSQL would require installation and management. A cloud database would violate the privacy-first design principle.

### Why Electron instead of a web application

Electron provides access to the filesystem (required for PDF and document import), native OS dialog boxes, system-level APIs (display enumeration for the floating workspace window), and the ability to run SQLite with `better-sqlite3`'s synchronous API which dramatically simplifies the data access layer compared to async alternatives.

A pure web application could approximate some functionality via IndexedDB and File System Access API, but would lose native integration, full SQLite capability, and the ability to run without an internet connection.

### Why Zustand instead of Redux

Redux Toolkit would have worked, but Zustand's `create()` pattern produces stores with significantly less boilerplate. Each module's store is ~100–200 lines. The equivalent Redux implementation would be 3× longer. For a single-developer project, ergonomics matter.

### Why nanoid instead of UUID

nanoid produces shorter IDs (21 chars vs. 36) which saves space in TEXT PRIMARY KEY columns and is URL-safe. For IDs that need to be human-readable, the prefixed variant (`chl_`, `scn_`) adds semantic information without much overhead.

---

## What Must Never Change

### contextBridge Security Model

`contextBridge.exposeInMainWorld` is the security boundary between the renderer and the Electron main process. The `api` object it exposes must never include direct Node.js APIs, `ipcRenderer` itself, or filesystem access functions. All privileged operations must go through named IPC channels that are explicitly handled in the main process.

### Migration Immutability

Applied migrations must never be modified. The `schema_migrations` table tracks which versions have been applied by version string. Modifying a migration that has already been applied to a production database will leave the database in an inconsistent state. Always create a new migration to change existing schema.

### IPC Channel Name Constants

The `channels.ts` file is the single source of truth for all IPC channel names. Channel strings must never be hardcoded in IPC handlers or in the preload bridge — always reference `IPC.[MODULE].[ACTION]`. This ensures refactoring a channel name is a single-file change.

---

## What Can Safely Be Refactored

- **Service functions** — internal implementation, database queries, and helper functions within service files can be freely changed as long as the function signatures (parameters and return types) remain compatible
- **Zustand store internals** — the store's action implementations can be changed; only the state shape and action names visible to components matter
- **React component implementation** — UI rendering logic, component hierarchy below the page level, and styling can be freely changed
- **Migration SQL** — new migrations can add, alter (via new columns or new tables), or drop content; existing migrations cannot be changed
- **IPC handler bodies** — the `ipcMain.handle` callback can be freely changed; only the channel name and the IpcResult<T> response shape must remain stable
