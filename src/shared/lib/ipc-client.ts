import type { CareerOsApi } from '../types/ipc.types'
import type { IpcResult, PaginatedResult } from '../types/common.types'
import { isElectron } from './platform'

// ── Null Object helpers ────────────────────────────────────────────────────────

function ok<T>(data: T): IpcResult<T> {
  return { success: true, data }
}

function browserOnly<T = void>(): Promise<IpcResult<T>> {
  return Promise.resolve({
    success: false as const,
    error: 'This feature requires the CareerOS desktop app.',
    code: 'BROWSER_MODE',
  })
}

function emptyPage<T>(): PaginatedResult<T> {
  return { items: [], total: 0, page: 1, pageSize: 24, totalPages: 0 }
}

// ── NullApi — safe fallback for all browser environments ─────────────────────
//
// Every read returns a successful empty result so pages render their empty
// state rather than an error state.  Every write returns a soft failure with
// a user-friendly message so forms show "requires desktop app" instead of
// crashing.

const nullApi: CareerOsApi = {
  app: {
    getVersion: () => Promise.resolve(ok('1.0.0')),
    getPaths:   () => browserOnly(),
  },

  skills: {
    getAll:   () => Promise.resolve(ok(emptyPage())),
    getById:  () => browserOnly(),
    create:   () => browserOnly(),
    update:   () => browserOnly(),
    delete:   () => browserOnly(),
  },

  skillCategories: {
    getAll:  () => Promise.resolve(ok([])),
    create:  () => browserOnly(),
    update:  () => browserOnly(),
    delete:  () => browserOnly(),
  },

  occupations: {
    getAll:   () => Promise.resolve(ok(emptyPage())),
    getById:  () => browserOnly(),
    create:   () => browserOnly(),
    update:   () => browserOnly(),
    delete:   () => browserOnly(),
    skills: {
      get:    () => Promise.resolve(ok([])),
      set:    () => browserOnly(),
      update: () => browserOnly(),
      remove: () => browserOnly(),
    },
  },

  projects: {
    getAll:   () => Promise.resolve(ok(emptyPage())),
    getById:  () => browserOnly(),
    create:   () => browserOnly(),
    update:   () => browserOnly(),
    delete:   () => browserOnly(),
  },

  projectAssets: {
    getAll:   () => Promise.resolve(ok([])),
    create:   () => browserOnly(),
    update:   () => browserOnly(),
    delete:   () => browserOnly(),
    reorder:  () => browserOnly(),
  },

  certifications: {
    getAll:   () => Promise.resolve(ok(emptyPage())),
    getById:  () => browserOnly(),
    create:   () => browserOnly(),
    update:   () => browserOnly(),
    delete:   () => browserOnly(),
  },

  videos: {
    getAll:          () => Promise.resolve(ok(emptyPage())),
    getById:         () => browserOnly(),
    create:          () => browserOnly(),
    update:          () => browserOnly(),
    delete:          () => browserOnly(),
    updateProgress:  () => browserOnly(),
  },

  notes: {
    getAll:   () => Promise.resolve(ok(emptyPage())),
    getById:  () => browserOnly(),
    create:   () => browserOnly(),
    update:   () => browserOnly(),
    delete:   () => browserOnly(),
  },

  documents: {
    getAll:   () => Promise.resolve(ok(emptyPage())),
    getById:  () => browserOnly(),
    create:   () => browserOnly(),
    update:   () => browserOnly(),
    delete:   () => browserOnly(),
    open:     () => browserOnly(),
  },

  journal: {
    getAll:   () => Promise.resolve(ok(emptyPage())),
    getById:  () => browserOnly(),
    create:   () => browserOnly(),
    update:   () => browserOnly(),
    delete:   () => browserOnly(),
  },

  tags: {
    getAll:         () => Promise.resolve(ok([])),
    create:         () => browserOnly(),
    update:         () => browserOnly(),
    delete:         () => browserOnly(),
    getEntityTags:  () => Promise.resolve(ok([])),
    setEntityTags:  () => browserOnly(),
  },

  search: {
    global: () => Promise.resolve(ok([])),
    module: () => Promise.resolve(ok([])),
  },

  storage: {
    importFile:     () => browserOnly(),
    openFile:       () => browserOnly(),
    showInFolder:   () => browserOnly(),
  },
}

// ── Export ────────────────────────────────────────────────────────────────────
//
// In Electron  → window.api is set by contextBridge before React boots.
// In a browser → window.api is undefined; use the null implementation above.

export const api: CareerOsApi = isElectron ? window.api : nullApi
