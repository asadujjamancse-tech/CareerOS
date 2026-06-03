import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Plus, Edit2, Trash2, X, Upload, ExternalLink, FolderOpen } from 'lucide-react'
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
import { documentFormSchema, documentFormDefaults, type DocumentFormValues } from '../schemas/document.schema'
import { useDocumentsStore } from '../store/documents.store'
import type { DocumentType, DocumentWithTags, Tag } from '../types/document.types'
import { formatRelativeDate } from '@shared/lib/utils'

const TYPE_LABELS: Record<DocumentType, string> = {
  resume: 'Resume',
  'cover-letter': 'Cover Letter',
  certificate: 'Certificate',
  report: 'Report',
  template: 'Template',
  reference: 'Reference',
  other: 'Other',
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentCard({ doc, onEdit, onDelete, onOpen }: {
  doc: DocumentWithTags
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onOpen: (id: string) => void
}) {
  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:border-zinc-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <h3 className="font-semibold text-sm truncate" title={doc.title}>{doc.title}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={() => onOpen(doc.id)} aria-label="Open file" title="Open file">
            <ExternalLink />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(doc.id)} aria-label="Edit"><Edit2 /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(doc.id)}
            className="text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 /></Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground truncate -mt-1" title={doc.original_filename}>
        {doc.original_filename}
      </p>

      {doc.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {doc.description.slice(0, 140)}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {TYPE_LABELS[doc.type]}
          </Badge>
          {doc.version && doc.version !== '1.0' && (
            <span className="text-muted-foreground">v{doc.version}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {doc.file_size_bytes && <span>{formatFileSize(doc.file_size_bytes)}</span>}
          {doc.tag_count > 0 && <span>{doc.tag_count} tag{doc.tag_count > 1 ? 's' : ''}</span>}
          <span>{formatRelativeDate(doc.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}

function DocumentForm() {
  const { isFormOpen, editingId, detail, isSubmitting, formError, closeForm, submit } = useDocumentsStore()
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema), defaultValues: documentFormDefaults,
  })

  const filePath = watch('file_path')
  const originalFilename = watch('original_filename')

  useEffect(() => {
    if (!isFormOpen) { reset(documentFormDefaults); setTagSearch(''); return }
    if (editingId && detail) {
      reset({
        title: detail.title,
        description: detail.description ?? '',
        type: detail.type as DocumentFormValues['type'],
        version: detail.version ?? '1.0',
        notes: detail.notes ?? '',
        tag_ids: detail.tags.map(t => t.id),
        file_path: detail.file_path,
        original_filename: detail.original_filename,
        mime_type: detail.mime_type,
        file_size_bytes: detail.file_size_bytes,
      })
    }
  }, [isFormOpen, editingId, detail, reset])

  useEffect(() => {
    if (!isFormOpen) return
    void api.tags.getAll().then(r => { if (r.success) setAllTags(r.data as Tag[]) })
  }, [isFormOpen])

  async function handleImportFile() {
    setIsImporting(true)
    try {
      const r = await api.storage.importFile({
        category: 'documents',
        accept: ['pdf', 'doc', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg'],
        title: 'Select Document',
      })
      if (r.success) {
        setValue('file_path', r.data.path)
        setValue('original_filename', r.data.originalName)
        setValue('mime_type', r.data.mimeType)
        setValue('file_size_bytes', r.data.size)
        if (!watch('title')) setValue('title', r.data.originalName.replace(/\.[^.]+$/, ''))
      }
    } finally { setIsImporting(false) }
  }

  const onSubmit = async (v: DocumentFormValues) => { await submit(v) }

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <SheetContent side="right" className="w-[480px] max-w-full">
        <SheetHeader>
          <SheetTitle>{editingId ? 'Edit Document' : 'Import Document'}</SheetTitle>
          <SheetDescription>
            {editingId ? 'Update document details.' : 'Import a file and add metadata to organise it.'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="document-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!editingId && (
              <div className="space-y-1.5">
                <Label>File <span className="text-destructive">*</span></Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleImportFile()}
                    disabled={isImporting} className="gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    {isImporting ? 'Importing…' : 'Browse File'}
                  </Button>
                  {originalFilename && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                      <span className="truncate">{originalFilename}</span>
                      <button type="button" onClick={() => {
                        setValue('file_path', ''); setValue('original_filename', '')
                        setValue('mime_type', null); setValue('file_size_bytes', null)
                      }} className="hover:text-destructive shrink-0">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                {!filePath && !isImporting && (
                  <p className="text-xs text-muted-foreground">Select a PDF, Word doc, text file, or image.</p>
                )}
              </div>
            )}

            {editingId && originalFilename && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{originalFilename}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Title <span className="text-destructive">*</span></Label>
              <Input id="doc-title" placeholder="Document title…" {...register('title')} aria-invalid={!!errors.title} />
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
              <div className="space-y-1.5">
                <Label htmlFor="doc-version">Version</Label>
                <Input id="doc-version" placeholder="1.0" {...register('version')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-description">Description</Label>
              <Textarea id="doc-description" rows={3} placeholder="Brief description…" {...register('description')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-notes">Notes</Label>
              <Textarea id="doc-notes" rows={3} placeholder="Additional notes, context, or usage tips…" {...register('notes')} />
            </div>

            <Separator />

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
                    <div className="max-h-32 overflow-y-auto p-1">
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
          <Button form="document-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Import document'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DeleteDocumentDialog() {
  const { deletingId, isDeleting, items, cancelDelete, executeDelete } = useDocumentsStore()
  const doc = items.find(d => d.id === deletingId)
  return (
    <Dialog open={!!deletingId} onOpenChange={open => { if (!open) cancelDelete() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete document</DialogTitle>
          <DialogDescription>
            Delete <strong className="text-foreground">{doc?.title}</strong>? The record will be removed but the original file will not be deleted from disk.
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

export function DocumentsPage() {
  const {
    items, total, page, pageSize, totalPages, isLoading, listError,
    filters, fetch, setSearch, setPage, setFilterField, clearFilters,
    openCreate, openEdit, confirmDelete, openDocument,
  } = useDocumentsStore()

  useEffect(() => { void fetch() }, [fetch])

  const hasFilters = !!filters.search || !!filters.type

  return (
    <>
      <PageLayout
        title="Documents"
        description="Store resumes, cover letters, certificates, reports, and reference documents locally."
        actions={
          <Button onClick={openCreate} size="sm">
            <FolderOpen className="h-4 w-4" />Import Document
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput value={filters.search} onChange={setSearch} placeholder="Search documents…" className="w-64" />

          <Select value={filters.type || '__all__'}
            onValueChange={v => setFilterField('type', v === '__all__' ? '' : (v as DocumentType))}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
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
            icon={FileText}
            title={hasFilters ? 'No documents match your filters' : 'No documents yet'}
            description={hasFilters
              ? 'Try adjusting your filters.'
              : 'Import documents to keep your resumes, cover letters, certificates, and reference files organised in one place.'}
            action={!hasFilters ? <Button onClick={openCreate}><Plus />Import your first document</Button> : undefined}
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              {total} {total === 1 ? 'document' : 'documents'}{hasFilters && ' matching filters'}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onEdit={openEdit}
                  onDelete={confirmDelete}
                  onOpen={(id) => { void openDocument(id) }}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </PageLayout>
      <DocumentForm />
      <DeleteDocumentDialog />
    </>
  )
}
