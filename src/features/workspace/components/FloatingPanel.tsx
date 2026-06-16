/**
 * FloatingPanel — rendered inside an always-on-top Electron BrowserWindow.
 *
 * The Electron main process calls createFloatingWindow(type, params) which
 * loads this route: #/workspace/float?type=NotesPanel&entityId=abc
 *
 * The window has no frame and no traffic lights, so we render our own
 * title bar with drag region + close button.
 */
import { useEffect, useState, useRef } from 'react'
import { X, GripHorizontal } from 'lucide-react'
import { api } from '@shared/lib/ipc-client'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { cn } from '@shared/lib/utils'
import type { WorkspacePanelComponent } from '../types/workspace.types'

// ── Query-param helpers ───────────────────────────────────────────────────────

function getParams(): { type: WorkspacePanelComponent; entityId?: string; url?: string; title?: string } {
  const q = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  const result: { type: WorkspacePanelComponent; entityId?: string; url?: string; title?: string } = {
    type: (q.get('type') ?? 'NotesPanel') as WorkspacePanelComponent,
  }
  const entityId = q.get('entityId')
  const url = q.get('url')
  const title = q.get('title')
  if (entityId) result.entityId = entityId
  if (url) result.url = url
  if (title) result.title = title
  return result
}

// ── Always-on-top title bar ───────────────────────────────────────────────────

function FloatTitleBar({ title }: { title: string }) {
  const close = () => {
    // In Electron the window was opened by the main process; close via standard API
    window.close()
  }

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 bg-card border-b border-border shrink-0 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="flex-1 text-xs font-medium text-foreground truncate">{title}</span>
      <button
        type="button"
        onClick={close}
        title="Close"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

// ── Floating notes ────────────────────────────────────────────────────────────

function FloatingNotes({ entityId, title }: { entityId?: string; title?: string }) {
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (entityId) {
      void api.notes.getById(entityId).then(r => {
        if (r.success) setContent((r.data as { content: string }).content ?? '')
      })
    }
  }, [entityId])

  const handleChange = (val: string) => {
    setContent(val)
    if (!entityId) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIsSaving(true)
      void api.notes.update(entityId, { content: val }).then(() => setIsSaving(false))
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full">
      <FloatTitleBar title={title ?? (entityId ? 'Linked Note' : 'Floating Notes')} />
      <div className="flex items-center justify-between px-3 py-1 border-b border-border bg-muted/30 shrink-0">
        <span className="text-[10px] text-muted-foreground">{entityId ? 'Auto-saving…' : 'Session notes (not persisted)'}</span>
        {isSaving && <span className="text-[10px] text-muted-foreground animate-pulse">Saving…</span>}
      </div>
      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        placeholder="Start typing…"
        className="flex-1 resize-none bg-background text-sm font-mono p-3 border-0 outline-none leading-relaxed text-foreground placeholder:text-muted-foreground/50"
      />
    </div>
  )
}

// ── Floating video ────────────────────────────────────────────────────────────

function FloatingVideo({ url: initialUrl, title }: { url?: string; title?: string }) {
  const [url, setUrl] = useState(initialUrl ?? '')
  const [input, setInput] = useState(initialUrl ?? '')

  const embedUrl = url
    ? (() => {
        try {
          const u = new URL(url)
          if (u.hostname === 'youtu.be' || u.hostname.includes('youtube.com')) {
            const id = u.searchParams.get('v') ?? u.pathname.slice(1)
            return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
          }
          if (u.hostname.includes('vimeo.com')) {
            const id = u.pathname.replace(/^\//, '').split('/')[0]
            return `https://player.vimeo.com/video/${id}?autoplay=1`
          }
        } catch { /* ignore */ }
        return null
      })()
    : null

  const load = () => { if (input.trim()) setUrl(input.trim()) }

  return (
    <div className="flex flex-col h-full bg-black">
      <FloatTitleBar title={title ?? 'Floating Video'} />
      <div className="flex items-center gap-1 px-2 py-1 bg-zinc-900 shrink-0">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          className="flex-1 h-6 text-xs bg-zinc-800 border-zinc-700 text-zinc-300"
          placeholder="YouTube or Vimeo URL…"
        />
        <Button onClick={load} size="sm" variant="secondary" className="h-6 text-xs">Load</Button>
      </div>
      {embedUrl ? (
        <div className="relative flex-1">
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={title ?? 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      ) : url ? (
        <div className="flex-1 flex items-center justify-center text-white/50 text-sm">Cannot embed this URL</div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/30 text-xs">Paste a video URL above</div>
      )}
    </div>
  )
}

// ── Floating tasks ────────────────────────────────────────────────────────────

function FloatingTasks({ title }: { title?: string }) {
  const [tasks, setTasks] = useState<Array<{ id: string; text: string; done: boolean }>>([])
  const [newTask, setNewTask] = useState('')

  const add = () => {
    if (!newTask.trim()) return
    setTasks(t => [...t, { id: Date.now().toString(), text: newTask.trim(), done: false }])
    setNewTask('')
  }
  const toggle = (id: string) => setTasks(t => t.map(task => task.id === id ? { ...task, done: !task.done } : task))
  const remove = (id: string) => setTasks(t => t.filter(task => task.id !== id))
  const done = tasks.filter(t => t.done).length

  return (
    <div className="flex flex-col h-full">
      <FloatTitleBar title={title ?? 'Floating Tasks'} />
      <div className="flex items-center justify-between px-3 py-1 border-b border-border bg-card shrink-0">
        <span className="text-[10px] text-muted-foreground">Checklist</span>
        {tasks.length > 0 && <span className="text-[10px] text-muted-foreground">{done}/{tasks.length}</span>}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground/40 text-xs">Add tasks below</div>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map(task => (
              <li key={task.id} className="group flex items-center gap-2 px-3 py-2 hover:bg-accent/30">
                <button type="button" onClick={() => toggle(task.id)}>
                  <div className={cn('h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
                    task.done ? 'bg-primary border-primary text-primary-foreground' : 'border-border')}>
                    {task.done && <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>}
                  </div>
                </button>
                <span className={cn('text-xs flex-1', task.done && 'line-through text-muted-foreground')}>{task.text}</span>
                <button type="button" onClick={() => remove(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex gap-1.5 p-2 border-t border-border shrink-0">
        <Input value={newTask} onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add a task…" className="flex-1 h-7 text-xs" />
        <Button onClick={add} size="icon-sm" variant="secondary"><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  )
}

function Plus({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function FloatingPanel() {
  const params = getParams()

  switch (params.type) {
    case 'NotesPanel':
      return <FloatingNotes {...(params.entityId ? { entityId: params.entityId } : {})} {...(params.title ? { title: params.title } : {})} />
    case 'VideoPanel':
      return <FloatingVideo {...(params.url ? { url: params.url } : {})} {...(params.title ? { title: params.title } : {})} />
    case 'TasksPanel':
      return <FloatingTasks {...(params.title ? { title: params.title } : {})} />
    default:
      return (
        <div className="flex flex-col h-full">
          <FloatTitleBar title={params.title ?? params.type} />
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Floating {params.type.replace('Panel', '')}
          </div>
        </div>
      )
  }
}
