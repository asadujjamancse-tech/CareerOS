import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Network, Plus, Link2, Trash2, RefreshCw, ZoomIn, ZoomOut,
  Maximize2, Info, Search, X, ChevronRight, Filter,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@shared/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@shared/components/ui/dialog'
import { LoadingSpinner } from '@shared/components/common/LoadingSpinner'
import { EmptyState } from '@shared/components/common/EmptyState'
import { useKnowledgeGraphStore } from '../store/knowledge-graph.store'
import type { KgEntityType, CreateKgNodeInput, CreateKgLinkInput, UpdateKgNodeInput } from '@shared/types/ipc.types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ENTITY_TYPES: KgEntityType[] = [
  'skill', 'project', 'lab', 'document', 'video',
  'interview_question', 'certification', 'note', 'concept',
]

const ENTITY_LABELS: Record<KgEntityType, string> = {
  skill: 'Skill',
  project: 'Project',
  lab: 'Home Lab',
  document: 'Document',
  video: 'Video',
  interview_question: 'Interview Question',
  certification: 'Certification',
  note: 'Note',
  concept: 'Concept',
}

const TYPE_COLORS: Record<KgEntityType, { fill: string; stroke: string; text: string }> = {
  skill:              { fill: '#3b82f6', stroke: '#2563eb', text: '#ffffff' },
  project:            { fill: '#8b5cf6', stroke: '#7c3aed', text: '#ffffff' },
  certification:      { fill: '#f59e0b', stroke: '#d97706', text: '#ffffff' },
  video:              { fill: '#10b981', stroke: '#059669', text: '#ffffff' },
  note:               { fill: '#6b7280', stroke: '#4b5563', text: '#ffffff' },
  document:           { fill: '#ec4899', stroke: '#db2777', text: '#ffffff' },
  lab:                { fill: '#f97316', stroke: '#ea580c', text: '#ffffff' },
  interview_question: { fill: '#06b6d4', stroke: '#0891b2', text: '#ffffff' },
  concept:            { fill: '#a855f7', stroke: '#9333ea', text: '#ffffff' },
}

// ─── Force simulation (Verlet) ────────────────────────────────────────────────

interface NodePos {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  label: string
  entity_type: KgEntityType
  link_count: number
}

function runSim(
  nodes: NodePos[],
  links: Array<{ source_id: string; target_id: string }>,
  W: number,
  H: number,
  iters = 150,
): NodePos[] {
  const cx = W / 2
  const cy = H / 2
  const ns = nodes.map(n => ({ ...n }))

  for (let i = 0; i < iters; i++) {
    const cool = 1 - i / iters

    for (let a = 0; a < ns.length; a++) {
      for (let b = a + 1; b < ns.length; b++) {
        const na = ns[a]!
        const nb = ns[b]!
        const dx = nb.x - na.x
        const dy = nb.y - na.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const f = (6000 / (dist * dist)) * cool
        na.vx -= (dx / dist) * f
        na.vy -= (dy / dist) * f
        nb.vx += (dx / dist) * f
        nb.vy += (dy / dist) * f
      }
    }

    for (const lk of links) {
      const a = ns.find(n => n.id === lk.source_id)
      const b = ns.find(n => n.id === lk.target_id)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const attr = ((dist - 130) / dist) * 0.13 * cool
      a.vx += dx * attr; a.vy += dy * attr
      b.vx -= dx * attr; b.vy -= dy * attr
    }

    for (const n of ns) {
      n.vx += (cx - n.x) * 0.008 * cool
      n.vy += (cy - n.y) * 0.008 * cool
      n.vx *= 0.85; n.vy *= 0.85
      n.x = Math.max(44, Math.min(W - 44, n.x + n.vx))
      n.y = Math.max(34, Math.min(H - 34, n.y + n.vy))
    }
  }
  return ns
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function GraphLegend(): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-3">
      {ENTITY_TYPES.filter(t => t !== 'concept').map(t => (
        <div key={t} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[t].fill }} />
          <span className="text-xs text-muted-foreground">{ENTITY_LABELS[t]}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Node tooltip ─────────────────────────────────────────────────────────────

function NodeTooltip({ node }: { node: NodePos | null }): React.ReactElement | null {
  if (!node) return null
  const c = TYPE_COLORS[node.entity_type]
  return (
    <div className="absolute top-4 left-4 z-20 bg-popover border border-border rounded-lg p-3 shadow-lg max-w-52 pointer-events-none">
      <div className="flex items-center gap-2 mb-0.5">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.fill }} />
        <span className="text-xs font-semibold text-foreground truncate">{node.label}</span>
      </div>
      <div className="text-xs text-muted-foreground capitalize">{ENTITY_LABELS[node.entity_type]}</div>
      <div className="text-xs text-muted-foreground">{node.link_count} connection{node.link_count !== 1 ? 's' : ''}</div>
    </div>
  )
}

