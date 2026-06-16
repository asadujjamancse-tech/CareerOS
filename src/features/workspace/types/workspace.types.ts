// ── Dockview panel component names ───────────────────────────────────────────

export type WorkspacePanelComponent =
  | 'BrowserPanel'
  | 'VideoPanel'
  | 'NotesPanel'
  | 'PlaylistPanel'
  | 'TasksPanel'
  | 'WelcomePanel'

// ── Per-panel params (serialised inside dockview layout JSON) ─────────────────

export interface BrowserPanelParams {
  url?: string
}

export interface VideoPanelParams {
  url?: string
  title?: string
}

export interface NotesPanelParams {
  entityId?: string
  title?: string
}

export interface PlaylistPanelParams {
  entityId?: string
  title?: string
}

export interface TasksPanelParams {
  labId?: string
  title?: string
}

// Union used by WorkspaceSidebar → openInDockview
export type OpenPanelRequest =
  | { component: 'BrowserPanel'; url?: string; title?: string }
  | { component: 'VideoPanel';   url?: string; title?: string }
  | { component: 'NotesPanel';   entityId?: string; title?: string }
  | { component: 'PlaylistPanel'; entityId?: string; title?: string }
  | { component: 'TasksPanel';   labId?: string; title?: string }
  | { component: 'WelcomePanel'; title?: string }

// ── Workspace session (persisted to workspace_state table) ────────────────────

export interface WorkspaceTab {
  id: string
  title: string
  /** Serialised DockviewApi.toJSON() blob; null means use the default layout */
  dockviewJson: string | null
}

export interface WorkspaceSession {
  version: number
  activeTabId: string
  tabs: WorkspaceTab[]
  sidebarOpen: boolean
  sidebarSkillId: string
  /** Named layout presets saved by the user */
  presets: WorkspacePreset[]
}

// ── Named layout presets ──────────────────────────────────────────────────────

export interface WorkspacePreset {
  id: string
  name: string
  icon: string
  dockviewJson: string
  createdAt: string
}

// ── Sidebar resource browser ──────────────────────────────────────────────────

export type SidebarResourceKind =
  | 'video'
  | 'playlist'
  | 'document'
  | 'note'
  | 'website'
  | 'lab'
  | 'interview-question'

export interface SidebarResource {
  id: string
  kind: SidebarResourceKind
  title: string
  url?: string
  subtitle?: string
}

// ── Floating always-on-top window params ──────────────────────────────────────

export interface FloatingWindowParams {
  type: WorkspacePanelComponent
  url?: string
  entityId?: string
  title?: string
}
