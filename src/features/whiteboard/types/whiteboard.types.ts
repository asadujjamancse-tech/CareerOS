// ── Board & Tool Types ────────────────────────────────────────────────────────

export type BoardType =
  | 'free-drawing'
  | 'mind-map'
  | 'network'
  | 'azure'
  | 'active-directory'
  | 'flowchart'

export type ToolType =
  | 'select'
  | 'hand'
  | 'pen'
  | 'shape'
  | 'connector'
  | 'text'
  | 'image'
  | 'eraser'

export type ShapeType =
  // Generic
  | 'rectangle'
  | 'rounded-rect'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'cylinder'
  | 'parallelogram'
  | 'hexagon'
  | 'cloud'
  | 'star'
  // Flowchart
  | 'fc-process'
  | 'fc-decision'
  | 'fc-start-end'
  | 'fc-io'
  | 'fc-document'
  | 'fc-subroutine'
  | 'fc-data'
  | 'fc-database'
  // Network
  | 'net-server'
  | 'net-switch'
  | 'net-router'
  | 'net-firewall'
  | 'net-workstation'
  | 'net-cloud'
  | 'net-database'
  | 'net-internet'
  // Azure
  | 'az-vm'
  | 'az-storage'
  | 'az-app-service'
  | 'az-sql'
  | 'az-vnet'
  | 'az-subnet'
  | 'az-rg'
  | 'az-aks'
  | 'az-function'
  | 'az-keyvault'
  | 'az-lb'
  | 'az-nsg'
  // Active Directory
  | 'ad-domain'
  | 'ad-ou'
  | 'ad-user'
  | 'ad-group'
  | 'ad-computer'
  | 'ad-gpo'
  | 'ad-site'
  | 'ad-dc'
  | 'ad-forest'
  // Mind Map
  | 'mm-root'
  | 'mm-branch'
  | 'mm-leaf'

export type ElementType = 'pen' | 'shape' | 'text' | 'image' | 'connector'

// ── Canvas Data Structures ────────────────────────────────────────────────────

export interface Point {
  x: number
  y: number
}

export interface ElementStyle {
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  fontFamily: string
  fontSize: number
  fontColor: string
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  dashed: boolean
  cornerRadius: number
}

export interface PenElement {
  id: string
  type: 'pen'
  points: Point[]
  style: Pick<ElementStyle, 'stroke' | 'strokeWidth' | 'opacity' | 'dashed'>
  zIndex: number
  locked: boolean
}

export interface ShapeElement {
  id: string
  type: 'shape'
  shapeType: ShapeType
  x: number
  y: number
  width: number
  height: number
  label: string
  style: ElementStyle
  zIndex: number
  locked: boolean
}

export interface TextElement {
  id: string
  type: 'text'
  x: number
  y: number
  width: number
  height: number
  text: string
  style: Pick<ElementStyle, 'fontFamily' | 'fontSize' | 'fontColor' | 'fontWeight' | 'textAlign' | 'opacity'>
  zIndex: number
  locked: boolean
}

export interface ImageElement {
  id: string
  type: 'image'
  x: number
  y: number
  width: number
  height: number
  src: string
  style: Pick<ElementStyle, 'opacity'>
  zIndex: number
  locked: boolean
}

export interface ConnectorElement {
  id: string
  type: 'connector'
  fromId: string | null
  toId: string | null
  fromPoint: Point
  toPoint: Point
  waypoints: Point[]
  startArrow: 'none' | 'arrow' | 'filled' | 'circle'
  endArrow: 'none' | 'arrow' | 'filled' | 'circle'
  label: string
  style: Pick<ElementStyle, 'stroke' | 'strokeWidth' | 'opacity' | 'dashed' | 'fontFamily' | 'fontSize' | 'fontColor'>
  zIndex: number
  locked: boolean
}

export type CanvasElement =
  | PenElement
  | ShapeElement
  | TextElement
  | ImageElement
  | ConnectorElement

export interface CanvasData {
  version: '1'
  background: string
  zoom: number
  pan: Point
  elements: CanvasElement[]
}

// ── Domain Types ─────────────────────────────────────────────────────────────

