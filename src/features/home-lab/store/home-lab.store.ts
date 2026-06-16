import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { HomeLabWithMeta, HomeLabDetail, HomeLabFilters, HomeLabTask, HomeLabProblem, HomeLabTimeEntry } from '@shared/types/entities'
import type { HomeLabFormValues } from '../schemas/home-lab.schema'

interface PaginatedHomeLabs {
  items: HomeLabWithMeta[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface HomeLabState {
  items: HomeLabWithMeta[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isLoading: boolean
  listError: string | null
  filters: HomeLabFilters

  detail: HomeLabDetail | null
  isLoadingDetail: boolean

  isFormOpen: boolean
  editingId: string | null
  isSubmitting: boolean
  formError: string | null

  deletingId: string | null
  isDeleting: boolean

  isDetailOpen: boolean
  viewingId: string | null

  fetch: () => Promise<void>
  setPage: (p: number) => void
  setSearch: (s: string) => void
  setFilterField: <K extends keyof HomeLabFilters>(k: K, v: HomeLabFilters[K]) => void
  clearFilters: () => void

  fetchDetail: (id: string) => Promise<void>
  openCreate: () => void
  openEdit: (id: string) => void
  closeForm: () => void
  submit: (v: HomeLabFormValues) => Promise<boolean>

  openDetail: (id: string) => void
  closeDetail: () => void

  confirmDelete: (id: string) => void
  cancelDelete: () => void
  executeDelete: () => Promise<boolean>

  toggleTask: (taskId: string, labId: string, isDone: boolean) => Promise<void>
  addTask: (labId: string, title: string) => Promise<HomeLabTask | null>
  deleteTask: (taskId: string, labId: string) => Promise<void>

  addProblem: (labId: string, problem: string, solution?: string) => Promise<HomeLabProblem | null>
  updateProblem: (id: string, problem: string, solution?: string) => Promise<void>
  deleteProblem: (id: string) => Promise<void>

  logTime: (labId: string, duration_min: number, note?: string, logged_date?: string) => Promise<HomeLabTimeEntry | null>
  deleteTimeEntry: (id: string) => Promise<void>
}

const DF: HomeLabFilters = { search: '', status: undefined }

export const useHomeLabStore = create<HomeLabState>((set, get) => ({
  items: [], total: 0, page: 1, pageSize: 24, totalPages: 0,
  isLoading: false, listError: null, filters: { ...DF },
  detail: null, isLoadingDetail: false,
  isFormOpen: false, editingId: null, isSubmitting: false, formError: null,
  deletingId: null, isDeleting: false,
  isDetailOpen: false, viewingId: null,

  setSearch(search) { set(s => ({ filters: { ...s.filters, search }, page: 1 })); void get().fetch() },
  setFilterField(k, v) { set(s => ({ filters: { ...s.filters, [k]: v }, page: 1 })); void get().fetch() },
  clearFilters() { set({ filters: { ...DF }, page: 1 }); void get().fetch() },
  setPage(page) { set({ page }); void get().fetch() },

  async fetch() {
    const { filters, page, pageSize } = get()
    set({ isLoading: true, listError: null })
    try {
      const r = await api.homeLabs.getAll({ search: filters.search || undefined, status: filters.status, page, pageSize })
      if (r.success) {
        const p = r.data as PaginatedHomeLabs
        set({ items: p.items, total: p.total, totalPages: p.totalPages })
      } else { set({ listError: r.error }) }
    } catch { set({ listError: 'Failed to load labs' }) }
    finally { set({ isLoading: false }) }
  },

  async fetchDetail(id) {
    set({ isLoadingDetail: true, detail: null })
    try {
      const r = await api.homeLabs.getById(id)
      if (r.success) set({ detail: r.data })
    } finally { set({ isLoadingDetail: false }) }
  },

  openCreate() { set({ isFormOpen: true, editingId: null, formError: null }) },
  openEdit(id) { set({ isFormOpen: true, editingId: id, formError: null }); void get().fetchDetail(id) },
  closeForm() { set({ isFormOpen: false, editingId: null, detail: null, formError: null }) },

  openDetail(id) { set({ isDetailOpen: true, viewingId: id }); void get().fetchDetail(id) },
  closeDetail() { set({ isDetailOpen: false, viewingId: null, detail: null }) },

  async submit(values) {
    set({ isSubmitting: true, formError: null })
    const { editingId } = get()
    const payload = {
      title: values.title,
      description: values.description || null,
      status: values.status,
      notes: values.notes || null,
      lessons_learned: values.lessons_learned || null,
      completion_pct: values.completion_pct,
      started_at: values.started_at || null,
      completed_at: values.completed_at || null,
      skill_ids: values.skill_ids,
      certification_ids: values.certification_ids,
    }
    try {
      const r = editingId
        ? await api.homeLabs.update(editingId, payload)
        : await api.homeLabs.create(payload)
      if (r.success) {
        set({ isFormOpen: false, editingId: null, detail: null })
        void get().fetch()
        return true
      }
      set({ formError: r.error })
      return false
    } catch { set({ formError: 'An unexpected error occurred' }); return false }
    finally { set({ isSubmitting: false }) }
  },

  confirmDelete(id) { set({ deletingId: id }) },
  cancelDelete() { set({ deletingId: null }) },
  async executeDelete() {
    const { deletingId } = get()
    if (!deletingId) return false
    set({ isDeleting: true })
    try {
      const r = await api.homeLabs.delete(deletingId)
      if (r.success) {
        set({ deletingId: null, isDetailOpen: false, viewingId: null, detail: null })
        void get().fetch()
        return true
      }
      return false
    } catch { return false }
    finally { set({ isDeleting: false }) }
  },

  async toggleTask(taskId, labId, isDone) {
    const r = await api.homeLabs.tasks.update(taskId, { is_done: isDone ? 1 : 0 })
    if (r.success) {
      const detail = get().detail
      if (detail && detail.id === labId) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const tasks = detail.tasks.map(t => t.id === taskId ? { ...t, is_done: (isDone ? 1 : 0) as 0 | 1 } : t)
        const done = tasks.filter(t => t.is_done).length
        const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
        set({ detail: { ...detail, tasks, completion_pct: pct, done_task_count: done } })
        set(s => ({
          items: s.items.map(i => i.id === labId ? { ...i, completion_pct: pct, done_task_count: done } : i),
        }))
      }
    }
  },

  async addTask(labId, title) {
    const r = await api.homeLabs.tasks.create({ lab_id: labId, title })
    if (r.success) {
      const task = r.data
      const detail = get().detail
      if (detail && detail.id === labId) {
        const tasks = [...detail.tasks, task]
        set({ detail: { ...detail, tasks, task_count: tasks.length } })
      }
      return task
    }
    return null
  },

  async deleteTask(taskId, labId) {
    const r = await api.homeLabs.tasks.delete(taskId, labId)
    if (r.success) {
      const detail = get().detail
      if (detail && detail.id === labId) {
        const tasks = detail.tasks.filter(t => t.id !== taskId)
        const done = tasks.filter(t => t.is_done).length
        const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : detail.completion_pct
        set({ detail: { ...detail, tasks, task_count: tasks.length, done_task_count: done, completion_pct: pct } })
      }
    }
  },

  async addProblem(labId, problem, solution) {
    const r = await api.homeLabs.problems.create({ lab_id: labId, problem, solution: solution ?? null })
    if (r.success) {
      const p = r.data
      const detail = get().detail
      if (detail && detail.id === labId) {
        set({ detail: { ...detail, problems: [...detail.problems, p], problem_count: detail.problem_count + 1 } })
      }
      return p
    }
    return null
  },

  async updateProblem(id, problem, solution) {
    const r = await api.homeLabs.problems.update(id, { problem, solution: solution ?? null })
    if (r.success) {
      const updated = r.data
      const detail = get().detail
      if (detail) {
        set({ detail: { ...detail, problems: detail.problems.map(p => p.id === id ? updated : p) } })
      }
    }
  },

  async deleteProblem(id) {
    const r = await api.homeLabs.problems.delete(id)
    if (r.success) {
      const detail = get().detail
      if (detail) {
        set({ detail: { ...detail, problems: detail.problems.filter(p => p.id !== id), problem_count: detail.problem_count - 1 } })
      }
    }
  },

  async logTime(labId, duration_min, note, logged_date) {
    const r = await api.homeLabs.time.log({ lab_id: labId, duration_min, note: note ?? null, ...(logged_date !== undefined && { logged_date }) })
    if (r.success) {
      const entry = r.data
      const detail = get().detail
      if (detail && detail.id === labId) {
        set({ detail: { ...detail, time_entries: [entry, ...detail.time_entries], total_minutes: detail.total_minutes + duration_min } })
      }
      set(s => ({ items: s.items.map(i => i.id === labId ? { ...i, total_minutes: i.total_minutes + duration_min } : i) }))
      return entry
    }
    return null
  },

  async deleteTimeEntry(id) {
    const detail = get().detail
    const entry = detail?.time_entries.find(e => e.id === id)
    const r = await api.homeLabs.time.delete(id)
    if (r.success && detail && entry) {
      set({ detail: { ...detail, time_entries: detail.time_entries.filter(e => e.id !== id), total_minutes: Math.max(0, detail.total_minutes - entry.duration_min) } })
    }
  },
}))
