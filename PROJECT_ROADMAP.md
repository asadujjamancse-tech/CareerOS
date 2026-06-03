# Project Roadmap

This document describes the planned development direction for CareerOS after the v1.0.0 release.

Items are grouped by theme, not by priority. Priority will shift based on user feedback.

---

## Search & Discovery

- **Global search UI** — A command-palette–style search bar (Cmd/Ctrl+K) that searches all modules simultaneously and jumps directly to results
- **Tag-based filtering** — Filter list pages by one or more tags across any module
- **Cross-module relationships** — View all projects, certifications, and videos linked to a specific skill from the skill detail page

---

## Settings

- **App settings page** — Theme toggle (dark/light/system), default page size, date format preferences
- **Data export** — Export the entire database as JSON or ZIP archive for backup or migration
- **Data import** — Import from a previously exported archive
- **Database backup** — Scheduled automatic backup of `careeros.db` to a user-chosen location
- **Skill categories management** — Add, rename, reorder, and delete skill categories from within the UI

---

## Skills

- **Skill detail view** — Dedicated page showing all linked projects, certifications, videos, and occupations for a skill
- **Skill progression timeline** — Visualise how proficiency and status have changed over time using journal entries
- **Bulk skill import** — Import a list of skills from CSV or JSON

---

## Projects

- **Cover image upload** — Attach a cover image to a project for portfolio display
- **Project cover image display** — Show cover image prominently on the project card
- **Project timeline view** — Calendar or Gantt-style view of all projects by start/end date

---

## Career Journal

- **Calendar view** — Month/week view of journal entries with mood colour coding
- **Insights dashboard** — Weekly and monthly mood and energy trends
- **Streaks** — Track consecutive days with journal entries

---

## Videos

- **YouTube metadata fetch** — Automatically populate title, channel, duration, and thumbnail from a YouTube URL
- **Watch time tracking** — Log actual watch sessions to track total learning hours per skill

---

## Certifications

- **Expiry notifications** — System notification when a certificate is 30 or 7 days from expiry
- **Renewal reminders** — Mark certifications for renewal and track renewal progress

---

## Occupations

- **Skill gap report** — Given a target occupation, show which required skills you have and which you still need
- **Progress percentage** — Calculate overall readiness for an occupation based on acquired skills

---

## Performance & Reliability

- **Database integrity checks** — Run FTS5 rebuild and integrity check on app start (with user option)
- **Large dataset pagination** — Virtual scrolling for lists with thousands of items
- **Graceful offline handling** — Currently the app is always offline-first; ensure all error paths are handled gracefully

---

## Developer Experience

- **Unit tests** — Vitest tests for all service functions and Zod schemas
- **Integration tests** — IPC + database tests with an in-memory SQLite instance
- **E2E tests** — Playwright tests for critical user flows

---

## Platform

- **Auto-updater** — electron-updater integration for silent background updates
- **macOS native integration** — Dock badge for expiring certifications; menu bar shortcuts
- **Windows taskbar integration** — Jump list shortcuts to common actions

---

## Notes

Items on this roadmap are aspirational and subject to change. The project prioritises stability, data integrity, and a clean user experience over feature volume.

If you have a suggestion or want to contribute to any of these items, open an issue or pull request on GitHub.
