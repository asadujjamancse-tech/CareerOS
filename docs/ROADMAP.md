# CareerOS Roadmap

Based on reading the actual codebase, gaps identified in the product review, and natural progression from the current architecture.

---

## v1.0 — Stabilization

**Goal:** Make what exists production-solid before adding new features. Fix gaps, add tests, and polish existing modules.

| Feature | Priority | Effort | Impact | Notes |
|---|---|---|---|---|
| Test suite for service layer | Critical | High | High | `vitest` is installed but unused; start with database services |
| Pagination for Skills, Videos, Notes, Projects | High | Medium | High | Occupations already has this pattern; replicate it |
| Empty state components for all modules | High | Low | Medium | Improve first-run experience |
| Confirmation dialogs on hard-delete operations | High | Low | Medium | Whiteboard, Code Workspace, Markdown Workspace |
| Error state rendering in all list components | High | Low | Medium | Zustand error state is set but may not render in all views |
| Database index audit | High | Medium | High | Add indexes for `deleted_at`, `challenge_date`, `session_date` |
| Tags support in Skills and Projects | Medium | Medium | Medium | `entity_tags` table supports it; service/IPC missing |
| Document two knowledge graph concepts in UI | Medium | Low | Medium | Add tooltip or info text distinguishing auto vs. curated graphs |
| Consistent ID naming convention | Low | Low | Low | Document and enforce either plain nanoid or prefixed IDs |
| Unify soft-delete strategy | Low | Medium | Low | Document which entities need soft-delete vs. hard-delete |
| Fix `noUncheckedIndexedAccess` edge cases | Low | Low | Low | Review array accesses in service functions |

---

## v2.0 — AI Integration

**Goal:** Replace the heuristic AI Coach with real AI-powered intelligence using the Claude API. Add smart content generation throughout the app.

| Feature | Priority | Effort | Impact | Notes |
|---|---|---|---|---|
| Claude API integration for AI Coach | Critical | High | High | Replace heuristic scoring with natural language coaching |
| AI-generated daily study plan | High | Medium | High | Claude generates a prioritized plan from roadmap data |
| Smart interview question generation | High | Medium | High | Generate new questions from a skill or topic using Claude |
| AI-assisted Feynman explanation review | High | Medium | High | Claude evaluates the explanation and identifies real gaps |
| Auto-tag content using AI | Medium | Medium | Medium | AI suggests tags when creating skills, notes, or projects |
| AI-generated scenario creation | Medium | High | High | Generate realistic IT scenarios from a topic and difficulty |
| Smart SRS card generation from notes | Medium | Medium | Medium | Claude extracts Q&A pairs from notes or documents |
| Career advice chat interface | Medium | High | High | Conversational AI coaching panel in Career Intelligence |
| Job description skill extraction | Low | Medium | High | Paste a job posting; AI extracts required skills |

> See [claude-api skill](../docs/architecture/) for Claude API integration patterns. Use `claude-sonnet-4-6` for performance/cost balance; `claude-opus-4-5` for complex reasoning tasks.

---

## v3.0 — Data Portability

**Goal:** Users can export their data for external use and import from common sources.

| Feature | Priority | Effort | Impact | Notes |
|---|---|---|---|---|
| Export career portfolio as PDF | Critical | High | High | Skills, certifications, projects rendered as a professional resume |
| Export individual modules to CSV | High | Medium | High | Skills list, SRS cards, interview questions |
| Export full database as JSON | High | Low | High | Complete data backup in portable format |
| Import SRS cards from Anki CSV | High | Medium | Medium | Enable migration from existing Anki decks |
| Import skills from JSON/CSV | High | Low | Medium | Bulk skill import |
| Import certifications from Credly | Medium | High | Medium | Requires Credly API or badge URL parsing |
| Export roadmap as shareable PDF | Medium | Medium | Medium | Visual career plan document |
| Export Markdown documents to HTML | Medium | Low | Low | Already using react-markdown; render to static HTML |
| Backup/restore the full SQLite database via UI | Critical | Low | High | Expose Electron file dialog for database copy/paste |

---

## v4.0 — Collaboration and Cloud

**Goal:** Optional cloud sync and sharing features. Local-first must remain the default.

| Feature | Priority | Effort | Impact | Notes |
|---|---|---|---|---|
| Optional encrypted cloud sync | Critical | Very High | High | Local-first remains default; sync is opt-in |
| Multi-device sync via local network | High | High | High | Sync over LAN without cloud; lower privacy risk |
| Shareable skill portfolio page | High | High | Medium | Public URL showing selected skills/projects/certs |
| Team/mentor sharing | Medium | Very High | Medium | Share learning paths with a mentor who can comment |
| Community scenario library | Medium | High | High | Import/export scenarios in standardized JSON format |
| Community challenge packs | Medium | Medium | Medium | Import challenge sets curated for specific certifications |
| Organization admin view | Low | Very High | Low | For bootcamps/training programs managing student CareerOS instances |

---

## Ongoing / Cross-Version

These items should be continuously addressed regardless of version:

| Feature | Notes |
|---|---|
| Performance testing at scale | Test with 1000+ skills, 500+ videos, 50+ documents |
| Accessibility (WCAG 2.1 AA) | Keyboard navigation, screen reader support, focus management |
| Keyboard shortcut system | Global shortcuts (Cmd+K for search, etc.) |
| OS notification integration | SRS due reminders, challenge streak warnings |
| Auto-update mechanism | Electron's built-in auto-updater |
| Crash reporting | Opt-in anonymous crash logs |
| Localization foundation | Externalize strings for future i18n |

---

## Effort Key

| Label | Meaning |
|---|---|
| Low | 1–3 days |
| Medium | 1–2 weeks |
| High | 2–6 weeks |
| Very High | 6+ weeks or requires external service |
