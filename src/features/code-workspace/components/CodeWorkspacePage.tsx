import { useEffect, useRef, useCallback, useState } from 'react'
import { Code2 } from 'lucide-react'
import { useCodeWorkspaceStore } from '../store/code-workspace.store'
import { FileTree } from './FileTree'
import { EditorTabs } from './EditorTabs'
import { MonacoEditor } from './MonacoEditor'
import { StatusBar } from './StatusBar'
import { NewFileDialog, NewFolderDialog, RenameDialog } from './NewItemDialog'
import type { CodeFile, CodeFolder, CreateCodeFileInput, CreateCodeFolderInput } from '../types/code-workspace.types'
import type { CreateFileForm, CreateFolderForm } from '../schemas/code-workspace.schema'

const AUTOSAVE_DELAY = 1500

export function CodeWorkspacePage() {
  const {
    files, folders, loading, error,
    openTabs, activeTabId, localContent, dirtyTabs, isSaving,
    settings, cursorLine, cursorColumn, expandedFolders,
    fetchAll, openFile, closeTab, setActiveTab,
    createFile, createFolder, updateFile, updateFolder,
    deleteFile, deleteFolder, updateLocalContent, saveContent,
    updateSettings, setCursorPosition, toggleFolder,
  } = useCodeWorkspaceStore()

  // Dialog state
  const [newFileOpen, setNewFileOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<{ item: CodeFile | CodeFolder; type: 'file' | 'folder' } | null>(null)
  const [defaultFolderId, setDefaultFolderId] = useState<string | null>(null)

  // Autosave timer
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load all data on mount
  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  // Restore open tabs content on mount (tabs are persisted, content isn't)
  useEffect(() => {
    if (loading) return
    if (openTabs.length > 0 && activeTabId) {
      void openFile(activeTabId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // Active file
  const activeFile = files.find(f => f.id === activeTabId)

  // Content for the active editor
  const editorContent = activeTabId
    ? (localContent[activeTabId] ?? activeFile?.content ?? '')
    : ''

  // Autosave on content change
  const handleContentChange = useCallback((content: string) => {
    if (!activeTabId) return
    updateLocalContent(activeTabId, content)
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      void saveContent(activeTabId)
    }, AUTOSAVE_DELAY)
  }, [activeTabId, updateLocalContent, saveContent])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      const { activeTabId: tabId, dirtyTabs: dirty } = useCodeWorkspaceStore.getState()
      if (tabId && dirty[tabId]) {
        void useCodeWorkspaceStore.getState().saveContent(tabId)
      }
    }
  }, [])

  // Keyboard: Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (activeTabId && dirtyTabs[activeTabId]) {
          void saveContent(activeTabId)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTabId, dirtyTabs, saveContent])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFileOpen = useCallback((fileId: string) => {
    void openFile(fileId)
  }, [openFile])

  const handleNewFile = useCallback((folderId?: string | null) => {
    setDefaultFolderId(folderId ?? null)
    setNewFileOpen(true)
  }, [])

  const handleNewFolder = useCallback((parentId?: string | null) => {
    setDefaultFolderId(parentId ?? null)
    setNewFolderOpen(true)
  }, [])

  const handleCreateFile = useCallback(async (data: CreateFileForm) => {
    const input: CreateCodeFileInput = {
      title: data.title,
      language: data.language as CreateCodeFileInput['language'],
      content: data.content ?? '',
      folder_id: data.folder_id ?? defaultFolderId,
    }
    await createFile(input)
  }, [createFile, defaultFolderId])

  const handleCreateFolder = useCallback(async (data: CreateFolderForm) => {
    const input: CreateCodeFolderInput = {
      name: data.name,
      parent_id: data.parent_id ?? defaultFolderId,
    }
    await createFolder(input)
  }, [createFolder, defaultFolderId])

  const handleFileRename = useCallback((file: CodeFile) => {
    setRenameTarget({ item: file, type: 'file' })
  }, [])

  const handleFolderRename = useCallback((folder: CodeFolder) => {
    setRenameTarget({ item: folder, type: 'folder' })
  }, [])

  const handleRenameSubmit = useCallback(async (newName: string) => {
    if (!renameTarget) return
    if (renameTarget.type === 'file') {
      await updateFile(renameTarget.item.id, { title: newName })
    } else {
      await updateFolder(renameTarget.item.id, { name: newName })
    }
    setRenameTarget(null)
  }, [renameTarget, updateFile, updateFolder])

  const handleFileDelete = useCallback(async (id: string) => {
    const file = files.find(f => f.id === id)
    if (!file) return
    if (!confirm(`Delete "${file.title}"? This cannot be undone.`)) return
    await deleteFile(id)
  }, [files, deleteFile])

  const handleFolderDelete = useCallback(async (id: string) => {
    const folder = folders.find(f => f.id === id)
    if (!folder) return
    if (!confirm(`Delete folder "${folder.name}" and all its files? This cannot be undone.`)) return
    await deleteFolder(id)
  }, [folders, deleteFolder])

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950 text-zinc-500 text-sm">
        Loading workspace…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950 text-red-400 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden bg-zinc-950">
      {/* ── File Tree Sidebar ─────────────────────────────────────────── */}
      <div className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-900/40 flex flex-col">
        <FileTree
          files={files}
          folders={folders}
          activeTabId={activeTabId}
          dirtyTabs={dirtyTabs}
          expandedFolders={expandedFolders}
          onFileOpen={handleFileOpen}
          onFileRename={handleFileRename}
          onFileDelete={(id) => void handleFileDelete(id)}
          onFolderRename={handleFolderRename}
          onFolderDelete={(id) => void handleFolderDelete(id)}
          onToggleFolder={toggleFolder}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
        />
      </div>

      {/* ── Editor Area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Tabs */}
        <EditorTabs
          openTabs={openTabs}
          files={files}
          activeTabId={activeTabId}
          dirtyTabs={dirtyTabs}
          onActivate={(id) => { setActiveTab(id); void openFile(id) }}
          onClose={closeTab}
        />

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {activeTabId && activeFile ? (
            <MonacoEditor
              fileId={activeTabId}
              value={editorContent}
              language={activeFile.language}
              settings={settings}
              onChange={handleContentChange}
              onCursorChange={setCursorPosition}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600 bg-zinc-950">
              <Code2 className="h-12 w-12 opacity-20" />
              <p className="text-sm">Open a file from the explorer</p>
              <button
                type="button"
                onClick={() => handleNewFile(null)}
                className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
              >
                or create a new file
              </button>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <StatusBar
          activeFile={activeFile}
          cursorLine={cursorLine}
          cursorColumn={cursorColumn}
          settings={settings}
          isSaving={isSaving}
          isDirty={!!(activeTabId && dirtyTabs[activeTabId])}
          onSettingsChange={updateSettings}
        />
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────── */}
      <NewFileDialog
        open={newFileOpen}
        onClose={() => setNewFileOpen(false)}
        onSubmit={handleCreateFile}
        defaultFolderId={defaultFolderId}
      />

      <NewFolderDialog
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onSubmit={handleCreateFolder}
        defaultParentId={defaultFolderId}
      />

      {renameTarget && (
        <RenameDialog
          open={true}
          currentName={renameTarget.type === 'file'
            ? (renameTarget.item as CodeFile).title
            : (renameTarget.item as CodeFolder).name}
          itemType={renameTarget.type}
          onClose={() => setRenameTarget(null)}
          onSubmit={handleRenameSubmit}
        />
      )}
    </div>
  )
}
