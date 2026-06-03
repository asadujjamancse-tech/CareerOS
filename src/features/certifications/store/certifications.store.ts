import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { CertificationWithMeta, CertificationDetail, CertificationFilters, PaginatedCertifications } from '../types/certification.types'
import type { CertFormValues } from '../schemas/certification.schema'

interface CertsState {
  items: CertificationWithMeta[]; total: number; page: number; pageSize: number; totalPages: number
  isLoading: boolean; listError: string | null; filters: CertificationFilters
  detail: CertificationDetail | null; isLoadingDetail: boolean
  isFormOpen: boolean; editingId: string | null; isSubmitting: boolean; formError: string | null
  deletingId: string | null; isDeleting: boolean
  fetch: () => Promise<void>; setPage: (p: number) => void
  setSearch: (s: string) => void
  setFilterField: <K extends keyof CertificationFilters>(k: K, v: CertificationFilters[K]) => void
  clearFilters: () => void
  fetchDetail: (id: string) => Promise<void>
  openCreate: () => void; openEdit: (id: string) => void; closeForm: () => void
  submit: (v: CertFormValues) => Promise<boolean>
  confirmDelete: (id: string) => void; cancelDelete: () => void; executeDelete: () => Promise<boolean>
}

const DF: CertificationFilters = { search: '', status: '' }

export const useCertificationsStore = create<CertsState>((set, get) => ({
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
      const r = await api.certifications.getAll({ search: filters.search || undefined, status: filters.status || undefined, page, pageSize })
      if (r.success) { const p = r.data as PaginatedCertifications; set({ items: p.items, total: p.total, totalPages: p.totalPages }) }
      else set({ listError: r.error })
    } catch { set({ listError: 'Failed to load certifications' }) }
    finally { set({ isLoading: false }) }
  },

  setPage(page) { set({ page }); void get().fetch() },

  async fetchDetail(id) {
    set({ isLoadingDetail: true, detail: null })
    try { const r = await api.certifications.getById(id); if (r.success) set({ detail: r.data as CertificationDetail }) }
    finally { set({ isLoadingDetail: false }) }
  },

  openCreate() { set({ isFormOpen: true, editingId: null, formError: null }) },
  openEdit(id) { set({ isFormOpen: true, editingId: id, formError: null }); void get().fetchDetail(id) },
  closeForm() { set({ isFormOpen: false, editingId: null, detail: null, formError: null }) },

  async submit(values) {
    set({ isSubmitting: true, formError: null })
    const { editingId } = get()
    const payload = {
      name: values.name, issuer: values.issuer, status: values.status,
      description: values.description || null, credential_id: values.credential_id || null,
      credential_url: values.credential_url || null, certificate_path: values.certificate_path || null,
      issue_date: values.issue_date || null, expiry_date: values.expiry_date || null,
      score: values.score ?? null, passing_score: values.passing_score ?? null,
      notes: values.notes || null, skill_ids: values.skill_ids, tag_ids: values.tag_ids,
    }
    try {
      const r = editingId ? await api.certifications.update(editingId, payload) : await api.certifications.create(payload)
      if (r.success) { set({ isFormOpen: false, editingId: null, detail: null }); void get().fetch(); return true }
      set({ formError: r.error }); return false
    } catch { set({ formError: 'An unexpected error occurred' }); return false }
    finally { set({ isSubmitting: false }) }
  },

  confirmDelete(id) { set({ deletingId: id }) },
  cancelDelete() { set({ deletingId: null }) },
  async executeDelete() {
    const { deletingId } = get(); if (!deletingId) return false; set({ isDeleting: true })
    try { const r = await api.certifications.delete(deletingId); if (r.success) { set({ deletingId: null }); void get().fetch(); return true } return false }
    catch { return false } finally { set({ isDeleting: false }) }
  },
}))
