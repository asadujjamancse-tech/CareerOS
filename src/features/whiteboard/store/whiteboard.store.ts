import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type {
  WhiteboardSummary,
  Whiteboard,
  WhiteboardLink,
  CanvasData,
  CanvasElement,
  CreateWhiteboardInput,
  UpdateWhiteboardInput,
} from '../types/whiteboard.types'
import { DEFAULT_CANVAS_DATA } from '../types/whiteboard.types'

interface WhiteboardState {
  // List view
  whiteboards: WhiteboardSummary[]
  loading: boolean
  error: string | null

  // Active canvas
  activeId: string | null
  canvasData: CanvasData
  dirty: boolean
  saving: boolean
  links: WhiteboardLink[]

  // Actions
  fetchAll: () => Promise<void>
  openWhiteboard: (id: string) => Promise<void>
  closeWhiteboard: () => void
  create: (input: CreateWhiteboardInput) => Promise<WhiteboardSummary>
  update: (id: string, input: UpdateWhiteboardInput) => Promise<void>
  remove: (id: string) => Promise<void>
  saveCanvas: (id: string) => Promise<void>
  setCanvasData: (data: CanvasData) => void
  updateElements: (elements: CanvasElement[]) => void
  fetchLinks: (whiteboardId: string) => Promise<void>
  addLink: (whiteboardId: string, entityType: string, entityId: string) => Promise<void>
  removeLink: (whiteboardId: string, entityType: string, entityId: string) => Promise<void>
}

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  whiteboards: [],
  loading: false,
  error: null,
  activeId: null,
  canvasData: DEFAULT_CANVAS_DATA,
  dirty: false,
  saving: false,
  links: [],

  fetchAll: async () => {
    set({ loading: true, error: null })
    const res = await api.whiteboard.getAll() as { success: boolean; data?: WhiteboardSummary[]; error?: string }
    if (res.success) {
      set({ whiteboards: res.data ?? [], loading: false })
    } else {
      set({ error: res.error ?? 'Failed to load whiteboards', loading: false })
    }
  },

  openWhiteboard: async (id: string) => {
    set({ loading: true, error: null })
    const res = await api.whiteboard.getById(id) as { success: boolean; data?: Whiteboard; error?: string }
    if (!res.success || !res.data) {
      set({ error: res.error ?? 'Failed to open whiteboard', loading: false })
      return
    }
    let parsed: CanvasData = DEFAULT_CANVAS_DATA
    try { parsed = JSON.parse(res.data.canvas_data) as CanvasData } catch { /* use default */ }
    set({ activeId: id, canvasData: parsed, dirty: false, loading: false })
    await get().fetchLinks(id)
  },

  closeWhiteboard: () => {
    set({ activeId: null, canvasData: DEFAULT_CANVAS_DATA, dirty: false, links: [] })
  },

  create: async (input: CreateWhiteboardInput) => {
    const res = await api.whiteboard.create(input) as { success: boolean; data?: WhiteboardSummary; error?: string }
    if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to create')
    set(s => ({ whiteboards: [res.data!, ...s.whiteboards] }))
    return res.data
  },

  update: async (id: string, input: UpdateWhiteboardInput) => {
    const res = await api.whiteboard.update(id, input) as { success: boolean; data?: WhiteboardSummary; error?: string }
    if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to update')
    set(s => ({
      whiteboards: s.whiteboards.map(w => w.id === id ? { ...w, ...res.data! } : w),
    }))
  },

  remove: async (id: string) => {
    const res = await api.whiteboard.delete(id) as { success: boolean; error?: string }
    if (!res.success) throw new Error(res.error ?? 'Failed to delete')
    set(s => ({
      whiteboards: s.whiteboards.filter(w => w.id !== id),
      activeId:    s.activeId === id ? null : s.activeId,
      canvasData:  s.activeId === id ? DEFAULT_CANVAS_DATA : s.canvasData,
    }))
  },

  saveCanvas: async (id: string) => {
    set({ saving: true })
    try {
      const json = JSON.stringify(get().canvasData)
      const res = await api.whiteboard.saveCanvas(id, json) as { success: boolean; error?: string }
      if (!res.success) throw new Error(res.error)
      set(s => ({
        dirty: false,
        saving: false,
        whiteboards: s.whiteboards.map(w =>
          w.id === id ? { ...w, updated_at: new Date().toISOString() } : w,
        ),
      }))
    } catch {
      set({ saving: false })
    }
  },

  setCanvasData: (data: CanvasData) => {
    set({ canvasData: data, dirty: true })
  },

  updateElements: (elements: CanvasElement[]) => {
    set(s => ({ canvasData: { ...s.canvasData, elements }, dirty: true }))
  },

  fetchLinks: async (whiteboardId: string) => {
    const res = await api.whiteboard.links.get(whiteboardId) as { success: boolean; data?: WhiteboardLink[] }
    if (res.success) set({ links: res.data ?? [] })
  },

  addLink: async (whiteboardId: string, entityType: string, entityId: string) => {
    const res = await api.whiteboard.links.add(whiteboardId, entityType, entityId) as { success: boolean; data?: WhiteboardLink; error?: string }
    if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to add link')
    set(s => ({
      links: [
        ...s.links.filter(l => !(l.entity_type === entityType && l.entity_id === entityId)),
        res.data!,
      ],
    }))
  },

  removeLink: async (whiteboardId: string, entityType: string, entityId: string) => {
    const res = await api.whiteboard.links.remove(whiteboardId, entityType, entityId) as { success: boolean; error?: string }
    if (!res.success) throw new Error(res.error ?? 'Failed to remove link')
    set(s => ({ links: s.links.filter(l => !(l.entity_type === entityType && l.entity_id === entityId)) }))
  },
}))
