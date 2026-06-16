import { useEffect, useState, useRef, useCallback } from 'react'
import {
  BookOpen, FileText, File, Video, Globe, Plus,
  X, ExternalLink, ArrowLeft, Palette,
  FileType, Image, FileCode, Star, Clock,
  FolderOpen, MoreHorizontal, Pencil, Trash2, FolderPlus, Check,
  GripHorizontal, Minimize2,
} from 'lucide-react'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { EmptyState } from '@shared/components/common/EmptyState'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { SearchInput } from '@shared/components/common/SearchInput'
import { Pagination } from '@shared/components/common/Pagination'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/components/ui/dialog'
import { useVaultStore } from '../store/vault.store'
import type { VaultDocument, KnowledgeColor, VaultCollection, VaultSidebarView } from '../types/vault.types'
import { PDFReader } from './PDFReader'
import { DocxViewer } from './DocxViewer'
import { MarkdownReader } from './MarkdownReader'
import { formatRelativeDate } from '@shared/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFileIcon(doc: VaultDocument): React.ReactElement {
  const mime = doc.mime_type ?? ''
  const name = doc.original_filename.toLowerCase()
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return <FileText className="h-4 w-4 text-red-400" />
  if (mime.includes('wordprocessingml') || name.endsWith('.docx') || name.endsWith('.doc')) return <FileType className="h-4 w-4 text-blue-400" />
  if (mime === 'text/plain' || name.endsWith('.txt')) return <File className="h-4 w-4 text-zinc-400" />
  if (name.endsWith('.md')) return <FileCode className="h-4 w-4 text-zinc-300" />
  if (name.match(/\.(js|ts|jsx|tsx|json|html|css)$/)) return <FileCode className="h-4 w-4 text-amber-400" />
  if (mime.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return <Image className="h-4 w-4 text-green-400" />
  if (mime.startsWith('video/') || name.match(/\.(mp4|mov|avi|mkv)$/)) return <Video className="h-4 w-4 text-purple-400" />
  if (doc.type === 'youtube') return <Video className="h-4 w-4 text-red-500" />
  if (doc.type === 'url' || doc.file_path?.startsWith('http')) return <Globe className="h-4 w-4 text-sky-400" />
  return <File className="h-4 w-4 text-muted-foreground" />
}

function getFileTypeBadge(doc: VaultDocument): string {
  const name = doc.original_filename.toLowerCase()
  if (name.endsWith('.pdf')) return 'PDF'
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'DOCX'
  if (name.endsWith('.txt')) return 'TXT'
  if (name.endsWith('.md')) return 'MD'
  if (name.match(/\.(js|ts|jsx|tsx)$/)) return name.split('.').pop()?.toUpperCase() ?? 'CODE'
  if (name.match(/\.(json|html|css)$/)) return name.split('.').pop()?.toUpperCase() ?? 'CODE'
  if (name.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'Image'
  if (doc.type === 'youtube') return 'YouTube'
  if (doc.type === 'url') return 'URL'
  return doc.type.toUpperCase()
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Context Menu ──────────────────────────────────────────────────────────────

interface ContextMenuState {
  docId: string
  x: number
  y: number
}

function ContextMenu({
  state,
  collections,
  onClose,
  onRename,
  onDelete,
  onMoveToCollection,
}: {
  state: ContextMenuState
  collections: VaultCollection[]
  onClose: () => void
  onRename: (docId: string) => void
  onDelete: (docId: string) => void
  onMoveToCollection: (docId: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc) }
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: state.y, left: state.x, zIndex: 9999 }}
      className="min-w-[160px] rounded-lg border border-border bg-card shadow-lg py-1 text-sm"
    >
      <button
        type="button"
        className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-muted transition-colors"
        onClick={() => { onRename(state.docId); onClose() }}
      >
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />Rename
      </button>
      {collections.length > 0 && (
        <button
          type="button"
          className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-muted transition-colors"
          onClick={() => { onMoveToCollection(state.docId); onClose() }}
        >
          <FolderPlus className="h-3.5 w-3.5 text-muted-foreground" />Add to Collection
        </button>
      )}
      <div className="my-1 border-t border-border" />
      <button
        type="button"
        className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-destructive transition-colors"
        onClick={() => { onDelete(state.docId); onClose() }}
      >
        <Trash2 className="h-3.5 w-3.5" />Delete
      </button>
    </div>
  )
}

