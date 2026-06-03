import type { BaseEntity } from '@shared/types/common.types'

export type OccupationStatus = 'aspirational' | 'active' | 'completed' | 'archived'
export type OccupationSeniorityLevel =
  | 'junior' | 'mid' | 'senior' | 'lead' | 'principal'
  | 'staff' | 'director' | 'vp' | 'c-level'
export type OccupationSkillImportance = 'critical' | 'important' | 'nice-to-have'

export interface Occupation extends BaseEntity {
  title: string
  description: string | null
  industry: string | null
  seniority_level: OccupationSeniorityLevel | null
  status: OccupationStatus
  target_date: string | null
  notes: string | null
}

export interface OccupationWithStats extends Occupation {
  skill_count: number
  acquired_count: number
  critical_count: number
  tag_count: number
}

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
  skill_name: string
  skill_category_name: string
  skill_category_color: string
  skill_proficiency_level: string
  skill_status: string
}

export interface SkillEntry {
  skill_id: string
  importance: OccupationSkillImportance
}

export interface Tag {
  id: string
  name: string
  slug: string
  color_hex: string
  created_at: string
  updated_at: string
}

export interface OccupationDetail extends OccupationWithStats {
  skills: OccupationSkill[]
  tags: Tag[]
}

export interface OccupationFilters {
  search: string
  status: OccupationStatus | ''
  seniority_level: OccupationSeniorityLevel | ''
}

export interface PaginatedOccupations {
  items: OccupationWithStats[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