export interface Whiteboard {
  id: string
  title: string
  board_type: BoardType
  description: string | null
  canvas_data: string
  created_at: string
  updated_at: string
}

export interface WhiteboardSummary {
  id: string
  title: string
  board_type: BoardType
  description: string | null
  created_at: string
  updated_at: string
}

export interface WhiteboardLink {
  id: string
  whiteboard_id: string
  entity_type: 'skill' | 'lab' | 'document' | 'project'
  entity_id: string
  created_at: string
}

export interface CreateWhiteboardInput {
  title: string
  board_type?: BoardType
  description?: string | null
}

export interface UpdateWhiteboardInput {
  title?: string
  board_type?: BoardType
  description?: string | null
}

// ── Default Values ────────────────────────────────────────────────────────────

export const DEFAULT_STYLE: ElementStyle = {
  fill: '#3b4a6b',
  stroke: '#6b8cda',
  strokeWidth: 2,
  opacity: 1,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 13,
  fontColor: '#e2e8f0',
  fontWeight: 'normal',
  textAlign: 'center',
  dashed: false,
  cornerRadius: 4,
}

export const DEFAULT_CONNECTOR_STYLE: ConnectorElement['style'] = {
  stroke: '#94a3b8',
  strokeWidth: 2,
  opacity: 1,
  dashed: false,
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 12,
  fontColor: '#94a3b8',
}

export const DEFAULT_CANVAS_DATA: CanvasData = {
  version: '1',
  background: '#1e1e2e',
  zoom: 1,
  pan: { x: 0, y: 0 },
  elements: [],
}

// ── Labels & Metadata ─────────────────────────────────────────────────────────

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  'free-drawing':    'Free Drawing',
  'mind-map':        'Mind Map',
  'network':         'Network Diagram',
  'azure':           'Azure Architecture',
  'active-directory':'Active Directory',
  'flowchart':       'Flow Chart',
}

export const BOARD_TYPE_COLORS: Record<BoardType, string> = {
  'free-drawing':    '#8b5cf6',
  'mind-map':        '#06b6d4',
  'network':         '#f59e0b',
  'azure':           '#3b82f6',
  'active-directory':'#10b981',
  'flowchart':       '#ef4444',
}

// ── Shape Palettes per Board Type ─────────────────────────────────────────────

export interface ShapeDef {
  type: ShapeType
  label: string
  defaultWidth: number
  defaultHeight: number
  defaultStyle: Partial<ElementStyle>
}

const BASE_SHAPES: ShapeDef[] = [
  { type: 'rectangle',    label: 'Rectangle',    defaultWidth: 120, defaultHeight: 60,  defaultStyle: {} },
  { type: 'rounded-rect', label: 'Rounded Rect', defaultWidth: 120, defaultHeight: 60,  defaultStyle: { cornerRadius: 12 } },
  { type: 'circle',       label: 'Circle',       defaultWidth: 80,  defaultHeight: 80,  defaultStyle: {} },
  { type: 'diamond',      label: 'Diamond',      defaultWidth: 100, defaultHeight: 80,  defaultStyle: {} },
  { type: 'triangle',     label: 'Triangle',     defaultWidth: 100, defaultHeight: 80,  defaultStyle: {} },
  { type: 'cylinder',     label: 'Cylinder',     defaultWidth: 80,  defaultHeight: 100, defaultStyle: {} },
  { type: 'parallelogram',label: 'Parallelogram',defaultWidth: 120, defaultHeight: 60,  defaultStyle: {} },
  { type: 'hexagon',      label: 'Hexagon',      defaultWidth: 100, defaultHeight: 80,  defaultStyle: {} },
  { type: 'cloud',        label: 'Cloud',        defaultWidth: 140, defaultHeight: 80,  defaultStyle: {} },
  { type: 'star',         label: 'Star',         defaultWidth: 80,  defaultHeight: 80,  defaultStyle: {} },
]

