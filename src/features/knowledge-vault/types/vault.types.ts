export type AnnotationType = 'highlight' | 'note' | 'bookmark' | 'comment'
export type SourceType = 'local' | 'youtube' | 'website' | 'ms-learn' | 'github' | 'custom'

export interface VaultAnnotation {
  id: string
  document_id: string
  type: AnnotationType
  color_hex: string
  color_meaning: string | null
  page_number: number | null
  position_json: string
  selected_text: string | null
  content: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface AnnotationPosition {
  x: number
  y: number
  width: number
  height: number
  pageWidth: number
  pageHeight: number
}

export interface ReadingProgress {
  document_id: string
  current_page: number
  total_pages: number | null
  scroll_position: number
  reading_time_min: number
  completed: 0 | 1
  last_read_at: string
  first_opened_at: string
}

export interface KnowledgeColor {
  id: string
  color_hex: string
  name: string
  meaning: string
  description: string | null
  order_index: number
  is_system: 0 | 1
  created_at: string
  updated_at: string
}

export interface VaultCollection {
  id: string
  name: string
  description: string | null
  color_hex: string
  icon: string
  parent_id: string | null
  order_index: number
  doc_count: number
  created_at: string
  updated_at: string
}

export type VaultSidebarView = 'all' | 'favorites' | 'recent' | `collection:${string}`

export type VaultViewMode = 'list' | 'pdf-reader' | 'doc-reader' | 'text-reader' | 'web-reader'

export interface VaultDocument {
  id: string
  title: string
  description: string | null
  file_path: string
  original_filename: string
  mime_type: string | null
  file_size_bytes: number | null
  type: string
  version: string
  notes: string | null
  tag_count: number
  created_at: string
  updated_at: string
}
