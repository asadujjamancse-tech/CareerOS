import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { MarkdownDocument, MarkdownVersion, EditorView } from '../types/markdown.types'

interface MarkdownState {
  documents: MarkdownDocument[]
  activeDocumentId: string | null
  activeDocument: MarkdownDocument | null
  versions: MarkdownVersion[]
  versionsLoading: boolean
  editorView: EditorView
  isDirty: boolean
  isSaving: boolean
  loading: boolean

  // Actions
  fetchDocuments: () => Promise<void>
  selectDocument: (id: string) => Promise<void>
  createDocument: () => Promise<string | null>
  saveDocument: (id: string, title: string, content: string, snapshot?: boolean, label?: string) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  setEditorView: (view: EditorView) => void
  setDirty: (dirty: boolean) => void

  // Versions
  fetchVersions: (documentId: string) => Promise<void>
  saveSnapshot: (documentId: string, label?: string) => Promise<void>
  restoreVersion: (documentId: string, versionId: string) => Promise<void>
  deleteVersion: (versionId: string) => Promise<void>
}

export const useMarkdownStore = create<MarkdownState>((set, get) => ({
  documents: [],
  activeDocumentId: null,
  activeDocument: null,
  versions: [],
  versionsLoading: false,
  editorView: 'split',
  isDirty: false,
  isSaving: false,
  loading: false,

  fetchDocuments: async () => {
    set({ loading: true })
    const res = await api.markdown.getAll()
    if (res.success) set({ documents: res.data as MarkdownDocument[] })
    set({ loading: false })
  },

  selectDocument: async (id: string) => {
    const res = await api.markdown.getById(id)
    if (res.success && res.data) {
      set({
        activeDocumentId: id,
        activeDocument: res.data as MarkdownDocument,
        isDirty: false,
        versions: [],
      })
    }
  },

  createDocument: async () => {
    const res = await api.markdown.create({ title: 'Untitled', content: '' })
    if (res.success && res.data) {
      const doc = res.data as MarkdownDocument
      set((s) => ({ documents: [doc, ...s.documents] }))
      await get().selectDocument(doc.id)
      return doc.id
    }
    return null
  },

  saveDocument: async (id, title, content, snapshot = false, label) => {
    set({ isSaving: true })
    const updateParams: Parameters<typeof api.markdown.update>[1] = { title, content, snapshot }
    if (label !== undefined) updateParams.snapshot_label = label
    const res = await api.markdown.update(id, updateParams)
    if (res.success && res.data) {
      const updated = res.data as MarkdownDocument
      set((s) => ({
        documents: s.documents.map((d) => (d.id === id ? updated : d)),
        activeDocument: s.activeDocumentId === id ? updated : s.activeDocument,
        isDirty: false,
      }))
    }
    set({ isSaving: false })
  },

  deleteDocument: async (id: string) => {
    await api.markdown.delete(id)
    set((s) => {
      const docs = s.documents.filter((d) => d.id !== id)
      const isActive = s.activeDocumentId === id
      return {
        documents: docs,
        activeDocumentId: isActive ? (docs[0]?.id ?? null) : s.activeDocumentId,
        activeDocument: isActive ? (docs[0] ?? null) : s.activeDocument,
        isDirty: isActive ? false : s.isDirty,
      }
    })
    if (get().activeDocumentId) {
      await get().selectDocument(get().activeDocumentId!)
    }
  },

  setEditorView: (view) => set({ editorView: view }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  fetchVersions: async (documentId) => {
    set({ versionsLoading: true })
    const res = await api.markdown.versions.get(documentId)
    if (res.success) set({ versions: res.data as MarkdownVersion[] })
    set({ versionsLoading: false })
  },

  saveSnapshot: async (documentId, label) => {
    const res = await api.markdown.versions.save(documentId, label)
    if (res.success) {
      set((s) => ({ versions: [res.data as MarkdownVersion, ...s.versions] }))
    }
  },

  restoreVersion: async (documentId, versionId) => {
    const res = await api.markdown.versions.restore(documentId, versionId)
    if (res.success && res.data) {
      const doc = res.data as MarkdownDocument
      set((s) => ({
        activeDocument: doc,
        documents: s.documents.map((d) => (d.id === documentId ? doc : d)),
        isDirty: false,
      }))
      await get().fetchVersions(documentId)
    }
  },

  deleteVersion: async (versionId) => {
    await api.markdown.versions.delete(versionId)
    set((s) => ({ versions: s.versions.filter((v) => v.id !== versionId) }))
  },
}))
