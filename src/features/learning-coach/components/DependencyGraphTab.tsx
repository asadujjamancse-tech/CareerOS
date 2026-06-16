import { useState, useRef, useEffect } from 'react'
import { GitBranch, Plus, Trash2, Lock, Unlock, Info } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Label } from '@shared/components/ui/label'
import { api } from '@shared/lib/ipc-client'
import { useLearningCoachStore } from '../store/learning-coach.store'

// ── Physics simulation ────────────────────────────────────────────────────────

interface SimNode { id: string; x: number; y: number; vx: number; vy: number }

function runSim(nodes: SimNode[], edges: Array<{ from: string; to: string }>, w: number, h: number, iters = 100): SimNode[] {
  const result = nodes.map(n => ({ ...n }))
  const cx = w / 2; const cy = h / 2

  for (let iter = 0; iter < iters; iter++) {
    const cooling = 1 - iter / iters

    // Repulsion
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const ni = result[i]!; const nj = result[j]!
        const dx = nj.x - ni.x; const dy = nj.y - ni.y
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
        const force = 3500 / (dist * dist)
        const fx = (dx / dist) * force; const fy = (dy / dist) * force
        ni.vx -= fx; ni.vy -= fy; nj.vx += fx; nj.vy += fy
      }
    }

    // Edge attraction
    const map = new Map(result.map(n => [n.id, n]))
    for (const e of edges) {
      const a = map.get(e.from); const b = map.get(e.to)
      if (!a || !b) continue
      const dx = b.x - a.x; const dy = b.y - a.y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const force = (dist - 100) / dist * 0.12 * cooling
      const fx = dx * force; const fy = dy * force
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
    }

    // Gravity + damping
    for (const n of result) {
      n.vx += (cx - n.x) * 0.008 * cooling
      n.vy += (cy - n.y) * 0.008 * cooling
      n.vx *= 0.85; n.vy *= 0.85
      n.x += n.vx; n.y += n.vy
      n.x = Math.max(48, Math.min(w - 48, n.x))
      n.y = Math.max(48, Math.min(h - 48, n.y))
    }
  }
  return result
}

const STRENGTH_COLORS = { required: '#EF4444', recommended: '#F59E0B', optional: '#6B7280' }

