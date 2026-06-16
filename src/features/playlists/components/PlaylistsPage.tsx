import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ListVideo, Plus, Edit2, Trash2, Play, CheckCircle2,
  ChevronRight, ExternalLink, Circle,
} from 'lucide-react'
import { api } from '@shared/lib/ipc-client'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { EmptyState } from '@shared/components/common/EmptyState'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { SearchInput } from '@shared/components/common/SearchInput'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { Label } from '@shared/components/ui/label'
import { Badge } from '@shared/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@shared/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter,
} from '@shared/components/ui/sheet'
import {
  playlistFormSchema, playlistFormDefaults, playlistItemFormSchema, playlistItemFormDefaults,
  type PlaylistFormValues, type PlaylistItemFormValues,
} from '../schemas/playlist.schema'
import { usePlaylistsStore } from '../store/playlists.store'
import type { PlaylistWithProgress, PlaylistItem } from '../types/playlist.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDuration(seconds: number): string {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function progressPct(playlist: PlaylistWithProgress): number {
  return playlist.item_count === 0 ? 0 : Math.round((playlist.completed_count / playlist.item_count) * 100)
}

const STATUS_ICON: Record<PlaylistItem['watch_status'], typeof Circle> = {
  unwatched: Circle,
  watching: Play,
  completed: CheckCircle2,
}
const STATUS_COLOR: Record<PlaylistItem['watch_status'], string> = {
  unwatched: 'text-muted-foreground',
  watching: 'text-blue-500',
  completed: 'text-green-500',
}

// ── Playlist Card ─────────────────────────────────────────────────────────────

