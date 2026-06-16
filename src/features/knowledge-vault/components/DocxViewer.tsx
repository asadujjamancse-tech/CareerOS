/**
 * DocxViewer — Production DOCX viewer for CareerOS Knowledge Vault.
 *
 * Engine: mammoth.js 1.12 (DOCX → HTML, server-side via IPC)
 *
 * Features:
 *  - Preserved formatting: headings, bold, italic, lists, tables, blockquotes, code
 *  - Paragraph indexing for comment anchoring (data-para-idx attributes)
 *  - Fast rendering: CSS content-visibility:auto for large documents
 *  - Text search: highlight all matches, navigate with prev/next
 *  - Read mode: comfortable reading width, serif option
 *  - Print mode: A4 layout, window.print()
 *  - Comments: anchor to paragraph, show inline numbered badges, panel on right
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Search, X, ChevronUp, ChevronDown, Printer, BookOpen,
  MessageSquare, Check, Trash2, Plus, AlertCircle, ChevronLeft,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { api } from '@shared/lib/ipc-client'
import { cn } from '@shared/lib/utils'
import { PageLoader } from '@shared/components/common/LoadingSpinner'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DocumentComment {
  id: string
  document_id: string
  paragraph_index: number
  char_offset_start: number
  char_offset_end: number
  selected_text: string | null
  content: string
  color_hex: string
  resolved: 0 | 1
  created_at: string
  updated_at: string
}

interface PendingComment {
  paragraph_index: number
  char_offset_start: number
  char_offset_end: number
  selected_text: string
}

type ViewMode = 'read' | 'print'

// ── Search helpers ────────────────────────────────────────────────────────────

/**
 * Walk all text nodes in `root`, wrap each occurrence of `query` (case-insensitive)
 * with a <mark data-match-idx="N"> element. Returns match count.
 *
 * Works in place on the live DOM — safe to call with the rendered content div.
 */
function applySearchHighlights(root: HTMLElement, query: string): number {
  // Strip previous marks first
  const prev = root.querySelectorAll('mark[data-match]')
  prev.forEach((m) => {
    const parent = m.parentNode
    if (!parent) return
    parent.replaceChild(document.createTextNode(m.textContent ?? ''), m)
    parent.normalize()
  })

  if (!query.trim()) return 0

  const lower = query.toLowerCase()
  let count = 0
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)

  // Collect nodes first (mutating the DOM while walking is unsafe)
  const textNodes: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) textNodes.push(node as Text)

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? ''
    const textLower = text.toLowerCase()

    if (!textLower.includes(lower)) continue

    // Split and rebuild with <mark> wrappers
    const frag = document.createDocumentFragment()
    let cursor = 0
    let pos = textLower.indexOf(lower, cursor)
    while (pos !== -1) {
      if (pos > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, pos)))
      const mark = document.createElement('mark')
      mark.setAttribute('data-match', String(count))
      mark.className = 'bg-yellow-300/70 text-black rounded-sm'
      mark.textContent = text.slice(pos, pos + lower.length)
      frag.appendChild(mark)
      count++
      cursor = pos + lower.length
      pos = textLower.indexOf(lower, cursor)
    }
    if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)))

    textNode.parentNode?.replaceChild(frag, textNode)
  }

  return count
}

function scrollToMatch(root: HTMLElement, idx: number) {
  const mark = root.querySelector<HTMLElement>(`mark[data-match="${idx}"]`)
  mark?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  // Pulse animation
  mark?.classList.add('ring-2', 'ring-orange-400')
  setTimeout(() => mark?.classList.remove('ring-2', 'ring-orange-400'), 1200)
}

// ── Comment badge helpers ─────────────────────────────────────────────────────

