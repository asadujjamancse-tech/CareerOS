import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Monitor, Cloud, Briefcase, MessageSquare, Wrench,
  ChevronRight, Play, ArrowLeft, Lightbulb, Eye, CheckCircle2,
  Clock, Trophy, X, Plus, BookOpen, Flag, Edit2, Trash2,
  Server, Shield, Network, Users, Layers,
} from 'lucide-react'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { EmptyState } from '@shared/components/common/EmptyState'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Input } from '@shared/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Textarea } from '@shared/components/ui/textarea'
import { Label } from '@shared/components/ui/label'
import { Separator } from '@shared/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter,
} from '@shared/components/ui/sheet'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@shared/components/ui/dialog'
import { useScenariosStore } from '../store/scenarios.store'
import type { Scenario, ScenarioCategory, ScenarioDifficulty, ScenarioFormData } from '../types/scenarios.types'
import { cn } from '@shared/lib/utils'

// ── Category / difficulty config ──────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ScenarioCategory, { label: string; icon: React.ElementType; color: string }> = {
  'it-support':       { label: 'IT Support',       icon: Monitor,       color: 'text-blue-400' },
  'msp':              { label: 'MSP',              icon: Briefcase,     color: 'text-amber-400' },
  'cloud':            { label: 'Cloud',            icon: Cloud,         color: 'text-sky-400' },
  'interview':        { label: 'Interview',        icon: MessageSquare, color: 'text-purple-400' },
  'troubleshooting':  { label: 'Troubleshooting',  icon: Wrench,        color: 'text-orange-400' },
  'custom':           { label: 'Custom',           icon: Plus,          color: 'text-muted-foreground' },
  'active-directory': { label: 'Active Directory', icon: Users,         color: 'text-blue-500' },
  'windows-server':   { label: 'Windows Server',   icon: Server,        color: 'text-sky-500' },
  'networking':       { label: 'Networking',       icon: Network,       color: 'text-green-400' },
  'microsoft-365':    { label: 'Microsoft 365',    icon: Layers,        color: 'text-blue-300' },
  'azure':            { label: 'Azure',            icon: Cloud,         color: 'text-cyan-400' },
  'cybersecurity':    { label: 'Cybersecurity',    icon: Shield,        color: 'text-red-400' },
  'hyper-v':          { label: 'Hyper-V',          icon: Server,        color: 'text-purple-400' },
}

const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG) as ScenarioCategory[]

const DIFFICULTY_CONFIG: Record<ScenarioDifficulty, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  beginner: { label: 'Beginner', variant: 'success' },
  medium:   { label: 'Medium',   variant: 'warning' },
  advanced: { label: 'Advanced', variant: 'destructive' },
  expert:   { label: 'Expert',   variant: 'destructive' },
}

// ── Zod schema for create / edit form ────────────────────────────────────────

const scenarioSchema = z.object({
  title:             z.string().min(1, 'Title is required').max(200),
  description:       z.string().optional(),
  category:          z.enum(ALL_CATEGORIES as [ScenarioCategory, ...ScenarioCategory[]]),
  difficulty:        z.enum(['beginner', 'medium', 'advanced', 'expert']),
  estimated_minutes: z.coerce.number().int().min(5, 'Minimum 5 minutes').max(480),
  context_story:     z.string().min(10, 'Situation must be at least 10 characters'),
  success_criteria:  z.string().min(5, 'Success criteria is required'),
  solution:          z.string().optional(),
})
type ScenarioSchemaValues = z.infer<typeof scenarioSchema>

const FORM_DEFAULTS: ScenarioSchemaValues = {
  title: '', description: '', category: 'custom', difficulty: 'medium',
  estimated_minutes: 30, context_story: '', success_criteria: '', solution: '',
}

// ── Scenario Form (Sheet) ─────────────────────────────────────────────────────

