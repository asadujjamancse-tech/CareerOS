import { cn } from '@shared/lib/utils'
import type { ToolType } from '../types/whiteboard.types'

interface ToolDef {
  id: ToolType
  label: string
  shortcut: string
  icon: React.ReactNode
}

const TOOLS: ToolDef[] = [
  {
    id: 'select',
    label: 'Select',
    shortcut: 'V',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
        <path d="M2 2L9 13.5L10.5 9L15 7.5L2 2Z" />
      </svg>
    ),
  },
  {
    id: 'hand',
    label: 'Pan',
    shortcut: 'H',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2v4M6 4V2.5M10 4V2.5M4 7V5.5M12 7V5.5M4 7c0 0 0 3 4 6s4-6 4-6" />
      </svg>
    ),
  },
  {
    id: 'pen',
    label: 'Pen',
    shortcut: 'P',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 13L10 4L12 6L5 14L3 13Z" />
        <path d="M10 4L12 2L14 4L12 6L10 4Z" />
      </svg>
    ),
  },
  {
    id: 'shape',
    label: 'Shape',
    shortcut: 'S',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="10" height="10" rx="1" />
      </svg>
    ),
  },
  {
    id: 'connector',
    label: 'Connector',
    shortcut: 'C',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="3" y1="13" x2="13" y2="3" />
        <path d="M9 3H13V7" />
      </svg>
    ),
  },
  {
    id: 'text',
    label: 'Text',
    shortcut: 'T',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
        <path d="M2 3h12v2H9v8H7V5H2V3Z" />
      </svg>
    ),
  },
  {
    id: 'eraser',
    label: 'Eraser',
    shortcut: 'E',
    icon: (
      <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 13L10 6M6 3L13 10L10 13H3L6 10" />
      </svg>
    ),
  },
]

interface Props {
  tool: ToolType
  onToolChange: (t: ToolType) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onFitToScreen: () => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onDeleteSelected: () => void
  onSelectAll: () => void
  saving: boolean
  dirty: boolean
  hasSelection: boolean
}

export function ToolBar({
  tool, onToolChange, zoom,
  onZoomIn, onZoomOut, onZoomReset, onFitToScreen,
  onUndo, onRedo, onExport, onDeleteSelected, onSelectAll,
  saving, dirty, hasSelection,
}: Props) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-900 border-b border-zinc-800 select-none shrink-0 flex-wrap">
      {/* Drawing tools */}
      <div className="flex items-center gap-0.5 border border-zinc-700 rounded-md p-0.5 bg-zinc-800/50">
        {TOOLS.map(t => (
          <button
            key={t.id}
            type="button"
            title={`${t.label} (${t.shortcut})`}
            onClick={() => onToolChange(t.id)}
            className={cn(
              'p-1.5 rounded transition-colors',
              tool === t.id
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700',
            )}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-zinc-700" />

      {/* Zoom */}
      <div className="flex items-center gap-0.5 border border-zinc-700 rounded-md p-0.5 bg-zinc-800/50">
        <button
          type="button"
          title="Zoom out"
          onClick={onZoomOut}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <line x1="12" y1="12" x2="15" y2="15" />
            <line x1="4.5" y1="7" x2="9.5" y2="7" />
          </svg>
        </button>
        <button
          type="button"
          title="Reset zoom (100%)"
          onClick={onZoomReset}
          className="min-w-[44px] text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-700 rounded px-1 py-1 transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          title="Zoom in"
          onClick={onZoomIn}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <line x1="12" y1="12" x2="15" y2="15" />
            <line x1="7" y1="4.5" x2="7" y2="9.5" />
            <line x1="4.5" y1="7" x2="9.5" y2="7" />
          </svg>
        </button>
        <button
          type="button"
          title="Fit to screen"
          onClick={onFitToScreen}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
          </svg>
        </button>
      </div>

      <div className="w-px h-6 bg-zinc-700" />

      {/* History */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Undo (Ctrl+Z)"
          onClick={onUndo}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 6H9a4 4 0 0 1 0 8H5" />
            <path d="M3 6L6 3M3 6L6 9" />
          </svg>
        </button>
        <button
          type="button"
          title="Redo (Ctrl+Y)"
          onClick={onRedo}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 6H7a4 4 0 0 0 0 8h4" />
            <path d="M13 6L10 3M13 6L10 9" />
          </svg>
        </button>
      </div>

      <div className="w-px h-6 bg-zinc-700" />

      {/* Edit */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Select all (Ctrl+A)"
          onClick={onSelectAll}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors text-[10px] font-medium"
        >
          All
        </button>
        {hasSelection && (
          <button
            type="button"
            title="Delete selected (Del)"
            onClick={onDeleteSelected}
            className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-zinc-700 transition-colors"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4h10M5 4V2h6v2M6 7v5M10 7v5M4 4l1 9h6l1-9" />
            </svg>
          </button>
        )}
      </div>

      <div className="w-px h-6 bg-zinc-700" />

      {/* Export */}
      <button
        type="button"
        title="Export as PNG"
        onClick={onExport}
        className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
      >
        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 10v3h10v-3M8 2v7M5 6l3 3 3-3" />
        </svg>
      </button>

      {/* Save status */}
      <div className="ml-auto">
        {saving && <span className="text-[10px] text-zinc-500">Saving…</span>}
        {!saving && dirty && <span className="text-[10px] text-amber-500">Unsaved</span>}
        {!saving && !dirty && <span className="text-[10px] text-green-500/70">Saved</span>}
      </div>
    </div>
  )
}
