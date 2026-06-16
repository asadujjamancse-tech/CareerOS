import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Code2,
  LayoutDashboard, Map, BookOpen, FlaskConical,
  FolderOpen, MessageSquare, Clock, Activity,
  Award, Video, Brain, Zap, Edit2,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { cn } from '@shared/lib/utils'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { useSkillHubStore } from '../store/skill-hub.store'
import { computeXp } from '../types/skill-hub.types'
import { OverviewTab }      from './tabs/OverviewTab'
import { RoadmapTab }       from './tabs/RoadmapTab'
import { ResourcesTab }     from './tabs/ResourcesTab'
import { HomeLabsTab }      from './tabs/HomeLabsTab'
import { ProjectsTab }      from './tabs/ProjectsTab'
import { InterviewPrepTab } from './tabs/InterviewPrepTab'
import { StudySessionsTab } from './tabs/StudySessionsTab'
import { ExperienceLogTab } from './tabs/ExperienceLogTab'
import { CertificationsTab } from './tabs/CertificationsTab'
import { VideosTab }        from './tabs/VideosTab'
import { QuizTab }          from './tabs/QuizTab'
import { RelatedSkillsTab } from './tabs/RelatedSkillsTab'

type Tab = {
  id: string
  label: string
  icon: React.ElementType
  badge?: number | undefined
}

const LEVEL_COLORS: Record<string, string> = {
  beginner:     '#6B7280',
  intermediate: '#3B82F6',
  advanced:     '#8B5CF6',
  expert:       '#F59E0B',
}

const STATUS_COLORS: Record<string, string> = {
  learning:   '#3B82F6',
  practicing: '#F59E0B',
  proficient: '#10B981',
  mastered:   '#8B5CF6',
}

