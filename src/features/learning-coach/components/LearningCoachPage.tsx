import { useEffect } from 'react'
import { GraduationCap, BookOpen, Sliders, Brain, BarChart2, CalendarDays, GitBranch } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { useLearningCoachStore } from '../store/learning-coach.store'
import { LearningPathsTab } from './LearningPathsTab'
import { MethodRecommendationsTab } from './MethodRecommendationsTab'
import { RetentionSystemTab } from './RetentionSystemTab'
import { EffectivenessTab } from './EffectivenessTab'
import { StudyPlannerTab } from './StudyPlannerTab'
import { DependencyGraphTab } from './DependencyGraphTab'

export function LearningCoachPage() {
  const {
    paths, dueReviews, studyPlans, effectiveness,
    fetchPaths, fetchMethodConfigs, fetchRetention, fetchDueReviews,
    fetchStudyPlans, fetchDependencies, fetchDependencyGraph, fetchEffectiveness,
  } = useLearningCoachStore()

  useEffect(() => {
    void fetchPaths()
    void fetchMethodConfigs()
    void fetchRetention()
    void fetchDueReviews()
    void fetchStudyPlans()
    void fetchDependencies()
    void fetchDependencyGraph()
    void fetchEffectiveness()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activePlans = studyPlans.filter(p => p.is_active === 1 && p.progress_pct < 100)

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between shrink-0">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Smart Learning Coach</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Your personal learning strategist — what to learn, how, when to review, and when you're ready</p>
          </div>
        </div>

        {/* Live stats */}
        <div className="flex items-center gap-3">
          {dueReviews.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Brain className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-500">{dueReviews.length} review{dueReviews.length !== 1 ? 's' : ''} due</span>
            </div>
          )}
          {activePlans.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">{activePlans.length} active plan{activePlans.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {paths.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{paths.length} path{paths.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {effectiveness && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50">
              <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{Math.round((effectiveness.total_study_minutes + effectiveness.total_lab_minutes) / 60)}h learned</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="paths" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="shrink-0 grid grid-cols-6 w-full">
          <TabsTrigger value="paths" className="flex items-center gap-1.5 text-xs">
            <BookOpen className="w-3.5 h-3.5" />Learning Paths
          </TabsTrigger>
          <TabsTrigger value="methods" className="flex items-center gap-1.5 text-xs">
            <Sliders className="w-3.5 h-3.5" />Methods
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-1.5 text-xs relative">
            <Brain className="w-3.5 h-3.5" />Retention
            {dueReviews.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold leading-none">
                {dueReviews.length > 9 ? '9+' : dueReviews.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="effectiveness" className="flex items-center gap-1.5 text-xs">
            <BarChart2 className="w-3.5 h-3.5" />Effectiveness
          </TabsTrigger>
          <TabsTrigger value="planner" className="flex items-center gap-1.5 text-xs">
            <CalendarDays className="w-3.5 h-3.5" />Planner
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="flex items-center gap-1.5 text-xs">
            <GitBranch className="w-3.5 h-3.5" />Dependencies
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden mt-4">
          <TabsContent value="paths" className="h-full m-0 overflow-hidden">
            <LearningPathsTab />
          </TabsContent>
          <TabsContent value="methods" className="h-full m-0 overflow-y-auto">
            <MethodRecommendationsTab />
          </TabsContent>
          <TabsContent value="retention" className="h-full m-0 overflow-hidden">
            <RetentionSystemTab />
          </TabsContent>
          <TabsContent value="effectiveness" className="h-full m-0 overflow-y-auto">
            <EffectivenessTab />
          </TabsContent>
          <TabsContent value="planner" className="h-full m-0 overflow-hidden">
            <StudyPlannerTab />
          </TabsContent>
          <TabsContent value="dependencies" className="h-full m-0 overflow-hidden">
            <DependencyGraphTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
