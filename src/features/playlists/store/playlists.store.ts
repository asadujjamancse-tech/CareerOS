import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { PlaylistWithProgress, PlaylistDetail, PlaylistFilters, PlaylistItem } from '../types/playlist.types'
import type { PlaylistFormValues, PlaylistItemFormValues } from '../schemas/playlist.schema'

interface PlaylistsState {
  items: PlaylistWithProgress[]
  isLoading: boolean
  listError: string | null
  filters: PlaylistFilters

  detail: PlaylistDetail | null
  isLoadingDetail: boolean
  detailId: string | null

  isFormOpen: boolean
  editingId: string | null
  isSubmitting: boolean
  formError: string | null

  isItemFormOpen: boolean
  editingItemId: string | null
  isItemSubmitting: boolean
  itemFormError: string | null

  deletingId: string | null
  isDeleting: boolean

  fetch: () => Promise<void>
  setSearch: (s: string) => void
  setSkillFilter: (skillId: string) => void

  openDetail: (id: string) => void
  closeDetail: () => void

  openCreate: () => void
  openEdit: (id: string) => void
  closeForm: () => void
  submit: (v: PlaylistFormValues) => Promise<boolean>

  openItemCreate: () => void
  openItemEdit: (item: PlaylistItem) => void
  closeItemForm: () => void
  submitItem: (v: PlaylistItemFormValues) => Promise<boolean>
  deleteItem: (id: string) => Promise<void>
  markItemStatus: (itemId: string, status: PlaylistItem['watch_status']) => Promise<void>

  confirmDelete: (id: string) => void
  cancelDelete: () => void
  executeDelete: () => Promise<boolean>
}

const DF: PlaylistFilters = { search: '', skillId: '' }

export const usePlaylistsStore = create<PlaylistsState>((set, get) => ({
  items: [], isLoading: false, listError: null, filters: { ...DF },
  detail: null, isLoadingDetail: false, detailId: null,
  isFormOpen: false, editingId: null, isSubmitting: false, formError: null,
  isItemFormOpen: false, editingItemId: null, isItemSubmitting: false, itemFormError: null,
  deletingId: null, isDeleting: false,

  setSearch(search) { set(s => ({ filters: { ...s.filters, search } })); void get().fetch() },
  setSkillFilter(skillId) { set(s => ({ filters: { ...s.filters, skillId } })); void get().fetch() },

  async fetch() {
    const { filters } = get(); set({ isLoading: true, listError: null })
    try {
      const r = await api.playlists.getAll(filters.skillId || undefined)
      if (r.success) {
        let data = r.data as PlaylistWithProgress[]
        if (filters.search) {
          const q = filters.search.toLowerCase()
          data = data.filter(p => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
        }
        set({ items: data })
      } else set({ listError: r.error })
    } catch { set({ listError: 'Failed to load playlists' }) }
    finally { set({ isLoading: false }) }
  },

  async openDetail(id) {
    set({ detailId: id, detail: null, isLoadingDetail: true })
    try {
      const r = await api.playlists.getById(id)
      if (r.success) set({ detail: r.data as PlaylistDetail })
    } finally { set({ isLoadingDetail: false }) }
  },
  closeDetail() { set({ detailId: null, detail: null }) },

  openCreate() { set({ isFormOpen: true, editingId: null, formError: null }) },
  openEdit(id) {
    const playlist = get().items.find(p => p.id === id)
    if (playlist) set({ isFormOpen: true, editingId: id, formError: null })
  },
  closeForm() { set({ isFormOpen: false, editingId: null, formError: null }) },

  async submit(values) {
    set({ isSubmitting: true, formError: null })
    const { editingId } = get()
    const payload = {
      title: values.title,
      description: values.description || null,
      source: values.source,
      source_url: values.source_url || null,
      skill_id: values.skill_id || null,
    }
    try {
      const r = editingId
        ? await api.playlists.update(editingId, payload)
        : await api.playlists.create(payload)
      if (r.success) {
        set({ isFormOpen: false, editingId: null })
        void get().fetch()
        return true
      }
      set({ formError: r.error }); return false
    } catch { set({ formError: 'An unexpected error occurred' }); return false }
    finally { set({ isSubmitting: false }) }
  },

  openItemCreate() { set({ isItemFormOpen: true, editingItemId: null, itemFormError: null }) },
  openItemEdit(item) { set({ isItemFormOpen: true, editingItemId: item.id, itemFormError: null }) },
  closeItemForm() { set({ isItemFormOpen: false, editingItemId: null, itemFormError: null }) },

  async submitItem(values) {
    const { editingItemId, detailId, detail } = get()
    if (!detailId) return false
    set({ isItemSubmitting: true, itemFormError: null })
    const payload = {
      title: values.title,
      url: values.url || null,
      source: values.source,
      duration_seconds: values.duration_seconds ?? null,
    }
    try {
      const r = editingItemId
        ? await api.playlists.items.update(editingItemId, payload)
        : await api.playlists.items.create({ ...payload, playlist_id: detailId })
      if (r.success) {
        set({ isItemFormOpen: false, editingItemId: null })
        const refreshed = await api.playlists.getById(detailId)
        if (refreshed.success) set({ detail: refreshed.data as PlaylistDetail })
        if (detail) {
          const refreshedList = await api.playlists.getAll()
          if (refreshedList.success) set({ items: refreshedList.data as PlaylistWithProgress[] })
        }
        return true
      }
      set({ itemFormError: r.error }); return false
    } catch { set({ itemFormError: 'An unexpected error occurred' }); return false }
    finally { set({ isItemSubmitting: false }) }
  },

  async deleteItem(id) {
    const { detailId } = get()
    await api.playlists.items.delete(id)
    if (detailId) {
      const r = await api.playlists.getById(detailId)
      if (r.success) set({ detail: r.data as PlaylistDetail })
    }
  },

  async markItemStatus(itemId, status) {
    const { detailId } = get()
    await api.playlists.items.update(itemId, { watch_status: status })
    if (detailId) {
      const r = await api.playlists.getById(detailId)
      if (r.success) set({ detail: r.data as PlaylistDetail })
    }
  },

  confirmDelete(id) { set({ deletingId: id }) },
  cancelDelete() { set({ deletingId: null }) },
  async executeDelete() {
    const { deletingId } = get(); if (!deletingId) return false; set({ isDeleting: true })
    try {
      const r = await api.playlists.delete(deletingId)
      if (r.success) { set({ deletingId: null, detailId: null, detail: null }); void get().fetch(); return true }
      return false
    } catch { return false } finally { set({ isDeleting: false }) }
  },
}))
