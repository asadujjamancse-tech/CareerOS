import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { nanoid } from 'nanoid'
import type {
  CanvasData, CanvasElement, Point, ShapeElement, PenElement,
  TextElement, ConnectorElement, ShapeType, ToolType,
} from '../types/whiteboard.types'
import { DEFAULT_STYLE, DEFAULT_CONNECTOR_STYLE, ALL_SHAPES } from '../types/whiteboard.types'

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_ZOOM = 0.1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.1
const HANDLE_SIZE = 8
const HIT_TOLERANCE = 6

// ── Types ─────────────────────────────────────────────────────────────────────

interface DragState {
  type: 'move' | 'resize' | 'pan' | 'pen' | 'connector-draw' | 'text-input' | 'none'
  startX: number
  startY: number
  originalX?: number
  originalY?: number
  originalW?: number
  originalH?: number
  handleIndex?: number // 0-7: TL,T,TR,R,BR,B,BL,L
}

export interface WhiteboardCanvasRef {
  addShape: (shapeType: ShapeType, atX?: number, atY?: number) => void
  deleteSelected: () => void
  selectAll: () => void
  clearSelection: () => void
  setZoom: (zoom: number) => void
  fitToScreen: () => void
  undo: () => void
  redo: () => void
  exportAsPNG: () => void
}

interface Props {
  data: CanvasData
  tool: ToolType
  selectedShapeType?: ShapeType | undefined
  strokeColor: string
  fillColor: string
  strokeWidth: number
  fontSize: number
  dashed: boolean
  onChange: (data: CanvasData) => void
  onSelectionChange?: (ids: string[]) => void
  onZoomChange?: (zoom: number) => void
}

// ── Shape geometry helpers ────────────────────────────────────────────────────

function shapeBounds(el: ShapeElement): { x: number; y: number; w: number; h: number } {
  return { x: el.x, y: el.y, w: el.width, h: el.height }
}

function textBounds(el: TextElement): { x: number; y: number; w: number; h: number } {
  return { x: el.x, y: el.y, w: el.width, h: el.height }
}

function connectorPoints(el: ConnectorElement, elements: CanvasElement[]): { from: Point; to: Point } {
  let from = el.fromPoint
  let to = el.toPoint
  if (el.fromId) {
    const src = elements.find(e => e.id === el.fromId)
    if (src && (src.type === 'shape' || src.type === 'text')) {
      const b = src.type === 'shape' ? shapeBounds(src) : textBounds(src)
      from = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
    }
  }
  if (el.toId) {
    const dst = elements.find(e => e.id === el.toId)
    if (dst && (dst.type === 'shape' || dst.type === 'text')) {
      const b = dst.type === 'shape' ? shapeBounds(dst) : textBounds(dst)
      to = { x: b.x + b.w / 2, y: b.y + b.h / 2 }
    }
  }
  return { from, to }
}