const FLOWCHART_SHAPES: ShapeDef[] = [
  { type: 'fc-start-end', label: 'Start / End',   defaultWidth: 120, defaultHeight: 50,  defaultStyle: { fill: '#1a4731', stroke: '#10b981' } },
  { type: 'fc-process',   label: 'Process',        defaultWidth: 130, defaultHeight: 55,  defaultStyle: { fill: '#1e3a5f', stroke: '#3b82f6' } },
  { type: 'fc-decision',  label: 'Decision',       defaultWidth: 120, defaultHeight: 80,  defaultStyle: { fill: '#451a03', stroke: '#f97316' } },
  { type: 'fc-io',        label: 'Input / Output', defaultWidth: 130, defaultHeight: 55,  defaultStyle: { fill: '#2d1657', stroke: '#8b5cf6' } },
  { type: 'fc-document',  label: 'Document',       defaultWidth: 130, defaultHeight: 60,  defaultStyle: { fill: '#1c2e4a', stroke: '#60a5fa' } },
  { type: 'fc-subroutine',label: 'Subroutine',     defaultWidth: 140, defaultHeight: 55,  defaultStyle: { fill: '#1e3a5f', stroke: '#93c5fd' } },
  { type: 'fc-database',  label: 'Database',       defaultWidth: 80,  defaultHeight: 100, defaultStyle: { fill: '#1a3a3a', stroke: '#2dd4bf' } },
  { type: 'fc-data',      label: 'Data Store',     defaultWidth: 120, defaultHeight: 55,  defaultStyle: { fill: '#1a3a3a', stroke: '#34d399' } },
]

const NETWORK_SHAPES: ShapeDef[] = [
  { type: 'net-server',      label: 'Server',      defaultWidth: 80, defaultHeight: 80,  defaultStyle: { fill: '#1e3a5f', stroke: '#3b82f6' } },
  { type: 'net-switch',      label: 'Switch',      defaultWidth: 80, defaultHeight: 60,  defaultStyle: { fill: '#1a4731', stroke: '#10b981' } },
  { type: 'net-router',      label: 'Router',      defaultWidth: 80, defaultHeight: 80,  defaultStyle: { fill: '#451a03', stroke: '#f97316' } },
  { type: 'net-firewall',    label: 'Firewall',    defaultWidth: 80, defaultHeight: 80,  defaultStyle: { fill: '#450a0a', stroke: '#ef4444' } },
  { type: 'net-workstation', label: 'Workstation', defaultWidth: 80, defaultHeight: 80,  defaultStyle: { fill: '#2d1657', stroke: '#8b5cf6' } },
  { type: 'net-cloud',       label: 'Cloud',       defaultWidth: 140, defaultHeight: 80, defaultStyle: { fill: '#172554', stroke: '#60a5fa' } },
  { type: 'net-database',    label: 'Database',    defaultWidth: 80, defaultHeight: 100, defaultStyle: { fill: '#1a3a3a', stroke: '#2dd4bf' } },
  { type: 'net-internet',    label: 'Internet',    defaultWidth: 100, defaultHeight: 100,defaultStyle: { fill: '#172554', stroke: '#38bdf8' } },
]

const AZURE_SHAPES: ShapeDef[] = [
  { type: 'az-vm',          label: 'Virtual Machine', defaultWidth: 100, defaultHeight: 80, defaultStyle: { fill: '#1e3a5f', stroke: '#0078d4' } },
  { type: 'az-storage',     label: 'Storage',         defaultWidth: 80,  defaultHeight: 80, defaultStyle: { fill: '#1a3a3a', stroke: '#0091ea' } },
  { type: 'az-app-service', label: 'App Service',     defaultWidth: 100, defaultHeight: 80, defaultStyle: { fill: '#1a4731', stroke: '#00b09a' } },
  { type: 'az-sql',         label: 'SQL Database',    defaultWidth: 80,  defaultHeight: 100,defaultStyle: { fill: '#1a3a3a', stroke: '#0078d4' } },
  { type: 'az-vnet',        label: 'VNet',            defaultWidth: 160, defaultHeight: 120,defaultStyle: { fill: '#0d1f3c', stroke: '#0078d4' } },
  { type: 'az-subnet',      label: 'Subnet',          defaultWidth: 140, defaultHeight: 100,defaultStyle: { fill: '#0d2b1f', stroke: '#00b09a' } },
  { type: 'az-rg',          label: 'Resource Group',  defaultWidth: 200, defaultHeight: 140,defaultStyle: { fill: '#1a1a2e', stroke: '#6b7280' } },
  { type: 'az-aks',         label: 'AKS',             defaultWidth: 100, defaultHeight: 80, defaultStyle: { fill: '#1e3a5f', stroke: '#326ce5' } },
  { type: 'az-function',    label: 'Function App',    defaultWidth: 100, defaultHeight: 80, defaultStyle: { fill: '#2d1657', stroke: '#8b5cf6' } },
  { type: 'az-keyvault',    label: 'Key Vault',       defaultWidth: 80,  defaultHeight: 80, defaultStyle: { fill: '#451a03', stroke: '#f59e0b' } },
  { type: 'az-lb',          label: 'Load Balancer',   defaultWidth: 100, defaultHeight: 80, defaultStyle: { fill: '#1e3a5f', stroke: '#38bdf8' } },
  { type: 'az-nsg',         label: 'NSG',             defaultWidth: 80,  defaultHeight: 80, defaultStyle: { fill: '#450a0a', stroke: '#ef4444' } },
]

