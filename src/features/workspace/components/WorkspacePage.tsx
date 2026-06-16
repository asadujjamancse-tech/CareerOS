import 'dockview/dist/styles/dockview.css'
import { useEffect, useRef, useCallback, useState } from 'react'
import {
  DockviewReact,
  DockviewDefaultTab,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
  type IDockviewHeaderActionsProps,
  type IDockviewPanelHeaderProps,
  type DockviewApi,
} from 'dockview'
import {
  PanelLeft, Plus, X, Globe, Video, FileText, ListVideo,
  CheckSquare, ChevronDown, ExternalLink, RefreshCw,
  ArrowLeft, ArrowRight, Search, BookOpen, Maximize2,
  Minimize2, PanelTopOpen, Save, Trash2,
} from 'lucide-react'
import { api } from '@shared/lib/ipc-client'

interface ElectronWebview {
  goBack(): void
  goForward(): void
  reload(): void
}
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { cn } from '@shared/lib/utils'
import { useWorkspaceStore } from '../store/workspace.store'
import type {
  BrowserPanelParams,
  VideoPanelParams,
  NotesPanelParams,
  PlaylistPanelParams,
  TasksPanelParams,
  SidebarResource,
  WorkspaceTab,
  OpenPanelRequest,
} from '../types/workspace.types'

// ── Video embed helpers ───────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0] || null
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null
    }
    return null
  } catch { return null }
}

function extractVimeoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'vimeo.com' || u.hostname === 'www.vimeo.com')
      return u.pathname.replace(/^\//, '').split('/')[0] || null
    if (u.hostname === 'player.vimeo.com') return u.pathname.split('/')[2] || null
    return null
  } catch { return null }
}

function getVideoEmbedUrl(url: string): string | null {
  const ytId = extractYouTubeId(url)
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`
  const vimId = extractVimeoId(url)
  if (vimId) return `https://player.vimeo.com/video/${vimId}?autoplay=1`
  return null
}

// ── Browser panel ─────────────────────────────────────────────────────────────

