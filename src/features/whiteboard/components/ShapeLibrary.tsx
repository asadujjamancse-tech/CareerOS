import { useState } from 'react'
import { cn } from '@shared/lib/utils'
import type { BoardType, ShapeType } from '../types/whiteboard.types'
import { SHAPE_PALETTES } from '../types/whiteboard.types'

interface Props {
  boardType: BoardType
  selectedShape: ShapeType | null
  onSelectShape: (s: ShapeType) => void
  onAddShape: (s: ShapeType) => void
}

function ShapePreview({ shapeType, label, selected }: { shapeType: ShapeType; label: string; selected: boolean }) {
  const fill = selected ? '#1e3a5f' : '#2a2a3e'
  const stroke = selected ? '#3b82f6' : '#4a4a6a'
  const textColor = selected ? '#93c5fd' : '#94a3b8'

  const renderPath = () => {
    const w = 52, h = 36

    switch (shapeType) {
      case 'circle':
      case 'ad-user':
      case 'ad-group':
      case 'net-internet':
        return <ellipse cx={w/2} cy={h/2} rx={w/2-2} ry={h/2-2} fill={fill} stroke={stroke} strokeWidth="1.5" />

      case 'diamond':
      case 'fc-decision':
        return <polygon points={`${w/2},2 ${w-2},${h/2} ${w/2},${h-2} 2,${h/2}`} fill={fill} stroke={stroke} strokeWidth="1.5" />

      case 'triangle':
        return <polygon points={`${w/2},2 ${w-2},${h-2} 2,${h-2}`} fill={fill} stroke={stroke} strokeWidth="1.5" />

      case 'rounded-rect':
      case 'fc-start-end':
        return <rect x="2" y={h/4} width={w-4} height={h/2} rx={h/4-1} fill={fill} stroke={stroke} strokeWidth="1.5" />

      case 'hexagon':
      case 'net-router':
      case 'net-switch': {
        const cx = w/2, cy = h/2, r = Math.min(w/2, h/2) - 2
        const pts = Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI) / 3
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
        }).join(' ')
        return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="1.5" />
      }

      case 'parallelogram':
      case 'fc-io': {
        const off = w * 0.15
        return <polygon points={`${2+off},2 ${w-2},2 ${w-2-off},${h-2} 2,${h-2}`} fill={fill} stroke={stroke} strokeWidth="1.5" />
      }

      case 'cylinder':
      case 'fc-database':
      case 'net-database':
      case 'az-sql':
      case 'ad-computer': {
        const ry2 = 5
        return (
          <g>
            <path d={`M4,${ry2} Q${w/2},${-ry2} ${w-4},${ry2} L${w-4},${h-ry2} Q${w/2},${h+ry2} 4,${h-ry2} Z`} fill={fill} stroke={stroke} strokeWidth="1.5" />
            <ellipse cx={w/2} cy={ry2} rx={w/2-4} ry={ry2} fill={fill} stroke={stroke} strokeWidth="1.5" />
          </g>
        )
      }

      case 'star': {
        const cxs = w/2, cys = h/2
        const outer = Math.min(w, h)/2 - 2
        const inner = outer * 0.4
        const pts2 = Array.from({ length: 10 }, (_, i) => {
          const angle = (i * Math.PI) / 5 - Math.PI / 2
          const r2 = i % 2 === 0 ? outer : inner
          return `${cxs + r2 * Math.cos(angle)},${cys + r2 * Math.sin(angle)}`
        }).join(' ')
        return <polygon points={pts2} fill={fill} stroke={stroke} strokeWidth="1.5" />
      }

      case 'cloud':
      case 'net-cloud':
      case 'az-vnet':
        return (
          <g>
            <ellipse cx={w*0.3} cy={h*0.5} rx={w*0.15} ry={h*0.28} fill={fill} stroke={stroke} strokeWidth="1.5" />
            <ellipse cx={w*0.5} cy={h*0.35} rx={w*0.18} ry={h*0.32} fill={fill} stroke={stroke} strokeWidth="1.5" />
            <ellipse cx={w*0.7} cy={h*0.5} rx={w*0.15} ry={h*0.28} fill={fill} stroke={stroke} strokeWidth="1.5" />
            <rect x={w*0.15} y={h*0.5} width={w*0.7} height={h*0.4} fill={fill} stroke="none" />
            <line x1={w*0.15} y1={h*0.9} x2={w*0.85} y2={h*0.9} stroke={stroke} strokeWidth="1.5" />
          </g>
        )

      case 'az-subnet':
      case 'az-rg':
      case 'ad-domain':
      case 'ad-ou':
      case 'ad-site':
      case 'ad-forest':
      case 'net-firewall':
        return <rect x="2" y="2" width={w-4} height={h-4} fill={fill} stroke={stroke} strokeWidth="1.5" strokeDasharray="4 2" rx="2" />

      default:
        return <rect x="2" y="2" width={w-4} height={h-4} rx="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
    }
  }

  return (
    <button
      type="button"
      className={cn(
        'flex flex-col items-center gap-1 p-1.5 rounded-md transition-colors cursor-pointer',
        selected
          ? 'bg-blue-900/40 ring-1 ring-blue-500'
          : 'hover:bg-zinc-700/50',
      )}
      title={label}
    >
      <svg width="52" height="36" viewBox="0 0 52 36">
        {renderPath()}
      </svg>
      <span className="text-[9px] leading-none" style={{ color: textColor }}>{label}</span>
    </button>
  )
}

export function ShapeLibrary({ boardType, selectedShape, onSelectShape, onAddShape }: Props) {
  const [search, setSearch] = useState('')
  const palette = SHAPE_PALETTES[boardType] ?? []
  const filtered = search
    ? palette.filter(s => s.label.toLowerCase().includes(search.toLowerCase()))
    : palette

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800" style={{ width: 200 }}>
      <div className="p-2 border-b border-zinc-800">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">Shapes</p>
        <input
          type="text"
          placeholder="Search shapes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="text-[10px] text-zinc-600 text-center py-4">No shapes found</p>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {filtered.map(shape => (
              <div
                key={shape.type}
                onClick={() => { onSelectShape(shape.type); onAddShape(shape.type) }}
              >
                <ShapePreview
                  shapeType={shape.type}
                  label={shape.label}
                  selected={selectedShape === shape.type}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
