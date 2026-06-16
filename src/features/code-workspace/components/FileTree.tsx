import { useState } from 'react'
import {
  ChevronRight, ChevronDown, Folder, FolderOpen,
  FileCode, Plus, Trash2, Pencil, FolderPlus,
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/button'
import type { CodeFile, CodeFolder } from '../types/code-workspace.types'
import { LANGUAGE_COLORS, LANGUAGE_ICONS } from '../types/code-workspace.types'

// ── Tree node builder ─────────────────────────────────────────────────────────

interface FolderNode {
  folder: CodeFolder
  children: FolderNode[]
  files: CodeFile[]
}

function buildTree(folders: CodeFolder[], files: CodeFile[]): { roots: FolderNode[]; rootFiles: CodeFile[] } {
  const byParent = new Map<string | null, CodeFolder[]>()
  for (const f of folders) {
    const key = f.parent_id
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(f)
  }

  const filesByFolder = new Map<string | null, CodeFile[]>()
  for (const f of files) {
    const key = f.folder_id
    if (!filesByFolder.has(key)) filesByFolder.set(key, [])
    filesByFolder.get(key)!.push(f)
  }

  function buildNode(folder: CodeFolder): FolderNode {
    return {
      folder,
      children: (byParent.get(folder.id) ?? []).map(buildNode),
      files: filesByFolder.get(folder.id) ?? [],
    }
  }

  return {
    roots: (byParent.get(null) ?? []).map(buildNode),
    rootFiles: filesByFolder.get(null) ?? [],
  }
}

// ── File item ─────────────────────────────────────────────────────────────────

interface FileItemProps {
  file: CodeFile
  isActive: boolean
  isDirty: boolean
  depth: number
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}

function FileItem({ file, isActive, isDirty, depth, onOpen, onRename, onDelete }: FileItemProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      className={cn(
        'group flex items-center gap-1.5 py-1 pr-2 cursor-pointer rounded text-xs',
        isActive
          ? 'bg-blue-500/20 text-blue-300'
          : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200',
      )}
    >
      <span className={cn('font-mono text-[9px] font-bold shrink-0 w-6 text-center', LANGUAGE_COLORS[file.language])}>
        {LANGUAGE_ICONS[file.language]}
      </span>
      <span className="flex-1 truncate">{file.title}</span>
      {isDirty && <span className="text-amber-400 shrink-0">●</span>}
      {hovered && (
        <span className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()} role="group">
          <button
            type="button"
            onClick={onRename}
            className="p-0.5 rounded hover:bg-zinc-600 text-zinc-500 hover:text-zinc-300"
            title="Rename"
          >
            <Pencil className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-0.5 rounded hover:bg-red-900/40 text-zinc-500 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </span>
      )}
    </div>
  )
}

// ── Folder item ───────────────────────────────────────────────────────────────

interface FolderItemProps {
  node: FolderNode
  depth: number
  expanded: boolean
  activeTabId: string | null
  dirtyTabs: Record<string, boolean>
  onToggle: () => void
  onFileOpen: (id: string) => void
  onFileRename: (file: CodeFile) => void
  onFileDelete: (id: string) => void
  onFolderRename: (folder: CodeFolder) => void
  onFolderDelete: (id: string) => void
  expandedFolders: Record<string, boolean>
  onToggleFolder: (id: string) => void
}

