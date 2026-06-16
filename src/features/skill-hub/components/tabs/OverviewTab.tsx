import { Clock, FlaskConical, FolderOpen, Award, MessageSquare, BookOpen, Star, TrendingUp, Activity } from 'lucide-react'
import type { SkillHubOverview } from '@shared/types/ipc.types'
import { computeXp, computeMastery, computeInterviewReadiness, computeCertReadiness, formatHours } from '../../types/skill-hub.types'

interface Props {
  overview: SkillHubOverview
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div className="rounded-md p-2 shrink-0" style={{ backgroundColor: `${color}20` }}>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function RadialProgress({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={6} fill="none" className="text-border" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={6} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  )
}

function ReadinessCard({ label, pct, color, icon: Icon }: { label: string; pct: number; color: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4">
      <div className="relative">
        <RadialProgress pct={pct} color={color} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{pct}%</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

export function OverviewTab({ overview }: Props) {
  const xpData = computeXp(overview)
  const mastery = computeMastery(overview)
  const interviewReadiness = computeInterviewReadiness(overview.interview_avg_mastery)
  const certReadiness = computeCertReadiness(overview.certs_earned, overview.certs_total)
  const moduleProgress = overview.modules_total > 0
    ? Math.round((overview.modules_complete / overview.modules_total) * 100)
    : 0

  const lastActivity = overview.last_activity_at
    ? new Date(overview.last_activity_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No activity yet'

  return (
    <div className="space-y-6">
      {/* XP + Level Banner */}
      <div className="rounded-lg border border-border bg-gradient-to-r from-card to-card/80 p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4" style={{ color: xpData.color }} />
              <span className="text-sm font-semibold" style={{ color: xpData.color }}>{xpData.level}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{xpData.xp.toLocaleString()} XP</p>
            {xpData.level !== 'Expert' && (
              <p className="text-xs text-muted-foreground mt-1">
                {(xpData.nextLevelXp - xpData.xp).toLocaleString()} XP to next level
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <ReadinessCard label="Mastery" pct={mastery} color="#8B5CF6" icon={TrendingUp} />
            <ReadinessCard label="Interview" pct={interviewReadiness} color="#3B82F6" icon={MessageSquare} />
            <ReadinessCard label="Certs" pct={certReadiness} color="#10B981" icon={Award} />
          </div>
        </div>

        {/* XP progress bar */}
        {xpData.level !== 'Expert' && (
          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (xpData.xp / xpData.nextLevelXp) * 100)}%`,
                  backgroundColor: xpData.color,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Hours Studied" value={formatHours(overview.hours_studied)} icon={Clock} color="#3B82F6" />
        <StatCard label="Hours Practiced" value={formatHours(overview.hours_practiced)} icon={Activity} color="#8B5CF6" />
        <StatCard
          label="Modules"
          value={`${overview.modules_complete}/${overview.modules_total}`}
          sub={`${moduleProgress}% complete`}
          icon={BookOpen}
          color="#F59E0B"
        />
        <StatCard
          label="Labs"
          value={`${overview.labs_complete}/${overview.labs_total}`}
          sub={overview.labs_total > 0 ? `${Math.round(overview.labs_complete/overview.labs_total*100)}% done` : 'None linked'}
          icon={FlaskConical}
          color="#10B981"
        />
        <StatCard
          label="Projects"
          value={`${overview.projects_complete}/${overview.projects_total}`}
          sub={overview.projects_total > 0 ? `${Math.round(overview.projects_complete/overview.projects_total*100)}% done` : 'None linked'}
          icon={FolderOpen}
          color="#EC4899"
        />
        <StatCard
          label="Interview Q's"
          value={overview.interview_total}
          sub={overview.interview_total > 0 ? `Avg score ${overview.interview_avg_mastery.toFixed(1)}/5` : 'None linked'}
          icon={MessageSquare}
          color="#06B6D4"
        />
        <StatCard
          label="Certifications"
          value={`${overview.certs_earned}/${overview.certs_total}`}
          sub={overview.certs_total > 0 ? `${certReadiness}% earned` : 'None linked'}
          icon={Award}
          color="#F97316"
        />
        <StatCard label="Last Activity" value={lastActivity} icon={Clock} color="#6B7280" />
      </div>

      {/* Description */}
      {overview.description && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
          <p className="text-sm text-foreground leading-relaxed">{overview.description}</p>
        </div>
      )}

      {/* Quick Tips */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          {overview.modules_total === 0 && (
            <p className="flex items-center gap-2"><BookOpen className="h-3 w-3 text-amber-400" /> Add modules in the Roadmap tab to track your learning path</p>
          )}
          {overview.resources_total === 0 && (
            <p className="flex items-center gap-2"><Star className="h-3 w-3 text-blue-400" /> Add learning resources to keep your study materials organised</p>
          )}
          {overview.labs_total === 0 && (
            <p className="flex items-center gap-2"><FlaskConical className="h-3 w-3 text-green-400" /> Link home labs to build practical experience</p>
          )}
          {overview.interview_total === 0 && (
            <p className="flex items-center gap-2"><MessageSquare className="h-3 w-3 text-cyan-400" /> Link interview questions to track your readiness</p>
          )}
          {overview.modules_total > 0 && overview.resources_total > 0 && overview.labs_total > 0 && overview.interview_total > 0 && (
            <p className="flex items-center gap-2"><TrendingUp className="h-3 w-3 text-purple-400" /> Keep progressing — you're building a strong foundation!</p>
          )}
        </div>
      </div>
    </div>
  )
}
