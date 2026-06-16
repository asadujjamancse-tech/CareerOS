import { useEffect } from 'react'
import {
  Sparkles, Target, Award, FolderOpen, BookOpen,
  AlertTriangle, ChevronRight, Clock, Zap, TrendingUp,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { LoadingSpinner } from '@shared/components/common/LoadingSpinner'
import { useCareerIntelligenceStore } from '../store/career-intelligence.store'

// ─── Readiness Gauge ──────────────────────────────────────────────────────────

function ReadinessGauge({ score }: { score: number }): React.ReactElement {
  const r = 70
  const strokeWidth = 14
  const circ = Math.PI * r
  const dash = (score / 100) * circ

  const color =
    score >= 80 ? '#22c55e'
    : score >= 60 ? '#3b82f6'
    : score >= 40 ? '#f59e0b'
    : '#ef4444'

  const label =
    score >= 80 ? 'Job Ready'
    : score >= 60 ? 'Getting There'
    : score >= 40 ? 'Building Up'
    : 'Early Stage'

  return (
    <div className="flex flex-col items-center">
      <svg width={170} height={100} viewBox="0 0 170 100">
        {/* Background arc */}
        <path
          d="M 10 90 A 75 75 0 0 1 160 90"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 10 90 A 75 75 0 0 1 160 90"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Score text */}
        <text x="85" y="78" textAnchor="middle" className="fill-foreground" style={{ fontSize: 28, fontWeight: 700 }}>
          {score}%
        </text>
      </svg>
      <span className="text-sm font-medium mt-1" style={{ color }}>{label}</span>
    </div>
  )
}

// ─── Score Breakdown ──────────────────────────────────────────────────────────

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }): React.ReactElement {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500/60'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </div>
        <span className="font-semibold text-foreground">{score}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// ─── Skill Gap Card ───────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
}

