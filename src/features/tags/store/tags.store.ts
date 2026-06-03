import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { TagWithCount } from '../types/tag.types'
import type { TagFormValues } from '../schemas/tag.schema'

interface TagsState {
  items: TagWithCount[]
  isLoading: boolean
  listError: string | null
  isFormOpen: boolean
  editingId: string | null
  isSubmitting: boolean
  formError: string | null
  deletingId: string | null
  isDeleting: boolean

  fetch: () => Promise<void>
  openCreate: () => void
  openEdit: (id: string) => void
  closeForm: () => void
  submit: (values: TagFormValues) => Promise<boolean>
  confirmDelete: (id: string) => void
  cancelDelete: () => void
  executeDelete: () => Promise<boolean>
}

export const useTagsStore = create<TagsState>((set, get) => ({
  items: [], isLoading: false, listError: null,
  isFormOpen: false, editingId: null, isSubmitting: false, formError: null,
  deletingId: null, isDeleting: false,

  async fetch() {
    set({ isLoading: true, listError: null })
    try {
      const r = await api.tags.getAll()
      if (r.success) set({ items: r.data as TagWithCount[] })
      else set({ listError: r.error })
    } catch { set({ listError: 'Failed to load tags' }) }
    finally { set({ isLoading: false }) }
  },

  openCreate() { set({ isFormOpen: true, editingId: null, formError: null }) },
  openEdit(id) { set({ isFormOpen: true, editingId: id, formError: null }) },
  closeForm() { set({ isFormOpen: false, editingId: null, formError: null }) },

  async submit(values) {
    set({ isSubmitting: true, formError: null })
    const { editingId } = get()
    try {
      const r = editingId
        ? await api.tags.update(editingId, values)
        : await api.tags.create(values)
      if (r.success) { set({ isFormOpen: false, editingId: null }); void get().fetch(); return true }
      set({ formError: r.error }); return false
    } catch { set({ formError: 'An unexpected error occurred' }); return false }
    finally { set({ isSubmitting: false }) }
  },

  confirmDelete(id) { set({ deletingId: id }) },
  cancelDelete() { set({ deletingId: null }) },

  async executeDelete() {
    const { deletingId } = get(); if (!deletingId) return false
    set({ isDeleting: true })
    try {
      const r = await api.tags.delete(deletingId)
      if (r.success) { set({ deletingId: null }); void get().fetch(); return true }
      return false
    } catch { return false }
    finally { set({ isDeleting: false }) }
  },
}))
