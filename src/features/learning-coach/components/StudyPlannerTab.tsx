import { useState } from 'react'
import { CalendarDays, Zap, CheckCircle2, Circle, Trash2, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Textarea } from '@shared/components/ui/textarea'
import { useLearningCoachStore } from '../store/learning-coach.store'
import { LEARNING_METHODS } from '../types/learning-coach.types'
import type { StudyPlan, StudyPlanItem } from '../types/learning-coach.types'

const METHOD_COLOR: Record<string, string> = {
  'home-lab': '#22C55E', 'notes': '#3B82F6', 'videos': '#EF4444',
  'active-recall': '#F59E0B', 'flashcards': '#8B5CF6',
  'interview-questions': '#EC4899', 'projects': '#06B6D4',
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function PlanItemRow({ item, onToggle }: { item: StudyPlanItem; onToggle: (id: string, done: boolean) => void }) {
  const color = METHOD_COLOR[item.method] ?? '#6B7280'
  const method = LEARNING_METHODS.find(m => m.value === item.method)

  return (
    <div className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${item.is_done ? 'bg-muted/20 border-border/40 opacity-60' : 'bg-background border-border hover:border-primary/20'}`}>
      <button onClick={() => onToggle(item.id, !item.is_done)} className="mt-0.5 shrink-0">
        {item.is_done
          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          : <Circle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium ${item.is_done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.action}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs" style={{ background: `${color}20`, color }}>
            {method?.icon} {method?.label ?? item.method}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(item.estimated_minutes)}</span>
        </div>
      </div>
    </div>
  )
}

function PlanCard({ plan, onDelete, onToggleItem, expanded, onToggleExpand }: {
  plan: StudyPlan
  onDelete: (id: string) => void
  onToggleItem: (itemId: string, planId: string, done: boolean) => void
  expanded: boolean
  onToggleExpand: () => void
}) {
  const totalMinutes = plan.items.reduce((s, i) => s + i.estimated_minutes, 0)
  const planTypeColors = { daily: '#3B82F6', weekly: '#10B981', monthly: '#8B5CF6' }
  const color = planTypeColors[plan.plan_type as keyof typeof planTypeColors] ?? '#6B7280'

  const dayGroups = plan.items.reduce<Record<number, StudyPlanItem[]>>((acc, item) => {
    if (!acc[item.day_of_plan]) acc[item.day_of_plan] = []
    acc[item.day_of_plan]!.push(item)
    return acc
  }, {})

  const dayLabel = (day: number) => {
    if (plan.plan_type === 'daily') return `Session ${day}`
    if (plan.plan_type === 'weekly') return `Day ${day} (${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day - 1] ?? day})`
    return `Week ${day}`
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs text-white font-medium capitalize" style={{ background: color }}>{plan.plan_type}</span>
              {plan.is_active === 1 && <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">Active</Badge>}
            </div>
            <h3 className="text-sm font-semibold text-foreground">{plan.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{plan.career_goal}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">{plan.progress_pct}%</div>
              <div className="text-xs text-muted-foreground">{plan.completed_items}/{plan.total_items} done</div>
            </div>
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        <div className="h-1.5 bg-muted rounded-full mt-3 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${plan.progress_pct}%` }} />
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(totalMinutes)} total</span>
          <span>{plan.available_hours_per_week}h/week pace</span>
          <span>{plan.start_date}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          <div className="p-3 space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(dayGroups).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([day, items]) => (
              <div key={day}>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{dayLabel(parseInt(day))}</div>
                <div className="space-y-1.5">
                  {items.map(item => (
                    <PlanItemRow key={item.id} item={item} onToggle={(id, done) => onToggleItem(id, plan.id, done)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border flex justify-end">
            <button className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
              onClick={() => onDelete(plan.id)}>
              <Trash2 className="w-3.5 h-3.5" />Delete Plan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function GeneratePlanDialog({ open, onClose, onGenerate }: { open: boolean; onClose: () => void; onGenerate: (data: object) => void }) {
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [hours, setHours] = useState('10')
  const [notes, setNotes] = useState('')

  const typeDescriptions = {
    daily: 'A single day plan with morning and afternoon sessions',
    weekly: '7-day plan balanced across your available weekly hours',
    monthly: '4-week plan for longer-term structured learning',
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Generate Study Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Plan Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Weekly Study Plan" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Career Goal</Label>
            <Textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Prepare for AZ-104 exam in 8 weeks" rows={2} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Plan Type</Label>
              <Select value={type} onValueChange={v => setType(v as typeof type)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Hours/week available</Label>
              <Input type="number" value={hours} onChange={e => setHours(e.target.value)} min={1} max={40} className="mt-1" />
            </div>
          </div>
          <div className="p-2.5 bg-primary/5 rounded-lg text-xs text-muted-foreground">
            <span className="font-medium text-foreground">How it works: </span>
            {typeDescriptions[type]} — built from your current skill gaps, due reviews, and method recommendations.
          </div>
          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Focus on Azure networking this week" className="mt-1" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (title && goal) { onGenerate({ title, career_goal: goal, plan_type: type, available_hours_per_week: parseInt(hours), notes: notes || null }); onClose() } }}
            disabled={!title.trim() || !goal.trim()}>
            <Zap className="w-3.5 h-3.5 mr-1.5" />Generate Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function StudyPlannerTab() {
  const { studyPlans, generateStudyPlan, deleteStudyPlan, markPlanItemDone } = useLearningCoachStore()
  const [showGenerate, setShowGenerate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function handleGenerate(data: object) {
    const plan = await generateStudyPlan(data as Parameters<typeof generateStudyPlan>[0])
    if (plan) setExpandedId(plan.id)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">AI Study Planner</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Auto-generated daily, weekly, and monthly study plans based on your goals and skill gaps</p>
        </div>
        <Button size="sm" onClick={() => setShowGenerate(true)}>
          <Zap className="w-3.5 h-3.5 mr-1.5" />Generate Plan
        </Button>
      </div>

      {studyPlans.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No study plans yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">Generate a plan and CareerOS will build a structured schedule from your skill gaps, review queue, and learning methods</p>
          <Button size="sm" className="mt-4" onClick={() => setShowGenerate(true)}>
            <Zap className="w-3.5 h-3.5 mr-1.5" />Generate First Plan
          </Button>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1">
          {studyPlans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              expanded={expandedId === plan.id}
              onToggleExpand={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
              onDelete={id => { void deleteStudyPlan(id) }}
              onToggleItem={(itemId, planId, done) => { void markPlanItemDone(itemId, planId, done) }}
            />
          ))}
        </div>
      )}

      <GeneratePlanDialog open={showGenerate} onClose={() => setShowGenerate(false)} onGenerate={data => { void handleGenerate(data) }} />
    </div>
  )
}
