import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type {
  OccupationWithStats,
  OccupationDetail,
  OccupationFilters,
  PaginatedOccupations,
} from '../types/occupation.types'
import type { OccupationFormValues } from '../schemas/occupation.schema'

interface OccupationsState {
  // List
  items: OccupationWithStats[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isLoading: boolean
  listError: string | null

  // Filters
  filters: OccupationFilters
  setSearch: (search: string) => void
  setFilterField: <K extends keyof OccupationFilters>(key: K, value: OccupationFilters[K]) => void
  clearFilters: () => void

  // Detail
  detail: OccupationDetail | null
  isLoadingDetail: boolean

  // Form
  isFormOpen: boolean
  editingId: string | null
  isSubmitting: boolean
  formError: string | null

  // Delete
  deletingId: string | null
  isDeleting: boolean

  // Actions
  fetch: () => Promise<void>
  setPage: (page: number) => void
  fetchDetail: (id: string) => Promise<void>
  openCreate: () => void
  openEdit: (id: string) => void
  closeForm: () => void
  submit: (values: OccupationFormValues) => Promise<boolean>
  confirmDelete: (id: string) => void
  cancelDelete: () => void
  executeDelete: () => Promise<boolean>
}

const DEFAULT_FILTERS: OccupationFilters = {
  search: '',
  status: '',
  seniority_level: '',
}

export const useOccupationsStore = create<OccupationsState>((set, get) => ({
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
      const result = await api.occupations.getAll({
        search:          filters.search          || undefined,
        status:          filters.status          || undefined,
        seniority_level: filters.seniority_level || undefined,
        page,
        pageSize,
      })
      if (result.success) {
        const p = result.data as PaginatedOccupations
        set({ items: p.items, total: p.total, totalPages: p.totalPages })
      } else {
        set({ listError: result.error })
      }
    } catch {
      set({ listError: 'Failed to load occupations' })
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
      const result = await api.occupations.getById(id)
      if (result.success) set({ detail: result.data as OccupationDetail })
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
      title:           values.title,
      industry:        values.industry        || null,
      seniority_level: values.seniority_level || null,
      status:          values.status,
      target_date:     values.target_date     || null,
      description:     values.description     || null,
      notes:           values.notes           || null,
      skill_entries:   values.skill_entries,
      tag_ids:         values.tag_ids,
    }

    try {
      const result = editingId
        ? await api.occupations.update(editingId, payload)
        : await api.occupations.create(payload)

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
      const result = await api.occupations.delete(deletingId)
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
