import { useEffect } from 'react'
import {
  TrendingUp, Code2, FlaskConical, FolderOpen, Award, MessageSquare,
  Clock, Star, AlertTriangle, ChevronLeft, ChevronRight,
  BookOpen, Activity,
} from 'lucide-react'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { useDashboardStore } from '../store/dashboard.store'
import { cn } from '@shared/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function pct(val: number, total: number): number {
  return total > 0 ? Math.round((val / total) * 100) : 0
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
      <div className={cn('mt-0.5 shrink-0', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Readiness Gauge ───────────────────────────────────────────────────────────

function ReadinessGauge({ score }: { score: number }) {
  const color = score >= 75 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'
  const bgColor = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="rounded-lg border border-border bg-card p-6 flex flex-col items-center gap-4">
      <div className="relative h-28 w-28 flex items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
          <circle
            cx="50" cy="50" r="42" fill="none" strokeWidth="8"
            className={bgColor.replace('bg-', 'stroke-')}
            strokeDasharray={`${score * 2.638} 263.8`}
            strokeLinecap="round"
          />
        </svg>
        <div className="text-center">
          <p className={cn('text-3xl font-bold tabular-nums', color)}>{score}</p>
          <p className="text-xs text-muted-foreground">/ 100</p>
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold">Career Readiness Score</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {score >= 75 ? 'Excellent — you\'re well-prepared' :
           score >= 50 ? 'Good — keep building your profile' :
           'Getting started — keep adding skills and completing labs'}
        </p>
      </div>
    </div>
  )
}

// ── Readiness Breakdown ───────────────────────────────────────────────────────

