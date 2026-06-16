/**
 * Markdown Workspace — full-featured markdown editor with:
 *   - Textarea editor (fast, no heavy deps)
 *   - Live split-pane or toggle preview
 *   - Autosave (1 s debounce after last keystroke)
 *   - Syntax highlighting in preview (rehype-highlight + highlight.js)
 *   - GFM tables, task lists, strikethrough
 *   - Mermaid diagrams
 *   - Frontmatter display
 *   - Version history with manual snapshots + restore
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Plus, Trash2, FileText, History, Eye, Edit3, Columns,
  Save, Check, Clock, AlignLeft,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { cn } from '@shared/lib/utils'
import { useMarkdownStore } from '../store/markdown.store'
import { MarkdownPreview } from './MarkdownPreview'
import { VersionHistoryPanel } from './VersionHistoryPanel'
import type { EditorView } from '../types/markdown.types'

// ── Constants ─────────────────────────────────────────────────────────────────

const AUTOSAVE_DELAY = 1000 // ms after last keystroke
const AUTOSAVE_INTERVAL = 30_000 // periodic save while editing

// ── Editor ────────────────────────────────────────────────────────────────────

interface EditorAreaProps {
  content: string
  onChange: (val: string) => void
  onTab: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

function EditorArea({ content, onChange, onTab }: EditorAreaProps) {
  return (
    <textarea
      className={cn(
        'flex-1 w-full h-full resize-none bg-zinc-950 text-zinc-200 font-mono text-sm leading-relaxed',
        'px-6 py-4 focus:outline-none selection:bg-blue-500/30',
        'placeholder:text-zinc-700',
      )}
      value={content}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onTab}
      placeholder="Start writing markdown…"
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
    />
  )
}

// ── Document list item ────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MarkdownWorkspacePage() {
  const {
    documents, activeDocumentId, activeDocument,
    loading, isDirty, isSaving, editorView,
    fetchDocuments, selectDocument, createDocument, saveDocument, deleteDocument,
    setEditorView, setDirty,
  } = useMarkdownStore()

  // Local editor state (not committed to store on every keystroke)
  const [localTitle, setLocalTitle] = useState('')
  const [localContent, setLocalContent] = useState('')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const periodicTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const snapshotCountRef = useRef(0)

  // Sync local state when active document changes
  useEffect(() => {
    if (activeDocument) {
      setLocalTitle(activeDocument.title)
      setLocalContent(activeDocument.content)
    }
  }, [activeDocument])

  // Boot: load all documents, auto-select first
  useEffect(() => {
    void (async () => {
      await fetchDocuments()
      const docs = useMarkdownStore.getState().documents
      if (docs.length > 0 && !useMarkdownStore.getState().activeDocumentId) {
        await selectDocument(docs[0]!.id)
      }
    })()
  }, [fetchDocuments, selectDocument])

  // Save function — used by all autosave triggers
  const doSave = useCallback(
    async (title: string, content: string, snapshotOverride?: boolean) => {
      const id = activeDocumentId
      if (!id) return

      // Auto-snapshot every 10 saves
      snapshotCountRef.current++
      const shouldSnapshot = snapshotOverride ?? (snapshotCountRef.current % 10 === 0)
      const label = shouldSnapshot
        ? `Auto v${Math.floor(snapshotCountRef.current / 10)}`
        : undefined

      await saveDocument(id, title, content, shouldSnapshot, label)
      setLastSavedAt(new Date())
    },
    [activeDocumentId, saveDocument],
  )

  // Debounced autosave on content change
  useEffect(() => {
    if (!isDirty) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      void doSave(localTitle, localContent)
    }, AUTOSAVE_DELAY)
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [localContent, localTitle, isDirty, doSave])

  // Periodic save every 30s while editing
  useEffect(() => {
    if (!activeDocumentId) return
    periodicTimer.current = setInterval(() => {
      if (isDirty) void doSave(localTitle, localContent)
    }, AUTOSAVE_INTERVAL)
    return () => { if (periodicTimer.current) clearInterval(periodicTimer.current) }
  }, [activeDocumentId, isDirty, localTitle, localContent, doSave])

  // Save on unmount
  useEffect(() => {
    return () => {
      if (isDirty && activeDocumentId) {
        void saveDocument(activeDocumentId, localTitle, localContent)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleContentChange = (val: string) => {
    setLocalContent(val)
    setDirty(true)
  }

  const handleTitleChange = (val: string) => {
    setLocalTitle(val)
    setDirty(true)
  }

  // Tab key inserts 2 spaces in the editor
  const handleTab = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const ta = e.currentTarget
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newVal = localContent.slice(0, start) + '  ' + localContent.slice(end)
    setLocalContent(newVal)
    setDirty(true)
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + 2
    })
  }, [localContent, setDirty])

  const handleManualSave = () => {
    void doSave(localTitle, localContent, true)
  }

  const handleNewDocument = async () => {
    await createDocument()
  }

  const handleDelete = async () => {
    if (!activeDocumentId) return
    if (!confirm('Delete this document?')) return
    await deleteDocument(activeDocumentId)
  }

  const viewOptions: { value: EditorView; icon: React.ElementType; label: string }[] = [
    { value: 'edit', icon: Edit3, label: 'Edit' },
    { value: 'split', icon: Columns, label: 'Split' },
    { value: 'preview', icon: Eye, label: 'Preview' },
  ]

  const wordCount = localContent.trim() === ''
    ? 0
    : localContent.trim().split(/\s+/).length

  return (
    <div className="flex h-full overflow-hidden bg-zinc-950 text-zinc-200">
      {/* ── Document sidebar ─────────────────────────────────────────────── */}
      <div className="w-56 shrink-0 border-r border-zinc-800 flex flex-col bg-zinc-900/40">
        <div className="px-3 py-3 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Documents</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => void handleNewDocument()}
            title="New document"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="px-3 py-4 text-xs text-zinc-600">Loading…</div>
          )}
          {!loading && documents.length === 0 && (
            <div className="px-3 py-4 text-xs text-zinc-600">No documents yet.</div>
          )}
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => { if (doc.id !== activeDocumentId) void selectDocument(doc.id) }}
              className={cn(
                'w-full text-left px-3 py-2.5 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors',
                doc.id === activeDocumentId && 'bg-zinc-800/70 border-l-2 border-l-blue-500',
              )}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span className="text-xs text-zinc-300 truncate">{doc.title}</span>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5 pl-5">{formatDate(doc.updated_at)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Editor area ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeDocument ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
              {/* Title */}
              <input
                type="text"
                value={localTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-zinc-200 focus:outline-none placeholder:text-zinc-600"
                placeholder="Untitled"
              />

              {/* Status */}
              <div className="flex items-center gap-1 text-xs text-zinc-600 shrink-0">
                {isSaving && <span className="text-blue-400">Saving…</span>}
                {!isSaving && isDirty && <span className="text-amber-500">Unsaved</span>}
                {!isSaving && !isDirty && lastSavedAt && (
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500" />
                    Saved
                  </span>
                )}
              </div>

              {/* Word count */}
              <span className="text-xs text-zinc-600 shrink-0">
                <AlignLeft className="inline h-3 w-3 mr-1" />
                {wordCount.toLocaleString()} words
              </span>

              {/* Divider */}
              <div className="h-4 w-px bg-zinc-700 shrink-0" />

              {/* View toggle */}
              <div className="flex rounded border border-zinc-700 overflow-hidden shrink-0">
                {viewOptions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setEditorView(value)}
                    title={label}
                    className={cn(
                      'px-2 py-1 text-xs flex items-center gap-1 transition-colors',
                      editorView === value
                        ? 'bg-zinc-700 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Version history */}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setShowVersionHistory((v) => !v)}
                title="Version history"
              >
                <History className="h-3.5 w-3.5 mr-1" />
                History
              </Button>

              {/* Manual save / snapshot */}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={handleManualSave}
                disabled={isSaving}
                title="Save snapshot (Ctrl+S)"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>

              {/* Delete */}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-900/20"
                onClick={() => void handleDelete()}
                title="Delete document"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Editor + Preview panes */}
            <div className="flex-1 flex overflow-hidden">
              {/* Editor pane */}
              {(editorView === 'edit' || editorView === 'split') && (
                <div className={cn(
                  'flex flex-col',
                  editorView === 'split' ? 'w-1/2 border-r border-zinc-800' : 'w-full',
                )}>
                  <EditorArea
                    content={localContent}
                    onChange={handleContentChange}
                    onTab={handleTab}
                  />
                </div>
              )}

              {/* Preview pane */}
              {(editorView === 'preview' || editorView === 'split') && (
                <div className={cn(
                  'flex-1 overflow-hidden',
                )}>
                  <MarkdownPreview content={localContent} />
                </div>
              )}

              {/* Version history panel */}
              {showVersionHistory && (
                <VersionHistoryPanel
                  documentId={activeDocument.id}
                  onClose={() => setShowVersionHistory(false)}
                />
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-600">
            <Clock className="h-10 w-10 opacity-30" />
            <p className="text-sm">No document selected</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleNewDocument()}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
