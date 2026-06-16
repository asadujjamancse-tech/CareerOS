import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type {
  KgNode,
  KgLink,
  KgGraphData,
  KgEntitySearchResult,
  KgEntityType,
  CreateKgNodeInput,
  UpdateKgNodeInput,
  CreateKgLinkInput,
} from '@shared/types/ipc.types'

interface KnowledgeGraphState {
  // ── Graph data ─────────────────────────────────────────────────────────────
  graphData: KgGraphData | null
  isLoadingGraph: boolean
  graphError: string | null

  // ── Node management ────────────────────────────────────────────────────────
  nodes: KgNode[]
  isLoadingNodes: boolean
  isNodeFormOpen: boolean
  editingNodeId: string | null
  isSubmittingNode: boolean
  deletingNodeId: string | null

  // ── Link management ────────────────────────────────────────────────────────
  links: KgLink[]
  isLoadingLinks: boolean
  isLinkFormOpen: boolean
  linkSourceId: string | null
  isSubmittingLink: boolean

  // ── Entity search ──────────────────────────────────────────────────────────
  entitySearchResults: KgEntitySearchResult[]
  isSearchingEntities: boolean

  // ── UI state ───────────────────────────────────────────────────────────────
  selectedNodeId: string | null
  activeTypeFilter: KgEntityType | 'all'

  // ── Actions ────────────────────────────────────────────────────────────────
  fetchGraph: () => Promise<void>
  fetchNodes: () => Promise<void>
  fetchLinks: () => Promise<void>

  openCreateNode: () => void
  openEditNode: (id: string) => void
  closeNodeForm: () => void
  submitNode: (values: CreateKgNodeInput | UpdateKgNodeInput) => Promise<boolean>
  confirmDeleteNode: (id: string) => void
  cancelDeleteNode: () => void
  executeDeleteNode: () => Promise<boolean>

  openLinkForm: (sourceId?: string) => void
  closeLinkForm: () => void
  submitLink: (values: CreateKgLinkInput) => Promise<boolean>
  deleteLink: (id: string) => Promise<boolean>

  searchEntities: (query: string, entityType?: KgEntityType) => Promise<void>
  clearEntitySearch: () => void

  selectNode: (id: string | null) => void
  setTypeFilter: (type: KgEntityType | 'all') => void
}

export const useKnowledgeGraphStore = create<KnowledgeGraphState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  graphData: null,
  isLoadingGraph: false,
  graphError: null,

  nodes: [],
  isLoadingNodes: false,
  isNodeFormOpen: false,
  editingNodeId: null,
  isSubmittingNode: false,
  deletingNodeId: null,

  links: [],
  isLoadingLinks: false,
  isLinkFormOpen: false,
  linkSourceId: null,
  isSubmittingLink: false,

  entitySearchResults: [],
  isSearchingEntities: false,

  selectedNodeId: null,
  activeTypeFilter: 'all',

  // ── Graph ──────────────────────────────────────────────────────────────────

  async fetchGraph() {
    set({ isLoadingGraph: true, graphError: null })
    try {
      const result = await api.knowledgeGraph.getGraph()
      if (result.success) {
        set({ graphData: result.data })
      } else {
        set({ graphError: result.error })
      }
    } catch {
      set({ graphError: 'Failed to load knowledge graph' })
    } finally {
      set({ isLoadingGraph: false })
    }
  },

  async fetchNodes() {
    set({ isLoadingNodes: true })
    try {
      const result = await api.knowledgeGraph.nodes.getAll()
      if (result.success) set({ nodes: result.data })
    } catch {
      // non-fatal
    } finally {
      set({ isLoadingNodes: false })
    }
  },

  async fetchLinks() {
    set({ isLoadingLinks: true })
    try {
      const result = await api.knowledgeGraph.links.getAll()
      if (result.success) set({ links: result.data })
    } catch {
      // non-fatal
    } finally {
      set({ isLoadingLinks: false })
    }
  },

  // ── Node actions ───────────────────────────────────────────────────────────

  openCreateNode() {
    set({ isNodeFormOpen: true, editingNodeId: null })
  },

  openEditNode(id) {
    set({ isNodeFormOpen: true, editingNodeId: id })
  },

  closeNodeForm() {
    set({ isNodeFormOpen: false, editingNodeId: null })
  },

  async submitNode(values) {
    set({ isSubmittingNode: true })
    const { editingNodeId } = get()
    try {
      const result = editingNodeId
        ? await api.knowledgeGraph.nodes.update(editingNodeId, values as UpdateKgNodeInput)
        : await api.knowledgeGraph.nodes.create(values as CreateKgNodeInput)
      if (result.success) {
        set({ isNodeFormOpen: false, editingNodeId: null })
        void get().fetchGraph()
        void get().fetchNodes()
        return true
      }
      return false
    } catch {
      return false
    } finally {
      set({ isSubmittingNode: false })
    }
  },

  confirmDeleteNode(id) {
    set({ deletingNodeId: id })
  },

  cancelDeleteNode() {
    set({ deletingNodeId: null })
  },

  async executeDeleteNode() {
    const { deletingNodeId } = get()
    if (!deletingNodeId) return false
    try {
      const result = await api.knowledgeGraph.nodes.delete(deletingNodeId)
      if (result.success) {
        set({ deletingNodeId: null, selectedNodeId: null })
        void get().fetchGraph()
        void get().fetchNodes()
        void get().fetchLinks()
        return true
      }
      return false
    } catch {
      return false
    }
  },

  // ── Link actions ───────────────────────────────────────────────────────────

  openLinkForm(sourceId) {
    set({ isLinkFormOpen: true, linkSourceId: sourceId ?? null })
  },

  closeLinkForm() {
    set({ isLinkFormOpen: false, linkSourceId: null })
  },

  async submitLink(values) {
    set({ isSubmittingLink: true })
    try {
      const result = await api.knowledgeGraph.links.create(values)
      if (result.success) {
        set({ isLinkFormOpen: false, linkSourceId: null })
        void get().fetchGraph()
        void get().fetchLinks()
        void get().fetchNodes()
        return true
      }
      return false
    } catch {
      return false
    } finally {
      set({ isSubmittingLink: false })
    }
  },

  async deleteLink(id) {
    try {
      const result = await api.knowledgeGraph.links.delete(id)
      if (result.success) {
        void get().fetchGraph()
        void get().fetchLinks()
        void get().fetchNodes()
        return true
      }
      return false
    } catch {
      return false
    }
  },

  // ── Entity search ──────────────────────────────────────────────────────────

  async searchEntities(query, entityType) {
    set({ isSearchingEntities: true })
    try {
      const result = await api.knowledgeGraph.searchEntities(query, entityType)
      if (result.success) set({ entitySearchResults: result.data })
    } catch {
      // non-fatal
    } finally {
      set({ isSearchingEntities: false })
    }
  },

  clearEntitySearch() {
    set({ entitySearchResults: [] })
  },

  // ── UI ─────────────────────────────────────────────────────────────────────

  selectNode(id) {
    set({ selectedNodeId: id })
  },

  setTypeFilter(type) {
    set({ activeTypeFilter: type })
  },
}))
