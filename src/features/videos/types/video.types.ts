import type { BaseEntity } from '@shared/types/common.types'

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

export interface VideoWithMeta extends Video {
  skill_count: number
  tag_count: number
}

export interface SkillRef {
  id: string
  name: string
  category_name: string
  category_color: string
  proficiency_level: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  color_hex: string
  created_at: string
  updated_at: string
}

export interface VideoDetail extends VideoWithMeta {
  skills: SkillRef[]
  tags: Tag[]
}

export interface VideoFilters {
  search: string
  source: VideoSource | ''
  watch_status: VideoWatchStatus | ''
}

export interface PaginatedVideos {
  items: VideoWithMeta[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
