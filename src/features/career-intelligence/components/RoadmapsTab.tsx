import { useState } from 'react'
import {
  Plus, ChevronRight, CheckCircle2, Circle, Clock, Star, Target,
  BookOpen, Award, FolderOpen, Flag, Trash2, Edit2, Zap, Map,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Textarea } from '@shared/components/ui/textarea'
import { LoadingSpinner } from '@shared/components/common/LoadingSpinner'
import { EmptyState } from '@shared/components/common/EmptyState'
import { useCareerIntelligenceStore } from '../store/career-intelligence.store'
import {
  ROADMAP_CATEGORIES, SENIORITY_LEVELS, PREDEFINED_ROADMAPS,
} from '../types/career-intelligence.types'
import type { CareerRoadmap, CreateRoadmapInput } from '@shared/types/ipc.types'

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 64 }: { pct: number; size?: number }): React.ReactElement {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#3b82f6' : pct >= 25 ? '#f59e0b' : '#6b7280'
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={6} className="text-muted/30" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        fill="currentColor"
        style={{ rotate: '90deg', transformOrigin: `${size / 2}px ${size / 2}px`, fontSize: size / 4.5 + 'px', fontWeight: 700 }}
        className="text-foreground"
      >
        {pct}%
      </text>
    </svg>
  )
}

// ─── Importance Badge ─────────────────────────────────────────────────────────

function ImportanceBadge({ importance }: { importance: string }): React.ReactElement {
  const map: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/20',
    important: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    'nice-to-have': 'bg-muted text-muted-foreground border-border',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${map[importance] ?? map.important}`}>
      {importance}
    </span>
  )
}

// ─── Roadmap Form ─────────────────────────────────────────────────────────────

function RoadmapFormDialog(): React.ReactElement {
  const isOpen = useCareerIntelligenceStore(s => s.isRoadmapFormOpen)
  const editingId = useCareerIntelligenceStore(s => s.editingRoadmapId)
  const close = useCareerIntelligenceStore(s => s.closeRoadmapForm)
  const submit = useCareerIntelligenceStore(s => s.submitRoadmap)
  const isSubmitting = useCareerIntelligenceStore(s => s.isSubmittingRoadmap)
  const roadmaps = useCareerIntelligenceStore(s => s.roadmaps)
  const existing = editingId ? roadmaps.find(r => r.id === editingId) : undefined

  const [form, setForm] = useState<CreateRoadmapInput>({
    title: existing?.title ?? '',
    description: existing?.description ?? '',
    category: existing?.category ?? 'it',
    seniority_level: existing?.seniority_level ?? null,
    estimated_months: existing?.estimated_months ?? null,
    is_active: existing?.is_active ?? 0,
    notes: existing?.notes ?? '',
  })

  function handlePreset(presetIndex: number): void {
    const p = PREDEFINED_ROADMAPS[presetIndex]
    if (!p) return
    setForm({
      title: p.title,
      description: p.description,
      category: p.category,
      seniority_level: p.seniority_level,
      estimated_months: p.estimated_months,
      is_active: 0,
      notes: '',
    })
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!form.title.trim()) return
    await submit(form)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) close() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Career Roadmap' : 'Create Career Roadmap'}</DialogTitle>
        </DialogHeader>

        {!editingId && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick Start — Select a preset</Label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {PREDEFINED_ROADMAPS.map((p, i) => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => handlePreset(i)}
                  className="text-left text-xs px-3 py-2 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="font-medium text-foreground">{p.title}</div>
                  <div className="text-muted-foreground">{p.estimated_months}mo · {p.seniority_level}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={e => { void handleSubmit(e) }} className="space-y-4">
          <div>
            <Label htmlFor="rm-title">Title *</Label>
            <Input
              id="rm-title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Azure Administrator"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rm-category">Category</Label>
              <Select value={form.category ?? 'it'} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger id="rm-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROADMAP_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rm-seniority">Seniority</Label>
              <Select
                value={form.seniority_level ?? 'any'}
                onValueChange={v => setForm(f => ({ ...f, seniority_level: v === 'any' ? null : v }))}
              >
                <SelectTrigger id="rm-seniority">
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any level</SelectItem>
                  {SENIORITY_LEVELS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rm-months">Est. Months</Label>
              <Input
                id="rm-months"
                type="number"
                min={1}
                value={form.estimated_months ?? ''}
                onChange={e => setForm(f => ({ ...f, estimated_months: e.target.value ? parseInt(e.target.value) : null }))}
                placeholder="e.g. 12"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-1">
                <input
                  type="checkbox"
                  checked={form.is_active === 1}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked ? 1 : 0 }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-foreground">Set as active goal</span>
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="rm-desc">Description</Label>
            <Textarea
              id="rm-desc"
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe this career path..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !form.title.trim()}>
              {isSubmitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Roadmap'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Roadmap Card ─────────────────────────────────────────────────────────────

function RoadmapCard({ roadmap }: { roadmap: CareerRoadmap }): React.ReactElement {
  const setActive = useCareerIntelligenceStore(s => s.setActiveRoadmapId)
  const activeRoadmap = useCareerIntelligenceStore(s => s.activeRoadmap)
  const openEdit = useCareerIntelligenceStore(s => s.openEditRoadmap)
  const confirmDelete = useCareerIntelligenceStore(s => s.confirmDeleteRoadmap)
  const isSelected = activeRoadmap?.id === roadmap.id

  const categoryColors: Record<string, string> = {
    it: 'bg-blue-500/10 text-blue-400',
    cloud: 'bg-cyan-500/10 text-cyan-400',
    security: 'bg-red-500/10 text-red-400',
    development: 'bg-violet-500/10 text-violet-400',
    data: 'bg-orange-500/10 text-orange-400',
    management: 'bg-emerald-500/10 text-emerald-400',
    other: 'bg-muted text-muted-foreground',
  }

  return (
    <div
      className={`group relative rounded-lg border p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/30'
      }`}
      onClick={() => setActive(roadmap.id)}
    >
      {roadmap.is_active === 1 && (
        <div className="absolute top-2 right-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground truncate pr-6">{roadmap.title}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[roadmap.category] ?? categoryColors.other}`}>
              {roadmap.category}
            </span>
            {roadmap.seniority_level && (
              <span className="text-xs text-muted-foreground">{roadmap.seniority_level}</span>
            )}
            {roadmap.estimated_months && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {roadmap.estimated_months}mo
              </span>
            )}
          </div>
          {roadmap.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{roadmap.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={e => { e.stopPropagation(); openEdit(roadmap.id) }}
        >
          <Edit2 className="w-3 h-3 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          onClick={e => { e.stopPropagation(); confirmDelete(roadmap.id) }}
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
      </div>

      {isSelected && (
        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
      )}
    </div>
  )
}