function penBoundingBox(points: Point[]): { x: number; y: number; w: number; h: number } | null {
  if (points.length === 0) return null
  const p0 = points[0]!
  let minX = p0.x, maxX = p0.x
  let minY = p0.y, maxY = p0.y
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

// ── Shape renderers ───────────────────────────────────────────────────────────

function renderShape(ctx: CanvasRenderingContext2D, el: ShapeElement, selected: boolean): void {
  const { x, y, width: w, height: h, shapeType, label, style } = el

  ctx.save()
  ctx.globalAlpha = style.opacity

  const fillStyle = style.fill
  const strokeStyle = style.stroke

  if (style.dashed) {
    ctx.setLineDash([style.strokeWidth * 3, style.strokeWidth * 2])
  }
  ctx.lineWidth = style.strokeWidth
  ctx.strokeStyle = strokeStyle
  ctx.fillStyle = fillStyle

  ctx.beginPath()

  switch (shapeType) {
    case 'rectangle':
    case 'fc-process':
    case 'fc-subroutine':
    case 'fc-data':
    case 'net-server':
    case 'net-workstation':
    case 'az-vm':
    case 'az-storage':
    case 'az-function':
    case 'az-nsg':
    case 'az-lb':
    case 'az-keyvault':
    case 'az-aks':
    case 'ad-gpo':
    case 'mm-root':
    case 'mm-branch':
    case 'mm-leaf': {
      const r = style.cornerRadius ?? 4
      if (r > 0) {
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.arcTo(x + w, y, x + w, y + r, r)
        ctx.lineTo(x + w, y + h - r)
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
        ctx.lineTo(x + r, y + h)
        ctx.arcTo(x, y + h, x, y + h - r, r)
        ctx.lineTo(x, y + r)
        ctx.arcTo(x, y, x + r, y, r)
        ctx.closePath()
      } else {
        ctx.rect(x, y, w, h)
      }
      break
    }

    case 'rounded-rect':
    case 'fc-start-end':
    case 'ad-dc':
    case 'az-app-service': {
      const r = Math.min(h / 2, 20)
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.arcTo(x + w, y, x + w, y + r, r)
      ctx.lineTo(x + w, y + h - r)
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
      ctx.lineTo(x + r, y + h)
      ctx.arcTo(x, y + h, x, y + h - r, r)
      ctx.lineTo(x, y + r)
      ctx.arcTo(x, y, x + r, y, r)
      ctx.closePath()
      break
    }

    case 'circle':
    case 'net-internet':
    case 'ad-user':
    case 'ad-group': {
      const rx = w / 2
      const ry = h / 2
      ctx.ellipse(x + rx, y + ry, rx, ry, 0, 0, Math.PI * 2)
      break
    }

    case 'diamond':
    case 'fc-decision': {
      ctx.moveTo(x + w / 2, y)
      ctx.lineTo(x + w, y + h / 2)
      ctx.lineTo(x + w / 2, y + h)
      ctx.lineTo(x, y + h / 2)
      ctx.closePath()
      break
    }

    case 'triangle': {
      ctx.moveTo(x + w / 2, y)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x, y + h)
      ctx.closePath()
      break
    }

    case 'cylinder':
    case 'fc-database':
    case 'net-database':
    case 'az-sql':
    case 'ad-computer': {
      const ry = Math.min(h * 0.15, 12)
      ctx.moveTo(x, y + ry)
      ctx.ellipse(x + w / 2, y + ry, w / 2, ry, 0, Math.PI, 0)
      ctx.lineTo(x + w, y + h - ry)
      ctx.ellipse(x + w / 2, y + h - ry, w / 2, ry, 0, 0, Math.PI)
      ctx.lineTo(x, y + ry)
      ctx.closePath()
      // Draw top ellipse separately
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(x + w / 2, y + ry, w / 2, ry, 0, 0, Math.PI * 2)
      break
    }

    case 'parallelogram':
    case 'fc-io': {
      const offset = w * 0.15
      ctx.moveTo(x + offset, y)
      ctx.lineTo(x + w, y)
      ctx.lineTo(x + w - offset, y + h)
      ctx.lineTo(x, y + h)
      ctx.closePath()
      break
    }

    case 'hexagon':
    case 'net-router':
    case 'net-switch': {
      const hw = w / 2
      const hh = h / 2
      const cx2 = x + hw, cy2 = y + hh
      const r2 = Math.min(hw, hh)
      ctx.moveTo(cx2 + r2 * Math.cos(0), cy2 + r2 * Math.sin(0))
      for (let i = 1; i <= 6; i++) {
        ctx.lineTo(cx2 + r2 * Math.cos(i * Math.PI / 3), cy2 + r2 * Math.sin(i * Math.PI / 3))
      }
      ctx.closePath()
      break
    }

    case 'cloud':
    case 'net-cloud':
    case 'az-vnet': {
      const cxc = x + w / 2, cyc = y + h * 0.6
      const r1 = w * 0.18, r2c = w * 0.25, r3 = w * 0.18
      ctx.arc(cxc - w * 0.2, cyc, r1, Math.PI, 0)
      ctx.arc(cxc, cyc - h * 0.25, r2c, Math.PI, 0)
      ctx.arc(cxc + w * 0.2, cyc, r3, Math.PI, 0)
      ctx.lineTo(cxc + w * 0.38, y + h)
      ctx.lineTo(cxc - w * 0.38, y + h)
      ctx.closePath()
      break
    }

    case 'star': {
      const cxs = x + w / 2, cys = y + h / 2
      const outer = Math.min(w, h) / 2
      const inner = outer * 0.4
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2
        const radius = i % 2 === 0 ? outer : inner
        const px = cxs + radius * Math.cos(angle)
        const py = cys + radius * Math.sin(angle)
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.closePath()
      break
    }

    // Container / group shapes
    case 'az-subnet':
    case 'az-rg':
    case 'ad-domain':
    case 'ad-ou':
    case 'ad-site':
    case 'ad-forest':
    case 'net-firewall': {
      ctx.setLineDash([6, 3])
      ctx.rect(x, y, w, h)
      break
    }

    case 'fc-document': {
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y)
      ctx.lineTo(x + w, y + h * 0.8)
      ctx.quadraticCurveTo(x + w * 0.75, y + h * 0.65, x + w * 0.5, y + h * 0.8)
      ctx.quadraticCurveTo(x + w * 0.25, y + h * 0.95, x, y + h * 0.8)
      ctx.closePath()
      break
    }

    default:
      ctx.rect(x, y, w, h)
  }

  ctx.fill()
  ctx.stroke()
  ctx.setLineDash([])

  // Label
  if (label) {
    ctx.save()
    ctx.fillStyle = style.fontColor
    ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
    ctx.textAlign = style.textAlign
    ctx.textBaseline = 'middle'
    const textX = style.textAlign === 'center' ? x + w / 2 : style.textAlign === 'right' ? x + w - 8 : x + 8
    ctx.fillText(label, textX, y + h / 2, w - 12)
    ctx.restore()
  }

  // Selection highlight
  if (selected) {
    ctx.save()
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 2])
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8)
    ctx.setLineDash([])

    // Draw resize handles
    const handles = getResizeHandles(x, y, w, h)
    ctx.fillStyle = '#3b82f6'
    for (const [hx, hy] of handles) {
      ctx.fillRect(hx - HANDLE_SIZE / 2, hy - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
    }
    ctx.restore()
  }

  ctx.restore()
}

