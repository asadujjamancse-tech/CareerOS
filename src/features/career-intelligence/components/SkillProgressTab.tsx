import { useState } from 'react'
import { Plus, Clock, Target, TrendingUp, X, Search } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Textarea } from '@shared/components/ui/textarea'
import { LoadingSpinner } from '@shared/components/common/LoadingSpinner'
import { EmptyState } from '@shared/components/common/EmptyState'
import { useCareerIntelligenceStore } from '../store/career-intelligence.store'
import { SKILL_LEVELS } from '../types/career-intelligence.types'
import type { SkillProgressItem, StudySession, LogStudySessionInput, UpsertSkillProgressInput } from '@shared/types/ipc.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levelColor(level: string): string {
  switch (level) {
    case 'expert': return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    case 'advanced': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    case 'intermediate': return 'text-green-400 bg-green-500/10 border-green-500/20'
    default: return 'text-muted-foreground bg-muted border-border'
  }
}

function progressColor(pct: number): string {
  if (pct >= 100) return 'bg-green-500'
  if (pct >= 75) return 'bg-blue-500'
  if (pct >= 50) return 'bg-yellow-500'
  return 'bg-muted-foreground/50'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

// ─── Skill Progress Card ──────────────────────────────────────────────────────

function SkillProgressCard({ skill }: { skill: SkillProgressItem }): React.ReactElement {
  const openEdit = useCareerIntelligenceStore(s => s.openEditSkillProgress)

  return (
    <div className="rounded-lg border border-border p-4 hover:border-primary/40 transition-colors group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: skill.category_color }}
            />
            <h3 className="font-medium text-sm text-foreground truncate">{skill.skill_name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{skill.category_name}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => openEdit(skill.skill_id)}
        >
          <Target className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress to target</span>
          <span className="font-semibold text-foreground">{skill.progress_pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressColor(skill.progress_pct)}`}
            style={{ width: `${skill.progress_pct}%` }}
          />
        </div>
      </div>

      {/* Level badges */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Now:</span>
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${levelColor(skill.current_level)}`}>
            {skill.current_level}
          </span>
        </div>
        <span className="text-muted-foreground text-xs">→</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Target:</span>
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${levelColor(skill.target_level)}`}>
            {skill.target_level}
          </span>
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">Confidence</span>
          <div className="flex items-center gap-1">
            <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${skill.confidence_score}%` }}
              />
            </div>
            <span className="font-medium text-foreground">{skill.confidence_score}%</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">Experience</span>
          <span className="font-medium text-foreground">{skill.years_experience}yr</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">Last studied</span>
          <span className="font-medium text-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(skill.last_studied_at)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Skill Progress Dialog ───────────────────────────────────────────────

