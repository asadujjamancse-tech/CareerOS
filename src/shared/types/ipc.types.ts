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

interface SearchApi {
  global: (query: string) => Promise<IpcResult<SearchResult[]>>
  module: (module: EntityType, query: string) => Promise<IpcResult<SearchResult[]>>
}

interface StorageApi {
  importFile: (options: { category: string; accept?: string[]; title?: string }) => Promise<IpcResult<{ path: string; originalName: string; size: number; mimeType: string }>>
  openFile: (filePath: string) => Promise<IpcResult<void>>
  showInFolder: (filePath: string) => Promise<IpcResult<void>>
}

export interface CareerOsApi {
  app: AppApi
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
}

declare global {
  interface Window {
    api: CareerOsApi
  }
}
