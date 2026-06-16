export interface MarkdownDocument {
  id: string
  title: string
  content: string
  frontmatter: string
  word_count: number
  tags: string
  created_at: string
  updated_at: string
}

export interface MarkdownVersion {
  id: string
  document_id: string
  content: string
  title: string
  version_number: number
  label: string | null
  created_at: string
}

export type EditorView = 'edit' | 'split' | 'preview'
