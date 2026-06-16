# CareerOS — Feature Inventory

Complete inventory of all features and modules in CareerOS v1.0.

## Summary

| Metric | Count |
|---|---|
| Total modules | 28 |
| Feature groups | 3 (Learning OS, Career OS, Knowledge) |
| Database tables | 63 (including FTS virtual tables) |
| IPC channel namespaces | 38 |
| React routes | 32 |

---

## Learning OS Group

| Feature | Purpose | Status | Key DB Tables | Key IPC Channels | User Value | Complexity |
|---|---|---|---|---|---|---|
| **Workspace** | Dockable multi-panel layout for parallel work | Complete | `workspace_state` | `workspace:*` | Work on multiple modules simultaneously | Medium |
| **Learning Dashboard** | Aggregated metrics: skills, labs, certifications, career readiness score | Complete | All entity tables (read-only aggregation) | `learning-dashboard:*` | Single-glance view of career progress | High |
| **AI Coach (Learning Coach)** | Learning paths, skill methods, retention scheduling, study plans, dependency graph | Complete | `learning_paths`, `learning_path_skills`, `skill_method_configs`, `retention_records`, `review_logs`, `study_plans`, `study_plan_items`, `skill_dependencies` | `lc:paths:*`, `lc:methods:*`, `lc:retention:*`, `lc:plans:*`, `lc:deps:*`, `lc:effectiveness:*` | Structured, science-backed learning progression | High |
| **SRS & Recall** | SM-2 spaced repetition flashcard system | Complete | `srs_cards`, `srs_reviews`, `feynman_entries` | `srs:*`, `feynman:*` | Proven retention of learned material | High |
| **Knowledge Vault** | Document reader: PDF with annotations, DOCX viewer with comments, collections, favourites | Complete | `documents`, `document_annotations`, `document_reading_progress`, `pdf_reading_progress`, `document_comments`, `vault_collections`, `vault_collection_documents`, `vault_favorites`, `vault_recent_files`, `vault_metadata` | `annotations:*`, `pdf-reader:*`, `vault:*`, `vault-collections:*`, `vault-favorites:*`, `vault-recent:*`, `docx-viewer:*` | Rich reading experience with annotation and progress tracking | High |
| **Challenges** | Daily and weekly learning challenges with XP rewards | Complete | `challenges`, `challenge_completions` | `challenges:*` | Gamified motivation layer | Medium |
| **Scenarios** | Realistic IT scenario simulations with step-by-step walkthroughs | Complete | `learning_scenarios`, `scenario_steps`, `scenario_attempts` | `scenarios:*` | Practise real-world IT problem-solving | High |

---

## Career OS Group

| Feature | Purpose | Status | Key DB Tables | Key IPC Channels | User Value | Complexity |
|---|---|---|---|---|---|---|
| **Career Intelligence** | Career roadmaps, skill progress tracking, study sessions, AI recommendations, analytics dashboard | Complete | `career_roadmaps`, `roadmap_skills`, `roadmap_certifications`, `roadmap_projects`, `roadmap_milestones`, `skill_progress`, `study_sessions` | `career:roadmaps:*`, `career:skill-progress:*`, `career:study-sessions:*`, `career:coach:*`, `career:analytics:*` | Map career goals to concrete skills and milestones | High |
| **Knowledge Graph** | Visual graph of entities and their relationships | Complete | `knowledge_nodes`, `knowledge_links` | `knowledge-graph:*` | Visualise how skills, projects, and documents connect | High |
| **Skills** | Skill inventory with categories, proficiency levels, and status tracking | Complete | `skills`, `skill_categories`, `entity_tags` | `skills:*`, `skill-categories:*` | Core career data — the foundation of the system | Medium |
| **Occupations** | Job role tracking with required skill mapping | Complete | `occupations`, `occupation_skills` | `occupations:*` | Map target roles to required skills | Medium |
| **Certifications** | Certification lifecycle: planned → in-progress → earned → expired | Complete | `certifications`, `certification_skills` | `certifications:*` | Track all certification progress | Low |
| **Projects** | Project portfolio with assets, skill links, and status | Complete | `projects`, `project_assets`, `project_skills`, `skill_documents` | `projects:*`, `project-assets:*` | Evidence-based portfolio of work | Medium |
| **Home Labs** | Lab experiment tracking with tasks, problems, time logs, and assets | Complete | `home_labs`, `home_lab_tasks`, `home_lab_problems`, `home_lab_time_entries`, `home_lab_assets`, `home_lab_skills`, `home_lab_certifications` | `home-labs:*` | Structured hands-on practice tracking | High |
| **Interview Bank** | Interview question library with mastery tracking and random review mode | Complete | `interview_questions`, `interview_categories`, `interview_question_skills` | `interview:questions:*`, `interview:categories:*` | Systematic interview preparation | Medium |
| **Skill Hub** | Per-skill deep-dive: modules, resources, quiz, experience log, linked entities | Complete | `skill_modules`, `skill_module_topics`, `skill_resources`, `skill_experience_log`, `skill_quiz_questions`, `skill_quiz_attempts` | `skill-hub:*` | 360° view of a single skill | High |