export function SkillHubPage() {
  const { skillId } = useParams<{ skillId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const {
    overview, modules, resources, experienceLog, quizQuestions, quizStats,
    linkedLabs, linkedProjects, linkedCertifications, linkedInterviewQuestions,
    linkedVideos, relatedSkills,
    isLoadingOverview, isLoadingModules, isLoadingResources, isLoadingExperienceLog,
    isLoadingQuiz, isLoadingLabs, isLoadingProjects, isLoadingCerts,
    isLoadingInterview, isLoadingVideos, isLoadingRelated,
    overviewError,
    loadOverview, loadModules, loadResources, loadExperienceLog,
    loadQuizQuestions, loadQuizStats, loadLinkedLabs, loadLinkedProjects,
    loadLinkedCertifications, loadLinkedInterviewQuestions, loadLinkedVideos,
    loadRelatedSkills, reset,
  } = useSkillHubStore()

  useEffect(() => {
    if (!skillId) return
    reset()
    void loadOverview(skillId)
    void loadModules(skillId)
    void loadResources(skillId)
    void loadLinkedLabs(skillId)
    void loadLinkedProjects(skillId)
    void loadLinkedCertifications(skillId)
    void loadLinkedInterviewQuestions(skillId)
    void loadLinkedVideos(skillId)
    void loadRelatedSkills(skillId)
    void loadExperienceLog(skillId)
    void loadQuizQuestions(skillId)
    void loadQuizStats(skillId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId])

  if (!skillId) return null

  if (isLoadingOverview && !overview) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <PageLoader />
      </div>
    )
  }

  if (overviewError || !overview) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <Code2 className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{overviewError ?? 'Skill not found'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/skills')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Skills
        </Button>
      </div>
    )
  }

  const xpData = computeXp(overview)

  const TABS: Tab[] = [
    { id: 'overview',      label: 'Overview',     icon: LayoutDashboard },
    { id: 'roadmap',       label: 'Roadmap',      icon: Map,           badge: modules.length > 0 ? modules.length : undefined },
    { id: 'resources',     label: 'Resources',    icon: BookOpen,      badge: resources.length > 0 ? resources.length : undefined },
    { id: 'labs',          label: 'Home Labs',    icon: FlaskConical,  badge: linkedLabs.length > 0 ? linkedLabs.length : undefined },
    { id: 'projects',      label: 'Projects',     icon: FolderOpen,    badge: linkedProjects.length > 0 ? linkedProjects.length : undefined },
    { id: 'interview',     label: 'Interview',    icon: MessageSquare, badge: linkedInterviewQuestions.length > 0 ? linkedInterviewQuestions.length : undefined },
    { id: 'study',         label: 'Study Log',    icon: Clock },
    { id: 'experience',    label: 'Experience',   icon: Activity,      badge: experienceLog.length > 0 ? experienceLog.length : undefined },
    { id: 'certifications',label: 'Certs',        icon: Award,         badge: linkedCertifications.length > 0 ? linkedCertifications.length : undefined },
    { id: 'videos',        label: 'Videos',       icon: Video,         badge: linkedVideos.length > 0 ? linkedVideos.length : undefined },
    { id: 'quiz',          label: 'Quiz',         icon: Brain,         badge: quizQuestions.length > 0 ? quizQuestions.length : undefined },
    { id: 'related',       label: 'Related',      icon: Zap,           badge: relatedSkills.length > 0 ? relatedSkills.length : undefined },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-border bg-card">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost" size="icon-sm"
            onClick={() => navigate('/skills')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Category dot + name */}
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: overview.category_color }} />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{overview.name}</h1>
            <p className="text-xs text-muted-foreground">{overview.category_name}</p>
          </div>

          {/* Level + XP badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold border"
              style={{
                color: LEVEL_COLORS[overview.proficiency_level] ?? '#6B7280',
                borderColor: `${LEVEL_COLORS[overview.proficiency_level] ?? '#6B7280'}40`,
                backgroundColor: `${LEVEL_COLORS[overview.proficiency_level] ?? '#6B7280'}10`,
              }}
            >
              {overview.proficiency_level}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold border"
              style={{
                color: STATUS_COLORS[overview.status] ?? '#6B7280',
                borderColor: `${STATUS_COLORS[overview.status] ?? '#6B7280'}40`,
                backgroundColor: `${STATUS_COLORS[overview.status] ?? '#6B7280'}10`,
              }}
            >
              {overview.status}
            </span>
            <div
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold border"
              style={{ color: xpData.color, borderColor: `${xpData.color}40`, backgroundColor: `${xpData.color}10` }}
            >
              <Zap className="h-3 w-3" />
              {xpData.xp.toLocaleString()} XP · {xpData.level}
            </div>
            <Button
              variant="ghost" size="icon-sm"
              onClick={() => navigate('/skills')}
              title="Edit skill"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex overflow-x-auto scrollbar-none px-4 gap-0.5 pb-px">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
                {tab.badge != null && (
                  <span className={cn(
                    'ml-0.5 rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold',
                    active ? 'bg-primary/20 text-primary' : 'bg-border text-muted-foreground',
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <OverviewTab overview={overview} />
        )}
        {activeTab === 'roadmap' && (
          <RoadmapTab skillId={skillId} modules={modules} isLoading={isLoadingModules} />
        )}
        {activeTab === 'resources' && (
          <ResourcesTab skillId={skillId} resources={resources} isLoading={isLoadingResources} />
        )}
        {activeTab === 'labs' && (
          <HomeLabsTab skillId={skillId} labs={linkedLabs} isLoading={isLoadingLabs} />
        )}
        {activeTab === 'projects' && (
          <ProjectsTab skillId={skillId} projects={linkedProjects} isLoading={isLoadingProjects} />
        )}
        {activeTab === 'interview' && (
          <InterviewPrepTab skillId={skillId} questions={linkedInterviewQuestions} isLoading={isLoadingInterview} />
        )}
        {activeTab === 'study' && (
          <StudySessionsTab skillId={skillId} />
        )}
        {activeTab === 'experience' && (
          <ExperienceLogTab skillId={skillId} entries={experienceLog} isLoading={isLoadingExperienceLog} />
        )}
        {activeTab === 'certifications' && (
          <CertificationsTab skillId={skillId} certifications={linkedCertifications} isLoading={isLoadingCerts} />
        )}
        {activeTab === 'videos' && (
          <VideosTab videos={linkedVideos} isLoading={isLoadingVideos} />
        )}
        {activeTab === 'quiz' && (
          <QuizTab skillId={skillId} questions={quizQuestions} stats={quizStats} isLoading={isLoadingQuiz} />
        )}
        {activeTab === 'related' && (
          <RelatedSkillsTab skills={relatedSkills} isLoading={isLoadingRelated} />
        )}
      </div>
    </div>
  )
}