function ScenarioForm() {
  const {
    isFormOpen, editingScenario, isSubmitting, formError,
    closeScenarioForm, submitScenario,
  } = useScenariosStore()

  const [hints, setHints] = useState<string[]>([])
  const [hintInput, setHintInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ScenarioSchemaValues>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: FORM_DEFAULTS,
  })

  useEffect(() => {
    if (!isFormOpen) {
      reset(FORM_DEFAULTS); setHints([]); setTags([]); setHintInput(''); setTagInput('')
      return
    }
    if (editingScenario) {
      reset({
        title: editingScenario.title,
        description: editingScenario.description ?? '',
        category: editingScenario.category,
        difficulty: editingScenario.difficulty,
        estimated_minutes: editingScenario.estimated_minutes,
        context_story: editingScenario.context_story,
        success_criteria: editingScenario.success_criteria,
        solution: editingScenario.solution ?? '',
      })
      setHints(editingScenario.hints ? (JSON.parse(editingScenario.hints) as string[]) : [])
      setTags(JSON.parse(editingScenario.tags || '[]') as string[])
    } else {
      reset(FORM_DEFAULTS); setHints([]); setTags([])
    }
  }, [isFormOpen, editingScenario, reset])

  const addHint = () => {
    const h = hintInput.trim()
    if (h) { setHints(prev => [...prev, h]); setHintInput('') }
  }
  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); setTagInput('') }
  }

  const onSubmit = (values: ScenarioSchemaValues) => {
    const data: ScenarioFormData = {
      ...values,
      description: values.description ?? '',
      solution: values.solution ?? '',
      hints,
      tags,
    }
    void submitScenario(data)
  }

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeScenarioForm() }}>
      <SheetContent side="right" className="w-[560px] max-w-full">
        <SheetHeader>
          <SheetTitle>{editingScenario ? 'Edit Scenario' : 'Create Scenario'}</SheetTitle>
          <SheetDescription>
            {editingScenario ? 'Update scenario details.' : 'Create a custom practice scenario.'}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="scenario-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div className="space-y-1.5">
              <Label htmlFor="s-title">Title <span className="text-destructive">*</span></Label>
              <Input id="s-title" placeholder="e.g. Azure AD: User Cannot Sign In" {...register('title')} aria-invalid={!!errors.title} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Controller control={control} name="category" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72 overflow-y-auto">
                      {ALL_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Controller control={control} name="difficulty" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DIFFICULTY_CONFIG).map(([v, { label }]) => (
                        <SelectItem key={v} value={v}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-mins">Estimated Minutes</Label>
                <Input id="s-mins" type="number" min={5} max={480} {...register('estimated_minutes')} />
                {errors.estimated_minutes && <p className="text-xs text-destructive">{errors.estimated_minutes.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-desc">Description</Label>
                <Input id="s-desc" placeholder="Brief summary" {...register('description')} />
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="s-story">Situation <span className="text-destructive">*</span></Label>
              <Textarea id="s-story" rows={4}
                placeholder="Describe the scenario: who reported it, what the symptoms are, what environment is involved…"
                {...register('context_story')} aria-invalid={!!errors.context_story} />
              {errors.context_story && <p className="text-xs text-destructive">{errors.context_story.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-criteria">Success Criteria <span className="text-destructive">*</span></Label>
              <Textarea id="s-criteria" rows={3}
                placeholder="What does a successful resolution look like? What should be verified?"
                {...register('success_criteria')} aria-invalid={!!errors.success_criteria} />
              {errors.success_criteria && <p className="text-xs text-destructive">{errors.success_criteria.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="s-solution">Model Solution</Label>
              <Textarea id="s-solution" rows={4}
                placeholder="The correct resolution steps — revealed to the learner on demand"
                {...register('solution')} />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Hints</Label>
              {hints.length > 0 && (
                <ul className="space-y-1.5 mb-2">
                  {hints.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm rounded-md border border-border px-2.5 py-1.5">
                      <span className="text-muted-foreground w-4 shrink-0 pt-0.5">{i + 1}.</span>
                      <span className="flex-1 leading-snug">{h}</span>
                      <button type="button" onClick={() => setHints(hs => hs.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive shrink-0 pt-0.5">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Input placeholder="Add a hint (e.g. Check the UPN in Azure AD)…"
                  value={hintInput} onChange={e => setHintInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHint() } }} />
                <Button type="button" variant="outline" size="icon" onClick={addHint} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border border-border bg-muted">
                      {tag}
                      <button type="button" onClick={() => setTags(ts => ts.filter(t => t !== tag))}
                        className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Add a tag (e.g. Azure AD, MFA, Active Directory)…"
                  value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} />
                <Button type="button" variant="outline" size="icon" onClick={addTag} className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </SheetBody>
        <SheetFooter>
          {formError && <p className="text-xs text-destructive w-full text-center mb-1">{formError}</p>}
          <Button variant="outline" onClick={closeScenarioForm} disabled={isSubmitting} type="button">Cancel</Button>
          <Button form="scenario-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingScenario ? 'Save changes' : 'Create scenario'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteScenarioDialog() {
  const { deletingScenarioId, isDeleting, scenarios, cancelDeleteScenario, executeDeleteScenario } = useScenariosStore()
  const scenario = scenarios.find(s => s.id === deletingScenarioId)
  return (
    <Dialog open={!!deletingScenarioId} onOpenChange={open => { if (!open) cancelDeleteScenario() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete scenario</DialogTitle>
          <DialogDescription>
            Delete <strong className="text-foreground">{scenario?.title}</strong>? All attempts will be removed. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cancelDeleteScenario} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={() => void executeDeleteScenario()} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Scenario Card ─────────────────────────────────────────────────────────────

function ScenarioCard({ scenario, onOpen }: { scenario: Scenario; onOpen: () => void }) {
  const { openEditScenario, confirmDeleteScenario } = useScenariosStore()
  const catCfg = CATEGORY_CONFIG[scenario.category] ?? CATEGORY_CONFIG['custom']
  const diffCfg = DIFFICULTY_CONFIG[scenario.difficulty]
  const CatIcon = catCfg.icon
  const tags = JSON.parse(scenario.tags || '[]') as string[]
  const hasCompleted = scenario.completed_attempts > 0

  return (
    <div className="group relative rounded-xl border border-border bg-card hover:border-zinc-500 transition-all">
      {/* Edit / Delete overlay */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button variant="ghost" size="icon-sm"
          onClick={e => { e.stopPropagation(); openEditScenario(scenario) }}
          aria-label="Edit scenario">
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm"
          onClick={e => { e.stopPropagation(); confirmDeleteScenario(scenario.id) }}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete scenario">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <button type="button" onClick={onOpen} className="w-full text-left p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <CatIcon className={cn('h-5 w-5', catCfg.color)} />
          </div>
          <div className="flex-1 min-w-0 pr-10">
            <div className="flex items-start gap-2">
              <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">{scenario.title}</h3>
              {hasCompleted && <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{catCfg.label}</Badge>
              <Badge variant={diffCfg.variant} className="text-[10px]">{diffCfg.label}</Badge>
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />{scenario.estimated_minutes}m
              </span>
            </div>
          </div>
        </div>

        {scenario.description && (
          <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{scenario.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {scenario.step_count > 0 && <span>{scenario.step_count} steps</span>}
            {scenario.total_attempts > 0 && <span>{scenario.total_attempts} attempt{scenario.total_attempts !== 1 ? 's' : ''}</span>}
            {scenario.best_score !== null && <span className="text-amber-400">Best: {scenario.best_score}%</span>}
          </div>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.slice(0, 5).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
            ))}
          </div>
        )}
      </button>
    </div>
  )
}

// ── Step Editor (inline in detail) ───────────────────────────────────────────

function StepEditor() {
  const { activeScenario, activeSteps, addScenarioStep, updateScenarioStep, deleteScenarioStep } = useScenariosStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addInstruction, setAddInstruction] = useState('')
  const [addHint, setAddHint] = useState('')
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editInstruction, setEditInstruction] = useState('')
  const [editHint, setEditHint] = useState('')
  const [saving, setSaving] = useState(false)

  if (!activeScenario) return null

  const handleAddStep = async () => {
    if (!addTitle.trim() || !addInstruction.trim()) return
    setSaving(true)
    const stepHintVal = addHint.trim()
    await addScenarioStep({ title: addTitle.trim(), instruction: addInstruction.trim(), ...(stepHintVal ? { hint: stepHintVal } : {}) })
    setAddTitle(''); setAddInstruction(''); setAddHint(''); setShowAddForm(false); setSaving(false)
  }

  const startEdit = (step: typeof activeSteps[number]) => {
    setEditingStepId(step.id)
    setEditTitle(step.title)
    setEditInstruction(step.instruction)
    setEditHint(step.hint ?? '')
  }

  const handleSaveEdit = async () => {
    if (!editingStepId || !editTitle.trim() || !editInstruction.trim()) return
    setSaving(true)
    const editHintVal = editHint.trim()
    await updateScenarioStep(editingStepId, { title: editTitle.trim(), instruction: editInstruction.trim(), ...(editHintVal ? { hint: editHintVal } : {}) })
    setEditingStepId(null); setSaving(false)
  }

  return (
    <div className="space-y-3">
      {activeSteps.length === 0 && !showAddForm && (
        <p className="text-sm text-muted-foreground text-center py-6">No steps yet. Add step-by-step instructions for learners.</p>
      )}

      {activeSteps.map((step, i) => (
        <div key={step.id} className={cn('rounded-lg border p-4', step.is_checkpoint === 1 ? 'border-primary/30 bg-primary/5' : 'border-border bg-card')}>
          {editingStepId === step.id ? (
            <div className="space-y-2">
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Step title" />
              <Textarea value={editInstruction} onChange={e => setEditInstruction(e.target.value)} rows={3} placeholder="Instruction" />
              <Input value={editHint} onChange={e => setEditHint(e.target.value)} placeholder="Hint (optional)" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void handleSaveEdit()} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingStepId(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{step.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.instruction}</p>
                {step.hint && <p className="text-xs text-amber-400 mt-1 italic">{step.hint}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon-sm" onClick={() => startEdit(step)} aria-label="Edit step">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon-sm"
                  onClick={() => void deleteScenarioStep(step.id)}
                  className="text-muted-foreground hover:text-destructive" aria-label="Delete step">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {showAddForm ? (
        <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">New step</p>
          <Input value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="Step title *" />
          <Textarea value={addInstruction} onChange={e => setAddInstruction(e.target.value)} rows={3} placeholder="Instruction *" />
          <Input value={addHint} onChange={e => setAddHint(e.target.value)} placeholder="Hint (optional)" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleAddStep()} disabled={saving || !addTitle.trim() || !addInstruction.trim()}>
              {saving ? 'Adding…' : 'Add Step'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5 w-full">
          <Plus className="h-3.5 w-3.5" />Add Step
        </Button>
      )}
    </div>
  )
}

// ── Scenario Detail View ──────────────────────────────────────────────────────

function ScenarioDetail() {
  const {
    activeScenario, activeSteps, attempts, hintsVisible, solutionVisible,
    toggleHints, toggleSolution, startAttempt, closeScenario,
    openEditScenario, confirmDeleteScenario,
  } = useScenariosStore()

  if (!activeScenario) return null

  const catCfg = CATEGORY_CONFIG[activeScenario.category] ?? CATEGORY_CONFIG['custom']
  const CatIcon = catCfg.icon
  const hints = activeScenario.hints ? JSON.parse(activeScenario.hints) as string[] : []
  const tags = JSON.parse(activeScenario.tags || '[]') as string[]

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={closeScenario} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />All Scenarios
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openEditScenario(activeScenario)} className="gap-1.5">
            <Edit2 className="h-3.5 w-3.5" />Edit
          </Button>
          <Button variant="outline" size="sm"
            onClick={() => confirmDeleteScenario(activeScenario.id)}
            className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60">
            <Trash2 className="h-3.5 w-3.5" />Delete
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <CatIcon className={cn('h-6 w-6', catCfg.color)} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{activeScenario.title}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline">{catCfg.label}</Badge>
              <Badge variant={DIFFICULTY_CONFIG[activeScenario.difficulty].variant}>{DIFFICULTY_CONFIG[activeScenario.difficulty].label}</Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />{activeScenario.estimated_minutes} min
              </span>
              {activeScenario.step_count > 0 && (
                <span className="text-sm text-muted-foreground">{activeScenario.step_count} steps</span>
              )}
            </div>
          </div>
          <Button onClick={() => void startAttempt()} className="gap-1.5 shrink-0">
            <Play className="h-4 w-4" />Start Scenario
          </Button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
          </div>
        )}
      </div>

      <Tabs defaultValue="scenario">
        <TabsList>
          <TabsTrigger value="scenario">Scenario</TabsTrigger>
          <TabsTrigger value="steps">Steps ({activeSteps.length})</TabsTrigger>
          <TabsTrigger value="attempts">Attempts ({attempts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="scenario" className="mt-4 space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">Situation</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeScenario.context_story}</p>
          </div>

          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-5">
            <h3 className="font-semibold mb-2 text-sm text-green-400 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />Success Criteria
            </h3>
            <p className="text-sm leading-relaxed">{activeScenario.success_criteria}</p>
          </div>

          {hints.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
              <button type="button" onClick={toggleHints} className="flex items-center gap-2 w-full text-left">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <h3 className="font-semibold text-sm text-amber-400 uppercase tracking-wide">Hints</h3>
                <Badge variant="secondary" className="ml-auto text-xs">{hintsVisible ? 'Hide' : 'Show'}</Badge>
              </button>
              {hintsVisible && (
                <ul className="mt-3 space-y-2">
                  {hints.map((hint, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-400 font-bold shrink-0">{i + 1}.</span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeScenario.solution && (
            <div className="rounded-lg border border-border p-5">
              <button type="button" onClick={toggleSolution} className="flex items-center gap-2 w-full text-left">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm uppercase tracking-wide">Model Solution</h3>
                <Badge variant="secondary" className="ml-auto text-xs">{solutionVisible ? 'Hide' : 'Reveal'}</Badge>
              </button>
              {solutionVisible && (
                <div className="mt-3 p-3 rounded bg-muted">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeScenario.solution}</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="steps" className="mt-4">
          <StepEditor />
        </TabsContent>

        <TabsContent value="attempts" className="mt-4">
          {attempts.length === 0 ? (
            <EmptyState icon={BookOpen} title="No attempts yet" description="Start the scenario to begin your first attempt." />
          ) : (
            <div className="space-y-3">
              {attempts.map(att => (
                <div key={att.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {att.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : att.status === 'abandoned' ? (
                        <X className="h-4 w-4 text-red-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-400" />
                      )}
                      <span className="text-sm font-medium capitalize">{att.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {att.score !== null && <span className="text-sm font-bold text-amber-400">{att.score}%</span>}
                      <span className="text-xs text-muted-foreground">{att.time_spent_min}m</span>
                    </div>
                  </div>
                  {att.total_steps > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Steps completed</span><span>{att.steps_completed}/{att.total_steps}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${att.total_steps > 0 ? (att.steps_completed / att.total_steps) * 100 : 0}%` }} />
                      </div>
                    </div>
                  )}
                  {att.lessons_learned && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{att.lessons_learned}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Running Mode ──────────────────────────────────────────────────────────────

function RunningMode() {
  const {
    activeScenario, activeSteps, activeAttempt, currentStepIndex, hintsVisible,
    toggleHints, advanceStep, completeAttempt, abandonAttempt,
    sessionNotes, sessionLessons, setSessionNotes, setSessionLessons, elapsedMinutes, tickTimer,
  } = useScenariosStore()

  const [score, setScore] = useState(80)
  const [showComplete, setShowComplete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => tickTimer(), 60000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [tickTimer])

  if (!activeScenario || !activeAttempt) return null

  const currentStep = activeSteps[currentStepIndex]
  const isLastStep = currentStepIndex >= activeSteps.length - 1
  const hasSteps = activeSteps.length > 0
  const hints = activeScenario.hints ? JSON.parse(activeScenario.hints) as string[] : []
  const progressPct = hasSteps ? (currentStepIndex / activeSteps.length) * 100 : 0

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => void abandonAttempt()} className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />Abandon
        </Button>
        <div className="text-center">
          <h2 className="font-semibold text-sm">{activeScenario.title}</h2>
          <p className="text-xs text-muted-foreground">{elapsedMinutes}m elapsed</p>
        </div>
        <Button size="sm" onClick={() => setShowComplete(true)} className="gap-1.5 bg-green-500 hover:bg-green-600">
          <Flag className="h-3.5 w-3.5" />Complete
        </Button>
      </div>

      {hasSteps && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Step {currentStepIndex + 1} of {activeSteps.length}</span>
            <span>{Math.round(progressPct)}% complete</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Situation</p>
          <p className="text-sm leading-relaxed line-clamp-3">{activeScenario.context_story}</p>
        </div>

        {currentStep && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">{currentStepIndex + 1}</span>
              <h3 className="font-semibold">{currentStep.title}</h3>
            </div>
            <p className="text-sm leading-relaxed">{currentStep.instruction}</p>
            {currentStep.expected_action && (
              <div className="mt-3 pt-3 border-t border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Expected Action:</p>
                <p className="text-xs text-primary/90">{currentStep.expected_action}</p>
              </div>
            )}
            {currentStep.hint && (
              <div className="mt-3 rounded bg-amber-500/10 border border-amber-500/20 p-2.5">
                <p className="text-xs text-amber-400"><Lightbulb className="h-3 w-3 inline mr-1" />{currentStep.hint}</p>
              </div>
            )}
          </div>
        )}

        {!hasSteps && (
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">No specific steps defined — work through the scenario based on the situation description and success criteria.</p>
          </div>
        )}

        {hints.length > 0 && (
          <button type="button" onClick={toggleHints} className="w-full rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-center gap-2 text-left hover:bg-amber-500/10 transition-colors">
            <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-sm font-medium text-amber-400">Hints Available</span>
            <span className="ml-auto text-xs text-muted-foreground">{hintsVisible ? 'Hide' : 'Show'}</span>
          </button>
        )}
        {hintsVisible && hints.length > 0 && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <ul className="space-y-2">
              {hints.map((h, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-amber-400 font-bold shrink-0">{i + 1}.</span>{h}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Your Notes & Commands</Label>
            <Textarea value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} rows={4}
              placeholder="Document what you're doing, commands you ran, what worked…" className="mt-1.5 text-xs font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Lessons Learned</Label>
            <Textarea value={sessionLessons} onChange={e => setSessionLessons(e.target.value)} rows={2}
              placeholder="What did you learn? What would you do differently?" className="mt-1.5 text-xs" />
          </div>
        </div>
      </div>

      {hasSteps && (
        <div className="pt-4 flex gap-3">
          {!isLastStep ? (
            <Button onClick={() => void advanceStep()} className="flex-1 gap-1.5">
              Next Step<ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setShowComplete(true)} className="flex-1 gap-1.5 bg-green-500 hover:bg-green-600">
              <Flag className="h-4 w-4" />Complete Scenario
            </Button>
          )}
        </div>
      )}

      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-80 space-y-4">
            <div className="text-center">
              <Trophy className="h-10 w-10 text-amber-400 mx-auto mb-2" />
              <h3 className="font-bold text-lg">Complete Scenario!</h3>
              <p className="text-sm text-muted-foreground">Rate your performance on this scenario.</p>
            </div>
            <div>
              <Label>Self-Assessment Score (0–100%)</Label>
              <input type="range" min={0} max={100} value={score} onChange={e => setScore(parseInt(e.target.value))} className="w-full mt-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span><span className="font-bold text-primary">{score}%</span><span>100%</span>
              </div>
            </div>
            <div>
              <Label>Lessons Learned</Label>
              <Textarea value={sessionLessons} onChange={e => setSessionLessons(e.target.value)} rows={3}
                placeholder="Key takeaways from this scenario…" className="mt-1.5 text-xs" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowComplete(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => void completeAttempt(score)} className="flex-1 bg-green-500 hover:bg-green-600 gap-1">
                <CheckCircle2 className="h-4 w-4" />Complete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '__all__', label: 'All Categories' },
  ...ALL_CATEGORIES.map(c => ({ value: c, label: CATEGORY_CONFIG[c].label })),
]

const DIFFICULTY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '__all__', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'medium', label: 'Medium' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
]

export function ScenarioCenterPage() {
  const {
    scenarios, isLoading, view, activeScenario,
    fetchAll, openScenario, setFilters, filters,
    openCreateScenario,
  } = useScenariosStore()

  useEffect(() => { void fetchAll() }, [fetchAll])

  if (view === 'running') {
    return (
      <div className="flex flex-col h-screen p-6 overflow-hidden">
        <RunningMode />
      </div>
    )
  }

  if (view === 'detail' && activeScenario) {
    return (
      <div className="p-6 overflow-y-auto">
        <ScenarioDetail />
        <ScenarioForm />
        <DeleteScenarioDialog />
      </div>
    )
  }

  const grouped = scenarios.reduce<Record<string, Scenario[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    ;(acc[s.category] as Scenario[]).push(s)
    return acc
  }, {})

  return (
    <>
      <PageLayout
        title="Scenario Center"
        description="Practice real-world IT scenarios: helpdesk tickets, cloud incidents, MSP situations, and interview simulations."
        actions={
          <div className="flex items-center gap-2">
            <Select value={filters.category ?? '__all__'} onValueChange={v =>
              setFilters({ category: v === '__all__' ? undefined : v as ScenarioCategory })
            }>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.difficulty ?? '__all__'} onValueChange={v =>
              setFilters({ difficulty: v === '__all__' ? undefined : v as ScenarioDifficulty })
            }>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFFICULTY_OPTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={openCreateScenario} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />New Scenario
            </Button>
          </div>
        }
      >
        {isLoading ? <PageLoader /> : scenarios.length === 0 ? (
          <EmptyState
            icon={Monitor}
            title="No scenarios yet"
            description="Create your own practice scenarios or wait for the seeded ones to appear on first app launch."
            action={<Button onClick={openCreateScenario}><Plus />Create your first scenario</Button>}
          />
        ) : filters.category || filters.difficulty ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map(s => (
              <ScenarioCard key={s.id} scenario={s} onOpen={() => void openScenario(s.id)} />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, items]) => {
              const catCfg = CATEGORY_CONFIG[category as ScenarioCategory] ?? CATEGORY_CONFIG['custom']
              const CatIcon = catCfg.icon
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <CatIcon className={cn('h-4 w-4', catCfg.color)} />
                    <h2 className="font-semibold">{catCfg.label}</h2>
                    <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(s => (
                      <ScenarioCard key={s.id} scenario={s} onOpen={() => void openScenario(s.id)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PageLayout>
      <ScenarioForm />
      <DeleteScenarioDialog />
    </>
  )
}
