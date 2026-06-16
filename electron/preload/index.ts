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
    rename: (id: string, newTitle: string, newFilename?: string) => invoke(IPC.DOCUMENTS.RENAME, id, newTitle, newFilename),
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
    history: {
      get:   (limit?: number) => invoke(IPC.SEARCH.HISTORY.GET, limit),
      clear: ()               => invoke(IPC.SEARCH.HISTORY.CLEAR),
    },
  },

  storage: {
    importFile:  (options: unknown) => invoke(IPC.STORAGE.IMPORT_FILE, options),
    importFiles: (options: unknown) => invoke(IPC.STORAGE.IMPORT_FILES, options),
    openFile:    (filePath: string) => invoke(IPC.STORAGE.OPEN_FILE, filePath),
    showInFolder:(filePath: string) => invoke(IPC.STORAGE.SHOW_IN_FOLDER, filePath),
  },

  homeLabs: {
    getAll: (filters?: unknown) => invoke(IPC.HOME_LABS.GET_ALL, filters),
    getById: (id: string) => invoke(IPC.HOME_LABS.GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.HOME_LABS.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.HOME_LABS.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.HOME_LABS.DELETE, id),
    tasks: {
      create: (data: unknown) => invoke(IPC.HOME_LABS.TASKS.CREATE, data),
      update: (id: string, data: unknown) => invoke(IPC.HOME_LABS.TASKS.UPDATE, id, data),
      delete: (id: string, labId: string) => invoke(IPC.HOME_LABS.TASKS.DELETE, id, labId),
    },
    problems: {
      create: (data: unknown) => invoke(IPC.HOME_LABS.PROBLEMS.CREATE, data),
      update: (id: string, data: unknown) => invoke(IPC.HOME_LABS.PROBLEMS.UPDATE, id, data),
      delete: (id: string) => invoke(IPC.HOME_LABS.PROBLEMS.DELETE, id),
    },
    time: {
      log: (data: unknown) => invoke(IPC.HOME_LABS.TIME.LOG, data),
      delete: (id: string) => invoke(IPC.HOME_LABS.TIME.DELETE, id),
      getAll: (labId: string) => invoke(IPC.HOME_LABS.TIME.GET_ALL, labId),
    },
    assets: {
      create: (data: unknown) => invoke(IPC.HOME_LABS.ASSETS.CREATE, data),
      update: (id: string, data: unknown) => invoke(IPC.HOME_LABS.ASSETS.UPDATE, id, data),
      delete: (id: string) => invoke(IPC.HOME_LABS.ASSETS.DELETE, id),
    },
  },

  interviewQuestions: {
    getAll: (filters?: unknown) => invoke(IPC.INTERVIEW_QUESTIONS.GET_ALL, filters),
    getById: (id: string) => invoke(IPC.INTERVIEW_QUESTIONS.GET_BY_ID, id),
    create: (data: unknown) => invoke(IPC.INTERVIEW_QUESTIONS.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.INTERVIEW_QUESTIONS.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.INTERVIEW_QUESTIONS.DELETE, id),
    getRandom: (params?: unknown) => invoke(IPC.INTERVIEW_QUESTIONS.GET_RANDOM, params),
    recordReview: (id: string, mastery_score: number) => invoke(IPC.INTERVIEW_QUESTIONS.RECORD_REVIEW, id, mastery_score),
    getProgress: () => invoke(IPC.INTERVIEW_QUESTIONS.GET_PROGRESS),
  },

  interviewCategories: {
    getAll: () => invoke(IPC.INTERVIEW_CATEGORIES.GET_ALL),
    create: (data: unknown) => invoke(IPC.INTERVIEW_CATEGORIES.CREATE, data),
    update: (id: string, data: unknown) => invoke(IPC.INTERVIEW_CATEGORIES.UPDATE, id, data),
    delete: (id: string) => invoke(IPC.INTERVIEW_CATEGORIES.DELETE, id),
  },

  learningDashboard: {
    getDashboard: () => invoke(IPC.LEARNING_DASHBOARD.GET_DASHBOARD),
    getWeeklyReport: (weekStart: string) => invoke(IPC.LEARNING_DASHBOARD.GET_WEEKLY_REPORT, weekStart),
    getMonthlyReport: (month: string) => invoke(IPC.LEARNING_DASHBOARD.GET_MONTHLY_REPORT, month),
  },

  skillHub: {
    getOverview: (skillId: string) => invoke(IPC.SKILL_HUB.GET_OVERVIEW, skillId),
    modules: {
      getAll:  (skillId: string)              => invoke(IPC.SKILL_HUB.MODULES.GET_ALL, skillId),
      create:  (params: unknown)              => invoke(IPC.SKILL_HUB.MODULES.CREATE, params),
      update:  (id: string, params: unknown)  => invoke(IPC.SKILL_HUB.MODULES.UPDATE, id, params),
      delete:  (id: string)                   => invoke(IPC.SKILL_HUB.MODULES.DELETE, id),
      reorder: (skillId: string, ids: string[]) => invoke(IPC.SKILL_HUB.MODULES.REORDER, skillId, ids),
    },
    moduleTopics: {
      create: (params: unknown)             => invoke(IPC.SKILL_HUB.MODULE_TOPICS.CREATE, params),
      update: (id: string, params: unknown) => invoke(IPC.SKILL_HUB.MODULE_TOPICS.UPDATE, id, params),
      delete: (id: string)                  => invoke(IPC.SKILL_HUB.MODULE_TOPICS.DELETE, id),
    },
    resources: {
      getAll: (skillId: string)             => invoke(IPC.SKILL_HUB.RESOURCES.GET_ALL, skillId),
      create: (params: unknown)             => invoke(IPC.SKILL_HUB.RESOURCES.CREATE, params),
      update: (id: string, params: unknown) => invoke(IPC.SKILL_HUB.RESOURCES.UPDATE, id, params),
      delete: (id: string)                  => invoke(IPC.SKILL_HUB.RESOURCES.DELETE, id),
    },
    experienceLog: {
      getAll: (skillId: string)             => invoke(IPC.SKILL_HUB.EXPERIENCE_LOG.GET_ALL, skillId),
      create: (params: unknown)             => invoke(IPC.SKILL_HUB.EXPERIENCE_LOG.CREATE, params),
      update: (id: string, params: unknown) => invoke(IPC.SKILL_HUB.EXPERIENCE_LOG.UPDATE, id, params),
      delete: (id: string)                  => invoke(IPC.SKILL_HUB.EXPERIENCE_LOG.DELETE, id),
    },
    quizQuestions: {
      getAll: (skillId: string)             => invoke(IPC.SKILL_HUB.QUIZ_QUESTIONS.GET_ALL, skillId),
      create: (params: unknown)             => invoke(IPC.SKILL_HUB.QUIZ_QUESTIONS.CREATE, params),
      update: (id: string, params: unknown) => invoke(IPC.SKILL_HUB.QUIZ_QUESTIONS.UPDATE, id, params),
      delete: (id: string)                  => invoke(IPC.SKILL_HUB.QUIZ_QUESTIONS.DELETE, id),
    },
    quizAttempts: {
      log:      (params: unknown)  => invoke(IPC.SKILL_HUB.QUIZ_ATTEMPTS.LOG, params),
      getStats: (skillId: string)  => invoke(IPC.SKILL_HUB.QUIZ_ATTEMPTS.GET_STATS, skillId),
    },
    linkedLabs: {
      getAll: (skillId: string)              => invoke(IPC.SKILL_HUB.LINKED_LABS.GET_ALL, skillId),
      link:   (skillId: string, labId: string) => invoke(IPC.SKILL_HUB.LINKED_LABS.LINK, skillId, labId),
      unlink: (skillId: string, labId: string) => invoke(IPC.SKILL_HUB.LINKED_LABS.UNLINK, skillId, labId),
    },
    linkedProjects: {
      getAll: (skillId: string)                   => invoke(IPC.SKILL_HUB.LINKED_PROJECTS.GET_ALL, skillId),
      link:   (skillId: string, projectId: string)=> invoke(IPC.SKILL_HUB.LINKED_PROJECTS.LINK, skillId, projectId),
      unlink: (skillId: string, projectId: string)=> invoke(IPC.SKILL_HUB.LINKED_PROJECTS.UNLINK, skillId, projectId),
    },
    linkedCertifications: {
      getAll: (skillId: string)                 => invoke(IPC.SKILL_HUB.LINKED_CERTIFICATIONS.GET_ALL, skillId),
      link:   (skillId: string, certId: string) => invoke(IPC.SKILL_HUB.LINKED_CERTIFICATIONS.LINK, skillId, certId),
      unlink: (skillId: string, certId: string) => invoke(IPC.SKILL_HUB.LINKED_CERTIFICATIONS.UNLINK, skillId, certId),
    },
    linkedInterviewQuestions: {
      getAll:  (skillId: string)                       => invoke(IPC.SKILL_HUB.LINKED_INTERVIEW_QUESTIONS.GET_ALL, skillId),
      link:    (skillId: string, questionId: string)   => invoke(IPC.SKILL_HUB.LINKED_INTERVIEW_QUESTIONS.LINK, skillId, questionId),
      unlink:  (skillId: string, questionId: string)   => invoke(IPC.SKILL_HUB.LINKED_INTERVIEW_QUESTIONS.UNLINK, skillId, questionId),
    },
    linkedVideos: {
      getAll: (skillId: string) => invoke(IPC.SKILL_HUB.LINKED_VIDEOS.GET_ALL, skillId),
    },
    relatedSkills: {
      getAll: (skillId: string) => invoke(IPC.SKILL_HUB.RELATED_SKILLS.GET_ALL, skillId),
    },
  },

  srs: {
    getDue:            (limit?: number) => invoke(IPC.SRS.GET_DUE, limit),
    getUpcoming:       (days?: number) => invoke(IPC.SRS.GET_UPCOMING, days),
    getAll:            (entityType?: string, entityId?: string) => invoke(IPC.SRS.GET_ALL, entityType, entityId),
    getById:           (id: string) => invoke(IPC.SRS.GET_BY_ID, id),
    create:            (params: unknown) => invoke(IPC.SRS.CREATE, params),
    update:            (id: string, params: unknown) => invoke(IPC.SRS.UPDATE, id, params),
    recordReview:      (cardId: string, rating: number, timeSpentMs: number) => invoke(IPC.SRS.RECORD_REVIEW, cardId, rating, timeSpentMs),
    delete:            (id: string) => invoke(IPC.SRS.DELETE, id),
    getReviewHistory:  (cardId: string) => invoke(IPC.SRS.GET_REVIEW_HISTORY, cardId),
    getStats:          () => invoke(IPC.SRS.GET_STATS),
    bulkFromInterview: () => invoke(IPC.SRS.BULK_FROM_INTERVIEW),
    bulkFromNotes:     () => invoke(IPC.SRS.BULK_FROM_NOTES),
  },

  annotations: {
    getByDocument:       (documentId: string, type?: string) => invoke(IPC.ANNOTATIONS.GET_BY_DOCUMENT, documentId, type),
    create:              (params: unknown) => invoke(IPC.ANNOTATIONS.CREATE, params),
    update:              (id: string, params: unknown) => invoke(IPC.ANNOTATIONS.UPDATE, id, params),
    delete:              (id: string) => invoke(IPC.ANNOTATIONS.DELETE, id),
    deleteByDocument:    (documentId: string) => invoke(IPC.ANNOTATIONS.DELETE_BY_DOCUMENT, documentId),
    getReadingProgress:  (documentId: string) => invoke(IPC.ANNOTATIONS.GET_READING_PROGRESS, documentId),
    updateReadingProgress: (documentId: string, currentPage: number, totalPages?: number, scrollPosition?: number, additionalMinutes?: number, completed?: boolean) =>
      invoke(IPC.ANNOTATIONS.UPDATE_READING_PROGRESS, documentId, currentPage, totalPages, scrollPosition, additionalMinutes, completed),
    getReadingStats:     () => invoke(IPC.ANNOTATIONS.GET_READING_STATS),
  },

  knowledgeColors: {
    getAll:  () => invoke(IPC.KNOWLEDGE_COLORS.GET_ALL),
    create:  (params: unknown) => invoke(IPC.KNOWLEDGE_COLORS.CREATE, params),
    update:  (id: string, params: unknown) => invoke(IPC.KNOWLEDGE_COLORS.UPDATE, id, params),
    delete:  (id: string) => invoke(IPC.KNOWLEDGE_COLORS.DELETE, id),
    reorder: (orderedIds: string[]) => invoke(IPC.KNOWLEDGE_COLORS.REORDER, orderedIds),
  },

  challenges: {
    getToday:        () => invoke(IPC.CHALLENGES.GET_TODAY),
    getWeek:         () => invoke(IPC.CHALLENGES.GET_WEEK),
    getAll:          (type?: string) => invoke(IPC.CHALLENGES.GET_ALL, type),
    create:          (params: unknown) => invoke(IPC.CHALLENGES.CREATE, params),
    start:           (challengeId: string) => invoke(IPC.CHALLENGES.START, challengeId),
    updateProgress:  (challengeId: string, progress: number, notes?: string) => invoke(IPC.CHALLENGES.UPDATE_PROGRESS, challengeId, progress, notes),
    complete:        (challengeId: string, notes?: string) => invoke(IPC.CHALLENGES.COMPLETE, challengeId, notes),
    generateDaily:   () => invoke(IPC.CHALLENGES.GENERATE_DAILY),
    generateWeekly:  () => invoke(IPC.CHALLENGES.GENERATE_WEEKLY),
    getStats:        () => invoke(IPC.CHALLENGES.GET_STATS),
  },

  scenarios: {
    getAll:   (category?: string, difficulty?: string) => invoke(IPC.SCENARIOS.GET_ALL, category, difficulty),
    getById:  (id: string) => invoke(IPC.SCENARIOS.GET_BY_ID, id),
    getSteps: (scenarioId: string) => invoke(IPC.SCENARIOS.GET_STEPS, scenarioId),
    create:   (params: unknown) => invoke(IPC.SCENARIOS.CREATE, params),
    update:   (id: string, params: unknown) => invoke(IPC.SCENARIOS.UPDATE, id, params),
    delete:   (id: string) => invoke(IPC.SCENARIOS.DELETE, id),
    getStats: () => invoke(IPC.SCENARIOS.GET_STATS),
    steps: {
      add:    (params: unknown) => invoke(IPC.SCENARIOS.STEPS.ADD, params),
      update: (id: string, params: unknown) => invoke(IPC.SCENARIOS.STEPS.UPDATE, id, params),
      delete: (id: string) => invoke(IPC.SCENARIOS.STEPS.DELETE, id),
    },
    attempts: {
      start:          (scenarioId: string) => invoke(IPC.SCENARIOS.ATTEMPTS.START, scenarioId),
      update:         (id: string, updates: unknown) => invoke(IPC.SCENARIOS.ATTEMPTS.UPDATE, id, updates),
      getByScenario:  (scenarioId: string) => invoke(IPC.SCENARIOS.ATTEMPTS.GET_BY_SCENARIO, scenarioId),
    },
  },

  feynman: {
    getAll: () => invoke(IPC.FEYNMAN.GET_ALL),
    create: (params: unknown) => invoke(IPC.FEYNMAN.CREATE, params),
    update: (id: string, params: unknown) => invoke(IPC.FEYNMAN.UPDATE, id, params),
    delete: (id: string) => invoke(IPC.FEYNMAN.DELETE, id),
  },

  vault: {
    convertDocx:   (filePath: string) => invoke(IPC.VAULT.CONVERT_DOCX, filePath),
    readText:      (filePath: string) => invoke(IPC.VAULT.READ_TEXT, filePath),
    getPdfPath:    (filePath: string) => invoke(IPC.VAULT.GET_PDF_PATH, filePath),
    readPdfBuffer: (filePath: string) => invoke(IPC.VAULT.READ_PDF_BUFFER, filePath),
  },

  pdfReader: {
    getProgress:    (documentId: string)               => invoke(IPC.PDF_READER.GET_PROGRESS, documentId),
    saveProgress:   (documentId: string, params: unknown) => invoke(IPC.PDF_READER.SAVE_PROGRESS, documentId, params),
    deleteProgress: (documentId: string)               => invoke(IPC.PDF_READER.DELETE_PROGRESS, documentId),
    getRecent:      (limit?: number)                   => invoke(IPC.PDF_READER.GET_RECENT, limit),
    getStats:       ()                                 => invoke(IPC.PDF_READER.GET_STATS),
  },

  vaultCollections: {
    getAll:          ()                                        => invoke(IPC.VAULT_COLLECTIONS.GET_ALL),
    create:          (params: unknown)                         => invoke(IPC.VAULT_COLLECTIONS.CREATE, params),
    update:          (id: string, params: unknown)             => invoke(IPC.VAULT_COLLECTIONS.UPDATE, id, params),
    delete:          (id: string)                              => invoke(IPC.VAULT_COLLECTIONS.DELETE, id),
    addDocument:     (collectionId: string, documentId: string)=> invoke(IPC.VAULT_COLLECTIONS.ADD_DOCUMENT, collectionId, documentId),
    removeDocument:  (collectionId: string, documentId: string)=> invoke(IPC.VAULT_COLLECTIONS.REMOVE_DOCUMENT, collectionId, documentId),
    getDocumentIds:  (collectionId: string)                    => invoke(IPC.VAULT_COLLECTIONS.GET_DOCUMENT_IDS, collectionId),
  },

  vaultFavorites: {
    getAll:  ()                       => invoke(IPC.VAULT_FAVORITES.GET_ALL),
    toggle:  (documentId: string)     => invoke(IPC.VAULT_FAVORITES.TOGGLE, documentId),
  },

  vaultRecent: {
    getAll:  (limit?: number)         => invoke(IPC.VAULT_RECENT.GET_ALL, limit),
    track:   (documentId: string)     => invoke(IPC.VAULT_RECENT.TRACK, documentId),
    clear:   ()                       => invoke(IPC.VAULT_RECENT.CLEAR),
  },

  playlists: {
    getAll:    (skillId?: string) => invoke(IPC.PLAYLISTS.GET_ALL, skillId),
    getById:   (id: string) => invoke(IPC.PLAYLISTS.GET_BY_ID, id),
    create:    (data: unknown) => invoke(IPC.PLAYLISTS.CREATE, data),
    update:    (id: string, data: unknown) => invoke(IPC.PLAYLISTS.UPDATE, id, data),
    delete:    (id: string) => invoke(IPC.PLAYLISTS.DELETE, id),
    items: {
      create:  (data: unknown) => invoke(IPC.PLAYLISTS.ITEMS.CREATE, data),
      update:  (id: string, data: unknown) => invoke(IPC.PLAYLISTS.ITEMS.UPDATE, id, data),
      delete:  (id: string) => invoke(IPC.PLAYLISTS.ITEMS.DELETE, id),
      reorder: (playlistId: string, orderedIds: string[]) =>
        invoke(IPC.PLAYLISTS.ITEMS.REORDER, playlistId, orderedIds),
    },
  },

  workspace: {
    getState:           () => invoke(IPC.WORKSPACE.GET_STATE),
    saveState:          (stateJson: string) => invoke(IPC.WORKSPACE.SAVE_STATE, stateJson),
    openFloatingWindow: (type: string, params?: Record<string, unknown>, displayId?: number) =>
      invoke(IPC.WORKSPACE.OPEN_FLOATING_WINDOW, type, params, displayId),
    getDisplays:        () => invoke(IPC.WORKSPACE.GET_DISPLAYS),
  },

  markdown: {
    getAll:  ()                          => invoke(IPC.MARKDOWN.GET_ALL),
    getById: (id: string)                => invoke(IPC.MARKDOWN.GET_BY_ID, id),
    create:  (params: unknown)           => invoke(IPC.MARKDOWN.CREATE, params),
    update:  (id: string, params: unknown) => invoke(IPC.MARKDOWN.UPDATE, id, params),
    delete:  (id: string)                => invoke(IPC.MARKDOWN.DELETE, id),
    versions: {
      get:     (documentId: string)                    => invoke(IPC.MARKDOWN.VERSIONS.GET, documentId),
      save:    (documentId: string, label?: string)    => invoke(IPC.MARKDOWN.VERSIONS.SAVE, documentId, label),
      restore: (documentId: string, versionId: string) => invoke(IPC.MARKDOWN.VERSIONS.RESTORE, documentId, versionId),
      delete:  (versionId: string)                     => invoke(IPC.MARKDOWN.VERSIONS.DELETE, versionId),
    },
  },

  docxViewer: {
    convert: (filePath: string) => invoke(IPC.DOCX_VIEWER.CONVERT, filePath),
    comments: {
      get:     (documentId: string)           => invoke(IPC.DOCX_VIEWER.COMMENTS.GET, documentId),
      create:  (params: unknown)              => invoke(IPC.DOCX_VIEWER.COMMENTS.CREATE, params),
      update:  (id: string, params: unknown)  => invoke(IPC.DOCX_VIEWER.COMMENTS.UPDATE, id, params),
      delete:  (id: string)                   => invoke(IPC.DOCX_VIEWER.COMMENTS.DELETE, id),
      resolve: (id: string)                   => invoke(IPC.DOCX_VIEWER.COMMENTS.RESOLVE, id),
    },
  },

  learningCoach: {
    learningPaths: {
      getAll:    () => invoke(IPC.LEARNING_COACH.LEARNING_PATHS.GET_ALL),
      getById:   (id: string) => invoke(IPC.LEARNING_COACH.LEARNING_PATHS.GET_BY_ID, id),
      create:    (data: unknown) => invoke(IPC.LEARNING_COACH.LEARNING_PATHS.CREATE, data),
      update:    (id: string, data: unknown) => invoke(IPC.LEARNING_COACH.LEARNING_PATHS.UPDATE, id, data),
      delete:    (id: string) => invoke(IPC.LEARNING_COACH.LEARNING_PATHS.DELETE, id),
      setSkills: (pathId: string, skills: unknown) => invoke(IPC.LEARNING_COACH.LEARNING_PATHS.SET_SKILLS, pathId, skills),
    },
    skillMethods: {
      getAll:     () => invoke(IPC.LEARNING_COACH.SKILL_METHODS.GET_ALL),
      getBySkill: (skillId: string) => invoke(IPC.LEARNING_COACH.SKILL_METHODS.GET_BY_SKILL, skillId),
      upsert:     (skillId: string, data: unknown) => invoke(IPC.LEARNING_COACH.SKILL_METHODS.UPSERT, skillId, data),
    },
    retention: {
      getAll:       () => invoke(IPC.LEARNING_COACH.RETENTION.GET_ALL),
      getDue:       () => invoke(IPC.LEARNING_COACH.RETENTION.GET_DUE),
      upsert:       (skillId: string) => invoke(IPC.LEARNING_COACH.RETENTION.UPSERT, skillId),
      recordReview: (skillId: string, quality: number, notes?: string | null) => invoke(IPC.LEARNING_COACH.RETENTION.RECORD_REVIEW, skillId, quality, notes),
      getLogs:      (skillId?: string) => invoke(IPC.LEARNING_COACH.RETENTION.GET_LOGS, skillId),
    },
    studyPlans: {
      getAll:       () => invoke(IPC.LEARNING_COACH.STUDY_PLANS.GET_ALL),
      getById:      (id: string) => invoke(IPC.LEARNING_COACH.STUDY_PLANS.GET_BY_ID, id),
      generate:     (input: unknown) => invoke(IPC.LEARNING_COACH.STUDY_PLANS.GENERATE, input),
      delete:       (id: string) => invoke(IPC.LEARNING_COACH.STUDY_PLANS.DELETE, id),
      markItemDone: (itemId: string, done: boolean) => invoke(IPC.LEARNING_COACH.STUDY_PLANS.MARK_ITEM_DONE, itemId, done),
    },
    dependencies: {
      getAll:   () => invoke(IPC.LEARNING_COACH.DEPENDENCIES.GET_ALL),
      add:      (skillId: string, prerequisiteId: string, strength?: string) => invoke(IPC.LEARNING_COACH.DEPENDENCIES.ADD, skillId, prerequisiteId, strength),
      remove:   (skillId: string, prerequisiteId: string) => invoke(IPC.LEARNING_COACH.DEPENDENCIES.REMOVE, skillId, prerequisiteId),
      getGraph: () => invoke(IPC.LEARNING_COACH.DEPENDENCIES.GET_GRAPH),
    },
    effectiveness: {
      getMetrics: () => invoke(IPC.LEARNING_COACH.EFFECTIVENESS.GET_METRICS),
    },
  },

  codeWorkspace: {
    folders: {
      getAll:   () => invoke(IPC.CODE_WORKSPACE.FOLDERS.GET_ALL),
      create:   (params: unknown) => invoke(IPC.CODE_WORKSPACE.FOLDERS.CREATE, params),
      update:   (id: string, params: unknown) => invoke(IPC.CODE_WORKSPACE.FOLDERS.UPDATE, id, params),
      delete:   (id: string) => invoke(IPC.CODE_WORKSPACE.FOLDERS.DELETE, id),
    },
    files: {
      getAll:      () => invoke(IPC.CODE_WORKSPACE.FILES.GET_ALL),
      getById:     (id: string) => invoke(IPC.CODE_WORKSPACE.FILES.GET_BY_ID, id),
      create:      (params: unknown) => invoke(IPC.CODE_WORKSPACE.FILES.CREATE, params),
      update:      (id: string, params: unknown) => invoke(IPC.CODE_WORKSPACE.FILES.UPDATE, id, params),
      saveContent: (id: string, content: string) => invoke(IPC.CODE_WORKSPACE.FILES.SAVE_CONTENT, id, content),
      delete:      (id: string) => invoke(IPC.CODE_WORKSPACE.FILES.DELETE, id),
    },
  },

  whiteboard: {
    getAll:      ()                                                => invoke(IPC.WHITEBOARD.GET_ALL),
    getById:     (id: string)                                      => invoke(IPC.WHITEBOARD.GET_BY_ID, id),
    create:      (params: unknown)                                 => invoke(IPC.WHITEBOARD.CREATE, params),
    update:      (id: string, params: unknown)                     => invoke(IPC.WHITEBOARD.UPDATE, id, params),
    delete:      (id: string)                                      => invoke(IPC.WHITEBOARD.DELETE, id),
    saveCanvas:  (id: string, canvasData: string)                  => invoke(IPC.WHITEBOARD.SAVE_CANVAS, id, canvasData),
    links: {
      get:    (whiteboardId: string)                               => invoke(IPC.WHITEBOARD.LINKS.GET, whiteboardId),
      add:    (whiteboardId: string, type: string, entityId: string) => invoke(IPC.WHITEBOARD.LINKS.ADD, whiteboardId, type, entityId),
      remove: (whiteboardId: string, type: string, entityId: string) => invoke(IPC.WHITEBOARD.LINKS.REMOVE, whiteboardId, type, entityId),
    },
  },

  careerIntelligence: {
    roadmaps: {
      getAll: () => invoke(IPC.CAREER_INTELLIGENCE.ROADMAPS.GET_ALL),
      getById: (id: string) => invoke(IPC.CAREER_INTELLIGENCE.ROADMAPS.GET_BY_ID, id),
      create: (data: unknown) => invoke(IPC.CAREER_INTELLIGENCE.ROADMAPS.CREATE, data),
      update: (id: string, data: unknown) => invoke(IPC.CAREER_INTELLIGENCE.ROADMAPS.UPDATE, id, data),
      delete: (id: string) => invoke(IPC.CAREER_INTELLIGENCE.ROADMAPS.DELETE, id),
      setSkills: (roadmapId: string, skills: unknown) => invoke(IPC.CAREER_INTELLIGENCE.ROADMAPS.SET_SKILLS, roadmapId, skills),
      setCertifications: (roadmapId: string, certs: unknown) => invoke(IPC.CAREER_INTELLIGENCE.ROADMAPS.SET_CERTIFICATIONS, roadmapId, certs),
      setProjects: (roadmapId: string, projects: unknown) => invoke(IPC.CAREER_INTELLIGENCE.ROADMAPS.SET_PROJECTS, roadmapId, projects),
      setMilestones: (roadmapId: string, milestones: unknown) => invoke(IPC.CAREER_INTELLIGENCE.ROADMAPS.SET_MILESTONES, roadmapId, milestones),
      toggleMilestone: (id: string, completed: boolean) => invoke(IPC.CAREER_INTELLIGENCE.ROADMAPS.TOGGLE_MILESTONE, id, completed),
    },
    skillProgress: {
      getAll: () => invoke(IPC.CAREER_INTELLIGENCE.SKILL_PROGRESS.GET_ALL),
      upsert: (skillId: string, data: unknown) => invoke(IPC.CAREER_INTELLIGENCE.SKILL_PROGRESS.UPSERT, skillId, data),
    },
    studySessions: {
      getAll: () => invoke(IPC.CAREER_INTELLIGENCE.STUDY_SESSIONS.GET_ALL),
      log: (data: unknown) => invoke(IPC.CAREER_INTELLIGENCE.STUDY_SESSIONS.LOG, data),
      delete: (id: string) => invoke(IPC.CAREER_INTELLIGENCE.STUDY_SESSIONS.DELETE, id),
    },
    coach: {
      getRecommendations: (roadmapId?: string) => invoke(IPC.CAREER_INTELLIGENCE.COACH.GET_RECOMMENDATIONS, roadmapId),
    },
    knowledgeGraph: {
      get: () => invoke(IPC.CAREER_INTELLIGENCE.KNOWLEDGE_GRAPH.GET),
    },
    analytics: {
      getDashboard: () => invoke(IPC.CAREER_INTELLIGENCE.ANALYTICS.GET_DASHBOARD),
    },
  },
  knowledgeGraph: {
    getGraph:       ()                                    => invoke(IPC.KNOWLEDGE_GRAPH.GET_GRAPH),
    searchEntities: (query: string, entityType?: string)  => invoke(IPC.KNOWLEDGE_GRAPH.SEARCH_ENTITIES, query, entityType),
    nodes: {
      getAll: ()                               => invoke(IPC.KNOWLEDGE_GRAPH.NODES.GET_ALL),
      create: (params: unknown)                => invoke(IPC.KNOWLEDGE_GRAPH.NODES.CREATE, params),
      update: (id: string, params: unknown)    => invoke(IPC.KNOWLEDGE_GRAPH.NODES.UPDATE, id, params),
      delete: (id: string)                     => invoke(IPC.KNOWLEDGE_GRAPH.NODES.DELETE, id),
    },
    links: {
      getAll: ()                     => invoke(IPC.KNOWLEDGE_GRAPH.LINKS.GET_ALL),
      create: (params: unknown)      => invoke(IPC.KNOWLEDGE_GRAPH.LINKS.CREATE, params),
      delete: (id: string)           => invoke(IPC.KNOWLEDGE_GRAPH.LINKS.DELETE, id),
    },
  },
} as const

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
