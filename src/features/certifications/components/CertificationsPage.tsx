import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Award, Plus, Edit2, Trash2, ExternalLink, Upload, X, AlertTriangle } from 'lucide-react'
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@shared/components/ui/sheet'
import { certFormSchema, certFormDefaults, type CertFormValues } from '../schemas/certification.schema'
import { useCertificationsStore } from '../store/certifications.store'
import type { CertificationStatus, CertificationWithMeta, SkillRef, Tag } from '../types/certification.types'

const STATUS_CONFIG: Record<CertificationStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'destructive' | 'secondary' }> = {
  planned: { label: 'Planned', variant: 'secondary' },
  'in-progress': { label: 'In Progress', variant: 'info' },
  earned: { label: 'Earned', variant: 'success' },
  expired: { label: 'Expired', variant: 'destructive' },
  revoked: { label: 'Revoked', variant: 'secondary' },
}

function CertCard({ cert, onEdit, onDelete }: {
  cert: CertificationWithMeta; onEdit: (id: string) => void; onDelete: (id: string) => void
}) {
  const cfg = STATUS_CONFIG[cert.status]
  const expiringSoon = cert.days_until_expiry !== null && cert.days_until_expiry <= 90 && cert.days_until_expiry > 0

  return (
    <div className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 hover:border-zinc-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Award className="h-4 w-4 text-primary shrink-0" />
          <h3 className="font-semibold text-sm truncate" title={cert.name}>{cert.name}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(cert.id)}><Edit2 /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(cert.id)} className="text-muted-foreground hover:text-destructive"><Trash2 /></Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">{cert.issuer}</p>

      {cert.description && <p className="text-xs text-muted-foreground line-clamp-2">{cert.description.slice(0, 120)}</p>}

      {expiringSoon && (
        <div className="flex items-center gap-1 text-xs text-amber-500">
          <AlertTriangle className="h-3 w-3" />
          <span>Expires in {cert.days_until_expiry} days</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border text-xs text-muted-foreground">
        <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
        <div className="flex items-center gap-3">
          {cert.expiry_date && cert.status === 'earned' && (
            <span>Expires {new Date(cert.expiry_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</span>
          )}
          {cert.skill_count > 0 && <span>{cert.skill_count} skill{cert.skill_count > 1 ? 's' : ''}</span>}
        </div>
      </div>
    </div>
  )
}

function CertForm() {
  const { isFormOpen, editingId, detail, isSubmitting, formError, closeForm, submit } = useCertificationsStore()
  const [allSkills, setAllSkills] = useState<SkillRef[]>([])
  const [skillSearch, setSkillSearch] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<CertFormValues>({
    resolver: zodResolver(certFormSchema), defaultValues: certFormDefaults,
  })

  const certPath = watch('certificate_path')

  useEffect(() => {
    if (!isFormOpen) { reset(certFormDefaults); setSkillSearch(''); setTagSearch(''); return }
    if (editingId && detail) {
      reset({
        name: detail.name, issuer: detail.issuer, status: detail.status as CertFormValues['status'],
        description: detail.description ?? '', credential_id: detail.credential_id ?? '',
        credential_url: detail.credential_url ?? '', certificate_path: detail.certificate_path ?? '',
        issue_date: detail.issue_date ?? '', expiry_date: detail.expiry_date ?? '',
        score: detail.score, passing_score: detail.passing_score,
        notes: detail.notes ?? '', skill_ids: detail.skills.map(s => s.id), tag_ids: detail.tags.map(t => t.id),
      })
    }
  }, [isFormOpen, editingId, detail, reset])

  useEffect(() => {
    if (!isFormOpen) return
    void api.skills.getAll({ pageSize: 500 }).then(r => { if (r.success) setAllSkills((r.data as unknown as { items: SkillRef[] }).items) })
    void api.tags.getAll().then(r => { if (r.success) setAllTags(r.data as Tag[]) })
  }, [isFormOpen])

  async function handleImportCert() {
    setIsImporting(true)
    try {
      const r = await api.storage.importFile({ category: 'certifications', accept: ['pdf', 'jpg', 'jpeg', 'png'], title: 'Select Certificate' })
      if (r.success) setValue('certificate_path', r.data.path)
    } finally { setIsImporting(false) }
  }

  const onSubmit = async (v: CertFormValues) => { await submit(v) }

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <SheetContent side="right" className="w-[480px] max-w-full">
        <SheetHeader>
          <SheetTitle>{editingId ? 'Edit Certification' : 'Add Certification'}</SheetTitle>
          <SheetDescription>Track credentials, exam dates, expiry, and linked skills.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="cert-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cert-name">Name <span className="text-destructive">*</span></Label>
              <Input id="cert-name" placeholder="e.g. AWS Solutions Architect" {...register('name')} />
              {errors.name?.message && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cert-issuer">Issuer <span className="text-destructive">*</span></Label>
              <Input id="cert-issuer" placeholder="e.g. Amazon Web Services" {...register('issuer')} />
              {errors.issuer?.message && <p className="text-xs text-destructive">{errors.issuer.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller control={control} name="status" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([v, { label }]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-issue">Issue Date</Label>
                <Input id="c-issue" type="date" {...register('issue_date')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-expiry">Expiry Date</Label>
                <Input id="c-expiry" type="date" {...register('expiry_date')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-score">Score</Label>
                <Input id="c-score" type="number" min={0} max={100} step={0.1} placeholder="—" {...register('score')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-pass">Passing Score</Label>
                <Input id="c-pass" type="number" min={0} max={100} step={0.1} placeholder="—" {...register('passing_score')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-cred-id">Credential ID</Label>
              <Input id="c-cred-id" placeholder="e.g. ABC-123456" {...register('credential_id')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-cred-url">Credential URL</Label>
              <Input id="c-cred-url" type="url" placeholder="https://…" {...register('credential_url')} />
              {errors.credential_url?.message && <p className="text-xs text-destructive">{errors.credential_url.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Certificate File</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void handleImportCert()} disabled={isImporting} className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" />{isImporting ? 'Importing…' : 'Browse File'}
                </Button>
                {certPath && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                    <span className="truncate">{certPath.split('/').pop()}</span>
                    <button type="button" onClick={() => setValue('certificate_path', '')} className="hover:text-destructive shrink-0"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label htmlFor="c-desc">Description</Label>
              <Textarea id="c-desc" rows={3} {...register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-notes">Study Notes</Label>
              <Textarea id="c-notes" rows={3} placeholder="Resources, notes, exam tips…" {...register('notes')} />
            </div>
            <Separator />
            {/* Skills */}
            <Controller control={control} name="skill_ids" render={({ field }) => (
              <div className="space-y-2">
                <Label>Related Skills</Label>
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map(sid => {
                      const s = allSkills.find(x => x.id === sid); if (!s) return null
                      return (
                        <span key={sid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border border-border">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.category_color }} />{s.name}
                          <button type="button" onClick={() => field.onChange(field.value.filter(id => id !== sid))} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                        </span>
                      )
                    })}
                  </div>
                )}
                <div className="border border-border rounded-md overflow-hidden">
                  <input type="text" value={skillSearch} onChange={e => setSkillSearch(e.target.value)} placeholder="Search skills…" className="w-full px-3 py-2 text-xs bg-transparent border-b border-border focus:outline-none" />
                  <div className="max-h-32 overflow-y-auto p-1">
                    {allSkills.filter(s => !field.value.includes(s.id) && (!skillSearch || s.name.toLowerCase().includes(skillSearch.toLowerCase()))).slice(0, 30).map(s => (
                      <button key={s.id} type="button" onClick={() => { field.onChange([...field.value, s.id]); setSkillSearch('') }}
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent text-left">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.category_color }} />
                        <span className="flex-1">{s.name}</span><span className="text-muted-foreground">{s.category_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )} />
            {/* Tags */}
            <Controller control={control} name="tag_ids" render={({ field }) => (
              <div className="space-y-2">
                <Label>Tags</Label>
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map(tid => {
                      const tag = allTags.find(t => t.id === tid); if (!tag) return null
                      return (<span key={tid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border" style={{ borderColor: tag.color_hex + '60', color: tag.color_hex }}>
                        {tag.name}<button type="button" onClick={() => field.onChange(field.value.filter(id => id !== tid))}><X className="h-2.5 w-2.5" /></button></span>)
                    })}
                  </div>
                )}
                {allTags.length > 0 && (
                  <div className="border border-border rounded-md overflow-hidden">
                    <input type="text" value={tagSearch} onChange={e => setTagSearch(e.target.value)} placeholder="Search tags…" className="w-full px-3 py-2 text-xs bg-transparent border-b border-border focus:outline-none" />
                    <div className="max-h-28 overflow-y-auto p-1">
                      {allTags.filter(t => !tagSearch || t.name.toLowerCase().includes(tagSearch.toLowerCase())).map(tag => {
                        const selected = field.value.includes(tag.id)
                        return (<button key={tag.id} type="button" onClick={() => field.onChange(selected ? field.value.filter(id => id !== tag.id) : [...field.value, tag.id])}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent text-left">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color_hex }} /><span className="flex-1">{tag.name}</span>
                          {selected && <Badge variant="secondary" className="text-[10px] py-0 px-1">Selected</Badge>}</button>)
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
          <Button form="cert-form" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Add certification'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function DeleteCertDialog() {
  const { deletingId, isDeleting, items, cancelDelete, executeDelete } = useCertificationsStore()
  const cert = items.find(c => c.id === deletingId)
  return (
    <Dialog open={!!deletingId} onOpenChange={open => { if (!open) cancelDelete() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Delete certification</DialogTitle>
          <DialogDescription>Delete <strong className="text-foreground">{cert?.name}</strong>? This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={() => void executeDelete()} disabled={isDeleting}>{isDeleting ? 'Deleting…' : 'Delete'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CertificationsPage() {
  const { items, total, page, pageSize, totalPages, isLoading, listError, filters, fetch, setSearch, setPage, setFilterField, clearFilters, openCreate, openEdit, confirmDelete } = useCertificationsStore()
  useEffect(() => { void fetch() }, [fetch])
  const hasFilters = !!filters.search || !!filters.status

  return (
    <>
      <PageLayout title="Certifications" description="Track professional credentials, exam dates, expiry reminders, and linked skills."
        actions={<Button onClick={openCreate} size="sm"><Plus />Add Certification</Button>}>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput value={filters.search} onChange={setSearch} placeholder="Search certifications…" className="w-64" />
          <Select value={filters.status || '__all__'} onValueChange={v => setFilterField('status', v === '__all__' ? '' : (v as CertificationStatus))}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([v, { label }]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1"><X className="h-3 w-3" />Clear</Button>}
        </div>

        {isLoading ? <PageLoader /> : listError ? (
          <div className="text-center py-20"><p className="text-sm text-muted-foreground">{listError}</p><Button variant="outline" size="sm" onClick={() => void fetch()} className="mt-3">Retry</Button></div>
        ) : items.length === 0 ? (
          <EmptyState icon={Award} title={hasFilters ? 'No certifications match' : 'No certifications yet'}
            description={hasFilters ? 'Try adjusting your filters.' : 'Track your credentials, exam dates, and the skills each certification validates.'}
            action={!hasFilters ? <Button onClick={openCreate}><Plus />Add your first certification</Button> : undefined} />
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">{total} certification{total !== 1 ? 's' : ''}{hasFilters && ' matching filters'}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(cert => <CertCard key={cert.id} cert={cert} onEdit={openEdit} onDelete={confirmDelete} />)}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </PageLayout>
      <CertForm />
      <DeleteCertDialog />
    </>
  )
}

// Suppress unused import warning
void ExternalLink
