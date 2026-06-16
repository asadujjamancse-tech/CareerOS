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
    RENAME: 'documents:rename',
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
    HISTORY: {
      GET:   'search:history:get',
      CLEAR: 'search:history:clear',
    },
  },
  STORAGE: {
    IMPORT_FILE:   'storage:import-file',
    IMPORT_FILES:  'storage:import-files',
    OPEN_FILE:     'storage:open-file',
    SHOW_IN_FOLDER:'storage:show-in-folder',
  },
  CAREER_INTELLIGENCE: {
    ROADMAPS: {
      GET_ALL: 'career:roadmaps:get-all',
      GET_BY_ID: 'career:roadmaps:get-by-id',
      CREATE: 'career:roadmaps:create',
      UPDATE: 'career:roadmaps:update',
      DELETE: 'career:roadmaps:delete',
      SET_SKILLS: 'career:roadmaps:set-skills',
      SET_CERTIFICATIONS: 'career:roadmaps:set-certifications',
      SET_PROJECTS: 'career:roadmaps:set-projects',
      SET_MILESTONES: 'career:roadmaps:set-milestones',
      TOGGLE_MILESTONE: 'career:roadmaps:toggle-milestone',
    },
    SKILL_PROGRESS: {
      GET_ALL: 'career:skill-progress:get-all',
      UPSERT: 'career:skill-progress:upsert',
    },
    STUDY_SESSIONS: {
      GET_ALL: 'career:study-sessions:get-all',
      LOG: 'career:study-sessions:log',
      DELETE: 'career:study-sessions:delete',
    },
    COACH: {
      GET_RECOMMENDATIONS: 'career:coach:get-recommendations',
    },
    KNOWLEDGE_GRAPH: {
      GET: 'career:knowledge-graph:get',
    },
    ANALYTICS: {
      GET_DASHBOARD: 'career:analytics:get-dashboard',
    },
  },
  HOME_LABS: {
    GET_ALL: 'home-labs:get-all',
    GET_BY_ID: 'home-labs:get-by-id',
    CREATE: 'home-labs:create',
    UPDATE: 'home-labs:update',
    DELETE: 'home-labs:delete',
    TASKS: {
      CREATE: 'home-labs:tasks:create',
      UPDATE: 'home-labs:tasks:update',
      DELETE: 'home-labs:tasks:delete',
    },
    PROBLEMS: {
      CREATE: 'home-labs:problems:create',
      UPDATE: 'home-labs:problems:update',
      DELETE: 'home-labs:problems:delete',
    },
    TIME: {
      LOG: 'home-labs:time:log',
      DELETE: 'home-labs:time:delete',
      GET_ALL: 'home-labs:time:get-all',
    },
    ASSETS: {
      CREATE: 'home-labs:assets:create',
      UPDATE: 'home-labs:assets:update',
      DELETE: 'home-labs:assets:delete',
    },
  },
  INTERVIEW_QUESTIONS: {
    GET_ALL: 'interview:questions:get-all',
    GET_BY_ID: 'interview:questions:get-by-id',
    CREATE: 'interview:questions:create',
    UPDATE: 'interview:questions:update',
    DELETE: 'interview:questions:delete',
    GET_RANDOM: 'interview:questions:get-random',
    RECORD_REVIEW: 'interview:questions:record-review',
    GET_PROGRESS: 'interview:questions:get-progress',
  },
  INTERVIEW_CATEGORIES: {
    GET_ALL: 'interview:categories:get-all',
    CREATE: 'interview:categories:create',
    UPDATE: 'interview:categories:update',
    DELETE: 'interview:categories:delete',
  },
  LEARNING_DASHBOARD: {
    GET_DASHBOARD: 'learning-dashboard:get',
    GET_WEEKLY_REPORT: 'learning-dashboard:weekly-report',
    GET_MONTHLY_REPORT: 'learning-dashboard:monthly-report',
  },

  LEARNING_COACH: {
    LEARNING_PATHS: {
      GET_ALL:    'lc:paths:get-all',
      GET_BY_ID:  'lc:paths:get-by-id',
      CREATE:     'lc:paths:create',
      UPDATE:     'lc:paths:update',
      DELETE:     'lc:paths:delete',
      SET_SKILLS: 'lc:paths:set-skills',
    },
    SKILL_METHODS: {
      GET_ALL:      'lc:methods:get-all',
      GET_BY_SKILL: 'lc:methods:get-by-skill',
      UPSERT:       'lc:methods:upsert',
    },
    RETENTION: {
      GET_ALL:       'lc:retention:get-all',
      GET_DUE:       'lc:retention:get-due',
      UPSERT:        'lc:retention:upsert',
      RECORD_REVIEW: 'lc:retention:record-review',
      GET_LOGS:      'lc:retention:get-logs',
    },
    STUDY_PLANS: {
      GET_ALL:        'lc:plans:get-all',
      GET_BY_ID:      'lc:plans:get-by-id',
      GENERATE:       'lc:plans:generate',
      DELETE:         'lc:plans:delete',
      MARK_ITEM_DONE: 'lc:plans:mark-item-done',
    },
    DEPENDENCIES: {
      GET_ALL:   'lc:deps:get-all',
      ADD:       'lc:deps:add',
      REMOVE:    'lc:deps:remove',
      GET_GRAPH: 'lc:deps:get-graph',
    },
    EFFECTIVENESS: {
      GET_METRICS: 'lc:effectiveness:get-metrics',
    },
  },

  SRS: {
    GET_DUE:            'srs:get-due',
    GET_UPCOMING:       'srs:get-upcoming',
    GET_ALL:            'srs:get-all',
    GET_BY_ID:          'srs:get-by-id',
    CREATE:             'srs:create',
    UPDATE:             'srs:update',
    RECORD_REVIEW:      'srs:record-review',
    DELETE:             'srs:delete',
    GET_REVIEW_HISTORY: 'srs:get-review-history',
    GET_STATS:          'srs:get-stats',
    BULK_FROM_INTERVIEW:'srs:bulk-from-interview',
    BULK_FROM_NOTES:    'srs:bulk-from-notes',
  },
  ANNOTATIONS: {
    GET_BY_DOCUMENT:          'annotations:get-by-document',
    CREATE:                   'annotations:create',
    UPDATE:                   'annotations:update',
    DELETE:                   'annotations:delete',
    DELETE_BY_DOCUMENT:       'annotations:delete-by-document',
    GET_READING_PROGRESS:     'annotations:get-reading-progress',
    UPDATE_READING_PROGRESS:  'annotations:update-reading-progress',
    GET_READING_STATS:        'annotations:get-reading-stats',
  },
  KNOWLEDGE_COLORS: {
    GET_ALL: 'knowledge-colors:get-all',
    CREATE:  'knowledge-colors:create',
    UPDATE:  'knowledge-colors:update',
    DELETE:  'knowledge-colors:delete',
    REORDER: 'knowledge-colors:reorder',
  },
  CHALLENGES: {
    GET_TODAY:       'challenges:get-today',
    GET_WEEK:        'challenges:get-week',
    GET_ALL:         'challenges:get-all',
    CREATE:          'challenges:create',
    START:           'challenges:start',
    UPDATE_PROGRESS: 'challenges:update-progress',
    COMPLETE:        'challenges:complete',
    GENERATE_DAILY:  'challenges:generate-daily',
    GENERATE_WEEKLY: 'challenges:generate-weekly',
    GET_STATS:       'challenges:get-stats',
  },
  SCENARIOS: {
    GET_ALL:  'scenarios:get-all',
    GET_BY_ID:'scenarios:get-by-id',
    GET_STEPS:'scenarios:get-steps',
    CREATE:   'scenarios:create',
    UPDATE:   'scenarios:update',
    DELETE:   'scenarios:delete',
    GET_STATS:'scenarios:get-stats',
    STEPS: {
      ADD:    'scenarios:steps:add',
      UPDATE: 'scenarios:steps:update',
      DELETE: 'scenarios:steps:delete',
    },
    ATTEMPTS: {
      START:           'scenarios:attempts:start',
      UPDATE:          'scenarios:attempts:update',
      GET_BY_SCENARIO: 'scenarios:attempts:get-by-scenario',
    },
  },
  FEYNMAN: {
    GET_ALL: 'feynman:get-all',
    CREATE:  'feynman:create',
    UPDATE:  'feynman:update',
    DELETE:  'feynman:delete',
  },
  VAULT: {
    CONVERT_DOCX:    'vault:convert-docx',
    READ_TEXT:       'vault:read-text',
    GET_PDF_PATH:    'vault:get-pdf-path',
    READ_PDF_BUFFER: 'vault:read-pdf-buffer',
  },
  VAULT_COLLECTIONS: {
    GET_ALL:         'vault-collections:get-all',
    CREATE:          'vault-collections:create',
    UPDATE:          'vault-collections:update',
    DELETE:          'vault-collections:delete',
    ADD_DOCUMENT:    'vault-collections:add-document',
    REMOVE_DOCUMENT: 'vault-collections:remove-document',
    GET_DOCUMENT_IDS:'vault-collections:get-document-ids',
  },
  VAULT_FAVORITES: {
    GET_ALL: 'vault-favorites:get-all',
    TOGGLE:  'vault-favorites:toggle',
  },
  VAULT_RECENT: {
    GET_ALL: 'vault-recent:get-all',
    TRACK:   'vault-recent:track',
    CLEAR:   'vault-recent:clear',
  },
  PDF_READER: {
    GET_PROGRESS:   'pdf-reader:get-progress',
    SAVE_PROGRESS:  'pdf-reader:save-progress',
    DELETE_PROGRESS:'pdf-reader:delete-progress',
    GET_RECENT:     'pdf-reader:get-recent',
    GET_STATS:      'pdf-reader:get-stats',
  },
  DOCX_VIEWER: {
    CONVERT: 'docx-viewer:convert',
    COMMENTS: {
      GET:     'docx-viewer:comments:get',
      CREATE:  'docx-viewer:comments:create',
      UPDATE:  'docx-viewer:comments:update',
      DELETE:  'docx-viewer:comments:delete',
      RESOLVE: 'docx-viewer:comments:resolve',
    },
  },
  SKILL_HUB: {
    GET_OVERVIEW: 'skill-hub:get-overview',
    MODULES: {
      GET_ALL:         'skill-hub:modules:get-all',
      CREATE:          'skill-hub:modules:create',
      UPDATE:          'skill-hub:modules:update',
      DELETE:          'skill-hub:modules:delete',
      REORDER:         'skill-hub:modules:reorder',
    },
    MODULE_TOPICS: {
      CREATE:          'skill-hub:module-topics:create',
      UPDATE:          'skill-hub:module-topics:update',
      DELETE:          'skill-hub:module-topics:delete',
    },
    RESOURCES: {
      GET_ALL:         'skill-hub:resources:get-all',
      CREATE:          'skill-hub:resources:create',
      UPDATE:          'skill-hub:resources:update',
      DELETE:          'skill-hub:resources:delete',
    },
    EXPERIENCE_LOG: {
      GET_ALL:         'skill-hub:experience-log:get-all',
      CREATE:          'skill-hub:experience-log:create',
      UPDATE:          'skill-hub:experience-log:update',
      DELETE:          'skill-hub:experience-log:delete',
    },
    QUIZ_QUESTIONS: {
      GET_ALL:         'skill-hub:quiz-questions:get-all',
      CREATE:          'skill-hub:quiz-questions:create',
      UPDATE:          'skill-hub:quiz-questions:update',
      DELETE:          'skill-hub:quiz-questions:delete',
    },
    QUIZ_ATTEMPTS: {
      LOG:             'skill-hub:quiz-attempts:log',
      GET_STATS:       'skill-hub:quiz-attempts:get-stats',
    },
    LINKED_LABS: {
      GET_ALL:         'skill-hub:linked-labs:get-all',
      LINK:            'skill-hub:linked-labs:link',
      UNLINK:          'skill-hub:linked-labs:unlink',
    },
    LINKED_PROJECTS: {
      GET_ALL:         'skill-hub:linked-projects:get-all',
      LINK:            'skill-hub:linked-projects:link',
      UNLINK:          'skill-hub:linked-projects:unlink',
    },
    LINKED_CERTIFICATIONS: {
      GET_ALL:         'skill-hub:linked-certifications:get-all',
      LINK:            'skill-hub:linked-certifications:link',
      UNLINK:          'skill-hub:linked-certifications:unlink',
    },
    LINKED_INTERVIEW_QUESTIONS: {
      GET_ALL:         'skill-hub:linked-interview-questions:get-all',
      LINK:            'skill-hub:linked-interview-questions:link',
      UNLINK:          'skill-hub:linked-interview-questions:unlink',
    },
    LINKED_VIDEOS: {
      GET_ALL:         'skill-hub:linked-videos:get-all',
    },
    RELATED_SKILLS: {
      GET_ALL:         'skill-hub:related-skills:get-all',
    },
  },
  PLAYLISTS: {
    GET_ALL:   'playlists:get-all',
    GET_BY_ID: 'playlists:get-by-id',
    CREATE:    'playlists:create',
    UPDATE:    'playlists:update',
    DELETE:    'playlists:delete',
    ITEMS: {
      CREATE:  'playlists:items:create',
      UPDATE:  'playlists:items:update',
      DELETE:  'playlists:items:delete',
      REORDER: 'playlists:items:reorder',
    },
  },
  WORKSPACE: {
    GET_STATE:            'workspace:get-state',
    SAVE_STATE:           'workspace:save-state',
    OPEN_FLOATING_WINDOW: 'workspace:open-floating-window',
    GET_DISPLAYS:         'workspace:get-displays',
  },
  MARKDOWN: {
    GET_ALL:  'markdown:get-all',
    GET_BY_ID:'markdown:get-by-id',
    CREATE:   'markdown:create',
    UPDATE:   'markdown:update',
    DELETE:   'markdown:delete',
    VERSIONS: {
      GET:     'markdown:versions:get',
      SAVE:    'markdown:versions:save',
      RESTORE: 'markdown:versions:restore',
      DELETE:  'markdown:versions:delete',
    },
  },
  CODE_WORKSPACE: {
    FOLDERS: {
      GET_ALL: 'code-workspace:folders:get-all',
      CREATE:  'code-workspace:folders:create',
      UPDATE:  'code-workspace:folders:update',
      DELETE:  'code-workspace:folders:delete',
    },
    FILES: {
      GET_ALL:      'code-workspace:files:get-all',
      GET_BY_ID:    'code-workspace:files:get-by-id',
      CREATE:       'code-workspace:files:create',
      UPDATE:       'code-workspace:files:update',
      SAVE_CONTENT: 'code-workspace:files:save-content',
      DELETE:       'code-workspace:files:delete',
    },
  },
  WHITEBOARD: {
    GET_ALL:     'whiteboard:get-all',
    GET_BY_ID:   'whiteboard:get-by-id',
    CREATE:      'whiteboard:create',
    UPDATE:      'whiteboard:update',
    DELETE:      'whiteboard:delete',
    SAVE_CANVAS: 'whiteboard:save-canvas',
    LINKS: {
      GET:    'whiteboard:links:get',
      ADD:    'whiteboard:links:add',
      REMOVE: 'whiteboard:links:remove',
    },
  },
  KNOWLEDGE_GRAPH: {
    GET_GRAPH:       'knowledge-graph:get-graph',
    SEARCH_ENTITIES: 'knowledge-graph:search-entities',
    NODES: {
      GET_ALL: 'knowledge-graph:nodes:get-all',
      CREATE:  'knowledge-graph:nodes:create',
      UPDATE:  'knowledge-graph:nodes:update',
      DELETE:  'knowledge-graph:nodes:delete',
    },
    LINKS: {
      GET_ALL: 'knowledge-graph:links:get-all',
      CREATE:  'knowledge-graph:links:create',
      DELETE:  'knowledge-graph:links:delete',
    },
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
