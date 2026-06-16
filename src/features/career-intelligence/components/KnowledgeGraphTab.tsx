import { useEffect, useRef, useState, useCallback } from 'react'
import { Network, RefreshCw, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { LoadingSpinner } from '@shared/components/common/LoadingSpinner'
import { EmptyState } from '@shared/components/common/EmptyState'
import { useCareerIntelligenceStore } from '../store/career-intelligence.store'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodePos {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  label: string
  type: string
  weight: number
  metadata: Record<string, string | number | null>
}

// ─── Node colors by type ──────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  skill:              { fill: '#3b82f6', stroke: '#2563eb', text: '#ffffff' },
  project:            { fill: '#8b5cf6', stroke: '#7c3aed', text: '#ffffff' },
  certification:      { fill: '#f59e0b', stroke: '#d97706', text: '#ffffff' },
  video:              { fill: '#10b981', stroke: '#059669', text: '#ffffff' },
  note:               { fill: '#6b7280', stroke: '#4b5563', text: '#ffffff' },
  document:           { fill: '#ec4899', stroke: '#db2777', text: '#ffffff' },
  lab:                { fill: '#f97316', stroke: '#ea580c', text: '#ffffff' },
  interview_question: { fill: '#06b6d4', stroke: '#0891b2', text: '#ffffff' },
}

const EDGE_COLORS: Record<string, string> = {
  'skill-project':       '#8b5cf680',
  'skill-certification': '#f59e0b80',
  'skill-video':         '#10b98180',
  'skill-occupation':    '#3b82f680',
  'skill-lab':           '#f9731680',
  'skill-interview':     '#06b6d480',
}

// ─── Force simulation (simplified Verlet) ─────────────────────────────────────