function PlaylistCard({ playlist, onOpen, onEdit, onDelete }: {
  playlist: PlaylistWithProgress
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const pct = progressPct(playlist)
  return (
    <div
      className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 hover:border-zinc-600 transition-colors cursor-pointer"
      onClick={() => onOpen(playlist.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ListVideo className="h-4 w-4 text-primary shrink-0" />
          <h3 className="font-semibold text-sm truncate">{playlist.title}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={e => { e.stopPropagation(); onEdit(playlist.id) }}>
            <Edit2 />
          </Button>
          <Button variant="ghost" size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={e => { e.stopPropagation(); onDelete(playlist.id) }}>
            <Trash2 />
          </Button>
        </div>
      </div>

      {playlist.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{playlist.description}</p>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {playlist.completed_count}/{playlist.item_count} completed · {pct}%
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{playlist.source}</Badge>
        {playlist.skill_name && <span>{playlist.skill_name}</span>}
        {playlist.total_duration_seconds > 0 && <span>{fmtDuration(playlist.total_duration_seconds)}</span>}
      </div>
    </div>
  )
}

// ── Playlist Detail Panel ─────────────────────────────────────────────────────

function PlaylistDetail() {
  const {
    detail, detailId, isLoadingDetail, closeDetail,
    openItemCreate, openItemEdit, deleteItem, markItemStatus,
  } = usePlaylistsStore()

  if (!detailId) return null

  if (isLoadingDetail || !detail) {
    return (
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 flex items-center justify-center">
        <PageLoader />
      </div>
    )
  }

  const pct = progressPct(detail)

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1" onClick={closeDetail} />
      <div className="w-[520px] max-w-full bg-card border-l border-border flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={closeDetail}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{detail.title}</h2>
            <p className="text-xs text-muted-foreground">{detail.item_count} videos · {pct}% complete</p>
          </div>
          <Button size="sm" onClick={openItemCreate}>
            <Plus className="h-3.5 w-3.5" />Add Video
          </Button>
        </div>

        {/* Progress */}
        <div className="px-4 py-2 border-b border-border">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {detail.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <ListVideo className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">No videos yet</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={openItemCreate}>
                <Plus className="h-3.5 w-3.5" />Add first video
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {detail.items.map((item, i) => {
                const Icon = STATUS_ICON[item.watch_status]
                return (
                  <li key={item.id} className="group flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
                    <span className="text-xs text-muted-foreground w-5 shrink-0 mt-0.5 text-right">{i + 1}</span>
                    <button
                      type="button"
                      className={`shrink-0 mt-0.5 hover:opacity-70 transition-opacity ${STATUS_COLOR[item.watch_status]}`}
                      onClick={() => {
                        const next: PlaylistItem['watch_status'] =
                          item.watch_status === 'unwatched' ? 'watching'
                          : item.watch_status === 'watching' ? 'completed'
                          : 'unwatched'
                        void markItemStatus(item.id, next)
                      }}
                      title="Cycle status"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{item.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.source}
                        {item.duration_seconds ? ` · ${fmtDuration(item.duration_seconds)}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {item.url && (
                        <Button variant="ghost" size="icon-sm" onClick={() => window.open(item.url!, '_blank')}>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon-sm" onClick={() => openItemEdit(item)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive"
                        onClick={() => void deleteItem(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Summary */}
        {detail.total_duration_seconds > 0 && (
          <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
            Total duration: {fmtDuration(detail.total_duration_seconds)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Playlist Form ─────────────────────────────────────────────────────────────

function PlaylistForm() {
  const { isFormOpen, editingId, items, isSubmitting, formError, closeForm, submit } = usePlaylistsStore()
  const editing = items.find(p => p.id === editingId)
  const [allSkills, setAllSkills] = useState<Array<{ id: string; name: string }>>([])

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistFormSchema), defaultValues: playlistFormDefaults,
  })

  useEffect(() => {
    if (!isFormOpen) { reset(playlistFormDefaults); return }
    if (editing) {
      reset({
        title: editing.title,
        description: editing.description ?? '',
        source: editing.source,
        source_url: editing.source_url ?? '',
        skill_id: editing.skill_id ?? '',
      })
    }
    void api.skills.getAll({ pageSize: 500 }).then(r => {
      if (r.success) setAllSkills((r.data as unknown as { items: Array<{ id: string; name: string }> }).items)
    })
  }, [isFormOpen, editing, reset])

  const selectedSource = watch('source')

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <SheetContent side="right" className="w-[460px] max-w-full">
        <SheetHeader>
          <SheetTitle>{editingId ? 'Edit Playlist' : 'New Playlist'}</SheetTitle>
          <SheetDescription>Organise videos into a learning sequence.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="playlist-form" onSubmit={handleSubmit(v => void submit(v))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. AWS Cloud Practitioner Prep" {...register('title')} aria-invalid={!!errors.title} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} placeholder="What will you learn?" {...register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Source</Label>
                <select {...register('source')} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="youtube">YouTube</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Linked Skill</Label>
                <select {...register('skill_id')} className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="">None</option>
                  {allSkills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            {selectedSource === 'youtube' && (
              <div className="space-y-1.5">
                <Label>YouTube Playlist URL</Label>
                <Input type="url" placeholder="https://www.youtube.com/playlist?list=..." {...register('source_url')} />
                {errors.source_url && <p className="text-xs text-destructive">{errors.source_url.message}</p>}
              </div>
            )}
          </form>
        </SheetBody>
        <SheetFooter>
          {formError && <p className="text-xs text-destructive w-full text-center">{formError}</p>}
          <Button variant="outline" onClick={closeForm} disabled={isSubmitting}>Cancel</Button>
          <Button form="playlist-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Create playlist'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Item Form ─────────────────────────────────────────────────────────────────

function PlaylistItemForm() {
  const {
    isItemFormOpen, editingItemId, isItemSubmitting, itemFormError,
    detail, closeItemForm, submitItem,
  } = usePlaylistsStore()

  const editingItem = detail?.items.find(i => i.id === editingItemId)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlaylistItemFormValues>({
    resolver: zodResolver(playlistItemFormSchema), defaultValues: playlistItemFormDefaults,
  })

  useEffect(() => {
    if (!isItemFormOpen) { reset(playlistItemFormDefaults); return }
    if (editingItem) {
      reset({
        title: editingItem.title,
        url: editingItem.url ?? '',
        source: editingItem.source,
        duration_seconds: editingItem.duration_seconds
          ? Math.floor(editingItem.duration_seconds / 60)
          : null,
      })
    }
  }, [isItemFormOpen, editingItem, reset])

  return (
    <Dialog open={isItemFormOpen} onOpenChange={open => { if (!open) closeItemForm() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingItemId ? 'Edit Video' : 'Add Video'}</DialogTitle>
          <DialogDescription>Add a video to this playlist.</DialogDescription>
        </DialogHeader>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form id="playlist-item-form" onSubmit={handleSubmit(v => void submitItem(v))} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. Introduction to IAM" {...register('title')} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Input placeholder="youtube" {...register('source')} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" min={0} placeholder="—"
                {...register('duration_seconds', {
                  setValueAs: v => v === '' || v === null ? null : Number(v) * 60,
                })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>URL</Label>
            <Input type="url" placeholder="https://…" {...register('url')} />
            {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
          </div>
        </form>
        <DialogFooter>
          {itemFormError && <p className="text-xs text-destructive">{itemFormError}</p>}
          <Button variant="outline" onClick={closeItemForm} disabled={isItemSubmitting}>Cancel</Button>
          <Button form="playlist-item-form" type="submit" disabled={isItemSubmitting}>
            {isItemSubmitting ? 'Saving…' : editingItemId ? 'Save' : 'Add video'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Dialog ─────────────────────────────────────────────────────────────

function DeletePlaylistDialog() {
  const { deletingId, isDeleting, items, cancelDelete, executeDelete } = usePlaylistsStore()
  const playlist = items.find(p => p.id === deletingId)
  return (
    <Dialog open={!!deletingId} onOpenChange={open => { if (!open) cancelDelete() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete playlist</DialogTitle>
          <DialogDescription>
            Delete <strong className="text-foreground">{playlist?.title}</strong> and all its items? This cannot be undone.
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

export function PlaylistsPage() {
  const {
    items, isLoading, listError, filters,
    fetch, setSearch, openCreate, openEdit, confirmDelete, openDetail,
  } = usePlaylistsStore()

  useEffect(() => { void fetch() }, [fetch])

  return (
    <>
      <PageLayout
        title="Playlists"
        description="Organise videos into learning sequences and track your progress."
        actions={<Button onClick={openCreate} size="sm"><Plus />New Playlist</Button>}
      >
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput value={filters.search} onChange={setSearch} placeholder="Search playlists…" className="w-64" />
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
            icon={ListVideo}
            title="No playlists yet"
            description="Create playlists to organise your learning videos into structured sequences."
            action={<Button onClick={openCreate}><Plus />Create your first playlist</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(p => (
              <PlaylistCard key={p.id} playlist={p} onOpen={openDetail} onEdit={openEdit} onDelete={confirmDelete} />
            ))}
          </div>
        )}
      </PageLayout>

      <PlaylistDetail />
      <PlaylistForm />
      <PlaylistItemForm />
      <DeletePlaylistDialog />
    </>
  )
}
