import { useState, useEffect, useCallback } from 'react'
import { api } from '@shared/lib/ipc-client'
import type { WhiteboardLink } from '../types/whiteboard.types'

interface EntityOption {
  id: string
  title: string
}

interface Props {
  whiteboardId: string
  links: WhiteboardLink[]
  onAddLink: (entityType: string, entityId: string) => Promise<void>
  onRemoveLink: (entityType: string, entityId: string) => Promise<void>
}

type LinkEntityType = 'skill' | 'lab' | 'document' | 'project'

const ENTITY_TYPES: { type: LinkEntityType; label: string; plural: string }[] = [
  { type: 'skill',    label: 'Skill',    plural: 'Skills' },
  { type: 'lab',      label: 'Lab',      plural: 'Home Labs' },
  { type: 'document', label: 'Document', plural: 'Documents' },
  { type: 'project',  label: 'Project',  plural: 'Projects' },
]

export function LinkPanel({ links, onAddLink, onRemoveLink }: Props) {
  const [activeType, setActiveType] = useState<LinkEntityType>('skill')
  const [options, setOptions] = useState<EntityOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [search, setSearch] = useState('')

  const fetchOptions = useCallback(async (type: LinkEntityType) => {
    setLoadingOptions(true)
    setOptions([])
    try {
      let items: EntityOption[] = []
      if (type === 'skill') {
        const r = await api.skills.getAll() as { success: boolean; data?: { items?: Array<{ id: string; name: string }> } }
        if (r.success && r.data?.items) items = r.data.items.map(s => ({ id: s.id, title: s.name }))
      } else if (type === 'lab') {
        const r = await api.homeLabs.getAll() as { success: boolean; data?: { items?: Array<{ id: string; title: string }> } }
        if (r.success && r.data?.items) items = r.data.items.map(l => ({ id: l.id, title: l.title }))
      } else if (type === 'document') {
        const r = await api.documents.getAll() as { success: boolean; data?: { items?: Array<{ id: string; title: string }> } }
        if (r.success && r.data?.items) items = r.data.items.map(d => ({ id: d.id, title: d.title }))
      } else if (type === 'project') {
        const r = await api.projects.getAll() as { success: boolean; data?: { items?: Array<{ id: string; title: string }> } }
        if (r.success && r.data?.items) items = r.data.items.map(p => ({ id: p.id, title: p.title }))
      }
      setOptions(items)
    } finally {
      setLoadingOptions(false)
    }
  }, [])

  useEffect(() => {
    void fetchOptions(activeType)
    setSearch('')
  }, [activeType, fetchOptions])

  const linkedIds = links.filter(l => l.entity_type === activeType).map(l => l.entity_id)

  const filtered = options.filter(o => o.title.toLowerCase().includes(search.toLowerCase()))

  const toggle = async (item: EntityOption) => {
    const linked = linkedIds.includes(item.id)
    if (linked) {
      await onRemoveLink(activeType, item.id)
    } else {
      await onAddLink(activeType, item.id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-zinc-700">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Linked Resources</p>

        {/* Total linked count */}
        <div className="flex gap-1 flex-wrap mb-2">
          {links.length === 0 ? (
            <span className="text-[10px] text-zinc-600">No links yet</span>
          ) : (
            <span className="text-[10px] text-zinc-400">{links.length} link{links.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Type tabs */}
        <div className="flex gap-0.5 flex-wrap">
          {ENTITY_TYPES.map(et => (
            <button
              key={et.type}
              type="button"
              onClick={() => setActiveType(et.type)}
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                activeType === et.type
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {et.label} ({links.filter(l => l.entity_type === et.type).length})
            </button>
          ))}
        </div>
      </div>

      <div className="p-2 border-b border-zinc-700">
        <input
          type="text"
          placeholder={`Search ${ENTITY_TYPES.find(e => e.type === activeType)?.plural ?? ''}…`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {loadingOptions ? (
          <p className="text-[10px] text-zinc-600 text-center py-4">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-[10px] text-zinc-600 text-center py-4">Nothing found</p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map(item => {
              const linked = linkedIds.includes(item.id)
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void toggle(item)}
                    className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-[11px] transition-colors ${
                      linked
                        ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                        : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-sm border shrink-0 flex items-center justify-center ${
                      linked ? 'bg-blue-600 border-blue-600' : 'border-zinc-600'
                    }`}>
                      {linked && (
                        <svg viewBox="0 0 8 8" className="w-2 h-2 text-white" fill="currentColor">
                          <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
