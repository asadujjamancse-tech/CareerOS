# Changelog

All notable changes to CareerOS are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-06-03

### Added

**Core application**
- Electron 41 desktop shell with sandboxed renderer and contextBridge IPC
- SQLite database via `better-sqlite3` with WAL mode and foreign key enforcement
- Versioned migration runner (4 migrations applied automatically on startup)
- FTS5 full-text search across all 8 content modules with BM25 ranking
- Typed IPC bridge — all renderer ↔ main communication is end-to-end typed
- Feature-based folder structure with isolated stores, schemas, and types per module

**Skills module**
- Create, edit, and soft-delete skills
- Hierarchical skill categories with colour coding (10 default categories seeded)
- Proficiency levels: Beginner, Intermediate, Advanced, Expert
- Learning status: Learning, Practicing, Proficient, Mastered
- Years of experience field
- Public/private flag for portfolio visibility
- Full-text search, category filter, proficiency filter, status filter
- Pagination (24 per page)

**Occupations module**
- Define career targets, current roles, and aspirational positions
- Seniority levels: Junior through C-Level (9 tiers)
- Status: Aspirational, Active, Completed, Archived
- Skill requirement mapping with Critical / Important / Nice-to-have importance
- Per-skill acquisition tracking (acquired vs. still learning)
- Target date field

**Projects module**
- Portfolio project tracking with 5 status states and 5 project types
- Repository URL and live URL fields
- Featured flag for portfolio highlighting
- Project assets sub-module: images, screenshots, links, documents, demo URLs
- Asset reordering
- Skill linking (M:N)
- Start and end date tracking
- Lessons learned field

**Certifications module**
- Full credential details: name, issuer, credential ID and URL
- Status workflow: Planned → In-Progress → Earned → Expired / Revoked
- Certificate file attachment (PDF, images stored locally)
- Issue and expiry date tracking
- Expiry warning badge for credentials expiring within 90 days
- Score and passing score fields
- Study notes field
- Skill linking (M:N)

**Videos module**
- Save videos from YouTube, Vimeo, Udemy, Coursera, Pluralsight, or local files
- Watch status: Unwatched, Watching, Completed, Revisit
- Watch progress tracking (seconds)
- Channel / author field
- Duration display (formatted hours/minutes)
- Skill linking (M:N)
- Filter by source platform and watch status
- Full-text search

**Notes module**
- Six note types: General, Meeting, Research, Tutorial, Reference, Idea
- Pin notes to the top of the list
- Full-text search across title and content
- Tag support

**Documents module**
- Import PDF, Word, text, image, and other files
- Seven document types: Resume, Cover Letter, Certificate, Report, Template, Reference, Other
- Open documents with the system's default application
- File size display
- Version tracking
- Tag support
- Full-text search

**Career Journal module**
- Daily journal entries with explicit entry date (supports backdating)
- Five mood values: Great, Good, Neutral, Bad, Terrible
- Energy level scale (1–5)
- Seven entry categories: Achievement, Challenge, Reflection, Learning, Goal, Feedback, General
- Private entry flag
- Full-text search across title and content

**Tags module**
- Create colour-coded tags with 12 preset colours or custom hex
- Apply tags to any entity across all modules
- Slug-based deduplication

**Shared infrastructure**
- Zustand state management with one isolated store per module
- Consistent store shape: list state, detail state, form state, delete state
- Zod form validation schemas for all modules
- Soft-delete pattern on all entity tables (data preserved, filtered from queries)
- nanoid-based primary keys (21-character URL-safe IDs)
- Polymorphic tag system via `entity_tags` junction table
- Paginated list queries with offset-based pagination
- Consistent IpcResult<T> envelope for all IPC responses
- Empty states, loading states, and error recovery on all pages
- Retry buttons on failed list fetches
- shadcn/ui component library with Radix UI primitives
- Tailwind CSS with CSS variable theming

---

## Future

See [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) for planned features.
