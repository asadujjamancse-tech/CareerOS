import { useState } from 'react'
import { Sliders, Save, RotateCcw, Zap } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@shared/components/ui/dialog'
import { Label } from '@shared/components/ui/label'
import { useLearningCoachStore } from '../store/learning-coach.store'
import { LEARNING_METHODS } from '../types/learning-coach.types'
import type { SkillMethodConfig } from '../types/learning-coach.types'

const METHOD_KEYS: Array<keyof Pick<SkillMethodConfig, 'home_lab_pct' | 'notes_pct' | 'videos_pct' | 'active_recall_pct' | 'flashcards_pct' | 'interview_pct' | 'projects_pct'>> =
  ['home_lab_pct', 'notes_pct', 'videos_pct', 'active_recall_pct', 'flashcards_pct', 'interview_pct', 'projects_pct']

const METHOD_KEY_TO_VALUE: Record<string, string> = {
  home_lab_pct:    'home-lab',
  notes_pct:       'notes',
  videos_pct:      'videos',
  active_recall_pct: 'active-recall',
  flashcards_pct:  'flashcards',
  interview_pct:   'interview-questions',
  projects_pct:    'projects',
}

function DonutChart({ data }: { data: Array<{ label: string; value: number; color: string }> }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 100
  const r = 38
  const cx = 52
  const circ = 2 * Math.PI * r
  let cumulative = 0

  return (
    <div className="flex items-center gap-4">
      <svg width={104} height={104} viewBox="0 0 104 104">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={14} />
        {data.filter(d => d.value > 0).map((d, i) => {
          const dashLength = (d.value / total) * circ
          const offset = circ - cumulative * circ / total
          cumulative += d.value
          return (
            <circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={d.color}
              strokeWidth={14} strokeDasharray={`${dashLength} ${circ - dashLength}`}
              strokeDashoffset={offset} style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          )
        })}
        <text x={cx} y={cx + 4} textAnchor="middle" fontSize={10} className="fill-muted-foreground">mix</text>
      </svg>
      <div className="space-y-1">
        {data.filter(d => d.value > 0).sort((a, b) => b.value - a.value).map(d => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-muted-foreground w-28 truncate">{d.label}</span>
            <span className="font-medium text-foreground">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConfigCard({ config, onEdit }: { config: SkillMethodConfig; onEdit: (c: SkillMethodConfig) => void }) {
  const chartData = LEARNING_METHODS.map(m => {
    const key = METHOD_KEYS.find(k => METHOD_KEY_TO_VALUE[k] === m.value)!
    return { label: m.label, value: config[key], color: m.color }
  })

  const topMethod = [...chartData].sort((a, b) => b.value - a.value)[0]

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{config.skill_name}</h3>
          {config.is_custom === 1 && <Badge variant="outline" className="text-xs mt-0.5">Custom</Badge>}
        </div>
        <button onClick={() => onEdit(config)} className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      <DonutChart data={chartData} />

      {config.rationale && (
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2 italic">"{config.rationale}"</p>
      )}

      {topMethod && (
        <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          Primary method: <span className="font-medium" style={{ color: topMethod.color }}>{topMethod.label} ({topMethod.value}%)</span>
        </div>
      )}
    </div>
  )
}

function EditMethodDialog({ config, open, onClose, onSave }: { config: SkillMethodConfig; open: boolean; onClose: () => void; onSave: (skillId: string, data: Record<string, number | string>) => void }) {
  const [values, setValues] = useState<Record<string, number>>({
    home_lab_pct: config.home_lab_pct,
    notes_pct: config.notes_pct,
    videos_pct: config.videos_pct,
    active_recall_pct: config.active_recall_pct,
    flashcards_pct: config.flashcards_pct,
    interview_pct: config.interview_pct,
    projects_pct: config.projects_pct,
  })

  const total = Object.values(values).reduce((s, v) => s + v, 0)
  const isValid = total === 100

  function handleReset() {
    setValues({ home_lab_pct: 20, notes_pct: 20, videos_pct: 20, active_recall_pct: 15, flashcards_pct: 15, interview_pct: 5, projects_pct: 5 })
  }

  function handleAutoBalance() {
    const entries = Object.entries(values)
    const nonZero = entries.filter(([, v]) => v > 0)
    if (nonZero.length === 0) return
    const perItem = Math.floor(100 / nonZero.length)
    const remainder = 100 - perItem * nonZero.length
    const balanced: Record<string, number> = {}
    entries.forEach(([k]) => { balanced[k] = 0 })
    nonZero.forEach(([k], i) => { balanced[k] = i === 0 ? perItem + remainder : perItem })
    setValues(balanced)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Learning Method Mix — {config.skill_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total: <span className={`font-semibold ${isValid ? 'text-emerald-500' : 'text-destructive'}`}>{total}%</span></span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleAutoBalance}><Zap className="w-3.5 h-3.5 mr-1" />Auto-balance</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleReset}><RotateCcw className="w-3.5 h-3.5 mr-1" />Reset</Button>
            </div>
          </div>

          {LEARNING_METHODS.map(m => {
            const key = METHOD_KEYS.find(k => METHOD_KEY_TO_VALUE[k] === m.value)!
            const val = values[key] ?? 0
            return (
              <div key={m.value}>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                    {m.label}
                  </Label>
                  <span className="text-xs font-medium text-foreground">{val}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} value={val}
                    onChange={e => setValues(v => ({ ...v, [key]: parseInt(e.target.value) }))}
                    className="flex-1 h-1.5 accent-primary"
                    style={{ accentColor: m.color }}
                  />
                </div>
                <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${val}%`, background: m.color }} />
                </div>
              </div>
            )
          })}
        </div>

        {!isValid && <p className="text-xs text-destructive">Percentages must add up to 100% (currently {total}%)</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(config.skill_id, { ...values, is_custom: 1 }); onClose() }} disabled={!isValid}>
            <Save className="w-3.5 h-3.5 mr-1.5" />Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function MethodRecommendationsTab() {
  const { methodConfigs, upsertMethodConfig } = useLearningCoachStore()
  const [editConfig, setEditConfig] = useState<SkillMethodConfig | null>(null)

  async function handleSave(skillId: string, data: Record<string, number | string>) {
    await upsertMethodConfig(skillId, data as Parameters<typeof upsertMethodConfig>[1])
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Learning Method Recommendations</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          CareerOS recommends the optimal % split across 7 learning methods for each of your skills. Customise any skill to match your style.
        </p>
      </div>

      {methodConfigs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <Sliders className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No method configurations yet</p>
          <p className="text-xs text-muted-foreground mt-1">Method recommendations are auto-generated when you view a skill in Skill Hub</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1">
          {methodConfigs.map(c => (
            <ConfigCard key={c.skill_id} config={c} onEdit={setEditConfig} />
          ))}
        </div>
      )}

      {/* Method legend */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2 font-medium">Learning Methods:</div>
        <div className="flex flex-wrap gap-3">
          {LEARNING_METHODS.map(m => (
            <span key={m.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {editConfig && (
        <EditMethodDialog
          config={editConfig}
          open={!!editConfig}
          onClose={() => setEditConfig(null)}
          onSave={(skillId, data) => { void handleSave(skillId, data) }}
        />
      )}
    </div>
  )
}
