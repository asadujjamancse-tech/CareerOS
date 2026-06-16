/**
 * PDFPageAnnotationLayer — transparent overlay on a single PDF page canvas.
 *
 * Responsibilities:
 *  - Render existing highlights, notes, and bookmarks as positioned elements
 *  - Capture mouse drag → create highlight
 *  - Capture click (no drag) → create note
 *  - Show a confirmation popup after drawing to pick color / add text
 */

import { useRef, useState, useCallback } from 'react'
import { MessageSquare, Trash2, X, Check, Bookmark } from 'lucide-react'
import type { VaultAnnotation, AnnotationPosition, KnowledgeColor } from '../types/vault.types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DragState {
  startX: number
  startY: number
  currentX: number
  currentY: number
  active: boolean
}

interface PendingAnnotation {
  position: AnnotationPosition
  type: 'highlight' | 'note'
  anchorX: number  // popup anchor (px from left of page)
  anchorY: number  // popup anchor (px from top of page)
}

interface NoteMarker {
  annotation: VaultAnnotation
  parsed: AnnotationPosition
}

export interface PDFPageAnnotationLayerProps {
  pageIndex?: number
  baseDim: { w: number; h: number }
  scale: number
  pageAnnotations: VaultAnnotation[]  // annotations for THIS page only
  activeColorHex: string
  colors: KnowledgeColor[]
  annotateMode: boolean
  isBookmarked: boolean
  onCreateHighlight: (position: AnnotationPosition, colorHex: string, content: string | null) => void
  onCreateNote: (position: AnnotationPosition, colorHex: string, content: string) => void
  onDeleteAnnotation: (id: string) => void
  onUpdateAnnotation: (id: string, content: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePosition(ann: VaultAnnotation): AnnotationPosition | null {
  try { return JSON.parse(ann.position_json) as AnnotationPosition } catch { return null }
}

function toPercent(val: number, ref: number): string {
  return `${(val / ref) * 100}%`
}

const MIN_DRAG_PX = 8

// Render color at 35% opacity for highlight overlays
function highlightBg(hex: string): string {
  // Convert #RRGGBB to rgba
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.35)`
}

// ── Annotation Confirmation Popup ─────────────────────────────────────────────

function AnnotationPopup({
  pending,
  colors,
  activeColorHex,
  onConfirm,
  onCancel,
}: {
  pending: PendingAnnotation
  colors: KnowledgeColor[]
  activeColorHex: string
  onConfirm: (colorHex: string, content: string | null) => void
  onCancel: () => void
}) {
  const [selectedColor, setSelectedColor] = useState(activeColorHex)
  const [noteText, setNoteText] = useState('')

  const displayColors = colors.length > 0 ? colors : [
    { id: 'y', color_hex: '#EAB308', name: 'Yellow', meaning: 'Important', description: null, order_index: 0, is_system: 1 as const, created_at: '', updated_at: '' },
    { id: 'b', color_hex: '#3B82F6', name: 'Blue', meaning: 'Useful', description: null, order_index: 1, is_system: 1 as const, created_at: '', updated_at: '' },
    { id: 'g', color_hex: '#22C55E', name: 'Green', meaning: 'Mastered', description: null, order_index: 2, is_system: 1 as const, created_at: '', updated_at: '' },
    { id: 'o', color_hex: '#F97316', name: 'Orange', meaning: 'Need Revision', description: null, order_index: 3, is_system: 1 as const, created_at: '', updated_at: '' },
    { id: 'r', color_hex: '#EF4444', name: 'Red', meaning: 'Critical', description: null, order_index: 4, is_system: 1 as const, created_at: '', updated_at: '' },
    { id: 'p', color_hex: '#A855F7', name: 'Purple', meaning: 'Interview', description: null, order_index: 5, is_system: 1 as const, created_at: '', updated_at: '' },
  ]

  const isNote = pending.type === 'note'

  // Clamp popup so it stays within page
  const popupStyle: React.CSSProperties = {
    position: 'absolute',
    left: Math.min(pending.anchorX, pending.position.pageWidth - 240),
    top: pending.anchorY + 8,
    zIndex: 100,
    width: 232,
    pointerEvents: 'all',
  }

  return (
    <div
      style={popupStyle}
      className="rounded-xl border border-zinc-600 bg-zinc-900 shadow-2xl p-3 space-y-2.5"
      onMouseDown={e => e.stopPropagation()}
    >
      {/* Color picker */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {displayColors.map(c => (
          <button
            key={c.id}
            type="button"
            title={`${c.name} — ${c.meaning}`}
            onClick={() => setSelectedColor(c.color_hex)}
            style={{ backgroundColor: c.color_hex }}
            className={`h-5 w-5 rounded-full border-2 transition-transform ${
              selectedColor === c.color_hex ? 'border-white scale-125' : 'border-transparent hover:scale-110'
            }`}
          />
        ))}
      </div>

      {/* Note text field */}
      <textarea
        autoFocus={isNote}
        placeholder={isNote ? 'Note text…' : 'Add a note (optional)…'}
        value={noteText}
        onChange={e => setNoteText(e.target.value)}
        rows={2}
        className="w-full text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-200 px-2 py-1.5 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (!isNote || noteText.trim()) onConfirm(selectedColor, noteText.trim() || null)
          }
          if (e.key === 'Escape') onCancel()
        }}
      />

      {/* Actions */}
      <div className="flex items-center gap-1.5 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="h-7 px-2 text-xs rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-1"
        >
          <X className="h-3 w-3" />Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            if (isNote && !noteText.trim()) return
            onConfirm(selectedColor, noteText.trim() || null)
          }}
          style={{ backgroundColor: selectedColor }}
          className="h-7 px-2 text-xs rounded text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
        >
          <Check className="h-3 w-3" />{isNote ? 'Add Note' : 'Highlight'}
        </button>
      </div>
    </div>
  )
}

// ── Note Detail Popup ─────────────────────────────────────────────────────────

function NoteDetailPopup({
  annotation,
  parsed,
  onDelete,
  onUpdate,
  onClose,
}: {
  annotation: VaultAnnotation
  parsed: AnnotationPosition
  onDelete: (id: string) => void
  onUpdate: (id: string, content: string) => void
  onClose: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(annotation.content ?? '')

  const anchorX = (parsed.x / parsed.pageWidth) * parsed.pageWidth
  const anchorY = parsed.y + parsed.height

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${Math.min((parsed.x / parsed.pageWidth) * 100, 70)}%`,
    top: `${((parsed.y + parsed.height) / parsed.pageHeight) * 100}%`,
    zIndex: 200,
    width: 220,
    pointerEvents: 'all',
  }
  // suppress unused warning
  void anchorX; void anchorY

