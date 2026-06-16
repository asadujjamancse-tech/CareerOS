import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { DocumentType, DocumentFilters } from '@shared/types/entities'
import type {
  VaultDocument, VaultAnnotation, ReadingProgress, KnowledgeColor,
  VaultViewMode, AnnotationPosition, AnnotationType,
  VaultCollection, VaultSidebarView,
} from '../types/vault.types'

interface VaultState {
  // ── Document list ─────────────────────────────────────────────────────────
  documents: VaultDocument[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isLoading: boolean
  listError: string | null
  filters: { search?: string | undefined; type?: DocumentType | undefined }

  // ── Sidebar navigation ────────────────────────────────────────────────────
  sidebarView: VaultSidebarView
  collections: VaultCollection[]
  favoriteIds: Set<string>
  recentIds: string[]
  collectionsLoading: boolean
  activeCollectionDocIds: string[]

  // ── Active document / reader ──────────────────────────────────────────────
  activeDocument: VaultDocument | null
  viewMode: VaultViewMode
  annotations: VaultAnnotation[]
  readingProgress: ReadingProgress | null
  colors: KnowledgeColor[]
  activeColorHex: string
  annotationsLoading: boolean
  docContent: string | null
  docContentLoading: boolean

  // ── Rename inline state ───────────────────────────────────────────────────
  renamingId: string | null

  // ── Actions ───────────────────────────────────────────────────────────────
  fetch: () => Promise<void>
  setSearch: (q: string) => void
  setPage: (p: number) => void
  setFilterField: (k: string, v: string | undefined) => void

  setSidebarView: (view: VaultSidebarView) => Promise<void>
  fetchCollections: () => Promise<void>
  createCollection: (params: { name: string; description?: string | null; color_hex?: string }) => Promise<void>
  updateCollection: (id: string, params: { name?: string; color_hex?: string }) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  addToCollection: (collectionId: string, documentId: string) => Promise<void>
  removeFromCollection: (collectionId: string, documentId: string) => Promise<void>

  fetchFavorites: () => Promise<void>
  toggleFavorite: (documentId: string) => Promise<void>

  fetchRecent: () => Promise<void>

  renameDocument: (id: string, newTitle: string) => Promise<void>
  setRenamingId: (id: string | null) => void

  openDocument: (doc: VaultDocument) => Promise<void>
  closeDocument: () => void

  fetchAnnotations: (documentId: string) => Promise<void>
  createAnnotation: (params: {
    type: AnnotationType
    position: AnnotationPosition
    selectedText?: string
    content?: string
    pageNumber?: number
  }) => Promise<void>
  updateAnnotation: (id: string, content: string) => Promise<void>
  deleteAnnotation: (id: string) => Promise<void>
  setActiveColor: (hex: string) => void

  importDocument: () => Promise<void>
  updateReadingProgress: (currentPage: number, totalPages?: number, scrollPct?: number) => Promise<void>
  fetchColors: () => Promise<void>
  createColor: (params: { color_hex: string; name: string; meaning: string; description?: string }) => Promise<void>
  deleteColor: (id: string) => Promise<void>
}

export const useVaultStore = create<VaultState>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────────────────────
  documents: [],
  total: 0,
  page: 1,
  pageSize: 30,
  totalPages: 0,
  isLoading: false,
  listError: null,
  filters: {},

  sidebarView: 'all',
  collections: [],
  favoriteIds: new Set(),
  recentIds: [],
  collectionsLoading: false,
  activeCollectionDocIds: [],

  activeDocument: null,
  viewMode: 'list',
  annotations: [],
  readingProgress: null,
  colors: [],
  activeColorHex: '#EAB308',
  annotationsLoading: false,
  docContent: null,
  docContentLoading: false,

  renamingId: null,

  // ── Document list ─────────────────────────────────────────────────────────

  fetch: async () => {
    const { page, pageSize, filters } = get()
    set({ isLoading: true, listError: null })
    const docFilters: DocumentFilters = { page, pageSize, ...filters }
    const res = await api.documents.getAll(docFilters) as {
      success: boolean
      data?: { items: VaultDocument[]; total: number; totalPages: number }
      error?: string
    }
    if (res.success && res.data) {
      set({ documents: res.data.items, total: res.data.total, totalPages: res.data.totalPages, isLoading: false })
    } else {
      set({ listError: res.error ?? 'Failed to load', isLoading: false })
    }
  },

  setSearch: (q) => {
    const search = q || undefined
    set(s => ({ filters: { ...s.filters, ...(search !== undefined ? { search } : {}) }, page: 1 }))
    void get().fetch()
  },

  setPage: (p) => { set({ page: p }); void get().fetch() },

  setFilterField: (k, v) => {
    set(s => ({ filters: { ...s.filters, [k]: v }, page: 1 }))
    void get().fetch()
  },

  // ── Sidebar navigation ────────────────────────────────────────────────────

