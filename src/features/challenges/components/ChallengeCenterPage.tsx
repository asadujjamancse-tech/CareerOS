import { useEffect, useState } from 'react'
import {
  Zap, Trophy, Flame, Star, CheckCircle2, Circle,
  Plus, RefreshCw, Target, Award, Clock, BarChart2,
} from 'lucide-react'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { EmptyState } from '@shared/components/common/EmptyState'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { Label } from '@shared/components/ui/label'
import { useChallengesStore } from '../store/challenges.store'
import type { Challenge } from '../types/challenges.types'
import { cn } from '@shared/lib/utils'

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   variant: 'success'     as const, color: 'text-green-400' },
  medium: { label: 'Medium', variant: 'warning'     as const, color: 'text-amber-400' },
  hard:   { label: 'Hard',   variant: 'destructive' as const, color: 'text-red-400' },
  expert: { label: 'Expert', variant: 'destructive' as const, color: 'text-purple-400' },
}

const TYPE_ICONS = {
  daily:   <Zap className="h-4 w-4 text-amber-400" />,
  weekly:  <Target className="h-4 w-4 text-blue-400" />,
  lab:     <Award className="h-4 w-4 text-green-400" />,
  project: <Star className="h-4 w-4 text-purple-400" />,
  custom:  <Plus className="h-4 w-4 text-muted-foreground" />,
}

// ── Challenge Card ─────────────────────────────────────────────────────────────

function ChallengeCard({ challenge, onStart, onComplete }: {
  challenge: Challenge
  onStart: () => void
  onComplete: () => void
}) {
  const diffCfg = DIFFICULTY_CONFIG[challenge.difficulty]
  const isCompleted = challenge.completion_status === 'completed'
  const isStarted = !!challenge.completion_status
  const progress = challenge.completion_progress ?? 0
  const progressPct = challenge.target_count > 0 ? Math.round((progress / challenge.target_count) * 100) : 0

  return (
    <div className={cn(
      'rounded-xl border bg-card p-5 transition-all',
      isCompleted ? 'border-green-500/40 bg-green-500/5' : 'border-border hover:border-zinc-500'
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {TYPE_ICONS[challenge.type]}
          <div>
            <h3 className={cn('font-semibold text-sm', isCompleted && 'line-through text-muted-foreground')}>{challenge.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant={diffCfg.variant} className="text-[10px] py-0">{diffCfg.label}</Badge>
              {challenge.category && <span className="text-xs text-muted-foreground">{challenge.category}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
            <span className="text-xs font-bold">{challenge.xp_reward} XP</span>
          </div>
          {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-400" />}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{challenge.description}</p>

      {isStarted && !isCompleted && challenge.target_count > 1 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span><span>{progress}/{challenge.target_count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {!isCompleted && (
        <div className="flex gap-2">
          {!isStarted ? (
            <Button size="sm" onClick={onStart} className="gap-1.5 flex-1">
              <Circle className="h-3.5 w-3.5" />Start
            </Button>
          ) : (
            <Button size="sm" onClick={onComplete} className="gap-1.5 flex-1 bg-green-500 hover:bg-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />Mark Complete
            </Button>
          )}
        </div>
      )}

      {isCompleted && challenge.completed_at && (
        <p className="text-xs text-green-400 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Completed {new Date(challenge.completed_at).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar() {
  const { stats } = useChallengesStore()
  if (!stats) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {[
        { icon: Trophy, label: 'Total XP', value: stats.total_xp_earned.toLocaleString(), color: 'text-amber-400' },
        { icon: CheckCircle2, label: 'Completed', value: stats.completed, color: 'text-green-400' },
        { icon: Clock, label: 'In Progress', value: stats.in_progress, color: 'text-blue-400' },
        { icon: Flame, label: 'Streak', value: `${stats.streak_days}d`, color: 'text-orange-400' },
        { icon: BarChart2, label: 'Total', value: stats.total_challenges, color: 'text-muted-foreground' },
      ].map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-3 flex items-center gap-2.5">
          <Icon className={cn('h-4 w-4 shrink-0', color)} />
          <div>
            <p className="text-lg font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Create Custom Challenge Dialog ────────────────────────────────────────────

function CreateChallengeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createCustom } = useChallengesStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [xp, setXp] = useState('100')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return
    setIsSubmitting(true)
    await createCustom({ title, description, ...(category ? { category } : {}), xp_reward: parseInt(xp) || 100, type: 'custom' })
    setIsSubmitting(false)
    setTitle(''); setDescription(''); setCategory(''); setXp('100')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Custom Challenge</DialogTitle>
          <DialogDescription>Set your own learning challenge with a specific goal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Set up a Home Lab Active Directory" />
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-destructive">*</span></Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe what needs to be done to complete this challenge…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Networking" />
            </div>
            <div className="space-y-1.5">
              <Label>XP Reward</Label>
              <Input type="number" value={xp} onChange={e => setXp(e.target.value)} min={10} max={1000} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? 'Creating…' : 'Create Challenge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ChallengeCenterPage() {
  const {
    todayChallenges, weekChallenges, isLoading,
    fetchToday, fetchWeek, fetchStats, generateDaily, generateWeekly,
    startChallenge, completeChallenge, generatingDaily,
  } = useChallengesStore()

  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    void fetchToday()
    void fetchWeek()
    void fetchStats()
  }, [fetchToday, fetchWeek, fetchStats])

  return (
    <>
      <PageLayout
        title="Challenge Center"
        description="Daily and weekly challenges to keep your learning momentum going. Earn XP as you grow."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void generateDaily()} disabled={generatingDaily} className="gap-1.5">
              <RefreshCw className={cn('h-3.5 w-3.5', generatingDaily && 'animate-spin')} />
              {generatingDaily ? 'Generating…' : 'Generate Daily'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void generateWeekly()} className="gap-1.5">
              <Target className="h-3.5 w-3.5" />Weekly Challenge
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />Custom Challenge
            </Button>
          </div>
        }
      >
        <StatsBar />

        {isLoading ? <PageLoader /> : (
          <Tabs defaultValue="today">
            <TabsList>
              <TabsTrigger value="today">Today ({todayChallenges.length})</TabsTrigger>
              <TabsTrigger value="week">This Week ({weekChallenges.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-4">
              {todayChallenges.length === 0 ? (
                <EmptyState
                  icon={Zap}
                  title="No challenges yet today"
                  description="Generate your daily challenges to get started with today's learning goals."
                  action={
                    <Button onClick={() => void generateDaily()} disabled={generatingDaily} className="gap-1.5">
                      <RefreshCw className={cn('h-4 w-4', generatingDaily && 'animate-spin')} />
                      Generate Daily Challenges
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todayChallenges.map(c => (
                      <ChallengeCard
                        key={c.id}
                        challenge={c}
                        onStart={() => void startChallenge(c.id)}
                        onComplete={() => void completeChallenge(c.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="week" className="mt-4">
              {weekChallenges.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No weekly challenges yet"
                  description="Generate a weekly challenge to set a bigger learning goal for the week."
                  action={<Button onClick={() => void generateWeekly()} className="gap-1.5"><Target className="h-4 w-4" />Generate Weekly</Button>}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weekChallenges.map(c => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      onStart={() => void startChallenge(c.id)}
                      onComplete={() => void completeChallenge(c.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </PageLayout>

      <CreateChallengeDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