function runSimulation(
  nodes: NodePos[],
  edges: Array<{ source: string; target: string }>,
  width: number,
  height: number,
  iterations = 120,
): NodePos[] {
  const cx = width / 2
  const cy = height / 2
  const updated = nodes.map(n => ({ ...n }))

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations

    // Repulsion between all nodes
    for (let i = 0; i < updated.length; i++) {
      for (let j = i + 1; j < updated.length; j++) {
        const a = updated[i]!
        const b = updated[j]!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const repulsion = (5000 / (dist * dist)) * cooling
        a.vx -= (dx / dist) * repulsion
        a.vy -= (dy / dist) * repulsion
        b.vx += (dx / dist) * repulsion
        b.vy += (dy / dist) * repulsion
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = updated.find(n => n.id === edge.source)
      const b = updated.find(n => n.id === edge.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const idealLen = 120
      const attraction = ((dist - idealLen) / dist) * 0.15 * cooling
      a.vx += dx * attraction
      a.vy += dy * attraction
      b.vx -= dx * attraction
      b.vy -= dy * attraction
    }

    // Gravity toward center
    for (const n of updated) {
      n.vx += (cx - n.x) * 0.01 * cooling
      n.vy += (cy - n.y) * 0.01 * cooling
    }

    // Integrate
    for (const n of updated) {
      n.vx *= 0.85
      n.vy *= 0.85
      n.x += n.vx
      n.y += n.vy
      n.x = Math.max(40, Math.min(width - 40, n.x))
      n.y = Math.max(30, Math.min(height - 30, n.y))
    }
  }

  return updated
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function GraphLegend(): React.ReactElement {
  const types = ['skill', 'project', 'certification', 'video', 'lab', 'interview_question']
  return (
    <div className="flex flex-wrap gap-3">
      {types.map(type => {
        const c = TYPE_COLORS[type]!
        return (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.fill }} />
            <span className="text-xs text-muted-foreground capitalize">
              {type === 'interview_question' ? 'Interview Q' : type}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Node Tooltip ─────────────────────────────────────────────────────────────

function NodeTooltip({ node }: { node: NodePos | null }): React.ReactElement | null {
  if (!node) return null
  const c = TYPE_COLORS[node.type] ?? TYPE_COLORS.skill!
  return (
    <div className="absolute top-4 left-4 z-10 bg-popover border border-border rounded-lg p-3 shadow-lg max-w-48 pointer-events-none">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.fill }} />
        <span className="text-xs font-semibold text-foreground truncate">{node.label}</span>
      </div>
      <div className="text-xs text-muted-foreground capitalize">{node.type}</div>
      {node.metadata.level && (
        <div className="text-xs text-muted-foreground mt-0.5">Level: {String(node.metadata.level)}</div>
      )}
      {node.metadata.status && (
        <div className="text-xs text-muted-foreground">Status: {String(node.metadata.status)}</div>
      )}
      <div className="text-xs text-muted-foreground">Connections: {node.weight}</div>
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function KnowledgeGraphTab(): React.ReactElement {
  const graphData = useCareerIntelligenceStore(s => s.graphData)
  const isLoading = useCareerIntelligenceStore(s => s.isLoadingGraph)
  const graphError = useCareerIntelligenceStore(s => s.graphError)
  const fetchGraph = useCareerIntelligenceStore(s => s.fetchGraph)

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<NodePos[]>([])
  const [selectedNode, setSelectedNode] = useState<NodePos | null>(null)
  const [hoveredNode, setHoveredNode] = useState<NodePos | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    void fetchGraph()
  }, [fetchGraph])

  const buildPositions = useCallback(() => {
    if (!graphData || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const W = rect.width || 800
    const H = rect.height || 500

    const nodes: NodePos[] = graphData.nodes.map((n, i) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      weight: n.weight,
      metadata: n.metadata,
      x: W / 2 + Math.cos((i / graphData.nodes.length) * Math.PI * 2) * (W * 0.3),
      y: H / 2 + Math.sin((i / graphData.nodes.length) * Math.PI * 2) * (H * 0.3),
      vx: 0,
      vy: 0,
    }))

    const simulated = runSimulation(nodes, graphData.edges, W, H)
    setPositions(simulated)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [graphData])

  useEffect(() => {
    if (graphData) {
      const timer = setTimeout(buildPositions, 50)
      return () => clearTimeout(timer)
    }
  }, [graphData, buildPositions])

  function handleWheel(e: React.WheelEvent): void {
    e.preventDefault()
    setZoom(z => Math.max(0.3, Math.min(3, z * (e.deltaY < 0 ? 1.1 : 0.9))))
  }

  function handleMouseDown(e: React.MouseEvent): void {
    if (e.button !== 0) return
    isPanning.current = true
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }

  function handleMouseMove(e: React.MouseEvent): void {
    if (!isPanning.current) return
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
  }

  function handleMouseUp(): void {
    isPanning.current = false
  }

  const nodeRadius = (n: NodePos) => Math.max(14, Math.min(28, 14 + n.weight * 3))

  const nodeMap = new Map(positions.map(n => [n.id, n]))
  const connectedIds = selectedNode
    ? new Set([
        selectedNode.id,
        ...graphData!.edges
          .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
          .flatMap(e => [e.source, e.target]),
      ])
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-sm text-muted-foreground mt-3">Building knowledge graph...</p>
        </div>
      </div>
    )
  }

  if (graphError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <EmptyState
          icon={Network}
          title="Failed to load graph"
          description={graphError}
          action={<Button variant="outline" size="sm" onClick={() => void fetchGraph()}>Retry</Button>}
        />
      </div>
    )
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <EmptyState
          icon={Network}
          title="Knowledge graph is empty"
          description="Add skills, link them to projects and certifications, and watch the graph grow."
          action={<Button variant="outline" size="sm" onClick={() => void fetchGraph()}>Refresh</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <GraphLegend />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-xs text-muted-foreground mr-2">
            {graphData.nodes.length} nodes · {graphData.edges.length} edges
          </div>
          {selectedNode && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedNode(null)}>
              Clear selection
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(3, z * 1.2))}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.3, z * 0.8))}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={buildPositions}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Info tip */}
      {!selectedNode && (
        <div className="px-4 py-1.5 bg-muted/30 border-b border-border flex items-center gap-2 shrink-0">
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Click a node to highlight connections · Scroll to zoom · Drag to pan</span>
        </div>
      )}

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <NodeTooltip node={hoveredNode} />

        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ background: 'transparent' }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {graphData.edges.map((edge, i) => {
              const src = nodeMap.get(edge.source)
              const tgt = nodeMap.get(edge.target)
              if (!src || !tgt) return null
              const isHighlighted = !connectedIds || (connectedIds.has(edge.source) && connectedIds.has(edge.target))
              return (
                <line
                  key={i}
                  x1={src.x} y1={src.y}
                  x2={tgt.x} y2={tgt.y}
                  stroke={EDGE_COLORS[edge.type] ?? '#6b728040'}
                  strokeWidth={isHighlighted ? 1.5 : 0.5}
                  opacity={isHighlighted ? 0.9 : 0.15}
                  style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
                />
              )
            })}

            {/* Nodes */}
            {positions.map(node => {
              const c = TYPE_COLORS[node.type] ?? TYPE_COLORS.skill!
              const r = nodeRadius(node)
              const isSelected = selectedNode?.id === node.id
              const isHovered = hoveredNode?.id === node.id
              const isHighlighted = !connectedIds || connectedIds.has(node.id)
              const maxLabelLen = Math.floor(r * 1.4)
              const label = node.label.length > maxLabelLen
                ? node.label.slice(0, maxLabelLen - 1) + '…'
                : node.label

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'pointer', opacity: isHighlighted ? 1 : 0.2, transition: 'opacity 0.2s' }}
                  onClick={e => { e.stopPropagation(); setSelectedNode(selectedNode?.id === node.id ? null : node) }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Glow ring for selected/hovered */}
                  {(isSelected || isHovered) && (
                    <circle
                      r={r + 5}
                      fill={c.fill}
                      opacity={0.2}
                    />
                  )}
                  <circle
                    r={r}
                    fill={c.fill}
                    stroke={isSelected ? '#ffffff' : c.stroke}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={c.text}
                    style={{ fontSize: Math.max(8, r * 0.42) + 'px', fontWeight: 600, pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {label}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* Selected node info bar */}
      {selectedNode && (
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-4 shrink-0">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: (TYPE_COLORS[selectedNode.type] ?? TYPE_COLORS.skill!).fill }}
          />
          <div className="flex-1">
            <span className="text-sm font-semibold text-foreground">{selectedNode.label}</span>
            <span className="text-xs text-muted-foreground ml-2 capitalize">{selectedNode.type}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {selectedNode.metadata.level && <span>Level: {String(selectedNode.metadata.level)}</span>}
            {selectedNode.metadata.status && <span>Status: {String(selectedNode.metadata.status)}</span>}
            <span>{selectedNode.weight} connections</span>
          </div>
          <div className="flex gap-1">
            {graphData.edges
              .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
              .slice(0, 3)
              .map((e, i) => {
                const otherId = e.source === selectedNode.id ? e.target : e.source
                const other = nodeMap.get(otherId)
                return other ? (
                  <Badge key={i} variant="secondary" className="text-xs">{other.label}</Badge>
                ) : null
              })}
          </div>
        </div>
      )}
    </div>
  )
}
