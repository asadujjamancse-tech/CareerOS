import type { BaseEntity } from '@shared/types/common.types'

export type NoteType = 'general' | 'meeting' | 'research' | 'tutorial' | 'reference' | 'idea'

export interface Note extends BaseEntity {
  title: string
  content: string
  type: NoteType
  is_pinned: 0 | 1
}

export interface NoteWithTags extends Note {
  tag_count: number
}

export interface Tag {
  id: string; name: string; slug: string; color_hex: string; created_at: string; updated_at: string
}

export interface NoteDetail extends NoteWithTags { tags: Tag[] }

export interface NoteFilters {
  search: string
  type: NoteType | ''
  is_pinned: boolean | null
}

export interface PaginatedNotes {
  items: NoteWithTags[]; total: number; page: number; pageSize: number; totalPages: number
}