const AD_SHAPES: ShapeDef[] = [
  { type: 'ad-forest',   label: 'Forest',     defaultWidth: 180, defaultHeight: 140,defaultStyle: { fill: '#0d1f3c', stroke: '#3b82f6' } },
  { type: 'ad-domain',   label: 'Domain',     defaultWidth: 160, defaultHeight: 120,defaultStyle: { fill: '#1e3a5f', stroke: '#60a5fa' } },
  { type: 'ad-site',     label: 'Site',       defaultWidth: 140, defaultHeight: 100,defaultStyle: { fill: '#1a4731', stroke: '#10b981' } },
  { type: 'ad-ou',       label: 'OU',         defaultWidth: 130, defaultHeight: 90, defaultStyle: { fill: '#2d1657', stroke: '#8b5cf6' } },
  { type: 'ad-dc',       label: 'Domain Controller',defaultWidth:80,defaultHeight:80,defaultStyle: { fill: '#1e3a5f', stroke: '#93c5fd' } },
  { type: 'ad-user',     label: 'User',       defaultWidth: 60,  defaultHeight: 60, defaultStyle: { fill: '#1a4731', stroke: '#34d399' } },
  { type: 'ad-group',    label: 'Group',      defaultWidth: 70,  defaultHeight: 60, defaultStyle: { fill: '#451a03', stroke: '#f97316' } },
  { type: 'ad-computer', label: 'Computer',   defaultWidth: 70,  defaultHeight: 70, defaultStyle: { fill: '#1a3a3a', stroke: '#2dd4bf' } },
  { type: 'ad-gpo',      label: 'GPO',        defaultWidth: 80,  defaultHeight: 60, defaultStyle: { fill: '#450a0a', stroke: '#ef4444' } },
]

const MINDMAP_SHAPES: ShapeDef[] = [
  { type: 'mm-root',   label: 'Root Node',   defaultWidth: 160, defaultHeight: 60, defaultStyle: { fill: '#2d1657', stroke: '#a78bfa', cornerRadius: 30, fontSize: 16, fontWeight: 'bold' } },
  { type: 'mm-branch', label: 'Branch Node', defaultWidth: 130, defaultHeight: 48, defaultStyle: { fill: '#1e3a5f', stroke: '#60a5fa', cornerRadius: 24 } },
  { type: 'mm-leaf',   label: 'Leaf Node',   defaultWidth: 110, defaultHeight: 40, defaultStyle: { fill: '#1a3a3a', stroke: '#34d399', cornerRadius: 20 } },
]

export const SHAPE_PALETTES: Record<BoardType, ShapeDef[]> = {
  'free-drawing':     BASE_SHAPES,
  'flowchart':        FLOWCHART_SHAPES,
  'network':          NETWORK_SHAPES,
  'azure':            AZURE_SHAPES,
  'active-directory': AD_SHAPES,
  'mind-map':         MINDMAP_SHAPES,
}

export const ALL_SHAPES: ShapeDef[] = [
  ...BASE_SHAPES,
  ...FLOWCHART_SHAPES,
  ...NETWORK_SHAPES,
  ...AZURE_SHAPES,
  ...AD_SHAPES,
  ...MINDMAP_SHAPES,
]
