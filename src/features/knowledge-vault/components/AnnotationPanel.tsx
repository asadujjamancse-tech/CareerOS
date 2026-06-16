/**
 * AnnotationPanel — right-side panel in the PDF reader listing all annotations.
 *
 * Features:
 *  - Tabs: All / Highlights / Notes / Bookmarks
 *  - Grouped by page number (ascending)
 *  - Color-coded by knowledge color
 *  - Click annotation → scrolls reader to that page
 *  - Inline edit note content
 *  - Delete annotation
 *  - Empty states per tab
 */

import { useState } from 'react'
import {
  Highlighter, MessageSquare, Bookmark, X, Trash2,
  Pencil, Check, List, ChevronRight,
} from 'lucide-react'
import type { VaultAnnotation, KnowledgeColor } from '../types/vault.types'
import { formatRelativeDate } from '@shared/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type PanelTab = 'all' | 'highlight' | 'note' | 'bookmark'

export interface AnnotationPanelProps {
  annotations: VaultAnnotation[]
  colors: KnowledgeColor[]
  onNavigate: (pageNumber: number) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, content: string) => void
  onClose: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TAB_CONFIG: { key: PanelTab; label: string; icon: React.ReactNode }[] = [
  { key: 'all',       label: 'All',       icon: <List        className="h-3.5 w-3.5" /> },
  { key: 'highlight', label: 'Highlights', icon: <Highlighter className="h-3.5 w-3.5" /> },
  { key: 'note',      label: 'Notes',      icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { key: 'bookmark',  label: 'Bookmarks',  icon: <Bookmark    className="h-3.5 w-3.5" /> },
]

function typeIcon(type: VaultAnnotation['type']): React.ReactNode {
  if (type === 'highlight') return <Highlighter className="h-3 w-3 shrink-0" />
  if (type === 'note' || type === 'comment') return <MessageSquare className="h-3 w-3 shrink-0" />
  if (type === 'bookmark') return <Bookmark className="h-3 w-3 shrink-0 fill-current" />
  return null
}

function emptyLabel(tab: PanelTab): string {
  if (tab === 'highlight') return 'No highlights yet.\nDrag over text to highlight.'
  if (tab === 'note')      return 'No notes yet.\nClick anywhere on a page to add a note.'
  if (tab === 'bookmark')  return 'No bookmarks yet.\nClick the bookmark button to save a page.'
  return 'No annotations yet.\nEnable Annotate mode to start.'
}

// ── Annotation Card ───────────────────────────────────────────────────────────

function AnnotationCard({
  ann,
  onNavigate,
  onDelete,
  onUpdate,
}: {
  ann: VaultAnnotation
  onNavigate: (page: number) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, content: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(ann.content ?? '')

  const isBookmark = ann.type === 'bookmark'

  return (
    <div className="group rounded-lg border border-zinc-700/50 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors overflow-hidden">
      {/* Color bar + header */}
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer"
        style={{ borderLeft: `3px solid ${ann.color_hex}` }}
        onClick={() => { if (ann.page_number) onNavigate(ann.page_number) }}
      >
        <span style={{ color: ann.color_hex }}>
          {typeIcon(ann.type)}
        </span>
        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex-1">
          {ann.color_meaning ?? ann.type}
        </span>
        {ann.page_number && (
          <div className="flex items-center gap-0.5 text-[10px] text-zinc-500">
            <span>p.{ann.page_number}</span>
            <ChevronRight className="h-3 w-3 opacity-50" />
          </div>
        )}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDelete(ann.id) }}
          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Selected text preview */}
      {!isBookmark && ann.selected_text && (
        <p
          className="px-3 pb-1 text-[11px] text-zinc-400 italic leading-relaxed"
          style={{ borderLeft: `3px solid ${ann.color_hex}40` }}
        >
          "{ann.selected_text.length > 100
            ? ann.selected_text.slice(0, 100) + '…'
            : ann.selected_text}"
        </p>
      )}

      {/* Note content */}
      {!isBookmark && (
        <div className="px-2.5 pb-2" style={{ borderLeft: `3px solid ${ann.color_hex}40` }}>
          {editing ? (
            <div className="space-y-1.5 mt-1">
              <textarea
                autoFocus
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                className="w-full text-xs rounded border border-zinc-600 bg-zinc-900 text-zinc-200 px-2 py-1 focus:outline-none resize-none"
              />
              <div className="flex gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setText(ann.content ?? '') }}
                  className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-200 rounded"
                >Cancel</button>
                <button
                  type="button"
                  onClick={() => { onUpdate(ann.id, text); setEditing(false) }}
                  className="h-6 px-2 text-xs bg-primary text-primary-foreground rounded flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 mt-0.5">
              <p className="flex-1 text-xs text-zinc-300 leading-relaxed">
                {ann.content
                  ? ann.content.length > 120 ? ann.content.slice(0, 120) + '…' : ann.content
                  : <span className="italic text-zinc-500">No note</span>}
              </p>
              {ann.type !== 'highlight' && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 mt-0.5 shrink-0"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timestamp */}
      <p className="px-2.5 pb-1.5 text-[10px] text-zinc-600"
         style={{ borderLeft: `3px solid ${ann.color_hex}40` }}
      >
        {formatRelativeDate(ann.created_at)}
      </p>
    </div>
  )
}

// ── Summary Stats ─────────────────────────────────────────────────────────────

function SummaryBar({ annotations }: { annotations: VaultAnnotation[] }) {
  const highlights = annotations.filter(a => a.type === 'highlight').length
  const notes = annotations.filter(a => a.type === 'note' || a.type === 'comment').length
  const bookmarks = annotations.filter(a => a.type === 'bookmark').length

  if (!annotations.length) return null

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-zinc-700/50 text-[10px] text-zinc-400">
      <span className="flex items-center gap-1">
        <Highlighter className="h-3 w-3 text-amber-400" />{highlights}
      </span>
      <span className="flex items-center gap-1">
        <MessageSquare className="h-3 w-3 text-blue-400" />{notes}
      </span>
      <span className="flex items-center gap-1">
        <Bookmark className="h-3 w-3 text-amber-400 fill-amber-400" />{bookmarks}
      </span>
      <span className="ml-auto">{annotations.length} total</span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function AnnotationPanel({
  annotations,
  colors,
  onNavigate,
  onDelete,
  onUpdate,
  onClose,
}: AnnotationPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('all')

  // Filter by active tab
  const filtered = annotations.filter(ann => {
    if (activeTab === 'all') return true
    if (activeTab === 'highlight') return ann.type === 'highlight'
    if (activeTab === 'note') return ann.type === 'note' || ann.type === 'comment'
    if (activeTab === 'bookmark') return ann.type === 'bookmark'
    return true
  })

  // Group by page
  const grouped = filtered.reduce<Map<number, VaultAnnotation[]>>((map, ann) => {
    const page = ann.page_number ?? 0
    if (!map.has(page)) map.set(page, [])
    map.get(page)!.push(ann)
    return map
  }, new Map())

  const pages = [...grouped.keys()].sort((a, b) => a - b)

  // Counts per tab for badge
  const countFor = (tab: PanelTab) => {
    if (tab === 'all') return annotations.length
    if (tab === 'highlight') return annotations.filter(a => a.type === 'highlight').length
    if (tab === 'note') return annotations.filter(a => a.type === 'note' || a.type === 'comment').length
    if (tab === 'bookmark') return annotations.filter(a => a.type === 'bookmark').length
    return 0
  }

  void colors

  return (
    <div className="flex flex-col h-full w-72 shrink-0 border-l border-zinc-700 bg-zinc-900 text-zinc-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-700 shrink-0">
        <Highlighter className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-medium flex-1">Annotations</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Summary bar */}
      <SummaryBar annotations={annotations} />

      {/* Tabs */}
      <div className="flex border-b border-zinc-700 shrink-0">
        {TAB_CONFIG.map(tab => {
          const count = countFor(tab.key)
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`text-[9px] font-bold tabular-nums ${activeTab === tab.key ? 'text-primary' : 'text-zinc-600'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Annotation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 px-4 text-center">
            <p className="text-xs text-zinc-500 whitespace-pre-line">{emptyLabel(activeTab)}</p>
          </div>
        ) : (
          <div className="p-2 space-y-3">
            {pages.map(page => (
              <div key={page}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-1 pb-1">
                  {page === 0 ? 'No page' : `Page ${page}`}
                </p>
                <div className="space-y-1.5">
                  {(grouped.get(page) ?? []).map(ann => (
                    <AnnotationCard
                      key={ann.id}
                      ann={ann}
                      onNavigate={onNavigate}
                      onDelete={onDelete}
                      onUpdate={onUpdate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
