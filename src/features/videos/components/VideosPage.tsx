import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Video, Plus, Edit2, Trash2, X, Clock, CheckCircle2, Play, RefreshCw, ArrowLeft, ExternalLink } from 'lucide-react'
import { api } from '@shared/lib/ipc-client'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { EmptyState } from '@shared/components/common/EmptyState'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { SearchInput } from '@shared/components/common/SearchInput'
import { Pagination } from '@shared/components/common/Pagination'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { Label } from '@shared/components/ui/label'
import { Badge } from '@shared/components/ui/badge'
import { Separator } from '@shared/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@shared/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetBody, SheetFooter,
} from '@shared/components/ui/sheet'
import { videoFormSchema, videoFormDefaults, type VideoFormValues } from '../schemas/video.schema'
import { useVideosStore } from '../store/videos.store'
import type { VideoSource, VideoWatchStatus, VideoWithMeta, SkillRef, Tag } from '../types/video.types'
import { formatRelativeDate } from '@shared/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<VideoSource, string> = {
  youtube: 'YouTube', vimeo: 'Vimeo', udemy: 'Udemy',
  coursera: 'Coursera', pluralsight: 'Pluralsight', local: 'Local', other: 'Other',
}

const WATCH_STATUS_CONFIG: Record<VideoWatchStatus, { label: string; icon: typeof Clock; color: string }> = {
  unwatched: { label: 'Unwatched', icon: Clock,        color: 'text-muted-foreground' },
  watching:  { label: 'Watching',  icon: Play,         color: 'text-blue-500' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
  revisit:   { label: 'Revisit',   icon: RefreshCw,    color: 'text-amber-500' },
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// ── YouTube / Vimeo ID extraction ─────────────────────────────────────────────

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
    if (u.hostname === 'vimeo.com' || u.hostname === 'www.vimeo.com') {
      return u.pathname.replace(/^\//, '').split('/')[0] || null
    }
    if (u.hostname === 'player.vimeo.com') {
      return u.pathname.split('/')[2] || null
    }
    return null
  } catch { return null }
}

function getEmbedUrl(video: VideoWithMeta): string | null {
  if (!video.url) return null
  if (video.source === 'youtube') {
    const id = extractYouTubeId(video.url)
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null
  }
  if (video.source === 'vimeo') {
    const id = extractVimeoId(video.url)
    return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null
  }
  return null
}

// ── VideoProvider abstraction ─────────────────────────────────────────────────

function EmbedUnavailable({
  message,
  detail,
  onOpenExternal,
}: {
  message: string
  detail: string
  onOpenExternal?: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center text-muted-foreground p-12 max-w-sm">
      <Video className="h-20 w-20 mb-4 opacity-10" />
      <p className="font-medium text-sm mb-1">{message}</p>
      <p className="text-xs text-muted-foreground/70 mb-4">{detail}</p>
      {onOpenExternal && (
        <Button variant="outline" size="sm" onClick={onOpenExternal} className="gap-1.5">
          <ExternalLink className="h-3.5 w-3.5" />Open in Browser
        </Button>
      )}
    </div>
  )
}

function VideoPlayer({
  video,
  onOpenExternal,
}: {
  video: VideoWithMeta
  onOpenExternal: () => void
}) {
  const [localFailed, setLocalFailed] = useState(false)

  // Local MP4 / WebM / Ogg — native <video> element
  if (video.source === 'local') {
    if (!video.local_path) {
      return (
        <EmbedUnavailable
          message="No local file path"
          detail="Edit this video to set a local file path."
        />
      )
    }
    if (localFailed) {
      return (
        <EmbedUnavailable
          message="Could not load local file"
          detail="The file may have moved or cannot be read."
          onOpenExternal={onOpenExternal}
        />
      )
    }
    const src = video.local_path.startsWith('file://')
      ? video.local_path
      : `file://${video.local_path}`
    const ext = video.local_path.split('.').pop()?.toLowerCase()
    const mime =
      ext === 'mp4' ? 'video/mp4' :
      ext === 'webm' ? 'video/webm' :
      ext === 'ogg' ? 'video/ogg' : null
    if (!mime) {
      return (
        <EmbedUnavailable
          message="Unsupported file format"
          detail="Only MP4, WebM, and Ogg files can be played inline."
          onOpenExternal={onOpenExternal}
        />
      )
    }
    return (
      <video
        src={src}
        controls
        autoPlay
        className="w-full h-full max-h-full object-contain"
        onError={() => setLocalFailed(true)}
      >
        <source src={src} type={mime} />
      </video>
    )
  }

  // YouTube / Vimeo — iframe embed
  const embedUrl = getEmbedUrl(video)
  if (!embedUrl) {
    return (
      <EmbedUnavailable
        message={video.url ? 'Cannot embed this video' : 'No URL provided'}
        detail={
          video.source === 'youtube'
            ? 'This YouTube URL is not in a recognised format.'
            : video.url
            ? `${SOURCE_LABELS[video.source]} videos cannot be embedded. Open in your browser instead.`
            : 'Add a URL in Edit Video to enable playback.'
        }
        {...(video.url ? { onOpenExternal } : {})}
      />
    )
  }

  return (
    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
      <iframe
        key={embedUrl}
        src={embedUrl}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  )
}

// ── Video Workspace (embedded player + notes) ─────────────────────────────────

function VideoWorkspace() {
  const { watchingVideo, closeWatch, saveWatchNotes } = useVideosStore()
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setNotes(watchingVideo?.notes ?? '')
  }, [watchingVideo?.id, watchingVideo?.notes])

  if (!watchingVideo) return null

  const status = WATCH_STATUS_CONFIG[watchingVideo.watch_status]
  const StatusIcon = status.icon

  const handleSaveNotes = async () => {
    setIsSaving(true)
    await saveWatchNotes(notes)
    setIsSaving(false)
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="sm" onClick={closeWatch} className="gap-1.5 shrink-0">
          <ArrowLeft className="h-4 w-4" />Videos
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{watchingVideo.title}</h2>
          {watchingVideo.channel && (
            <p className="text-xs text-muted-foreground truncate">{watchingVideo.channel}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="text-xs">{SOURCE_LABELS[watchingVideo.source]}</Badge>
          <span className={`flex items-center gap-1 text-xs ${status.color}`}>
            <StatusIcon className="h-3 w-3" />{status.label}
          </span>
          {watchingVideo.url && (
            <Button variant="ghost" size="icon-sm"
              onClick={() => window.open(watchingVideo.url ?? '', '_blank')}
              title="Open in browser">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Player */}
        <div className="flex-1 bg-black flex items-center justify-center">
          <VideoPlayer
            video={watchingVideo}
            onOpenExternal={() => window.open(watchingVideo.url ?? watchingVideo.local_path ?? '', '_blank')}
          />
        </div>

        {/* Right: Side panel */}
        <div className="w-80 border-l border-border flex flex-col bg-card shrink-0 min-h-0">
          <Tabs defaultValue="notes" className="flex flex-col flex-1 min-h-0">
            <TabsList className="mx-3 mt-3 shrink-0">
              <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
              <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="flex-1 flex flex-col p-3 gap-2 min-h-0 mt-0">
              <p className="text-xs text-muted-foreground shrink-0">
                Capture timestamps, key concepts, and takeaways.
              </p>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. 2:30 — Key insight about...&#10;5:00 — Command: kubectl get pods&#10;10:15 — Summary point..."
                className="flex-1 text-xs font-mono resize-none min-h-0"
              />
              <Button
                size="sm"
                onClick={() => void handleSaveNotes()}
                disabled={isSaving}
                className="shrink-0"
              >
                {isSaving ? 'Saving…' : 'Save Notes'}
              </Button>
            </TabsContent>

            <TabsContent value="info" className="p-3 overflow-y-auto space-y-4 mt-0">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Source</p>
                  <p>{SOURCE_LABELS[watchingVideo.source]}</p>
                </div>
                {watchingVideo.channel && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Channel / Author</p>
                    <p>{watchingVideo.channel}</p>
                  </div>
                )}
                {watchingVideo.duration_seconds && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Duration</p>
                    <p>{formatDuration(watchingVideo.duration_seconds)}</p>
                  </div>
                )}
                {watchingVideo.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Description</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{watchingVideo.description}</p>
                  </div>
                )}
                {watchingVideo.skill_count > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Linked Skills</p>
                    <p className="text-xs">{watchingVideo.skill_count} skill{watchingVideo.skill_count !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>

              {watchingVideo.url && (
                <Button variant="outline" size="sm" className="w-full gap-1.5"
                  onClick={() => window.open(watchingVideo.url ?? '', '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5" />Open in Browser
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// ── Video Card ────────────────────────────────────────────────────────────────

function VideoCard({ video, onEdit, onDelete, onWatch }: {
  video: VideoWithMeta
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onWatch: (video: VideoWithMeta) => void
}) {
  const status = WATCH_STATUS_CONFIG[video.watch_status]
  const StatusIcon = status.icon
  const canEmbed =
    ((video.source === 'youtube' || video.source === 'vimeo') && !!video.url) ||
    (video.source === 'local' && !!video.local_path)

  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:border-zinc-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Video className="h-4 w-4 text-primary shrink-0" />
          <h3 className="font-semibold text-sm truncate" title={video.title}>{video.title}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(video.id)} aria-label="Edit"><Edit2 /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(video.id)}
            className="text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 /></Button>
        </div>
      </div>

      {video.channel && (
        <p className="text-xs text-muted-foreground -mt-1 truncate">{video.channel}</p>
      )}

      {video.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {video.description.slice(0, 140)}
        </p>
      )}

      {canEmbed && (
        <Button variant="secondary" size="sm" onClick={() => onWatch(video)} className="gap-1.5 w-full mt-1">
          <Play className="h-3.5 w-3.5" />Watch Now
        </Button>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {SOURCE_LABELS[video.source]}
          </Badge>
          <span className={`flex items-center gap-1 ${status.color}`}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {video.duration_seconds && <span>{formatDuration(video.duration_seconds)}</span>}
          {video.skill_count > 0 && <span>{video.skill_count} skill{video.skill_count > 1 ? 's' : ''}</span>}
          <span>{formatRelativeDate(video.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Video Form ────────────────────────────────────────────────────────────────

function VideoForm() {
  const { isFormOpen, editingId, detail, isSubmitting, formError, closeForm, submit } = useVideosStore()
  const [allSkills, setAllSkills] = useState<SkillRef[]>([])
  const [skillSearch, setSkillSearch] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [tagSearch, setTagSearch] = useState('')

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema), defaultValues: videoFormDefaults,
  })

  const selectedSource = watch('source')

  useEffect(() => {
    if (!isFormOpen) { reset(videoFormDefaults); setSkillSearch(''); setTagSearch(''); return }
    if (editingId && detail) {
      reset({
        title: detail.title,
        description: detail.description ?? '',
        url: detail.url ?? '',
        source: detail.source as VideoFormValues['source'],
        channel: detail.channel ?? '',
        watch_status: detail.watch_status as VideoFormValues['watch_status'],
        duration_seconds: detail.duration_seconds,
        notes: detail.notes ?? '',
        skill_ids: detail.skills.map(s => s.id),
        tag_ids: detail.tags.map(t => t.id),
      })
    }
  }, [isFormOpen, editingId, detail, reset])

  useEffect(() => {
    if (!isFormOpen) return
    void api.skills.getAll({ pageSize: 500 }).then(r => {
      if (r.success) setAllSkills((r.data as unknown as { items: SkillRef[] }).items)
    })
    void api.tags.getAll().then(r => { if (r.success) setAllTags(r.data as Tag[]) })
  }, [isFormOpen])

  const onSubmit = async (v: VideoFormValues) => { await submit(v) }

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <SheetContent side="right" className="w-[520px] max-w-full">
        <SheetHeader>
          <SheetTitle>{editingId ? 'Edit Video' : 'Add Video'}</SheetTitle>
          <SheetDescription>
            {editingId ? 'Update video details.' : 'Save a learning video with watch status and linked skills.'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="video-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="video-title">Title <span className="text-destructive">*</span></Label>
              <Input id="video-title" placeholder="e.g. React Advanced Patterns" {...register('title')} aria-invalid={!!errors.title} />
              {errors.title?.message && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Controller control={control} name="source" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label>Watch Status</Label>
                <Controller control={control} name="watch_status" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(WATCH_STATUS_CONFIG).map(([v, { label }]) => (
                        <SelectItem key={v} value={v}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            {selectedSource !== 'local' && (
              <div className="space-y-1.5">
                <Label htmlFor="video-url">URL</Label>
                <Input id="video-url" type="url" placeholder="https://…" {...register('url')} aria-invalid={!!errors.url} />
                {errors.url?.message && <p className="text-xs text-destructive">{errors.url.message}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="video-channel">Channel / Author</Label>
                <Input id="video-channel" placeholder="e.g. Fireship" {...register('channel')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="video-duration">Duration (minutes)</Label>
                <Input id="video-duration" type="number" min={0} placeholder="—"
                  {...register('duration_seconds', {
                    setValueAs: v => v === '' || v === null ? null : Number(v) * 60,
                  })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="video-description">Description</Label>
              <Textarea id="video-description" rows={3} placeholder="What is this video about?" {...register('description')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="video-notes">Notes</Label>
              <Textarea id="video-notes" rows={4} placeholder="Key takeaways, timestamps, resources…" {...register('notes')} />
            </div>

            <Separator />

            <Controller control={control} name="skill_ids" render={({ field }) => (
              <div className="space-y-2">
                <Label>Related Skills</Label>
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map(sid => {
                      const s = allSkills.find(x => x.id === sid)
                      if (!s) return null
                      return (
                        <span key={sid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border border-border">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.category_color }} />
                          {s.name}
                          <button type="button" onClick={() => field.onChange(field.value.filter(id => id !== sid))}
                            className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                        </span>
                      )
                    })}
                  </div>
                )}
                {allSkills.length > 0 && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <input type="text" value={skillSearch} onChange={e => setSkillSearch(e.target.value)}
                      placeholder="Search skills…" className="w-full px-3 py-2 text-xs bg-transparent border-b border-border focus:outline-none" />
                    <div className="max-h-32 overflow-y-auto p-1">
                      {allSkills
                        .filter(s => !field.value.includes(s.id) && (!skillSearch || s.name.toLowerCase().includes(skillSearch.toLowerCase())))
                        .slice(0, 30)
                        .map(s => (
                          <button key={s.id} type="button"
                            onClick={() => { field.onChange([...field.value, s.id]); setSkillSearch('') }}
                            className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent text-left">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.category_color }} />
                            <span className="flex-1">{s.name}</span>
                            <span className="text-muted-foreground">{s.category_name}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )} />

            <Controller control={control} name="tag_ids" render={({ field }) => (
              <div className="space-y-2">
                <Label>Tags</Label>
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map(tid => {
                      const tag = allTags.find(t => t.id === tid)
                      if (!tag) return null
                      return (
                        <span key={tid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border"
                          style={{ borderColor: tag.color_hex + '60', color: tag.color_hex }}>
                          {tag.name}
                          <button type="button" onClick={() => field.onChange(field.value.filter(id => id !== tid))}
                            className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                        </span>
                      )
                    })}
                  </div>
                )}
                {allTags.length > 0 && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <input type="text" value={tagSearch} onChange={e => setTagSearch(e.target.value)}
                      placeholder="Search tags…" className="w-full px-3 py-2 text-xs bg-transparent border-b border-border focus:outline-none" />
                    <div className="max-h-28 overflow-y-auto p-1">
                      {allTags
                        .filter(t => !tagSearch || t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                        .map(tag => {
                          const selected = field.value.includes(tag.id)
                          return (
                            <button key={tag.id} type="button"
                              onClick={() => field.onChange(selected ? field.value.filter(id => id !== tag.id) : [...field.value, tag.id])}
                              className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent text-left">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color_hex }} />
                              <span className="flex-1">{tag.name}</span>
                              {selected && <Badge variant="secondary" className="text-[10px] py-0 px-1">Selected</Badge>}
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            )} />
          </form>
        </SheetBody>
        <SheetFooter>
          {formError && <p className="text-xs text-destructive w-full text-center">{formError}</p>}
          <Button variant="outline" onClick={closeForm} disabled={isSubmitting} type="button">Cancel</Button>
          <Button form="video-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Add video'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Delete Dialog ─────────────────────────────────────────────────────────────

function DeleteVideoDialog() {
  const { deletingId, isDeleting, items, cancelDelete, executeDelete } = useVideosStore()
  const video = items.find(v => v.id === deletingId)
  return (
    <Dialog open={!!deletingId} onOpenChange={open => { if (!open) cancelDelete() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete video</DialogTitle>
          <DialogDescription>
            Delete <strong className="text-foreground">{video?.title}</strong>? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={() => void executeDelete()} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function VideosPage() {
  const {
    items, total, page, pageSize, totalPages, isLoading, listError,
    filters, fetch, setSearch, setPage, setFilterField, clearFilters,
    openCreate, openEdit, confirmDelete,
    watchingVideo, openWatch,
  } = useVideosStore()

  useEffect(() => { void fetch() }, [fetch])

  if (watchingVideo) {
    return <VideoWorkspace />
  }

  const hasFilters = !!filters.search || !!filters.source || !!filters.watch_status

  return (
    <>
      <PageLayout
        title="Videos"
        description="Save learning videos from YouTube, Udemy, Coursera, or local files with watch progress tracking."
        actions={<Button onClick={openCreate} size="sm"><Plus />Add Video</Button>}
      >
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput value={filters.search} onChange={setSearch} placeholder="Search videos…" className="w-64" />

          <Select value={filters.source || '__all__'}
            onValueChange={v => setFilterField('source', v === '__all__' ? '' : v as VideoSource)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All sources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All sources</SelectItem>
              {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.watch_status || '__all__'}
            onValueChange={v => setFilterField('watch_status', v === '__all__' ? '' : v as VideoWatchStatus)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {Object.entries(WATCH_STATUS_CONFIG).map(([v, { label }]) => (
                <SelectItem key={v} value={v}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1">
              <X className="h-3 w-3" />Clear
            </Button>
          )}
        </div>

        {isLoading ? (
          <PageLoader />
        ) : listError ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground">{listError}</p>
            <Button variant="outline" size="sm" onClick={() => void fetch()} className="mt-3">Retry</Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Video}
            title={hasFilters ? 'No videos match your filters' : 'No videos yet'}
            description={hasFilters
              ? 'Try adjusting your filters.'
              : 'Save YouTube, Udemy, or Coursera videos to track what you\'re watching and which skills they teach.'}
            action={!hasFilters ? <Button onClick={openCreate}><Plus />Add your first video</Button> : undefined}
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              {total} {total === 1 ? 'video' : 'videos'}{hasFilters && ' matching filters'}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(video => (
                <VideoCard key={video.id} video={video} onEdit={openEdit} onDelete={confirmDelete} onWatch={openWatch} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </PageLayout>
      <VideoForm />
      <DeleteVideoDialog />
    </>
  )
}
