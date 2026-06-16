import type { IpcResult, AppPaths, PaginatedResult } from './common.types'
import type {
  Skill, SkillFilters, CreateSkillInput, UpdateSkillInput,
  SkillCategory, CreateSkillCategoryInput, UpdateSkillCategoryInput,
  Occupation, OccupationFilters, CreateOccupationInput, UpdateOccupationInput, OccupationSkill, OccupationSkillImportance,
  Project, ProjectFilters, CreateProjectInput, UpdateProjectInput,
  ProjectAsset, ProjectAssetType,
  Certification, CertificationFilters, CreateCertificationInput, UpdateCertificationInput,
  Video, VideoFilters, CreateVideoInput, UpdateVideoInput,
  Note, NoteFilters, CreateNoteInput, UpdateNoteInput,
  Document, DocumentFilters, CreateDocumentInput, UpdateDocumentInput,
  JournalEntry, JournalFilters, CreateJournalEntryInput, UpdateJournalEntryInput,
  Tag, CreateTagInput, UpdateTagInput, EntityType,
  SearchResult,
  HomeLab, HomeLabWithMeta, HomeLabDetail, HomeLabTask, HomeLabProblem, HomeLabTimeEntry, HomeLabAsset,
  HomeLabFilters, CreateHomeLabInput, UpdateHomeLabInput,
  InterviewCategory, InterviewQuestionWithMeta,
  InterviewQuestionFilters, CreateInterviewCategoryInput, UpdateInterviewCategoryInput,
  CreateInterviewQuestionInput, UpdateInterviewQuestionInput,
  QuestionProgressStats,
} from './entities'

interface AppApi {
  getVersion: () => Promise<IpcResult<string>>
  getPaths: () => Promise<IpcResult<AppPaths>>
}