function FolderItem({
  node, depth, expanded, activeTabId, dirtyTabs,
  onToggle, onFileOpen, onFileRename, onFileDelete,
  onFolderRename, onFolderDelete, expandedFolders, onToggleFolder,
}: FolderItemProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className="group flex items-center gap-1.5 py-1 pr-2 cursor-pointer rounded text-xs text-zinc-300 hover:bg-zinc-700/50"
      >
        {expanded
          ? <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
          : <ChevronRight className="h-3 w-3 text-zinc-500 shrink-0" />
        }
        {expanded
          ? <FolderOpen className="h-3.5 w-3.5 text-amber-400/80 shrink-0" />
          : <Folder className="h-3.5 w-3.5 text-amber-400/80 shrink-0" />
        }
        <span className="flex-1 truncate font-medium">{node.folder.name}</span>
        {hovered && (
          <span className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()} role="group">
            <button
              type="button"
              onClick={() => onFolderRename(node.folder)}
              className="p-0.5 rounded hover:bg-zinc-600 text-zinc-500 hover:text-zinc-300"
              title="Rename folder"
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
            <button
              type="button"
              onClick={() => onFolderDelete(node.folder.id)}
              className="p-0.5 rounded hover:bg-red-900/40 text-zinc-500 hover:text-red-400"
              title="Delete folder"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </span>
        )}
      </div>

      {expanded && (
        <>
          {node.children.map(child => (
            <FolderItem
              key={child.folder.id}
              node={child}
              depth={depth + 1}
              expanded={!!expandedFolders[child.folder.id]}
              activeTabId={activeTabId}
              dirtyTabs={dirtyTabs}
              onToggle={() => onToggleFolder(child.folder.id)}
              onFileOpen={onFileOpen}
              onFileRename={onFileRename}
              onFileDelete={onFileDelete}
              onFolderRename={onFolderRename}
              onFolderDelete={onFolderDelete}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
          {node.files.map(file => (
            <FileItem
              key={file.id}
              file={file}
              isActive={file.id === activeTabId}
              isDirty={!!dirtyTabs[file.id]}
              depth={depth + 1}
              onOpen={() => onFileOpen(file.id)}
              onRename={() => onFileRename(file)}
              onDelete={() => onFileDelete(file.id)}
            />
          ))}
          {node.children.length === 0 && node.files.length === 0 && (
            <div style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }} className="py-1 text-xs text-zinc-600 italic">
              Empty
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── FileTree ──────────────────────────────────────────────────────────────────

export interface FileTreeProps {
  files: CodeFile[]
  folders: CodeFolder[]
  activeTabId: string | null
  dirtyTabs: Record<string, boolean>
  expandedFolders: Record<string, boolean>
  onFileOpen: (id: string) => void
  onFileRename: (file: CodeFile) => void
  onFileDelete: (id: string) => void
  onFolderRename: (folder: CodeFolder) => void
  onFolderDelete: (id: string) => void
  onToggleFolder: (id: string) => void
  onNewFile: (folderId?: string | null) => void
  onNewFolder: (parentId?: string | null) => void
}

export function FileTree({
  files, folders, activeTabId, dirtyTabs, expandedFolders,
  onFileOpen, onFileRename, onFileDelete, onFolderRename, onFolderDelete,
  onToggleFolder, onNewFile, onNewFolder,
}: FileTreeProps) {
  const { roots, rootFiles } = buildTree(folders, files)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Explorer</span>
        <div className="flex items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={() => onNewFile(null)}
            title="New File"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={() => onNewFolder(null)}
            title="New Folder"
          >
            <FolderPlus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 select-none">
        {roots.length === 0 && rootFiles.length === 0 ? (
          <div className="px-4 py-6 text-xs text-zinc-600 text-center">
            <FileCode className="h-6 w-6 mx-auto mb-2 opacity-40" />
            <p>No files yet.</p>
            <button
              type="button"
              onClick={() => onNewFile(null)}
              className="mt-1 text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              Create a file
            </button>
          </div>
        ) : (
          <>
            {roots.map(node => (
              <FolderItem
                key={node.folder.id}
                node={node}
                depth={0}
                expanded={!!expandedFolders[node.folder.id]}
                activeTabId={activeTabId}
                dirtyTabs={dirtyTabs}
                onToggle={() => onToggleFolder(node.folder.id)}
                onFileOpen={onFileOpen}
                onFileRename={onFileRename}
                onFileDelete={onFileDelete}
                onFolderRename={onFolderRename}
                onFolderDelete={onFolderDelete}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
              />
            ))}
            {rootFiles.map(file => (
              <FileItem
                key={file.id}
                file={file}
                isActive={file.id === activeTabId}
                isDirty={!!dirtyTabs[file.id]}
                depth={0}
                onOpen={() => onFileOpen(file.id)}
                onRename={() => onFileRename(file)}
                onDelete={() => onFileDelete(file.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