// ── Add to Collection Dialog ──────────────────────────────────────────────────

function AddToCollectionDialog({
  docId,
  collections,
  onClose,
}: {
  docId: string
  collections: VaultCollection[]
  onClose: () => void
}) {
  const { addToCollection } = useVaultStore()
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const save = async () => {
    await Promise.all(selected.map(collId => addToCollection(collId, docId)))
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {collections.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <div className="h-4 w-4 rounded border border-border flex items-center justify-center shrink-0" style={{ backgroundColor: selected.includes(c.id) ? c.color_hex : 'transparent', borderColor: c.color_hex }}>
                {selected.includes(c.id) && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm flex-1">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.doc_count}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => void save()} disabled={selected.length === 0}>Add to {selected.length} collection{selected.length !== 1 ? 's' : ''}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── New Collection Dialog ─────────────────────────────────────────────────────

function NewCollectionDialog({ onClose }: { onClose: () => void }) {
  const { createCollection } = useVaultStore()
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6B7280')

  const save = async () => {
    if (!name.trim()) return
    await createCollection({ name: name.trim(), color_hex: color })
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
            />
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void save() }}
              placeholder="Collection name…"
              className="flex-1 h-9 px-3 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => void save()} disabled={!name.trim()}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ view, onViewChange }: { view: VaultSidebarView; onViewChange: (v: VaultSidebarView) => void }) {
  const { documents, favoriteIds, recentIds, collections, fetchCollections, deleteCollection } = useVaultStore()
  const [showNewCollection, setShowNewCollection] = useState(false)

  useEffect(() => { void fetchCollections() }, [fetchCollections])

  const navItem = (v: VaultSidebarView, label: string, icon: React.ReactNode, count?: number) => (
    <button
      key={String(v)}
      type="button"
      onClick={() => onViewChange(v)}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${view === v ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && <span className="text-xs opacity-60">{count}</span>}
    </button>
  )

  return (
    <div className="w-52 shrink-0 flex flex-col gap-1 pr-2 border-r border-border">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-1 pb-0.5">Library</p>
      {navItem('all', 'All Files', <File className="h-3.5 w-3.5" />, documents.length)}
      {navItem('favorites', 'Favorites', <Star className="h-3.5 w-3.5" />, favoriteIds.size)}
      {navItem('recent', 'Recent', <Clock className="h-3.5 w-3.5" />, recentIds.length)}

      <div className="mt-3">
        <div className="flex items-center justify-between px-3 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Collections</p>
          <button type="button" onClick={() => setShowNewCollection(true)} className="text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {collections.map(c => (
          <div key={c.id} className="group flex items-center">
            <button
              type="button"
              onClick={() => onViewChange(`collection:${c.id}`)}
              className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${view === `collection:${c.id}` ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color_hex }} />
              <span className="flex-1 text-left truncate">{c.name}</span>
              <span className="text-xs opacity-60">{c.doc_count}</span>
            </button>
            <button
              type="button"
              onClick={() => void deleteCollection(c.id)}
              className="hidden group-hover:flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-destructive"
              title="Delete collection"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {collections.length === 0 && (
          <button
            type="button"
            onClick={() => setShowNewCollection(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5" />New collection…
          </button>
        )}
      </div>

      {showNewCollection && <NewCollectionDialog onClose={() => setShowNewCollection(false)} />}
    </div>
  )
}

// ── Document Card ─────────────────────────────────────────────────────────────

interface DocCardProps {
  doc: VaultDocument
  isFavorite: boolean
  renamingId: string | null
  onOpen: () => void
  onToggleFavorite: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onRenameConfirm: (newTitle: string) => void
  onRenamingCancel: () => void
}

function DocumentCard({
  doc, isFavorite, renamingId, onOpen, onToggleFavorite,
  onContextMenu, onRenameConfirm, onRenamingCancel,
}: DocCardProps) {
  const [editTitle, setEditTitle] = useState(doc.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const isRenaming = renamingId === doc.id

  useEffect(() => {
    if (isRenaming) {
      setEditTitle(doc.title)
      setTimeout(() => inputRef.current?.select(), 0)
    }
  }, [isRenaming, doc.title])

  return (
    <div className="group relative rounded-xl border border-border bg-card hover:border-zinc-500 transition-all">
      <button type="button" onClick={onOpen} className="w-full text-left p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-muted/80">
            {getFileIcon(doc)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              {isRenaming ? (
                <input
                  ref={inputRef}
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); onRenameConfirm(editTitle) }
                    if (e.key === 'Escape') { e.preventDefault(); onRenamingCancel() }
                  }}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 text-sm font-medium h-6 px-1 rounded border border-ring bg-background focus:outline-none"
                />
              ) : (
                <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">{doc.title}</h3>
              )}
              <Badge variant="outline" className="text-[10px] shrink-0">{getFileTypeBadge(doc)}</Badge>
            </div>
            {doc.description && !isRenaming && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{formatRelativeDate(doc.updated_at)}</span>
              {doc.file_size_bytes && <span>· {formatBytes(doc.file_size_bytes)}</span>}
              {doc.tag_count > 0 && <span>· {doc.tag_count} tag{doc.tag_count !== 1 ? 's' : ''}</span>}
            </div>
          </div>
        </div>
      </button>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleFavorite() }}
          className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${isFavorite ? 'text-amber-400 hover:text-amber-300' : 'text-muted-foreground hover:text-amber-400'}`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className="h-3.5 w-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onContextMenu(e) }}
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {isRenaming && (
        <div className="absolute bottom-2 right-2 flex gap-1">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRenameConfirm(editTitle) }}
            className="h-6 px-2 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90"
          >Save</button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRenamingCancel() }}
            className="h-6 px-2 text-xs rounded bg-muted hover:bg-muted/80"
          >Cancel</button>
        </div>
      )}
    </div>
  )
}

// ── Color System Panel ────────────────────────────────────────────────────────

function ColorSystemPanel({ colors, onClose }: { colors: KnowledgeColor[]; onClose: () => void }) {
  const { createColor, deleteColor } = useVaultStore()
  const [hex, setHex] = useState('#8B5CF6')
  const [name, setName] = useState('')
  const [meaning, setMeaning] = useState('')
  const [adding, setAdding] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Knowledge Color System</h2>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}><X /></Button>
      </div>

      <p className="text-xs text-muted-foreground">Each color carries a meaning for your annotations. Select a color when highlighting to tag knowledge by its importance.</p>

      <div className="space-y-2">
        {colors.map(c => (
          <div key={c.id} className="flex items-center gap-3 rounded-lg p-2.5 border border-border hover:bg-muted/50">
            <span className="h-5 w-5 rounded-full shrink-0 border border-white/10" style={{ backgroundColor: c.color_hex }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.meaning}</p>
              {c.description && <p className="text-xs text-muted-foreground/70 mt-0.5">{c.description}</p>}
            </div>
            {c.is_system === 0 && (
              <Button variant="ghost" size="icon-sm" onClick={() => void deleteColor(c.id)} className="hover:text-destructive">
                <X />
              </Button>
            )}
            {c.is_system === 1 && <Badge variant="secondary" className="text-[10px]">System</Badge>}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input type="color" value={hex} onChange={e => setHex(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Pink)" className="flex-1 text-sm h-8 px-2 rounded border border-border bg-background" />
          </div>
          <input value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="Meaning (e.g. Practice Needed)" className="w-full text-sm h-8 px-2 rounded border border-border bg-background" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => {
              if (name && meaning) { void createColor({ color_hex: hex, name, meaning }).then(() => { setAdding(false); setName(''); setMeaning('') }) }
            }}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="w-full gap-1.5">
          <Plus className="h-3.5 w-3.5" />Add Custom Color
        </Button>
      )}
    </div>
  )
}

// ── Reader components ─────────────────────────────────────────────────────────

function ReaderHeader({ doc, onBack }: { doc: VaultDocument; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card shrink-0">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />Back to Vault
      </Button>
      <div className="flex items-center gap-2 min-w-0">
        {getFileIcon(doc)}
        <h1 className="font-medium text-sm truncate">{doc.title}</h1>
      </div>
      <Badge variant="outline" className="text-xs shrink-0">{getFileTypeBadge(doc)}</Badge>
      {doc.file_path?.startsWith('http') && (
        <a href={doc.file_path} target="_blank" rel="noreferrer" className="ml-auto">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />Open
          </Button>
        </a>
      )}
    </div>
  )
}

function FloatingVideoPlayer({ url, onClose }: { url: string; onClose: () => void }) {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
  const embedUrl = isYouTube
    ? url.replace(/(?:watch\?v=|youtu\.be\/)([^&]+)/, 'www.youtube.com/embed/$1')
    : url

  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; origX: number; origY: number }>({
    dragging: false, startX: 0, startY: 0, origX: 0, origY: 0,
  })
  const [pos, setPos] = useState({ x: window.innerWidth - 660, y: 80 })
  const [size, setSize] = useState({ w: 640, h: 390 })
  const resizing = useRef(false)
  const resizeStart = useRef({ x: 0, y: 0, w: 640, h: 390 })

  // Drag
  const onDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }
    const onMove = (ev: MouseEvent) => {
      if (!dragState.current.dragging) return
      setPos({
        x: Math.max(0, dragState.current.origX + ev.clientX - dragState.current.startX),
        y: Math.max(0, dragState.current.origY + ev.clientY - dragState.current.startY),
      })
    }
    const onUp = () => {
      dragState.current.dragging = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Resize handle
  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizing.current = true
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }
    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return
      setSize({
        w: Math.max(320, resizeStart.current.w + ev.clientX - resizeStart.current.x),
        h: Math.max(200, resizeStart.current.h + ev.clientY - resizeStart.current.y),
      })
    }
    const onUp = () => {
      resizing.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!isYouTube) {
    return (
      <div
        ref={containerRef}
        className="fixed z-50 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl flex flex-col overflow-hidden"
        style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border-b border-zinc-700 cursor-grab active:cursor-grabbing select-none shrink-0"
          onMouseDown={onDragMouseDown}
        >
          <GripHorizontal className="h-3.5 w-3.5 text-zinc-500" />
          <Globe className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs text-zinc-300 flex-1 truncate">External Link</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
          <p className="text-xs text-zinc-400 text-center">External links open in your browser.</p>
          <a href={url} target="_blank" rel="noreferrer">
            <Button size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" />Open in Browser</Button>
          </a>
        </div>
        {/* Resize handle */}
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={onResizeMouseDown}>
          <Minimize2 className="h-3 w-3 text-zinc-600 absolute bottom-0.5 right-0.5 rotate-180" />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl flex flex-col overflow-hidden"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      {/* Title bar / drag handle */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border-b border-zinc-700 cursor-grab active:cursor-grabbing select-none shrink-0"
        onMouseDown={onDragMouseDown}
      >
        <GripHorizontal className="h-3.5 w-3.5 text-zinc-500" />
        <Video className="h-3.5 w-3.5 text-red-500" />
        <span className="text-xs text-zinc-300 flex-1 truncate">YouTube</span>
        <a href={url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-200 transition-colors mr-1" onClick={e => e.stopPropagation()}>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Video */}
      <iframe
        src={embedUrl}
        className="flex-1 w-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title="YouTube video"
      />
      {/* Resize handle bottom-right */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end pb-0.5 pr-0.5"
        onMouseDown={onResizeMouseDown}
      >
        <Minimize2 className="h-3 w-3 text-zinc-500 rotate-180" />
      </div>
    </div>
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DOC_TYPES = [
  { value: '__all__', label: 'All Types' },
  { value: 'pdf', label: 'PDF' },
  { value: 'document', label: 'Documents' },
  { value: 'note', label: 'Notes' },
  { value: 'video', label: 'Videos' },
  { value: 'url', label: 'Links & URLs' },
  { value: 'image', label: 'Images' },
  { value: 'reference', label: 'Reference' },
]

// ── Main Page ─────────────────────────────────────────────────────────────────

export function KnowledgeVaultPage() {
  const {
    documents, total, page, pageSize, totalPages, isLoading, listError,
    filters, collections, favoriteIds, recentIds, activeCollectionDocIds,
    activeDocument, viewMode, colors, renamingId, sidebarView,
    fetch, setSearch, setPage, setFilterField, setSidebarView,
    openDocument, closeDocument, fetchColors, importDocument,
    toggleFavorite, fetchFavorites, fetchRecent,
    renameDocument, setRenamingId,
  } = useVaultStore()

  const [showColorSystem, setShowColorSystem] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [addToCollectionDocId, setAddToCollectionDocId] = useState<string | null>(null)

  useEffect(() => {
    void fetch()
    void fetchColors()
    void fetchFavorites()
    void fetchRecent()
  }, [fetch, fetchColors, fetchFavorites, fetchRecent])

  const handleSidebarChange = useCallback((v: VaultSidebarView) => {
    void setSidebarView(v)
  }, [setSidebarView])

  const handleContextMenu = (docId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const x = Math.min(e.clientX, window.innerWidth - 180)
    const y = Math.min(e.clientY, window.innerHeight - 140)
    setContextMenu({ docId, x, y })
  }

  const handleDelete = async (docId: string) => {
    await (api => api.documents.delete(docId))(
      await import('@shared/lib/ipc-client').then(m => m.api)
    )
    await fetch()
  }

  // Filter documents by sidebar view (client-side)
  const visibleDocs: VaultDocument[] = (() => {
    if (sidebarView === 'favorites') {
      return documents.filter(d => favoriteIds.has(d.id))
    }
    if (sidebarView === 'recent') {
      const byId = new Map(documents.map(d => [d.id, d]))
      return recentIds.map(id => byId.get(id)).filter((d): d is VaultDocument => d !== undefined)
    }
    if (sidebarView.startsWith('collection:')) {
      const idSet = new Set(activeCollectionDocIds)
      return documents.filter(d => idSet.has(d.id))
    }
    return documents
  })()

  const sidebarLabel: string = (() => {
    if (sidebarView === 'favorites') return 'Favorites'
    if (sidebarView === 'recent') return 'Recent'
    if (sidebarView.startsWith('collection:')) {
      const id = sidebarView.slice('collection:'.length)
      return collections.find(c => c.id === id)?.name ?? 'Collection'
    }
    return 'All Files'
  })()

  // Reader view (full-page for PDF, DOCX, and text/MD; floating overlay for web/YouTube)
  if (activeDocument && viewMode !== 'list' && viewMode !== 'web-reader') {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {viewMode !== 'doc-reader' && <ReaderHeader doc={activeDocument} onBack={closeDocument} />}
        {viewMode === 'pdf-reader' && <PDFReader filePath={activeDocument.file_path} documentId={activeDocument.id} />}
        {viewMode === 'doc-reader' && (
          <DocxViewer
            filePath={activeDocument.file_path}
            documentId={activeDocument.id}
            onBack={closeDocument}
          />
        )}
        {viewMode === 'text-reader' && <MarkdownReader />}
      </div>
    )
  }

  const hasFilters = !!filters.search || !!filters.type

  return (
    <PageLayout
      title="Knowledge Vault"
      description="Your personal library — PDFs, documents, videos, links, and notes all in one place."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowColorSystem(s => !s)} className="gap-1.5">
            <Palette className="h-3.5 w-3.5" />Color System
          </Button>
          <Button size="sm" onClick={() => void importDocument()} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />Import File
          </Button>
        </div>
      }
    >
      {showColorSystem && (
        <div className="mb-5">
          <ColorSystemPanel colors={colors} onClose={() => setShowColorSystem(false)} />
        </div>
      )}

      <div className="flex gap-6 min-h-0">
        {/* Sidebar */}
        <Sidebar view={sidebarView} onViewChange={handleSidebarChange} />

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{sidebarLabel}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <SearchInput value={filters.search ?? ''} onChange={setSearch} placeholder="Search vault…" className="w-52" />
              <Select value={filters.type || '__all__'} onValueChange={v => setFilterField('type', v === '__all__' ? undefined : v)}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterField('type', undefined); setSearch('') }} className="h-8 text-xs gap-1">
                  <X className="h-3 w-3" />Clear
                </Button>
              )}
            </div>
          </div>

          {isLoading ? <PageLoader /> : listError ? (
            <div className="text-center py-20">
              <p className="text-sm text-muted-foreground">{listError}</p>
              <Button variant="outline" size="sm" onClick={() => void fetch()} className="mt-3">Retry</Button>
            </div>
          ) : visibleDocs.length === 0 ? (
            <EmptyState
              icon={sidebarView === 'favorites' ? Star : sidebarView === 'recent' ? Clock : BookOpen}
              title={
                sidebarView === 'favorites' ? 'No favorites yet' :
                sidebarView === 'recent' ? 'No recent files' :
                sidebarView.startsWith('collection:') ? 'Collection is empty' :
                hasFilters ? 'No documents match' : 'Your Knowledge Vault is empty'
              }
              description={
                sidebarView === 'favorites' ? 'Star documents to save them here.' :
                sidebarView === 'recent' ? 'Open documents to see them here.' :
                sidebarView.startsWith('collection:') ? 'Use the ••• menu on a document to add it to this collection.' :
                hasFilters ? 'Try adjusting your filters.' : 'Import PDFs, documents, videos, and links to build your knowledge library.'
              }
            />
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">{visibleDocs.length} item{visibleDocs.length !== 1 ? 's' : ''}</p>
              <Tabs defaultValue="grid">
                <TabsList>
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
                <TabsContent value="grid" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleDocs.map(doc => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        isFavorite={favoriteIds.has(doc.id)}
                        renamingId={renamingId}
                        onOpen={() => void openDocument(doc)}
                        onToggleFavorite={() => void toggleFavorite(doc.id)}
                        onContextMenu={(e) => handleContextMenu(doc.id, e)}
                        onRenameConfirm={(title) => void renameDocument(doc.id, title)}
                        onRenamingCancel={() => setRenamingId(null)}
                      />
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="list" className="mt-4">
                  <div className="space-y-1.5">
                    {visibleDocs.map(doc => (
                      <div key={doc.id} className="group flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-card hover:border-zinc-500 transition-colors">
                        <button type="button" onClick={() => void openDocument(doc)} className="flex-1 flex items-center gap-3 min-w-0 text-left">
                          {getFileIcon(doc)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{doc.title}</p>
                            {doc.description && <p className="text-xs text-muted-foreground truncate">{doc.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-[10px]">{getFileTypeBadge(doc)}</Badge>
                            <span className="text-xs text-muted-foreground">{formatRelativeDate(doc.updated_at)}</span>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => void toggleFavorite(doc.id)}
                            className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${favoriteIds.has(doc.id) ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'}`}
                          >
                            <Star className="h-3.5 w-3.5" fill={favoriteIds.has(doc.id) ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleContextMenu(doc.id, e)}
                            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              {sidebarView === 'all' && (
                <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          state={contextMenu}
          collections={collections}
          onClose={() => setContextMenu(null)}
          onRename={(docId) => setRenamingId(docId)}
          onDelete={(docId) => void handleDelete(docId)}
          onMoveToCollection={(docId) => setAddToCollectionDocId(docId)}
        />
      )}

      {/* Add to collection dialog */}
      {addToCollectionDocId && (
        <AddToCollectionDialog
          docId={addToCollectionDocId}
          collections={collections}
          onClose={() => setAddToCollectionDocId(null)}
        />
      )}

      {/* Floating video player overlay for YouTube / web URLs */}
      {activeDocument && viewMode === 'web-reader' && (
        <FloatingVideoPlayer url={activeDocument.file_path} onClose={closeDocument} />
      )}
    </PageLayout>
  )
}