  return (
    <div
      style={style}
      className="rounded-xl border border-zinc-600 bg-zinc-900 shadow-2xl p-3 space-y-2"
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: annotation.color_hex }} />
        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium flex-1">
          {annotation.color_meaning ?? 'Note'}
        </span>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {annotation.selected_text && (
        <p className="text-xs text-zinc-400 italic border-l-2 pl-2" style={{ borderColor: annotation.color_hex }}>
          "{annotation.selected_text.slice(0, 80)}{annotation.selected_text.length > 80 ? '…' : ''}"
        </p>
      )}

      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          className="w-full text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-200 px-2 py-1.5 focus:outline-none resize-none"
        />
      ) : (
        <p className="text-xs text-zinc-300 leading-relaxed">
          {annotation.content || <span className="italic text-zinc-500">No note text</span>}
        </p>
      )}

      <div className="flex items-center gap-1.5 justify-end">
        {editing ? (
          <>
            <button type="button" onClick={() => setEditing(false)} className="h-6 px-2 text-xs rounded text-zinc-400 hover:text-zinc-200">Cancel</button>
            <button
              type="button"
              onClick={() => { onUpdate(annotation.id, text); setEditing(false) }}
              className="h-6 px-2 text-xs rounded bg-primary text-primary-foreground"
            >Save</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className="h-6 px-2 text-xs rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">Edit</button>
            <button type="button" onClick={() => onDelete(annotation.id)} className="h-6 px-2 text-xs rounded text-red-400 hover:bg-zinc-800 flex items-center gap-1">
              <Trash2 className="h-3 w-3" />Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function PDFPageAnnotationLayer({
  pageIndex: _pageIndex,
  baseDim,
  scale,
  pageAnnotations,
  activeColorHex,
  colors,
  annotateMode,
  isBookmarked,
  onCreateHighlight,
  onCreateNote,
  onDeleteAnnotation,
  onUpdateAnnotation,
}: PDFPageAnnotationLayerProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [dragRect, setDragRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [pending, setPending] = useState<PendingAnnotation | null>(null)
  const [activeNoteMarker, setActiveNoteMarker] = useState<NoteMarker | null>(null)

  const scaledW = baseDim.w * scale
  const scaledH = baseDim.h * scale

  const getRelativePos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!annotateMode || e.button !== 0) return
    if (pending) { setPending(null); return }
    e.preventDefault()
    const pos = getRelativePos(e)
    dragRef.current = { startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y, active: true }
    setDragRect(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotateMode, pending])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current?.active) return
    const pos = getRelativePos(e)
    dragRef.current.currentX = pos.x
    dragRef.current.currentY = pos.y
    const dx = pos.x - dragRef.current.startX
    const dy = pos.y - dragRef.current.startY
    if (Math.abs(dx) > MIN_DRAG_PX || Math.abs(dy) > MIN_DRAG_PX) {
      setDragRect({
        x: Math.min(dragRef.current.startX, pos.x),
        y: Math.min(dragRef.current.startY, pos.y),
        w: Math.abs(dx),
        h: Math.abs(dy),
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current?.active) return
    const drag = dragRef.current
    dragRef.current = null
    setDragRect(null)

    const endPos = getRelativePos(e)
    const dx = Math.abs(endPos.x - drag.startX)
    const dy = Math.abs(endPos.y - drag.startY)
    const isDrag = dx > MIN_DRAG_PX || dy > MIN_DRAG_PX

    if (isDrag) {
      // Highlight creation
      const x = Math.min(drag.startX, endPos.x)
      const y = Math.min(drag.startY, endPos.y)
      const position: AnnotationPosition = {
        x, y, width: Math.abs(endPos.x - drag.startX), height: Math.abs(endPos.y - drag.startY),
        pageWidth: scaledW, pageHeight: scaledH,
      }
      setPending({
        position,
        type: 'highlight',
        anchorX: x,
        anchorY: y + Math.abs(endPos.y - drag.startY),
      })
    } else {
      // Note creation (click without drag)
      const position: AnnotationPosition = {
        x: drag.startX - 10, y: drag.startY - 10, width: 20, height: 20,
        pageWidth: scaledW, pageHeight: scaledH,
      }
      setPending({
        position,
        type: 'note',
        anchorX: drag.startX,
        anchorY: drag.startY,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scaledW, scaledH])

  const handleConfirm = (colorHex: string, content: string | null) => {
    if (!pending) return
    if (pending.type === 'highlight') {
      onCreateHighlight(pending.position, colorHex, content)
    } else {
      onCreateNote(pending.position, colorHex, content ?? '')
    }
    setPending(null)
  }

  // Separate annotation types
  const highlights = pageAnnotations.filter(a => a.type === 'highlight')
  const notes = pageAnnotations.filter(a => a.type === 'note' || a.type === 'comment')

  return (
    <div
      ref={overlayRef}
      style={{ position: 'absolute', inset: 0, width: scaledW, height: scaledH }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Bookmark ribbon */}
      {isBookmarked && (
        <div
          style={{ position: 'absolute', top: 0, right: 8, zIndex: 20, pointerEvents: 'none' }}
          title="Bookmarked"
        >
          <Bookmark className="h-6 w-6 text-amber-400 fill-amber-400 drop-shadow" />
        </div>
      )}

      {/* Highlight rectangles */}
      {highlights.map(ann => {
        const pos = parsePosition(ann)
        if (!pos) return null
        return (
          <div
            key={ann.id}
            title={ann.content ?? ann.color_meaning ?? 'Highlight'}
            style={{
              position: 'absolute',
              left: toPercent(pos.x, pos.pageWidth),
              top: toPercent(pos.y, pos.pageHeight),
              width: toPercent(pos.width, pos.pageWidth),
              height: toPercent(pos.height, pos.pageHeight),
              backgroundColor: highlightBg(ann.color_hex),
              border: `1px solid ${ann.color_hex}40`,
              borderRadius: 2,
              cursor: annotateMode ? 'default' : 'pointer',
              zIndex: 10,
              pointerEvents: 'all',
            }}
            onClick={e => {
              if (annotateMode) return
              e.stopPropagation()
              // Toggle note detail for highlights that have content
              if (ann.content) {
                const parsed = pos
                setActiveNoteMarker(
                  activeNoteMarker?.annotation.id === ann.id ? null : { annotation: ann, parsed }
                )
              }
            }}
            onContextMenu={e => {
              e.preventDefault()
              e.stopPropagation()
              onDeleteAnnotation(ann.id)
            }}
          />
        )
      })}

      {/* Note markers */}
      {notes.map(ann => {
        const pos = parsePosition(ann)
        if (!pos) return null
        return (
          <div
            key={ann.id}
            style={{
              position: 'absolute',
              left: toPercent(pos.x + pos.width / 2 - 10, pos.pageWidth),
              top: toPercent(pos.y, pos.pageHeight),
              zIndex: 15,
              pointerEvents: 'all',
              cursor: 'pointer',
            }}
            onClick={e => {
              e.stopPropagation()
              setActiveNoteMarker(
                activeNoteMarker?.annotation.id === ann.id ? null : { annotation: ann, parsed: pos }
              )
            }}
          >
            <div
              style={{ backgroundColor: ann.color_hex }}
              className="h-6 w-6 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              title={ann.content ?? 'Note'}
            >
              <MessageSquare className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        )
      })}

      {/* Drag preview rectangle */}
      {dragRect && (
        <div
          style={{
            position: 'absolute',
            left: dragRect.x,
            top: dragRect.y,
            width: dragRect.w,
            height: dragRect.h,
            backgroundColor: highlightBg(activeColorHex),
            border: `2px dashed ${activeColorHex}`,
            borderRadius: 2,
            pointerEvents: 'none',
            zIndex: 50,
          }}
        />
      )}

      {/* Annotation creation popup */}
      {pending && (
        <AnnotationPopup
          pending={pending}
          colors={colors}
          activeColorHex={activeColorHex}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}

      {/* Note detail popup */}
      {activeNoteMarker && (
        <NoteDetailPopup
          annotation={activeNoteMarker.annotation}
          parsed={activeNoteMarker.parsed}
          onDelete={id => { onDeleteAnnotation(id); setActiveNoteMarker(null) }}
          onUpdate={(id, content) => { onUpdateAnnotation(id, content); setActiveNoteMarker(null) }}
          onClose={() => setActiveNoteMarker(null)}
        />
      )}

      {/* Annotate mode cursor overlay (captures all mouse events) */}
      {annotateMode && !pending && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'crosshair',
            zIndex: 5,
            // Don't block clicks on annotation elements (they have higher z-index)
          }}
        />
      )}
    </div>
  )
}
