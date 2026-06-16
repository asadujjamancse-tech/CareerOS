import { useEffect } from 'react'
import {
  BarChart3, TrendingUp, Award, FolderOpen, BookOpen, Clock,
  File, Video, FileText, RefreshCw, AlertTriangle,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { LoadingSpinner } from '@shared/components/common/LoadingSpinner'
import { useCareerIntelligenceStore } from '../store/career-intelligence.store'
import type { AnalyticsDashboard } from '@shared/types/ipc.types'

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  height?: number
  showValues?: boolean
}

function BarChart({ data, height = 120, showValues = true }: BarChartProps): React.ReactElement {
  if (data.length === 0) {
    return <div className="text-xs text-muted-foreground text-center py-4">No data</div>
  }
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = 100 / data.length

  return (
    <svg width="100%" height={height + 30} viewBox={`0 0 100 ${height + 30}`} preserveAspectRatio="none">
      {data.map((d, i) => {
        const barH = (d.value / max) * height
        const x = i * barW + barW * 0.1
        const w = barW * 0.8
        const y = height - barH
        const color = d.color ?? '#3b82f6'
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={barH} rx={2} fill={color} opacity={0.85} />
            {showValues && d.value > 0 && (
              <text
                x={x + w / 2}
                y={y - 2}
                textAnchor="middle"
                fill="currentColor"
                className="text-foreground"
                style={{ fontSize: 4, fontWeight: 600 }}
              >
                {d.value}
              </text>
            )}
            <text
              x={x + w / 2}
              y={height + 10}
              textAnchor="middle"
              fill="currentColor"
              className="text-muted-foreground"
              style={{ fontSize: 4 }}
            >
              {d.label.length > 5 ? d.label.slice(0, 5) : d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Horizontal Bar ───────────────────────────────────────────────────────────

function HorizontalBar({ label, value, max, color = '#3b82f6', sub }: {
  label: string
  value: number
  max: number
  color?: string
  sub?: string
}): React.ReactElement {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate max-w-32">{label}</span>
          {sub && <span className="text-muted-foreground">{sub}</span>}
        </div>
        <span className="text-muted-foreground shrink-0">{pct}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color }: {
  label: string
  value: number | string
  sub?: string
  icon: React.ReactNode
  color: string
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-border p-4 bg-card flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20' }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {sub && <div className="text-xs text-primary mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// ─── Study Hours Mini Chart ───────────────────────────────────────────────────

function StudyHoursChart({ data }: { data: Array<{ week: string; hours: number }> }): React.ReactElement {
  if (data.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
        No study sessions recorded yet
      </div>
    )
  }
  const max = Math.max(...data.map(d => d.hours), 1)
  const W = 100
  const H = 60

  return (
    <svg width="100%" height={H + 20} viewBox={`0 0 ${W} ${H + 20}`} preserveAspectRatio="none">
      {/* Area fill */}
      {data.length > 1 && (
        <polyline
          points={data.map((d, i) => {
            const x = (i / (data.length - 1)) * W
            const y = H - (d.hours / max) * H
            return `${x},${y}`
          }).join(' ')}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1.5}
          opacity={0.9}
        />
      )}
      {data.map((d, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * W
        const y = H - (d.hours / max) * H
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={2.5} fill="#3b82f6" />
            <text
              x={x}
              y={H + 10}
              textAnchor="middle"
              fill="currentColor"
              className="text-muted-foreground"
              style={{ fontSize: 4 }}
            >
              {d.week.slice(-2)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ data, size = 80 }: { data: Array<{ label: string; value: number; color: string }>; size?: number }): React.ReactElement {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return <div className="text-xs text-muted-foreground text-center">No data</div>
  }

  const r = size / 2 - 8
  const circ = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const pct = d.value / total
          const dash = pct * circ
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={10}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              opacity={0.85}
            />
          )
          offset += dash
          return seg
        })}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          className="text-foreground"
          style={{ fontSize: size / 5, fontWeight: 700 }}
        >
          {total}
        </text>
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground capitalize">{d.label}</span>
            <span className="font-medium text-foreground ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard Layout ─────────────────────────────────────────────────────────

function DashboardView({ data }: { data: AnalyticsDashboard }): React.ReactElement {
  const { totals } = data
  const studyHoursFormatted = totals.total_study_hours < 1
    ? `${Math.round(totals.total_study_hours * 60)}m`
    : `${totals.total_study_hours.toFixed(1)}h`

  const levelColors: Record<string, string> = {
    beginner: '#6b7280',
    intermediate: '#3b82f6',
    advanced: '#8b5cf6',
    expert: '#f59e0b',
  }

  const certStatusColors: Record<string, string> = {
    planned: '#6b7280',
    'in-progress': '#3b82f6',
    earned: '#22c55e',
    expired: '#f59e0b',
    revoked: '#ef4444',
  }

  const skillStatusColors: Record<string, string> = {
    learning: '#6b7280',
    practicing: '#3b82f6',
    proficient: '#8b5cf6',
    mastered: '#22c55e',
  }

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Skills"
          value={totals.skills}
          sub={`${totals.skills_mastered} mastered`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#3b82f6"
        />
        <StatCard
          label="Projects"
          value={totals.projects}
          sub={`${totals.projects_completed} completed`}
          icon={<FolderOpen className="w-5 h-5" />}
          color="#8b5cf6"
        />
        <StatCard
          label="Certifications"
          value={totals.certifications}
          sub={`${totals.certifications_earned} earned`}
          icon={<Award className="w-5 h-5" />}
          color="#f59e0b"
        />
        <StatCard
          label="Study Time"
          value={studyHoursFormatted}
          sub={`${totals.study_sessions} sessions`}
          icon={<Clock className="w-5 h-5" />}
          color="#10b981"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Notes"
          value={totals.notes}
          icon={<FileText className="w-5 h-5" />}
          color="#6b7280"
        />
        <StatCard
          label="Documents"
          value={totals.documents}
          icon={<File className="w-5 h-5" />}
          color="#ec4899"
        />
        <StatCard
          label="Videos"
          value={totals.videos}
          sub={`${totals.videos_completed} completed`}
          icon={<Video className="w-5 h-5" />}
          color="#14b8a6"
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Skill Level Distribution */}
        <div className="rounded-xl border border-border p-4 bg-card">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Skills by Level
          </h3>
          <BarChart
            data={data.skill_level_distribution.map(d => ({
              label: d.level,
              value: d.count,
              color: levelColors[d.level] ?? '#6b7280',
            }))}
          />
        </div>

        {/* Certification Status */}
        <div className="rounded-xl border border-border p-4 bg-card">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            Certifications by Status
          </h3>
          {data.certification_status_distribution.length > 0 ? (
            <DonutChart
              data={data.certification_status_distribution.map(d => ({
                label: d.status,
                value: d.count,
                color: certStatusColors[d.status] ?? '#6b7280',
              }))}
            />
          ) : (
            <div className="text-xs text-muted-foreground text-center py-8">No certifications yet</div>
          )}
        </div>

        {/* Skill Status */}
        <div className="rounded-xl border border-border p-4 bg-card">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Skills by Status
          </h3>
          {data.skill_status_distribution.length > 0 ? (
            <DonutChart
              data={data.skill_status_distribution.map(d => ({
                label: d.status,
                value: d.count,
                color: skillStatusColors[d.status] ?? '#6b7280',
              }))}
            />
          ) : (
            <div className="text-xs text-muted-foreground text-center py-8">No skills yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Study hours by week */}
        <div className="rounded-xl border border-border p-4 bg-card">
          <h3 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-400" />
            Study Hours (Last 8 Weeks)
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Weekly study time in hours</p>
          <StudyHoursChart data={data.study_hours_by_week} />
        </div>

        {/* Top skills by progress */}
        <div className="rounded-xl border border-border p-4 bg-card">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Top Skills by Progress
          </h3>
          {data.top_skills_by_progress.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6">No skills tracked yet</div>
          ) : (
            <div className="space-y-2.5">
              {data.top_skills_by_progress.slice(0, 6).map(skill => (
                <HorizontalBar
                  key={skill.skill_id}
                  label={skill.skill_name}
                  value={skill.progress_pct}
                  max={100}
                  sub={`${skill.current_level} → ${skill.target_level}`}
                  color={skill.progress_pct >= 100 ? '#22c55e' : skill.progress_pct >= 75 ? '#3b82f6' : '#f59e0b'}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      {data.recent_study_sessions.length > 0 && (
        <div className="rounded-xl border border-border p-4 bg-card">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-green-400" />
            Recent Study Sessions
          </h3>
          <div className="space-y-1">
            {data.recent_study_sessions.map(session => {
              const hours = Math.floor(session.duration_minutes / 60)
              const mins = session.duration_minutes % 60
              const dur = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
              return (
                <div key={session.id} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">{session.title}</span>
                  {session.skill_name && (
                    <span className="text-xs text-muted-foreground shrink-0">{session.skill_name}</span>
                  )}
                  <span className="text-xs font-medium text-foreground shrink-0">{dur}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{session.session_date}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function AnalyticsTab(): React.ReactElement {
  const analytics = useCareerIntelligenceStore(s => s.analytics)
  const isLoading = useCareerIntelligenceStore(s => s.isLoadingAnalytics)
  const analyticsError = useCareerIntelligenceStore(s => s.analyticsError)
  const fetchAnalytics = useCareerIntelligenceStore(s => s.fetchAnalytics)

  useEffect(() => {
    void fetchAnalytics()
  }, [fetchAnalytics])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-sm text-muted-foreground mt-3">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (analyticsError || !analytics) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{analyticsError ?? 'Failed to load analytics'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void fetchAnalytics()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-[calc(100vh-200px)]">
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Learning Analytics
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Your complete career learning overview</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchAnalytics()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>

        <DashboardView data={analytics} />
      </div>
    </div>
  )
}
