import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { DocumentWithTags, DocumentDetail, DocumentFilters, PaginatedDocuments } from '../types/document.types'
import type { DocumentFormValues } from '../schemas/document.schema'

interface DocumentsState {
  items: DocumentWithTags[]; total: number; page: number; pageSize: number; totalPages: number
  isLoading: boolean; listError: string | null; filters: DocumentFilters
  detail: DocumentDetail | null; isLoadingDetail: boolean
  isFormOpen: boolean; editingId: string | null; isSubmitting: boolean; formError: string | null
  deletingId: string | null; isDeleting: boolean

  fetch: () => Promise<void>; setPage: (p: number) => void
  setSearch: (s: string) => void
  setFilterField: <K extends keyof DocumentFilters>(k: K, v: DocumentFilters[K]) => void
  clearFilters: () => void
  fetchDetail: (id: string) => Promise<void>
  openCreate: () => void; openEdit: (id: string) => void; closeForm: () => void
  submit: (v: DocumentFormValues) => Promise<boolean>
  confirmDelete: (id: string) => void; cancelDelete: () => void; executeDelete: () => Promise<boolean>
  openDocument: (id: string) => Promise<void>
}

const DF: DocumentFilters = { search: '', type: '' }

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  items: [], total: 0, page: 1, pageSize: 30, totalPages: 0,
  isLoading: false, listError: null, filters: { ...DF },
  detail: null, isLoadingDetail: false,
  isFormOpen: false, editingId: null, isSubmitting: false, formError: null,
  deletingId: null, isDeleting: false,

  setSearch(search) { set(s => ({ filters: { ...s.filters, search }, page: 1 })); void get().fetch() },
  setFilterField(k, v) { set(s => ({ filters: { ...s.filters, [k]: v }, page: 1 })); void get().fetch() },
  clearFilters() { set({ filters: { ...DF }, page: 1 }); void get().fetch() },

  async fetch() {
    const { filters, page, pageSize } = get(); set({ isLoading: true, listError: null })
    try {
      const r = await api.documents.getAll({
        search: filters.search || undefined,
        type: (filters.type || undefined) as never,
        page, pageSize,
      })
      if (r.success) {
        const p = r.data as unknown as PaginatedDocuments
        set({ items: p.items, total: p.total, totalPages: p.totalPages })
      } else set({ listError: r.error })
    } catch { set({ listError: 'Failed to load documents' }) }
    finally { set({ isLoading: false }) }
  },

  setPage(page) { set({ page }); void get().fetch() },

  async fetchDetail(id) {
    set({ isLoadingDetail: true, detail: null })
    try {
      const r = await api.documents.getById(id)
      if (r.success) set({ detail: r.data as unknown as DocumentDetail })
    } finally { set({ isLoadingDetail: false }) }
  },

  openCreate() { set({ isFormOpen: true, editingId: null, formError: null }) },
  openEdit(id) { set({ isFormOpen: true, editingId: id, formError: null }); void get().fetchDetail(id) },
  closeForm() { set({ isFormOpen: false, editingId: null, detail: null, formError: null }) },

  async submit(values) {
    set({ isSubmitting: true, formError: null })
    const { editingId } = get()
    try {
      let r
      if (editingId) {
        r = await api.documents.update(editingId, {
          title: values.title,
          description: values.description || null,
          type: values.type as never,
          version: values.version || '1.0',
          notes: values.notes || null,
          tag_ids: values.tag_ids,
        })
      } else {
        if (!values.file_path || !values.original_filename) {
          set({ formError: 'Please select a file to import.', isSubmitting: false })
          return false
        }
        r = await api.documents.create({
          title: values.title,
          description: values.description || null,
          file_path: values.file_path,
          original_filename: values.original_filename,
          mime_type: values.mime_type ?? null,
          file_size_bytes: values.file_size_bytes ?? null,
          type: values.type as never,
          version: values.version || '1.0',
          notes: values.notes || null,
          tag_ids: values.tag_ids,
        })
      }
      if (r.success) { set({ isFormOpen: false, editingId: null, detail: null }); void get().fetch(); return true }
      set({ formError: r.error }); return false
    } catch { set({ formError: 'An unexpected error occurred' }); return false }
    finally { set({ isSubmitting: false }) }
  },

  confirmDelete(id) { set({ deletingId: id }) },
  cancelDelete() { set({ deletingId: null }) },
  async executeDelete() {
    const { deletingId } = get(); if (!deletingId) return false; set({ isDeleting: true })
    try {
      const r = await api.documents.delete(deletingId)
      if (r.success) { set({ deletingId: null }); void get().fetch(); return true }
      return false
    } catch { return false } finally { set({ isDeleting: false }) }
  },

  async openDocument(id) {
    await api.documents.open(id)
  },
}))
