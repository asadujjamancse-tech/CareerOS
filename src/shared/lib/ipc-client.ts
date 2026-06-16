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

  skillHub: {
    getOverview: () => browserOnly(),
    modules: {
      getAll:  () => Promise.resolve(ok([])),
      create:  () => browserOnly(),
      update:  () => browserOnly(),
      delete:  () => browserOnly(),
      reorder: () => browserOnly(),
    },
    moduleTopics: {
      create: () => browserOnly(),
      update: () => browserOnly(),
      delete: () => browserOnly(),
    },
    resources: {
      getAll: () => Promise.resolve(ok([])),
      create: () => browserOnly(),
      update: () => browserOnly(),
      delete: () => browserOnly(),
    },
    experienceLog: {
      getAll: () => Promise.resolve(ok([])),
      create: () => browserOnly(),
      update: () => browserOnly(),
      delete: () => browserOnly(),
    },
    quizQuestions: {
      getAll: () => Promise.resolve(ok([])),
      create: () => browserOnly(),
      update: () => browserOnly(),
      delete: () => browserOnly(),
    },
    quizAttempts: {
      log:      () => browserOnly(),
      getStats: () => Promise.resolve(ok({ total_attempts: 0, correct_attempts: 0, accuracy_pct: 0 })),
    },
    linkedLabs: {
      getAll: () => Promise.resolve(ok([])),
      link:   () => browserOnly(),
      unlink: () => browserOnly(),
    },
    linkedProjects: {
      getAll: () => Promise.resolve(ok([])),
      link:   () => browserOnly(),
      unlink: () => browserOnly(),
    },
    linkedCertifications: {
      getAll: () => Promise.resolve(ok([])),
      link:   () => browserOnly(),
      unlink: () => browserOnly(),
    },
    linkedInterviewQuestions: {
      getAll:  () => Promise.resolve(ok([])),
      link:    () => browserOnly(),
      unlink:  () => browserOnly(),
    },
    linkedVideos: {
      getAll: () => Promise.resolve(ok([])),
    },
    relatedSkills: {
      getAll: () => Promise.resolve(ok([])),
    },
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
    rename:   () => browserOnly(),
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
    history: {
      get:   () => Promise.resolve(ok([])),
      clear: () => Promise.resolve(ok(null)),
    },
  },

  storage: {
    importFile:     () => browserOnly(),
    importFiles:    () => browserOnly(),
    openFile:       () => browserOnly(),
    showInFolder:   () => browserOnly(),
  },

  homeLabs: {
    getAll:   () => Promise.resolve(ok(emptyPage())),
    getById:  () => browserOnly(),
    create:   () => browserOnly(),
    update:   () => browserOnly(),
    delete:   () => browserOnly(),
    tasks: {
      create:  () => browserOnly(),
      update:  () => browserOnly(),
      delete:  () => browserOnly(),
    },
    problems: {
      create:  () => browserOnly(),
      update:  () => browserOnly(),
      delete:  () => browserOnly(),
    },
    time: {
      log:     () => browserOnly(),
      delete:  () => browserOnly(),
      getAll:  () => Promise.resolve(ok([])),
    },
    assets: {
      create:  () => browserOnly(),
      update:  () => browserOnly(),
      delete:  () => browserOnly(),
    },
  },

  interviewQuestions: {
    getAll:        () => Promise.resolve(ok(emptyPage())),
    getById:       () => browserOnly(),
    create:        () => browserOnly(),
    update:        () => browserOnly(),
    delete:        () => browserOnly(),
    getRandom:     () => Promise.resolve(ok([])),
    recordReview:  () => browserOnly(),
    getProgress:   () => Promise.resolve(ok({
      total: 0, mastered_count: 0, avg_mastery: 0,
      by_difficulty: [], by_mastery: [], by_category: [],
    })),
  },

  interviewCategories: {
    getAll:  () => Promise.resolve(ok([])),
    create:  () => browserOnly(),
    update:  () => browserOnly(),
    delete:  () => browserOnly(),
  },

  learningDashboard: {
    getDashboard: () => Promise.resolve(ok({
      totals: {
        skills_total: 0, skills_mastered: 0,
        projects_total: 0, projects_completed: 0,
        certifications_total: 0, certifications_earned: 0,
        labs_total: 0, labs_completed: 0,
        interview_questions_total: 0, interview_questions_mastered: 0,
        total_study_minutes: 0, total_lab_minutes: 0,
      },
      career_readiness: { overall: 0, skills_score: 0, certifications_score: 0, projects_score: 0, labs_score: 0, interview_score: 0 },
      weekly_activity: [],
      monthly_activity: [],
      skill_growth: [],
      recent_activity: [],
      top_skills: [],
      upcoming_cert_renewals: [],
    })),
    getWeeklyReport: () => Promise.resolve(ok({
      week_start: '', week_end: '', study_minutes: 0, lab_minutes: 0,
      skills_added: 0, skills_mastered: 0, labs_completed: 0,
      questions_reviewed: 0, questions_mastered: 0,
    })),
    getMonthlyReport: () => Promise.resolve(ok({
      month: '', study_minutes: 0, lab_minutes: 0, skills_added: 0,
      skills_mastered: 0, labs_completed: 0, certs_earned: 0,
      questions_reviewed: 0, questions_mastered: 0, projects_completed: 0,
    })),
  },

  learningCoach: {
    learningPaths: {
      getAll:    () => Promise.resolve(ok([])),
      getById:   () => browserOnly(),
      create:    () => browserOnly(),
      update:    () => browserOnly(),
      delete:    () => browserOnly(),
      setSkills: () => browserOnly(),
    },
    skillMethods: {
      getAll:    () => Promise.resolve(ok([])),
      getBySkill: () => Promise.resolve(ok(null)),
      upsert:    () => browserOnly(),
    },
    retention: {
      getAll:       () => Promise.resolve(ok([])),
      getDue:       () => Promise.resolve(ok([])),
      upsert:       () => browserOnly(),
      recordReview: () => browserOnly(),
      getLogs:      () => Promise.resolve(ok([])),
    },
    studyPlans: {
      getAll:       () => Promise.resolve(ok([])),
      getById:      () => browserOnly(),
      generate:     () => browserOnly(),
      delete:       () => browserOnly(),
      markItemDone: () => browserOnly(),
    },
    dependencies: {
      getAll:   () => Promise.resolve(ok([])),
      add:      () => browserOnly(),
      remove:   () => browserOnly(),
      getGraph: () => Promise.resolve(ok({ nodes: [], edges: [] })),
    },
    effectiveness: {
      getMetrics: () => Promise.resolve(ok({
        total_study_minutes: 0, total_lab_minutes: 0, total_review_sessions: 0,
        avg_review_quality: 0, skills_with_retention: 0, avg_retention_score: 0,
        skills_due_for_review: 0, weekly_study_trend: [], skill_accuracy_stats: [],
        top_retained_skills: [], learning_velocity: 0,
      })),
    },
  },

  careerIntelligence: {
    roadmaps: {
      getAll:            () => Promise.resolve(ok([])),
      getById:           () => browserOnly(),
      create:            () => browserOnly(),
      update:            () => browserOnly(),
      delete:            () => browserOnly(),
      setSkills:         () => browserOnly(),
      setCertifications: () => browserOnly(),
      setProjects:       () => browserOnly(),
      setMilestones:     () => browserOnly(),
      toggleMilestone:   () => browserOnly(),
    },
    skillProgress: {
      getAll:  () => Promise.resolve(ok([])),
      upsert:  () => browserOnly(),
    },
    studySessions: {
      getAll:  () => Promise.resolve(ok([])),
      log:     () => browserOnly(),
      delete:  () => browserOnly(),
    },
    coach: {
      getRecommendations: () => Promise.resolve(ok({
        job_readiness_score: 0,
        readiness_breakdown: { skills_score: 0, certifications_score: 0, projects_score: 0, experience_score: 0 },
        missing_skills: [],
        next_certification: null,
        next_project: null,
        weekly_study_plan: [],
        top_skill_gaps: [],
      })),
    },
    knowledgeGraph: {
      get: () => Promise.resolve(ok({ nodes: [], edges: [] })),
    },
    analytics: {
      getDashboard: () => Promise.resolve(ok({
        totals: { skills: 0, skills_mastered: 0, projects: 0, projects_completed: 0, certifications: 0, certifications_earned: 0, notes: 0, documents: 0, videos: 0, videos_completed: 0, study_sessions: 0, total_study_hours: 0 },
        skill_level_distribution: [],
        skill_status_distribution: [],
        recent_study_sessions: [],
        study_hours_by_week: [],
        top_skills_by_progress: [],
        certification_status_distribution: [],
      })),
    },
  },

  srs: {
    getDue: () => Promise.resolve(ok([])),
    getUpcoming: () => Promise.resolve(ok([])),
    getAll: () => Promise.resolve(ok([])),
    getById: () => browserOnly(),
    create: () => browserOnly(),
    update: () => browserOnly(),
    recordReview: () => browserOnly(),
    delete: () => browserOnly(),
    getReviewHistory: () => Promise.resolve(ok([])),
    getStats: () => Promise.resolve(ok({ total: 0, due_today: 0, new_cards: 0, learning: 0, review: 0, avg_retention: 0, streak_days: 0 })),
    bulkFromInterview: () => browserOnly(),
    bulkFromNotes: () => browserOnly(),
  },

  feynman: {
    getAll: () => Promise.resolve(ok([])),
    create: () => browserOnly(),
    update: () => browserOnly(),
    delete: () => browserOnly(),
  },

  annotations: {
    getByDocument: () => Promise.resolve(ok([])),
    create: () => browserOnly(),
    update: () => browserOnly(),
    delete: () => browserOnly(),
    deleteByDocument: () => browserOnly(),
    getReadingProgress: () => Promise.resolve(ok(null)),
    updateReadingProgress: () => browserOnly(),
    getReadingStats: () => Promise.resolve(ok([])),
  },

  knowledgeColors: {
    getAll: () => Promise.resolve(ok([])),
    create: () => browserOnly(),
    update: () => browserOnly(),
    delete: () => browserOnly(),
    reorder: () => browserOnly(),
  },

  challenges: {
    getToday: () => Promise.resolve(ok([])),
    getWeek: () => Promise.resolve(ok([])),
    getAll: () => Promise.resolve(ok([])),
    create: () => browserOnly(),
    start: () => browserOnly(),
    updateProgress: () => browserOnly(),
    complete: () => browserOnly(),
    generateDaily: () => browserOnly(),
    generateWeekly: () => browserOnly(),
    getStats: () => Promise.resolve(ok({ total_challenges: 0, completed: 0, in_progress: 0, streak_days: 0, total_xp_earned: 0 })),
  },

  scenarios: {
    getAll: () => Promise.resolve(ok([])),
    getById: () => browserOnly(),
    getSteps: () => Promise.resolve(ok([])),
    create: () => browserOnly(),
    update: () => browserOnly(),
    delete: () => browserOnly(),
    getStats: () => browserOnly(),
    steps: {
      add: () => browserOnly(),
      update: () => browserOnly(),
      delete: () => browserOnly(),
    },
    attempts: {
      start: () => browserOnly(),
      update: () => browserOnly(),
      getByScenario: () => Promise.resolve(ok([])),
    },
  },

  vault: {
    convertDocx:   () => browserOnly(),
    readText:      () => browserOnly(),
    getPdfPath:    () => browserOnly(),
    readPdfBuffer: () => browserOnly(),
  },

  pdfReader: {
    getProgress:    () => Promise.resolve(ok(null)),
    saveProgress:   () => browserOnly(),
    deleteProgress: () => browserOnly(),
    getRecent:      () => Promise.resolve(ok([])),
    getStats:       () => Promise.resolve(ok({ total_pdfs: 0, completed_pdfs: 0, total_reading_time_sec: 0, avg_completion_percent: 0 })),
  },

  vaultCollections: {
    getAll:         () => Promise.resolve(ok([])),
    create:         () => browserOnly(),
    update:         () => browserOnly(),
    delete:         () => browserOnly(),
    addDocument:    () => browserOnly(),
    removeDocument: () => browserOnly(),
    getDocumentIds: () => Promise.resolve(ok([])),
  },

  vaultFavorites: {
    getAll:  () => Promise.resolve(ok([])),
    toggle:  () => browserOnly(),
  },

  vaultRecent: {
    getAll:  () => Promise.resolve(ok([])),
    track:   () => browserOnly(),
    clear:   () => browserOnly(),
  },

  workspace: {
    getState: () => Promise.resolve(ok('{}')),
    saveState: () => browserOnly(),
    openFloatingWindow: () => browserOnly(),
    getDisplays: () => Promise.resolve(ok([])),
  },

  playlists: {
    getAll: () => Promise.resolve(ok([])),
    getById: () => browserOnly(),
    create: () => browserOnly(),
    update: () => browserOnly(),
    delete: () => browserOnly(),
    items: {
      create: () => browserOnly(),
      update: () => browserOnly(),
      delete: () => browserOnly(),
      reorder: () => browserOnly(),
    },
  },

  markdown: {
    getAll:  () => Promise.resolve(ok([])),
    getById: () => Promise.resolve(ok(null)),
    create:  () => browserOnly(),
    update:  () => browserOnly(),
    delete:  () => browserOnly(),
    versions: {
      get:     () => Promise.resolve(ok([])),
      save:    () => browserOnly(),
      restore: () => browserOnly(),
      delete:  () => browserOnly(),
    },
  },

  docxViewer: {
    convert: () => browserOnly(),
    comments: {
      get:     () => Promise.resolve(ok([])),
      create:  () => browserOnly(),
      update:  () => browserOnly(),
      delete:  () => browserOnly(),
      resolve: () => browserOnly(),
    },
  },

  codeWorkspace: {
    folders: {
      getAll:  () => Promise.resolve(ok([])),
      create:  () => browserOnly(),
      update:  () => browserOnly(),
      delete:  () => browserOnly(),
    },
    files: {
      getAll:      () => Promise.resolve(ok([])),
      getById:     () => browserOnly(),
      create:      () => browserOnly(),
      update:      () => browserOnly(),
      saveContent: () => browserOnly(),
      delete:      () => browserOnly(),
    },
  },

  whiteboard: {
    getAll:     () => Promise.resolve(ok([])),
    getById:    () => browserOnly(),
    create:     () => browserOnly(),
    update:     () => browserOnly(),
    delete:     () => browserOnly(),
    saveCanvas: () => browserOnly(),
    links: {
      get:    () => Promise.resolve(ok([])),
      add:    () => browserOnly(),
      remove: () => browserOnly(),
    },
  },

  knowledgeGraph: {
    getGraph:       () => Promise.resolve(ok({ nodes: [], links: [] })),
    searchEntities: () => Promise.resolve(ok([])),
    nodes: {
      getAll: () => Promise.resolve(ok([])),
      create: () => browserOnly(),
      update: () => browserOnly(),
      delete: () => browserOnly(),
    },
    links: {
      getAll: () => Promise.resolve(ok([])),
      create: () => browserOnly(),
      delete: () => browserOnly(),
    },
  },
}

// ── Export ────────────────────────────────────────────────────────────────────
//
// In Electron  → window.api is set by contextBridge before React boots.
// In a browser → window.api is undefined; use the null implementation above.

export const api: CareerOsApi = isElectron ? window.api : nullApi
