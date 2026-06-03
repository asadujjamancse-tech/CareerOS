import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { EmptyState } from '@shared/components/common/EmptyState'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@shared/components/ui/dialog'
import { tagFormSchema, tagFormDefaults, TAG_PRESET_COLORS, type TagFormValues } from '../schemas/tag.schema'
import { useTagsStore } from '../store/tags.store'

function TagForm() {
  const { isFormOpen, editingId, items, isSubmitting, formError, closeForm, submit } = useTagsStore()
  const editing = items.find(t => t.id === editingId)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: tagFormDefaults,
  })

  useEffect(() => {
    if (!isFormOpen) { reset(tagFormDefaults); return }
    if (editingId && editing) reset({ name: editing.name, color_hex: editing.color_hex })
  }, [isFormOpen, editingId, editing, reset])

  const onSubmit = async (values: TagFormValues) => { await submit(values) }

  return (
    <Dialog open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Tag' : 'New Tag'}</DialogTitle>
          <DialogDescription>Tags can be applied across all modules for quick filtering.</DialogDescription>
        </DialogHeader>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tag-name">Name <span className="text-destructive">*</span></Label>
            <Input id="tag-name" placeholder="e.g. AWS, React, Career" {...register('name')} />
            {errors.name?.message && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Colour</Label>
            <Controller control={control} name="color_hex" render={({ field }) => (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {TAG_PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => field.onChange(c)}
                      className="h-7 w-7 rounded-full border-2 transition-all"
                      style={{ backgroundColor: c, borderColor: field.value === c ? 'white' : 'transparent' }}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={field.value} onChange={e => field.onChange(e.target.value)}
                    className="h-8 w-8 rounded border-0 cursor-pointer bg-transparent" />
                  <Input value={field.value} onChange={e => field.onChange(e.target.value)}
                    placeholder="#6366F1" className="w-28 font-mono text-xs" />
                  <span className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: field.value }} />
                </div>
              </div>
            )} />
          </div>

          {formError && <p className="text-xs text-destructive text-center">{formError}</p>}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={closeForm} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Create tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteTagDialog() {
  const { deletingId, isDeleting, items, cancelDelete, executeDelete } = useTagsStore()
  const tag = items.find(t => t.id === deletingId)
  return (
    <Dialog open={!!deletingId} onOpenChange={open => { if (!open) cancelDelete() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete tag</DialogTitle>
          <DialogDescription>
            Delete <strong className="text-foreground">{tag?.name}</strong>? It will be removed from all items that use it.
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

export function TagsPage() {
  const { items, isLoading, listError, fetch, openCreate, openEdit, confirmDelete } = useTagsStore()

  useEffect(() => { void fetch() }, [fetch])

  return (
    <>
      <PageLayout
        title="Tags"
        description="Create and manage tags to organise content across all modules."
        actions={<Button onClick={openCreate} size="sm"><Plus />New Tag</Button>}
      >
        {isLoading ? (
          <PageLoader />
        ) : listError ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground">{listError}</p>
            <Button variant="outline" size="sm" onClick={() => void fetch()} className="mt-3">Retry</Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No tags yet"
            description="Create tags to label and group your skills, projects, notes, and other content."
            action={<Button onClick={openCreate}><Plus />Create your first tag</Button>}
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">{items.length} {items.length === 1 ? 'tag' : 'tags'}</p>
            <div className="flex flex-wrap gap-3">
              {items.map(tag => (
                <div key={tag.id}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:border-zinc-600 transition-colors"
                >
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: tag.color_hex }} />
                  <span className="text-sm font-medium" style={{ color: tag.color_hex }}>{tag.name}</span>
                  {tag.usage_count > 0 && (
                    <span className="text-xs text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5">
                      {tag.usage_count}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(tag.id)} aria-label="Edit tag"><Edit2 /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => confirmDelete(tag.id)}
                      className="text-muted-foreground hover:text-destructive" aria-label="Delete tag"><Trash2 /></Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </PageLayout>
      <TagForm />
      <DeleteTagDialog />
    </>
  )
}