function ReadinessBreakdown({ readiness }: { readiness: { overall: number; skills_score: number; certifications_score: number; projects_score: number; labs_score: number; interview_score: number } }) {
  const items = [
    { label: 'Skills', score: readiness.skills_score, weight: '30%' },
    { label: 'Certifications', score: readiness.certifications_score, weight: '20%' },
    { label: 'Projects', score: readiness.projects_score, weight: '20%' },
    { label: 'Labs', score: readiness.labs_score, weight: '15%' },
    { label: 'Interview Prep', score: readiness.interview_score, weight: '15%' },
  ]
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <p className="text-sm font-medium">Score Breakdown</p>
      {items.map(item => (
        <div key={item.label} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>{item.label} <span className="text-muted-foreground">({item.weight})</span></span>
            <span className="font-medium">{item.score}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', item.score >= 75 ? 'bg-green-500' : item.score >= 50 ? 'bg-amber-500' : 'bg-red-400')}
              style={{ width: `${item.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Bar Chart (CSS) ───────────────────────────────────────────────────────────

function BarChart({ data, label, valueKey, labelKey, color = 'bg-primary', suffix = '' }: {
  data: Record<string, unknown>[]
  label: string
  valueKey: string
  labelKey: string
  color?: string
  suffix?: string
}) {
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1)

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No data yet</p>
      ) : (
        <div className="space-y-2">
          {data.map((d, i) => {
            const val = Number(d[valueKey]) || 0
            const lbl = String(d[labelKey] ?? '')
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20 shrink-0 truncate text-right">{lbl}</span>
                <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                  <div
                    className={cn('h-full rounded transition-all flex items-center pl-2', color)}
                    style={{ width: `${Math.max((val / max) * 100, val > 0 ? 2 : 0)}%` }}
                  >
                    {val > 0 && <span className="text-[10px] text-white font-medium whitespace-nowrap">{val}{suffix}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Weekly/Monthly Chart ──────────────────────────────────────────────────────

function ActivityChart({ data, type }: {
  data: Array<{ study_minutes: number; lab_minutes: number; skills_added: number; week_start?: string; month?: string }>
  type: 'weekly' | 'monthly'
}) {
  const labelKey = type === 'weekly' ? 'week_start' : 'month'
  const maxTotal = Math.max(...data.map(d => d.study_minutes + d.lab_minutes), 1)

  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No activity data yet</p>
      ) : (
        <div className="flex items-end gap-1 h-32">
          {data.map((d, i) => {
            const total = d.study_minutes + d.lab_minutes
            const height = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                  <div
                    className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors"
                    style={{ height: `${Math.max(height, total > 0 ? 4 : 0)}%` }}
                    title={`${fmt(total)} total\n${d.skills_added} skills added`}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                  {type === 'weekly'
                    ? new Date(String(d[labelKey])).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
                    : String(d[labelKey]).slice(5)
                  }
                </span>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Study + Lab time</span>
      </div>
    </div>
  )
}

// ── Recent Activity ───────────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  skill: Code2,
  lab: FlaskConical,
  certification: Award,
  project: FolderOpen,
  interview_question: MessageSquare,
}

const ACTIVITY_COLORS: Record<string, string> = {
  skill: 'text-blue-500',
  lab: 'text-green-500',
  certification: 'text-purple-500',
  project: 'text-orange-500',
  interview_question: 'text-pink-500',
}

function RecentActivity({ items }: { items: Array<{ type: string; id: string; title: string; detail: string; occurred_at: string }> }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-6">No recent activity yet.</p>
  }
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const Icon = ACTIVITY_ICONS[item.type] ?? Activity
        const color = ACTIVITY_COLORS[item.type] ?? 'text-muted-foreground'
        return (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <Icon className={cn('h-4 w-4 shrink-0', color)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground capitalize">{item.type.replace(/_/g, ' ')} · {item.detail}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(item.occurred_at).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Weekly Report ─────────────────────────────────────────────────────────────

function WeeklyReportView() {
  const { weeklyReport, isLoadingWeekly, selectedWeek, setSelectedWeek } = useDashboardStore()

  function prevWeek() {
    const d = new Date(selectedWeek)
    d.setDate(d.getDate() - 7)
    setSelectedWeek(d.toISOString().slice(0, 10))
  }
  function nextWeek() {
    const d = new Date(selectedWeek)
    d.setDate(d.getDate() + 7)
    const now = new Date()
    if (d > now) return
    setSelectedWeek(d.toISOString().slice(0, 10))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={prevWeek}><ChevronLeft /></Button>
        <span className="text-sm font-medium">
          Week of {new Date(selectedWeek).toLocaleDateString('en-AU', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
        <Button variant="outline" size="icon-sm" onClick={nextWeek}><ChevronRight /></Button>
      </div>

      {isLoadingWeekly ? <PageLoader /> : !weeklyReport ? (
        <p className="text-sm text-muted-foreground">Select a week to view the report.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Clock} label="Study time" value={fmt(weeklyReport.study_minutes)} color="text-blue-500" />
          <StatCard icon={FlaskConical} label="Lab time" value={fmt(weeklyReport.lab_minutes)} color="text-green-500" />
          <StatCard icon={Code2} label="Skills added" value={weeklyReport.skills_added} color="text-purple-500" />
          <StatCard icon={Code2} label="Skills mastered" value={weeklyReport.skills_mastered} color="text-amber-500" />
          <StatCard icon={FlaskConical} label="Labs completed" value={weeklyReport.labs_completed} color="text-green-500" />
          <StatCard icon={MessageSquare} label="Questions reviewed" value={weeklyReport.questions_reviewed} color="text-pink-500" />
          <StatCard icon={MessageSquare} label="Questions mastered" value={weeklyReport.questions_mastered} color="text-pink-400" />
        </div>
      )}
    </div>
  )
}

// ── Monthly Report ────────────────────────────────────────────────────────────

function MonthlyReportView() {
  const { monthlyReport, isLoadingMonthly, selectedMonth, setSelectedMonth } = useDashboardStore()

  function prevMonth() {
    const parts = selectedMonth.split('-')
    const y = Number(parts[0]); const m = Number(parts[1])
    const d = new Date(y, m - 2, 1)
    setSelectedMonth(d.toISOString().slice(0, 7))
  }
  function nextMonth() {
    const parts = selectedMonth.split('-')
    const y = Number(parts[0]); const m = Number(parts[1])
    const d = new Date(y, m, 1)
    if (d > new Date()) return
    setSelectedMonth(d.toISOString().slice(0, 7))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={prevMonth}><ChevronLeft /></Button>
        <span className="text-sm font-medium">
          {new Date(selectedMonth + '-01').toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
        </span>
        <Button variant="outline" size="icon-sm" onClick={nextMonth}><ChevronRight /></Button>
      </div>

      {isLoadingMonthly ? <PageLoader /> : !monthlyReport ? (
        <p className="text-sm text-muted-foreground">Select a month to view the report.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Clock} label="Study time" value={fmt(monthlyReport.study_minutes)} color="text-blue-500" />
          <StatCard icon={FlaskConical} label="Lab time" value={fmt(monthlyReport.lab_minutes)} color="text-green-500" />
          <StatCard icon={Code2} label="Skills added" value={monthlyReport.skills_added} color="text-purple-500" />
          <StatCard icon={Code2} label="Skills mastered" value={monthlyReport.skills_mastered} color="text-amber-500" />
          <StatCard icon={FolderOpen} label="Projects completed" value={monthlyReport.projects_completed} color="text-orange-500" />
          <StatCard icon={Award} label="Certs earned" value={monthlyReport.certs_earned} color="text-yellow-500" />
          <StatCard icon={FlaskConical} label="Labs completed" value={monthlyReport.labs_completed} color="text-green-500" />
          <StatCard icon={MessageSquare} label="Questions mastered" value={monthlyReport.questions_mastered} color="text-pink-500" />
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function LearningDashboardPage() {
  const { dashboard, isLoading, error, fetch, fetchWeeklyReport, fetchMonthlyReport, selectedWeek, selectedMonth } = useDashboardStore()

  useEffect(() => {
    void fetch()
    void fetchWeeklyReport(selectedWeek)
    void fetchMonthlyReport(selectedMonth)
  }, [fetch, fetchWeeklyReport, fetchMonthlyReport, selectedWeek, selectedMonth])

  if (isLoading) return (
    <div className="flex items-center justify-center h-full"><PageLoader /></div>
  )

  if (error) return (
    <PageLayout title="Learning Dashboard" description="Track your career growth and readiness.">
      <div className="text-center py-20">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => void fetch()} className="mt-3">Retry</Button>
      </div>
    </PageLayout>
  )

  const t = dashboard?.totals
  const r = dashboard?.career_readiness

  return (
    <PageLayout
      title="Learning Dashboard"
      description="Track your career growth, study time, and overall readiness."
      actions={
        <Button variant="outline" size="sm" onClick={() => void fetch()} className="gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />Refresh
        </Button>
      }
    >
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* Key stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard icon={Clock} label="Total study time" value={fmt((t?.total_study_minutes ?? 0) + (t?.total_lab_minutes ?? 0))} color="text-blue-500" />
            <StatCard icon={Code2} label="Skills" value={t?.skills_total ?? 0} sub={`${t?.skills_mastered ?? 0} mastered`} color="text-purple-500" />
            <StatCard icon={FlaskConical} label="Home Labs" value={t?.labs_total ?? 0} sub={`${t?.labs_completed ?? 0} completed`} color="text-green-500" />
            <StatCard icon={FolderOpen} label="Projects" value={t?.projects_total ?? 0} sub={`${t?.projects_completed ?? 0} completed`} color="text-orange-500" />
            <StatCard icon={Award} label="Certifications" value={t?.certifications_total ?? 0} sub={`${t?.certifications_earned ?? 0} earned`} color="text-yellow-500" />
            <StatCard icon={MessageSquare} label="Interview Qs" value={t?.interview_questions_total ?? 0} sub={`${t?.interview_questions_mastered ?? 0} mastered`} color="text-pink-500" />
            <StatCard icon={BookOpen} label="Study time" value={fmt(t?.total_study_minutes ?? 0)} color="text-blue-400" />
            <StatCard icon={FlaskConical} label="Lab time" value={fmt(t?.total_lab_minutes ?? 0)} color="text-teal-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Readiness */}
            <div className="space-y-4">
              {r && <ReadinessGauge score={r.overall} />}
              {r && <ReadinessBreakdown readiness={r} />}
            </div>

            {/* Recent Activity + Upcoming renewals */}
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium mb-3">Recent Activity</p>
                <RecentActivity items={dashboard?.recent_activity ?? []} />
              </div>

              {(dashboard?.upcoming_cert_renewals ?? []).length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p className="text-sm font-medium">Upcoming Renewals</p>
                  </div>
                  <div className="space-y-2">
                    {dashboard!.upcoming_cert_renewals.map((cert, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div>
                          <p className="font-medium">{cert.name}</p>
                          <p className="text-muted-foreground">{cert.issuer}</p>
                        </div>
                        <Badge variant="warning" className="text-[10px]">{cert.days_left}d left</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top skills */}
          {(dashboard?.top_skills ?? []).length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium mb-3">Top Skills</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {dashboard!.top_skills.map((s, i) => (
                  <div key={i} className="rounded-md border border-border p-2.5">
                    <p className="text-xs font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.category}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs">{s.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Analytics ── */}
        <TabsContent value="analytics" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity over time */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium mb-3">Activity (Last 12 Weeks)</p>
              <ActivityChart data={dashboard?.weekly_activity ?? []} type="weekly" />
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium mb-3">Activity (Last 12 Months)</p>
              <ActivityChart data={dashboard?.monthly_activity ?? []} type="monthly" />
            </div>

            {/* Skill growth */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium mb-3">Skill Growth</p>
              <BarChart
                data={dashboard?.skill_growth ?? []}
                label="Skills added per month"
                valueKey="count"
                labelKey="month"
                color="bg-blue-500"
              />
            </div>

            {/* Certification progress */}
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium mb-4">Module Progress</p>
              <div className="space-y-3">
                {[
                  { label: 'Skills', done: t?.skills_mastered ?? 0, total: t?.skills_total ?? 0, color: 'bg-purple-500' },
                  { label: 'Projects', done: t?.projects_completed ?? 0, total: t?.projects_total ?? 0, color: 'bg-orange-500' },
                  { label: 'Certifications', done: t?.certifications_earned ?? 0, total: t?.certifications_total ?? 0, color: 'bg-yellow-500' },
                  { label: 'Home Labs', done: t?.labs_completed ?? 0, total: t?.labs_total ?? 0, color: 'bg-green-500' },
                  { label: 'Interview Questions', done: t?.interview_questions_mastered ?? 0, total: t?.interview_questions_total ?? 0, color: 'bg-pink-500' },
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{item.label}</span>
                      <span className="text-muted-foreground">{item.done}/{item.total} ({pct(item.done, item.total)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full', item.color)} style={{ width: `${pct(item.done, item.total)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Weekly Report ── */}
        <TabsContent value="weekly" className="mt-4">
          <WeeklyReportView />
        </TabsContent>

        {/* ── Monthly Report ── */}
        <TabsContent value="monthly" className="mt-4">
          <MonthlyReportView />
        </TabsContent>
      </Tabs>

    </PageLayout>
  )
}
