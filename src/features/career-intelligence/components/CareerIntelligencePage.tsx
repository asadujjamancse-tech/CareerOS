import { useEffect, useState } from 'react'
import { Brain, Map, TrendingUp, Sparkles, Network, BarChart3 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs'
import { useCareerIntelligenceStore } from '../store/career-intelligence.store'
import { RoadmapsTab } from './RoadmapsTab'
import { SkillProgressTab } from './SkillProgressTab'
import { AICoachTab } from './AICoachTab'
import { KnowledgeGraphTab } from './KnowledgeGraphTab'
import { AnalyticsTab } from './AnalyticsTab'

const TABS = [
  { id: 'roadmaps',   label: 'Career Roadmaps', icon: Map          },
  { id: 'skills',     label: 'Skill Progress',  icon: TrendingUp   },
  { id: 'coach',      label: 'AI Coach',        icon: Sparkles     },
  { id: 'graph',      label: 'Knowledge Graph', icon: Network      },
  { id: 'analytics',  label: 'Analytics',       icon: BarChart3    },
]

export function CareerIntelligencePage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState('roadmaps')
  const fetchRoadmaps = useCareerIntelligenceStore(s => s.fetchRoadmaps)
  const fetchSkillProgress = useCareerIntelligenceStore(s => s.fetchSkillProgress)
  const fetchAnalytics = useCareerIntelligenceStore(s => s.fetchAnalytics)
  const analytics = useCareerIntelligenceStore(s => s.analytics)

  useEffect(() => {
    void fetchRoadmaps()
    void fetchSkillProgress()
    void fetchAnalytics()
  }, [fetchRoadmaps, fetchSkillProgress, fetchAnalytics])

  const readinessScore = useCareerIntelligenceStore(s => s.recommendations?.job_readiness_score)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-background to-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Career Intelligence Center</h1>
              <p className="text-sm text-muted-foreground">Track progress, plan your path, and reach your career goals</p>
            </div>
          </div>

          {/* Quick stats bar */}
          {analytics && (
            <div className="flex items-center gap-6 text-sm">
              <StatPill label="Skills" value={analytics.totals.skills} />
              <StatPill label="Projects" value={analytics.totals.projects} />
              <StatPill label="Certifications" value={analytics.totals.certifications} />
              {readinessScore !== undefined && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="font-semibold text-primary">{readinessScore}%</span>
                  <span className="text-muted-foreground">ready</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4 border-b border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto p-1 bg-muted/50 gap-1">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-4 py-2 text-sm"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Panels */}
          <div className="flex-1 overflow-hidden">
            <TabsContent value="roadmaps" className="m-0 mt-0 h-full">
              <RoadmapsTab />
            </TabsContent>
            <TabsContent value="skills" className="m-0 mt-0 h-full">
              <SkillProgressTab />
            </TabsContent>
            <TabsContent value="coach" className="m-0 mt-0 h-full">
              <AICoachTab />
            </TabsContent>
            <TabsContent value="graph" className="m-0 mt-0 h-full">
              <KnowledgeGraphTab />
            </TabsContent>
            <TabsContent value="analytics" className="m-0 mt-0 h-full">
              <AnalyticsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number }): React.ReactElement {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
