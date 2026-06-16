import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { api } from '@shared/lib/ipc-client'
import type { DockviewApi } from 'dockview'
import type {
  WorkspaceSession,
  WorkspaceTab,
  WorkspacePreset,
  OpenPanelRequest,
} from '../types/workspace.types'

// ── Default layout factory ────────────────────────────────────────────────────

function makeDefaultTab(): WorkspaceTab {
  return { id: nanoid(), title: 'Study Session', dockviewJson: null }
}

function makeDefaultSession(): WorkspaceSession {
  const tab = makeDefaultTab()
  return {
    version: 2,
    activeTabId: tab.id,
    tabs: [tab],
    sidebarOpen: true,
    sidebarSkillId: '',
    presets: [],
  }
}

// ── State interface ───────────────────────────────────────────────────────────

interface WorkspaceState {
  session: WorkspaceSession
  isLoaded: boolean
  activeTab: WorkspaceTab | null

  /** Live Dockview API reference — set from the PanelLayout onReady callback. Not persisted. */
  dockviewApi: DockviewApi | null

  load: () => Promise<void>
  persist: () => void

  // Tab management
  createTab: () => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  renameTab: (id: string, title: string) => void

  // Dockview integration
  setDockviewApi: (api: DockviewApi | null) => void
  saveDockviewLayout: (tabId: string, json: string) => void
  openInDockview: (request: OpenPanelRequest) => void
  addFloatingPanel: (request: OpenPanelRequest) => void

  // Preset management
  savePreset: (name: string, icon: string) => void
  loadPreset: (id: string) => void
  deletePreset: (id: string) => void

  // Sidebar
  toggleSidebar: () => void
  setSidebarSkill: (skillId: string) => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  session: makeDefaultSession(),
  isLoaded: false,
  activeTab: null,
  dockviewApi: null,

  async load() {
    try {
      const r = await api.workspace.getState()
      if (r.success && r.data && (r.data as string) !== '{}') {
        const parsed = JSON.parse(r.data as string) as WorkspaceSession
        if (parsed.tabs?.length) {
          const activeTab =
            parsed.tabs.find(t => t.id === parsed.activeTabId) ??
            parsed.tabs[0] ??
            null
          // Migrate v1 sessions (had vSplit/hSplit; no dockviewJson/presets)
          const migrated: WorkspaceSession = {
            ...parsed,
            version: 2,
            presets: parsed.presets ?? [],
            tabs: parsed.tabs.map(t => ({
              id: t.id,
              title: t.title,
              dockviewJson: (t as unknown as { dockviewJson?: string }).dockviewJson ?? null,
            })),
          }
          set({ session: migrated, activeTab, isLoaded: true })
          return
        }
      }
    } catch { /* fall through */ }
    const session = makeDefaultSession()
    set({ session, activeTab: session.tabs[0] ?? null, isLoaded: true })
  },

  persist() {
    void api.workspace.saveState(JSON.stringify(get().session))
  },

  createTab() {
    const tab = makeDefaultTab()
    set(s => {
      const session = { ...s.session, tabs: [...s.session.tabs, tab], activeTabId: tab.id }
      return { session, activeTab: tab }
    })
    get().persist()
  },

  closeTab(id) {
    const { session } = get()
    if (session.tabs.length <= 1) return
    const idx = session.tabs.findIndex(t => t.id === id)
    const newTabs = session.tabs.filter(t => t.id !== id)
    const fallback = newTabs[Math.max(0, idx - 1)] ?? newTabs[0] ?? null
    const newActiveId = session.activeTabId === id ? (fallback?.id ?? '') : session.activeTabId
    set({ session: { ...session, tabs: newTabs, activeTabId: newActiveId }, activeTab: fallback })
    get().persist()
  },

  setActiveTab(id) {
    const { session } = get()
    const tab = session.tabs.find(t => t.id === id) ?? null
    if (!tab) return
    set({ session: { ...session, activeTabId: id }, activeTab: tab })
    get().persist()
  },

  renameTab(id, title) {
    set(s => {
      const tabs = s.session.tabs.map(t => t.id === id ? { ...t, title } : t)
      const session = { ...s.session, tabs }
      return { session, activeTab: session.tabs.find(t => t.id === session.activeTabId) ?? null }
    })
    get().persist()
  },

  // ── Dockview ────────────────────────────────────────────────────────────────

  setDockviewApi(dockviewApi) {
    set({ dockviewApi })
  },

  saveDockviewLayout(tabId, json) {
    set(s => {
      const tabs = s.session.tabs.map(t => t.id === tabId ? { ...t, dockviewJson: json } : t)
      const session = { ...s.session, tabs }
      const activeTab = session.tabs.find(t => t.id === session.activeTabId) ?? null
      return { session, activeTab }
    })
    get().persist()
  },

  openInDockview(request) {
    const { dockviewApi } = get()
    if (!dockviewApi) return
    const { component, title, ...params } = request
    dockviewApi.addPanel({
      id: nanoid(),
      component,
      title: title ?? component.replace('Panel', ''),
      params,
    })
  },

  addFloatingPanel(request) {
    const { dockviewApi } = get()
    if (!dockviewApi) return
    const { component, title, ...params } = request
    const panelId = nanoid()
    dockviewApi.addPanel({
      id: panelId,
      component,
      title: title ?? component.replace('Panel', ''),
      params,
      floating: {
        x: 80,
        y: 80,
        width: 420,
        height: 560,
      },
    })
  },

  // ── Presets ─────────────────────────────────────────────────────────────────

  savePreset(name, icon) {
    const { dockviewApi, session } = get()
    if (!dockviewApi) return
    const preset: WorkspacePreset = {
      id: nanoid(),
      name,
      icon,
      dockviewJson: JSON.stringify(dockviewApi.toJSON()),
      createdAt: new Date().toISOString(),
    }
    set(s => ({ session: { ...s.session, presets: [...s.session.presets, preset] } }))
    get().persist()
    void session
  },

  loadPreset(id) {
    const { dockviewApi, session } = get()
    const preset = session.presets.find(p => p.id === id)
    if (!preset || !dockviewApi) return
    try {
      dockviewApi.fromJSON(JSON.parse(preset.dockviewJson) as Parameters<typeof dockviewApi.fromJSON>[0])
    } catch { /* invalid preset json */ }
  },

  deletePreset(id) {
    set(s => ({ session: { ...s.session, presets: s.session.presets.filter(p => p.id !== id) } }))
    get().persist()
  },

  // ── Sidebar ─────────────────────────────────────────────────────────────────

  toggleSidebar() {
    set(s => ({ session: { ...s.session, sidebarOpen: !s.session.sidebarOpen } }))
    get().persist()
  },

  setSidebarSkill(skillId) {
    set(s => ({ session: { ...s.session, sidebarSkillId: skillId } }))
    get().persist()
  },
}))
