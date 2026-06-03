# CareerOS

A local-first desktop application for IT professionals to manage their skills, projects, certifications, learning videos, notes, documents, and career journal — all stored privately on your own machine.

Built with Electron, React, TypeScript, and SQLite.

---

## Features

### Skills
- Track skills with proficiency levels (Beginner → Expert) and learning status (Learning → Mastered)
- Organise into categories (Languages, Frontend, Backend, DevOps, AI/ML, etc.)
- Link skills to projects, certifications, occupations, and videos
- Full-text search across all skill content

### Occupations
- Define career targets or current roles
- Map required skills with importance levels (Critical / Important / Nice-to-have)
- Track which required skills you have already acquired
- Filter by seniority level and status

### Projects
- Portfolio and personal project tracking with status (Planning → Completed)
- Attach assets: screenshots, documents, links, and demo URLs
- Link the tech stack and skills used
- Mark featured projects for portfolio visibility
- Repository and live URL fields

### Certifications
- Store credentials with issue and expiry dates
- Expiry warnings for certificates expiring within 90 days
- Upload certificate files (PDF, images)
- Link related skills to each certification

### Videos
- Save learning videos from YouTube, Udemy, Coursera, Vimeo, Pluralsight, or local files
- Track watch status: Unwatched / Watching / Completed / Revisit
- Link skills covered in each video
- Filter by source platform and watch status

### Notes
- Capture meeting notes, research, tutorials, ideas, and reference material
- Pin important notes to the top
- Full-text search across all notes content
- Filter by note type

### Documents
- Import PDF, Word, text, and image files into the app
- Categorise as Resume, Cover Letter, Certificate, Report, Template, or Reference
- Open files with your system's default application
- Version tracking

### Career Journal
- Daily entries with mood and energy level tracking
- Categories: Achievement, Challenge, Reflection, Learning, Goal, Feedback
- Private entries flag
- Full-text search across journal content

### Tags
- Create colour-coded tags
- Apply tags across any module (skills, projects, notes, etc.)
- Global cross-module filtering

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Electron](https://www.electronjs.org/) v41 |
| UI framework | [React](https://react.dev/) 18 + [TypeScript](https://www.typescriptlang.org/) 5 (strict) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + Radix UI |
| State management | [Zustand](https://zustand-demo.pmnd.rs/) |
| Forms & validation | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Database | [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Full-text search | SQLite FTS5 |
| Build tooling | [electron-vite](https://electron-vite.org/) + [electron-builder](https://www.electron.build/) |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- npm 9 or later
- macOS, Windows, or Linux

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/asadujjamancse-tech/careeros.git
cd careeros
```

### 2. Install dependencies

```bash
npm install
```

The `postinstall` script automatically rebuilds the `better-sqlite3` native module for your Electron version.

### 3. Start in development mode

```bash
npm run dev
```

This starts the Electron app with hot-reloading via electron-vite.

> **macOS note:** If the app fails to start with a Node.js error, run:
> ```bash
> npm run rebuild
> ```
> This rebuilds the native SQLite module for your exact platform and Electron version.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start in development mode (hot reload) |
| `npm run build` | Build the production bundle |
| `npm run typecheck` | Run TypeScript type checking (both processes) |
| `npm run lint` | Run ESLint (zero warnings policy) |
| `npm run rebuild` | Rebuild native modules for current Electron version |
| `npm run package` | Package into unpacked directory (testing) |
| `npm run package:mac` | Build distributable DMG for macOS (arm64 + x64) |
| `npm run package:win` | Build NSIS installer for Windows (x64) |
| `npm run package:linux` | Build AppImage for Linux (x64) |

---

## Data Storage

All data is stored locally on your machine. CareerOS never makes network requests.

| What | Where |
|---|---|
| Database | `~/CareerOS/careeros.db` (SQLite) |
| Uploaded files | `~/CareerOS/attachments/` |

**Backup:** Copy the `~/CareerOS/` directory to back up all your data.

---

## Architecture

CareerOS uses a clean separation between the Electron main process (privileged — owns the database and file system) and the renderer process (sandboxed React app). They communicate exclusively through a typed IPC bridge.

```
Renderer (React) ←→ Preload (contextBridge) ←→ Main (Node.js) ←→ SQLite
```

See [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) for the full architecture document.

See [docs/database/DATABASE.md](docs/database/DATABASE.md) for the complete database schema, indexes, full-text search setup, and migration strategy.

---

## Project Structure

```
careeros/
├── electron/           # Main process (Node.js)
│   ├── main/           # App entry, window management
│   ├── preload/        # IPC bridge (contextBridge)
│   ├── ipc/            # IPC handlers for each module
│   └── services/       # Database, migrations, business logic
├── src/                # Renderer process (React)
│   ├── app/            # Router, root component
│   ├── features/       # One folder per module (skills, projects, etc.)
│   └── shared/         # Shared components, types, utilities
└── docs/               # Architecture and feature documentation
```

---

## Contributing

Contributions, bug reports, and feature suggestions are welcome.

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on setting up a development environment and submitting pull requests.

---

## Roadmap

See [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) for planned features and future development direction.

---

## License

[MIT](LICENSE)
