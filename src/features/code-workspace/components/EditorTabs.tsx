import { useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import type { CodeFile } from '../types/code-workspace.types'
import { LANGUAGE_COLORS, LANGUAGE_ICONS } from '../types/code-workspace.types'

interface EditorTabsProps {
  openTabs: string[]
  files: CodeFile[]
  activeTabId: string | null
  dirtyTabs: Record<string, boolean>
  onActivate: (fileId: string) => void
  onClose: (fileId: string) => void
}

export function EditorTabs({
  openTabs, files, activeTabId, dirtyTabs, onActivate, onClose,
}: EditorTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll active tab into view when it changes
  useEffect(() => {
    if (!activeTabId || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-tab="${activeTabId}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeTabId])

  if (openTabs.length === 0) {
    return (
      <div className="h-9 border-b border-zinc-800 bg-zinc-900/60 flex items-center px-4">
        <span className="text-xs text-zinc-600">No files open</span>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex h-9 border-b border-zinc-800 bg-zinc-900/60 overflow-x-auto shrink-0"
      style={{ scrollbarWidth: 'none' }}
    >
      {openTabs.map(tabId => {
        const file = files.find(f => f.id === tabId)
        if (!file) return null
        const isActive = tabId === activeTabId
        const isDirty = !!dirtyTabs[tabId]

        return (
          <div
            key={tabId}
            data-tab={tabId}
            role="tab"
            aria-selected={isActive}
            onClick={() => onActivate(tabId)}
            className={cn(
              'flex items-center gap-1.5 px-3 h-full cursor-pointer border-r border-zinc-800 shrink-0',
              'text-xs transition-colors max-w-[180px] group',
              isActive
                ? 'bg-zinc-800 text-zinc-100 border-t-2 border-t-blue-500'
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300',
            )}
          >
            <span className={cn('font-mono text-[9px] font-bold shrink-0', LANGUAGE_COLORS[file.language])}>
              {LANGUAGE_ICONS[file.language]}
            </span>
            <span className="truncate min-w-0">{file.title}</span>
            {isDirty && !isActive && (
              <span className="text-amber-400 shrink-0 text-[10px]">●</span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClose(tabId) }}
              className={cn(
                'shrink-0 p-0.5 rounded',
                isActive
                  ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-600'
                  : 'text-transparent group-hover:text-zinc-500 hover:!text-zinc-300 hover:bg-zinc-700',
                isDirty && isActive && 'text-amber-400 hover:text-zinc-100',
              )}
              title="Close tab"
            >
              {isDirty && isActive
                ? <span className="text-[10px] font-bold">●</span>
                : <X className="h-3 w-3" />
              }
            </button>
          </div>
        )
      })}
    </div>
  )
}