  setSidebarView: async (view) => {
    set({ sidebarView: view, activeCollectionDocIds: [] })
    if (view.startsWith('collection:')) {
      const collectionId = view.slice('collection:'.length)
      const res = await api.vaultCollections.getDocumentIds(collectionId) as { success: boolean; data?: string[] }
      if (res.success && res.data) set({ activeCollectionDocIds: res.data })
    }
  },

  fetchCollections: async () => {
    set({ collectionsLoading: true })
    const res = await api.vaultCollections.getAll() as { success: boolean; data?: VaultCollection[] }
    if (res.success && res.data) set({ collections: res.data, collectionsLoading: false })
    else set({ collectionsLoading: false })
  },

  createCollection: async (params) => {
    const res = await api.vaultCollections.create(params) as { success: boolean; data?: VaultCollection }
    if (res.success && res.data) {
      set(s => ({ collections: [...s.collections, res.data!] }))
    }
  },

  updateCollection: async (id, params) => {
    const res = await api.vaultCollections.update(id, params) as { success: boolean; data?: VaultCollection }
    if (res.success && res.data) {
      set(s => ({ collections: s.collections.map(c => c.id === id ? res.data! : c) }))
    }
  },

  deleteCollection: async (id) => {
    await api.vaultCollections.delete(id)
    set(s => ({
      collections: s.collections.filter(c => c.id !== id),
      sidebarView: s.sidebarView === `collection:${id}` ? 'all' : s.sidebarView,
    }))
  },

  addToCollection: async (collectionId, documentId) => {
    await api.vaultCollections.addDocument(collectionId, documentId)
    set(s => ({
      collections: s.collections.map(c => c.id === collectionId ? { ...c, doc_count: c.doc_count + 1 } : c),
      activeCollectionDocIds: s.sidebarView === `collection:${collectionId}`
        ? [...s.activeCollectionDocIds, documentId]
        : s.activeCollectionDocIds,
    }))
  },

  removeFromCollection: async (collectionId, documentId) => {
    await api.vaultCollections.removeDocument(collectionId, documentId)
    set(s => ({
      collections: s.collections.map(c => c.id === collectionId ? { ...c, doc_count: Math.max(0, c.doc_count - 1) } : c),
      activeCollectionDocIds: s.activeCollectionDocIds.filter(id => id !== documentId),
    }))
  },

  // ── Favorites ─────────────────────────────────────────────────────────────

  fetchFavorites: async () => {
    const res = await api.vaultFavorites.getAll() as { success: boolean; data?: string[] }
    if (res.success && res.data) set({ favoriteIds: new Set(res.data) })
  },

  toggleFavorite: async (documentId) => {
    const res = await api.vaultFavorites.toggle(documentId) as { success: boolean; data?: { is_favorite: boolean } }
    if (res.success && res.data) {
      set(s => {
        const next = new Set(s.favoriteIds)
        if (res.data!.is_favorite) next.add(documentId)
        else next.delete(documentId)
        return { favoriteIds: next }
      })
    }
  },

  // ── Recent Files ──────────────────────────────────────────────────────────

  fetchRecent: async () => {
    const res = await api.vaultRecent.getAll(20) as { success: boolean; data?: string[] }
    if (res.success && res.data) set({ recentIds: res.data })
  },

  // ── Rename ────────────────────────────────────────────────────────────────

  setRenamingId: (id) => set({ renamingId: id }),

  renameDocument: async (id, newTitle) => {
    const res = await api.documents.rename(id, newTitle) as { success: boolean; data?: { title: string } }
    if (res.success && res.data) {
      set(s => ({
        documents: s.documents.map(d => d.id === id ? { ...d, title: res.data!.title } : d),
        renamingId: null,
      }))
    }
  },

  // ── Document reader ───────────────────────────────────────────────────────

  openDocument: async (doc) => {
    set({ activeDocument: doc, docContent: null, docContentLoading: false })

    // Track recent
    void api.vaultRecent.track(doc.id)
    set(s => ({ recentIds: [doc.id, ...s.recentIds.filter(id => id !== doc.id)].slice(0, 20) }))

    const mime = doc.mime_type ?? ''
    const filename = doc.original_filename.toLowerCase()

    if (mime === 'application/pdf' || filename.endsWith('.pdf')) {
      set({ viewMode: 'pdf-reader' })
    } else if (mime.includes('wordprocessingml') || filename.endsWith('.docx') || filename.endsWith('.doc')) {
      set({ viewMode: 'doc-reader', docContentLoading: true })
      const res = await api.vault.convertDocx(doc.file_path) as { success: boolean; data?: { html: string }; error?: string }
      set({
        docContent: res.success && res.data ? res.data.html : `<p>Could not load document: ${res.error ?? 'unknown error'}</p>`,
        docContentLoading: false,
      })
    } else if (
      mime === 'text/plain' || mime === 'text/markdown' || mime.startsWith('text/') ||
      filename.match(/\.(txt|md|js|ts|jsx|tsx|json|html|css)$/)
    ) {
      set({ viewMode: 'text-reader', docContentLoading: true })
      const res = await api.vault.readText(doc.file_path) as { success: boolean; data?: { content: string }; error?: string }
      if (res.success && res.data) {
        set({ docContent: res.data.content, docContentLoading: false })
      } else {
        set({ docContent: `Could not read file: ${res.error ?? 'unknown error'}`, docContentLoading: false })
      }
    } else if (doc.file_path.startsWith('http') || doc.type === 'url') {
      set({ viewMode: 'web-reader' })
    } else {
      await api.storage.openFile(doc.file_path)
      return
    }

    await get().fetchAnnotations(doc.id)
    const progressRes = await api.annotations.getReadingProgress(doc.id) as { success: boolean; data?: ReadingProgress | null }
    if (progressRes.success) set({ readingProgress: progressRes.data ?? null })
  },

