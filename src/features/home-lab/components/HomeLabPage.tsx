import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FlaskConical, Plus, Edit2, Trash2, X, Clock, CheckSquare,
  ChevronRight, AlertCircle, CheckCircle2, Minus, Beaker,
} from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Switch } from '@shared/components/ui/switch'
import { homeLabFormSchema, homeLabFormDefaults, type HomeLabFormValues } from '../schemas/home-lab.schema'
import { useHomeLabStore } from '../store/home-lab.store'
import type { HomeLabStatus, HomeLabWithMeta, HomeLabSkillRef } from '@shared/types/entities'

const STATUS_CONFIG: Record<HomeLabStatus, { label: string; variant: 'secondary' | 'info' | 'success' | 'warning' | 'destructive' }> = {
  planned: { label: 'Planned', variant: 'secondary' },
  'in-progress': { label: 'In Progress', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  abandoned: { label: 'Abandoned', variant: 'destructive' },
}

function fmt(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Lab Card ─────────────────────────────────────────────────────────────────

function LabCard({ lab, onEdit, onDelete, onOpen }: {
  lab: HomeLabWithMeta
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onOpen: (id: string) => void
}) {
  const cfg = STATUS_CONFIG[lab.status]

  return (
    <div
      className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 hover:border-zinc-600 transition-colors cursor-pointer"
      onClick={() => onOpen(lab.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="h-4 w-4 text-primary shrink-0" />
          <h3 className="font-semibold text-sm truncate">{lab.title}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={e => { e.stopPropagation(); onEdit(lab.id) }}><Edit2 /></Button>
          <Button variant="ghost" size="icon-sm" onClick={e => { e.stopPropagation(); onDelete(lab.id) }} className="text-muted-foreground hover:text-destructive"><Trash2 /></Button>
        </div>
      </div>

      {lab.description && <p className="text-xs text-muted-foreground line-clamp-2">{lab.description}</p>}

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{lab.done_task_count}/{lab.task_count} tasks</span>
          <span>{lab.completion_pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${lab.completion_pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border text-xs text-muted-foreground">
        <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
        <div className="flex items-center gap-3">
          {lab.total_minutes > 0 && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmt(lab.total_minutes)}</span>
          )}
          {lab.skill_count > 0 && <span>{lab.skill_count} skill{lab.skill_count !== 1 ? 's' : ''}</span>}
        </div>
      </div>
    </div>
  )
}

// ── Lab Form ─────────────────────────────────────────────────────────────────

function LabForm() {
  const { isFormOpen, editingId, detail, isSubmitting, formError, closeForm, submit } = useHomeLabStore()
  const [allSkills, setAllSkills] = useState<HomeLabSkillRef[]>([])
  const [allCerts, setAllCerts] = useState<Array<{ id: string; name: string; issuer: string }>>([])
  const [skillSearch, setSkillSearch] = useState('')
  const [certSearch, setCertSearch] = useState('')

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<HomeLabFormValues>({
    resolver: zodResolver(homeLabFormSchema),
    defaultValues: homeLabFormDefaults,
  })

  const status = watch('status')

  useEffect(() => {
    if (!isFormOpen) { reset(homeLabFormDefaults); setSkillSearch(''); setCertSearch(''); return }
    if (editingId && detail) {
      reset({
        title: detail.title,
        description: detail.description ?? '',
        status: detail.status as HomeLabFormValues['status'],
        notes: detail.notes ?? '',
        lessons_learned: detail.lessons_learned ?? '',
        completion_pct: detail.completion_pct,
        started_at: detail.started_at ?? '',
        completed_at: detail.completed_at ?? '',
        skill_ids: detail.skills.map(s => s.id),
        certification_ids: detail.certifications.map(c => c.id),
      })
    }
  }, [isFormOpen, editingId, detail, reset])

  useEffect(() => {
    if (!isFormOpen) return
    void api.skills.getAll({ pageSize: 500 }).then(r => {
      if (r.success) setAllSkills((r.data as unknown as { items: HomeLabSkillRef[] }).items)
    })
    void api.certifications.getAll({ pageSize: 500 }).then(r => {
      if (r.success) setAllCerts((r.data as unknown as { items: Array<{ id: string; name: string; issuer: string }> }).items)
    })
  }, [isFormOpen])

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <SheetContent side="right" className="w-[500px] max-w-full">
        <SheetHeader>
          <SheetTitle>{editingId ? 'Edit Lab' : 'New Home Lab'}</SheetTitle>
          <SheetDescription>Track a hands-on learning exercise, home lab, or practical project.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="lab-form" onSubmit={handleSubmit(async v => { await submit(v) })} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Set up a home Kubernetes cluster" {...register('title')} />
              {errors.title?.message && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller control={control} name="status" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
                      <SelectItem key={v} value={v}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} placeholder="What are you building or experimenting with?" {...register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Started</Label>
                <Input type="date" {...register('started_at')} />
              </div>
              <div className="space-y-1.5">
                <Label>Completed</Label>
                <Input type="date" {...register('completed_at')} />
              </div>
            </div>

            {status !== 'planned' && (
              <div className="space-y-1.5">
                <Label>Completion % (manual override)</Label>
                <Input type="number" min={0} max={100} {...register('completion_pct')} />
              </div>
            )}

            <Separator />

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} placeholder="Setup notes, commands, configuration details…" {...register('notes')} />
            </div>

            <div className="space-y-1.5">
              <Label>Lessons Learned</Label>
              <Textarea rows={3} placeholder="What did you learn? What would you do differently?" {...register('lessons_learned')} />
            </div>

            <Separator />

            {/* Skills */}
            <Controller control={control} name="skill_ids" render={({ field }) => (
              <div className="space-y-2">
                <Label>Linked Skills</Label>
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map(sid => {
                      const s = allSkills.find(x => x.id === sid)
                      if (!s) return null
                      return (
                        <span key={sid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border border-border">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.category_color }} />{s.name}
                          <button type="button" onClick={() => field.onChange(field.value.filter(id => id !== sid))}><X className="h-2.5 w-2.5" /></button>
                        </span>
                      )
                    })}
                  </div>
                )}
                <div className="border border-border rounded-md overflow-hidden">
                  <input value={skillSearch} onChange={e => setSkillSearch(e.target.value)} placeholder="Search skills…" className="w-full px-3 py-2 text-xs bg-transparent border-b border-border focus:outline-none" />
                  <div className="max-h-28 overflow-y-auto p-1">
                    {allSkills.filter(s => !field.value.includes(s.id) && (!skillSearch || s.name.toLowerCase().includes(skillSearch.toLowerCase()))).slice(0, 30).map(s => (
                      <button key={s.id} type="button" onClick={() => { field.onChange([...field.value, s.id]); setSkillSearch('') }}
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent text-left">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.category_color }} />
                        {s.name}<span className="ml-auto text-muted-foreground">{s.category_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )} />

            {/* Certifications */}
            <Controller control={control} name="certification_ids" render={({ field }) => (
              <div className="space-y-2">
                <Label>Linked Certifications</Label>
                {field.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map(cid => {
                      const c = allCerts.find(x => x.id === cid)
                      if (!c) return null
                      return (
                        <span key={cid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border border-border">
                          {c.name}<button type="button" onClick={() => field.onChange(field.value.filter(id => id !== cid))}><X className="h-2.5 w-2.5" /></button>
                        </span>
                      )
                    })}
                  </div>
                )}
                <div className="border border-border rounded-md overflow-hidden">
                  <input value={certSearch} onChange={e => setCertSearch(e.target.value)} placeholder="Search certifications…" className="w-full px-3 py-2 text-xs bg-transparent border-b border-border focus:outline-none" />
                  <div className="max-h-28 overflow-y-auto p-1">
                    {allCerts.filter(c => !field.value.includes(c.id) && (!certSearch || c.name.toLowerCase().includes(certSearch.toLowerCase()))).slice(0, 30).map(c => (
                      <button key={c.id} type="button" onClick={() => { field.onChange([...field.value, c.id]); setCertSearch('') }}
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent text-left">
                        {c.name}<span className="ml-auto text-muted-foreground">{c.issuer}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )} />

            {/* Suppress unused setValue warning */}
            {void setValue}
          </form>
        </SheetBody>
        <SheetFooter>
          {formError && <p className="text-xs text-destructive w-full text-center">{formError}</p>}
          <Button variant="outline" onClick={closeForm} disabled={isSubmitting} type="button">Cancel</Button>
          <Button form="lab-form" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Create Lab'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Delete Dialog ─────────────────────────────────────────────────────────────

function DeleteLabDialog() {
  const { deletingId, isDeleting, items, cancelDelete, executeDelete } = useHomeLabStore()
  const lab = items.find(l => l.id === deletingId)
  return (
    <Dialog open={!!deletingId} onOpenChange={open => { if (!open) cancelDelete() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete lab?</DialogTitle>
          <DialogDescription>Delete <strong className="text-foreground">{lab?.title}</strong>? All tasks, time entries, problems, and assets will be permanently removed.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={() => void executeDelete()} disabled={isDeleting}>{isDeleting ? 'Deleting…' : 'Delete'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Log Time Dialog ───────────────────────────────────────────────────────────

function LogTimeDialog({ labId, open, onClose }: { labId: string; open: boolean; onClose: () => void }) {
  const { logTime } = useHomeLabStore()
  const [duration, setDuration] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    const min = parseInt(duration)
    if (!min || min <= 0) { setError('Enter a valid duration in minutes'); return }
    setSaving(true)
    await logTime(labId, min, note, date)
    setSaving(false)
    setDuration(''); setNote(''); setError('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Log Time</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Duration (minutes) <span className="text-destructive">*</span></Label>
            <Input type="number" min={1} placeholder="e.g. 60" value={duration} onChange={e => setDuration(e.target.value)} />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Input placeholder="What did you work on?" value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleSave()} disabled={saving}>{saving ? 'Saving…' : 'Log Time'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Add Task Dialog ────────────────────────────────────────────────────────────

function AddTaskDialog({ labId, open, onClose }: { labId: string; open: boolean; onClose: () => void }) {
  const { addTask } = useHomeLabStore()
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await addTask(labId, title.trim())
    setSaving(false)
    setTitle('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) { setTitle(''); onClose() } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
        <div className="py-2">
          <Label className="mb-1.5 block">Task Title <span className="text-destructive">*</span></Label>
          <Input
            placeholder="e.g. Install kubectl"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleSave() }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleSave()} disabled={saving || !title.trim()}>{saving ? 'Adding…' : 'Add Task'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Add Problem Dialog ─────────────────────────────────────────────────────────

function AddProblemDialog({ labId, open, onClose }: { labId: string; open: boolean; onClose: () => void }) {
  const { addProblem } = useHomeLabStore()
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!problem.trim()) return
    setSaving(true)
    await addProblem(labId, problem.trim(), solution || undefined)
    setSaving(false)
    setProblem(''); setSolution('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) { setProblem(''); setSolution(''); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Problem Solved</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Problem <span className="text-destructive">*</span></Label>
            <Textarea rows={2} placeholder="What problem did you encounter?" value={problem} onChange={e => setProblem(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Solution</Label>
            <Textarea rows={3} placeholder="How did you solve it?" value={solution} onChange={e => setSolution(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleSave()} disabled={saving || !problem.trim()}>{saving ? 'Saving…' : 'Add Problem'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Lab Detail Panel ───────────────────────────────────────────────────────────

function LabDetailPanel() {
  const { isDetailOpen, detail, isLoadingDetail, closeDetail, openEdit, confirmDelete, toggleTask, deleteTask, deleteProblem, deleteTimeEntry } = useHomeLabStore()
  const [showLogTime, setShowLogTime] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddProblem, setShowAddProblem] = useState(false)

  return (
    <>
      <Sheet open={isDetailOpen} onOpenChange={o => { if (!o) closeDetail() }}>
        <SheetContent side="right" className="w-[600px] max-w-full">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="truncate">{detail?.title ?? 'Lab Details'}</SheetTitle>
              {detail && (
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(detail.id)}><Edit2 /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => { closeDetail(); confirmDelete(detail.id) }} className="hover:text-destructive"><Trash2 /></Button>
                </div>
              )}
            </div>
          </SheetHeader>
          <SheetBody>
            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div>
            ) : !detail ? null : (
              <div className="space-y-1">
                {/* Status + Progress */}
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={STATUS_CONFIG[detail.status]?.variant ?? 'secondary'}>
                    {STATUS_CONFIG[detail.status]?.label ?? detail.status}
                  </Badge>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${detail.completion_pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{detail.completion_pct}%</span>
                </div>

                {detail.description && (
                  <div className="text-sm text-muted-foreground pb-3">{detail.description}</div>
                )}

                <Tabs defaultValue="tasks">
                  <TabsList className="w-full">
                    <TabsTrigger value="tasks" className="flex-1">Tasks ({detail.task_count})</TabsTrigger>
                    <TabsTrigger value="time" className="flex-1">Time ({fmt(detail.total_minutes)})</TabsTrigger>
                    <TabsTrigger value="problems" className="flex-1">Problems ({detail.problem_count})</TabsTrigger>
                    <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
                  </TabsList>

                  {/* Tasks Tab */}
                  <TabsContent value="tasks" className="mt-3 space-y-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAddTask(true)} className="gap-1.5 w-full">
                      <Plus className="h-3.5 w-3.5" />Add Task
                    </Button>
                    {detail.tasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No tasks yet. Add your first task to track progress.</p>
                    ) : (
                      <div className="space-y-1">
                        {detail.tasks.map(task => (
                          <div key={task.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-accent group">
                            <Switch
                              checked={task.is_done === 1}
                              onCheckedChange={v => void toggleTask(task.id, detail.id, v)}
                              className="shrink-0"
                            />
                            <span className={`text-sm flex-1 ${task.is_done ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                            <button type="button" onClick={() => void deleteTask(task.id, detail.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Time Tab */}
                  <TabsContent value="time" className="mt-3 space-y-2">
                    <Button size="sm" variant="outline" onClick={() => setShowLogTime(true)} className="gap-1.5 w-full">
                      <Clock className="h-3.5 w-3.5" />Log Time
                    </Button>
                    {detail.time_entries.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No time logged yet.</p>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground text-right">
                          Total: <strong className="text-foreground">{fmt(detail.total_minutes)}</strong>
                        </div>
                        {detail.time_entries.map(entry => (
                          <div key={entry.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-accent group text-sm">
                            <span className="font-medium text-primary">{fmt(entry.duration_min)}</span>
                            <span className="text-xs text-muted-foreground">{entry.logged_date}</span>
                            {entry.note && <span className="text-xs truncate flex-1">{entry.note}</span>}
                            <button type="button" onClick={() => void deleteTimeEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive ml-auto shrink-0">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Problems Tab */}
                  <TabsContent value="problems" className="mt-3 space-y-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAddProblem(true)} className="gap-1.5 w-full">
                      <AlertCircle className="h-3.5 w-3.5" />Add Problem Solved
                    </Button>
                    {detail.problems.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No problems documented yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {detail.problems.map(p => (
                          <div key={p.id} className="rounded-md border border-border p-3 group relative">
                            <button type="button" onClick={() => void deleteProblem(p.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-xs font-medium">{p.problem}</p>
                            </div>
                            {p.solution && (
                              <div className="mt-2 flex items-start gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground">{p.solution}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Notes Tab */}
                  <TabsContent value="notes" className="mt-3 space-y-4">
                    {detail.notes && (
                      <div>
                        <p className="text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Notes</p>
                        <p className="text-sm whitespace-pre-wrap">{detail.notes}</p>
                      </div>
                    )}
                    {detail.lessons_learned && (
                      <div>
                        <p className="text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Lessons Learned</p>
                        <p className="text-sm whitespace-pre-wrap">{detail.lessons_learned}</p>
                      </div>
                    )}
                    {!detail.notes && !detail.lessons_learned && (
                      <p className="text-xs text-muted-foreground text-center py-6">No notes yet. Edit the lab to add notes.</p>
                    )}

                    {/* Skills */}
                    {detail.skills.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Linked Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.skills.map(s => (
                            <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border border-border">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.category_color }} />{s.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {detail.certifications.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Linked Certifications</p>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.certifications.map(c => (
                            <span key={c.id} className="px-2 py-0.5 text-xs rounded-md border border-border">{c.name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>

      {detail && <LogTimeDialog labId={detail.id} open={showLogTime} onClose={() => setShowLogTime(false)} />}
      {detail && <AddTaskDialog labId={detail.id} open={showAddTask} onClose={() => setShowAddTask(false)} />}
      {detail && <AddProblemDialog labId={detail.id} open={showAddProblem} onClose={() => setShowAddProblem(false)} />}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function HomeLabPage() {
  const { items, total, page, pageSize, totalPages, isLoading, listError, filters, fetch, setSearch, setPage, setFilterField, clearFilters, openCreate, openEdit, openDetail, confirmDelete } = useHomeLabStore()

  useEffect(() => { void fetch() }, [fetch])

  const hasFilters = !!filters.search || !!filters.status

  return (
    <>
      <PageLayout
        title="Home Lab Tracker"
        description="Track hands-on labs, experiments, and practical learning exercises."
        actions={<Button onClick={openCreate} size="sm"><Plus />New Lab</Button>}
      >
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput value={filters.search ?? ''} onChange={setSearch} placeholder="Search labs…" className="w-64" />
          <Select value={filters.status || '__all__'} onValueChange={v => setFilterField('status', v === '__all__' ? undefined : (v as HomeLabStatus))}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([v, { label }]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1"><X className="h-3 w-3" />Clear</Button>}
        </div>

        {isLoading ? <PageLoader /> : listError ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground">{listError}</p>
            <Button variant="outline" size="sm" onClick={() => void fetch()} className="mt-3">Retry</Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title={hasFilters ? 'No labs match' : 'No labs yet'}
            description={hasFilters ? 'Try adjusting your filters.' : 'Create your first home lab to track hands-on learning exercises.'}
            action={!hasFilters ? <Button onClick={openCreate}><Plus />Create your first lab</Button> : undefined}
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">{total} lab{total !== 1 ? 's' : ''}{hasFilters && ' matching filters'}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(lab => (
                <LabCard key={lab.id} lab={lab} onEdit={openEdit} onDelete={confirmDelete} onOpen={openDetail} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
          </>
        )}
      </PageLayout>

      <LabForm />
      <LabDetailPanel />
      <DeleteLabDialog />

      {/* Suppress unused import warnings */}
      {void ChevronRight}{void CheckSquare}{void Beaker}{void Minus}
    </>
  )
}
