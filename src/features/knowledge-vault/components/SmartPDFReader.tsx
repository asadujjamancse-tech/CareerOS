import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Bookmark,
  MessageSquare, Highlighter, X, Save,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Textarea } from '@shared/components/ui/textarea'
import { Badge } from '@shared/components/ui/badge'
import { useVaultStore } from '../store/vault.store'
import type { VaultAnnotation, AnnotationPosition } from '../types/vault.types'
import { cn } from '@shared/lib/utils'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

const HIGHLIGHT_COLORS = [
  { hex: '#EF4444', name: 'Critical', label: 'Red' },
  { hex: '#F97316', name: 'Need Revision', label: 'Orange' },
  { hex: '#EAB308', name: 'Important', label: 'Yellow' },
  { hex: '#3B82F6', name: 'Useful', label: 'Blue' },
  { hex: '#22C55E', name: 'Mastered', label: 'Green' },
  { hex: '#A855F7', name: 'Interview Q', label: 'Purple' },
]

interface HighlightOverlay {
  annotation: VaultAnnotation
  position: AnnotationPosition
}

function AnnotationPopup({ annotation, onDelete, onEdit, style }: {
  annotation: VaultAnnotation
  onDelete: () => void
  onEdit: (content: string) => void
  style: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [noteText, setNoteText] = useState(annotation.content ?? '')

  return (
    <div
      className="absolute z-50 rounded-lg border border-border bg-popover shadow-xl p-3 w-64"
      style={style}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: annotation.color_hex }} />
          <span className="text-xs font-medium">{annotation.color_meaning ?? 'Highlight'}</span>
        </div>
        <button type="button" onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {annotation.selected_text && (
        <p className="text-xs italic text-muted-foreground mb-2 line-clamp-2">&quot;{annotation.selected_text}&quot;</p>
      )}
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={3}
            className="text-xs"
            placeholder="Add a note…"
          />
          <div className="flex gap-1.5">
            <Button size="sm" onClick={() => { onEdit(noteText); setEditing(false) }} className="h-6 text-xs gap-1">
              <Save className="h-3 w-3" />Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-6 text-xs">Cancel</Button>
          </div>
        </div>
      ) : (
        <div>
          {annotation.content ? (
            <p className="text-xs text-muted-foreground mb-2">{annotation.content}</p>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-6 text-xs gap-1 p-0">
            <MessageSquare className="h-3 w-3" />{annotation.content ? 'Edit note' : 'Add note'}
          </Button>
        </div>
      )}
    </div>
  )
}

