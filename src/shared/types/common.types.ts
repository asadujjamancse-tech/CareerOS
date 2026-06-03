export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string }

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ListFilters {
  search?: string
  page?: number
  pageSize?: number
  orderBy?: string
  orderDir?: 'asc' | 'desc'
}

export interface AppPaths {
  userData: string
  documents: string
  home: string
  data: string
  database: string
  attachments: string
  exports: string
  backups: string
}
