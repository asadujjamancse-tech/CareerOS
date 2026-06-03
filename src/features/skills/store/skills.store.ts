import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type {
  SkillWithCategory,
  SkillDetail,
  SkillFilters,
  PaginatedSkills,
} from '../types/skill.types'
import type { SkillFormValues } from '../schemas/skill.schema'

interface SkillsState {
  // List
  items: SkillWithCategory[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isLoading: boolean
  listError: string | null

  // Filters
  filters: SkillFilters
  setSearch: (search: string) => void
  setFilterField: <K extends keyof SkillFilters>(key: K, value: SkillFilters[K]) => void
  clearFilters: () => void

  // Detail
  detail: SkillDetail | null
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
  submit: (values: SkillFormValues) => Promise<boolean>
  confirmDelete: (id: string) => void
  cancelDelete: () => void
  executeDelete: () => Promise<boolean>
}

const DEFAULT_FILTERS: SkillFilters = {
  search: '',
  category_id: '',
  proficiency_level: '',
  status: '',
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  // List state
  items: [],
  total: 0,
  page: 1,
  pageSize: 24,
  totalPages: 0,
  isLoading: false,
  listError: null,

  // Filters
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

  // Detail
  detail: null,
  isLoadingDetail: false,

  // Form
  isFormOpen: false,
  editingId: null,
  isSubmitting: false,
  formError: null,

  // Delete
  deletingId: null,
  isDeleting: false,

  // ── Actions ─────────────────────────────────────────────────────────────────

  async fetch() {
    const { filters, page, pageSize } = get()
    set({ isLoading: true, listError: null })
    try {
      const result = await api.skills.getAll({
        search: filters.search || undefined,
        category_id: filters.category_id || undefined,
        proficiency_level: filters.proficiency_level || undefined,
        status: filters.status || undefined,
        page,
        pageSize,
      })
      if (result.success) {
        const p = result.data as PaginatedSkills
        set({ items: p.items, total: p.total, totalPages: p.totalPages })
      } else {
        set({ listError: result.error })
      }
    } catch {
      set({ listError: 'Failed to load skills' })
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
      const result = await api.skills.getById(id)
      if (result.success) set({ detail: result.data as SkillDetail })
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
      name: values.name,
      category_id: values.category_id,
      description: values.description || null,
      proficiency_level: values.proficiency_level,
      status: values.status,
      years_experience: values.years_experience,
      notes: values.notes || null,
      is_public: values.is_public ? (1 as const) : (0 as const),
      tag_ids: values.tag_ids,
    }

    try {
      const result = editingId
        ? await api.skills.update(editingId, payload)
        : await api.skills.create(payload)

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
      const result = await api.skills.delete(deletingId)
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
