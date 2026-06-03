import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { VideoWithMeta, VideoDetail, VideoFilters, PaginatedVideos } from '../types/video.types'
import type { VideoFormValues } from '../schemas/video.schema'

interface VideosState {
  items: VideoWithMeta[]; total: number; page: number; pageSize: number; totalPages: number
  isLoading: boolean; listError: string | null; filters: VideoFilters
  detail: VideoDetail | null; isLoadingDetail: boolean
  isFormOpen: boolean; editingId: string | null; isSubmitting: boolean; formError: string | null
  deletingId: string | null; isDeleting: boolean

  fetch: () => Promise<void>; setPage: (p: number) => void
  setSearch: (s: string) => void
  setFilterField: <K extends keyof VideoFilters>(k: K, v: VideoFilters[K]) => void
  clearFilters: () => void
  fetchDetail: (id: string) => Promise<void>
  openCreate: () => void; openEdit: (id: string) => void; closeForm: () => void
  submit: (v: VideoFormValues) => Promise<boolean>
  confirmDelete: (id: string) => void; cancelDelete: () => void; executeDelete: () => Promise<boolean>
}

const DF: VideoFilters = { search: '', source: '', watch_status: '' }

export const useVideosStore = create<VideosState>((set, get) => ({
  items: [], total: 0, page: 1, pageSize: 24, totalPages: 0,
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
      const r = await api.videos.getAll({
        search: filters.search || undefined,
        source: (filters.source || undefined) as never,
        watch_status: (filters.watch_status || undefined) as never,
        page, pageSize,
      })
      if (r.success) {
        const p = r.data as unknown as PaginatedVideos
        set({ items: p.items, total: p.total, totalPages: p.totalPages })
      } else set({ listError: r.error })
    } catch { set({ listError: 'Failed to load videos' }) }
    finally { set({ isLoading: false }) }
  },

  setPage(page) { set({ page }); void get().fetch() },

  async fetchDetail(id) {
    set({ isLoadingDetail: true, detail: null })
    try {
      const r = await api.videos.getById(id)
      if (r.success) set({ detail: r.data as unknown as VideoDetail })
    } finally { set({ isLoadingDetail: false }) }
  },

  openCreate() { set({ isFormOpen: true, editingId: null, formError: null }) },
  openEdit(id) { set({ isFormOpen: true, editingId: id, formError: null }); void get().fetchDetail(id) },
  closeForm() { set({ isFormOpen: false, editingId: null, detail: null, formError: null }) },

  async submit(values) {
    set({ isSubmitting: true, formError: null })
    const { editingId } = get()
    const payload = {
      title: values.title,
      description: values.description || null,
      url: values.url || null,
      source: values.source,
      channel: values.channel || null,
      watch_status: values.watch_status,
      duration_seconds: values.duration_seconds ?? null,
      notes: values.notes || null,
      skill_ids: values.skill_ids,
      tag_ids: values.tag_ids,
    }
    try {
      const r = editingId
        ? await api.videos.update(editingId, payload)
        : await api.videos.create(payload)
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
      const r = await api.videos.delete(deletingId)
      if (r.success) { set({ deletingId: null }); void get().fetch(); return true }
      return false
    } catch { return false } finally { set({ isDeleting: false }) }
  },
}))
