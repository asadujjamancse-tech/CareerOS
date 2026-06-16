import { TrendingUp, Clock, Brain, Target, Activity, Award } from 'lucide-react'
import { useLearningCoachStore } from '../store/learning-coach.store'

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground/70 mt-0.5">{sub}</div>}
    </div>
  )
}

function SparkLine({ data }: { data: Array<{ week: string; minutes: number }> }) {
  if (data.length < 2) return null
  const maxVal = Math.max(...data.map(d => d.minutes), 1)
  const w = 200
  const h = 50

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (d.minutes / maxVal) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - (d.minutes / maxVal) * (h - 4) - 2
        return <circle key={i} cx={x} cy={y} r={3} fill="hsl(var(--primary))" />
      })}
    </svg>
  )
}

function AccuracyBar({ label, accuracy, total }: { label: string; accuracy: number; total: number }) {
  const color = accuracy >= 80 ? '#22C55E' : accuracy >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 truncate text-xs text-foreground shrink-0">{label}</div>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${accuracy}%`, background: color }} />
      </div>
      <div className="text-xs font-medium text-foreground w-12 text-right shrink-0">{accuracy}%</div>
      <div className="text-xs text-muted-foreground w-16 text-right shrink-0">{total} attempts</div>
    </div>
  )
}

function RetainedSkillRow({ skill, rank }: { skill: { skill_name: string; retention_score: number; interval_days: number }; rank: number }) {
  const color = skill.retention_score >= 80 ? '#22C55E' : skill.retention_score >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="text-xs font-bold text-muted-foreground w-6 text-center">#{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground truncate">{skill.skill_name}</div>
        <div className="text-xs text-muted-foreground">Review every {skill.interval_days} day{skill.interval_days !== 1 ? 's' : ''}</div>
      </div>
      <div className="shrink-0">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: color }}>
          {skill.retention_score}%
        </span>
      </div>
    </div>
  )
}

export function EffectivenessTab() {
  const { effectiveness } = useLearningCoachStore()

  if (!effectiveness) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
        <Activity className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No effectiveness data yet</p>
        <p className="text-xs text-muted-foreground mt-1">Start studying, doing labs, and completing reviews to see your metrics</p>
      </div>
    )
  }

  const m = effectiveness

  const studyHours = Math.round(m.total_study_minutes / 60 * 10) / 10
  const labHours = Math.round(m.total_lab_minutes / 60 * 10) / 10
  const totalHours = Math.round((m.total_study_minutes + m.total_lab_minutes) / 60 * 10) / 10

  const qualityLabel = m.avg_review_quality >= 4 ? 'Excellent' : m.avg_review_quality >= 3 ? 'Good' : m.avg_review_quality >= 2 ? 'Fair' : 'Needs Work'

  return (
    <div className="h-full overflow-y-auto space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Learning Effectiveness Tracking</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Understand how well your learning methods are working across all dimensions</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <StatCard label="Total Learning Hours" value={totalHours} sub={`${studyHours}h study + ${labHours}h lab`} icon={Clock} color="#3B82F6" />
        <StatCard label="Review Sessions" value={m.total_review_sessions} sub={`Avg quality: ${m.avg_review_quality}/5 (${qualityLabel})`} icon={Brain} color="#8B5CF6" />
        <StatCard label="Tracked Skills" value={m.skills_with_retention} sub={`Avg retention: ${m.avg_retention_score}%`} icon={Target} color="#22C55E" />
        <StatCard label="Due for Review" value={m.skills_due_for_review} sub="Skills need attention" icon={AlertCircle} color={m.skills_due_for_review > 0 ? '#F59E0B' : '#22C55E'} />
        <StatCard label="Learning Velocity" value={m.learning_velocity} sub="Skills added last 90 days" icon={TrendingUp} color="#06B6D4" />
        <StatCard label="Study Consistency" value={m.weekly_study_trend.filter(w => w.minutes > 0).length} sub="Active weeks tracked" icon={Activity} color="#EC4899" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly study trend */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Weekly Study Trend</h3>
          {m.weekly_study_trend.length > 1 ? (
            <div className="space-y-3">
              <SparkLine data={m.weekly_study_trend.map(w => ({ week: w.week, minutes: w.minutes }))} />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {m.weekly_study_trend.slice(0, 6).map(w => (
                  <div key={w.week} className="text-center">
                    <div className="text-xs font-medium text-foreground">{Math.round(w.minutes / 60 * 10) / 10}h</div>
                    <div className="text-xs text-muted-foreground">{w.week.replace('W', 'W')}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground">Log study sessions to see your trend</div>
          )}
        </div>

        {/* Top retained skills */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-emerald-500" />Top Retained Skills</h3>
          {m.top_retained_skills.length > 0 ? (
            <div>
              {m.top_retained_skills.map((s, i) => <RetainedSkillRow key={s.skill_name} skill={s} rank={i + 1} />)}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground">Complete reviews to see retention data</div>
          )}
        </div>
      </div>

      {/* Quiz/Recall accuracy */}
      {m.skill_accuracy_stats.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-primary" />Recall Accuracy by Skill</h3>
          <div className="space-y-3">
            {m.skill_accuracy_stats.map(s => (
              <AccuracyBar key={s.skill_name} label={s.skill_name} accuracy={s.accuracy_pct} total={s.total_attempts} />
            ))}
          </div>
        </div>
      )}

      {/* Review quality gauge */}
      {m.total_review_sessions > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-purple-500" />Average Review Quality</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(m.avg_review_quality / 5) * 100}%`, background: m.avg_review_quality >= 3 ? '#22C55E' : '#F59E0B' }} />
            </div>
            <span className="text-sm font-semibold text-foreground">{m.avg_review_quality}/5 — {qualityLabel}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Complete blackout</span><span>Perfect recall</span>
          </div>
        </div>
      )}
    </div>
  )
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