function BrowserPanelDV({ params, api: panelApi }: IDockviewPanelProps<BrowserPanelParams>) {
  const webviewRef = useRef<HTMLElement>(null)
  const [inputUrl, setInputUrl] = useState(params.url ?? '')
  const [currentUrl, setCurrentUrl] = useState(params.url ?? '')
  const isElectron = 'api' in window

  const navigate = useCallback((raw: string) => {
    if (!raw.trim()) return
    const url = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`
    setInputUrl(url)
    setCurrentUrl(url)
    panelApi.setTitle(new URL(url).hostname)
  }, [panelApi])

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigate(inputUrl)
  }

  const quickLinks = [
    { label: 'Microsoft Learn', url: 'https://learn.microsoft.com' },
    { label: 'YouTube',         url: 'https://www.youtube.com' },
    { label: 'MDN Docs',        url: 'https://developer.mozilla.org' },
    { label: 'AWS Docs',        url: 'https://docs.aws.amazon.com' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-2 py-1 bg-card border-b border-border shrink-0">
        <Button variant="ghost" size="icon-sm"
          onClick={() => (webviewRef.current as unknown as ElectronWebview)?.goBack()}>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm"
          onClick={() => (webviewRef.current as unknown as ElectronWebview)?.goForward()}>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm"
          onClick={() => (webviewRef.current as unknown as ElectronWebview)?.reload()}>
          <RefreshCw className="h-3 w-3" />
        </Button>
        <Input
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 h-7 text-xs font-mono"
          placeholder="Enter URL…"
        />
        <Button variant="ghost" size="icon-sm" onClick={() => currentUrl && window.open(currentUrl, '_blank')} title="Open in browser">
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {currentUrl ? (
        isElectron ? (
          <webview
            ref={webviewRef as React.RefObject<HTMLElement>}
            src={currentUrl}
            className="flex-1 w-full"
            allowpopups="true"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
            <Globe className="h-12 w-12 opacity-20" />
            <p className="text-sm font-medium">Open in Electron to browse</p>
            <Button variant="outline" size="sm" onClick={() => window.open(currentUrl, '_blank')} className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />Open in Browser
            </Button>
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-background">
          <div className="text-center">
            <Globe className="h-12 w-12 mx-auto mb-3 text-primary opacity-60" />
            <p className="text-sm font-medium text-foreground mb-1">Learning Browser</p>
            <p className="text-xs text-muted-foreground">Browse docs, Microsoft Learn, YouTube, and more.</p>
          </div>
          <div className="w-full max-w-sm">
            <Input
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              onKeyDown={handleKey}
              className="text-sm"
              placeholder="Enter URL…"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {quickLinks.map(ql => (
              <button key={ql.url} type="button" onClick={() => navigate(ql.url)}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors">
                {ql.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Video panel ───────────────────────────────────────────────────────────────

function VideoPanelDV({ params, api: panelApi }: IDockviewPanelProps<VideoPanelParams>) {
  const [urlInput, setUrlInput] = useState(params.url ?? '')
  const [currentUrl, setCurrentUrl] = useState(params.url ?? '')
  const embedUrl = currentUrl ? getVideoEmbedUrl(currentUrl) : null

  const load = () => {
    if (!urlInput.trim()) return
    setCurrentUrl(urlInput.trim())
    panelApi.setTitle(urlInput.slice(0, 30))
  }

  if (!currentUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 bg-black">
        <Video className="h-12 w-12 text-white/20" />
        <p className="text-sm text-white/60">Paste a YouTube or Vimeo URL</p>
        <div className="flex gap-2 w-full max-w-sm">
          <Input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 text-xs"
            placeholder="https://youtube.com/watch?v=…"
          />
          <Button onClick={load} size="sm" variant="secondary">Load</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center gap-1 px-2 py-1 bg-zinc-900 shrink-0">
        <Input
          value={urlInput || currentUrl}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          className="flex-1 h-6 text-xs bg-zinc-800 border-zinc-700 text-zinc-300"
          placeholder="URL…"
        />
        <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white"
          onClick={() => window.open(currentUrl, '_blank')}>
          <ExternalLink className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-zinc-400 hover:text-white"
          onClick={() => { setCurrentUrl(''); setUrlInput('') }}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      {embedUrl ? (
        <div className="relative flex-1">
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={params.title ?? 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/50 p-6">
          <Video className="h-10 w-10 opacity-20" />
          <p className="text-sm">Cannot embed this URL</p>
          <Button variant="outline" size="sm" onClick={() => window.open(currentUrl, '_blank')}
            className="gap-1.5 border-white/20 text-white/70 hover:text-white">
            <ExternalLink className="h-3.5 w-3.5" />Open in Browser
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Notes panel ───────────────────────────────────────────────────────────────

function NotesPanelDV({ params }: IDockviewPanelProps<NotesPanelParams>) {
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (params.entityId) {
      void api.notes.getById(params.entityId).then(r => {
        if (r.success) setContent((r.data as { content: string }).content ?? '')
      })
    }
  }, [params.entityId])

  const handleChange = (val: string) => {
    setContent(val)
    if (!params.entityId) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setIsSaving(true)
      void api.notes.update(params.entityId!, { content: val }).then(() => setIsSaving(false))
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
        <span className="text-xs text-muted-foreground">{params.entityId ? 'Linked note' : 'Session notes'}</span>
        {isSaving && <span className="text-xs text-muted-foreground animate-pulse">Saving…</span>}
      </div>
      <textarea
        value={content}
        onChange={e => handleChange(e.target.value)}
        placeholder="Start typing your notes here…&#10;&#10;Tip: use timestamps like 2:30 — key point"
        className="flex-1 resize-none bg-background text-sm font-mono p-3 border-0 outline-none leading-relaxed text-foreground placeholder:text-muted-foreground/50"
      />
    </div>
  )
}

// ── Tasks panel ───────────────────────────────────────────────────────────────

function TasksPanelDV({ params }: IDockviewPanelProps<TasksPanelParams>) {
  const [tasks, setTasks] = useState<Array<{ id: string; text: string; done: boolean }>>([])
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    if (params.labId) {
      void api.homeLabs.getById(params.labId).then(r => {
        if (r.success) {
          const lab = r.data as { tasks?: Array<{ id: string; title: string; is_done: 0 | 1 }> }
          if (lab.tasks) setTasks(lab.tasks.map(t => ({ id: t.id, text: t.title, done: t.is_done === 1 })))
        }
      })
    }
  }, [params.labId])

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks(t => [...t, { id: Date.now().toString(), text: newTask.trim(), done: false }])
    setNewTask('')
  }

  const toggle = (id: string) => setTasks(t => t.map(task => task.id === id ? { ...task, done: !task.done } : task))
  const remove = (id: string) => setTasks(t => t.filter(task => task.id !== id))
  const done = tasks.filter(t => t.done).length

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1.5 border-b border-border bg-card shrink-0 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Tasks</span>
        {tasks.length > 0 && <span className="text-xs text-muted-foreground">{done}/{tasks.length}</span>}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/50 text-xs">
            <CheckSquare className="h-8 w-8 mb-2 opacity-30" />
            Add tasks below
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map(task => (
              <li key={task.id} className="group flex items-center gap-2 px-3 py-2 hover:bg-accent/30 transition-colors">
                <button type="button" onClick={() => toggle(task.id)} className="shrink-0">
                  <div className={cn('h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
                    task.done ? 'bg-primary border-primary text-primary-foreground' : 'border-border')}>
                    {task.done && <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>}
                  </div>
                </button>
                <span className={cn('text-xs flex-1 leading-snug', task.done && 'line-through text-muted-foreground')}>
                  {task.text}
                </span>
                <button type="button" onClick={() => remove(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex gap-1.5 p-2 border-t border-border shrink-0">
        <Input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add a task…"
          className="flex-1 h-7 text-xs"
        />
        <Button onClick={addTask} size="icon-sm" variant="secondary"><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  )
}

// ── Playlist panel ────────────────────────────────────────────────────────────

function PlaylistPanelDV({ params }: IDockviewPanelProps<PlaylistPanelParams>) {
  const [playlist, setPlaylist] = useState<{
    title: string
    items: Array<{ id: string; title: string; url: string | null; watch_status: string }>
  } | null>(null)
  const { openInDockview } = useWorkspaceStore()

  useEffect(() => {
    if (!params.entityId) return
    void api.playlists.getById(params.entityId).then(r => {
      if (r.success) setPlaylist(r.data as typeof playlist)
    })
  }, [params.entityId])

  if (!params.entityId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 gap-2">
        <ListVideo className="h-10 w-10 opacity-20" />
        <p className="text-xs">Open a playlist from the sidebar</p>
      </div>
    )
  }

  if (!playlist) return <div className="flex items-center justify-center h-full"><span className="text-xs text-muted-foreground">Loading…</span></div>

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-1.5 border-b border-border bg-card shrink-0">
        <p className="text-xs font-medium truncate">{playlist.title}</p>
        <p className="text-[10px] text-muted-foreground">{playlist.items.length} videos</p>
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-border">
        {playlist.items.map((item, i) => (
          <li key={item.id} className="group flex items-center gap-2 px-3 py-2 hover:bg-accent/30 transition-colors">
            <span className="text-[10px] text-muted-foreground w-4 shrink-0 text-right">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-snug truncate">{item.title}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{item.watch_status}</p>
            </div>
            {item.url && (
              <button type="button"
                onClick={() => openInDockview({ component: 'VideoPanel', url: item.url!, title: item.title })}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                <Video className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Welcome panel (empty / content chooser) ───────────────────────────────────

function WelcomePanelDV({ api: panelApi }: IDockviewPanelProps<Record<string, never>>) {
  const { openInDockview } = useWorkspaceStore()

  const options: Array<{ component: OpenPanelRequest['component']; icon: typeof Globe; desc: string }> = [
    { component: 'BrowserPanel',  icon: Globe,       desc: 'Browse websites and docs' },
    { component: 'VideoPanel',    icon: Video,       desc: 'Watch YouTube or Vimeo' },
    { component: 'NotesPanel',    icon: FileText,    desc: 'Write session notes' },
    { component: 'PlaylistPanel', icon: ListVideo,   desc: 'Follow a playlist' },
    { component: 'TasksPanel',    icon: CheckSquare, desc: 'Manage tasks' },
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <p className="text-xs text-muted-foreground">Choose panel content</p>
      <div className="grid grid-cols-1 gap-1.5 w-full max-w-[180px]">
        {options.map(o => {
          const Icon = o.icon
          return (
            <button key={o.component} type="button"
              onClick={() => {
                panelApi.close()
                openInDockview({ component: o.component } as OpenPanelRequest)
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-accent text-left transition-colors">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs font-medium">{o.component.replace('Panel', '')}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{o.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Panel component registry ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PANEL_COMPONENTS: Record<string, React.FunctionComponent<IDockviewPanelProps<any>>> = {
  BrowserPanel:  BrowserPanelDV,
  VideoPanel:    VideoPanelDV,
  NotesPanel:    NotesPanelDV,
  TasksPanel:    TasksPanelDV,
  PlaylistPanel: PlaylistPanelDV,
  WelcomePanel:  WelcomePanelDV,
}

// ── Custom tab component (shows close button + standard title) ────────────────

function WorkspaceTab(props: IDockviewPanelHeaderProps) {
  return (
    <DockviewDefaultTab {...props as Parameters<typeof DockviewDefaultTab>[0]} />
  )
}

// ── Group header actions (maximize + float) ───────────────────────────────────

function GroupHeaderActions({ api: groupApi, containerApi, activePanel }: IDockviewHeaderActionsProps) {
  const [isMax, setIsMax] = useState(false)
  const { addFloatingPanel } = useWorkspaceStore()

  useEffect(() => {
    const { dispose } = containerApi.onDidMaximizedGroupChange(() => {
      setIsMax(containerApi.hasMaximizedGroup())
    })
    return () => dispose()
  }, [containerApi])

  const toggleMaximize = () => {
    if (isMax) {
      containerApi.exitMaximizedGroup()
    } else {
      groupApi.maximize()
    }
  }

  const handleFloat = () => {
    if (!activePanel) return
    const component = activePanel.view.content.element.dataset['component'] as OpenPanelRequest['component'] | undefined
    if (!component) {
      // Fallback: open a floating notes panel
      addFloatingPanel({ component: 'NotesPanel' })
    } else {
      addFloatingPanel({ component })
    }
  }

  return (
    <div className="flex items-center gap-0.5 pr-1">
      <button
        type="button"
        title="Float panel"
        onClick={handleFloat}
        className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <PanelTopOpen className="h-3 w-3" />
      </button>
      <button
        type="button"
        title={isMax ? 'Restore' : 'Maximize'}
        onClick={toggleMaximize}
        className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        {isMax ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
      </button>
    </div>
  )
}

// ── Default layout factory ────────────────────────────────────────────────────

function addDefaultPanels(dockApi: DockviewApi): void {
  const browser = dockApi.addPanel({
    id: 'browser-default',
    component: 'BrowserPanel',
    title: 'Browser',
    params: {} satisfies BrowserPanelParams,
  })

  dockApi.addPanel({
    id: 'notes-default',
    component: 'NotesPanel',
    title: 'Notes',
    params: {} satisfies NotesPanelParams,
    position: { direction: 'right', referencePanel: browser },
  })

  dockApi.addPanel({
    id: 'tasks-default',
    component: 'TasksPanel',
    title: 'Tasks',
    params: {} satisfies TasksPanelParams,
    position: { direction: 'below', referencePanel: browser },
  })
}

// ── Panel layout (Dockview host) ──────────────────────────────────────────────

function PanelLayout({ tab }: { tab: WorkspaceTab }) {
  const { saveDockviewLayout, setDockviewApi } = useWorkspaceStore()
  const cleanupRef = useRef<(() => void) | null>(null)

  // Run cleanup when tab changes (key= forces unmount) or component unmounts
  useEffect(() => {
    return () => {
      cleanupRef.current?.()
      setDockviewApi(null)
    }
  }, [setDockviewApi])

  const onReady = useCallback((event: DockviewReadyEvent) => {
    setDockviewApi(event.api)

    // Restore saved layout or build default panels
    if (tab.dockviewJson) {
      try {
        event.api.fromJSON(
          JSON.parse(tab.dockviewJson) as Parameters<typeof event.api.fromJSON>[0]
        )
      } catch {
        addDefaultPanels(event.api)
      }
    } else {
      addDefaultPanels(event.api)
    }

    // Debounced auto-save: 600ms after last layout change
    let saveTimer: ReturnType<typeof setTimeout> | null = null
    const { dispose } = event.api.onDidLayoutChange(() => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        saveDockviewLayout(tab.id, JSON.stringify(event.api.toJSON()))
      }, 600)
    })

    cleanupRef.current = () => {
      dispose()
      if (saveTimer) clearTimeout(saveTimer)
    }
  }, [tab.id, tab.dockviewJson, saveDockviewLayout, setDockviewApi])

  return (
    <DockviewReact
      key={tab.id}
      className="dockview-theme-dark flex-1"
      components={PANEL_COMPONENTS}
      defaultTabComponent={WorkspaceTab}
      rightHeaderActionsComponent={GroupHeaderActions}
      onReady={onReady}
    />
  )
}

// ── Preset save dialog ────────────────────────────────────────────────────────

function PresetSaveDialog({ onClose }: { onClose: () => void }) {
  const { savePreset } = useWorkspaceStore()
  const [name, setName] = useState('')
  const icons = ['📚', '🔬', '💡', '🏋️', '🎯', '📝', '🖥️', '🎓']
  const [icon, setIcon] = useState(icons[0]!)

  const submit = () => {
    if (!name.trim()) return
    savePreset(name.trim(), icon)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl p-5 w-80 space-y-4">
        <h3 className="text-sm font-semibold">Save Layout Preset</h3>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Name</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="e.g. Study Mode"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Icon</label>
          <div className="flex gap-1.5 flex-wrap">
            {icons.map(i => (
              <button key={i} type="button" onClick={() => setIcon(i)}
                className={cn('w-8 h-8 text-base rounded border transition-colors',
                  icon === i ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40')}>
                {i}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={!name.trim()}>
            <Save className="h-3.5 w-3.5" />Save
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Workspace sidebar ─────────────────────────────────────────────────────────

function WorkspaceSidebar() {
  const { session, setSidebarSkill, openInDockview } = useWorkspaceStore()
  const [skills, setSkills] = useState<Array<{ id: string; name: string }>>([])
  const [resources, setResources] = useState<SidebarResource[]>([])
  const [search, setSearch] = useState('')
  const skillId = session.sidebarSkillId

  useEffect(() => {
    void api.skills.getAll({ pageSize: 500 }).then(r => {
      if (r.success) setSkills((r.data as unknown as { items: Array<{ id: string; name: string }> }).items)
    })
  }, [])

  useEffect(() => {
    if (!skillId) { setResources([]); return }
    const load = async () => {
      const results: SidebarResource[] = []
      const [videos, skResources, playlists] = await Promise.all([
        api.skillHub.linkedVideos.getAll(skillId),
        api.skillHub.resources.getAll(skillId),
        api.playlists.getAll(skillId),
      ])
      if (videos.success)
        for (const v of videos.data as Array<{ id: string; title: string; url: string | null }>)
          results.push({ id: v.id, kind: 'video', title: v.title, ...(v.url ? { url: v.url } : {}) })
      if (skResources.success)
        for (const r of skResources.data as Array<{ id: string; title: string; url: string | null; provider: string }>)
          results.push({ id: r.id, kind: 'website', title: r.title, subtitle: r.provider, ...(r.url ? { url: r.url } : {}) })
      if (playlists.success)
        for (const p of playlists.data as Array<{ id: string; title: string }>)
          results.push({ id: p.id, kind: 'playlist', title: p.title })
      setResources(results)
    }
    void load()
  }, [skillId])

  const filtered = search
    ? resources.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : resources

  const KIND_ICON: Record<SidebarResource['kind'], typeof Globe> = {
    video: Video, playlist: ListVideo, document: BookOpen,
    note: FileText, website: Globe, lab: CheckSquare, 'interview-question': Search,
  }

  const buildRequest = (res: SidebarResource): OpenPanelRequest => {
    switch (res.kind) {
      case 'video':    return { component: 'VideoPanel',    title: res.title, ...(res.url ? { url: res.url } : {}) }
      case 'playlist': return { component: 'PlaylistPanel', title: res.title, entityId: res.id }
      case 'note':     return { component: 'NotesPanel',    title: res.title, entityId: res.id }
      case 'lab':      return { component: 'TasksPanel',    title: res.title, labId: res.id }
      default:         return { component: 'BrowserPanel',  title: res.title, ...(res.url ? { url: res.url } : {}) }
    }
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-card border-r border-border">
      <div className="p-2 border-b border-border">
        <select
          value={skillId}
          onChange={e => setSidebarSkill(e.target.value)}
          className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
        >
          <option value="">— Select a skill —</option>
          {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search resources…"
            className="pl-6 h-7 text-xs"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!skillId ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/50 text-xs text-center px-4">
            Select a skill to see its resources
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground/50 px-4">No resources for this skill yet</div>
        ) : (
          <ul className="py-1">
            {filtered.map(res => {
              const Icon = KIND_ICON[res.kind]
              return (
                <li key={`${res.kind}-${res.id}`}>
                  <button
                    type="button"
                    className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                    onClick={() => openInDockview(buildRequest(res))}
                  >
                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs truncate">{res.title}</p>
                      {res.subtitle && <p className="text-[10px] text-muted-foreground">{res.subtitle}</p>}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}

// ── Workspace tab bar ─────────────────────────────────────────────────────────

function WorkspaceTabBar() {
  const { session, setActiveTab, createTab, closeTab, renameTab } = useWorkspaceStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const startRename = (t: WorkspaceTab) => { setEditingId(t.id); setEditTitle(t.title) }
  const commitRename = () => {
    if (editingId && editTitle.trim()) renameTab(editingId, editTitle.trim())
    setEditingId(null)
  }

  return (
    <div className="flex items-center gap-0 border-b border-border bg-muted/40 shrink-0 overflow-x-auto">
      {session.tabs.map(t => (
        <div
          key={t.id}
          className={cn(
            'group flex items-center gap-1.5 px-3 py-2 border-r border-border cursor-pointer shrink-0 max-w-[180px]',
            t.id === session.activeTabId
              ? 'bg-background text-foreground border-b-transparent'
              : 'text-muted-foreground hover:bg-accent/50',
          )}
          onClick={() => setActiveTab(t.id)}
        >
          {editingId === t.id ? (
            <input
              autoFocus
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null) }}
              className="text-xs bg-transparent border-b border-primary outline-none w-24"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="text-xs truncate flex-1" onDoubleClick={() => startRename(t)} title="Double-click to rename">
              {t.title}
            </span>
          )}
          {session.tabs.length > 1 && (
            <button type="button"
              onClick={e => { e.stopPropagation(); closeTab(t.id) }}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={createTab}
        className="px-2 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors shrink-0"
        title="New study session">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Presets bar ───────────────────────────────────────────────────────────────

function PresetsBar() {
  const { session, loadPreset, deletePreset, openInDockview } = useWorkspaceStore()
  const [showSave, setShowSave] = useState(false)
  const [showPresets, setShowPresets] = useState(false)

  const quickAdd = (component: OpenPanelRequest['component']) => {
    openInDockview({ component } as OpenPanelRequest)
  }

  return (
    <>
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-card shrink-0">
        {/* Quick-add panel buttons */}
        {[
          { c: 'BrowserPanel' as const,  icon: Globe,       title: 'Add Browser' },
          { c: 'VideoPanel' as const,    icon: Video,       title: 'Add Video' },
          { c: 'NotesPanel' as const,    icon: FileText,    title: 'Add Notes' },
          { c: 'TasksPanel' as const,    icon: CheckSquare, title: 'Add Tasks' },
          { c: 'PlaylistPanel' as const, icon: ListVideo,   title: 'Add Playlist' },
        ].map(({ c, icon: Icon, title }) => (
          <button key={c} type="button" title={title}
            onClick={() => quickAdd(c)}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}

        <div className="flex-1" />

        {/* Preset buttons */}
        {session.presets.slice(0, 4).map(p => (
          <button key={p.id} type="button"
            onClick={() => loadPreset(p.id)}
            title={`Load: ${p.name}`}
            className="flex items-center gap-1 px-2 h-6 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <span>{p.icon}</span>
            <span className="max-w-[80px] truncate">{p.name}</span>
          </button>
        ))}

        {session.presets.length > 0 && (
          <div className="relative">
            <button type="button"
              onClick={() => setShowPresets(o => !o)}
              className="h-6 px-1 flex items-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <ChevronDown className="h-3 w-3" />
            </button>
            {showPresets && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPresets(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[160px]">
                  {session.presets.map(p => (
                    <div key={p.id} className="flex items-center gap-1 px-3 py-1.5 hover:bg-accent group">
                      <button type="button" className="flex items-center gap-2 flex-1 text-xs text-left"
                        onClick={() => { loadPreset(p.id); setShowPresets(false) }}>
                        <span>{p.icon}</span>{p.name}
                      </button>
                      <button type="button" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => deletePreset(p.id)}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <button type="button" title="Save current layout as preset"
          onClick={() => setShowSave(true)}
          className="h-6 px-1.5 flex items-center gap-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Save className="h-3 w-3" />
          <span className="hidden sm:inline">Save Layout</span>
        </button>
      </div>

      {showSave && <PresetSaveDialog onClose={() => setShowSave(false)} />}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function WorkspacePage() {
  const { session, activeTab, isLoaded, load, toggleSidebar } = useWorkspaceStore()

  useEffect(() => { void load() }, [load])

  if (!isLoaded || !activeTab) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-sm text-muted-foreground">Loading workspace…</span>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {session.sidebarOpen && <WorkspaceSidebar />}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top toolbar: sidebar toggle + tab bar */}
        <div className="flex items-center gap-2 px-2 py-1 border-b border-border bg-card shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} title="Toggle sidebar">
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <WorkspaceTabBar />
          </div>
        </div>

        {/* Secondary toolbar: quick-add panel buttons + presets */}
        <PresetsBar />

        {/* Dockview layout — fills remaining height */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <PanelLayout tab={activeTab} />
        </div>
      </div>
    </div>
  )
}