function injectCommentBadges(root: HTMLElement, comments: DocumentComment[]) {
  // Remove previous badges
  root.querySelectorAll('.docx-comment-badge').forEach((b) => b.remove())

  const open = comments.filter((c) => !c.resolved)
  if (!open.length) return

  // Group by paragraph index
  const byPara = new Map<number, DocumentComment[]>()
  for (const c of open) {
    const arr = byPara.get(c.paragraph_index) ?? []
    arr.push(c)
    byPara.set(c.paragraph_index, arr)
  }

  byPara.forEach((paraComments, paraIdx) => {
    const section = root.querySelector<HTMLElement>(`section[data-para-idx="${paraIdx}"]`)
    if (!section) return

    const badge = document.createElement('span')
    badge.className =
      'docx-comment-badge inline-flex items-center justify-center ' +
      'w-5 h-5 rounded-full bg-amber-400 text-black text-xs font-bold ' +
      'cursor-pointer ml-1 align-middle select-none hover:bg-amber-300'
    badge.textContent = String(paraComments.length)
    badge.title = `${paraComments.length} comment${paraComments.length > 1 ? 's' : ''} on this paragraph`
    badge.setAttribute('data-para-idx', String(paraIdx))
    section.appendChild(badge)
  })
}

// ── Print styles ──────────────────────────────────────────────────────────────

const PRINT_STYLE_ID = 'docx-print-styles'

function injectPrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = PRINT_STYLE_ID
  style.textContent = `
    @media print {
      body > * { display: none !important; }
      #docx-print-root { display: block !important; }
      #docx-print-root { position: fixed; inset: 0; overflow: auto; background: white; color: black; }
      .docx-comment-badge { display: none !important; }
      mark[data-match] { background: transparent !important; }
    }
  `
  document.head.appendChild(style)
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface DocxViewerProps {
  filePath: string
  documentId: string
  onBack: () => void
}

const COMMENT_COLORS = [
  { hex: '#FBBF24', name: 'Yellow' },
  { hex: '#F87171', name: 'Red' },
  { hex: '#34D399', name: 'Green' },
  { hex: '#60A5FA', name: 'Blue' },
  { hex: '#C084FC', name: 'Purple' },
]

