import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../ipc/channels'

function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>
}

const api = {
  app: {
    getVersion: () => invoke(IPC.APP.GET_VERSION),
    getPaths: () => invoke(IPC.APP.GET_PATHS),
  },

  skills: {
    getAll: (filters?: unknown) => invoke(IPC.SKILLS.GET_ALL, filters),
    getById: (id: string) => invoke(IPC.SKILLS.GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.SKILLS.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.SKILLS.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.SKILLS.DELETE, id),
  },

  skillCategories: {
    getAll: () => invoke(IPC.SKILL_CATEGORIES.GET_ALL),
    create: (data: unknown) => invoke(IPC.SKILL_CATEGORIES.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.SKILL_CATEGORIES.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.SKILL_CATEGORIES.DELETE, id),
  },

  occupations: {
    getAll: (filters?: unknown) => invoke(IPC.OCCUPATIONS.GET_ALL, filters),
    getById: (id: string) => invoke(IPC.OCCUPATIONS.GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.OCCUPATIONS.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.OCCUPATIONS.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.OCCUPATIONS.DELETE, id),
    skills: {
      get: (occupationId: string) => invoke(IPC.OCCUPATIONS.SKILLS.GET, occupationId),
      set: (occupationId: string, entries: Array<{ skill_id: string; importance: string }>) =>
        invoke(IPC.OCCUPATIONS.SKILLS.SET, occupationId, entries),
      update: (id: string, data: unknown) => invoke(IPC.OCCUPATIONS.SKILLS.UPDATE, id, data),
      remove: (id: string) => invoke(IPC.OCCUPATIONS.SKILLS.REMOVE, id),
    },
  },

  projects: {
    getAll: (filters?: unknown) => invoke(IPC.PROJECTS.GET_ALL, filters),
    getById: (id: string) => invoke(IPC.PROJECTS.GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.PROJECTS.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.PROJECTS.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.PROJECTS.DELETE, id),
  },

  projectAssets: {
    getAll: (projectId: string) => invoke(IPC.PROJECT_ASSETS.GET_ALL, projectId),
    create: (data: unknown) => invoke(IPC.PROJECT_ASSETS.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.PROJECT_ASSETS.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.PROJECT_ASSETS.DELETE, id),
    reorder: (projectId: string, ids: string[]) =>
      invoke(IPC.PROJECT_ASSETS.REORDER, projectId, ids),
  },

  certifications: {
    getAll: (filters?: unknown) => invoke(IPC.CERTIFICATIONS.GET_ALL, filters),
    getById: (id: string) => invoke(IPC.CERTIFICATIONS.GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.CERTIFICATIONS.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.CERTIFICATIONS.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.CERTIFICATIONS.DELETE, id),
  },

  videos: {
    getAll: (filters?: unknown) => invoke(IPC.VIDEOS.GET_ALL, filters),
    getById: (id: string) => invoke(IPC.VIDEOS.GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.VIDEOS.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.VIDEOS.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.VIDEOS.DELETE, id),
    updateProgress: (id: string, seconds: number) =>
      invoke(IPC.VIDEOS.UPDATE_PROGRESS, id, seconds),
  },

  notes: {
    getAll: (filters?: unknown) => invoke(IPC.NOTES.GET_ALL, filters),
    getById: (id: string) => invoke(IPC.NOTES.GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.NOTES.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.NOTES.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.NOTES.DELETE, id),
  },

  documents: {
    getAll: (filters?: unknown) => invoke(IPC.DOCUMENTS.GET_ALL, filters),
    getById: (id: string) => invoke(IPC.DOCUMENTS.GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.DOCUMENTS.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.DOCUMENTS.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.DOCUMENTS.DELETE, id),
    open: (id: string) => invoke(IPC.DOCUMENTS.OPEN, id),
  },

  journal: {
    getAll: (filters?: unknown) => invoke(IPC.JOURNAL.GET_ALL, filters),
    getById: (id: string) => invoke(IPC.JOURNAL.GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.JOURNAL.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.JOURNAL.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.JOURNAL.DELETE, id),
  },

  tags: {
    getAll: () => invoke(IPC.TAGS.GET_ALL),
    create: (data: unknown) => invoke(IPC.TAGS.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.TAGS.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.TAGS.DELETE, id),
    getEntityTags: (entityType: string, entityId: string) =>
      invoke(IPC.TAGS.GET_ENTITY_TAGS, entityType, entityId),
    setEntityTags: (entityType: string, entityId: string, tagIds: string[]) =>
      invoke(IPC.TAGS.SET_ENTITY_TAGS, entityType, entityId, tagIds),
  },

  search: {
    global: (query: string) => invoke(IPC.SEARCH.GLOBAL, query),
    module: (module: string, query: string) => invoke(IPC.SEARCH.MODULE, module, query),
  },

  storage: {
    importFile: (options: unknown) => invoke(IPC.STORAGE.IMPORT_FILE, options),
    openFile: (filePath: string) => invoke(IPC.STORAGE.OPEN_FILE, filePath),
    showInFolder: (filePath: string) => invoke(IPC.STORAGE.SHOW_IN_FOLDER, filePath),
  },
} as const

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