function SkillGapRow({ skill, index }: { skill: { skill_name: string; current_level: string; target_level: string; gap: number }; index: number }): React.ReactElement {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground truncate">{skill.skill_name}</span>
          <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
            <span>{LEVEL_LABELS[skill.current_level] ?? skill.current_level}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-medium">{LEVEL_LABELS[skill.target_level] ?? skill.target_level}</span>
          </div>
        </div>
        <div className="flex mt-1 gap-0.5">
          {Array.from({ length: 4 }, (_, i) => {
            const levels = ['beginner', 'intermediate', 'advanced', 'expert']
            const currentIdx = levels.indexOf(skill.current_level)
            const targetIdx = levels.indexOf(skill.target_level)
            return (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= currentIdx
                    ? 'bg-primary'
                    : i <= targetIdx
                      ? 'bg-primary/25'
                      : 'bg-muted'
                }`}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Weekly Plan Row ─────────────────────────────────────────────────────────

function WeeklyPlanRow({ item }: { item: { skill_name: string; recommended_hours: number; reason: string } }): React.ReactElement {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Clock className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{item.skill_name}</div>
        <div className="text-xs text-muted-foreground">{item.reason}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-foreground">{item.recommended_hours}h</div>
        <div className="text-xs text-muted-foreground">per week</div>
      </div>
    </div>
  )
}

// ─── Missing Skill Row ────────────────────────────────────────────────────────

function MissingSkillRow({ skill, index }: { skill: { name: string; importance: string; skill_id: string | null }; index: number }): React.ReactElement {
  const importanceColors: Record<string, string> = {
    critical: 'text-red-400',
    important: 'text-blue-400',
    'nice-to-have': 'text-muted-foreground',
  }

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className={`text-sm font-bold w-5 shrink-0 ${importanceColors[skill.importance] ?? 'text-foreground'}`}>
        {index + 1}.
      </span>
      <span className="text-sm text-foreground flex-1">{skill.name}</span>
      <span className={`text-xs shrink-0 ${importanceColors[skill.importance] ?? 'text-muted-foreground'}`}>
        {skill.importance}
      </span>
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function AICoachTab(): React.ReactElement {
  const recommendations = useCareerIntelligenceStore(s => s.recommendations)
  const isLoading = useCareerIntelligenceStore(s => s.isLoadingRecommendations)
  const error = useCareerIntelligenceStore(s => s.recommendationsError)
  const fetchRecommendations = useCareerIntelligenceStore(s => s.fetchRecommendations)
  const activeRoadmap = useCareerIntelligenceStore(s => s.activeRoadmap)

  useEffect(() => {
    void fetchRecommendations(activeRoadmap?.id)
  }, [fetchRecommendations, activeRoadmap?.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-sm text-muted-foreground mt-3">Analyzing your profile...</p>
        </div>
      </div>
    )
  }

  if (error || !recommendations) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{error ?? 'Failed to load recommendations'}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => void fetchRecommendations(activeRoadmap?.id)}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  const r = recommendations

  return (
    <div className="overflow-y-auto h-[calc(100vh-200px)]">
      <div className="p-5 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Career Coach
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeRoadmap ? `Coaching for: ${activeRoadmap.title}` : 'General career analysis based on your data'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchRecommendations(activeRoadmap?.id)}
          >
            Refresh Analysis
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Left column */}
          <div className="col-span-4 space-y-5">
            {/* Job Readiness */}
            <div className="rounded-xl border border-border p-5 bg-card">
              <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Job Readiness Score
              </h3>
              <ReadinessGauge score={r.job_readiness_score} />
              <div className="mt-5 space-y-3">
                <ScoreBar
                  label="Skills"
                  score={r.readiness_breakdown.skills_score}
                  icon={<TrendingUp className="w-3 h-3" />}
                />
                <ScoreBar
                  label="Certifications"
                  score={r.readiness_breakdown.certifications_score}
                  icon={<Award className="w-3 h-3" />}
                />
                <ScoreBar
                  label="Projects"
                  score={r.readiness_breakdown.projects_score}
                  icon={<FolderOpen className="w-3 h-3" />}
                />
                <ScoreBar
                  label="Experience"
                  score={r.readiness_breakdown.experience_score}
                  icon={<Clock className="w-3 h-3" />}
                />
              </div>
            </div>

            {/* Next Steps */}
            {(r.next_certification || r.next_project) && (
              <div className="rounded-xl border border-border p-5 bg-card">
                <h3 className="text-sm font-medium text-foreground mb-3">Next Steps</h3>
                {r.next_certification && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-2">
                    <Award className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Next Certification</div>
                      <div className="text-sm font-medium text-foreground">{r.next_certification}</div>
                    </div>
                  </div>
                )}
                {r.next_project && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <FolderOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Next Project</div>
                      <div className="text-sm font-medium text-foreground">{r.next_project}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="col-span-8 space-y-5">
            {/* Missing Skills */}
            {r.missing_skills.length > 0 && (
              <div className="rounded-xl border border-border p-5 bg-card">
                <h3 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-400" />
                  Recommended Next Skills
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {activeRoadmap ? 'Skills missing from your active roadmap' : 'Skills that need improvement'}
                </p>
                <div className="divide-y divide-border">
                  {r.missing_skills.map((skill, i) => (
                    <MissingSkillRow key={i} skill={skill} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Skill Gaps */}
            {r.top_skill_gaps.length > 0 && (
              <div className="rounded-xl border border-border p-5 bg-card">
                <h3 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Skill Gaps to Close
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Skills where current level is below your target
                </p>
                <div className="divide-y divide-border">
                  {r.top_skill_gaps.map((skill, i) => (
                    <SkillGapRow key={i} skill={skill} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Study Plan */}
            {r.weekly_study_plan.length > 0 && (
              <div className="rounded-xl border border-border p-5 bg-card">
                <h3 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-green-400" />
                  Weekly Study Plan
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Recommended focus areas for this week —{' '}
                  {r.weekly_study_plan.reduce((s, i) => s + i.recommended_hours, 0)}h total
                </p>
                <div className="space-y-2">
                  {r.weekly_study_plan.map((item, i) => (
                    <WeeklyPlanRow key={i} item={item} />
                  ))}
                </div>
              </div>
            )}

            {r.missing_skills.length === 0 && r.top_skill_gaps.length === 0 && r.weekly_study_plan.length === 0 && (
              <div className="rounded-xl border border-border p-8 bg-card text-center">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium text-foreground mb-1">You're on track!</h3>
                <p className="text-sm text-muted-foreground">
                  Add skills, certifications, and set an active roadmap to get personalized recommendations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