function renderPen(ctx: CanvasRenderingContext2D, el: PenElement, selected: boolean): void {
  if (el.points.length < 2) return
  ctx.save()
  ctx.globalAlpha = el.style.opacity
  ctx.strokeStyle = el.style.stroke
  ctx.lineWidth = el.style.strokeWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (el.style.dashed) ctx.setLineDash([el.style.strokeWidth * 3, el.style.strokeWidth * 2])

  ctx.beginPath()
  ctx.moveTo(el.points[0]!.x, el.points[0]!.y)
  for (let i = 1; i < el.points.length - 1; i++) {
    const pi = el.points[i]!, pin = el.points[i + 1]!
    const mx = (pi.x + pin.x) / 2
    const my = (pi.y + pin.y) / 2
    ctx.quadraticCurveTo(pi.x, pi.y, mx, my)
  }
  ctx.lineTo(el.points[el.points.length - 1]!.x, el.points[el.points.length - 1]!.y)
  ctx.stroke()
  ctx.setLineDash([])

  if (selected) {
    const bb = penBoundingBox(el.points)
    if (bb) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 2])
      ctx.strokeRect(bb.x - 6, bb.y - 6, bb.w + 12, bb.h + 12)
      ctx.setLineDash([])
    }
  }
  ctx.restore()
}

function renderText(ctx: CanvasRenderingContext2D, el: TextElement, selected: boolean): void {
  ctx.save()
  ctx.globalAlpha = el.style.opacity
  ctx.font = `${el.style.fontWeight} ${el.style.fontSize}px ${el.style.fontFamily}`
  ctx.fillStyle = el.style.fontColor
  ctx.textAlign = el.style.textAlign
  ctx.textBaseline = 'top'

  const lines = el.text.split('\n')
  const lineH = el.style.fontSize * 1.4
  let textX: number
  if (el.style.textAlign === 'center') textX = el.x + el.width / 2
  else if (el.style.textAlign === 'right') textX = el.x + el.width
  else textX = el.x

  lines.forEach((line, i) => {
    ctx.fillText(line, textX, el.y + i * lineH, el.width)
  })

  if (selected) {
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 2])
    ctx.strokeRect(el.x - 4, el.y - 4, el.width + 8, lines.length * lineH + 8)
    ctx.setLineDash([])
  }
  ctx.restore()
}

