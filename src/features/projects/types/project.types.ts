import type { BaseEntity } from '@shared/types/common.types'

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

export interface ProjectWithMeta extends Project {
  skill_count: number
  asset_count: number
  tag_count: number
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

export interface SkillRef {
  id: string
  name: string
  proficiency_level: string
  status: string
  category_name: string
  category_color: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  color_hex: string
}

export interface ProjectDetail extends ProjectWithMeta {
  assets: ProjectAsset[]
  skills: SkillRef[]
  tags: Tag[]
}

export interface ProjectFilters {
  search: string
  status: ProjectStatus | ''
  type: ProjectType | ''
  is_featured: boolean | null
}

export interface PaginatedProjects {
  items: ProjectWithMeta[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