interface SkillsApi {
  getAll: (filters?: SkillFilters) => Promise<IpcResult<PaginatedResult<Skill>>>
  getById: (id: string) => Promise<IpcResult<Skill>>
  create: (data: CreateSkillInput) => Promise<IpcResult<Skill>>
  update: (id: string, data: UpdateSkillInput) => Promise<IpcResult<Skill>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface SkillCategoriesApi {
  getAll: () => Promise<IpcResult<SkillCategory[]>>
  create: (data: CreateSkillCategoryInput) => Promise<IpcResult<SkillCategory>>
  update: (id: string, data: UpdateSkillCategoryInput) => Promise<IpcResult<SkillCategory>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface OccupationSkillsApi {
  get: (occupationId: string) => Promise<IpcResult<OccupationSkill[]>>
  set: (occupationId: string, entries: Array<{ skill_id: string; importance: OccupationSkillImportance }>) => Promise<IpcResult<void>>
  update: (id: string, data: { importance?: OccupationSkillImportance; is_acquired?: 0 | 1; notes?: string }) => Promise<IpcResult<OccupationSkill>>
  remove: (id: string) => Promise<IpcResult<void>>
}

interface OccupationsApi {
  getAll: (filters?: OccupationFilters) => Promise<IpcResult<PaginatedResult<Occupation>>>
  getById: (id: string) => Promise<IpcResult<Occupation>>
  create: (data: CreateOccupationInput) => Promise<IpcResult<Occupation>>
  update: (id: string, data: UpdateOccupationInput) => Promise<IpcResult<Occupation>>
  delete: (id: string) => Promise<IpcResult<void>>
  skills: OccupationSkillsApi
}

interface ProjectAssetsApi {
  getAll: (projectId: string) => Promise<IpcResult<ProjectAsset[]>>
  create: (data: { project_id: string; title: string; type: ProjectAssetType; file_path?: string; url?: string; description?: string }) => Promise<IpcResult<ProjectAsset>>
  update: (id: string, data: Partial<{ title: string; description: string; order_index: number }>) => Promise<IpcResult<ProjectAsset>>
  delete: (id: string) => Promise<IpcResult<void>>
  reorder: (projectId: string, ids: string[]) => Promise<IpcResult<void>>
}

interface ProjectsApi {
  getAll: (filters?: ProjectFilters) => Promise<IpcResult<PaginatedResult<Project>>>
  getById: (id: string) => Promise<IpcResult<Project>>
  create: (data: CreateProjectInput) => Promise<IpcResult<Project>>
  update: (id: string, data: UpdateProjectInput) => Promise<IpcResult<Project>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface CertificationsApi {
  getAll: (filters?: CertificationFilters) => Promise<IpcResult<PaginatedResult<Certification>>>
  getById: (id: string) => Promise<IpcResult<Certification>>
  create: (data: CreateCertificationInput) => Promise<IpcResult<Certification>>
  update: (id: string, data: UpdateCertificationInput) => Promise<IpcResult<Certification>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface VideosApi {
  getAll: (filters?: VideoFilters) => Promise<IpcResult<PaginatedResult<Video>>>
  getById: (id: string) => Promise<IpcResult<Video>>
  create: (data: CreateVideoInput) => Promise<IpcResult<Video>>
  update: (id: string, data: UpdateVideoInput) => Promise<IpcResult<Video>>
  delete: (id: string) => Promise<IpcResult<void>>
  updateProgress: (id: string, seconds: number) => Promise<IpcResult<void>>
}

interface NotesApi {
  getAll: (filters?: NoteFilters) => Promise<IpcResult<PaginatedResult<Note>>>
  getById: (id: string) => Promise<IpcResult<Note>>
  create: (data: CreateNoteInput) => Promise<IpcResult<Note>>
  update: (id: string, data: UpdateNoteInput) => Promise<IpcResult<Note>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface DocumentsApi {
  getAll: (filters?: DocumentFilters) => Promise<IpcResult<PaginatedResult<Document>>>
  getById: (id: string) => Promise<IpcResult<Document>>
  create: (data: CreateDocumentInput) => Promise<IpcResult<Document>>
  update: (id: string, data: UpdateDocumentInput) => Promise<IpcResult<Document>>
  delete: (id: string) => Promise<IpcResult<void>>
  open: (id: string) => Promise<IpcResult<void>>
  rename: (id: string, newTitle: string, newFilename?: string) => UnknownResult
}

interface JournalApi {
  getAll: (filters?: JournalFilters) => Promise<IpcResult<PaginatedResult<JournalEntry>>>
  getById: (id: string) => Promise<IpcResult<JournalEntry>>
  create: (data: CreateJournalEntryInput) => Promise<IpcResult<JournalEntry>>
  update: (id: string, data: UpdateJournalEntryInput) => Promise<IpcResult<JournalEntry>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface TagsApi {
  getAll: () => Promise<IpcResult<Tag[]>>
  create: (data: CreateTagInput) => Promise<IpcResult<Tag>>
  update: (id: string, data: UpdateTagInput) => Promise<IpcResult<Tag>>
  delete: (id: string) => Promise<IpcResult<void>>
  getEntityTags: (entityType: EntityType, entityId: string) => Promise<IpcResult<Tag[]>>
  setEntityTags: (entityType: EntityType, entityId: string, tagIds: string[]) => Promise<IpcResult<void>>
}

export interface SearchHistoryItem {
  id: number
  query: string
  result_count: number
  searched_at: string
}

interface SearchHistoryApi {
  get: (limit?: number) => Promise<IpcResult<SearchHistoryItem[]>>
  clear: () => Promise<IpcResult<null>>
}

interface SearchApi {
  global: (query: string) => Promise<IpcResult<SearchResult[]>>
  module: (module: string, query: string) => Promise<IpcResult<SearchResult[]>>
  history: SearchHistoryApi
}

type ImportFileItem = { path: string; originalName: string; size: number; mimeType: string }

interface StorageApi {
  importFile:  (options: { category: string; accept?: string[]; title?: string }) => Promise<IpcResult<ImportFileItem>>
  importFiles: (options: { category: string; accept?: string[]; title?: string }) => Promise<IpcResult<{ items: ImportFileItem[] }>>
  openFile:    (filePath: string) => Promise<IpcResult<void>>
  showInFolder:(filePath: string) => Promise<IpcResult<void>>
}

// ─── Career Intelligence ─────────────────────────────────────────────────────

export interface CareerRoadmap {
  id: string
  title: string
  description: string | null
  category: string
  seniority_level: string | null
  estimated_months: number | null
  is_active: 0 | 1
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface RoadmapSkillItem {
  id: string
  roadmap_id: string
  skill_id: string | null
  skill_name: string
  target_level: string
  importance: string
  order_index: number
  created_at: string
  current_level: string | null
  current_status: string | null
}

export interface RoadmapCertificationItem {
  id: string
  roadmap_id: string
  certification_id: string | null
  name: string
  issuer: string | null
  importance: string
  order_index: number
  created_at: string
  cert_status: string | null
}

export interface RoadmapProjectItem {
  id: string
  roadmap_id: string
  project_id: string | null
  title: string
  description: string | null
  importance: string
  order_index: number
  created_at: string
  project_status: string | null
}

export interface RoadmapMilestone {
  id: string
  roadmap_id: string
  title: string
  description: string | null
  target_date: string | null
  is_completed: 0 | 1
  completed_at: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface RoadmapProgressData {
  total_skills: number
  completed_skills: number
  total_certifications: number
  completed_certifications: number
  total_projects: number
  completed_projects: number
  total_milestones: number
  completed_milestones: number
  progress_pct: number
  estimated_months_remaining: number | null
}

export interface CareerRoadmapDetail extends CareerRoadmap {
  skills: RoadmapSkillItem[]
  certifications: RoadmapCertificationItem[]
  projects: RoadmapProjectItem[]
  milestones: RoadmapMilestone[]
  progress: RoadmapProgressData
}

export interface SkillProgressItem {
  skill_id: string
  skill_name: string
  skill_slug: string
  category_name: string
  category_color: string
  current_level: string
  current_status: string
  years_experience: number
  target_level: string
  confidence_score: number
  last_studied_at: string | null
  weekly_goal_hours: number
  progress_pct: number
  updated_at: string
}

export interface StudySession {
  id: string
  skill_id: string | null
  skill_name: string | null
  title: string
  notes: string | null
  duration_minutes: number
  session_date: string
  created_at: string
}

export interface CoachRecommendations {
  job_readiness_score: number
  readiness_breakdown: {
    skills_score: number
    certifications_score: number
    projects_score: number
    experience_score: number
  }
  missing_skills: Array<{ name: string; importance: string; skill_id: string | null }>
  next_certification: string | null
  next_project: string | null
  weekly_study_plan: Array<{ skill_name: string; recommended_hours: number; reason: string }>
  top_skill_gaps: Array<{ skill_name: string; current_level: string; target_level: string; gap: number }>
}

export interface KnowledgeGraphData {
  nodes: Array<{
    id: string
    label: string
    type: 'skill' | 'project' | 'certification' | 'note' | 'document' | 'video' | 'lab' | 'interview_question'
    weight: number
    metadata: Record<string, string | number | null>
  }>
  edges: Array<{
    source: string
    target: string
    label: string
    type: 'skill-project' | 'skill-certification' | 'skill-video' | 'skill-occupation' | 'skill-lab' | 'skill-interview'
  }>
}

export interface AnalyticsDashboard {
  totals: {
    skills: number
    skills_mastered: number
    projects: number
    projects_completed: number
    certifications: number
    certifications_earned: number
    notes: number
    documents: number
    videos: number
    videos_completed: number
    study_sessions: number
    total_study_hours: number
  }
  skill_level_distribution: Array<{ level: string; count: number }>
  skill_status_distribution: Array<{ status: string; count: number }>
  recent_study_sessions: StudySession[]
  study_hours_by_week: Array<{ week: string; hours: number }>
  top_skills_by_progress: SkillProgressItem[]
  certification_status_distribution: Array<{ status: string; count: number }>
}

export interface CreateRoadmapInput {
  title: string
  description?: string | null
  category?: string
  seniority_level?: string | null
  estimated_months?: number | null
  is_active?: 0 | 1
  notes?: string | null
}

export interface RoadmapSkillInput {
  skill_id?: string | null
  skill_name: string
  target_level?: string
  importance?: string
  order_index?: number
}

export interface RoadmapCertInput {
  certification_id?: string | null
  name: string
  issuer?: string | null
  importance?: string
  order_index?: number
}

export interface RoadmapProjectInput {
  project_id?: string | null
  title: string
  description?: string | null
  importance?: string
  order_index?: number
}

export interface MilestoneInput {
  title: string
  description?: string | null
  target_date?: string | null
  order_index?: number
}

export interface UpsertSkillProgressInput {
  target_level?: string
  confidence_score?: number
  last_studied_at?: string | null
  weekly_goal_hours?: number
}

export interface LogStudySessionInput {
  skill_id?: string | null
  title: string
  notes?: string | null
  duration_minutes: number
  session_date: string
}

interface CareerRoadmapsApi {
  getAll: () => Promise<IpcResult<CareerRoadmap[]>>
  getById: (id: string) => Promise<IpcResult<CareerRoadmapDetail>>
  create: (data: CreateRoadmapInput) => Promise<IpcResult<CareerRoadmap>>
  update: (id: string, data: Partial<CreateRoadmapInput>) => Promise<IpcResult<CareerRoadmap>>
  delete: (id: string) => Promise<IpcResult<void>>
  setSkills: (roadmapId: string, skills: RoadmapSkillInput[]) => Promise<IpcResult<void>>
  setCertifications: (roadmapId: string, certs: RoadmapCertInput[]) => Promise<IpcResult<void>>
  setProjects: (roadmapId: string, projects: RoadmapProjectInput[]) => Promise<IpcResult<void>>
  setMilestones: (roadmapId: string, milestones: MilestoneInput[]) => Promise<IpcResult<void>>
  toggleMilestone: (id: string, completed: boolean) => Promise<IpcResult<RoadmapMilestone>>
}

interface SkillProgressApi {
  getAll: () => Promise<IpcResult<SkillProgressItem[]>>
  upsert: (skillId: string, data: UpsertSkillProgressInput) => Promise<IpcResult<void>>
}

interface StudySessionsApi {
  getAll: () => Promise<IpcResult<StudySession[]>>
  log: (data: LogStudySessionInput) => Promise<IpcResult<StudySession>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface CoachApi {
  getRecommendations: (roadmapId?: string) => Promise<IpcResult<CoachRecommendations>>
}

interface KnowledgeGraphApi {
  get: () => Promise<IpcResult<KnowledgeGraphData>>
}

interface AnalyticsApi {
  getDashboard: () => Promise<IpcResult<AnalyticsDashboard>>
}

interface CareerIntelligenceApi {
  roadmaps: CareerRoadmapsApi
  skillProgress: SkillProgressApi
  studySessions: StudySessionsApi
  coach: CoachApi
  knowledgeGraph: KnowledgeGraphApi
  analytics: AnalyticsApi
}

// ─── Home Labs ────────────────────────────────────────────────────────────────

interface HomeLabTasksApi {
  create: (data: { lab_id: string; title: string; order_index?: number }) => Promise<IpcResult<HomeLabTask>>
  update: (id: string, data: { title?: string; is_done?: 0 | 1; order_index?: number }) => Promise<IpcResult<HomeLabTask>>
  delete: (id: string, labId: string) => Promise<IpcResult<void>>
}

interface HomeLabProblemsApi {
  create: (data: { lab_id: string; problem: string; solution?: string | null }) => Promise<IpcResult<HomeLabProblem>>
  update: (id: string, data: { problem?: string; solution?: string | null }) => Promise<IpcResult<HomeLabProblem>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface HomeLabTimeApi {
  log: (data: { lab_id: string; duration_min: number; note?: string | null; logged_date?: string }) => Promise<IpcResult<HomeLabTimeEntry>>
  delete: (id: string) => Promise<IpcResult<void>>
  getAll: (labId: string) => Promise<IpcResult<HomeLabTimeEntry[]>>
}

interface HomeLabAssetsApi {
  create: (data: { lab_id: string; title: string; type?: string; file_path?: string | null; url?: string | null; notes?: string | null }) => Promise<IpcResult<HomeLabAsset>>
  update: (id: string, data: { title?: string; notes?: string | null }) => Promise<IpcResult<HomeLabAsset>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface HomeLabsApi {
  getAll: (filters?: HomeLabFilters) => Promise<IpcResult<PaginatedResult<HomeLabWithMeta>>>
  getById: (id: string) => Promise<IpcResult<HomeLabDetail>>
  create: (data: CreateHomeLabInput) => Promise<IpcResult<HomeLab>>
  update: (id: string, data: UpdateHomeLabInput) => Promise<IpcResult<HomeLab>>
  delete: (id: string) => Promise<IpcResult<void>>
  tasks: HomeLabTasksApi
  problems: HomeLabProblemsApi
  time: HomeLabTimeApi
  assets: HomeLabAssetsApi
}

// ─── Interview Questions ──────────────────────────────────────────────────────

interface InterviewCategoriesApi {
  getAll: () => Promise<IpcResult<InterviewCategory[]>>
  create: (data: CreateInterviewCategoryInput) => Promise<IpcResult<InterviewCategory>>
  update: (id: string, data: UpdateInterviewCategoryInput) => Promise<IpcResult<InterviewCategory>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface InterviewQuestionsApi {
  getAll: (filters?: InterviewQuestionFilters) => Promise<IpcResult<PaginatedResult<InterviewQuestionWithMeta>>>
  getById: (id: string) => Promise<IpcResult<InterviewQuestionWithMeta>>
  create: (data: CreateInterviewQuestionInput) => Promise<IpcResult<InterviewQuestionWithMeta>>
  update: (id: string, data: UpdateInterviewQuestionInput) => Promise<IpcResult<InterviewQuestionWithMeta>>
  delete: (id: string) => Promise<IpcResult<void>>
  getRandom: (params?: { category_id?: string; difficulty?: string; count?: number }) => Promise<IpcResult<InterviewQuestionWithMeta[]>>
  recordReview: (id: string, mastery_score: number) => Promise<IpcResult<InterviewQuestionWithMeta>>
  getProgress: () => Promise<IpcResult<QuestionProgressStats>>
}

// ─── Learning Dashboard ───────────────────────────────────────────────────────

export interface DashboardTotals {
  skills_total: number
  skills_mastered: number
  projects_total: number
  projects_completed: number
  certifications_total: number
  certifications_earned: number
  labs_total: number
  labs_completed: number
  interview_questions_total: number
  interview_questions_mastered: number
  total_study_minutes: number
  total_lab_minutes: number
}

export interface CareerReadinessScore {
  overall: number
  skills_score: number
  certifications_score: number
  projects_score: number
  labs_score: number
  interview_score: number
}

export interface WeeklyActivity {
  week_start: string
  study_minutes: number
  lab_minutes: number
  skills_added: number
  questions_reviewed: number
}

export interface MonthlyActivity {
  month: string
  study_minutes: number
  lab_minutes: number
  skills_added: number
  labs_completed: number
  certs_earned: number
  questions_mastered: number
}

export interface LearningDashboardData {
  totals: DashboardTotals
  career_readiness: CareerReadinessScore
  weekly_activity: WeeklyActivity[]
  monthly_activity: MonthlyActivity[]
  skill_growth: Array<{ month: string; count: number; mastered: number }>
  recent_activity: Array<{ type: string; id: string; title: string; detail: string; occurred_at: string }>
  top_skills: Array<{ name: string; category: string; level: string; status: string }>
  upcoming_cert_renewals: Array<{ name: string; issuer: string; expiry_date: string; days_left: number }>
}

export interface WeeklyReport {
  week_start: string
  week_end: string
  study_minutes: number
  lab_minutes: number
  skills_added: number
  skills_mastered: number
  labs_completed: number
  questions_reviewed: number
  questions_mastered: number
}

export interface MonthlyReport {
  month: string
  study_minutes: number
  lab_minutes: number
  skills_added: number
  skills_mastered: number
  labs_completed: number
  certs_earned: number
  questions_reviewed: number
  questions_mastered: number
  projects_completed: number
}

interface LearningDashboardApi {
  getDashboard: () => Promise<IpcResult<LearningDashboardData>>
  getWeeklyReport: (weekStart: string) => Promise<IpcResult<WeeklyReport>>
  getMonthlyReport: (month: string) => Promise<IpcResult<MonthlyReport>>
}

// ─── Skill Hub ────────────────────────────────────────────────────────────────

export interface SkillHubOverview {
  id: string
  name: string
  slug: string
  description: string | null
  proficiency_level: string
  status: string
  years_experience: number
  category_name: string
  category_color: string
  modules_total: number
  modules_complete: number
  hours_studied: number
  hours_practiced: number
  labs_total: number
  labs_complete: number
  projects_total: number
  projects_complete: number
  interview_total: number
  interview_avg_mastery: number
  resources_total: number
  resources_complete: number
  certs_total: number
  certs_earned: number
  last_activity_at: string | null
}

export interface SkillModule {
  id: string
  skill_id: string
  title: string
  description: string | null
  order_index: number
  is_complete: 0 | 1
  hours_spent: number
  notes: string | null
  completed_at: string | null
  topics: SkillModuleTopic[]
  created_at: string
  updated_at: string
}

export interface SkillModuleTopic {
  id: string
  module_id: string
  title: string
  is_complete: 0 | 1
  order_index: number
  created_at: string
  updated_at: string
}

export interface SkillResource {
  id: string
  skill_id: string
  title: string
  provider: string
  url: string | null
  difficulty: string
  est_hours: number
  notes: string | null
  is_completed: 0 | 1
  order_index: number
  created_at: string
  updated_at: string
}

export interface SkillExperienceEntry {
  id: string
  skill_id: string
  date: string
  task: string
  hours: number
  what_learned: string | null
  created_at: string
  updated_at: string
}

export interface SkillQuizQuestion {
  id: string
  skill_id: string
  question: string
  type: 'flashcard' | 'mcq' | 'scenario'
  answer: string | null
  options_json: string | null
  explanation: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  order_index: number
  created_at: string
  updated_at: string
}

export interface QuizAttemptStats {
  total_attempts: number
  correct_attempts: number
  accuracy_pct: number
}

export interface LinkedLab {
  id: string
  title: string
  status: string
  completion_pct: number
  total_minutes: number
  started_at: string | null
  completed_at: string | null
}

export interface LinkedProject {
  id: string
  title: string
  status: string
  type: string
  repo_url: string | null
  live_url: string | null
  completed_at: string | null
}

export interface LinkedCertification {
  id: string
  name: string
  issuer: string
  status: string
  issue_date: string | null
  expiry_date: string | null
}

export interface LinkedInterviewQuestion {
  id: string
  question: string
  difficulty: string
  mastery_score: number
  last_reviewed_at: string | null
  category_name: string
  category_color: string
}

export interface LinkedVideo {
  id: string
  title: string
  source: string
  watch_status: string
  duration_seconds: number | null
  thumbnail_path: string | null
  url: string | null
}

export interface RelatedSkill {
  id: string
  name: string
  slug: string
  proficiency_level: string
  status: string
  category_name: string
  category_color: string
}

export interface CreateSkillModuleInput {
  skill_id: string
  title: string
  description?: string | null
  order_index?: number
}

export interface UpdateSkillModuleInput {
  title?: string
  description?: string | null
  order_index?: number
  is_complete?: 0 | 1
  hours_spent?: number
  notes?: string | null
}

export interface CreateSkillModuleTopicInput {
  module_id: string
  title: string
  order_index?: number
}

export interface UpdateSkillModuleTopicInput {
  title?: string
  is_complete?: 0 | 1
  order_index?: number
}

export interface CreateSkillResourceInput {
  skill_id: string
  title: string
  provider?: string
  url?: string | null
  difficulty?: string
  est_hours?: number
  notes?: string | null
}

export interface UpdateSkillResourceInput {
  title?: string
  provider?: string
  url?: string | null
  difficulty?: string
  est_hours?: number
  notes?: string | null
  is_completed?: 0 | 1
  order_index?: number
}

export interface CreateSkillExperienceEntryInput {
  skill_id: string
  task: string
  hours: number
  date?: string
  what_learned?: string | null
}

export interface UpdateSkillExperienceEntryInput {
  date?: string
  task?: string
  hours?: number
  what_learned?: string | null
}

export interface CreateSkillQuizQuestionInput {
  skill_id: string
  question: string
  type?: 'flashcard' | 'mcq' | 'scenario'
  answer?: string | null
  options_json?: string | null
  explanation?: string | null
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface UpdateSkillQuizQuestionInput {
  question?: string
  type?: 'flashcard' | 'mcq' | 'scenario'
  answer?: string | null
  options_json?: string | null
  explanation?: string | null
  difficulty?: 'easy' | 'medium' | 'hard'
  order_index?: number
}

export interface LogQuizAttemptInput {
  skill_id: string
  question_id: string | null
  is_correct: 0 | 1
  time_taken_s?: number | null
  attempt_date?: string
}

interface SkillHubModulesApi {
  getAll:  (skillId: string) => Promise<IpcResult<SkillModule[]>>
  create:  (params: CreateSkillModuleInput) => Promise<IpcResult<SkillModule>>
  update:  (id: string, params: UpdateSkillModuleInput) => Promise<IpcResult<SkillModule>>
  delete:  (id: string) => Promise<IpcResult<void>>
  reorder: (skillId: string, ids: string[]) => Promise<IpcResult<void>>
}

interface SkillHubModuleTopicsApi {
  create: (params: CreateSkillModuleTopicInput) => Promise<IpcResult<SkillModuleTopic>>
  update: (id: string, params: UpdateSkillModuleTopicInput) => Promise<IpcResult<SkillModuleTopic>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface SkillHubResourcesApi {
  getAll: (skillId: string) => Promise<IpcResult<SkillResource[]>>
  create: (params: CreateSkillResourceInput) => Promise<IpcResult<SkillResource>>
  update: (id: string, params: UpdateSkillResourceInput) => Promise<IpcResult<SkillResource>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface SkillHubExperienceLogApi {
  getAll: (skillId: string) => Promise<IpcResult<SkillExperienceEntry[]>>
  create: (params: CreateSkillExperienceEntryInput) => Promise<IpcResult<SkillExperienceEntry>>
  update: (id: string, params: UpdateSkillExperienceEntryInput) => Promise<IpcResult<SkillExperienceEntry>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface SkillHubQuizQuestionsApi {
  getAll: (skillId: string) => Promise<IpcResult<SkillQuizQuestion[]>>
  create: (params: CreateSkillQuizQuestionInput) => Promise<IpcResult<SkillQuizQuestion>>
  update: (id: string, params: UpdateSkillQuizQuestionInput) => Promise<IpcResult<SkillQuizQuestion>>
  delete: (id: string) => Promise<IpcResult<void>>
}

interface SkillHubQuizAttemptsApi {
  log:      (params: LogQuizAttemptInput) => Promise<IpcResult<void>>
  getStats: (skillId: string) => Promise<IpcResult<QuizAttemptStats>>
}

interface SkillHubLinkedLabsApi {
  getAll: (skillId: string) => Promise<IpcResult<LinkedLab[]>>
  link:   (skillId: string, labId: string) => Promise<IpcResult<void>>
  unlink: (skillId: string, labId: string) => Promise<IpcResult<void>>
}

interface SkillHubLinkedProjectsApi {
  getAll: (skillId: string) => Promise<IpcResult<LinkedProject[]>>
  link:   (skillId: string, projectId: string) => Promise<IpcResult<void>>
  unlink: (skillId: string, projectId: string) => Promise<IpcResult<void>>
}

interface SkillHubLinkedCertificationsApi {
  getAll: (skillId: string) => Promise<IpcResult<LinkedCertification[]>>
  link:   (skillId: string, certId: string) => Promise<IpcResult<void>>
  unlink: (skillId: string, certId: string) => Promise<IpcResult<void>>
}

interface SkillHubLinkedInterviewQuestionsApi {
  getAll:  (skillId: string) => Promise<IpcResult<LinkedInterviewQuestion[]>>
  link:    (skillId: string, questionId: string) => Promise<IpcResult<void>>
  unlink:  (skillId: string, questionId: string) => Promise<IpcResult<void>>
}

interface SkillHubLinkedVideosApi {
  getAll: (skillId: string) => Promise<IpcResult<LinkedVideo[]>>
}

interface SkillHubRelatedSkillsApi {
  getAll: (skillId: string) => Promise<IpcResult<RelatedSkill[]>>
}

export interface SkillHubApi {
  getOverview:              (skillId: string) => Promise<IpcResult<SkillHubOverview>>
  modules:                  SkillHubModulesApi
  moduleTopics:             SkillHubModuleTopicsApi
  resources:                SkillHubResourcesApi
  experienceLog:            SkillHubExperienceLogApi
  quizQuestions:            SkillHubQuizQuestionsApi
  quizAttempts:             SkillHubQuizAttemptsApi
  linkedLabs:               SkillHubLinkedLabsApi
  linkedProjects:           SkillHubLinkedProjectsApi
  linkedCertifications:     SkillHubLinkedCertificationsApi
  linkedInterviewQuestions: SkillHubLinkedInterviewQuestionsApi
  linkedVideos:             SkillHubLinkedVideosApi
  relatedSkills:            SkillHubRelatedSkillsApi
}

// ─── Smart Learning Coach ─────────────────────────────────────────────────────

export interface LearningPathSkillItem {
  id: string
  path_id: string
  skill_id: string | null
  skill_name: string
  order_index: number
  why_it_matters: string | null
  prerequisites_json: string | null
  estimated_hours: number
  target_level: string
  is_unlocked: 0 | 1
  current_level: string | null
  current_status: string | null
  created_at: string
  updated_at: string
}

export interface LearningPath {
  id: string
  title: string
  career_goal: string
  description: string | null
  category: string
  seniority_level: string
  estimated_weeks: number
  available_hours_per_week: number
  is_active: 0 | 1
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  skills: LearningPathSkillItem[]
  total_skills: number
  completed_skills: number
  progress_pct: number
  next_skill: LearningPathSkillItem | null
}

export interface SkillMethodConfig {
  id: string
  skill_id: string
  skill_name: string
  home_lab_pct: number
  notes_pct: number
  videos_pct: number
  active_recall_pct: number
  flashcards_pct: number
  interview_pct: number
  projects_pct: number
  rationale: string | null
  is_custom: 0 | 1
  created_at: string
  updated_at: string
}

export interface RetentionRecord {
  id: string
  skill_id: string
  skill_name: string
  skill_slug: string
  category_name: string
  category_color: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  last_reviewed_at: string | null
  retention_score: number
  created_at: string
  updated_at: string
}

export interface ReviewLog {
  id: string
  skill_id: string
  skill_name: string
  quality: number
  ease_factor_after: number
  interval_after: number
  notes: string | null
  reviewed_at: string
  created_at: string
}

export interface StudyPlanItem {
  id: string
  plan_id: string
  skill_id: string | null
  skill_name: string
  action: string
  method: string
  estimated_minutes: number
  day_of_plan: number
  order_index: number
  is_done: 0 | 1
  done_at: string | null
  created_at: string
}

export interface StudyPlan {
  id: string
  title: string
  career_goal: string
  plan_type: string
  start_date: string
  end_date: string | null
  available_hours_per_week: number
  is_active: 0 | 1
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  items: StudyPlanItem[]
  completed_items: number
  total_items: number
  progress_pct: number
}

export interface SkillDependencyItem {
  skill_id: string
  skill_name: string
  prerequisite_id: string
  prerequisite_name: string
  strength: string
  created_at: string
}

export interface LearningCoachDependencyGraph {
  nodes: Array<{
    id: string
    name: string
    level: string
    status: string
    category: string
    category_color: string
    has_deps: boolean
    deps_met: boolean
  }>
  edges: Array<{
    from: string
    to: string
    strength: string
  }>
}

export interface LearningEffectivenessMetrics {
  total_study_minutes: number
  total_lab_minutes: number
  total_review_sessions: number
  avg_review_quality: number
  skills_with_retention: number
  avg_retention_score: number
  skills_due_for_review: number
  weekly_study_trend: Array<{ week: string; minutes: number; reviews: number }>
  skill_accuracy_stats: Array<{ skill_name: string; accuracy_pct: number; total_attempts: number }>
  top_retained_skills: Array<{ skill_name: string; retention_score: number; interval_days: number }>
  learning_velocity: number
}

export interface CreateLearningPathInput {
  title: string
  career_goal: string
  description?: string | null
  category?: string
  seniority_level?: string
  estimated_weeks?: number
  available_hours_per_week?: number
  notes?: string | null
}

export interface LearningPathSkillInput {
  skill_id?: string | null
  skill_name: string
  order_index?: number
  why_it_matters?: string | null
  prerequisites_json?: string | null
  estimated_hours?: number
  target_level?: string
}

export interface GenerateStudyPlanInput {
  title: string
  career_goal: string
  plan_type: 'daily' | 'weekly' | 'monthly'
  available_hours_per_week: number
  start_date?: string
  notes?: string | null
}

interface LearningCoachPathsApi {
  getAll: () => Promise<IpcResult<LearningPath[]>>
  getById: (id: string) => Promise<IpcResult<LearningPath>>
  create: (data: CreateLearningPathInput) => Promise<IpcResult<LearningPath>>
  update: (id: string, data: Partial<CreateLearningPathInput & { is_active: 0 | 1 }>) => Promise<IpcResult<LearningPath>>
  delete: (id: string) => Promise<IpcResult<void>>
  setSkills: (pathId: string, skills: LearningPathSkillInput[]) => Promise<IpcResult<void>>
}

interface LearningCoachMethodsApi {
  getAll: () => Promise<IpcResult<SkillMethodConfig[]>>
  getBySkill: (skillId: string) => Promise<IpcResult<SkillMethodConfig | null>>
  upsert: (skillId: string, data: Partial<Omit<SkillMethodConfig, 'id' | 'skill_id' | 'skill_name' | 'created_at' | 'updated_at'>>) => Promise<IpcResult<SkillMethodConfig>>
}

interface LearningCoachRetentionApi {
  getAll: () => Promise<IpcResult<RetentionRecord[]>>
  getDue: () => Promise<IpcResult<RetentionRecord[]>>
  upsert: (skillId: string) => Promise<IpcResult<RetentionRecord>>
  recordReview: (skillId: string, quality: number, notes?: string | null) => Promise<IpcResult<RetentionRecord>>
  getLogs: (skillId?: string) => Promise<IpcResult<ReviewLog[]>>
}

interface LearningCoachPlansApi {
  getAll: () => Promise<IpcResult<StudyPlan[]>>
  getById: (id: string) => Promise<IpcResult<StudyPlan>>
  generate: (input: GenerateStudyPlanInput) => Promise<IpcResult<StudyPlan>>
  delete: (id: string) => Promise<IpcResult<void>>
  markItemDone: (itemId: string, done: boolean) => Promise<IpcResult<StudyPlanItem>>
}

interface LearningCoachDepsApi {
  getAll: () => Promise<IpcResult<SkillDependencyItem[]>>
  add: (skillId: string, prerequisiteId: string, strength?: 'required' | 'recommended' | 'optional') => Promise<IpcResult<void>>
  remove: (skillId: string, prerequisiteId: string) => Promise<IpcResult<void>>
  getGraph: () => Promise<IpcResult<LearningCoachDependencyGraph>>
}

interface LearningCoachEffectivenessApi {
  getMetrics: () => Promise<IpcResult<LearningEffectivenessMetrics>>
}

export interface LearningCoachApi {
  learningPaths: LearningCoachPathsApi
  skillMethods: LearningCoachMethodsApi
  retention: LearningCoachRetentionApi
  studyPlans: LearningCoachPlansApi
  dependencies: LearningCoachDepsApi
  effectiveness: LearningCoachEffectivenessApi
}

// ── New Learning OS API types ─────────────────────────────────────────────────

type UnknownResult = Promise<IpcResult<unknown>>

interface SrsApi {
  getDue: () => UnknownResult
  getUpcoming: (days?: number) => UnknownResult
  getAll: () => UnknownResult
  getById: (id: string) => UnknownResult
  create: (data: unknown) => UnknownResult
  update: (id: string, data: unknown) => UnknownResult
  recordReview: (cardId: string, rating: number, timeSpentMs?: number) => UnknownResult
  delete: (id: string) => UnknownResult
  getReviewHistory: (cardId: string) => UnknownResult
  getStats: () => UnknownResult
  bulkFromInterview: () => UnknownResult
  bulkFromNotes: () => UnknownResult
}

interface FeynmanApi {
  getAll: () => UnknownResult
  create: (data: unknown) => UnknownResult
  update: (id: string, data: unknown) => UnknownResult
  delete: (id: string) => UnknownResult
}

interface AnnotationsApi {
  getByDocument: (documentId: string) => UnknownResult
  create: (data: unknown) => UnknownResult
  update: (id: string, data: unknown) => UnknownResult
  delete: (id: string) => UnknownResult
  deleteByDocument: (documentId: string) => UnknownResult
  getReadingProgress: (documentId: string) => UnknownResult
  updateReadingProgress: (documentId: string, currentPage: number, totalPages?: number, scrollPosition?: number, additionalMinutes?: number, completed?: boolean) => UnknownResult
  getReadingStats: () => UnknownResult
}

interface KnowledgeColorsApi {
  getAll: () => UnknownResult
  create: (data: unknown) => UnknownResult
  update: (id: string, data: unknown) => UnknownResult
  delete: (id: string) => UnknownResult
  reorder: (ids: string[]) => UnknownResult
}

interface ChallengesApi {
  getToday: () => UnknownResult
  getWeek: () => UnknownResult
  getAll: (type?: string) => UnknownResult
  create: (data: unknown) => UnknownResult
  start: (id: string) => UnknownResult
  updateProgress: (id: string, progress: number) => UnknownResult
  complete: (id: string, notes?: string) => UnknownResult
  generateDaily: () => UnknownResult
  generateWeekly: () => UnknownResult
  getStats: () => UnknownResult
}

interface ScenariosApi {
  getAll: (category?: string, difficulty?: string) => UnknownResult
  getById: (id: string) => UnknownResult
  getSteps: (id: string) => UnknownResult
  create: (data: unknown) => UnknownResult
  update: (id: string, data: unknown) => UnknownResult
  delete: (id: string) => UnknownResult
  getStats: () => UnknownResult
  steps: {
    add: (params: unknown) => UnknownResult
    update: (id: string, data: unknown) => UnknownResult
    delete: (id: string) => UnknownResult
  }
  attempts: {
    start: (scenarioId: string) => UnknownResult
    update: (id: string, data: unknown) => UnknownResult
    getByScenario: (scenarioId: string) => UnknownResult
  }
}

interface VaultApi {
  convertDocx:   (filePath: string) => UnknownResult
  readText:      (filePath: string) => UnknownResult
  getPdfPath:    (filePath: string) => UnknownResult
  readPdfBuffer: (filePath: string) => UnknownResult
}

interface PDFProgressData {
  document_id: string
  current_page: number
  total_pages: number | null
  zoom_level: number
  is_dark_mode: 0 | 1
  scroll_percent: number
  reading_time_sec: number
  completed: 0 | 1
  last_read_at: string
  created_at: string
  updated_at: string
}

interface PDFReaderApi {
  getProgress: (documentId: string) => Promise<{ success: true; data: PDFProgressData | null } | { success: false; error: string }>
  saveProgress: (documentId: string, params: {
    current_page?: number
    total_pages?: number
    zoom_level?: number
    is_dark_mode?: 0 | 1
    scroll_percent?: number
    reading_time_sec_delta?: number
    completed?: 0 | 1
  }) => UnknownResult
  deleteProgress: (documentId: string) => UnknownResult
  getRecent: (limit?: number) => UnknownResult
  getStats: () => UnknownResult
}

interface VaultCollectionsApi {
  getAll: () => UnknownResult
  create: (params: unknown) => UnknownResult
  update: (id: string, params: unknown) => UnknownResult
  delete: (id: string) => UnknownResult
  addDocument: (collectionId: string, documentId: string) => UnknownResult
  removeDocument: (collectionId: string, documentId: string) => UnknownResult
  getDocumentIds: (collectionId: string) => UnknownResult
}

interface VaultFavoritesApi {
  getAll: () => UnknownResult
  toggle: (documentId: string) => UnknownResult
}

interface VaultRecentApi {
  getAll: (limit?: number) => UnknownResult
  track: (documentId: string) => UnknownResult
  clear: () => UnknownResult
}

interface DisplayInfo {
  id: number
  label: string
  isPrimary: boolean
  bounds: { x: number; y: number; width: number; height: number }
}

interface WorkspaceApi {
  getState: () => UnknownResult
  saveState: (stateJson: string) => UnknownResult
  openFloatingWindow: (type: string, params?: Record<string, unknown>, displayId?: number) => UnknownResult
  getDisplays: () => Promise<{ success: true; data: DisplayInfo[] } | { success: false; error: string }>
}

interface PlaylistsApi {
  getAll: (skillId?: string) => UnknownResult
  getById: (id: string) => UnknownResult
  create: (data: unknown) => UnknownResult
  update: (id: string, data: unknown) => UnknownResult
  delete: (id: string) => UnknownResult
  items: {
    create: (data: unknown) => UnknownResult
    update: (id: string, data: unknown) => UnknownResult
    delete: (id: string) => UnknownResult
    reorder: (playlistId: string, orderedIds: string[]) => UnknownResult
  }
}

interface MarkdownApi {
  getAll: () => UnknownResult
  getById: (id: string) => UnknownResult
  create: (params: { title?: string; content?: string; tags?: string[] }) => UnknownResult
  update: (id: string, params: {
    title?: string
    content?: string
    tags?: string[]
    snapshot?: boolean
    snapshot_label?: string
  }) => UnknownResult
  delete: (id: string) => UnknownResult
  versions: {
    get: (documentId: string) => UnknownResult
    save: (documentId: string, label?: string) => UnknownResult
    restore: (documentId: string, versionId: string) => UnknownResult
    delete: (versionId: string) => UnknownResult
  }
}

// ─── DOCX Viewer ─────────────────────────────────────────────────────────────

interface DocxViewerCommentsApi {
  get: (documentId: string) => UnknownResult
  create: (params: {
    document_id: string
    paragraph_index: number
    char_offset_start: number
    char_offset_end: number
    selected_text?: string
    content: string
    color_hex?: string
  }) => UnknownResult
  update: (id: string, params: { content?: string; color_hex?: string }) => UnknownResult
  delete: (id: string) => UnknownResult
  resolve: (id: string) => UnknownResult
}

interface DocxViewerApi {
  convert: (filePath: string) => UnknownResult
  comments: DocxViewerCommentsApi
}

// ─── Code Workspace ───────────────────────────────────────────────────────────

interface CodeWorkspaceFoldersApi {
  getAll:  () => UnknownResult
  create:  (params: unknown) => UnknownResult
  update:  (id: string, params: unknown) => UnknownResult
  delete:  (id: string) => UnknownResult
}

interface CodeWorkspaceFilesApi {
  getAll:      () => UnknownResult
  getById:     (id: string) => UnknownResult
  create:      (params: unknown) => UnknownResult
  update:      (id: string, params: unknown) => UnknownResult
  saveContent: (id: string, content: string) => UnknownResult
  delete:      (id: string) => UnknownResult
}

interface CodeWorkspaceApi {
  folders: CodeWorkspaceFoldersApi
  files:   CodeWorkspaceFilesApi
}

// ─── Whiteboard ───────────────────────────────────────────────────────────────

interface WhiteboardLinksApi {
  get:    (whiteboardId: string) => UnknownResult
  add:    (whiteboardId: string, entityType: string, entityId: string) => UnknownResult
  remove: (whiteboardId: string, entityType: string, entityId: string) => UnknownResult
}

interface WhiteboardApi {
  getAll:     () => UnknownResult
  getById:    (id: string) => UnknownResult
  create:     (params: unknown) => UnknownResult
  update:     (id: string, params: unknown) => UnknownResult
  delete:     (id: string) => UnknownResult
  saveCanvas: (id: string, canvasData: string) => UnknownResult
  links: WhiteboardLinksApi
}

export interface CareerOsApi {
  app: AppApi
  skillHub: SkillHubApi
  skills: SkillsApi
  skillCategories: SkillCategoriesApi
  occupations: OccupationsApi
  projects: ProjectsApi
  projectAssets: ProjectAssetsApi
  certifications: CertificationsApi
  videos: VideosApi
  notes: NotesApi
  documents: DocumentsApi
  journal: JournalApi
  tags: TagsApi
  search: SearchApi
  storage: StorageApi
  careerIntelligence: CareerIntelligenceApi
  homeLabs: HomeLabsApi
  interviewQuestions: InterviewQuestionsApi
  interviewCategories: InterviewCategoriesApi
  learningDashboard: LearningDashboardApi
  learningCoach: LearningCoachApi
  srs: SrsApi
  feynman: FeynmanApi
  annotations: AnnotationsApi
  knowledgeColors: KnowledgeColorsApi
  challenges: ChallengesApi
  scenarios: ScenariosApi
  vault: VaultApi
  pdfReader: PDFReaderApi
  vaultCollections: VaultCollectionsApi
  vaultFavorites: VaultFavoritesApi
  vaultRecent: VaultRecentApi
  workspace: WorkspaceApi
  playlists: PlaylistsApi
  markdown: MarkdownApi
  docxViewer: DocxViewerApi
  codeWorkspace: CodeWorkspaceApi
  whiteboard: WhiteboardApi
  knowledgeGraph: KgApi
}

declare global {
  interface Window {
    api: CareerOsApi
  }
}

// ─── Knowledge Graph ──────────────────────────────────────────────────────────

export type KgEntityType =
  | 'skill'
  | 'project'
  | 'lab'
  | 'document'
  | 'video'
  | 'interview_question'
  | 'certification'
  | 'note'
  | 'concept'

export interface KgNode {
  id: string
  entity_type: KgEntityType
  entity_id: string | null
  label: string
  description: string | null
  color: string | null
  created_at: string
  updated_at: string
  link_count: number
}

export interface KgLink {
  id: string
  source_id: string
  target_id: string
  label: string | null
  link_type: string
  created_at: string
  source_label: string
  target_label: string
}

export interface KgGraphData {
  nodes: KgNode[]
  links: KgLink[]
}

export interface KgEntitySearchResult {
  id: string
  label: string
  entity_type: KgEntityType
  subtitle: string | null
}

export interface CreateKgNodeInput {
  entity_type: KgEntityType
  entity_id?: string | null
  label: string
  description?: string | null
  color?: string | null
}

export interface UpdateKgNodeInput {
  label?: string
  description?: string | null
  color?: string | null
}

export interface CreateKgLinkInput {
  source_id: string
  target_id: string
  label?: string | null
  link_type?: string
}

interface KgNodesApi {
  getAll: () => Promise<IpcResult<KgNode[]>>
  create: (params: CreateKgNodeInput) => Promise<IpcResult<KgNode>>
  update: (id: string, params: UpdateKgNodeInput) => Promise<IpcResult<KgNode>>
  delete: (id: string) => Promise<IpcResult<boolean>>
}

interface KgLinksApi {
  getAll: () => Promise<IpcResult<KgLink[]>>
  create: (params: CreateKgLinkInput) => Promise<IpcResult<KgLink>>
  delete: (id: string) => Promise<IpcResult<boolean>>
}

interface KgApi {
  getGraph: () => Promise<IpcResult<KgGraphData>>
  searchEntities: (query: string, entityType?: KgEntityType) => Promise<IpcResult<KgEntitySearchResult[]>>
  nodes: KgNodesApi
  links: KgLinksApi
}
