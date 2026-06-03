export const IPC = {
  APP: {
    GET_VERSION: 'app:get-version',
    GET_PATHS: 'app:get-paths',
  },
  SKILLS: {
    GET_ALL: 'skills:get-all',
    GET_BY_ID: 'skills:get-by-id',
    CREATE: 'skills:create',
    UPDATE: 'skills:update',
    DELETE: 'skills:delete',
  },
  SKILL_CATEGORIES: {
    GET_ALL: 'skill-categories:get-all',
    CREATE: 'skill-categories:create',
    UPDATE: 'skill-categories:update',
    DELETE: 'skill-categories:delete',
  },
  OCCUPATIONS: {
    GET_ALL: 'occupations:get-all',
    GET_BY_ID: 'occupations:get-by-id',
    CREATE: 'occupations:create',
    UPDATE: 'occupations:update',
    DELETE: 'occupations:delete',
    SKILLS: {
      GET: 'occupations:skills:get',
      SET: 'occupations:skills:set',
      UPDATE: 'occupations:skills:update',
      REMOVE: 'occupations:skills:remove',
    },
  },
  PROJECTS: {
    GET_ALL: 'projects:get-all',
    GET_BY_ID: 'projects:get-by-id',
    CREATE: 'projects:create',
    UPDATE: 'projects:update',
    DELETE: 'projects:delete',
  },
  PROJECT_ASSETS: {
    GET_ALL: 'project-assets:get-all',
    CREATE: 'project-assets:create',
    UPDATE: 'project-assets:update',
    DELETE: 'project-assets:delete',
    REORDER: 'project-assets:reorder',
  },
  CERTIFICATIONS: {
    GET_ALL: 'certifications:get-all',
    GET_BY_ID: 'certifications:get-by-id',
    CREATE: 'certifications:create',
    UPDATE: 'certifications:update',
    DELETE: 'certifications:delete',
  },
  VIDEOS: {
    GET_ALL: 'videos:get-all',
    GET_BY_ID: 'videos:get-by-id',
    CREATE: 'videos:create',
    UPDATE: 'videos:update',
    DELETE: 'videos:delete',
    UPDATE_PROGRESS: 'videos:update-progress',
  },
  NOTES: {
    GET_ALL: 'notes:get-all',
    GET_BY_ID: 'notes:get-by-id',
    CREATE: 'notes:create',
    UPDATE: 'notes:update',
    DELETE: 'notes:delete',
  },
  DOCUMENTS: {
    GET_ALL: 'documents:get-all',
    GET_BY_ID: 'documents:get-by-id',
    CREATE: 'documents:create',
    UPDATE: 'documents:update',
    DELETE: 'documents:delete',
    OPEN: 'documents:open',
  },
  JOURNAL: {
    GET_ALL: 'journal:get-all',
    GET_BY_ID: 'journal:get-by-id',
    CREATE: 'journal:create',
    UPDATE: 'journal:update',
    DELETE: 'journal:delete',
  },
  TAGS: {
    GET_ALL: 'tags:get-all',
    CREATE: 'tags:create',
    UPDATE: 'tags:update',
    DELETE: 'tags:delete',
    GET_ENTITY_TAGS: 'tags:get-entity-tags',
    SET_ENTITY_TAGS: 'tags:set-entity-tags',
  },
  SEARCH: {
    GLOBAL: 'search:global',
    MODULE: 'search:module',
  },
  STORAGE: {
    IMPORT_FILE: 'storage:import-file',
    OPEN_FILE: 'storage:open-file',
    SHOW_IN_FOLDER: 'storage:show-in-folder',
  },
} as const

export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export function ok<T>(data: T): IpcResult<T> {
  return { success: true, data }
}

export function fail(error: string, code?: string): IpcResult<never> {
  const result: { success: false; error: string; code?: string } = { success: false, error }
  if (code !== undefined) result.code = code
  return result
}