export function DocxViewer({ filePath, documentId, onBack }: DocxViewerProps) {
  // ── Content ────────────────────────────────────────────────────────────────
  const [html, setHtml] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  // ── View ───────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('read')
  const [showComments, setShowComments] = useState(true)

  // ── Search ─────────────────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [matchIndex, setMatchIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── Comments ───────────────────────────────────────────────────────────────
  const [comments, setComments] = useState<DocumentComment[]>([])
  const [pending, setPending] = useState<PendingComment | null>(null)
  const [newCommentText, setNewCommentText] = useState('')
  const [newCommentColor, setNewCommentColor] = useState('#FBBF24')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const contentRef = useRef<HTMLDivElement>(null)

  // ── Load DOCX ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)

    void (async () => {
      try {
        const res = await api.docxViewer.convert(filePath)
        if (cancelled) return
        if (!res.success) { setLoadError(res.error); setIsLoading(false); return }
        const data = res.data as { html: string; warnings: string[] }
        setHtml(data.html)
        setWarnings(data.warnings)
        setIsLoading(false)
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load document')
          setIsLoading(false)
        }
      }
    })()

    return () => { cancelled = true }
  }, [filePath])

  // ── Load comments ──────────────────────────────────────────────────────────

  useEffect(() => {
    void (async () => {
      const res = await api.docxViewer.comments.get(documentId)
      if (res.success) setComments(res.data as DocumentComment[])
    })()
  }, [documentId])

  // ── Inject badges when comments or html change ─────────────────────────────

  useEffect(() => {
    if (!contentRef.current || !html) return
    injectCommentBadges(contentRef.current, comments)
  }, [comments, html])

  // ── Search ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!contentRef.current) return
    const count = applySearchHighlights(contentRef.current, searchQuery)
    setMatchCount(count)
    setMatchIndex(0)
    if (count > 0) scrollToMatch(contentRef.current, 0)
  }, [searchQuery, html]) // re-run when html changes (content freshly mounted)

  const handleSearchNav = useCallback((dir: 1 | -1) => {
    if (!contentRef.current || matchCount === 0) return
    const next = (matchIndex + dir + matchCount) % matchCount
    setMatchIndex(next)
    scrollToMatch(contentRef.current, next)
  }, [matchIndex, matchCount])

  const openSearch = () => {
    setShowSearch(true)
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  const closeSearch = () => {
    setShowSearch(false)
    setSearchQuery('')
    setMatchCount(0)
    if (contentRef.current) applySearchHighlights(contentRef.current, '')
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); openSearch() }
      if (e.key === 'Escape' && showSearch) closeSearch()
      if (e.key === 'Enter' && showSearch && matchCount > 0) {
        e.preventDefault()
        handleSearchNav(e.shiftKey ? -1 : 1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showSearch, matchCount, handleSearchNav])

  // ── Text selection → pending comment ──────────────────────────────────────

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !contentRef.current) return

    const selectedText = selection.toString().trim()
    if (selectedText.length < 2) return

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer

    // Find the nearest section[data-para-idx]
    let el: Element | null =
      container.nodeType === Node.ELEMENT_NODE
        ? (container as Element)
        : container.parentElement

    while (el && el !== contentRef.current) {
      if (el.tagName === 'SECTION' && el.hasAttribute('data-para-idx')) break
      el = el.parentElement
    }

    const paraIdx = el ? parseInt(el.getAttribute('data-para-idx') ?? '0', 10) : 0

    // Char offsets within the section
    const preRange = range.cloneRange()
    if (el) preRange.selectNodeContents(el)
    preRange.setEnd(range.startContainer, range.startOffset)
    const startOffset = preRange.toString().length
    const endOffset = startOffset + selectedText.length

    setPending({ paragraph_index: paraIdx, char_offset_start: startOffset, char_offset_end: endOffset, selected_text: selectedText })
    setNewCommentText('')
  }, [])

  const handleCreateComment = async () => {
    if (!pending || !newCommentText.trim()) return

    const res = await api.docxViewer.comments.create({
      document_id: documentId,
      paragraph_index: pending.paragraph_index,
      char_offset_start: pending.char_offset_start,
      char_offset_end: pending.char_offset_end,
      selected_text: pending.selected_text,
      content: newCommentText.trim(),
      color_hex: newCommentColor,
    })
    if (res.success) {
      setComments((prev) => [...prev, res.data as DocumentComment])
      setPending(null)
      setNewCommentText('')
      window.getSelection()?.removeAllRanges()
    }
  }

  const handleDeleteComment = async (id: string) => {
    await api.docxViewer.comments.delete(id)
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  const handleResolveComment = async (id: string) => {
    const res = await api.docxViewer.comments.resolve(id)
    if (res.success) {
      setComments((prev) => prev.map((c) => (c.id === id ? (res.data as DocumentComment) : c)))
    }
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return
    const res = await api.docxViewer.comments.update(editingId, { content: editText.trim() })
    if (res.success) {
      setComments((prev) => prev.map((c) => (c.id === editingId ? (res.data as DocumentComment) : c)))
      setEditingId(null)
    }
  }

  const handlePrint = () => {
    injectPrintStyles()
    if (contentRef.current) {
      contentRef.current.id = 'docx-print-root'
    }
    window.print()
    if (contentRef.current) {
      contentRef.current.removeAttribute('id')
    }
  }

  const openComments = comments.filter((c) => !c.resolved)
  const resolvedComments = comments.filter((c) => c.resolved === 1)

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) return <PageLoader />

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-medium text-red-400">Failed to load document</p>
        <p className="text-xs text-zinc-600 max-w-sm text-center">{loadError}</p>
        <Button variant="secondary" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white text-zinc-900 overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 bg-zinc-50 shrink-0 flex-wrap">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={onBack}>
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </Button>

        <div className="h-4 w-px bg-zinc-300" />

        {/* Search */}
        {showSearch ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="h-7 rounded border border-zinc-300 bg-white px-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
            />
            <span className="text-xs text-zinc-500 shrink-0">
              {matchCount > 0 ? `${matchIndex + 1} / ${matchCount}` : 'No matches'}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSearchNav(-1)} disabled={matchCount === 0}>
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSearchNav(1)} disabled={matchCount === 0}>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeSearch}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={openSearch} title="Search (Ctrl+F)">
            <Search className="h-3.5 w-3.5" />
            Search
          </Button>
        )}

        <div className="h-4 w-px bg-zinc-300" />

        {/* View mode */}
        <div className="flex rounded border border-zinc-300 overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode('read')}
            className={cn('px-2.5 py-1 text-xs flex items-center gap-1.5 transition-colors', viewMode === 'read' ? 'bg-zinc-200 text-zinc-800 font-medium' : 'text-zinc-500 hover:bg-zinc-100')}
          >
            <BookOpen className="h-3 w-3" />
            Read
          </button>
          <button
            onClick={() => setViewMode('print')}
            className={cn('px-2.5 py-1 text-xs flex items-center gap-1.5 transition-colors', viewMode === 'print' ? 'bg-zinc-200 text-zinc-800 font-medium' : 'text-zinc-500 hover:bg-zinc-100')}
          >
            <Printer className="h-3 w-3" />
            Print
          </button>
        </div>

        {viewMode === 'print' && (
          <Button size="sm" className="h-7 px-2 text-xs gap-1" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        )}

        <div className="flex-1" />

        {/* Comments toggle */}
        <Button
          variant={showComments ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-2 text-xs gap-1 relative"
          onClick={() => setShowComments((v) => !v)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Comments
          {openComments.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-400 text-black text-xs font-bold px-1.5 py-0 leading-5">
              {openComments.length}
            </span>
          )}
        </Button>

        {warnings.length > 0 && (
          <span title={warnings.join('\n')} className="text-xs text-amber-500 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {warnings.length} warning{warnings.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Main content area ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document content */}
        <div
          className={cn('flex-1 overflow-y-auto', viewMode === 'print' ? 'bg-zinc-100' : 'bg-white')}
          onMouseUp={handleTextSelection}
        >
          <div
            className={cn(
              'mx-auto px-12 py-10',
              viewMode === 'read' && 'max-w-3xl',
              viewMode === 'print' && 'max-w-[210mm] bg-white shadow-lg my-8 px-16 py-20 min-h-[297mm]',
            )}
          >
            {/* Pending comment tooltip */}
            {pending && (
              <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 shadow-sm">
                <p className="text-xs font-medium text-amber-800 mb-1.5">
                  Add comment on: <em>&quot;{pending.selected_text.slice(0, 60)}{pending.selected_text.length > 60 ? '…' : ''}&quot;</em>
                </p>
                <div className="flex gap-1.5 mb-2">
                  {COMMENT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      title={c.name}
                      onClick={() => setNewCommentColor(c.hex)}
                      className={cn('w-5 h-5 rounded-full border-2 transition-transform hover:scale-110', newCommentColor === c.hex ? 'border-zinc-800 scale-110' : 'border-transparent')}
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleCreateComment() } }}
                  placeholder="Write a comment…"
                  rows={2}
                  autoFocus
                  className="w-full text-xs rounded border border-zinc-300 bg-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2 mt-1.5 justify-end">
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { setPending(null); window.getSelection()?.removeAllRanges() }}>Cancel</Button>
                  <Button size="sm" className="h-6 px-2 text-xs" onClick={() => void handleCreateComment()} disabled={!newCommentText.trim()}>
                    <Plus className="h-3 w-3 mr-1" />Save
                  </Button>
                </div>
              </div>
            )}

            {/* Document HTML */}
            <div
              ref={contentRef}
              className="docx-content"
              dangerouslySetInnerHTML={{ __html: html ?? '' }}
            />
          </div>
        </div>

        {/* Comments panel */}
        {showComments && (
          <div className="w-72 shrink-0 border-l border-zinc-200 bg-zinc-50 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Comments ({openComments.length})
              </span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowComments(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {openComments.length === 0 && !pending && (
                <div className="px-4 py-8 text-center text-xs text-zinc-500">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  Select text to add a comment
                </div>
              )}

              {openComments.map((c, i) => (
                <div key={c.id} className="px-3 py-3 border-b border-zinc-200 group">
                  <div className="flex items-start gap-2">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5"
                      style={{ background: c.color_hex }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {c.selected_text && (
                        <p className="text-xs italic text-zinc-500 mb-1 line-clamp-2">
                          &quot;{c.selected_text}&quot;
                        </p>
                      )}
                      {editingId === c.id ? (
                        <div>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            autoFocus
                            className="w-full text-xs rounded border border-zinc-300 bg-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          />
                          <div className="flex gap-1.5 mt-1">
                            <Button size="sm" className="h-5 px-2 text-xs" onClick={() => void handleSaveEdit()}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-5 px-2 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-800 cursor-pointer" onDoubleClick={() => { setEditingId(c.id); setEditText(c.content) }}>
                          {c.content}
                        </p>
                      )}
                      <p className="text-xs text-zinc-400 mt-1">
                        {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                      <button title="Resolve" onClick={() => void handleResolveComment(c.id)} className="p-0.5 rounded hover:bg-green-100 text-zinc-400 hover:text-green-600">
                        <Check className="h-3 w-3" />
                      </button>
                      <button title="Delete" onClick={() => void handleDeleteComment(c.id)} className="p-0.5 rounded hover:bg-red-100 text-zinc-400 hover:text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Resolved section */}
              {resolvedComments.length > 0 && (
                <details className="group/resolved">
                  <summary className="px-4 py-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-600 select-none">
                    {resolvedComments.length} resolved
                  </summary>
                  {resolvedComments.map((c) => (
                    <div key={c.id} className="px-3 py-2 border-b border-zinc-100 opacity-50">
                      <div className="flex gap-2 items-start">
                        <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          {c.selected_text && (
                            <p className="text-xs italic text-zinc-500 line-clamp-1">&quot;{c.selected_text}&quot;</p>
                          )}
                          <p className="text-xs text-zinc-600">{c.content}</p>
                        </div>
                        <button onClick={() => void handleDeleteComment(c.id)} className="text-zinc-300 hover:text-red-400 shrink-0">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </details>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DOCX document styles */}
      <style>{`
        .docx-content section[data-para-idx] {
          position: relative;
          content-visibility: auto;
          contain-intrinsic-size: 0 auto;
        }
        .docx-content h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: #111827; line-height: 1.2; }
        .docx-content h2 { font-size: 1.5rem;   font-weight: 600; margin: 1.25rem 0 0.625rem; color: #1f2937; }
        .docx-content h3 { font-size: 1.25rem;  font-weight: 600; margin: 1rem 0 0.5rem; color: #374151; }
        .docx-content h4 { font-size: 1.1rem;   font-weight: 600; margin: 0.875rem 0 0.4rem; color: #4b5563; }
        .docx-content h5, .docx-content h6 { font-size: 1rem; font-weight: 600; margin: 0.75rem 0 0.375rem; }
        .docx-content p  { margin: 0 0 0.75rem; line-height: 1.7; color: #1f2937; }
        .docx-content ul { margin: 0.5rem 0 0.75rem 1.25rem; list-style: disc;    }
        .docx-content ol { margin: 0.5rem 0 0.75rem 1.25rem; list-style: decimal; }
        .docx-content li { margin-bottom: 0.25rem; line-height: 1.6; }
        .docx-content strong, .docx-content b { font-weight: 600; }
        .docx-content em, .docx-content i     { font-style: italic; }
        .docx-content u  { text-decoration: underline; }
        .docx-content s  { text-decoration: line-through; color: #6b7280; }
        .docx-content a  { color: #2563eb; text-decoration: underline; }
        .docx-content blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; margin: 0.75rem 0; color: #6b7280; font-style: italic; }
        .docx-content pre  { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.875rem 1rem; overflow-x: auto; margin: 0.75rem 0; }
        .docx-content code { font-family: ui-monospace, monospace; font-size: 0.85em; background: #f3f4f6; padding: 0.1em 0.35em; border-radius: 0.2rem; }
        .docx-content pre code { background: transparent; padding: 0; }
        .docx-content table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9em; }
        .docx-content th { background: #f9fafb; border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; font-weight: 600; }
        .docx-content td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; }
        .docx-content tr:nth-child(even) { background: #f9fafb; }
        .docx-content img { max-width: 100%; height: auto; border-radius: 0.375rem; margin: 0.5rem 0; }
      `}</style>
    </div>
  )
}