export function SmartPDFReader({ filePath }: { filePath: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renderTask, setRenderTask] = useState<pdfjsLib.RenderTask | null>(null)

  const [selectedColor, setSelectedColor] = useState('#EAB308')
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)

  const { annotations, createAnnotation, updateAnnotation, deleteAnnotation, updateReadingProgress, readingProgress } = useVaultStore()

  // Filter annotations for this page
  const pageAnnotations = annotations.filter(a => a.page_number === currentPage)

  const renderPage = useCallback(async (pageNum: number, pdf: pdfjsLib.PDFDocumentProxy, s: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: s })

    canvas.width = viewport.width
    canvas.height = viewport.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (renderTask) renderTask.cancel()

    const task = page.render({ canvas, canvasContext: ctx, viewport })
    setRenderTask(task)
    try { await task.promise } catch { /* cancelled */ }
  }, [renderTask])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    pdfjsLib.getDocument({ url: `file://${filePath}` }).promise.then(pdf => {
      if (cancelled) return
      pdfRef.current = pdf
      setTotalPages(pdf.numPages)

      const startPage = readingProgress?.current_page ?? 1
      const validPage = Math.min(startPage, pdf.numPages)
      setCurrentPage(validPage)

      return renderPage(validPage, pdf, scale).then(() => {
        if (!cancelled) setIsLoading(false)
      })
    }).catch(err => {
      if (!cancelled) { setError(String(err)); setIsLoading(false) }
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath])

  useEffect(() => {
    if (!pdfRef.current) return
    void renderPage(currentPage, pdfRef.current, scale)
    void updateReadingProgress(currentPage, totalPages)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, scale])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if click is on an existing highlight
    for (const ann of pageAnnotations) {
      try {
        const pos = JSON.parse(ann.position_json) as AnnotationPosition
        const scaleX = rect.width / pos.pageWidth
        const scaleY = rect.height / pos.pageHeight
        const rx = pos.x * scaleX
        const ry = pos.y * scaleY
        const rw = pos.width * scaleX
        const rh = pos.height * scaleY
        if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
          setActiveAnnotation(ann.id)
          setPopupPos({ top: e.clientY - (containerRef.current?.getBoundingClientRect().top ?? 0) + 10, left: e.clientX - (containerRef.current?.getBoundingClientRect().left ?? 0) })
          return
        }
      } catch { /* ignore parse errors */ }
    }

    setActiveAnnotation(null)
    setPopupPos(null)
  }, [pageAnnotations])

  const handleMouseUp = useCallback(async () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const range = selection.getRangeAt(0)
    const selRect = range.getBoundingClientRect()

    const position: AnnotationPosition = {
      x: selRect.left - rect.left,
      y: selRect.top - rect.top,
      width: selRect.width,
      height: selRect.height,
      pageWidth: rect.width,
      pageHeight: rect.height,
    }

    const selectedText = selection.toString().trim()
    if (!selectedText) return

    await createAnnotation({
      type: 'highlight',
      position,
      selectedText,
      pageNumber: currentPage,
    })

    selection.removeAllRanges()
  }, [createAnnotation, currentPage])

  const handleAddBookmark = async () => {
    await createAnnotation({
      type: 'bookmark',
      position: { x: 0, y: 0, width: 0, height: 0, pageWidth: canvasRef.current?.width ?? 1, pageHeight: canvasRef.current?.height ?? 1 },
      content: `Bookmark — Page ${currentPage}`,
      pageNumber: currentPage,
    })
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void api.storage.openFile(filePath)}>Open Externally</Button>
        </div>
      </div>
    )
  }

  const activeAnn = activeAnnotation ? annotations.find(a => a.id === activeAnnotation) : null

  return (
    <div ref={containerRef} className="flex flex-col h-full relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>
            <ChevronLeft />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums w-20 text-center">
            {currentPage} / {totalPages}
          </span>
          <Button variant="ghost" size="icon-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
            <ChevronRight />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setScale(s => Math.max(0.5, s - 0.2))}><ZoomOut /></Button>
          <span className="text-xs w-14 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setScale(s => Math.min(3, s + 0.2))}><ZoomIn /></Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Highlighter className="h-3.5 w-3.5 text-muted-foreground" />
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c.hex}
              type="button"
              title={`${c.label} — ${c.name}`}
              onClick={() => setSelectedColor(c.hex)}
              className={cn('h-5 w-5 rounded-full border-2 transition-transform hover:scale-110', selectedColor === c.hex ? 'border-white scale-110' : 'border-transparent')}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => void handleAddBookmark()} className="gap-1 text-xs">
            <Bookmark className="h-3.5 w-3.5" />Bookmark
          </Button>
          <Badge variant="outline" className="text-xs">
            {pageAnnotations.length} annotations
          </Badge>
        </div>
      </div>

      {/* Reading progress */}
      {totalPages > 0 && (
        <div className="h-1 bg-muted shrink-0">
          <div className="h-full bg-primary transition-all" style={{ width: `${(currentPage / totalPages) * 100}%` }} />
        </div>
      )}

      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-zinc-900 flex justify-center p-4 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading PDF…
            </div>
          </div>
        )}

        <div className="relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseUp={() => void handleMouseUp()}
            className="block shadow-2xl cursor-text"
            style={{ userSelect: 'text' }}
          />

          {/* Highlight overlays */}
          {pageAnnotations.filter(a => a.type === 'highlight').map(ann => {
            try {
              const pos = JSON.parse(ann.position_json) as AnnotationPosition
              const canvas = canvasRef.current
              if (!canvas) return null
              const scaleX = canvas.getBoundingClientRect().width / pos.pageWidth
              const scaleY = canvas.getBoundingClientRect().height / pos.pageHeight
              const overlay: HighlightOverlay = { annotation: ann, position: pos }
              return (
                <div
                  key={ann.id}
                  onClick={() => {
                    setActiveAnnotation(ann.id)
                    setPopupPos(null)
                  }}
                  className="absolute cursor-pointer opacity-40 hover:opacity-60 transition-opacity"
                  style={{
                    left: pos.x * scaleX,
                    top: pos.y * scaleY,
                    width: pos.width * scaleX,
                    height: pos.height * scaleY,
                    backgroundColor: ann.color_hex,
                    mixBlendMode: 'multiply',
                  }}
                  aria-label={overlay.annotation.color_meaning ?? 'highlight'}
                />
              )
            } catch { return null }
          })}

          {/* Bookmark markers */}
          {pageAnnotations.filter(a => a.type === 'bookmark').map((ann, i) => (
            <div key={ann.id} className="absolute right-0 flex items-center gap-1" style={{ top: 8 + i * 28 }}>
              <span className="text-xs text-muted-foreground">p{ann.page_number}</span>
              <div className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded-sm font-medium cursor-pointer" onClick={() => setActiveAnnotation(ann.id)}>
                <Bookmark className="h-3 w-3 inline mr-1" />Bookmark
              </div>
            </div>
          ))}
        </div>

        {/* Annotation popup */}
        {activeAnn && (
          <AnnotationPopup
            annotation={activeAnn}
            style={{ position: 'fixed', top: popupPos?.top ?? '50%', left: popupPos?.left ?? '50%', zIndex: 999 }}
            onDelete={() => { void deleteAnnotation(activeAnn.id); setActiveAnnotation(null) }}
            onEdit={(content) => void updateAnnotation(activeAnn.id, content)}
          />
        )}
      </div>

      {/* Annotations sidebar */}
      {pageAnnotations.length > 0 && (
        <div className="shrink-0 border-t border-border bg-card p-3 max-h-40 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-2">Page {currentPage} Annotations</p>
          <div className="space-y-1.5">
            {pageAnnotations.map(ann => (
              <div key={ann.id} className="flex items-start gap-2 text-xs group">
                <span className="h-2.5 w-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: ann.color_hex }} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-muted-foreground">{ann.selected_text ?? ann.content ?? ann.type}</p>
                  {ann.content && <p className="text-xs text-primary/80 mt-0.5">{ann.content}</p>}
                </div>
                <button type="button" onClick={() => void deleteAnnotation(ann.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Expose api for the error fallback (imported from ipc-client at module level would cause circular)
const api = (window as { api: { storage: { openFile: (p: string) => Promise<unknown> } } }).api