// ─── Add Node Dialog ──────────────────────────────────────────────────────────

function AddNodeDialog(): React.ReactElement {
  const isOpen = useKnowledgeGraphStore(s => s.isNodeFormOpen)
  const editingId = useKnowledgeGraphStore(s => s.editingNodeId)
  const nodes = useKnowledgeGraphStore(s => s.nodes)
  const isSubmitting = useKnowledgeGraphStore(s => s.isSubmittingNode)
  const searchResults = useKnowledgeGraphStore(s => s.entitySearchResults)
  const isSearching = useKnowledgeGraphStore(s => s.isSearchingEntities)
  const closeNodeForm = useKnowledgeGraphStore(s => s.closeNodeForm)
  const submitNode = useKnowledgeGraphStore(s => s.submitNode)
  const searchEntities = useKnowledgeGraphStore(s => s.searchEntities)
  const clearEntitySearch = useKnowledgeGraphStore(s => s.clearEntitySearch)

  const editingNode = editingId ? nodes.find(n => n.id === editingId) : null

  const [entityType, setEntityType] = useState<KgEntityType>('skill')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [entityId, setEntityId] = useState<string | null>(null)
  const [searchQ, setSearchQ] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (editingNode) {
        setEntityType(editingNode.entity_type)
        setLabel(editingNode.label)
        setDescription(editingNode.description ?? '')
        setColor(editingNode.color ?? '')
        setEntityId(editingNode.entity_id)
      } else {
        setEntityType('skill')
        setLabel('')
        setDescription('')
        setColor('')
        setEntityId(null)
        setSearchQ('')
        clearEntitySearch()
      }
    }
  }, [isOpen, editingNode, clearEntitySearch])

  useEffect(() => {
    if (!editingNode && entityType !== 'concept') {
      const t = setTimeout(() => void searchEntities(searchQ, entityType), 250)
      return () => clearTimeout(t)
    }
  }, [searchQ, entityType, editingNode, searchEntities])

  function handlePickEntity(r: { id: string; label: string }): void {
    setEntityId(r.id)
    setLabel(r.label)
    clearEntitySearch()
    setSearchQ(r.label)
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!label.trim()) return
    if (editingNode) {
      const update: UpdateKgNodeInput = {
        label: label.trim(),
        description: description.trim() || null,
        color: color.trim() || null,
      }
      await submitNode(update)
    } else {
      const create: CreateKgNodeInput = {
        entity_type: entityType,
        entity_id: entityType === 'concept' ? null : (entityId ?? null),
        label: label.trim(),
        description: description.trim() || null,
        color: color.trim() || null,
      }
      await submitNode(create)
    }
  }

  const isConcept = entityType === 'concept'

  return (
    <Dialog open={isOpen} onOpenChange={o => { if (!o) closeNodeForm() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingNode ? 'Edit Node' : 'Add Node'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
          {!editingNode && (
            <div className="space-y-1.5">
              <Label>Entity Type</Label>
              <Select value={entityType} onValueChange={v => { setEntityType(v as KgEntityType); setEntityId(null); setLabel(''); setSearchQ(''); clearEntitySearch() }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{ENTITY_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!editingNode && !isConcept && (
            <div className="space-y-1.5">
              <Label>Search {ENTITY_LABELS[entityType]}</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder={`Search ${ENTITY_LABELS[entityType].toLowerCase()}s…`}
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                />
              </div>
              {(isSearching || searchResults.length > 0) && (
                <div className="border border-border rounded-md max-h-40 overflow-y-auto bg-popover shadow-md">
                  {isSearching && <div className="p-2 text-xs text-muted-foreground">Searching…</div>}
                  {searchResults.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handlePickEntity(r)}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{r.label}</span>
                      {r.subtitle && <span className="text-xs text-muted-foreground shrink-0">{r.subtitle}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Node label"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Custom Color <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={color || TYPE_COLORS[entityType].fill}
                onChange={e => setColor(e.target.value)}
                className="h-9 w-12 rounded border border-input cursor-pointer"
              />
              {color && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setColor('')} className="text-xs">
                  Reset
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeNodeForm}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !label.trim()}>
              {isSubmitting ? 'Saving…' : editingNode ? 'Save Changes' : 'Add Node'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add Link Dialog ──────────────────────────────────────────────────────────

function AddLinkDialog(): React.ReactElement {
  const isOpen = useKnowledgeGraphStore(s => s.isLinkFormOpen)
  const nodes = useKnowledgeGraphStore(s => s.nodes)
  const linkSourceId = useKnowledgeGraphStore(s => s.linkSourceId)
  const isSubmitting = useKnowledgeGraphStore(s => s.isSubmittingLink)
  const closeLinkForm = useKnowledgeGraphStore(s => s.closeLinkForm)
  const submitLink = useKnowledgeGraphStore(s => s.submitLink)

  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [linkLabel, setLinkLabel] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSourceId(linkSourceId ?? '')
      setTargetId('')
      setLinkLabel('')
    }
  }, [isOpen, linkSourceId])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!sourceId || !targetId) return
    const payload: CreateKgLinkInput = {
      source_id: sourceId,
      target_id: targetId,
      label: linkLabel.trim() || null,
    }
    await submitLink(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={o => { if (!o) closeLinkForm() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect Nodes</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>From</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source node…" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map(n => (
                  <SelectItem key={n.id} value={n.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: TYPE_COLORS[n.entity_type].fill }} />
                      {n.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>To</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target node…" />
              </SelectTrigger>
              <SelectContent>
                {nodes.filter(n => n.id !== sourceId).map(n => (
                  <SelectItem key={n.id} value={n.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: TYPE_COLORS[n.entity_type].fill }} />
                      {n.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Relationship Label <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              value={linkLabel}
              onChange={e => setLinkLabel(e.target.value)}
              placeholder="e.g. prepares for, documented by…"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeLinkForm}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !sourceId || !targetId}>
              {isSubmitting ? 'Connecting…' : 'Connect'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Selected Node Panel ──────────────────────────────────────────────────────

function SelectedNodePanel({ nodeId }: { nodeId: string }): React.ReactElement | null {
  const nodes = useKnowledgeGraphStore(s => s.nodes)
  const links = useKnowledgeGraphStore(s => s.links)
  const openLinkForm = useKnowledgeGraphStore(s => s.openLinkForm)
  const openEditNode = useKnowledgeGraphStore(s => s.openEditNode)
  const confirmDeleteNode = useKnowledgeGraphStore(s => s.confirmDeleteNode)
  const deleteLink = useKnowledgeGraphStore(s => s.deleteLink)
  const selectNode = useKnowledgeGraphStore(s => s.selectNode)

  const node = nodes.find(n => n.id === nodeId)
  if (!node) return null

  const c = TYPE_COLORS[node.entity_type]
  const nodeLinks = links.filter(l => l.source_id === nodeId || l.target_id === nodeId)

  return (
    <div className="w-72 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.fill }} />
            <span className="font-semibold text-sm truncate text-foreground">{node.label}</span>
          </div>
          <div className="text-xs text-muted-foreground">{ENTITY_LABELS[node.entity_type]}</div>
          {node.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">{node.description}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => selectNode(null)}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="p-3 border-b border-border flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => openEditNode(node.id)}>
          Edit
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openLinkForm(node.id)}>
          <Link2 className="w-3 h-3 mr-1" /> Connect
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => confirmDeleteNode(node.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Connections ({nodeLinks.length})
        </div>
        {nodeLinks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No connections yet. Click Connect to link this node.</p>
        ) : (
          <div className="space-y-1.5">
            {nodeLinks.map(lk => {
              const isSource = lk.source_id === nodeId
              const otherId = isSource ? lk.target_id : lk.source_id
              const otherLabel = isSource ? lk.target_label : lk.source_label
              const other = nodes.find(n => n.id === otherId)
              const oc = other ? TYPE_COLORS[other.entity_type] : TYPE_COLORS.concept
              return (
                <div key={lk.id} className="flex items-center gap-2 group">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: oc.fill }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate text-foreground">{otherLabel}</div>
                    {lk.label && (
                      <div className="text-xs text-muted-foreground">{isSource ? '→' : '←'} {lk.label}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={() => void deleteLink(lk.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function KnowledgeGraphPage(): React.ReactElement {
  const graphData = useKnowledgeGraphStore(s => s.graphData)
  const isLoading = useKnowledgeGraphStore(s => s.isLoadingGraph)
  const graphError = useKnowledgeGraphStore(s => s.graphError)
  const fetchGraph = useKnowledgeGraphStore(s => s.fetchGraph)
  const fetchNodes = useKnowledgeGraphStore(s => s.fetchNodes)
  const fetchLinks = useKnowledgeGraphStore(s => s.fetchLinks)
  const selectedNodeId = useKnowledgeGraphStore(s => s.selectedNodeId)
  const selectNode = useKnowledgeGraphStore(s => s.selectNode)
  const activeTypeFilter = useKnowledgeGraphStore(s => s.activeTypeFilter)
  const setTypeFilter = useKnowledgeGraphStore(s => s.setTypeFilter)
  const openCreateNode = useKnowledgeGraphStore(s => s.openCreateNode)
  const openLinkForm = useKnowledgeGraphStore(s => s.openLinkForm)
  const deletingNodeId = useKnowledgeGraphStore(s => s.deletingNodeId)
  const cancelDeleteNode = useKnowledgeGraphStore(s => s.cancelDeleteNode)
  const executeDeleteNode = useKnowledgeGraphStore(s => s.executeDeleteNode)
  const nodes = useKnowledgeGraphStore(s => s.nodes)

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<NodePos[]>([])
  const [hoveredNode, setHoveredNode] = useState<NodePos | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isPanning = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    void Promise.all([fetchGraph(), fetchNodes(), fetchLinks()])
  }, [fetchGraph, fetchNodes, fetchLinks])

  const buildPositions = useCallback(() => {
    if (!graphData || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const W = rect.width || 800
    const H = rect.height || 500

    const filtered = graphData.nodes.filter(
      n => activeTypeFilter === 'all' || n.entity_type === activeTypeFilter,
    )

    const ns: NodePos[] = filtered.map((n, i) => ({
      id: n.id,
      label: n.label,
      entity_type: n.entity_type,
      link_count: n.link_count,
      x: W / 2 + Math.cos((i / filtered.length) * Math.PI * 2) * (W * 0.3),
      y: H / 2 + Math.sin((i / filtered.length) * Math.PI * 2) * (H * 0.3),
      vx: 0,
      vy: 0,
    }))

    const nodeIds = new Set(ns.map(n => n.id))
    const visibleLinks = graphData.links
      .filter(l => nodeIds.has(l.source_id) && nodeIds.has(l.target_id))

    const simulated = runSim(ns, visibleLinks, W, H)
    setPositions(simulated)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [graphData, activeTypeFilter])

  useEffect(() => {
    if (graphData) {
      const t = setTimeout(buildPositions, 50)
      return () => clearTimeout(t)
    }
  }, [graphData, buildPositions])

  function handleWheel(e: React.WheelEvent): void {
    e.preventDefault()
    setZoom(z => Math.max(0.25, Math.min(4, z * (e.deltaY < 0 ? 1.1 : 0.9))))
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

  function handleMouseUp(): void { isPanning.current = false }

  const nodeRadius = (n: NodePos) => Math.max(15, Math.min(30, 15 + n.link_count * 2.5))
  const nodeMap = new Map(positions.map(n => [n.id, n]))
  const nodeIds = new Set(positions.map(n => n.id))

  const visibleLinks = graphData?.links.filter(
    l => nodeIds.has(l.source_id) && nodeIds.has(l.target_id),
  ) ?? []

  const connectedSet = selectedNodeId
    ? new Set([
        selectedNodeId,
        ...visibleLinks
          .filter(l => l.source_id === selectedNodeId || l.target_id === selectedNodeId)
          .flatMap(l => [l.source_id, l.target_id]),
      ])
    : null

  const isEmpty = !graphData || graphData.nodes.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* ── Page Header ── */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Network className="w-5 h-5" />
            Knowledge Graph
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Map connections between skills, projects, labs, documents, videos, interview questions, and certifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? 'Hide' : 'Show'} Node List
          </Button>
          <Button variant="outline" size="sm" onClick={() => openLinkForm()}>
            <Link2 className="w-4 h-4 mr-1.5" />
            Connect
          </Button>
          <Button size="sm" onClick={openCreateNode}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Node
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar: Node list ── */}
        {sidebarOpen && (
          <div className="w-64 border-r border-border bg-card flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Nodes ({nodes.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {nodes.length === 0 ? (
                <p className="p-4 text-xs text-muted-foreground">No nodes yet. Add nodes to build your graph.</p>
              ) : (
                nodes.map(n => {
                  const c = TYPE_COLORS[n.entity_type]
                  return (
                    <button
                      key={n.id}
                      onClick={() => selectNode(selectedNodeId === n.id ? null : n.id)}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent text-sm transition-colors ${selectedNodeId === n.id ? 'bg-accent' : ''}`}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.fill }} />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs font-medium text-foreground">{n.label}</div>
                        <div className="text-xs text-muted-foreground">{ENTITY_LABELS[n.entity_type]}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{n.link_count}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── Main graph area ── */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Toolbar */}
          <div className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <GraphLegend />
            </div>
            <div className="flex items-center gap-1.5">
              {graphData && (
                <span className="text-xs text-muted-foreground mr-1">
                  {positions.length} nodes · {visibleLinks.length} links
                </span>
              )}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setFilterOpen(v => !v)}
                >
                  <Filter className="w-3 h-3" />
                  {activeTypeFilter === 'all' ? 'All Types' : ENTITY_LABELS[activeTypeFilter as KgEntityType]}
                </Button>
                {filterOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-40">
                    {(['all', ...ENTITY_TYPES] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => { setTypeFilter(t === 'all' ? 'all' : t); setFilterOpen(false) }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent ${activeTypeFilter === t ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                      >
                        {t === 'all' ? 'All Types' : ENTITY_LABELS[t]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedNodeId && (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => selectNode(null)}>
                  Clear
                </Button>
              )}
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(4, z * 1.2))}>
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(0.25, z * 0.8))}>
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

          {/* Hint */}
          {!selectedNodeId && !isEmpty && (
            <div className="px-4 py-1.5 bg-muted/30 border-b border-border flex items-center gap-2 shrink-0">
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Click node to highlight connections · Scroll to zoom · Drag to pan</span>
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 flex min-h-0">
            <div
              ref={containerRef}
              className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => { if (!hoveredNode) selectNode(null) }}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-sm text-muted-foreground mt-3">Building knowledge graph…</p>
                  </div>
                </div>
              )}

              {graphError && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <EmptyState
                    icon={Network}
                    title="Failed to load"
                    description={graphError}
                    action={<Button variant="outline" size="sm" onClick={() => void fetchGraph()}>Retry</Button>}
                  />
                </div>
              )}

              {isEmpty && !isLoading && !graphError && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <EmptyState
                    icon={Network}
                    title="Your knowledge graph is empty"
                    description="Add nodes from any entity type — skills, projects, labs, documents, videos, interview questions, or certifications — then connect them."
                    action={
                      <Button size="sm" onClick={openCreateNode}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add First Node
                      </Button>
                    }
                  />
                </div>
              )}

              <NodeTooltip node={hoveredNode} />

              <svg ref={svgRef} className="w-full h-full" style={{ background: 'transparent' }}>
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#6b728060" />
                  </marker>
                </defs>
                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                  {/* Links */}
                  {visibleLinks.map((lk, i) => {
                    const src = nodeMap.get(lk.source_id)
                    const tgt = nodeMap.get(lk.target_id)
                    if (!src || !tgt) return null
                    const highlighted = !connectedSet || (connectedSet.has(lk.source_id) && connectedSet.has(lk.target_id))
                    const mx = (src.x + tgt.x) / 2
                    const my = (src.y + tgt.y) / 2
                    return (
                      <g key={i}>
                        <line
                          x1={src.x} y1={src.y}
                          x2={tgt.x} y2={tgt.y}
                          stroke={highlighted ? '#6b728080' : '#6b728020'}
                          strokeWidth={highlighted ? 1.5 : 0.5}
                          markerEnd="url(#arrowhead)"
                          style={{ transition: 'opacity 0.2s' }}
                        />
                        {lk.label && highlighted && (
                          <text
                            x={mx} y={my}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#6b7280"
                            style={{ fontSize: '8px', pointerEvents: 'none', userSelect: 'none' }}
                          >
                            {lk.label}
                          </text>
                        )}
                      </g>
                    )
                  })}

                  {/* Nodes */}
                  {positions.map(node => {
                    const c = TYPE_COLORS[node.entity_type]
                    const r = nodeRadius(node)
                    const isSelected = selectedNodeId === node.id
                    const isHovered = hoveredNode?.id === node.id
                    const isHighlighted = !connectedSet || connectedSet.has(node.id)
                    const maxLen = Math.floor(r * 1.3)
                    const lbl = node.label.length > maxLen
                      ? node.label.slice(0, maxLen - 1) + '…'
                      : node.label
                    const nodeColor = c.fill

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x},${node.y})`}
                        style={{ cursor: 'pointer', opacity: isHighlighted ? 1 : 0.15, transition: 'opacity 0.2s' }}
                        onClick={e => { e.stopPropagation(); selectNode(isSelected ? null : node.id) }}
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                      >
                        {(isSelected || isHovered) && (
                          <circle r={r + 6} fill={nodeColor} opacity={0.18} />
                        )}
                        <circle
                          r={r}
                          fill={nodeColor}
                          stroke={isSelected ? '#fff' : c.stroke}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={c.text}
                          style={{
                            fontSize: Math.max(7, r * 0.4) + 'px',
                            fontWeight: 600,
                            pointerEvents: 'none',
                            userSelect: 'none',
                          }}
                        >
                          {lbl}
                        </text>
                      </g>
                    )
                  })}
                </g>
              </svg>
            </div>

            {/* Selected node detail panel */}
            {selectedNodeId && nodes.some(n => n.id === selectedNodeId) && (
              <SelectedNodePanel nodeId={selectedNodeId} />
            )}
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <AddNodeDialog />
      <AddLinkDialog />

      <Dialog open={!!deletingNodeId} onOpenChange={(open: boolean) => { if (!open) cancelDeleteNode() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete node?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the node and all its connections.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelDeleteNode}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => void executeDeleteNode()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
