import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Plus, Edit2, Trash2, Pin, X } from 'lucide-react'
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
import { Switch } from '@shared/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Separator } from '@shared/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@shared/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetBody, SheetFooter,
} from '@shared/components/ui/sheet'
import { noteFormSchema, noteFormDefaults, type NoteFormValues } from '../schemas/note.schema'
import { useNotesStore } from '../store/notes.store'
import type { NoteType, NoteWithTags, Tag } from '../types/note.types'
import { formatRelativeDate } from '@shared/lib/utils'

const TYPE_LABELS: Record<NoteType, string> = {
  general: 'General', meeting: 'Meeting', research: 'Research',
  tutorial: 'Tutorial', reference: 'Reference', idea: 'Idea',
}

function NoteCard({ note, onEdit, onDelete }: {
  note: NoteWithTags; onEdit: (id: string) => void; onDelete: (id: string) => void
}) {
  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:border-zinc-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {note.is_pinned === 1 && <Pin className="h-3 w-3 text-primary shrink-0" />}
          <h3 className="font-semibold text-sm truncate" title={note.title}>{note.title}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(note.id)} aria-label="Edit"><Edit2 /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(note.id)}
            className="text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 /></Button>
        </div>
      </div>
      {note.content && (
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{note.content.slice(0, 200)}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border text-xs text-muted-foreground">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{TYPE_LABELS[note.type]}</Badge>
        <span>{formatRelativeDate(note.updated_at)}</span>
      </div>
    </div>
  )
}

function NoteForm() {
  const { isFormOpen, editingId, detail, isSubmitting, formError, closeForm, submit } = useNotesStore()
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [tagSearch, setTagSearch] = useState('')

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema), defaultValues: noteFormDefaults,
  })

  useEffect(() => {
    if (!isFormOpen) { reset(noteFormDefaults); setTagSearch(''); return }
    if (editingId && detail) {
      reset({
        title: detail.title, content: detail.content,
        type: detail.type as NoteFormValues['type'],
        is_pinned: detail.is_pinned === 1,
        tag_ids: detail.tags.map(t => t.id),
      })
    }
  }, [isFormOpen, editingId, detail, reset])

  useEffect(() => {
    if (!isFormOpen) return
    void api.tags.getAll().then(r => { if (r.success) setAllTags(r.data as Tag[]) })
  }, [isFormOpen])

  const onSubmit = async (v: NoteFormValues) => { await submit(v) }
  const filteredTags = tagSearch
    ? allTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
    : allTags

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <SheetContent side="right" className="w-[520px] max-w-full">
        <SheetHeader>
          <SheetTitle>{editingId ? 'Edit Note' : 'New Note'}</SheetTitle>
          <SheetDescription>
            {editingId ? 'Update this note.' : 'Capture knowledge, meeting notes, research, or ideas.'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="note-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="note-title">Title <span className="text-destructive">*</span></Label>
              <Input id="note-title" placeholder="Note title…" {...register('title')} aria-invalid={!!errors.title} />
              {errors.title?.message && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Controller control={control} name="type" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5 flex flex-col justify-end">
                <Controller control={control} name="is_pinned" render={({ field }) => (
                  <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 h-10">
                    <Label htmlFor="pin-note" className="cursor-pointer text-sm">Pin note</Label>
                    <Switch id="pin-note" checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note-content">Content</Label>
              <Textarea id="note-content" placeholder="Write your note here…" rows={12} {...register('content')} />
              {errors.content?.message && <p className="text-xs text-destructive">{errors.content.message}</p>}
            </div>

            <Separator />

            <Controller control={control} name="tag_ids" render={({ field }) => (
              <div className="space-y-2">
                <Label>Tags</Label>
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map(tagId => {
                      const tag = allTags.find(t => t.id === tagId)
                      if (!tag) return null
                      return (
                        <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border"
                          style={{ borderColor: tag.color_hex + '60', color: tag.color_hex }}>
                          {tag.name}
                          <button type="button" onClick={() => field.onChange(field.value.filter(id => id !== tagId))} className="hover:opacity-70">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
                {allTags.length > 0 && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <input type="text" value={tagSearch} onChange={e => setTagSearch(e.target.value)}
                      placeholder="Search tags…" className="w-full px-3 py-2 text-xs bg-transparent border-b border-border focus:outline-none" />
                    <div className="max-h-32 overflow-y-auto p-1">
                      {filteredTags.map(tag => {
                        const selected = field.value.includes(tag.id)
                        return (
                          <button key={tag.id} type="button"
                            onClick={() => field.onChange(selected ? field.value.filter(id => id !== tag.id) : [...field.value, tag.id])}
                            className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors text-left">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: tag.color_hex }} />
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
          <Button form="note-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Create note'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DeleteNoteDialog() {
  const { deletingId, isDeleting, items, cancelDelete, executeDelete } = useNotesStore()
  const note = items.find(n => n.id === deletingId)
  return (
    <Dialog open={!!deletingId} onOpenChange={open => { if (!open) cancelDelete() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete note</DialogTitle>
          <DialogDescription>
            Delete <strong className="text-foreground">{note?.title}</strong>? This cannot be undone.
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

export function NotesPage() {
  const {
    items, total, page, pageSize, totalPages, isLoading, listError,
    filters, fetch, setSearch, setPage, setFilterField, clearFilters,
    openCreate, openEdit, confirmDelete,
  } = useNotesStore()

  useEffect(() => { void fetch() }, [fetch])

  const hasFilters = !!filters.search || !!filters.type || filters.is_pinned !== null

  return (
    <>
      <PageLayout
        title="Notes"
        description="Capture meeting notes, research, tutorials, and reference material."
        actions={<Button onClick={openCreate} size="sm"><Plus />New Note</Button>}
      >
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput value={filters.search} onChange={setSearch} placeholder="Search notes…" className="w-64" />

          <Select value={filters.type || '__all__'}
            onValueChange={v => setFilterField('type', v === '__all__' ? '' : v as NoteType)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            value={filters.is_pinned === null ? '__all__' : filters.is_pinned ? 'pinned' : 'unpinned'}
            onValueChange={v => setFilterField('is_pinned', v === '__all__' ? null : v === 'pinned')}
          >
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All notes</SelectItem>
              <SelectItem value="pinned">Pinned</SelectItem>
              <SelectItem value="unpinned">Unpinned</SelectItem>
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
            icon={FileText}
            title={hasFilters ? 'No notes match your filters' : 'No notes yet'}
            description={hasFilters ? 'Try adjusting your filters.' : 'Create a note to capture ideas, meeting summaries, or research findings.'}
            action={!hasFilters ? <Button onClick={openCreate}><Plus />Create your first note</Button> : undefined}
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              {total} {total === 1 ? 'note' : 'notes'}{hasFilters && ' matching filters'}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(note => <NoteCard key={note.id} note={note} onEdit={openEdit} onDelete={confirmDelete} />)}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </PageLayout>
      <NoteForm />
      <DeleteNoteDialog />
    </>
  )
}
