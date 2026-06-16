import { useState } from 'react'
import { Plus, Lock, Unlock, ChevronRight, Trash2, BookOpen, Clock, Target } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Label } from '@shared/components/ui/label'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { useLearningCoachStore } from '../store/learning-coach.store'
import { PREDEFINED_LEARNING_PATHS, PATH_CATEGORIES, SENIORITY_LEVELS } from '../types/learning-coach.types'
import type { LearningPath, LearningPathSkillItem } from '../types/learning-coach.types'

const CATEGORY_COLORS: Record<string, string> = {
  'it-support':    '#3B82F6',
  'msp':           '#10B981',
  'sysadmin':      '#8B5CF6',
  'azure-admin':   '#0078D4',
  'cloud-support': '#06B6D4',
  'cyber-security':'#EF4444',
  'custom':        '#6B7280',
}

function ProgressArc({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/20" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="currentColor" strokeWidth={4} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" className="text-primary" transform={`rotate(-90 ${cx} ${cx})`} />
      <text x={cx} y={cx + 4} textAnchor="middle" fontSize={11} className="fill-foreground font-semibold">{pct}%</text>
    </svg>
  )
}

function SkillRow({ skill }: { skill: LearningPathSkillItem }) {
  const isComplete = skill.current_status === 'mastered' || skill.current_level === skill.target_level
  const isLocked = skill.is_unlocked === 0

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${isComplete ? 'bg-emerald-500/5 border-emerald-500/20' : isLocked ? 'bg-muted/20 border-muted/30 opacity-60' : 'bg-background border-border'}`}>
      <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${isComplete ? 'bg-emerald-500/20 text-emerald-500' : isLocked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
        {isLocked ? <Lock className="w-3.5 h-3.5" /> : isComplete ? <span className="text-xs">✓</span> : <Unlock className="w-3.5 h-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>{skill.skill_name}</span>
          <Badge variant="outline" className="text-xs capitalize">{skill.target_level}</Badge>
          {skill.current_level && <Badge variant="secondary" className="text-xs capitalize">{skill.current_level}</Badge>}
        </div>
        {skill.why_it_matters && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skill.why_it_matters}</p>}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{skill.estimated_hours}h estimated</span>
          {skill.prerequisites_json && (() => {
            try {
              const prereqs = JSON.parse(skill.prerequisites_json) as string[]
              if (prereqs.length > 0) return (
                <span className="text-xs text-muted-foreground">Requires: {prereqs.join(', ')}</span>
              )
            } catch { return null }
            return null
          })()}
        </div>
      </div>
    </div>
  )
}

function PathCard({ path, onSelect, onDelete }: { path: LearningPath; onSelect: (p: LearningPath) => void; onDelete: (id: string) => void }) {
  const catColor = CATEGORY_COLORS[path.category] ?? '#6B7280'
  const catLabel = PATH_CATEGORIES.find(c => c.value === path.category)?.label ?? path.category

  return (
    <div className="rounded-xl border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer group"
      onClick={() => onSelect(path)}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white" style={{ background: catColor }}>{catLabel}</span>
              <span className="text-xs text-muted-foreground capitalize">{path.seniority_level}</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground truncate">{path.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{path.career_goal}</p>
          </div>
          <ProgressArc pct={path.progress_pct} size={52} />
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{path.total_skills} skills</span>
          <span className="flex items-center gap-1"><Target className="w-3 h-3" />{path.completed_skills} done</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{path.estimated_weeks}w</span>
        </div>

        {path.next_skill && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Next: <strong>{path.next_skill.skill_name}</strong></span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
          onClick={e => { e.stopPropagation(); onDelete(path.id) }}>
          <Trash2 className="w-3.5 h-3.5" />Delete
        </button>
      </div>
    </div>
  )
}

function CreatePathDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (data: object) => void }) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [category, setCategory] = useState('custom')
  const [seniority, setSeniority] = useState('entry')
  const [weeks, setWeeks] = useState('12')
  const [hours, setHours] = useState('10')

  function handleCreate() {
    if (mode === 'preset' && selectedPreset !== null) {
      const preset = PREDEFINED_LEARNING_PATHS[selectedPreset]!
      onCreate({
        title: preset.title,
        career_goal: preset.career_goal,
        category: preset.category,
        seniority_level: preset.seniority_level,
        estimated_weeks: preset.estimated_weeks,
        available_hours_per_week: preset.available_hours_per_week,
        description: preset.description,
        skills: preset.skills,
      })
    } else {
      if (!title.trim()) return
      onCreate({ title, career_goal: goal, category, seniority_level: seniority, estimated_weeks: parseInt(weeks), available_hours_per_week: parseInt(hours) })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Learning Path</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Button size="sm" variant={mode === 'preset' ? 'default' : 'outline'} onClick={() => setMode('preset')}>Quick-start Templates</Button>
          <Button size="sm" variant={mode === 'custom' ? 'default' : 'outline'} onClick={() => setMode('custom')}>Custom Path</Button>
        </div>

        {mode === 'preset' ? (
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
            {PREDEFINED_LEARNING_PATHS.map((p, i) => {
              const color = CATEGORY_COLORS[p.category] ?? '#6B7280'
              return (
                <button key={i} onClick={() => setSelectedPreset(i)}
                  className={`text-left p-3 rounded-lg border transition-colors ${selectedPreset === i ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-xs text-white" style={{ background: color }}>
                      {PATH_CATEGORIES.find(c => c.value === p.category)?.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{p.estimated_weeks}w</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.skills.length} skills</p>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <div><Label className="text-xs">Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Learning Path" /></div>
            <div><Label className="text-xs">Career Goal</Label><Textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="What role are you targeting?" rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PATH_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Seniority</Label>
                <Select value={seniority} onValueChange={setSeniority}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SENIORITY_LEVELS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Duration (weeks)</Label><Input type="number" value={weeks} onChange={e => setWeeks(e.target.value)} min={1} /></div>
              <div><Label className="text-xs">Hours/week available</Label><Input type="number" value={hours} onChange={e => setHours(e.target.value)} min={1} /></div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={mode === 'preset' ? selectedPreset === null : !title.trim()}>
            Create Path
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PathDetailPanel({ path, onClose }: { path: LearningPath; onClose: () => void }) {
  const catColor = CATEGORY_COLORS[path.category] ?? '#6B7280'
  const catLabel = PATH_CATEGORIES.find(c => c.value === path.category)?.label ?? path.category
  const totalHours = path.skills.reduce((s, sk) => s + sk.estimated_hours, 0)
  const weeksAtPace = Math.ceil(totalHours / (path.available_hours_per_week || 1))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs text-white font-medium" style={{ background: catColor }}>{catLabel}</span>
            <Badge variant="outline" className="capitalize text-xs">{path.seniority_level}</Badge>
          </div>
          <h2 className="text-base font-semibold text-foreground">{path.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{path.career_goal}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">×</button>
      </div>

      <div className="grid grid-cols-4 gap-2 p-3 border-b border-border">
        {[
          { label: 'Progress', value: `${path.progress_pct}%` },
          { label: 'Skills', value: `${path.completed_skills}/${path.total_skills}` },
          { label: 'Total Hours', value: `${totalHours}h` },
          { label: 'ETA', value: `${weeksAtPace}w` },
        ].map(s => (
          <div key={s.label} className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="text-sm font-semibold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {path.next_skill && (
        <div className="mx-3 mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="text-xs font-semibold text-primary mb-1">▶ Study Next</div>
          <div className="text-sm font-medium text-foreground">{path.next_skill.skill_name}</div>
          {path.next_skill.why_it_matters && <p className="text-xs text-muted-foreground mt-1">{path.next_skill.why_it_matters}</p>}
          <div className="text-xs text-muted-foreground mt-1">{path.next_skill.estimated_hours}h estimated · Target: {path.next_skill.target_level}</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Skill Sequence ({path.skills.length} skills)
        </div>
        {path.skills.map((skill, i) => (
          <div key={skill.id} className="flex items-start gap-2">
            <div className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold bg-muted/40 text-muted-foreground mt-3">{i + 1}</div>
            <div className="flex-1"><SkillRow skill={skill} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LearningPathsTab() {
  const { paths, createPath, deletePath, setPathSkills } = useLearningCoachStore()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null)

  async function handleCreate(data: object) {
    const { skills, ...pathData } = data as { skills?: Array<object>; [k: string]: unknown }
    const path = await createPath(pathData as unknown as Parameters<typeof createPath>[0])
    if (path && skills && skills.length > 0) {
      await setPathSkills(path.id, skills as Parameters<typeof setPathSkills>[1])
    }
  }

  async function handleDelete(id: string) {
    await deletePath(id)
    if (selectedPath?.id === id) setSelectedPath(null)
  }

  return (
    <div className="h-full flex gap-4">
      <div className={`flex flex-col ${selectedPath ? 'w-72 shrink-0' : 'flex-1'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Learning Paths</h2>
            <p className="text-xs text-muted-foreground">{paths.length} path{paths.length !== 1 ? 's' : ''}</p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" />New Path
          </Button>
        </div>

        {paths.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <BookOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No learning paths yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create a path to see your structured learning sequence</p>
            <Button size="sm" className="mt-4" onClick={() => setShowCreate(true)}>Create First Path</Button>
          </div>
        ) : (
          <div className={`grid gap-3 ${selectedPath ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} overflow-y-auto flex-1`}>
            {paths.map(p => (
              <PathCard key={p.id} path={p}
                onSelect={setSelectedPath}
                onDelete={id => { void handleDelete(id) }}
              />
            ))}
          </div>
        )}
      </div>

      {selectedPath && (
        <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <PathDetailPanel path={selectedPath} onClose={() => setSelectedPath(null)} />
        </div>
      )}

      <CreatePathDialog open={showCreate} onClose={() => setShowCreate(false)} onCreate={data => { void handleCreate(data) }} />
    </div>
  )
}
