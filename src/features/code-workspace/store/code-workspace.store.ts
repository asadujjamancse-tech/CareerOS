import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@shared/lib/ipc-client'
import type {
  CodeFile,
  CodeFolder,
  EditorSettings,
  CreateCodeFileInput,
  CreateCodeFolderInput,
  UpdateCodeFileInput,
  UpdateCodeFolderInput,
} from '../types/code-workspace.types'
import { DEFAULT_EDITOR_SETTINGS } from '../types/code-workspace.types'

interface CodeWorkspaceState {
  // Data
  files: CodeFile[]
  folders: CodeFolder[]
  loading: boolean
  error: string | null

  // Tab management
  openTabs: string[]        // ordered list of open file IDs
  activeTabId: string | null

  // Editor content (in-memory, not persisted)
  localContent: Record<string, string>  // fileId → current content
  dirtyTabs: Record<string, boolean>    // fileId → has unsaved changes
  isSaving: boolean

  // Editor UI settings (persisted)
  settings: EditorSettings

  // Cursor (live, not persisted)
  cursorLine: number
  cursorColumn: number

  // Folder expand state (persisted)
  expandedFolders: Record<string, boolean>

  // Actions
  fetchAll: () => Promise<void>
  openFile: (fileId: string) => Promise<void>
  closeTab: (fileId: string) => void
  setActiveTab: (fileId: string) => void
  createFile: (input: CreateCodeFileInput) => Promise<CodeFile>
  createFolder: (input: CreateCodeFolderInput) => Promise<CodeFolder>
  updateFile: (id: string, input: UpdateCodeFileInput) => Promise<void>
  updateFolder: (id: string, input: UpdateCodeFolderInput) => Promise<void>
  deleteFile: (id: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  updateLocalContent: (fileId: string, content: string) => void
  saveContent: (fileId: string) => Promise<void>
  updateSettings: (patch: Partial<EditorSettings>) => void
  setCursorPosition: (line: number, column: number) => void
  toggleFolder: (folderId: string) => void
}

export const useCodeWorkspaceStore = create<CodeWorkspaceState>()(
  persist(
    (set, get) => ({
      files: [],
      folders: [],
      loading: false,
      error: null,
      openTabs: [],
      activeTabId: null,
      localContent: {},
      dirtyTabs: {},
      isSaving: false,
      settings: DEFAULT_EDITOR_SETTINGS,
      cursorLine: 1,
      cursorColumn: 1,
      expandedFolders: {},

      fetchAll: async () => {
        set({ loading: true, error: null })
        try {
          const [fRes, filesRes] = await Promise.all([
            api.codeWorkspace.folders.getAll() as Promise<{ success: boolean; data?: CodeFolder[] }>,
            api.codeWorkspace.files.getAll() as Promise<{ success: boolean; data?: CodeFile[] }>,
          ])
          set({
            folders: fRes.success ? (fRes.data ?? []) : [],
            files: filesRes.success ? (filesRes.data ?? []) : [],
            loading: false,
          })
        } catch {
          set({ loading: false, error: 'Failed to load workspace' })
        }
      },

      openFile: async (fileId: string) => {
        const { openTabs, localContent } = get()

        // Add to tabs if not already open
        if (!openTabs.includes(fileId)) {
          set({ openTabs: [...openTabs, fileId] })
        }
        set({ activeTabId: fileId })

        // Load content if not already in cache
        if (localContent[fileId] === undefined) {
          const res = await api.codeWorkspace.files.getById(fileId) as { success: boolean; data?: CodeFile }
          if (res.success && res.data) {
            set((s) => ({
              localContent: { ...s.localContent, [fileId]: res.data!.content },
              // Also update the file metadata in files array
              files: s.files.map(f => f.id === fileId ? { ...f, ...res.data! } : f),
            }))
          }
        }
      },

      closeTab: (fileId: string) => {
        const { openTabs, activeTabId } = get()
        const newTabs = openTabs.filter(id => id !== fileId)
        const newActive = activeTabId === fileId
          ? (newTabs[newTabs.indexOf(fileId) - 1] ?? newTabs[0] ?? null)
          : activeTabId
        set((s) => {
          const { [fileId]: _lc, ...restContent } = s.localContent
          const { [fileId]: _dt, ...restDirty } = s.dirtyTabs
          return { openTabs: newTabs, activeTabId: newActive, localContent: restContent, dirtyTabs: restDirty }
        })
      },

      setActiveTab: (fileId: string) => {
        set({ activeTabId: fileId })
      },

      createFile: async (input: CreateCodeFileInput) => {
        const res = await api.codeWorkspace.files.create(input) as { success: boolean; data?: CodeFile; error?: string }
        if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to create file')
        const file = res.data
        set((s) => ({
          files: [...s.files, file],
          openTabs: s.openTabs.includes(file.id) ? s.openTabs : [...s.openTabs, file.id],
          activeTabId: file.id,
          localContent: { ...s.localContent, [file.id]: input.content ?? '' },
        }))
        return file
      },

      createFolder: async (input: CreateCodeFolderInput) => {
        const res = await api.codeWorkspace.folders.create(input) as { success: boolean; data?: CodeFolder; error?: string }
        if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to create folder')
        const folder = res.data
        set((s) => ({ folders: [...s.folders, folder] }))
        return folder
      },

      updateFile: async (id: string, input: UpdateCodeFileInput) => {
        const res = await api.codeWorkspace.files.update(id, input) as { success: boolean; data?: CodeFile; error?: string }
        if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to update file')
        const updated = res.data
        set((s) => ({ files: s.files.map(f => f.id === id ? { ...f, ...updated } : f) }))
      },

      updateFolder: async (id: string, input: UpdateCodeFolderInput) => {
        const res = await api.codeWorkspace.folders.update(id, input) as { success: boolean; data?: CodeFolder; error?: string }
        if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to update folder')
        const updated = res.data
        set((s) => ({ folders: s.folders.map(f => f.id === id ? { ...f, ...updated } : f) }))
      },

      deleteFile: async (id: string) => {
        const res = await api.codeWorkspace.files.delete(id) as { success: boolean; error?: string }
        if (!res.success) throw new Error(res.error ?? 'Failed to delete file')
        set((s) => {
          const newTabs = s.openTabs.filter(tid => tid !== id)
          const newActive = s.activeTabId === id
            ? (newTabs[0] ?? null)
            : s.activeTabId
          const { [id]: _lc, ...restContent } = s.localContent
          const { [id]: _dt, ...restDirty } = s.dirtyTabs
          return {
            files: s.files.filter(f => f.id !== id),
            openTabs: newTabs,
            activeTabId: newActive,
            localContent: restContent,
            dirtyTabs: restDirty,
          }
        })
      },

      deleteFolder: async (id: string) => {
        const res = await api.codeWorkspace.folders.delete(id) as { success: boolean; error?: string }
        if (!res.success) throw new Error(res.error ?? 'Failed to delete folder')
        // Files with this folder_id will have folder_id set to null by the DB (ON DELETE SET NULL)
        set((s) => ({
          folders: s.folders.filter(f => f.id !== id),
          files: s.files.map(f => f.folder_id === id ? { ...f, folder_id: null } : f),
        }))
      },

      updateLocalContent: (fileId: string, content: string) => {
        set((s) => ({
          localContent: { ...s.localContent, [fileId]: content },
          dirtyTabs: { ...s.dirtyTabs, [fileId]: true },
        }))
      },

      saveContent: async (fileId: string) => {
        const content = get().localContent[fileId]
        if (content === undefined) return
        set({ isSaving: true })
        try {
          await api.codeWorkspace.files.saveContent(fileId, content)
          set((s) => ({
            isSaving: false,
            dirtyTabs: { ...s.dirtyTabs, [fileId]: false },
            files: s.files.map(f => f.id === fileId ? { ...f, content, updated_at: new Date().toISOString() } : f),
          }))
        } catch {
          set({ isSaving: false })
        }
      },

      updateSettings: (patch: Partial<EditorSettings>) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }))
      },

      setCursorPosition: (line: number, column: number) => {
        set({ cursorLine: line, cursorColumn: column })
      },

      toggleFolder: (folderId: string) => {
        set((s) => ({
          expandedFolders: {
            ...s.expandedFolders,
            [folderId]: !s.expandedFolders[folderId],
          },
        }))
      },
    }),
    {
      name: 'code-workspace-store',
      partialize: (s) => ({
        settings: s.settings,
        expandedFolders: s.expandedFolders,
        openTabs: s.openTabs,
        activeTabId: s.activeTabId,
      }),
    },
  ),
)
