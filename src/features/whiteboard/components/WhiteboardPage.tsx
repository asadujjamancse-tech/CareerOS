import { useEffect, useRef, useCallback, useState } from 'react'
import { useWhiteboardStore } from '../store/whiteboard.store'
import { WhiteboardCanvas } from './WhiteboardCanvas'
import { ToolBar } from './ToolBar'
import { ShapeLibrary } from './ShapeLibrary'
import { PropertyPanel } from './PropertyPanel'
import { WhiteboardCard } from './WhiteboardCard'
import { WhiteboardForm } from './WhiteboardForm'
import { LinkPanel } from './LinkPanel'
import type { ToolType, ShapeType, CanvasData } from '../types/whiteboard.types'
import { DEFAULT_STYLE, BOARD_TYPE_LABELS } from '../types/whiteboard.types'
import type { WhiteboardCanvasRef } from './WhiteboardCanvas'
import type { WhiteboardForm as WhiteboardFormValues } from '../schemas/whiteboard.schema'

const AUTOSAVE_DELAY = 1500

export function WhiteboardPage() {
  const {
    whiteboards, loading, error, activeId, canvasData, dirty, saving, links,
    fetchAll, openWhiteboard, closeWhiteboard, create, remove, saveCanvas,
    setCanvasData, addLink, removeLink,
  } = useWhiteboardStore()

  const canvasRef = useRef<WhiteboardCanvasRef>(null)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // UI state
  const [tool, setTool] = useState<ToolType>('select')
  const [selectedShape, setSelectedShape] = useState<ShapeType | null>(null)
  const [strokeColor, setStrokeColor] = useState(DEFAULT_STYLE.stroke)
  const [fillColor, setFillColor] = useState(DEFAULT_STYLE.fill)
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STYLE.strokeWidth)
  const [fontSize, setFontSize] = useState(DEFAULT_STYLE.fontSize)
  const [dashed, setDashed] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  const [showShapes, setShowShapes] = useState(true)
  const [showProps, setShowProps] = useState(true)

  const activeBoard = whiteboards.find(w => w.id === activeId)

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  // Keyboard shortcut: tool selection
  useEffect(() => {
    if (!activeId) return
    const handler = (e: KeyboardEvent) => {
      const focused = document.activeElement
      if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) return
      const keyMap: Record<string, ToolType> = {
        v: 'select', V: 'select',
        h: 'hand',   H: 'hand',
        p: 'pen',    P: 'pen',
        s: 'shape',  S: 'shape',
        c: 'connector', C: 'connector',
        t: 'text',   T: 'text',
        e: 'eraser', E: 'eraser',
      }
      const t = keyMap[e.key]
      if (t) setTool(t)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeId])

  // Autosave
  const scheduleAutosave = useCallback((id: string) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => void saveCanvas(id), AUTOSAVE_DELAY)
  }, [saveCanvas])

  // Manual save on Ctrl+S
  useEffect(() => {
    if (!activeId) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
        void saveCanvas(activeId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeId, saveCanvas])

  const handleCanvasChange = useCallback((data: CanvasData) => {
    setCanvasData(data)
    if (activeId) scheduleAutosave(activeId)
  }, [setCanvasData, activeId, scheduleAutosave])

  const handleCreate = async (values: WhiteboardFormValues) => {
    const wb = await create({
      title: values.title,
      board_type: values.board_type,
      description: values.description ?? null,
    })
    setShowForm(false)
    await openWhiteboard(wb.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this whiteboard? This cannot be undone.')) return
    await remove(id)
  }

  const handleOpen = async (id: string) => {
    if (dirty && activeId) {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      await saveCanvas(activeId)
    }
    await openWhiteboard(id)
  }

  const handleClose = async () => {
    if (dirty && activeId) {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
      await saveCanvas(activeId)
    }
    closeWhiteboard()
    setShowLinks(false)
  }

  const handleBackgroundChange = useCallback((bg: string) => {
    setCanvasData({ ...canvasData, background: bg })
    if (activeId) scheduleAutosave(activeId)
  }, [canvasData, setCanvasData, activeId, scheduleAutosave])

  // ── Canvas editor view ────────────────────────────────────────────────────

  if (activeId && activeBoard) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            title="Back to list"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 4L6 8L10 12" />
            </svg>
          </button>
          <span className="text-xs text-zinc-500">Whiteboard</span>
          <span className="text-xs text-zinc-600">/</span>
          <span className="text-sm font-medium text-zinc-200 truncate max-w-xs">{activeBoard.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            {BOARD_TYPE_LABELS[activeBoard.board_type]}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowShapes(s => !s)}
              className={`px-2 py-1 rounded text-[10px] transition-colors ${showShapes ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Toggle shape library"
            >
              Shapes
            </button>
            <button
              type="button"
              onClick={() => setShowProps(s => !s)}
              className={`px-2 py-1 rounded text-[10px] transition-colors ${showProps ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Toggle properties"
            >
              Props
            </button>
            <button
              type="button"
              onClick={() => setShowLinks(s => !s)}
              className={`px-2 py-1 rounded text-[10px] transition-colors ${showLinks ? 'bg-blue-700 text-blue-200' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Toggle links panel"
            >
              Links {links.length > 0 && `(${links.length})`}
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <ToolBar
          tool={tool}
          onToolChange={setTool}
          zoom={zoom}
          onZoomIn={() => canvasRef.current?.setZoom(zoom + 0.1)}
          onZoomOut={() => canvasRef.current?.setZoom(zoom - 0.1)}
          onZoomReset={() => canvasRef.current?.setZoom(1)}
          onFitToScreen={() => canvasRef.current?.fitToScreen()}
          onUndo={() => canvasRef.current?.undo()}
          onRedo={() => canvasRef.current?.redo()}
          onExport={() => canvasRef.current?.exportAsPNG()}
          onDeleteSelected={() => canvasRef.current?.deleteSelected()}
          onSelectAll={() => canvasRef.current?.selectAll()}
          saving={saving}
          dirty={dirty}
          hasSelection={selectedIds.length > 0}
        />

        {/* Main canvas area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Shape library */}
          {showShapes && (
            <ShapeLibrary
              boardType={activeBoard.board_type}
              selectedShape={selectedShape}
              onSelectShape={(s) => { setSelectedShape(s); setTool('shape') }}
              onAddShape={(s) => {
                setSelectedShape(s)
                setTool('shape')
                canvasRef.current?.addShape(s)
              }}
            />
          )}

          {/* Canvas */}
          <div className="flex-1 overflow-hidden relative">
            <WhiteboardCanvas
              ref={canvasRef}
              data={canvasData}
              tool={tool}
              selectedShapeType={selectedShape ?? undefined}
              strokeColor={strokeColor}
              fillColor={fillColor}
              strokeWidth={strokeWidth}
              fontSize={fontSize}
              dashed={dashed}
              onChange={handleCanvasChange}
              onSelectionChange={setSelectedIds}
              onZoomChange={setZoom}
            />
          </div>

          {/* Right panels */}
          {(showProps || showLinks) && (
            <div className="flex border-l border-zinc-800">
              {showProps && (
                <PropertyPanel
                  strokeColor={strokeColor}
                  fillColor={fillColor}
                  strokeWidth={strokeWidth}
                  fontSize={fontSize}
                  dashed={dashed}
                  onStrokeColorChange={setStrokeColor}
                  onFillColorChange={setFillColor}
                  onStrokeWidthChange={setStrokeWidth}
                  onFontSizeChange={setFontSize}
                  onDashedChange={setDashed}
                  background={canvasData.background}
                  onBackgroundChange={handleBackgroundChange}
                />
              )}
              {showLinks && (
                <div className="w-52 border-l border-zinc-800">
                  <LinkPanel
                    whiteboardId={activeId}
                    links={links}
                    onAddLink={(type, id) => addLink(activeId, type, id)}
                    onRemoveLink={(type, id) => removeLink(activeId, type, id)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Whiteboard Workspace</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Free Drawing · Mind Maps · Network · Azure · Active Directory · Flowcharts
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="3" x2="8" y2="13" />
            <line x1="3" y1="8" x2="13" y2="8" />
          </svg>
          New Whiteboard
        </button>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-semibold text-zinc-100 mb-4">New Whiteboard</h2>
            <WhiteboardForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
            Loading whiteboards…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-400 text-sm">{error}</div>
        ) : whiteboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M8 12h8M12 8v8" />
              </svg>
            </div>
            <div>
              <p className="text-zinc-400 font-medium">No whiteboards yet</p>
              <p className="text-xs text-zinc-600 mt-1">Create one to start diagramming</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            >
              Create Whiteboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {whiteboards.map(board => (
              <WhiteboardCard
                key={board.id}
                board={board}
                onOpen={(id) => void handleOpen(id)}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
