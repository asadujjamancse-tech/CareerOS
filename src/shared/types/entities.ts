import type { BaseEntity } from './common.types'

// ─── Skill Categories ───────────────────────────────────────────────────────

export interface SkillCategory {
  id: string
  name: string
  description: string | null
  color_hex: string
  icon: string | null
  parent_id: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface CreateSkillCategoryInput {
  name: string
  description?: string | null
  color_hex?: string
  icon?: string | null
  parent_id?: string | null
  order_index?: number
}

export interface UpdateSkillCategoryInput extends Partial<CreateSkillCategoryInput> {}

// ─── Skills ─────────────────────────────────────────────────────────────────

export type SkillProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type SkillStatus = 'learning' | 'practicing' | 'proficient' | 'mastered'

export interface Skill extends BaseEntity {
  name: string
  slug: string
  description: string | null
  category_id: string
  proficiency_level: SkillProficiencyLevel
  status: SkillStatus
  years_experience: number
  notes: string | null
  is_public: 0 | 1
}

export interface CreateSkillInput {
  name: string
  description?: string | null
  category_id: string
  proficiency_level?: SkillProficiencyLevel
  status?: SkillStatus
  years_experience?: number
  notes?: string | null
  is_public?: 0 | 1
  tag_ids?: string[]
}

export interface UpdateSkillInput extends Partial<CreateSkillInput> {}

export interface SkillFilters {
  category_id?: string | undefined
  proficiency_level?: SkillProficiencyLevel | undefined
  status?: SkillStatus | undefined
  search?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

// ─── Occupations ────────────────────────────────────────────────────────────

export type OccupationSeniorityLevel =
  | 'junior' | 'mid' | 'senior' | 'lead' | 'principal'
  | 'staff' | 'director' | 'vp' | 'c-level'

export type OccupationStatus = 'aspirational' | 'active' | 'completed' | 'archived'

export interface Occupation extends BaseEntity {
  title: string
  description: string | null
  industry: string | null
  seniority_level: OccupationSeniorityLevel | null
  status: OccupationStatus
  target_date: string | null
  notes: string | null
}

export type OccupationSkillImportance = 'critical' | 'important' | 'nice-to-have'

export interface OccupationSkill {
  id: string
  occupation_id: string
  skill_id: string
  importance: OccupationSkillImportance
  is_acquired: 0 | 1
  order_index: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateOccupationInput {
  title: string
  description?: string | null
  industry?: string | null
  seniority_level?: OccupationSeniorityLevel | null
  status?: OccupationStatus
  target_date?: string | null
  notes?: string | null
}

export interface UpdateOccupationInput extends Partial<CreateOccupationInput> {}

export interface OccupationFilters {
  status?: OccupationStatus | undefined
  seniority_level?: OccupationSeniorityLevel | undefined
  search?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

// ─── Projects ───────────────────────────────────────────────────────────────

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'paused' | 'abandoned'
export type ProjectType = 'personal' | 'professional' | 'open-source' | 'freelance' | 'academic'
export type ProjectAssetType = 'image' | 'video' | 'document' | 'link' | 'screenshot' | 'demo' | 'other'

export interface Project extends BaseEntity {
  title: string
  slug: string
  summary: string | null
  description: string | null
  status: ProjectStatus
  type: ProjectType
  repo_url: string | null
  live_url: string | null
  cover_image_path: string | null
  is_featured: 0 | 1
  started_at: string | null
  completed_at: string | null
}

export interface ProjectAsset {
  id: string
  project_id: string
  title: string
  description: string | null
  type: ProjectAssetType
  file_path: string | null
  url: string | null
  mime_type: string | null
  file_size_bytes: number | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface CreateProjectInput {
  title: string
  summary?: string | null
  description?: string | null
  status?: ProjectStatus
  type?: ProjectType
  repo_url?: string | null
  live_url?: string | null
  is_featured?: 0 | 1
  started_at?: string | null
  completed_at?: string | null
  skill_ids?: string[]
  tag_ids?: string[]
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

export interface ProjectFilters {
  status?: ProjectStatus | undefined
  type?: ProjectType | undefined
  is_featured?: boolean | undefined
  search?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

// ─── Certifications ─────────────────────────────────────────────────────────

export type CertificationStatus = 'planned' | 'in-progress' | 'earned' | 'expired' | 'revoked'

export interface Certification extends BaseEntity {
  name: string
  issuer: string
  description: string | null
  status: CertificationStatus
  credential_id: string | null
  credential_url: string | null
  certificate_path: string | null
  issue_date: string | null
  expiry_date: string | null
  score: number | null
  passing_score: number | null
  notes: string | null
}

export interface CreateCertificationInput {
  name: string
  issuer: string
  description?: string | null
  status?: CertificationStatus
  credential_id?: string | null
  credential_url?: string | null
  issue_date?: string | null
  expiry_date?: string | null
  score?: number | null
  passing_score?: number | null
  notes?: string | null
}

export interface UpdateCertificationInput extends Partial<CreateCertificationInput> {}

export interface CertificationFilters {
  status?: CertificationStatus | undefined
  search?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

// ─── Videos ─────────────────────────────────────────────────────────────────

export type VideoSource = 'youtube' | 'vimeo' | 'udemy' | 'coursera' | 'pluralsight' | 'local' | 'other'
export type VideoWatchStatus = 'unwatched' | 'watching' | 'completed' | 'revisit'

export interface Video extends BaseEntity {
  title: string
  description: string | null
  url: string | null
  local_path: string | null
  source: VideoSource
  channel: string | null
  duration_seconds: number | null
  watch_status: VideoWatchStatus
  progress_seconds: number
  thumbnail_path: string | null
  published_at: string | null
  notes: string | null
}

export interface CreateVideoInput {
  title: string
  description?: string | null
  url?: string | null
  local_path?: string | null
  source?: VideoSource
  channel?: string | null
  duration_seconds?: number | null
  watch_status?: VideoWatchStatus
  thumbnail_path?: string | null
  published_at?: string | null
  notes?: string | null
  skill_ids?: string[]
  tag_ids?: string[]
}

export interface UpdateVideoInput extends Partial<CreateVideoInput> {}

export interface VideoFilters {
  source?: VideoSource | undefined
  watch_status?: VideoWatchStatus | undefined
  search?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export type NoteType = 'general' | 'meeting' | 'research' | 'tutorial' | 'reference' | 'idea'

export interface Note extends BaseEntity {
  title: string
  content: string
  type: NoteType
  is_pinned: 0 | 1
}

export interface CreateNoteInput {
  title: string
  content?: string
  type?: NoteType
  is_pinned?: boolean | 0 | 1
  tag_ids?: string[]
}

export interface UpdateNoteInput extends Partial<CreateNoteInput> {}

export interface NoteFilters {
  type?: NoteType | undefined
  is_pinned?: boolean | undefined
  search?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

// ─── Documents ──────────────────────────────────────────────────────────────

export type DocumentType =
  | 'resume' | 'cover-letter' | 'certificate' | 'report' | 'template' | 'reference' | 'other'

export interface Document extends BaseEntity {
  title: string
  description: string | null
  file_path: string
  original_filename: string
  mime_type: string | null
  file_size_bytes: number | null
  type: DocumentType
  version: string
  notes: string | null
}

export interface CreateDocumentInput {
  title: string
  description?: string | null
  file_path: string
  original_filename: string
  mime_type?: string | null
  file_size_bytes?: number | null
  type?: DocumentType
  version?: string
  notes?: string | null
  tag_ids?: string[]
}

export interface UpdateDocumentInput extends Partial<Omit<CreateDocumentInput, 'file_path' | 'original_filename'>> {}

export interface DocumentFilters {
  type?: DocumentType | undefined
  search?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

// ─── Journal ────────────────────────────────────────────────────────────────

export type JournalMood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
export type JournalCategory =
  | 'achievement' | 'challenge' | 'reflection' | 'learning' | 'goal' | 'feedback' | 'general'

export interface JournalEntry extends BaseEntity {
  title: string
  content: string
  entry_date: string
  mood: JournalMood | null
  energy_level: number | null
  category: JournalCategory
  is_private: 0 | 1
}

export interface CreateJournalEntryInput {
  title: string
  content?: string
  entry_date: string
  mood?: JournalMood | null
  energy_level?: number | null
  category?: JournalCategory
  is_private?: boolean | 0 | 1
  tag_ids?: string[]
}

export interface UpdateJournalEntryInput extends Partial<CreateJournalEntryInput> {}

export interface JournalFilters {
  category?: JournalCategory | undefined
  mood?: JournalMood | undefined
  search?: string | undefined
  from_date?: string | undefined
  to_date?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export type EntityType =
  | 'skill' | 'occupation' | 'project' | 'certification'
  | 'video' | 'note' | 'document' | 'journal_entry'
  | 'home_lab' | 'interview_question'

export interface Tag {
  id: string
  name: string
  slug: string
  color_hex: string
  created_at: string
  updated_at: string
}

export interface CreateTagInput {
  name: string
  color_hex?: string
}

export interface UpdateTagInput extends Partial<CreateTagInput> {}

// ─── Home Labs ───────────────────────────────────────────────────────────────

export type HomeLabStatus = 'planned' | 'in-progress' | 'completed' | 'paused' | 'abandoned'
export type HomeLabAssetType = 'screenshot' | 'document' | 'link' | 'other'

export interface HomeLab extends BaseEntity {
  title: string
  slug: string
  description: string | null
  status: HomeLabStatus
  notes: string | null
  lessons_learned: string | null
  completion_pct: number
  started_at: string | null
  completed_at: string | null
}

export interface HomeLabTask {
  id: string
  lab_id: string
  title: string
  is_done: 0 | 1
  order_index: number
  created_at: string
  updated_at: string
}

export interface HomeLabProblem {
  id: string
  lab_id: string
  problem: string
  solution: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface HomeLabTimeEntry {
  id: string
  lab_id: string
  duration_min: number
  note: string | null
  logged_date: string
  created_at: string
}

export interface HomeLabAsset {
  id: string
  lab_id: string
  title: string
  type: HomeLabAssetType
  file_path: string | null
  url: string | null
  notes: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface HomeLabSkillRef {
  id: string
  name: string
  category_name: string
  category_color: string
  proficiency_level: string
}

export interface HomeLabCertRef {
  id: string
  name: string
  issuer: string
  status: string
}

export interface HomeLabWithMeta extends HomeLab {
  task_count: number
  done_task_count: number
  total_minutes: number
  skill_count: number
  problem_count: number
  asset_count: number
}

export interface HomeLabDetail extends HomeLabWithMeta {
  tasks: HomeLabTask[]
  problems: HomeLabProblem[]
  time_entries: HomeLabTimeEntry[]
  assets: HomeLabAsset[]
  skills: HomeLabSkillRef[]
  certifications: HomeLabCertRef[]
}

export interface CreateHomeLabInput {
  title: string
  description?: string | null
  status?: HomeLabStatus
  notes?: string | null
  lessons_learned?: string | null
  completion_pct?: number
  started_at?: string | null
  completed_at?: string | null
  skill_ids?: string[]
  certification_ids?: string[]
}

export interface UpdateHomeLabInput extends Partial<CreateHomeLabInput> {}

export interface HomeLabFilters {
  status?: HomeLabStatus | undefined
  search?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

// ─── Interview Questions ──────────────────────────────────────────────────────

export type InterviewDifficulty = 'easy' | 'medium' | 'hard'

export interface InterviewCategory {
  id: string
  name: string
  description: string | null
  color_hex: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface InterviewQuestion extends BaseEntity {
  category_id: string
  question: string
  difficulty: InterviewDifficulty
  personal_answer: string | null
  ideal_answer: string | null
  notes: string | null
  mastery_score: number
  last_reviewed_at: string | null
  review_count: number
}

export interface InterviewQuestionWithMeta extends InterviewQuestion {
  category_name: string
  category_color: string
}

export interface CreateInterviewCategoryInput {
  name: string
  description?: string | null
  color_hex?: string
  order_index?: number
}

export interface UpdateInterviewCategoryInput extends Partial<CreateInterviewCategoryInput> {}

export interface CreateInterviewQuestionInput {
  category_id: string
  question: string
  difficulty?: InterviewDifficulty
  personal_answer?: string | null
  ideal_answer?: string | null
  notes?: string | null
  mastery_score?: number
}

export interface UpdateInterviewQuestionInput extends Partial<CreateInterviewQuestionInput> {
  last_reviewed_at?: string | null
}

export interface InterviewQuestionFilters {
  search?: string | undefined
  category_id?: string | undefined
  difficulty?: InterviewDifficulty | undefined
  mastery_min?: number | undefined
  mastery_max?: number | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

export interface QuestionProgressStats {
  total: number
  mastered_count: number
  avg_mastery: number
  by_difficulty: Array<{ difficulty: string; count: number }>
  by_mastery: Array<{ score: number; count: number }>
  by_category: Array<{ category_id: string; category_name: string; total: number; mastered: number }>
}

// ─── Search ─────────────────────────────────────────────────────────────────

export interface SearchResult {
  entity_type: EntityType
  entity_id: string
  title: string
  excerpt: string
  subtitle: string
  rank: number
}
