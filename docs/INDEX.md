# CareerOS Documentation Index

This is the master navigation page for all CareerOS documentation. Every file is listed with a one-line description and the key questions it answers.

---

## Top-Level Documents

| File | Description | Answers |
|---|---|---|
| [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) | High-level introduction to CareerOS, its purpose, and core design principles | What is this app? What problem does it solve? |
| [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) | Complete inventory of all features across all modules | What does the app do? What is included in v1.0? |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Setup, build commands, folder structure, and step-by-step guide to adding a new module | How do I run this? How do I add a feature? |
| [USER_GUIDE.md](USER_GUIDE.md) | End-user documentation for all modules written in plain English | How do I use this app? What does each module do? |
| [PRODUCT_REVIEW.md](PRODUCT_REVIEW.md) | Senior-level technical analysis of strengths, weaknesses, debt, risks, and opportunities | What is done well? What are the gaps? Is this production-ready? |
| [ROADMAP.md](ROADMAP.md) | Versioned feature roadmap (v1.0 stabilization → v2.0 AI → v3.0 portability → v4.0 cloud) | What is planned? What comes next? |
| [PROJECT_HISTORY.md](PROJECT_HISTORY.md) | Evolution trace through all 18 migrations, architectural decisions, and design philosophy | How did this get here? Why were these choices made? What must not change? |
| [PDF_READER.md](PDF_READER.md) | Documentation for the PDF reader and knowledge vault reading features | How does PDF reading and annotation work? |

---

## Architecture

| File | Description | Answers |
|---|---|---|
| [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) | System architecture: Electron layers, IPC model, React structure, data flow | How is the app structured? How does data flow between layers? |
| [database/DATABASE.md](database/DATABASE.md) | SQLite schema overview, migration system, and database design patterns | What tables exist? How does the migration runner work? |

---

## Module Documentation

Each module document covers: Purpose, Features, Database Tables, IPC Channels, Service Functions, State Management, Data Flow (Mermaid), UI Components, Dependencies, User Workflow, Known Limitations, and Future Roadmap.

### Core Data Modules

| File | Module | Answers |
|---|---|---|
| [modules/skills.md](modules/skills.md) | Skills | How are skills tracked? What are proficiency levels and statuses? |
| [modules/projects.md](modules/projects.md) | Projects | How are projects recorded? How are assets managed? |
| [modules/certifications.md](modules/certifications.md) | Certifications | How are certifications tracked through their lifecycle? |
| [modules/videos.md](modules/videos.md) | Videos | How are learning videos tracked with watch progress? |
| [modules/notes.md](modules/notes.md) | Notes | How are rich-text notes created and linked to skills? |
| [modules/documents.md](modules/documents.md) | Documents | How are PDF and DOCX files stored and viewed? |
| [modules/journal.md](modules/journal.md) | Journal | How does the career journal and daily reflection work? |
| [modules/occupations.md](modules/occupations.md) | Occupations | How are target job roles and required skill maps managed? |
| [modules/tags.md](modules/tags.md) | Tags | How does the cross-entity tagging system work? |

### Learning Modules

| File | Module | Answers |
|---|---|---|
| [modules/skill-hub.md](modules/skill-hub.md) | Skill Hub | What is the per-skill deep-dive view? How are learning modules organized? |
| [modules/learning-dashboard.md](modules/learning-dashboard.md) | Learning Dashboard | What does the dashboard aggregate? What reports are available? |
| [modules/learning-coach.md](modules/learning-coach.md) | Learning Coach | How do learning paths, dependencies, and retention tracking work? |
| [modules/srs-system.md](modules/srs-system.md) | SRS (Spaced Repetition) | How does the SM-2 flashcard system work? How are cards reviewed? |
| [modules/playlists.md](modules/playlists.md) | Playlists | How are video playlists created and tracked? |

### Practice and Career Planning

| File | Module | Answers |
|---|---|---|
| [modules/home-labs.md](modules/home-labs.md) | Home Labs | How are lab environments and exercises tracked? |
| [modules/interview-bank.md](modules/interview-bank.md) | Interview Questions | How is the interview question bank organized and reviewed? |
| [modules/career-intelligence.md](modules/career-intelligence.md) | Career Intelligence | How do roadmaps, skill progress, study sessions, and the AI Coach work? |
| [modules/ai-coach.md](modules/ai-coach.md) | AI Coach | What does the coach compute? How is the readiness score calculated? |
| [modules/challenges.md](modules/challenges.md) | Challenges | How are daily/weekly challenges generated and tracked? |
| [modules/scenarios.md](modules/scenarios.md) | Scenarios + Feynman | How do practice scenarios and Feynman technique entries work? |

### Knowledge Management

| File | Module | Answers |
|---|---|---|
| [modules/knowledge-vault.md](modules/knowledge-vault.md) | Knowledge Vault | How are PDF documents organized into collections with annotations? |
| [modules/knowledge-graph.md](modules/knowledge-graph.md) | Knowledge Graph | How does the user-curated visual knowledge map work? |
| [modules/markdown-workspace.md](modules/markdown-workspace.md) | Markdown Workspace | How does the in-app Markdown editor and version history work? |
| [modules/code-workspace.md](modules/code-workspace.md) | Code Workspace | How does the Monaco code editor and file tree work? |
| [modules/whiteboard.md](modules/whiteboard.md) | Whiteboard | How do free-form drawing canvases work? |

### Infrastructure Modules

| File | Module | Answers |
|---|---|---|
| [modules/search.md](modules/search.md) | Global Search | How does FTS5 search work across all modules? What is indexed? |
| [modules/workspace.md](modules/workspace.md) | Workspace | How does the dockview multi-panel layout work? |

---

## Quick Reference

### "How do I...?" Guide

| Question | Where to Look |
|---|---|
| Add a new module from scratch | [DEVELOPER_GUIDE.md — How to Add a New Module](DEVELOPER_GUIDE.md#how-to-add-a-new-module) |
| Understand the IPC pattern | [DEVELOPER_GUIDE.md — IPC Pattern Reference](DEVELOPER_GUIDE.md#ipc-pattern-reference) |
| Write a new database migration | [DEVELOPER_GUIDE.md — Migration Naming Convention](DEVELOPER_GUIDE.md#migration-naming-convention) |
| Understand data flow in any module | Each module doc — Data Flow section (Mermaid diagrams) |
| Find all IPC channel names | [electron/ipc/channels.ts](../electron/ipc/channels.ts) |
| Understand the AI Coach scoring | [modules/ai-coach.md](modules/ai-coach.md) |
| See what exists vs. what is planned | [ROADMAP.md](ROADMAP.md) |
| Evaluate risks before shipping | [PRODUCT_REVIEW.md](PRODUCT_REVIEW.md) |
| Explain the app to a new user | [USER_GUIDE.md](USER_GUIDE.md) |
| Understand architectural decisions | [PROJECT_HISTORY.md — Key Architectural Decisions](PROJECT_HISTORY.md#key-architectural-decisions) |

---

## Documentation Statistics

- **Top-level documents:** 8
- **Architecture documents:** 2
- **Module documents:** 27
- **Total documentation files:** 37
