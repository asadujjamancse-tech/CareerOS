import type { BaseEntity } from '@shared/types/common.types'

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

export interface SkillWithCategory extends Skill {
  category_name: string
  category_color: string
  tag_count: number
}

export interface Tag {
  id: string
  name: string
  slug: string
  color_hex: string
  created_at: string
  updated_at: string
}

export interface OccupationRef {
  id: string
  title: string
  seniority_level: string | null
  status: string
  importance: string
  is_acquired: 0 | 1
}

export interface VideoRef {
  id: string
  title: string
  source: string
  watch_status: string
  duration_seconds: number | null
  thumbnail_path: string | null
}

export interface SkillDetail extends SkillWithCategory {
  tags: Tag[]
  related_occupations: OccupationRef[]
  related_videos: VideoRef[]
}

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

export interface SkillFilters {
  search: string
  category_id: string
  proficiency_level: SkillProficiencyLevel | ''
  status: SkillStatus | ''
}

export interface PaginatedSkills {
  items: SkillWithCategory[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
