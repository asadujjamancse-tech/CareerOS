import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type {
  ProjectWithMeta,
  ProjectDetail,
  ProjectFilters,
  PaginatedProjects,
} from '../types/project.types'
import type { ProjectFormValues } from '../schemas/project.schema'

interface ProjectsState {
  items: ProjectWithMeta[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isLoading: boolean
  listError: string | null

  filters: ProjectFilters
  setSearch: (search: string) => void
  setFilterField: <K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) => void
  clearFilters: () => void

  detail: ProjectDetail | null
  isLoadingDetail: boolean

  isFormOpen: boolean
  editingId: string | null
  isSubmitting: boolean
  formError: string | null

  deletingId: string | null
  isDeleting: boolean

  fetch: () => Promise<void>
  setPage: (page: number) => void
  fetchDetail: (id: string) => Promise<void>
  openCreate: () => void
  openEdit: (id: string) => void
  closeForm: () => void
  submit: (values: ProjectFormValues) => Promise<boolean>
  confirmDelete: (id: string) => void
  cancelDelete: () => void
  executeDelete: () => Promise<boolean>
}

const DEFAULT_FILTERS: ProjectFilters = {
  search: '',
  status: '',
  type: '',
  is_featured: null,
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 24,
  totalPages: 0,
  isLoading: false,
  listError: null,

  filters: { ...DEFAULT_FILTERS },

  setSearch(search) {
    set(s => ({ filters: { ...s.filters, search }, page: 1 }))
    void get().fetch()
  },

  setFilterField(key, value) {
    set(s => ({ filters: { ...s.filters, [key]: value }, page: 1 }))
    void get().fetch()
  },

  clearFilters() {
    set({ filters: { ...DEFAULT_FILTERS }, page: 1 })
    void get().fetch()
  },

  detail: null,
  isLoadingDetail: false,
  isFormOpen: false,
  editingId: null,
  isSubmitting: false,
  formError: null,
  deletingId: null,
  isDeleting: false,

  async fetch() {
    const { filters, page, pageSize } = get()
    set({ isLoading: true, listError: null })
    try {
      const result = await api.projects.getAll({
        search: filters.search || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
        is_featured: filters.is_featured ?? undefined,
        page,
        pageSize,
      })
      if (result.success) {
        const p = result.data as PaginatedProjects
        set({ items: p.items, total: p.total, totalPages: p.totalPages })
      } else {
        set({ listError: result.error })
      }
    } catch {
      set({ listError: 'Failed to load projects' })
    } finally {
      set({ isLoading: false })
    }
  },

  setPage(page) {
    set({ page })
    void get().fetch()
  },

  async fetchDetail(id) {
    set({ isLoadingDetail: true, detail: null })
    try {
      const result = await api.projects.getById(id)
      if (result.success) set({ detail: result.data as ProjectDetail })
    } finally {
      set({ isLoadingDetail: false })
    }
  },

  openCreate() {
    set({ isFormOpen: true, editingId: null, formError: null })
  },

  openEdit(id) {
    set({ isFormOpen: true, editingId: id, formError: null })
    void get().fetchDetail(id)
  },

  closeForm() {
    set({ isFormOpen: false, editingId: null, detail: null, formError: null })
  },

  async submit(values) {
    set({ isSubmitting: true, formError: null })
    const { editingId } = get()

    const payload = {
      title: values.title,
      summary: values.summary || null,
      description: values.description || null,
      status: values.status,
      type: values.type,
      repo_url: values.repo_url || null,
      live_url: values.live_url || null,
      is_featured: values.is_featured ? (1 as const) : (0 as const),
      started_at: values.started_at || null,
      completed_at: values.completed_at || null,
      skill_ids: values.skill_ids,
      tag_ids: values.tag_ids,
    }

    try {
      const result = editingId
        ? await api.projects.update(editingId, payload)
        : await api.projects.create(payload)

      if (result.success) {
        set({ isFormOpen: false, editingId: null, detail: null })
        void get().fetch()
        return true
      }
      set({ formError: result.error })
      return false
    } catch {
      set({ formError: 'An unexpected error occurred' })
      return false
    } finally {
      set({ isSubmitting: false })
    }
  },

  confirmDelete(id) {
    set({ deletingId: id })
  },

  cancelDelete() {
    set({ deletingId: null })
  },

  async executeDelete() {
    const { deletingId } = get()
    if (!deletingId) return false
    set({ isDeleting: true })
    try {
      const result = await api.projects.delete(deletingId)
      if (result.success) {
        set({ deletingId: null })
        void get().fetch()
        return true
      }
      return false
    } catch {
      return false
    } finally {
      set({ isDeleting: false })
    }
  },
}))
