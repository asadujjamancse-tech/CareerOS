import type { BaseEntity } from '@shared/types/common.types'

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

export interface DocumentWithTags extends Document {
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

export interface DocumentDetail extends DocumentWithTags {
  tags: Tag[]
}

export interface DocumentFilters {
  search: string
  type: DocumentType | ''
}

export interface PaginatedDocuments {
  items: DocumentWithTags[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