function renderConnector(ctx: CanvasRenderingContext2D, el: ConnectorElement, elements: CanvasElement[], selected: boolean): void {
  const { from, to } = connectorPoints(el, elements)
  ctx.save()
  ctx.globalAlpha = el.style.opacity
  ctx.strokeStyle = el.style.stroke
  ctx.lineWidth = el.style.strokeWidth
  ctx.lineCap = 'round'
  if (el.style.dashed) ctx.setLineDash([el.style.strokeWidth * 3, el.style.strokeWidth * 2])

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)

  if (el.waypoints.length > 0) {
    for (const wp of el.waypoints) ctx.lineTo(wp.x, wp.y)
  }
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  ctx.setLineDash([])

  // Draw end arrow
  if (el.endArrow !== 'none') {
    const lastPt = el.waypoints.length > 0 ? (el.waypoints.at(-1) ?? from) : from
    drawArrow(ctx, lastPt, to, el.style.stroke, el.style.strokeWidth, el.endArrow)
  }
  // Draw start arrow
  if (el.startArrow !== 'none') {
    const firstPt = el.waypoints.length > 0 ? (el.waypoints.at(0) ?? to) : to
    drawArrow(ctx, firstPt, from, el.style.stroke, el.style.strokeWidth, el.startArrow)
  }

  // Label
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  if (el.label) {
    ctx.fillStyle = el.style.fontColor
    ctx.font = `${el.style.fontSize}px ${el.style.fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#1e1e2e'
    ctx.fillRect(midX - 30, midY - 10, 60, 20)
    ctx.fillStyle = el.style.fontColor
    ctx.fillText(el.label, midX, midY)
  }

  if (selected) {
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 2])
    ctx.beginPath()
    ctx.arc(from.x, from.y, 6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(to.x, to.y, 6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.restore()
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  lineWidth: number,
  type: 'arrow' | 'filled' | 'circle',
): void {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const size = Math.max(10, lineWidth * 4)
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lineWidth

  if (type === 'circle') {
    ctx.beginPath()
    ctx.arc(to.x, to.y, size / 2.5, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.translate(to.x, to.y)
    ctx.rotate(angle)
    ctx.moveTo(0, 0)
    ctx.lineTo(-size, -size / 2.5)
    ctx.lineTo(-size, size / 2.5)
    if (type === 'filled') {
      ctx.closePath()
      ctx.fill()
    } else {
      ctx.stroke()
    }
  }
  ctx.restore()
}

// ── Resize handles ────────────────────────────────────────────────────────────

function getResizeHandles(x: number, y: number, w: number, h: number): [number, number][] {
  return [
    [x, y], [x + w / 2, y], [x + w, y],
    [x + w, y + h / 2],
    [x + w, y + h], [x + w / 2, y + h], [x, y + h],
    [x, y + h / 2],
  ]
}

function getHandleAtPoint(x: number, y: number, w: number, h: number, px: number, py: number): number {
  const handles = getResizeHandles(x, y, w, h)
  let i = 0
  for (const [hx, hy] of handles) {
    if (Math.abs(px - hx) <= HIT_TOLERANCE && Math.abs(py - hy) <= HIT_TOLERANCE) {
      return i
    }
    i++
  }
  return -1
}

// ── Hit testing ───────────────────────────────────────────────────────────────

function hitTestElement(el: CanvasElement, px: number, py: number, elements: CanvasElement[]): boolean {
  switch (el.type) {
    case 'shape': {
      const { x, y, width: w, height: h } = el
      return px >= x && px <= x + w && py >= y && py <= y + h
    }
    case 'text': {
      const { x, y, width: w, height: h } = el
      return px >= x && px <= x + w && py >= y && py <= y + h
    }
    case 'image': {
      const { x, y, width: w, height: h } = el
      return px >= x && px <= x + w && py >= y && py <= y + h
    }
    case 'pen': {
      for (let i = 0; i < el.points.length - 1; i++) {
        const p1 = el.points[i]!, p2 = el.points[i + 1]!
        const d = distanceToSegment(px, py, p1.x, p1.y, p2.x, p2.y)
        if (d <= HIT_TOLERANCE + el.style.strokeWidth) return true
      }
      return false
    }
    case 'connector': {
      const { from, to } = connectorPoints(el, elements)
      const d = distanceToSegment(px, py, from.x, from.y, to.x, to.y)
      return d <= HIT_TOLERANCE + el.style.strokeWidth
    }
  }
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - x1, py - y1)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

// ── Cursor helpers ────────────────────────────────────────────────────────────

const HANDLE_CURSORS = [
  'nw-resize', 'n-resize', 'ne-resize',
  'e-resize',
  'se-resize', 's-resize', 'sw-resize',
  'w-resize',
]

// ── Component ─────────────────────────────────────────────────────────────────

export const WhiteboardCanvas = forwardRef<WhiteboardCanvasRef, Props>(function WhiteboardCanvas(
  { data, tool, selectedShapeType, strokeColor, fillColor, strokeWidth, fontSize, dashed, onChange, onSelectionChange, onZoomChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [zoom, setZoomState] = useState(data.zoom)
  const [pan, setPan] = useState<Point>(data.pan)

  const dragRef = useRef<DragState>({ type: 'none', startX: 0, startY: 0 })
  const currentPenRef = useRef<PenElement | null>(null)
  const currentConnectorRef = useRef<ConnectorElement | null>(null)
  const editingTextRef = useRef<string | null>(null)
  const textInputRef = useRef<HTMLTextAreaElement | null>(null)

  const historyRef = useRef<CanvasData[]>([])
  const historyIndexRef = useRef(-1)

  const dataRef = useRef(data)
  dataRef.current = data
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const panRef = useRef(pan)
  panRef.current = pan
  const selectedRef = useRef(selectedIds)
  selectedRef.current = selectedIds

  // ── History management ──────────────────────────────────────────────────────

  const pushHistory = useCallback((d: CanvasData) => {
    const h = historyRef.current
    const idx = historyIndexRef.current
    historyRef.current = [...h.slice(0, idx + 1), d]
    historyIndexRef.current = historyRef.current.length - 1
  }, [])

  const commit = useCallback((d: CanvasData) => {
    pushHistory(d)
    onChange(d)
  }, [onChange, pushHistory])

  // ── Canvas-to-world transform ───────────────────────────────────────────────

  const canvasToWorld = useCallback((cx: number, cy: number): Point => {
    const z = zoomRef.current
    const p = panRef.current
    return { x: (cx - p.x) / z, y: (cy - p.y) / z }
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const d = dataRef.current
    const z = zoomRef.current
    const p = panRef.current
    const sel = selectedRef.current

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background
    ctx.fillStyle = d.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid (subtle dot grid)
    const gridSize = 20 * z
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    const startX = p.x % gridSize
    const startY = p.y % gridSize
    for (let gx = startX; gx < canvas.width; gx += gridSize) {
      for (let gy = startY; gy < canvas.height; gy += gridSize) {
        ctx.beginPath()
        ctx.arc(gx, gy, 0.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.scale(z, z)

    // Elements sorted by zIndex
    const sorted = [...d.elements].sort((a, b) => a.zIndex - b.zIndex)
    for (const el of sorted) {
      const selected = sel.includes(el.id)
      switch (el.type) {
        case 'shape':     renderShape(ctx, el, selected); break
        case 'pen':       renderPen(ctx, el, selected); break
        case 'text':      renderText(ctx, el, selected); break
        case 'connector': renderConnector(ctx, el, d.elements, selected); break
      }
    }

    // In-progress pen stroke
    if (currentPenRef.current) {
      renderPen(ctx, currentPenRef.current, false)
    }

    // In-progress connector
    if (currentConnectorRef.current) {
      renderConnector(ctx, currentConnectorRef.current, d.elements, false)
    }

    ctx.restore()
  }, [])

  // ── Resize observer ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      render()
    })
    ro.observe(container)
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
    render()
    return () => ro.disconnect()
  }, [render])

  // ── Re-render on data/selection/zoom/pan change ─────────────────────────────

  useEffect(() => { render() }, [data, selectedIds, zoom, pan, render])

  // Update local zoom/pan from data
  useEffect(() => {
    setZoomState(data.zoom)
    setPan(data.pan)
  }, [data.zoom, data.pan])

  // ── Mouse event helpers ─────────────────────────────────────────────────────

  const getPos = useCallback((e: React.MouseEvent): { cx: number; cy: number; wx: number; wy: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const { x: wx, y: wy } = canvasToWorld(cx, cy)
    return { cx, cy, wx, wy }
  }, [canvasToWorld])

  const findElementAt = useCallback((wx: number, wy: number): CanvasElement | null => {
    const els = [...dataRef.current.elements].reverse()
    for (const el of els) {
      if (hitTestElement(el, wx, wy, dataRef.current.elements)) return el
    }
    return null
  }, [])

  const findConnectTarget = useCallback((wx: number, wy: number): string | null => {
    const els = dataRef.current.elements.filter(e => e.type === 'shape' || e.type === 'text')
    for (const el of [...els].reverse()) {
      if (hitTestElement(el, wx, wy, dataRef.current.elements)) return el.id
    }
    return null
  }, [])

  // ── Pointer down ───────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return
    const { cx, cy, wx, wy } = getPos(e)
    const currentTool = tool
    const drag = dragRef.current

    // Middle mouse or hand tool = pan
    if (e.button === 1 || currentTool === 'hand') {
      drag.type = 'pan'
      drag.startX = cx
      drag.startY = cy
      return
    }

    if (currentTool === 'select') {
      const sel = selectedRef.current
      // Check if clicking on a resize handle of selected shape
      if (sel.length === 1) {
        const el = dataRef.current.elements.find(e2 => e2.id === sel[0])
        if (el && (el.type === 'shape' || el.type === 'text')) {
          const b = el.type === 'shape' ? shapeBounds(el) : textBounds(el)
          const h = getHandleAtPoint(b.x, b.y, b.w, b.h, wx, wy)
          if (h >= 0) {
            drag.type = 'resize'
            drag.startX = wx
            drag.startY = wy
            drag.handleIndex = h
            drag.originalX = b.x
            drag.originalY = b.y
            drag.originalW = b.w
            drag.originalH = b.h
            return
          }
        }
      }

      const hit = findElementAt(wx, wy)
      if (hit) {
        if (e.shiftKey) {
          const newSel = selectedRef.current.includes(hit.id)
            ? selectedRef.current.filter(id => id !== hit.id)
            : [...selectedRef.current, hit.id]
          setSelectedIds(newSel)
          onSelectionChange?.(newSel)
        } else {
          setSelectedIds([hit.id])
          onSelectionChange?.([hit.id])
        }
        drag.type = 'move'
        drag.startX = wx
        drag.startY = wy
      } else {
        setSelectedIds([])
        onSelectionChange?.([])
        drag.type = 'none'
      }
      return
    }

    if (currentTool === 'pen') {
      const newPen: PenElement = {
        id: nanoid(),
        type: 'pen',
        points: [{ x: wx, y: wy }],
        style: { stroke: strokeColor, strokeWidth, opacity: 1, dashed },
        zIndex: dataRef.current.elements.length,
        locked: false,
      }
      currentPenRef.current = newPen
      drag.type = 'pen'
      drag.startX = wx
      drag.startY = wy
      return
    }

    if (currentTool === 'shape' && selectedShapeType) {
      const def = ALL_SHAPES.find(s => s.type === selectedShapeType)
      const w = def?.defaultWidth ?? 120
      const h = def?.defaultHeight ?? 60
      const newShape: ShapeElement = {
        id: nanoid(),
        type: 'shape',
        shapeType: selectedShapeType,
        x: wx - w / 2,
        y: wy - h / 2,
        width: w,
        height: h,
        label: def?.label ?? '',
        style: { ...DEFAULT_STYLE, ...(def?.defaultStyle ?? {}), fill: fillColor, stroke: strokeColor, strokeWidth, fontSize, dashed },
        zIndex: dataRef.current.elements.length,
        locked: false,
      }
      const newData = { ...dataRef.current, elements: [...dataRef.current.elements, newShape] }
      commit(newData)
      setSelectedIds([newShape.id])
      onSelectionChange?.([newShape.id])
      return
    }

    if (currentTool === 'connector') {
      const targetId = findConnectTarget(wx, wy)
      const newConn: ConnectorElement = {
        id: nanoid(),
        type: 'connector',
        fromId: targetId,
        toId: null,
        fromPoint: { x: wx, y: wy },
        toPoint: { x: wx, y: wy },
        waypoints: [],
        startArrow: 'none',
        endArrow: 'filled',
        label: '',
        style: { ...DEFAULT_CONNECTOR_STYLE, stroke: strokeColor, strokeWidth, dashed },
        zIndex: dataRef.current.elements.length,
        locked: false,
      }
      currentConnectorRef.current = newConn
      drag.type = 'connector-draw'
      drag.startX = wx
      drag.startY = wy
      return
    }

    if (currentTool === 'text') {
      spawnTextInput(wx, wy)
      return
    }

    if (currentTool === 'eraser') {
      const hit = findElementAt(wx, wy)
      if (hit) {
        const newData = { ...dataRef.current, elements: dataRef.current.elements.filter(e2 => e2.id !== hit.id) }
        commit(newData)
      }
      return
    }
  }, [tool, selectedShapeType, strokeColor, fillColor, strokeWidth, fontSize, dashed, getPos, findElementAt, findConnectTarget, commit, onSelectionChange])

  // ── Pointer move ───────────────────────────────────────────────────────────

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { cx, cy, wx, wy } = getPos(e)
    const drag = dragRef.current

    if (drag.type === 'pan') {
      const dx = cx - drag.startX
      const dy = cy - drag.startY
      const newPan = { x: panRef.current.x + dx, y: panRef.current.y + dy }
      setPan(newPan)
      panRef.current = newPan
      drag.startX = cx
      drag.startY = cy
      return
    }

    if (drag.type === 'pen' && currentPenRef.current) {
      currentPenRef.current = {
        ...currentPenRef.current,
        points: [...currentPenRef.current.points, { x: wx, y: wy }],
      }
      render()
      return
    }

    if (drag.type === 'connector-draw' && currentConnectorRef.current) {
      const targetId = findConnectTarget(wx, wy)
      currentConnectorRef.current = {
        ...currentConnectorRef.current,
        toId: targetId,
        toPoint: { x: wx, y: wy },
      }
      render()
      return
    }

    if (drag.type === 'move' && selectedRef.current.length > 0) {
      const dx = wx - drag.startX
      const dy = wy - drag.startY
      drag.startX = wx
      drag.startY = wy
      const newElements = dataRef.current.elements.map(el => {
        if (!selectedRef.current.includes(el.id) || el.locked) return el
        if (el.type === 'shape') return { ...el, x: el.x + dx, y: el.y + dy }
        if (el.type === 'text') return { ...el, x: el.x + dx, y: el.y + dy }
        if (el.type === 'image') return { ...el, x: el.x + dx, y: el.y + dy }
        if (el.type === 'pen') return { ...el, points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy })) }
        if (el.type === 'connector') return { ...el, fromPoint: { x: el.fromPoint.x + dx, y: el.fromPoint.y + dy }, toPoint: { x: el.toPoint.x + dx, y: el.toPoint.y + dy } }
        return el
      })
      onChange({ ...dataRef.current, elements: newElements })
      return
    }

    if (drag.type === 'resize' && selectedRef.current.length === 1 && drag.handleIndex !== undefined) {
      const id = selectedRef.current[0]
      const el = dataRef.current.elements.find(e2 => e2.id === id)
      if (!el || (el.type !== 'shape' && el.type !== 'text')) return

      const dx = wx - drag.startX
      const dy = wy - drag.startY
      drag.startX = wx
      drag.startY = wy

      const b = el.type === 'shape' ? shapeBounds(el) : textBounds(el)
      let { x, y, w: w2, h: h2 } = { x: b.x, y: b.y, w: b.w, h: b.h }

      const hi = drag.handleIndex
      if (hi === 0) { x += dx; y += dy; w2 -= dx; h2 -= dy }
      else if (hi === 1) { y += dy; h2 -= dy }
      else if (hi === 2) { y += dy; w2 += dx; h2 -= dy }
      else if (hi === 3) { w2 += dx }
      else if (hi === 4) { w2 += dx; h2 += dy }
      else if (hi === 5) { h2 += dy }
      else if (hi === 6) { x += dx; w2 -= dx; h2 += dy }
      else if (hi === 7) { x += dx; w2 -= dx }

      const minSize = 20
      if (w2 < minSize) w2 = minSize
      if (h2 < minSize) h2 = minSize

      const newElements = dataRef.current.elements.map(e2 => {
        if (e2.id !== id) return e2
        if (e2.type === 'shape') return { ...e2, x, y, width: w2, height: h2 }
        if (e2.type === 'text') return { ...e2, x, y, width: w2, height: h2 }
        return e2
      })
      onChange({ ...dataRef.current, elements: newElements })
      return
    }

    // Update cursor
    const canvas = canvasRef.current
    if (!canvas) return

    if (tool === 'hand') { canvas.style.cursor = 'grab'; return }
    if (tool === 'pen') { canvas.style.cursor = 'crosshair'; return }
    if (tool === 'eraser') { canvas.style.cursor = 'cell'; return }
    if (tool === 'text') { canvas.style.cursor = 'text'; return }
    if (tool === 'connector') { canvas.style.cursor = 'crosshair'; return }
    if (tool === 'shape') { canvas.style.cursor = 'crosshair'; return }

    if (tool === 'select') {
      const sel = selectedRef.current
      if (sel.length === 1) {
        const el2 = dataRef.current.elements.find(e2 => e2.id === sel[0])
        if (el2 && (el2.type === 'shape' || el2.type === 'text')) {
          const b = el2.type === 'shape' ? shapeBounds(el2) : textBounds(el2)
          const h2 = getHandleAtPoint(b.x, b.y, b.w, b.h, wx, wy)
          if (h2 >= 0) { canvas.style.cursor = HANDLE_CURSORS[h2]!; return }
        }
      }
      const hit = findElementAt(wx, wy)
      canvas.style.cursor = hit ? 'move' : 'default'
    }
  }, [tool, getPos, render, findConnectTarget, findElementAt, onChange])

  // ── Pointer up ─────────────────────────────────────────────────────────────

  const handleMouseUp = useCallback(() => {
    const drag = dragRef.current

    if (drag.type === 'pan') {
      const newData = { ...dataRef.current, pan: panRef.current }
      onChange(newData)
      drag.type = 'none'
      return
    }

    if (drag.type === 'pen' && currentPenRef.current) {
      const pen = currentPenRef.current
      if (pen.points.length > 1) {
        const newData = { ...dataRef.current, elements: [...dataRef.current.elements, pen] }
        commit(newData)
      }
      currentPenRef.current = null
      render()
      drag.type = 'none'
      return
    }

    if (drag.type === 'connector-draw' && currentConnectorRef.current) {
      const conn = currentConnectorRef.current
      const newData = { ...dataRef.current, elements: [...dataRef.current.elements, conn] }
      commit(newData)
      currentConnectorRef.current = null
      render()
      drag.type = 'none'
      return
    }

    if (drag.type === 'move') {
      commit(dataRef.current)
    }
    if (drag.type === 'resize') {
      commit(dataRef.current)
    }

    drag.type = 'none'
  }, [commit, onChange, render])

  // ── Text input ─────────────────────────────────────────────────────────────

  const spawnTextInput = useCallback((wx: number, wy: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const z = zoomRef.current
    const p = panRef.current
    const cx = wx * z + p.x
    const cy = wy * z + p.y

    const id = nanoid()
    editingTextRef.current = id

    const textarea = document.createElement('textarea')
    textarea.style.cssText = `
      position: absolute;
      left: ${cx}px; top: ${cy}px;
      min-width: 100px; min-height: 32px;
      background: rgba(30,30,46,0.95);
      color: #e2e8f0;
      border: 2px solid #3b82f6;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: ${fontSize * z}px;
      font-family: Inter, system-ui, sans-serif;
      resize: both;
      outline: none;
      z-index: 1000;
    `
    canvas.parentElement?.appendChild(textarea)
    textarea.focus()
    textInputRef.current = textarea

    const commit2 = () => {
      const text = textarea.value.trim()
      if (text) {
        const newText: TextElement = {
          id,
          type: 'text',
          x: wx,
          y: wy,
          width: Math.max(textarea.offsetWidth / z, 100),
          height: Math.max(textarea.offsetHeight / z, 32),
          text,
          style: { fontFamily: 'Inter, system-ui, sans-serif', fontSize, fontColor: strokeColor, fontWeight: 'normal', textAlign: 'left', opacity: 1 },
          zIndex: dataRef.current.elements.length,
          locked: false,
        }
        const newData = { ...dataRef.current, elements: [...dataRef.current.elements, newText] }
        commit(newData)
      }
      textarea.remove()
      textInputRef.current = null
      editingTextRef.current = null
    }

    textarea.addEventListener('blur', commit2)
    textarea.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { textarea.remove(); textInputRef.current = null; editingTextRef.current = null }
      if (ev.key === 'Enter' && ev.ctrlKey) { commit2() }
    })
  }, [fontSize, strokeColor, commit])

  // ── Wheel zoom ─────────────────────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    if (e.ctrlKey || e.metaKey) {
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top

      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomRef.current + delta))
      const scale = newZoom / zoomRef.current

      const newPan = {
        x: cx - (cx - panRef.current.x) * scale,
        y: cy - (cy - panRef.current.y) * scale,
      }
      setZoomState(newZoom)
      setPan(newPan)
      zoomRef.current = newZoom
      panRef.current = newPan
      onZoomChange?.(newZoom)
    } else {
      const newPan = { x: panRef.current.x - e.deltaX, y: panRef.current.y - e.deltaY }
      setPan(newPan)
      panRef.current = newPan
    }
  }, [onZoomChange])

  // ── Keyboard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const focused = document.activeElement
      if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedRef.current.length > 0) {
          const newData = {
            ...dataRef.current,
            elements: dataRef.current.elements.filter(el => !selectedRef.current.includes(el.id)),
          }
          commit(newData)
          setSelectedIds([])
          onSelectionChange?.([])
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        const h = historyRef.current
        const idx = historyIndexRef.current
        if (idx > 0) {
          const prev = h[idx - 1]
          if (prev) { historyIndexRef.current = idx - 1; onChange(prev) }
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        const h = historyRef.current
        const idx = historyIndexRef.current
        if (idx < h.length - 1) {
          const next = h[idx + 1]
          if (next) { historyIndexRef.current = idx + 1; onChange(next) }
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        const allIds = dataRef.current.elements.map(el => el.id)
        setSelectedIds(allIds)
        onSelectionChange?.(allIds)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commit, onChange, onSelectionChange])

  // ── Imperative handle ──────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    addShape: (shapeType: ShapeType, atX?: number, atY?: number) => {
      const canvas = canvasRef.current
      const def = ALL_SHAPES.find(s => s.type === shapeType)
      const w = def?.defaultWidth ?? 120
      const h = def?.defaultHeight ?? 60
      const x = atX ?? (canvas ? (canvas.width / 2 - panRef.current.x) / zoomRef.current - w / 2 : 100)
      const y = atY ?? (canvas ? (canvas.height / 2 - panRef.current.y) / zoomRef.current - h / 2 : 100)
      const newShape: ShapeElement = {
        id: nanoid(),
        type: 'shape',
        shapeType,
        x,
        y,
        width: w,
        height: h,
        label: def?.label ?? '',
        style: { ...DEFAULT_STYLE, ...(def?.defaultStyle ?? {}), fill: fillColor, stroke: strokeColor, strokeWidth, fontSize },
        zIndex: dataRef.current.elements.length,
        locked: false,
      }
      const newData = { ...dataRef.current, elements: [...dataRef.current.elements, newShape] }
      commit(newData)
    },

    deleteSelected: () => {
      const newData = {
        ...dataRef.current,
        elements: dataRef.current.elements.filter(el => !selectedRef.current.includes(el.id)),
      }
      commit(newData)
      setSelectedIds([])
    },

    selectAll: () => {
      const allIds = dataRef.current.elements.map(el => el.id)
      setSelectedIds(allIds)
      onSelectionChange?.(allIds)
    },

    clearSelection: () => {
      setSelectedIds([])
      onSelectionChange?.([])
    },

    setZoom: (z: number) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z))
      setZoomState(newZoom)
      zoomRef.current = newZoom
      onZoomChange?.(newZoom)
    },

    fitToScreen: () => {
      const canvas = canvasRef.current
      if (!canvas || dataRef.current.elements.length === 0) return
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const el of dataRef.current.elements) {
        if (el.type === 'shape') { minX = Math.min(minX, el.x); minY = Math.min(minY, el.y); maxX = Math.max(maxX, el.x + el.width); maxY = Math.max(maxY, el.y + el.height) }
        if (el.type === 'text') { minX = Math.min(minX, el.x); minY = Math.min(minY, el.y); maxX = Math.max(maxX, el.x + el.width); maxY = Math.max(maxY, el.y + el.height) }
        if (el.type === 'pen') { for (const pt of el.points) { minX = Math.min(minX, pt.x); minY = Math.min(minY, pt.y); maxX = Math.max(maxX, pt.x); maxY = Math.max(maxY, pt.y) } }
      }
      const pad = 40
      const scaleX = (canvas.width - pad * 2) / (maxX - minX)
      const scaleY = (canvas.height - pad * 2) / (maxY - minY)
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(scaleX, scaleY)))
      const newPan = {
        x: pad + (canvas.width - pad * 2 - (maxX - minX) * newZoom) / 2 - minX * newZoom,
        y: pad + (canvas.height - pad * 2 - (maxY - minY) * newZoom) / 2 - minY * newZoom,
      }
      setZoomState(newZoom)
      setPan(newPan)
      zoomRef.current = newZoom
      panRef.current = newPan
      onZoomChange?.(newZoom)
    },

    undo: () => {
      const h = historyRef.current
      const idx = historyIndexRef.current
      if (idx > 0) { const prev = h[idx - 1]; if (prev) { historyIndexRef.current = idx - 1; onChange(prev) } }
    },

    redo: () => {
      const h = historyRef.current
      const idx = historyIndexRef.current
      if (idx < h.length - 1) { const next = h[idx + 1]; if (next) { historyIndexRef.current = idx + 1; onChange(next) } }
    },

    exportAsPNG: () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = 'whiteboard.png'
      a.click()
    },
  }), [commit, onChange, onSelectionChange, onZoomChange, fillColor, strokeColor, strokeWidth, fontSize])

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: tool === 'hand' ? 'grab' : tool === 'pen' ? 'crosshair' : tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  )
})
