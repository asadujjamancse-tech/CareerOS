import type { WhiteboardSummary } from '../types/whiteboard.types'
import { BOARD_TYPE_LABELS, BOARD_TYPE_COLORS } from '../types/whiteboard.types'

interface Props {
  board: WhiteboardSummary
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export function WhiteboardCard({ board, onOpen, onDelete }: Props) {
  const color = BOARD_TYPE_COLORS[board.board_type]
  const label = BOARD_TYPE_LABELS[board.board_type]
  const updatedAt = new Date(board.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="group relative bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden hover:border-zinc-600 transition-all">
      {/* Preview area */}
      <button
        type="button"
        onClick={() => onOpen(board.id)}
        className="w-full block text-left"
      >
        <div
          className="h-28 flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, #1e1e2e 0%, #0d0d1a 100%)' }}
        >
          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern id={`dots-${board.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="#94a3b8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#dots-${board.id})`} />
          </svg>

          {/* Board type indicator */}
          <div className="relative flex flex-col items-center gap-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${color}22`, border: `2px solid ${color}44` }}
            >
              <BoardTypeIcon boardType={board.board_type} color={color} />
            </div>
            <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
          </div>
        </div>

        <div className="p-3">
          <p className="text-sm font-medium text-zinc-100 truncate">{board.title}</p>
          {board.description && (
            <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{board.description}</p>
          )}
          <p className="text-[10px] text-zinc-600 mt-1.5">{updatedAt}</p>
        </div>
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(board.id) }}
        className="absolute top-2 right-2 p-1 rounded bg-zinc-900/80 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
        title="Delete whiteboard"
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 4h10M5 4V2h6v2M6 7v5M10 7v5M4 4l1 9h6l1-9" />
        </svg>
      </button>
    </div>
  )
}

function BoardTypeIcon({ boardType, color }: { boardType: WhiteboardSummary['board_type']; color: string }) {
  const props = { width: 24, height: 24, fill: 'none', stroke: color, strokeWidth: '1.5' }
  switch (boardType) {
    case 'free-drawing':
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M3 21L10 8L15 15L18 11L21 15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'mind-map':
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="9" x2="12" y2="4" />
          <line x1="12" y1="15" x2="12" y2="20" />
          <line x1="9" y1="12" x2="4" y2="12" />
          <line x1="15" y1="12" x2="20" y2="12" />
        </svg>
      )
    case 'network':
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <rect x="3" y="3" width="4" height="4" rx="1" />
          <rect x="10" y="3" width="4" height="4" rx="1" />
          <rect x="17" y="3" width="4" height="4" rx="1" />
          <rect x="10" y="17" width="4" height="4" rx="1" />
          <line x1="12" y1="7" x2="12" y2="17" />
          <line x1="5" y1="7" x2="5" y2="12" />
          <line x1="5" y1="12" x2="12" y2="12" />
          <line x1="19" y1="7" x2="19" y2="12" />
          <line x1="19" y1="12" x2="12" y2="12" />
        </svg>
      )
    case 'azure':
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M13 4L6 14h7l-2 6 8-10h-7l2-6z" />
        </svg>
      )
    case 'active-directory':
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20c0-4 3-7 7-7s7 3 7 7" />
          <rect x="2" y="3" width="6" height="4" rx="1" />
          <rect x="16" y="3" width="6" height="4" rx="1" />
        </svg>
      )
    case 'flowchart':
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <rect x="8" y="2" width="8" height="5" rx="1" />
          <polygon points="12,8 17,12 12,16 7,12" />
          <path d="M12 16v3" />
          <rect x="8" y="19" width="8" height="3" rx="1.5" />
        </svg>
      )
  }
}
