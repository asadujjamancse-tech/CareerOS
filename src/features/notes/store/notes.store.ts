import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { NoteWithTags, NoteDetail, NoteFilters, PaginatedNotes } from '../types/note.types'
import type { NoteFormValues } from '../schemas/note.schema'

interface NotesState {
  items: NoteWithTags[]; total: number; page: number; pageSize: number; totalPages: number
  isLoading: boolean; listError: string | null
  filters: NoteFilters
  detail: NoteDetail | null; isLoadingDetail: boolean
  isFormOpen: boolean; editingId: string | null; isSubmitting: boolean; formError: string | null
  deletingId: string | null; isDeleting: boolean

  fetch: () => Promise<void>; setPage: (p: number) => void
  setSearch: (s: string) => void
  setFilterField: <K extends keyof NoteFilters>(k: K, v: NoteFilters[K]) => void
  clearFilters: () => void
  fetchDetail: (id: string) => Promise<void>
  openCreate: () => void; openEdit: (id: string) => void; closeForm: () => void
  submit: (v: NoteFormValues) => Promise<boolean>
  confirmDelete: (id: string) => void; cancelDelete: () => void; executeDelete: () => Promise<boolean>
}

const DEFAULT_FILTERS: NoteFilters = { search: '', type: '', is_pinned: null }

export const useNotesStore = create<NotesState>((set, get) => ({
  items: [], total: 0, page: 1, pageSize: 30, totalPages: 0,
  isLoading: false, listError: null,
  filters: { ...DEFAULT_FILTERS },
  detail: null, isLoadingDetail: false,
  isFormOpen: false, editingId: null, isSubmitting: false, formError: null,
  deletingId: null, isDeleting: false,

  setSearch(search) { set(s => ({ filters: { ...s.filters, search }, page: 1 })); void get().fetch() },
  setFilterField(k, v) { set(s => ({ filters: { ...s.filters, [k]: v }, page: 1 })); void get().fetch() },
  clearFilters() { set({ filters: { ...DEFAULT_FILTERS }, page: 1 }); void get().fetch() },

  async fetch() {
    const { filters, page, pageSize } = get()
    set({ isLoading: true, listError: null })
    try {
      const r = await api.notes.getAll({
        search: filters.search || undefined,
        type: filters.type || undefined,
        is_pinned: filters.is_pinned !== null ? filters.is_pinned : undefined,
        page, pageSize,
      })
      if (r.success) { const p = r.data as PaginatedNotes; set({ items: p.items, total: p.total, totalPages: p.totalPages }) }
      else set({ listError: r.error })
    } catch { set({ listError: 'Failed to load notes' }) }
    finally { set({ isLoading: false }) }
  },

  setPage(page) { set({ page }); void get().fetch() },

  async fetchDetail(id) {
    set({ isLoadingDetail: true, detail: null })
    try { const r = await api.notes.getById(id); if (r.success) set({ detail: r.data as NoteDetail }) }
    finally { set({ isLoadingDetail: false }) }
  },

  openCreate() { set({ isFormOpen: true, editingId: null, formError: null }) },
  openEdit(id) { set({ isFormOpen: true, editingId: id, formError: null }); void get().fetchDetail(id) },
  closeForm() { set({ isFormOpen: false, editingId: null, detail: null, formError: null }) },

  async submit(values) {
    set({ isSubmitting: true, formError: null })
    const { editingId } = get()
    const payload = { title: values.title, content: values.content, type: values.type, is_pinned: values.is_pinned, tag_ids: values.tag_ids }
    try {
      const r = editingId ? await api.notes.update(editingId, payload) : await api.notes.create(payload)
      if (r.success) { set({ isFormOpen: false, editingId: null, detail: null }); void get().fetch(); return true }
      set({ formError: r.error }); return false
    } catch { set({ formError: 'An unexpected error occurred' }); return false }
    finally { set({ isSubmitting: false }) }
  },

  confirmDelete(id) { set({ deletingId: id }) },
  cancelDelete() { set({ deletingId: null }) },
  async executeDelete() {
    const { deletingId } = get(); if (!deletingId) return false
    set({ isDeleting: true })
    try { const r = await api.notes.delete(deletingId); if (r.success) { set({ deletingId: null }); void get().fetch(); return true } return false }
    catch { return false } finally { set({ isDeleting: false }) }
  },
}))