function EditSkillProgressDialog(): React.ReactElement {
  const editingId = useCareerIntelligenceStore(s => s.editingSkillId)
  const skillProgress = useCareerIntelligenceStore(s => s.skillProgress)
  const close = useCareerIntelligenceStore(s => s.closeSkillProgressEdit)
  const submit = useCareerIntelligenceStore(s => s.submitSkillProgress)
  const isSubmitting = useCareerIntelligenceStore(s => s.isSubmittingSkillProgress)

  const skill = skillProgress.find(s => s.skill_id === editingId)

  const [form, setForm] = useState<UpsertSkillProgressInput>({
    target_level: skill?.target_level ?? 'intermediate',
    confidence_score: skill?.confidence_score ?? 50,
    last_studied_at: skill?.last_studied_at ?? null,
    weekly_goal_hours: skill?.weekly_goal_hours ?? 0,
  })

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!editingId) return
    await submit(editingId, form)
  }

  return (
    <Dialog open={!!editingId} onOpenChange={open => { if (!open) close() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Skill Progress — {skill?.skill_name}</DialogTitle>
        </DialogHeader>
        {skill && (
          <form onSubmit={e => { void handleSubmit(e) }} className="space-y-4">
            <div>
              <Label>Target Level</Label>
              <Select
                value={form.target_level ?? 'intermediate'}
                onValueChange={v => setForm(f => ({ ...f, target_level: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Confidence Score: {form.confidence_score ?? 50}%</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.confidence_score ?? 50}
                onChange={e => setForm(f => ({ ...f, confidence_score: parseInt(e.target.value) }))}
                className="w-full mt-1.5"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>0% — No confidence</span>
                <span>100% — Mastered</span>
              </div>
            </div>

            <div>
              <Label htmlFor="sp-date">Last Studied Date</Label>
              <Input
                id="sp-date"
                type="date"
                value={form.last_studied_at ?? ''}
                onChange={e => setForm(f => ({ ...f, last_studied_at: e.target.value || null }))}
              />
            </div>

            <div>
              <Label htmlFor="sp-goal">Weekly Goal (hours)</Label>
              <Input
                id="sp-goal"
                type="number"
                min={0}
                max={40}
                step={0.5}
                value={form.weekly_goal_hours ?? 0}
                onChange={e => setForm(f => ({ ...f, weekly_goal_hours: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Update Progress'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Study Session Form ───────────────────────────────────────────────────────

function StudySessionFormDialog(): React.ReactElement {
  const isOpen = useCareerIntelligenceStore(s => s.isSessionFormOpen)
  const close = useCareerIntelligenceStore(s => s.closeSessionForm)
  const submit = useCareerIntelligenceStore(s => s.submitSession)
  const isSubmitting = useCareerIntelligenceStore(s => s.isSubmittingSession)
  const skillProgress = useCareerIntelligenceStore(s => s.skillProgress)

  const [form, setForm] = useState<LogStudySessionInput>({
    skill_id: null,
    title: '',
    notes: '',
    duration_minutes: 60,
    session_date: new Date().toISOString().slice(0, 10),
  })

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!form.title.trim()) return
    await submit(form)
    setForm({ skill_id: null, title: '', notes: '', duration_minutes: 60, session_date: new Date().toISOString().slice(0, 10) })
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) close() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Study Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { void handleSubmit(e) }} className="space-y-4">
          <div>
            <Label htmlFor="ss-title">Session Title *</Label>
            <Input
              id="ss-title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Azure AD fundamentals review"
              required
            />
          </div>

          <div>
            <Label htmlFor="ss-skill">Skill (optional)</Label>
            <Select
              value={form.skill_id ?? '__none__'}
              onValueChange={v => setForm(f => ({ ...f, skill_id: v === '__none__' ? null : v }))}
            >
              <SelectTrigger id="ss-skill">
                <SelectValue placeholder="Select a skill..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No specific skill</SelectItem>
                {skillProgress.map(s => (
                  <SelectItem key={s.skill_id} value={s.skill_id}>{s.skill_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ss-duration">Duration (minutes)</Label>
              <Input
                id="ss-duration"
                type="number"
                min={1}
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="ss-date">Date</Label>
              <Input
                id="ss-date"
                type="date"
                value={form.session_date}
                onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ss-notes">Notes</Label>
            <Textarea
              id="ss-notes"
              value={form.notes ?? ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="What did you cover? Key learnings..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !form.title.trim()}>
              {isSubmitting ? 'Logging...' : 'Log Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({ session }: { session: StudySession }): React.ReactElement {
  const confirmDelete = useCareerIntelligenceStore(s => s.confirmDeleteSession)
  const hours = Math.floor(session.duration_minutes / 60)
  const mins = session.duration_minutes % 60
  const durationLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 group">
      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">{session.title}</span>
          {session.skill_name && (
            <Badge variant="secondary" className="text-xs shrink-0">{session.skill_name}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{session.session_date}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-medium text-foreground">{durationLabel}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={() => confirmDelete(session.id)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function SkillProgressTab(): React.ReactElement {
  const skillProgress = useCareerIntelligenceStore(s => s.skillProgress)
  const studySessions = useCareerIntelligenceStore(s => s.studySessions)
  const isLoadingSkills = useCareerIntelligenceStore(s => s.isLoadingSkillProgress)
  const isLoadingSessions = useCareerIntelligenceStore(s => s.isLoadingStudySessions)
  const openSessionForm = useCareerIntelligenceStore(s => s.openSessionForm)
  const fetchStudySessions = useCareerIntelligenceStore(s => s.fetchStudySessions)
  const deletingSessionId = useCareerIntelligenceStore(s => s.deletingSessionId)
  const cancelDelete = useCareerIntelligenceStore(s => s.cancelDeleteSession)
  const executeDelete = useCareerIntelligenceStore(s => s.executeDeleteSession)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('__all__')
  const [sessionsLoaded, setSessionsLoaded] = useState(false)

  function loadSessions(): void {
    if (!sessionsLoaded) {
      void fetchStudySessions()
      setSessionsLoaded(true)
    }
  }

  const filtered = skillProgress.filter(s => {
    const matchSearch = !search || s.skill_name.toLowerCase().includes(search.toLowerCase())
    const matchLevel = levelFilter === '__all__' || s.current_level === levelFilter
    return matchSearch && matchLevel
  })

  const totalStudyHours = studySessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60

  return (
    <div className="flex h-[calc(100vh-200px)] overflow-hidden">
      {/* Left — Skill Progress Grid */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">Skill Progress Tracking</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              {skillProgress.length} skills tracked
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search skills..."
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All levels</SelectItem>
                {SKILL_LEVELS.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingSkills ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title={search ? 'No skills match your search' : 'No skills yet'}
              description={search ? 'Try a different search term' : 'Add skills to start tracking your progress'}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(skill => (
                <SkillProgressCard key={skill.skill_id} skill={skill} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right — Study Sessions */}
      <div className="w-80 shrink-0 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-medium text-foreground">Study Sessions</h2>
            <Button
              size="sm"
              className="h-7 px-2 gap-1"
              onClick={() => { openSessionForm(); loadSessions() }}
            >
              <Plus className="w-3.5 h-3.5" />
              Log
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {studySessions.length} sessions · {totalStudyHours.toFixed(1)}h total
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3" onClick={loadSessions}>
          {!sessionsLoaded ? (
            <div className="py-8 text-center text-sm text-muted-foreground cursor-pointer">
              <Clock className="w-6 h-6 mx-auto mb-2" />
              Click to load sessions
            </div>
          ) : isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : studySessions.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No sessions logged yet</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={openSessionForm}>
                Log first session
              </Button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {studySessions.map(session => (
                <SessionRow key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <EditSkillProgressDialog />
      <StudySessionFormDialog />

      {/* Delete session confirm */}
      <Dialog open={!!deletingSessionId} onOpenChange={open => { if (!open) cancelDelete() }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this study session?</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={cancelDelete}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => void executeDelete()}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