export function DependencyGraphTab() {
  const { dependencyGraph, dependencies, addDependency, removeDependency } = useLearningCoachStore()
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [simNodes, setSimNodes] = useState<SimNode[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const W = 800; const H = 540

  useEffect(() => {
    if (dependencyGraph.nodes.length === 0) { setSimNodes([]); return }
    const initial: SimNode[] = dependencyGraph.nodes.map((n, i) => ({
      id: n.id,
      x: W / 2 + Math.cos(i / dependencyGraph.nodes.length * 2 * Math.PI) * 200,
      y: H / 2 + Math.sin(i / dependencyGraph.nodes.length * 2 * Math.PI) * 200,
      vx: 0, vy: 0,
    }))
    const edges = dependencyGraph.edges.map(e => ({ from: e.from, to: e.to }))
    setSimNodes(runSim(initial, edges, W, H, 150))
  }, [dependencyGraph])

  const nodeMap = new Map(simNodes.map(n => [n.id, n]))
  const graphNodeMap = new Map(dependencyGraph.nodes.map(n => [n.id, n]))

  const selectedNode = selected ? graphNodeMap.get(selected) : null
  const connectedIds = selected
    ? new Set(dependencyGraph.edges.flatMap(e => (e.from === selected || e.to === selected) ? [e.from, e.to] : []))
    : null

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }
  function onMouseMove(e: React.MouseEvent) {
    if (dragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  function onMouseUp() { setDragging(false) }
  function onWheel(e: React.WheelEvent) { e.preventDefault(); setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001))) }

  return (
    <div className="h-full flex gap-4">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Skill Dependency Graph</h2>
            <p className="text-xs text-muted-foreground">{dependencyGraph.nodes.length} skills · {dependencyGraph.edges.length} dependencies</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1) }}>Reset View</Button>
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Dependency</Button>
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-border bg-muted/20 overflow-hidden relative" style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
          {dependencyGraph.nodes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <GitBranch className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No skill dependencies defined</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">Add skill prerequisites to visualise your learning dependency chain</p>
              <Button size="sm" className="mt-4" onClick={() => setShowAdd(true)}>Add First Dependency</Button>
            </div>
          ) : (
            <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
              onWheel={onWheel}>
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {/* Edges */}
                {dependencyGraph.edges.map((e, i) => {
                  const a = nodeMap.get(e.from); const b = nodeMap.get(e.to)
                  if (!a || !b) return null
                  const color = STRENGTH_COLORS[e.strength as keyof typeof STRENGTH_COLORS] ?? '#6B7280'
                  const isHighlighted = connectedIds?.has(e.from) && connectedIds?.has(e.to)
                  const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2
                  return (
                    <g key={i} opacity={connectedIds && !isHighlighted ? 0.15 : 1}>
                      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={1.5} strokeDasharray={e.strength === 'optional' ? '4 3' : undefined} />
                      <polygon points={`${b.x},${b.y} ${b.x - 8},${b.y - 4} ${b.x - 8},${b.y + 4}`}
                        fill={color} transform={`rotate(${Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI} ${b.x} ${b.y})`} />
                      <text x={mx} y={my - 4} textAnchor="middle" fontSize={8} fill={color} opacity={0.8}>{e.strength}</text>
                    </g>
                  )
                })}

                {/* Nodes */}
                {simNodes.map(sn => {
                  const gn = graphNodeMap.get(sn.id)
                  if (!gn) return null
                  const isSelected = selected === sn.id
                  const isConnected = connectedIds?.has(sn.id)
                  const dimmed = connectedIds && !isSelected && !isConnected
                  const fill = gn.status === 'mastered' ? '#22C55E' : gn.deps_met ? 'hsl(var(--primary))' : '#6B7280'

                  return (
                    <g key={sn.id} opacity={dimmed ? 0.2 : 1} style={{ cursor: 'pointer' }}
                      onClick={() => setSelected(isSelected ? null : sn.id)}>
                      <circle cx={sn.x} cy={sn.y} r={20} fill={fill} stroke={isSelected ? 'white' : 'transparent'} strokeWidth={2} />
                      <foreignObject x={sn.x - 18} y={sn.y - 8} width={36} height={16}>
                        <div className="text-center" style={{ fontSize: 8, color: 'white', lineHeight: '8px', wordBreak: 'break-word', overflow: 'hidden' }}>
                          {gn.name.length > 10 ? gn.name.substring(0, 10) + '…' : gn.name}
                        </div>
                      </foreignObject>
                      {!gn.deps_met && gn.status !== 'mastered' && (
                        <g transform={`translate(${sn.x + 12}, ${sn.y - 14})`}>
                          <circle r={7} fill="#EF4444" />
                          <text textAnchor="middle" y={4} fontSize={9} fill="white">!</text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </g>
            </svg>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 bg-background/90 backdrop-blur rounded-lg p-2 border border-border">
            {[
              { color: 'hsl(var(--primary))', label: 'Unlocked' },
              { color: '#22C55E', label: 'Mastered' },
              { color: '#6B7280', label: 'Locked' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
            <div className="border-t border-border mt-1 pt-1 space-y-1">
              {Object.entries(STRENGTH_COLORS).map(([k, c]) => (
                <div key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-6 h-0.5" style={{ background: c, display: 'inline-block' }} />
                  {k}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="w-64 shrink-0 space-y-3">
        {selectedNode ? (
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">{selectedNode.name}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>
            <div className="flex items-center gap-2 text-xs mb-3">
              <Badge variant="outline" className="capitalize">{selectedNode.level}</Badge>
              <Badge variant="outline" className="capitalize">{selectedNode.status}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              {selectedNode.deps_met ? <Unlock className="w-3.5 h-3.5 text-emerald-500" /> : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
              <span>{selectedNode.deps_met ? 'Prerequisites met' : 'Prerequisites not met'}</span>
            </div>
            <div className="text-xs text-muted-foreground">{selectedNode.category}</div>

            {/* Dependencies for this node */}
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              {dependencies.filter(d => d.skill_id === selectedNode.id || d.prerequisite_id === selectedNode.id).map(d => (
                <div key={`${d.skill_id}-${d.prerequisite_id}`} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: STRENGTH_COLORS[d.strength as keyof typeof STRENGTH_COLORS] ?? '#6B7280' }} />
                  <span className="text-muted-foreground">
                    {d.skill_id === selectedNode.id ? `← ${d.prerequisite_name}` : `→ ${d.skill_name}`}
                  </span>
                  <button onClick={() => { void removeDependency(d.skill_id, d.prerequisite_id) }}
                    className="ml-auto text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Click a skill node to see its dependencies
            </div>
          </div>
        )}

        {/* Dependency list */}
        <div className="rounded-xl border border-border bg-card p-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">All Dependencies</h3>
          {dependencies.length === 0 ? (
            <p className="text-xs text-muted-foreground">No dependencies defined</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {dependencies.map(d => (
                <div key={`${d.skill_id}-${d.prerequisite_id}`} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STRENGTH_COLORS[d.strength as keyof typeof STRENGTH_COLORS] ?? '#6B7280' }} />
                  <span className="text-muted-foreground truncate">{d.prerequisite_name} → {d.skill_name}</span>
                  <button onClick={() => { void removeDependency(d.skill_id, d.prerequisite_id) }}
                    className="ml-auto shrink-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddDependencyDialog open onClose={() => setShowAdd(false)} onAdd={addDependency} />}
    </div>
  )
}

function AddDependencyDialog({ open, onClose, onAdd }: {
  open: boolean; onClose: () => void
  onAdd: (skillId: string, prereqId: string, strength?: 'required' | 'recommended' | 'optional') => Promise<void>
}) {
  const [skills, setSkills] = useState<Array<{ id: string; name: string }>>([])
  const [skillId, setSkillId] = useState('')
  const [prereqId, setPrereqId] = useState('')
  const [strength, setStrength] = useState<'required' | 'recommended' | 'optional'>('required')

  useEffect(() => {
    void api.skills.getAll().then(r => {
      if (r.success) setSkills(r.data.items.map(s => ({ id: s.id, name: s.name })))
    })
  }, [])

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Skill Dependency</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Skill (that depends on the prerequisite)</Label>
            <Select value={skillId} onValueChange={setSkillId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select skill..." /></SelectTrigger>
              <SelectContent>{skills.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Prerequisite (must be learned first)</Label>
            <Select value={prereqId} onValueChange={setPrereqId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select prerequisite..." /></SelectTrigger>
              <SelectContent>{skills.filter(s => s.id !== skillId).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Relationship Strength</Label>
            <Select value={strength} onValueChange={v => setStrength(v as typeof strength)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="required">Required — cannot learn without it</SelectItem>
                <SelectItem value="recommended">Recommended — strongly advised</SelectItem>
                <SelectItem value="optional">Optional — helpful but not critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {skillId && prereqId && (
            <div className="p-2.5 bg-muted/30 rounded text-xs text-muted-foreground">
              <span className="font-medium">{skills.find(s => s.id === prereqId)?.name}</span> must be learned before <span className="font-medium">{skills.find(s => s.id === skillId)?.name}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (skillId && prereqId) { void onAdd(skillId, prereqId, strength).then(onClose) } }} disabled={!skillId || !prereqId || skillId === prereqId}>
            Add Dependency
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
