/**
 * PDFReader — Production-grade PDF viewer for CareerOS Knowledge Vault.
 *
 * Engine: pdfjs-dist 6.x (pdf.js official distribution)
 *
 * Features:
 *  - Virtual rendering via IntersectionObserver (only renders visible pages)
 *  - LRU canvas cache — max 10 pages kept in memory
 *  - Text search across all pages with match navigation
 *  - Zoom: 50%–300% with keyboard shortcuts
 *  - Page navigation: prev/next + jump-to-page input
 *  - Fullscreen via Fullscreen API
 *  - Dark mode: CSS invert filter on PDF canvas
 *  - Remembers last page, zoom level, dark mode per document
 *  - Reading progress bar + time tracking
 *  - Keyboard shortcuts: ←/→ pages, +/- zoom, Ctrl+F search, F fullscreen, D dark
 *
 * Annotation System (Phase 7):
 *  - Drag on page to create highlight (color selectable)
 *  - Click on page (annotate mode) to add a note
 *  - Bookmark button saves current page as bookmark
 *  - Annotations panel (right sidebar): All / Highlights / Notes / Bookmarks
 *  - 6 knowledge colors: Yellow / Blue / Green / Orange / Red / Purple
 *  - All annotations persist to SQLite via annotations.ipc
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'

import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search, X,
  Maximize2, Minimize2, Moon, Sun, RotateCcw, ChevronDown,
  Highlighter, Bookmark, BookmarkCheck, PanelRightOpen,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { api } from '@shared/lib/ipc-client'
import { cn } from '@shared/lib/utils'
import { countOccurrences, snapScale } from '../utils/pdf-reader.utils'
import { useVaultStore } from '../store/vault.store'
import { PDFPageAnnotationLayer } from './PDFPageAnnotationLayer'
import { AnnotationPanel } from './AnnotationPanel'
import type { AnnotationPosition } from '../types/vault.types'

export { countOccurrences, snapScale }

// ── Worker ────────────────────────────────────────────────────────────────────

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_SCALE = 0.5
const MAX_SCALE = 3.0
const SCALE_STEP = 0.25
const PRESET_SCALES = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0]
const MAX_CACHED_PAGES = 10
const PRERENDER_MARGIN = '600px 0px'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageDim { w: number; h: number }
interface SearchResult { page: number; count: number }

interface PDFProgress {
  current_page: number
  total_pages: number | null
  zoom_level: number
  is_dark_mode: 0 | 1
  scroll_percent: number
  reading_time_sec: number
}

export interface PDFReaderProps {
  filePath: string
  documentId: string
}

// ── Color dot button ──────────────────────────────────────────────────────────

function ColorDot({
  hex, title, active, onClick,
}: { hex: string; title: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{ backgroundColor: hex }}
      className={cn(
        'h-4 w-4 rounded-full border-2 transition-transform',
        active ? 'border-white scale-125' : 'border-transparent hover:scale-110',
      )}
    />
  )
}

// ── PDFReader ─────────────────────────────────────────────────────────────────

export function PDFReader({ filePath, documentId }: PDFReaderProps) {
  // ── PDF state ───────────────────────────────────────────────────────────────
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null)
  const pdfRef = useRef<PDFDocumentProxy | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [baseDims, setBaseDims] = useState<PageDim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Controls ────────────────────────────────────────────────────────────────
  const [scale, setScale] = useState(1.25)
  const [currentPage, setCurrentPage] = useState(1)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showScaleMenu, setShowScaleMenu] = useState(false)

  // ── Jump to page ────────────────────────────────────────────────────────────
  const [jumpValue, setJumpValue] = useState('')

  // ── Text search ─────────────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [matchIndex, setMatchIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const textCache = useRef<Map<number, string>>(new Map())
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── Annotation state ────────────────────────────────────────────────────────
  const [annotateMode, setAnnotateMode] = useState(false)
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false)

  // ── Rendering ───────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageSlotRefs = useRef<(HTMLDivElement | null)[]>([])
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const renderTaskRefs = useRef<(RenderTask | null)[]>([])
  const lruCache = useRef<Set<number>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  // ── Progress ─────────────────────────────────────────────────────────────────
  const sessionStartRef = useRef<number>(Date.now())
  const savedProgressRef = useRef<PDFProgress | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Vault store (annotations) ─────────────────────────────────────────────
  const {
    annotations,
    colors,
    activeColorHex,
    fetchAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    setActiveColor,
  } = useVaultStore()

  // ── Load annotations on mount ─────────────────────────────────────────────
  useEffect(() => {
    void fetchAnnotations(documentId)
  }, [documentId, fetchAnnotations])

  // ── Load PDF on mount ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    const load = async () => {
      try {
        const progressRes = await api.pdfReader.getProgress(documentId)
        const savedProgress = progressRes.success ? progressRes.data : null
        savedProgressRef.current = savedProgress as PDFProgress | null

        if (savedProgress) {
          setScale(savedProgress.zoom_level)
          setIsDarkMode(savedProgress.is_dark_mode === 1)
        }

        // Read PDF bytes via IPC to avoid CORS issues with file:// from http origins
        const bufRes = await api.vault.readPdfBuffer(filePath) as { success: boolean; data?: { data: string }; error?: string }
        if (!bufRes.success || !bufRes.data) throw new Error(bufRes.error ?? 'Failed to read PDF file')
        const binary = atob(bufRes.data.data)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

        const loadingTask = pdfjsLib.getDocument({ data: bytes })
        loadingTaskRef.current = loadingTask
        const pdf = await loadingTask.promise
        if (cancelled) { void loadingTask.destroy(); return }

        pdfRef.current = pdf
        setPageCount(pdf.numPages)

        const dims = await Promise.all(
          Array.from({ length: pdf.numPages }, (_, i) =>
            pdf.getPage(i + 1).then((page: PDFPageProxy) => {
              const vp = page.getViewport({ scale: 1.0 })
              return { w: vp.width, h: vp.height }
            }),
          ),
        )
        if (cancelled) return
        setBaseDims(dims)
        setIsLoading(false)

        const startPage = savedProgress?.current_page ?? 1
        if (startPage > 1) {
          requestAnimationFrame(() => {
            if (!cancelled) scrollToPage(startPage)
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
          setIsLoading(false)
        }
      }
    }

    void load()
    sessionStartRef.current = Date.now()

    return () => {
      cancelled = true
      void saveProgress(true)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      void loadingTaskRef.current?.destroy()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath, documentId])

  // ── IntersectionObserver ────────────────────────────────────────────────────

  useEffect(() => {
    if (!baseDims.length || !pdfRef.current) return

    observerRef.current?.disconnect()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const pageIndex = Number(entry.target.getAttribute('data-page-idx'))
          if (entry.isIntersecting) {
            setCurrentPage(pageIndex + 1)
            void renderPage(pageIndex)
          }
        }
      },
      { rootMargin: PRERENDER_MARGIN, threshold: 0 },
    )

    pageSlotRefs.current.forEach((slot) => { if (slot) observer.observe(slot) })
    observerRef.current = observer

    return () => observer.disconnect()
  }, [baseDims, scale])

  // ── Re-render cached pages on scale change ──────────────────────────────────

  useEffect(() => {
    if (!pdfRef.current || !baseDims.length) return
    const cached = [...lruCache.current]
    lruCache.current.clear()
    canvasRefs.current.forEach((canvas) => {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
        canvas.width = 0
        canvas.height = 0
      }
    })
    renderTaskRefs.current.forEach((task) => { try { task?.cancel() } catch { /* ok */ } })
    cached.forEach((pageIndex) => void renderPage(pageIndex))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale])

  // ── Canvas rendering ─────────────────────────────────────────────────────────

  const renderPage = useCallback(async (pageIndex: number) => {
    const pdf = pdfRef.current
    const canvas = canvasRefs.current[pageIndex]
    if (!pdf || !canvas) return

    try { renderTaskRefs.current[pageIndex]?.cancel() } catch { /* ok */ }

    if (lruCache.current.size >= MAX_CACHED_PAGES && !lruCache.current.has(pageIndex)) {
      const oldest = lruCache.current.values().next().value
      if (oldest !== undefined) {
        lruCache.current.delete(oldest)
        const oldCanvas = canvasRefs.current[oldest]
        if (oldCanvas) {
          const ctx = oldCanvas.getContext('2d')
          ctx?.clearRect(0, 0, oldCanvas.width, oldCanvas.height)
          oldCanvas.width = 0
          oldCanvas.height = 0
        }
      }
    }

    lruCache.current.delete(pageIndex)
    lruCache.current.add(pageIndex)

    try {
      const page = await pdf.getPage(pageIndex + 1)
      const viewport = page.getViewport({ scale })

      canvas.width = viewport.width
      canvas.height = viewport.height

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const task = page.render({ canvas, canvasContext: ctx, viewport })
      renderTaskRefs.current[pageIndex] = task
      await task.promise
    } catch {
      // RenderTask cancellation throws — ignore
    }
  }, [scale])

  // ── Scroll to page ───────────────────────────────────────────────────────────

  const scrollToPage = useCallback((pageNum: number) => {
    const slot = pageSlotRefs.current[pageNum - 1]
    if (slot) {
      slot.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setCurrentPage(pageNum)
    }
  }, [])

  // ── Text extraction for search ───────────────────────────────────────────────

  const getPageText = useCallback(async (pageNum: number): Promise<string> => {
    const cached = textCache.current.get(pageNum)
    if (cached !== undefined) return cached

    const pdf = pdfRef.current
    if (!pdf) return ''

    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const text = (content.items as Array<Record<string, unknown>>)
      .filter((item) => typeof item['str'] === 'string')
      .map((item) => item['str'] as string)
      .join(' ')

    textCache.current.set(pageNum, text)
    return text
  }, [])

  // ── Search ───────────────────────────────────────────────────────────────────

  const runSearch = useCallback(async (query: string) => {
    if (!query.trim() || !pdfRef.current) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const results: SearchResult[] = []
    const total = pdfRef.current.numPages

    for (let batch = 0; batch < total; batch += 10) {
      const promises = Array.from(
        { length: Math.min(10, total - batch) },
        (_, i) => getPageText(batch + i + 1),
      )
      const texts = await Promise.all(promises)
      texts.forEach((text, i) => {
        const count = countOccurrences(text, query)
        if (count > 0) results.push({ page: batch + i + 1, count })
      })
    }

    setSearchResults(results)
    setMatchIndex(0)
    setIsSearching(false)

    if (results.length > 0 && results[0]) {
      scrollToPage(results[0].page)
    }
  }, [getPageText, scrollToPage])

  useEffect(() => {
    const timer = setTimeout(() => void runSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, runSearch])

  // ── Navigation ────────────────────────────────────────────────────────────────

  const goToPrevMatch = () => {
    if (!searchResults.length) return
    const prev = (matchIndex - 1 + searchResults.length) % searchResults.length
    setMatchIndex(prev)
    const result = searchResults[prev]
    if (result) scrollToPage(result.page)
  }

  const goToNextMatch = () => {
    if (!searchResults.length) return
    const next = (matchIndex + 1) % searchResults.length
    setMatchIndex(next)
    const result = searchResults[next]
    if (result) scrollToPage(result.page)
  }

  const jumpToPage = (value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 1 && num <= pageCount) {
      scrollToPage(num)
    }
    setJumpValue('')
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────────

  const zoomIn  = () => setScale((s) => snapScale(Math.min(MAX_SCALE, s + SCALE_STEP)))
  const zoomOut = () => setScale((s) => snapScale(Math.max(MIN_SCALE, s - SCALE_STEP)))
  const resetZoom = () => setScale(1.25)

  // ── Fullscreen ────────────────────────────────────────────────────────────────

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      void containerRef.current?.requestFullscreen()
    } else {
      void document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ── Progress persistence ──────────────────────────────────────────────────────

  const saveProgress = useCallback(async (isFinal = false) => {
    if (!pdfRef.current) return
    const elapsedSec = Math.floor((Date.now() - sessionStartRef.current) / 1000)
    const scrollEl = scrollRef.current
    const scrollPercent = scrollEl
      ? scrollEl.scrollTop / Math.max(1, scrollEl.scrollHeight - scrollEl.clientHeight)
      : 0

    await api.pdfReader.saveProgress(documentId, {
      current_page: currentPage,
      total_pages: pdfRef.current.numPages,
      zoom_level: scale,
      is_dark_mode: isDarkMode ? 1 : 0,
      scroll_percent: scrollPercent,
      reading_time_sec_delta: isFinal ? elapsedSec : 0,
      completed: currentPage >= pdfRef.current.numPages ? 1 : 0,
    })

    if (isFinal) {
      sessionStartRef.current = Date.now()
    }
  }, [documentId, currentPage, scale, isDarkMode])

  useEffect(() => {
    saveTimerRef.current = setTimeout(() => void saveProgress(false), 30_000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [saveProgress])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA'

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (!isInput) { e.preventDefault(); scrollToPage(Math.min(pageCount, currentPage + 1)) }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (!isInput) { e.preventDefault(); scrollToPage(Math.max(1, currentPage - 1)) }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 50)
      } else if (e.key === 'Escape' && showSearch) {
        setShowSearch(false)
        setSearchQuery('')
        setSearchResults([])
      } else if (e.key === 'Escape' && annotateMode) {
        setAnnotateMode(false)
      } else if (e.key === 'F' || e.key === 'f') {
        if (!isInput) toggleFullscreen()
      } else if (e.key === 'D' || e.key === 'd') {
        if (!isInput) setIsDarkMode((v) => !v)
      } else if (e.key === 'A' || e.key === 'a') {
        if (!isInput) setAnnotateMode(v => !v)
      } else if ((e.metaKey || e.ctrlKey) && e.key === '=') {
        e.preventDefault(); zoomIn()
      } else if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault(); zoomOut()
      } else if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault(); resetZoom()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentPage, pageCount, showSearch, annotateMode, scrollToPage, toggleFullscreen])

  // ── Annotation actions ────────────────────────────────────────────────────────

  const bookmarkedPages = new Set(
    annotations
      .filter(a => a.type === 'bookmark' && a.page_number !== null)
      .map(a => a.page_number as number)
  )

  const handleToggleBookmark = useCallback(() => {
    const page = currentPage
    const existing = annotations.find(a => a.type === 'bookmark' && a.page_number === page)
    if (existing) {
      void deleteAnnotation(existing.id)
    } else {
      void createAnnotation({
        type: 'bookmark',
        pageNumber: page,
        position: { x: 0, y: 0, width: 0, height: 0, pageWidth: 1, pageHeight: 1 },
      })
    }
  }, [currentPage, annotations, createAnnotation, deleteAnnotation])

  const handleCreateHighlight = useCallback((
    pageNumber: number,
    position: AnnotationPosition,
    colorHex: string,
    content: string | null,
  ) => {
    // Temporarily override active color for this specific creation
    const prev = activeColorHex
    setActiveColor(colorHex)
    void createAnnotation({
      type: 'highlight',
      pageNumber,
      position,
      ...(content ? { content } : {}),
    }).then(() => setActiveColor(prev))
  }, [activeColorHex, setActiveColor, createAnnotation])

  const handleCreateNote = useCallback((
    pageNumber: number,
    position: AnnotationPosition,
    colorHex: string,
    content: string,
  ) => {
    const prev = activeColorHex
    setActiveColor(colorHex)
    void createAnnotation({
      type: 'note',
      pageNumber,
      position,
      content,
    }).then(() => setActiveColor(prev))
  }, [activeColorHex, setActiveColor, createAnnotation])

  // ── Derived ───────────────────────────────────────────────────────────────────

  const totalMatches = searchResults.reduce((sum, r) => sum + r.count, 0)
  const currentMatchPage = searchResults[matchIndex]
  const progressPercent = pageCount > 0 ? (currentPage / pageCount) * 100 : 0
  const isCurrentPageBookmarked = bookmarkedPages.has(currentPage)

  // Display colors (fallback if DB colors not loaded yet)
  const displayColors = colors.length > 0 ? colors : [
    { id: 'y', color_hex: '#EAB308', name: 'Yellow', meaning: 'Important',      description: null, order_index: 0, is_system: 1 as const, created_at: '', updated_at: '' },
    { id: 'b', color_hex: '#3B82F6', name: 'Blue',   meaning: 'Useful',         description: null, order_index: 1, is_system: 1 as const, created_at: '', updated_at: '' },
    { id: 'g', color_hex: '#22C55E', name: 'Green',  meaning: 'Mastered',       description: null, order_index: 2, is_system: 1 as const, created_at: '', updated_at: '' },
    { id: 'o', color_hex: '#F97316', name: 'Orange', meaning: 'Need Revision',  description: null, order_index: 3, is_system: 1 as const, created_at: '', updated_at: '' },
    { id: 'r', color_hex: '#EF4444', name: 'Red',    meaning: 'Critical',       description: null, order_index: 4, is_system: 1 as const, created_at: '', updated_at: '' },
    { id: 'p', color_hex: '#A855F7', name: 'Purple', meaning: 'Interview',      description: null, order_index: 5, is_system: 1 as const, created_at: '', updated_at: '' },
  ]

  // ── Error state ───────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <p className="text-sm text-destructive text-center max-w-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={() => void api.storage.openFile(filePath)}>
          Open in System Viewer
        </Button>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-zinc-950 relative" data-testid="pdf-reader">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900 shrink-0 flex-wrap" data-testid="pdf-toolbar">

        {/* Page navigation */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost" size="icon-sm"
            onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            title="Previous page (←)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 px-1">
            <input
              type="text"
              value={jumpValue || String(currentPage)}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') jumpToPage(jumpValue || String(currentPage))
                if (e.key === 'Escape') setJumpValue('')
              }}
              onFocus={(e) => { setJumpValue(String(currentPage)); e.target.select() }}
              onBlur={() => setJumpValue('')}
              className="w-10 text-center text-xs bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-zinc-200 focus:outline-none focus:border-zinc-500"
              aria-label="Current page"
              data-testid="page-input"
            />
            <span className="text-xs text-zinc-500">/ {pageCount || '—'}</span>
          </div>

          <Button
            variant="ghost" size="icon-sm"
            onClick={() => scrollToPage(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage >= pageCount}
            title="Next page (→)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-4 bg-zinc-700 mx-1 shrink-0" />

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={zoomOut} disabled={scale <= MIN_SCALE} title="Zoom out (Ctrl/Cmd -)">
            <ZoomOut className="h-4 w-4" />
          </Button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowScaleMenu((v) => !v)}
              className="flex items-center gap-0.5 text-xs text-zinc-300 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 hover:border-zinc-500 transition-colors min-w-[4.5rem]"
              data-testid="zoom-display"
            >
              {Math.round(scale * 100)}%
              <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
            </button>
            {showScaleMenu && (
              <div className="absolute top-full left-0 mt-1 w-24 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 py-1">
                {PRESET_SCALES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setScale(s); setShowScaleMenu(false) }}
                    className={cn(
                      'w-full text-left text-xs px-3 py-1.5 hover:bg-zinc-700 transition-colors',
                      scale === s ? 'text-primary' : 'text-zinc-300',
                    )}
                  >
                    {Math.round(s * 100)}%
                  </button>
                ))}
                <div className="border-t border-zinc-700 my-1" />
                <button
                  type="button"
                  onClick={() => { resetZoom(); setShowScaleMenu(false) }}
                  className="w-full text-left text-xs px-3 py-1.5 hover:bg-zinc-700 text-zinc-400 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />Reset
                </button>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon-sm" onClick={zoomIn} disabled={scale >= MAX_SCALE} title="Zoom in (Ctrl/Cmd +)">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-4 bg-zinc-700 mx-1 shrink-0" />

        {/* Feature toggles */}
        <Button
          variant="ghost" size="icon-sm"
          onClick={() => { setShowSearch(v => !v); setTimeout(() => searchInputRef.current?.focus(), 50) }}
          title="Search (Ctrl/Cmd F)"
          className={showSearch ? 'text-primary bg-primary/10' : ''}
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost" size="icon-sm"
          onClick={() => setIsDarkMode((v) => !v)}
          title="Toggle dark mode (D)"
          className={isDarkMode ? 'text-primary bg-primary/10' : ''}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost" size="icon-sm"
          onClick={toggleFullscreen}
          title="Toggle fullscreen (F)"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        <div className="w-px h-4 bg-zinc-700 mx-1 shrink-0" />

        {/* ── Annotation toolbar ─────────────────────────────────────────── */}

        {/* Annotate mode toggle */}
        <Button
          variant="ghost" size="icon-sm"
          onClick={() => setAnnotateMode(v => !v)}
          title={annotateMode ? 'Exit annotate mode (A / Esc)' : 'Annotate mode — drag to highlight, click to note (A)'}
          className={annotateMode ? 'text-amber-400 bg-amber-400/10 ring-1 ring-amber-400/40' : ''}
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        {/* Color picker (shown when annotate mode is active) */}
        {annotateMode && (
          <div className="flex items-center gap-1 px-1">
            {displayColors.map(c => (
              <ColorDot
                key={c.id}
                hex={c.color_hex}
                title={`${c.name} — ${c.meaning}`}
                active={activeColorHex === c.color_hex}
                onClick={() => setActiveColor(c.color_hex)}
              />
            ))}
          </div>
        )}

        {/* Bookmark current page */}
        <Button
          variant="ghost" size="icon-sm"
          onClick={handleToggleBookmark}
          title={isCurrentPageBookmarked ? 'Remove bookmark (page ' + currentPage + ')' : 'Bookmark this page'}
          className={isCurrentPageBookmarked ? 'text-amber-400' : ''}
        >
          {isCurrentPageBookmarked
            ? <BookmarkCheck className="h-4 w-4" />
            : <Bookmark className="h-4 w-4" />}
        </Button>

        {/* Annotations panel toggle */}
        <Button
          variant="ghost" size="icon-sm"
          onClick={() => setShowAnnotationPanel(v => !v)}
          title="Toggle annotations panel"
          className={showAnnotationPanel ? 'text-primary bg-primary/10' : ''}
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>

        {/* Reading progress badge */}
        <span className="ml-auto text-[10px] text-zinc-500 tabular-nums">
          {Math.round(progressPercent)}% read
          {annotations.length > 0 && (
            <span className="ml-1.5 text-zinc-600">· {annotations.length} note{annotations.length !== 1 ? 's' : ''}</span>
          )}
        </span>
      </div>

      {/* ── Annotate mode banner ─────────────────────────────────────────────── */}
      {annotateMode && (
        <div className="flex items-center gap-2 px-3 py-1 border-b border-amber-400/20 bg-amber-400/5 shrink-0 text-xs text-amber-300">
          <Highlighter className="h-3.5 w-3.5 shrink-0" />
          <span>Annotate mode: drag to highlight · click to add note · Esc to exit</span>
          <div className="flex items-center gap-1 ml-2">
            {displayColors.map(c => (
              <ColorDot
                key={c.id}
                hex={c.color_hex}
                title={`${c.name} — ${c.meaning}`}
                active={activeColorHex === c.color_hex}
                onClick={() => setActiveColor(c.color_hex)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/80 shrink-0" data-testid="search-bar">
          <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.shiftKey ? goToPrevMatch() : goToNextMatch() }
              if (e.key === 'Escape') { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }
            }}
            placeholder="Search in PDF… (Enter: next, Shift+Enter: prev)"
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            data-testid="search-input"
          />
          {isSearching && (
            <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          {searchQuery && !isSearching && (
            <span className="text-xs text-zinc-500 shrink-0 tabular-nums" data-testid="search-count">
              {totalMatches === 0
                ? 'No matches'
                : `${currentMatchPage?.page ? `${matchIndex + 1} of ${searchResults.length} pages` : ''} (${totalMatches} hits)`}
            </span>
          )}
          {searchResults.length > 1 && (
            <>
              <Button variant="ghost" size="icon-sm" onClick={goToPrevMatch} title="Previous match (Shift+Enter)">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={goToNextMatch} title="Next match (Enter)">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ── Reading progress bar ─────────────────────────────────────────────── */}
      <div className="h-0.5 bg-zinc-800 shrink-0" data-testid="progress-bar">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ── Main content area: scroll + optional annotation panel ─────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Page scroll container */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto"
          style={{ backgroundColor: isDarkMode ? '#ffffff' : '#1a1a1a' }}
          onClick={() => setShowScaleMenu(false)}
          data-testid="scroll-container"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3" data-testid="loading-indicator">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500">Loading PDF…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 px-4">
              {Array.from({ length: pageCount }, (_, i) => {
                const dim = baseDims[i]
                const scaledW = dim ? dim.w * scale : 800
                const scaledH = dim ? dim.h * scale : 1100
                const isMatchPage = !!searchResults.find((r) => r.page === i + 1)
                const pageNum = i + 1
                const pageAnnotations = annotations.filter(a => a.page_number === pageNum)

                return (
                  <div
                    key={i}
                    ref={(el) => { pageSlotRefs.current[i] = el }}
                    data-page-idx={i}
                    data-testid={`page-slot-${i + 1}`}
                    style={{
                      width: scaledW,
                      minHeight: scaledH,
                      position: 'relative',
                    }}
                    className={cn(
                      'shadow-2xl rounded-sm overflow-hidden',
                      isMatchPage && showSearch ? 'ring-2 ring-primary ring-offset-1' : '',
                    )}
                  >
                    {/* Page number label */}
                    <div
                      className="absolute top-1 right-1 z-10 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none"
                      style={{ filter: isDarkMode ? 'invert(1)' : undefined }}
                    >
                      {pageNum}
                    </div>

                    {/* Search match badge */}
                    {isMatchPage && showSearch && (
                      <div
                        className="absolute top-1 left-1 z-10 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded pointer-events-none"
                        style={{ filter: isDarkMode ? 'invert(1)' : undefined }}
                      >
                        {searchResults.find((r) => r.page === pageNum)?.count} match{(searchResults.find((r) => r.page === pageNum)?.count ?? 0) !== 1 ? 'es' : ''}
                      </div>
                    )}

                    {/* Canvas — rendered lazily by IntersectionObserver */}
                    <canvas
                      ref={(el) => { canvasRefs.current[i] = el }}
                      data-testid={`page-canvas-${i + 1}`}
                      style={{
                        display: 'block',
                        filter: isDarkMode ? 'invert(1) hue-rotate(180deg)' : undefined,
                      }}
                    />

                    {/* Placeholder shown before canvas renders */}
                    {!(lruCache.current.has(i)) && (
                      <div
                        className="absolute inset-0 bg-zinc-800/50 animate-pulse"
                        style={{ height: scaledH }}
                      />
                    )}

                    {/* Annotation overlay (renders + captures) */}
                    {dim && (
                      <PDFPageAnnotationLayer
                        pageIndex={i}
                        baseDim={dim}
                        scale={scale}
                        pageAnnotations={pageAnnotations}
                        activeColorHex={activeColorHex}
                        colors={displayColors}
                        annotateMode={annotateMode}
                        isBookmarked={bookmarkedPages.has(pageNum)}
                        onCreateHighlight={(pos, colorHex, content) =>
                          handleCreateHighlight(pageNum, pos, colorHex, content)
                        }
                        onCreateNote={(pos, colorHex, content) =>
                          handleCreateNote(pageNum, pos, colorHex, content)
                        }
                        onDeleteAnnotation={(id) => void deleteAnnotation(id)}
                        onUpdateAnnotation={(id, content) => void updateAnnotation(id, content)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Annotation panel */}
        {showAnnotationPanel && (
          <AnnotationPanel
            annotations={annotations}
            colors={displayColors}
            onNavigate={scrollToPage}
            onDelete={(id) => void deleteAnnotation(id)}
            onUpdate={(id, content) => void updateAnnotation(id, content)}
            onClose={() => setShowAnnotationPanel(false)}
          />
        )}
      </div>

      {/* ── Keyboard help footer ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 py-1 border-t border-zinc-800 bg-zinc-900/50">
        <p className="text-[10px] text-zinc-600">
          ←/→ pages · Ctrl+F search · A annotate · D dark · F fullscreen · Ctrl+/- zoom
        </p>
      </div>
    </div>
  )
}