---

## Knowledge Group

| Feature | Purpose | Status | Key DB Tables | Key IPC Channels | User Value | Complexity |
|---|---|---|---|---|---|---|
| **Code Workspace** | Monaco-based code editor with folder organisation | Complete | `code_folders`, `code_files` | `code-workspace:*` | In-app code editing and snippet storage | Medium |
| **Whiteboard** | Free-draw canvas with entity linking | Complete | `whiteboards`, `whiteboard_links` | `whiteboard:*` | Visual thinking and diagramming | Medium |
| **Markdown Workspace** | Full-featured Markdown editor with version history, Mermaid, frontmatter | Complete | `markdown_documents`, `markdown_versions` | `markdown:*` | Rich writing and documentation | Medium |
| **Notes** | General note-taking with type classification and tagging | Complete | `notes`, `entity_tags` | `notes:*` | Quick note capture | Low |
| **Documents** | File management with PDF/DOCX reading, rename, open | Complete | `documents`, `entity_tags` | `documents:*`, `storage:*` | Central file library | Medium |
| **Videos** | Video library with YouTube/local playback and progress tracking | Complete | `videos`, `video_skills` | `videos:*` | Curated video learning library | Medium |
| **Playlists** | Video playlist organisation linked to skills | Complete | `playlists`, `playlist_items` | `playlists:*` | Course-style video sequencing | Low |
| **Journal** | Daily career journal with mood, energy, and category tagging | Complete | `journal_entries` | `journal:*` | Reflective career journaling | Low |
| **Tags** | Cross-module tagging system | Complete | `tags`, `entity_tags` | `tags:*` | Flexible categorisation across modules | Low |

---

## Cross-cutting Features

| Feature | Purpose | Status | Key DB Tables | Key IPC Channels | User Value | Complexity |
|---|---|---|---|---|---|---|
| **Global Search** | FTS5 full-text search across all entity types with history | Complete | `*_fts` virtual tables, `search_history` | `search:*` | Find anything instantly | Medium |
| **Knowledge Colors** | User-configurable colour system for annotation meaning (Red=Critical, Green=Mastered, etc.) | Complete | `knowledge_colors` | `knowledge-colors:*` | Consistent visual annotation language | Low |
| **Annotations** | Highlight, note, and bookmark system for documents | Complete | `document_annotations`, `document_reading_progress` | `annotations:*` | Active reading and knowledge extraction | High |
| **Storage** | File import pipeline: copy to CareerOS folder, track metadata | Complete | (uses filesystem) | `storage:*` | Centralised file management | Medium |

---

## Status Definitions

| Status | Meaning |
|---|---|
| **Complete** | Feature is fully implemented: DB schema, service, IPC handler, store, and UI components all present |
| **Partial** | Core functionality works but some sub-features are missing or the UI is incomplete |
| **Stub** | Route exists but the page has minimal or placeholder implementation |

---

## Feature Complexity Rating

| Rating | Meaning |
|---|---|
| **Low** | Simple CRUD, 1-2 DB tables, straightforward UI |
| **Medium** | Multiple related tables, some business logic, moderate UI complexity |
| **High** | Complex business logic, many tables with relationships, sophisticated UI, algorithms (SM-2, FTS, etc.) |
