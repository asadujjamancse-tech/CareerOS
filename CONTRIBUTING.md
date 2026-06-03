# Contributing to CareerOS

Thank you for your interest in contributing. This document covers how to set up a development environment, the coding standards the project follows, and how to submit changes.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Code Standards](#code-standards)
4. [Making Changes](#making-changes)
5. [Submitting a Pull Request](#submitting-a-pull-request)
6. [Reporting Issues](#reporting-issues)

---

## Development Setup

### Requirements

- Node.js 18 or later
- npm 9 or later
- Git

### Steps

```bash
# 1. Fork and clone
git clone https://github.com/asadujjamancse-tech/careeros.git
cd careeros

# 2. Install dependencies (also rebuilds better-sqlite3 for your platform)
npm install

# 3. Start the app in development mode
npm run dev
```

If the app fails to start on macOS due to a native module error:

```bash
npm run rebuild
npm run dev
```

### Useful Commands

```bash
npm run typecheck     # TypeScript type checking (both main and renderer)
npm run lint          # ESLint with zero-warnings policy
npm run build         # Full production build
```

---

## Project Structure

The codebase has two distinct sides with different environments:

| Directory | Process | Environment |
|---|---|---|
| `electron/` | Main process | Node.js (privileged) |
| `src/` | Renderer process | Browser (sandboxed) |
| `electron/preload/` | Preload script | Electron context bridge |

### Adding a Feature to an Existing Module

Each module follows this structure:

```
src/features/<module>/
├── components/<Module>Page.tsx    # All UI: page, card, form, delete dialog
├── schemas/<entity>.schema.ts     # Zod validation schema + form defaults
├── store/<entity>.store.ts        # Zustand store
└── types/<entity>.types.ts        # Local TypeScript interfaces
```

The corresponding backend is in:

```
electron/services/<module>/<module>.service.ts
electron/ipc/<module>.ipc.ts
```

### Adding a New Module

1. Create the database table in a new migration file:
   `electron/services/database/migrations/005_<name>.ts`

2. Register the migration in `electron/services/database/migrations/runner.ts`

3. Create the service: `electron/services/<module>/<module>.service.ts`

4. Create IPC handlers: `electron/ipc/<module>.ipc.ts`

5. Register IPC handlers in `electron/ipc/index.ts`

6. Expose the API in `electron/preload/index.ts`

7. Add the interface to `src/shared/types/ipc.types.ts`

8. Create the renderer feature module (types, schema, store, component)

9. Add a route in `src/app/Router.tsx`

10. Add a nav link in `src/shared/components/layout/Sidebar.tsx`

---

## Code Standards

### TypeScript

- Strict mode is enabled (`"strict": true` in all tsconfig files)
- No `any` types — use `unknown` and narrow explicitly
- All IPC handlers and service functions must have explicit return types
- All form values must be validated with Zod before being passed to the service layer

### IPC

- All IPC channels must be declared in `electron/ipc/channels.ts`
- All handlers must return `ok(data)` or `fail(message, code)` — no exceptions thrown to the renderer
- Validate all inputs in the IPC handler before calling the service

### Database

- Use soft deletes (`deleted_at`) on entity tables — never hard-delete user data
- All queries must filter `WHERE deleted_at IS NULL` for active records
- New tables need corresponding FTS5 virtual tables and triggers if they contain searchable text
- New columns with enum constraints must use `CHECK` constraints
- Every foreign key column must have an index

### UI / Components

- Follow the existing module pattern: list page → card grid → Sheet form → confirm dialog
- Use the shared components in `src/shared/components/` — do not duplicate
- All pages must have loading states, empty states, and error states
- Use the `Button`, `Input`, `Select`, `Sheet`, `Dialog` components from `src/shared/components/ui/`
- Forms use React Hook Form + Zod resolvers

### Style

- Tailwind CSS only — no custom CSS except `src/styles/globals.css`
- Follow the existing colour and spacing conventions
- Use the CSS variables defined in `globals.css` for theming compatibility

---

## Making Changes

### Branch naming

```
feature/short-description
fix/short-description
docs/short-description
refactor/short-description
```

### Commit messages

Use the imperative mood and keep the subject line under 72 characters:

```
Add expiry warning badge to certifications card
Fix pagination not resetting when filter changes
Update architecture documentation to reflect v1 state
```

---

## Submitting a Pull Request

1. Ensure `npm run typecheck` passes with zero errors
2. Ensure `npm run lint` passes with zero warnings
3. Ensure `npm run build` succeeds
4. Write a clear PR description covering what changed and why
5. Reference any related issues with `Fixes #123` or `Relates to #456`

---

## Reporting Issues

Open an issue on GitHub with:

- A clear title describing the problem
- Steps to reproduce
- Expected behaviour
- Actual behaviour
- Your OS and version
- Any relevant error messages from the DevTools console (open with `Ctrl+Shift+I` / `Cmd+Option+I`)