// ─── Active Roadmap Detail Panel ──────────────────────────────────────────────

function RoadmapDetailPanel(): React.ReactElement {
  const roadmap = useCareerIntelligenceStore(s => s.activeRoadmap)
  const toggleMilestone = useCareerIntelligenceStore(s => s.toggleMilestone)
  const [activeSection, setActiveSection] = useState<'skills' | 'certs' | 'projects' | 'milestones'>('skills')

  if (!roadmap) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Map}
          title="Select a roadmap"
          description="Choose a career roadmap from the list to view details and track progress"
        />
      </div>
    )
  }

  const { progress } = roadmap

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Header with progress ring */}
      <div className="flex items-start gap-5">
        <ProgressRing pct={progress.progress_pct} size={80} />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">{roadmap.title}</h2>
          {roadmap.description && (
            <p className="text-sm text-muted-foreground mt-1">{roadmap.description}</p>
          )}
          <div className="grid grid-cols-4 gap-3 mt-3">
            <ProgressMiniStat
              label="Skills"
              done={progress.completed_skills}
              total={progress.total_skills}
              icon={<Target className="w-3.5 h-3.5" />}
            />
            <ProgressMiniStat
              label="Certs"
              done={progress.completed_certifications}
              total={progress.total_certifications}
              icon={<Award className="w-3.5 h-3.5" />}
            />
            <ProgressMiniStat
              label="Projects"
              done={progress.completed_projects}
              total={progress.total_projects}
              icon={<FolderOpen className="w-3.5 h-3.5" />}
            />
            <ProgressMiniStat
              label="Milestones"
              done={progress.completed_milestones}
              total={progress.total_milestones}
              icon={<Flag className="w-3.5 h-3.5" />}
            />
          </div>
          {progress.estimated_months_remaining !== null && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Est. {progress.estimated_months_remaining} months remaining
            </p>
          )}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-2">
        {(['skills', 'certs', 'projects', 'milestones'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
              activeSection === section
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {section === 'certs' ? 'Certifications' : section}
          </button>
        ))}
      </div>

      {/* Skills section */}
      {activeSection === 'skills' && (
        <div className="space-y-2">
          {roadmap.skills.length === 0 ? (
            <EmptySection label="No skills defined for this roadmap" />
          ) : (
            roadmap.skills.map(skill => {
              const levelRank: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
              const currentRank = levelRank[skill.current_level ?? ''] ?? 0
              const targetRank = levelRank[skill.target_level] ?? 2
              const pct = Math.min(100, Math.round((currentRank / targetRank) * 100))
              const isDone = currentRank >= targetRank

              return (
                <div key={skill.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500/20' : 'bg-muted'}`}>
                    {isDone
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <Circle className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {skill.skill_name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <ImportanceBadge importance={skill.importance} />
                        <span className="text-xs text-muted-foreground">{skill.current_level ?? 'not started'} → {skill.target_level}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isDone ? 'bg-green-500' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Certifications section */}
      {activeSection === 'certs' && (
        <div className="space-y-2">
          {roadmap.certifications.length === 0 ? (
            <EmptySection label="No certifications defined for this roadmap" />
          ) : (
            roadmap.certifications.map(cert => {
              const isDone = cert.cert_status === 'earned'
              const isInProgress = cert.cert_status === 'in-progress'
              return (
                <div key={cert.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500/20' : isInProgress ? 'bg-blue-500/20' : 'bg-muted'}`}>
                    {isDone
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : isInProgress
                        ? <Zap className="w-4 h-4 text-blue-400" />
                        : <Circle className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium ${isDone ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {cert.name}
                      </span>
                      <ImportanceBadge importance={cert.importance} />
                    </div>
                    {cert.issuer && <p className="text-xs text-muted-foreground mt-0.5">{cert.issuer}</p>}
                    {isInProgress && (
                      <span className="text-xs text-blue-400 mt-1 inline-block">In progress</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Projects section */}
      {activeSection === 'projects' && (
        <div className="space-y-2">
          {roadmap.projects.length === 0 ? (
            <EmptySection label="No projects defined for this roadmap" />
          ) : (
            roadmap.projects.map(project => {
              const isDone = project.project_status === 'completed'
              const isActive = project.project_status === 'active'
              return (
                <div key={project.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500/20' : isActive ? 'bg-blue-500/20' : 'bg-muted'}`}>
                    {isDone
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : isActive
                        ? <Zap className="w-4 h-4 text-blue-400" />
                        : <Circle className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{project.title}</span>
                      <ImportanceBadge importance={project.importance} />
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-1">{project.description}</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Milestones section */}
      {activeSection === 'milestones' && (
        <div className="space-y-2">
          {roadmap.milestones.length === 0 ? (
            <EmptySection label="No milestones defined for this roadmap" />
          ) : (
            roadmap.milestones.map((milestone, idx) => (
              <div key={milestone.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => void toggleMilestone(milestone.id, milestone.is_completed === 0)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      milestone.is_completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-muted-foreground hover:border-primary'
                    }`}
                  >
                    {milestone.is_completed === 1 && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                  {idx < roadmap.milestones.length - 1 && (
                    <div className="w-0.5 h-6 bg-border" />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium ${milestone.is_completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {milestone.title}
                    </span>
                    {milestone.target_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {milestone.target_date}
                      </span>
                    )}
                  </div>
                  {milestone.description && (
                    <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                  )}
                  {milestone.completed_at && (
                    <p className="text-xs text-green-500 mt-1">Completed {milestone.completed_at.slice(0, 10)}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function ProgressMiniStat({ label, done, total, icon }: { label: string; done: number; total: number; icon: React.ReactNode }): React.ReactElement {
  return (
    <div className="text-center p-2 rounded-lg bg-muted/30 border border-border">
      <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">{icon} <span className="text-xs">{label}</span></div>
      <div className="text-sm font-semibold text-foreground">{done}<span className="text-muted-foreground font-normal">/{total}</span></div>
    </div>
  )
}

function EmptySection({ label }: { label: string }): React.ReactElement {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">{label}</div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteRoadmapDialog(): React.ReactElement {
  const deletingId = useCareerIntelligenceStore(s => s.deletingRoadmapId)
  const cancel = useCareerIntelligenceStore(s => s.cancelDeleteRoadmap)
  const execute = useCareerIntelligenceStore(s => s.executeDeleteRoadmap)
  const isDeleting = useCareerIntelligenceStore(s => s.isDeletingRoadmap)
  const roadmaps = useCareerIntelligenceStore(s => s.roadmaps)
  const roadmap = deletingId ? roadmaps.find(r => r.id === deletingId) : undefined

  return (
    <Dialog open={!!deletingId} onOpenChange={open => { if (!open) cancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Roadmap</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong className="text-foreground">{roadmap?.title}</strong>?
          This will remove all skills, certifications, projects, and milestones associated with it.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={cancel}>Cancel</Button>
          <Button variant="destructive" onClick={() => void execute()} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function RoadmapsTab(): React.ReactElement {
  const roadmaps = useCareerIntelligenceStore(s => s.roadmaps)
  const isLoading = useCareerIntelligenceStore(s => s.isLoadingRoadmaps)
  const openCreate = useCareerIntelligenceStore(s => s.openCreateRoadmap)

  return (
    <div className="flex h-[calc(100vh-200px)] overflow-hidden">
      {/* Left sidebar — roadmap list */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">My Career Roadmaps</h2>
          <Button size="sm" onClick={openCreate} className="h-7 px-2 gap-1">
            <Plus className="w-3.5 h-3.5" />
            New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="py-8 text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No roadmaps yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first career roadmap</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={openCreate}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create roadmap
              </Button>
            </div>
          ) : (
            roadmaps.map(roadmap => (
              <RoadmapCard key={roadmap.id} roadmap={roadmap} />
            ))
          )}
        </div>
      </div>

      {/* Right panel — detail */}
      <RoadmapDetailPanel />

      {/* Dialogs */}
      <RoadmapFormDialog />
      <DeleteRoadmapDialog />
    </div>
  )
}