  closeDocument: () => {
    set({ activeDocument: null, viewMode: 'list', annotations: [], readingProgress: null, docContent: null })
  },

  // ── Annotations ───────────────────────────────────────────────────────────

  fetchAnnotations: async (documentId) => {
    set({ annotationsLoading: true })
    const res = await api.annotations.getByDocument(documentId) as { success: boolean; data?: VaultAnnotation[] }
    if (res.success && res.data) set({ annotations: res.data, annotationsLoading: false })
    else set({ annotationsLoading: false })
  },

  createAnnotation: async ({ type, position, selectedText, content, pageNumber }) => {
    const { activeDocument, activeColorHex, colors } = get()
    if (!activeDocument) return
    const colorEntry = colors.find(c => c.color_hex === activeColorHex)
    const res = await api.annotations.create({
      document_id: activeDocument.id,
      type,
      color_hex: activeColorHex,
      color_meaning: colorEntry?.meaning ?? null,
      page_number: pageNumber ?? null,
      position_json: position,
      selected_text: selectedText ?? null,
      content: content ?? null,
    }) as { success: boolean; data?: VaultAnnotation }
    if (res.success && res.data) set(s => ({ annotations: [...s.annotations, res.data!] }))
  },

  updateAnnotation: async (id, content) => {
    const res = await api.annotations.update(id, { content }) as { success: boolean; data?: VaultAnnotation }
    if (res.success && res.data) set(s => ({ annotations: s.annotations.map(a => a.id === id ? res.data! : a) }))
  },

  deleteAnnotation: async (id) => {
    await api.annotations.delete(id)
    set(s => ({ annotations: s.annotations.filter(a => a.id !== id) }))
  },

  setActiveColor: (hex) => set({ activeColorHex: hex }),

  // ── Import ────────────────────────────────────────────────────────────────

  importDocument: async () => {
    const res = await api.storage.importFiles({
      category: 'documents',
      accept: ['pdf', 'docx', 'doc', 'txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css'],
      title: 'Import Files',
    }) as { success: boolean; data?: { items: { path: string; originalName: string; size: number; mimeType: string }[] } }
    if (!res.success || !res.data?.items?.length) return
    for (const { path: filePath, originalName, size, mimeType } of res.data.items) {
      const ext = originalName.split('.').pop()?.toLowerCase() ?? ''
      const vaultType = ext === 'pdf' ? 'pdf' : ext === 'md' ? 'note' : 'document'
      await api.documents.create({
        title: originalName.replace(/\.[^.]+$/, ''),
        file_path: filePath,
        original_filename: originalName,
        mime_type: mimeType,
        file_size_bytes: size,
        type: vaultType as never,
      })
    }
    await get().fetch()
  },

  // ── Reading progress ──────────────────────────────────────────────────────

  updateReadingProgress: async (currentPage, totalPages, scrollPct) => {
    const { activeDocument } = get()
    if (!activeDocument) return
    const res = await api.annotations.updateReadingProgress(activeDocument.id, currentPage, totalPages, scrollPct, 1) as {
      success: boolean; data?: ReadingProgress
    }
    if (res.success && res.data) set({ readingProgress: res.data })
  },

  // ── Knowledge colors ──────────────────────────────────────────────────────

  fetchColors: async () => {
    const res = await api.knowledgeColors.getAll() as { success: boolean; data?: KnowledgeColor[] }
    if (res.success && res.data) set({ colors: res.data, activeColorHex: res.data[2]?.color_hex ?? '#EAB308' })
  },

  createColor: async (params) => {
    const res = await api.knowledgeColors.create(params) as { success: boolean; data?: KnowledgeColor }
    if (res.success && res.data) set(s => ({ colors: [...s.colors, res.data!] }))
  },

  deleteColor: async (id) => {
    await api.knowledgeColors.delete(id)
    set(s => ({ colors: s.colors.filter(c => c.id !== id) }))
  },
}))
