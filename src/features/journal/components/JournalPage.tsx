import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { BookOpen, Plus, Edit2, Trash2, Lock, X } from 'lucide-react'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@shared/components/ui/sheet'
import { journalFormSchema, journalFormDefaults, type JournalFormValues } from '../schemas/journal.schema'
import { useJournalStore } from '../store/journal.store'
import type { JournalCategory, JournalMood, JournalWithTags, Tag } from '../types/journal.types'

const CATEGORY_LABELS: Record<JournalCategory, string> = {
  achievement: '🏆 Achievement', challenge: '💪 Challenge', reflection: '🤔 Reflection',
  learning: '📚 Learning', goal: '🎯 Goal', feedback: '💬 Feedback', general: '📝 General',
}
const MOOD_LABELS: Record<JournalMood, string> = {
  great: '😄 Great', good: '🙂 Good', neutral: '😐 Neutral', bad: '😕 Bad', terrible: '😞 Terrible',
}

function JournalCard({ entry, onEdit, onDelete }: {
  entry: JournalWithTags; onEdit: (id: string) => void; onDelete: (id: string) => void
}) {
  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:border-zinc-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {entry.is_private === 1 && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
          <h3 className="font-semibold text-sm truncate" title={entry.title}>{entry.title}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(entry.id)}><Edit2 /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(entry.id)} className="text-muted-foreground hover:text-destructive"><Trash2 /></Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{new Date(entry.entry_date + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
      {entry.content && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{entry.content.slice(0, 150)}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border text-xs">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{CATEGORY_LABELS[entry.category]?.split(' ')[1] ?? entry.category}</Badge>
        {entry.mood && <span className="text-muted-foreground">{MOOD_LABELS[entry.mood]}</span>}
      </div>
    </div>
  )
}

function JournalForm() {
  const { isFormOpen, editingId, detail, isSubmitting, formError, closeForm, submit } = useJournalStore()
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [tagSearch, setTagSearch] = useState('')

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<JournalFormValues>({
    resolver: zodResolver(journalFormSchema), defaultValues: journalFormDefaults,
  })

  useEffect(() => {
    if (!isFormOpen) { reset({ ...journalFormDefaults, entry_date: new Date().toISOString().slice(0, 10) }); setTagSearch(''); return }
    if (editingId && detail) {
      reset({
        title: detail.title, content: detail.content, entry_date: detail.entry_date,
        mood: detail.mood as JournalFormValues['mood'] ?? null,
        energy_level: detail.energy_level, category: detail.category as JournalFormValues['category'],
        is_private: detail.is_private === 1, tag_ids: detail.tags.map(t => t.id),
      })
    }
  }, [isFormOpen, editingId, detail, reset])

  useEffect(() => {
    if (!isFormOpen) return
    void api.tags.getAll().then(r => { if (r.success) setAllTags(r.data as Tag[]) })
  }, [isFormOpen])

  const onSubmit = async (v: JournalFormValues) => { await submit(v) }
  const filteredTags = tagSearch ? allTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())) : allTags

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <SheetContent side="right" className="w-[520px] max-w-full">
        <SheetHeader>
          <SheetTitle>{editingId ? 'Edit Entry' : 'New Journal Entry'}</SheetTitle>
          <SheetDescription>Record your career reflections, achievements, and learnings.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="journal-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="j-title">Title <span className="text-destructive">*</span></Label>
              <Input id="j-title" placeholder="Entry title…" {...register('title')} />
              {errors.title?.message && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="j-date">Date <span className="text-destructive">*</span></Label>
                <Input id="j-date" type="date" {...register('entry_date')} />
                {errors.entry_date?.message && <p className="text-xs text-destructive">{errors.entry_date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Controller control={control} name="category" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Mood</Label>
                <Controller control={control} name="mood" render={({ field }) => (
                  <Select value={field.value ?? '__none__'} onValueChange={v => field.onChange(v === '__none__' ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Select mood" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No mood</SelectItem>
                      {Object.entries(MOOD_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="energy">Energy (1–5)</Label>
                <Input id="energy" type="number" min={1} max={5} placeholder="—" {...register('energy_level')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="j-content">Content</Label>
              <Textarea id="j-content" placeholder="What happened today? What did you learn?" rows={10} {...register('content')} />
            </div>

            <Controller control={control} name="is_private" render={({ field }) => (
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <Label htmlFor="j-private" className="cursor-pointer">Private entry</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Excluded from exports</p>
                </div>
                <Switch id="j-private" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )} />

            <Separator />

            <Controller control={control} name="tag_ids" render={({ field }) => (
              <div className="space-y-2">
                <Label>Tags</Label>
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map(tagId => {
                      const tag = allTags.find(t => t.id === tagId); if (!tag) return null
                      return (
                        <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border"
                          style={{ borderColor: tag.color_hex + '60', color: tag.color_hex }}>
                          {tag.name}
                          <button type="button" onClick={() => field.onChange(field.value.filter(id => id !== tagId))} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                        </span>
                      )
                    })}
                  </div>
                )}
                {allTags.length > 0 && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <input type="text" value={tagSearch} onChange={e => setTagSearch(e.target.value)} placeholder="Search tags…" className="w-full px-3 py-2 text-xs bg-transparent border-b border-border focus:outline-none" />
                    <div className="max-h-28 overflow-y-auto p-1">
                      {filteredTags.map(tag => {
                        const selected = field.value.includes(tag.id)
                        return (
                          <button key={tag.id} type="button" onClick={() => field.onChange(selected ? field.value.filter(id => id !== tag.id) : [...field.value, tag.id])}
                            className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors text-left">
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
          <Button form="journal-form" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Create entry'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DeleteJournalDialog() {
  const { deletingId, isDeleting, items, cancelDelete, executeDelete } = useJournalStore()
  const entry = items.find(e => e.id === deletingId)
  return (
    <Dialog open={!!deletingId} onOpenChange={open => { if (!open) cancelDelete() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete entry</DialogTitle>
          <DialogDescription>Delete <strong className="text-foreground">{entry?.title}</strong>? This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={() => void executeDelete()} disabled={isDeleting}>{isDeleting ? 'Deleting…' : 'Delete'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function JournalPage() {
  const { items, total, page, pageSize, totalPages, isLoading, listError, filters, fetch, setSearch, setPage, setFilterField, clearFilters, openCreate, openEdit, confirmDelete } = useJournalStore()
  useEffect(() => { void fetch() }, [fetch])
  const hasFilters = !!filters.search || !!filters.category || !!filters.mood || !!filters.from_date || !!filters.to_date

  return (
    <>
      <PageLayout title="Career Journal" description="Record daily reflections, achievements, challenges, and goals."
        actions={<Button onClick={openCreate} size="sm"><Plus />New Entry</Button>}>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput value={filters.search} onChange={setSearch} placeholder="Search entries…" className="w-64" />
          <Select value={filters.category || '__all__'} onValueChange={v => setFilterField('category', v === '__all__' ? '' : (v as JournalCategory))}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.mood || '__all__'} onValueChange={v => setFilterField('mood', v === '__all__' ? '' : (v as JournalMood))}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All moods" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All moods</SelectItem>
              {Object.entries(MOOD_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1"><X className="h-3 w-3" />Clear</Button>}
        </div>

        {isLoading ? <PageLoader /> : listError ? (
          <div className="text-center py-20"><p className="text-sm text-muted-foreground">{listError}</p><Button variant="outline" size="sm" onClick={() => void fetch()} className="mt-3">Retry</Button></div>
        ) : items.length === 0 ? (
          <EmptyState icon={BookOpen} title={hasFilters ? 'No entries match your filters' : 'No journal entries yet'}
            description={hasFilters ? 'Try adjusting your filters.' : 'Start your career journal to track reflections, achievements, and growth.'}
            action={!hasFilters ? <Button onClick={openCreate}><Plus />Write your first entry</Button> : undefined} />
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">{total} {total === 1 ? 'entry' : 'entries'}{hasFilters && ' matching filters'}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(e => <JournalCard key={e.id} entry={e} onEdit={openEdit} onDelete={confirmDelete} />)}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </PageLayout>
      <JournalForm />
      <DeleteJournalDialog />
    </>
  )
}
