import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Brain, RotateCcw, Zap, Plus, Trash2, Edit2,
  TrendingUp, Target, Star, ChevronRight, ChevronLeft,
  Flame, Award, Clock, CheckCircle2, XCircle, Eye, EyeOff,
  Lightbulb, RefreshCw,
} from 'lucide-react'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { EmptyState } from '@shared/components/common/EmptyState'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { Label } from '@shared/components/ui/label'
import { Badge } from '@shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@shared/components/ui/sheet'
import { useLearningSystemStore } from '../store/learning-system.store'
import type { FeynmanEntry, SrsCard } from '../types/learning-system.types'
import { cn } from '@shared/lib/utils'

// ── Rating Button Configs ────────────────────────────────────────────────────

const RATING_CONFIG = [
  { rating: 0, label: 'Blackout', color: 'text-red-500 border-red-500 hover:bg-red-500/10', desc: 'Complete blank' },
  { rating: 1, label: 'Wrong', color: 'text-orange-500 border-orange-500 hover:bg-orange-500/10', desc: 'Remembered hint' },
  { rating: 2, label: 'Hard', color: 'text-yellow-500 border-yellow-500 hover:bg-yellow-500/10', desc: 'Struggled badly' },
  { rating: 3, label: 'Okay', color: 'text-blue-400 border-blue-400 hover:bg-blue-400/10', desc: 'Some hesitation' },
  { rating: 4, label: 'Good', color: 'text-green-500 border-green-500 hover:bg-green-500/10', desc: 'Recalled well' },
  { rating: 5, label: 'Perfect', color: 'text-emerald-400 border-emerald-400 hover:bg-emerald-400/10', desc: 'Instant recall' },
]

// ── Stats Dashboard ───────────────────────────────────────────────────────────

function StatsDashboard() {
  const { stats, fetchStats, fetchDueCards, startReviewSession, startActiveRecall, setMode, bulkFromInterview, bulkFromNotes } = useLearningSystemStore()
  const [bulkMsg, setBulkMsg] = useState<string | null>(null)

  const handleBulkImport = async (type: 'interview' | 'notes') => {
    const result = type === 'interview' ? await bulkFromInterview() : await bulkFromNotes()
    setBulkMsg(`Created ${result.created} new SRS cards from ${type === 'interview' ? 'interview questions' : 'notes'}.`)
    setTimeout(() => setBulkMsg(null), 4000)
  }

  if (!stats) return <PageLoader />

  const dueCount = stats.due_today + stats.due_overdue
  const retentionPct = Math.round(stats.avg_retention * 100)

  return (
    <div className="space-y-6">
      {bulkMsg && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{bulkMsg}
        </div>
      )}

      {/* Hero stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">{dueCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Cards Due</p>
          {stats.due_overdue > 0 && <p className="text-xs text-red-400 mt-0.5">{stats.due_overdue} overdue</p>}
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-primary">{retentionPct}%</p>
          <p className="text-xs text-muted-foreground mt-1">Retention</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{stats.mastered}</p>
          <p className="text-xs text-muted-foreground mt-1">Mastered</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <Flame className="h-5 w-5 text-orange-400" />
            <p className="text-3xl font-bold">{stats.streak_days}</p>
          </div>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={dueCount > 0 ? startReviewSession : undefined}
          disabled={dueCount === 0}
          className={cn(
            'rounded-xl border p-6 text-left transition-all group',
            dueCount > 0
              ? 'border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 cursor-pointer'
              : 'border-border bg-card opacity-50 cursor-not-allowed'
          )}
        >
          <RotateCcw className="h-8 w-8 text-primary mb-3 group-hover:rotate-180 transition-transform duration-500" />
          <h3 className="font-semibold">Daily Review</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {dueCount > 0 ? `Review ${dueCount} due cards with SM-2 algorithm` : 'No cards due today — great work!'}
          </p>
          {dueCount > 0 && <Badge variant="secondary" className="mt-3 text-xs">{dueCount} cards</Badge>}
        </button>

        <button
          type="button"
          onClick={dueCount > 0 ? startActiveRecall : undefined}
          disabled={dueCount === 0}
          className={cn(
            'rounded-xl border p-6 text-left transition-all group',
            dueCount > 0
              ? 'border-blue-500/40 hover:border-blue-500 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer'
              : 'border-border bg-card opacity-50 cursor-not-allowed'
          )}
        >
          <Zap className="h-8 w-8 text-blue-400 mb-3" />
          <h3 className="font-semibold">Active Recall</h3>
          <p className="text-sm text-muted-foreground mt-1">Test yourself without hints — force your brain to retrieve</p>
          {dueCount > 0 && <Badge variant="secondary" className="mt-3 text-xs">{dueCount} cards</Badge>}
        </button>

        <button
          type="button"
          onClick={() => setMode('feynman')}
          className="rounded-xl border border-purple-500/40 hover:border-purple-500 bg-purple-500/5 hover:bg-purple-500/10 p-6 text-left transition-all cursor-pointer group"
        >
          <Lightbulb className="h-8 w-8 text-purple-400 mb-3" />
          <h3 className="font-semibold">Feynman Mode</h3>
          <p className="text-sm text-muted-foreground mt-1">Explain it simply — if you can&apos;t explain it, you don&apos;t know it</p>
        </button>
      </div>

      {/* Detail stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Cards', value: stats.total_cards, icon: Brain },
          { label: 'Learning', value: stats.learning, icon: TrendingUp },
          { label: 'Reviews Today', value: stats.reviews_today, icon: Target },
          { label: 'This Week', value: stats.reviews_this_week, icon: Award },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-3 flex items-center gap-3">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-lg font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Import buttons */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-medium text-sm mb-3">Import Cards from Existing Content</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void handleBulkImport('interview')} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />Import from Interview Bank
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleBulkImport('notes')} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />Import from Notes
          </Button>
          <Button variant="outline" size="sm" onClick={() => { void fetchStats(); void fetchDueCards() }} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── SRS Review Mode ───────────────────────────────────────────────────────────

function ReviewMode() {
  const { reviewSession, revealCard, rateCard, skipCard, endSession } = useLearningSystemStore()

  if (!reviewSession) return null

  const { cards, currentIndex, revealed } = reviewSession
  const card = cards[currentIndex]
  if (!card) return null

  const progress = ((currentIndex) / cards.length) * 100
  const remaining = cards.length - currentIndex

  return (
    <div className="flex flex-col h-full gap-4 py-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={endSession} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />End Session
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium">{currentIndex + 1} of {cards.length}</p>
          <p className="text-xs text-muted-foreground">{remaining - 1} remaining</p>
        </div>
        <Button variant="ghost" size="sm" onClick={skipCard} className="gap-1 text-muted-foreground">
          Skip<ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Card */}
      <div
        className={cn(
          'flex-1 rounded-2xl border bg-card p-8 flex flex-col items-center justify-center min-h-[300px] transition-all',
          !revealed ? 'border-border cursor-pointer hover:border-primary/50' : 'border-primary/40'
        )}
        onClick={!revealed ? revealCard : undefined}
      >
        <div className="w-full text-center space-y-4 max-w-xl">
          <Badge variant="outline" className="text-xs">{card.entity_type.replace('_', ' ')}</Badge>
          <p className="text-lg font-medium leading-relaxed">{card.front}</p>

          {!revealed ? (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <EyeOff className="h-4 w-4" />
                <span className="text-sm">Answer hidden — click to reveal</span>
              </div>
              <Button onClick={revealCard} variant="outline" size="sm" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" />Reveal Answer
              </Button>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Answer:</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{card.back}</p>
            </div>
          )}
        </div>
      </div>

      {/* Rating buttons */}
      {revealed && (
        <div className="space-y-2">
          <p className="text-xs text-center text-muted-foreground uppercase tracking-wide">How well did you recall this?</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {RATING_CONFIG.map(({ rating, label, color, desc }) => (
              <button
                key={rating}
                type="button"
                onClick={() => void rateCard(rating)}
                className={cn(
                  'rounded-lg border p-2 text-center transition-colors',
                  color
                )}
              >
                <p className="text-sm font-bold">{rating}</p>
                <p className="text-xs font-medium">{label}</p>
                <p className="text-[10px] text-muted-foreground hidden sm:block">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SM-2 info */}
      <div className="text-xs text-muted-foreground text-center">
        <span>Ease: {card.ease_factor.toFixed(2)}</span>
        <span className="mx-2">·</span>
        <span>Interval: {card.interval_days}d</span>
        <span className="mx-2">·</span>
        <span>Reps: {card.repetitions}</span>
      </div>
    </div>
  )
}

// ── Active Recall Mode ────────────────────────────────────────────────────────

function ActiveRecallMode() {
  const { recallCards, recallIndex, recallRevealed, revealRecall, rateRecall, nextRecall, setMode } = useLearningSystemStore()

  if (recallCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">No cards available for Active Recall.</p>
        <Button onClick={() => setMode('dashboard')}>Back</Button>
      </div>
    )
  }

  const card = recallCards[recallIndex]
  if (!card) return null

  const progress = ((recallIndex + 1) / recallCards.length) * 100

  return (
    <div className="flex flex-col h-full gap-4 py-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setMode('dashboard')}>
          <ChevronLeft className="h-4 w-4" />Exit
        </Button>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-400">Active Recall</span>
        </div>
        <span className="text-sm text-muted-foreground">{recallIndex + 1}/{recallCards.length}</span>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 rounded-2xl border border-blue-500/30 bg-card p-8 flex flex-col items-center justify-center min-h-[280px]">
        <div className="w-full text-center space-y-4 max-w-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Recall this:</p>
          <p className="text-xl font-medium leading-relaxed">{card.front}</p>

          {!recallRevealed ? (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-muted-foreground italic">Try to recall the full answer before revealing</p>
              <Button onClick={revealRecall} className="gap-1.5">
                <Eye className="h-4 w-4" />I&apos;ve Recalled It
              </Button>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-blue-500/20 text-left">
              <p className="text-xs font-medium text-muted-foreground mb-2">Correct Answer:</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{card.back}</p>
            </div>
          )}
        </div>
      </div>

      {recallRevealed && (
        <div className="space-y-2">
          <p className="text-xs text-center text-muted-foreground">How accurate was your recall?</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => void rateRecall(1)} className="gap-1.5 border-red-500/40 hover:bg-red-500/10 text-red-400">
              <XCircle className="h-4 w-4" />Wrong
            </Button>
            <Button variant="outline" onClick={() => void rateRecall(3)} className="gap-1.5 border-amber-500/40 hover:bg-amber-500/10 text-amber-400">
              <Clock className="h-4 w-4" />Partial
            </Button>
            <Button variant="outline" onClick={() => void rateRecall(5)} className="gap-1.5 border-green-500/40 hover:bg-green-500/10 text-green-400">
              <CheckCircle2 className="h-4 w-4" />Perfect
            </Button>
          </div>
        </div>
      )}

      {!recallRevealed && (
        <Button variant="ghost" size="sm" onClick={nextRecall} className="text-xs text-muted-foreground">
          Skip this card
        </Button>
      )}
    </div>
  )
}

// ── Feynman Mode ──────────────────────────────────────────────────────────────

const feynmanSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  explanation: z.string().min(10, 'Write at least a few sentences'),
  gaps_identified: z.string().optional(),
  understanding_score: z.coerce.number().min(0).max(10),
})
type FeynmanForm = z.infer<typeof feynmanSchema>

function FeynmanEntryCard({ entry, onEdit, onDelete }: { entry: FeynmanEntry; onEdit: () => void; onDelete: () => void }) {
  const scoreColor = entry.understanding_score >= 8 ? 'text-green-400' : entry.understanding_score >= 5 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="group rounded-lg border border-border bg-card p-4 hover:border-purple-500/40 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-medium text-sm">{entry.topic}</h3>
          {entry.entity_type && <p className="text-xs text-muted-foreground mt-0.5">Linked: {entry.entity_type}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-sm" onClick={onEdit}><Edit2 /></Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete} className="hover:text-destructive"><Trash2 /></Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">{entry.explanation}</p>
      {entry.gaps_identified && (
        <div className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 mb-2">
          <p className="text-xs text-amber-400"><span className="font-medium">Gaps: </span>{entry.gaps_identified}</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className={cn('text-2xl font-bold tabular-nums', scoreColor)}>{entry.understanding_score}<span className="text-xs text-muted-foreground">/10</span></span>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className={cn('h-2 w-2 rounded-sm', i < entry.understanding_score ? (scoreColor.replace('text-', 'bg-')) : 'bg-muted')} />
          ))}
        </div>
      </div>
    </div>
  )
}

function FeynmanMode() {
  const { feynmanEntries, feynmanFormOpen, editingFeynmanId, openFeynmanForm, closeFeynmanForm, submitFeynman, deleteFeynman, setMode } = useLearningSystemStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const editing = editingFeynmanId ? feynmanEntries.find(e => e.id === editingFeynmanId) : null

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FeynmanForm>({
    resolver: zodResolver(feynmanSchema),
    defaultValues: { topic: '', explanation: '', gaps_identified: '', understanding_score: 5 },
  })

  useEffect(() => {
    if (editing) {
      reset({
        topic: editing.topic,
        explanation: editing.explanation,
        gaps_identified: editing.gaps_identified ?? '',
        understanding_score: editing.understanding_score,
      })
    } else {
      reset({ topic: '', explanation: '', gaps_identified: '', understanding_score: 5 })
    }
  }, [editing, reset])

  const onSubmit = async (data: FeynmanForm) => {
    await submitFeynman({ ...data, gaps_identified: data.gaps_identified || null })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMode('dashboard')} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />Back
          </Button>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-400" />
            <h2 className="font-semibold">Feynman Learning</h2>
          </div>
        </div>
        <Button size="sm" onClick={() => openFeynmanForm()} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />New Explanation
        </Button>
      </div>

      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
        <p className="text-sm text-purple-300">
          <span className="font-semibold">The Feynman Technique:</span> Explain the concept as if teaching a 12-year-old.
          Identify gaps in your understanding. Simplify and use analogies. If you can&apos;t explain it simply, you don&apos;t fully understand it.
        </p>
      </div>

      {feynmanEntries.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No Feynman explanations yet"
          description="Pick a topic you're learning and explain it in simple language."
          action={<Button onClick={() => openFeynmanForm()} className="gap-1.5"><Plus />Write your first explanation</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {feynmanEntries.map(entry => (
            <FeynmanEntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => openFeynmanForm(entry.id)}
              onDelete={() => setDeletingId(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Form Sheet */}
      <Sheet open={feynmanFormOpen} onOpenChange={o => { if (!o) closeFeynmanForm() }}>
        <SheetContent side="right" className="w-[560px] max-w-full">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Explanation' : 'New Feynman Explanation'}</SheetTitle>
            <SheetDescription>Explain the concept simply. What are your gaps?</SheetDescription>
          </SheetHeader>
          <SheetBody>
            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <form id="feynman-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Topic <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. DNS Resolution Process" {...register('topic')} />
                {errors.topic?.message && <p className="text-xs text-destructive">{errors.topic.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Explain it simply <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">Imagine explaining to someone with no technical background. Use analogies.</p>
                <Textarea rows={8} placeholder="DNS is like the phone book of the internet. When you type a website address, DNS looks up the actual IP address (like a phone number) so your computer knows where to go..." {...register('explanation')} />
                {errors.explanation?.message && <p className="text-xs text-destructive">{errors.explanation.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Gaps Identified</Label>
                <p className="text-xs text-muted-foreground">What parts were you unsure about or need to study more?</p>
                <Textarea rows={3} placeholder="I'm not clear on how DNS caching works, and I need to understand TTL values better..." {...register('gaps_identified')} />
              </div>

              <div className="space-y-1.5">
                <Label>Understanding Score (0–10)</Label>
                <Input type="number" min={0} max={10} {...register('understanding_score')} />
                <p className="text-xs text-muted-foreground">0 = confused, 10 = could teach it confidently</p>
              </div>
            </form>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={closeFeynmanForm} type="button">Cancel</Button>
            <Button form="feynman-form" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editing ? 'Update' : 'Save'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete dialog */}
      <Dialog open={!!deletingId} onOpenChange={o => { if (!o) setDeletingId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete explanation?</DialogTitle>
            <DialogDescription>This will permanently delete this Feynman entry.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (deletingId) { void deleteFeynman(deletingId).then(() => setDeletingId(null)) }
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Card Manager Tab ──────────────────────────────────────────────────────────

function CardManager() {
  const { allCards, fetchAllCards, deleteCard } = useLearningSystemStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { void fetchAllCards() }, [fetchAllCards])

  const grouped = allCards.reduce<Record<string, SrsCard[]>>((acc, card) => {
    const key = card.entity_type
    if (!acc[key]) acc[key] = []
    acc[key].push(card)
    return acc
  }, {})

  if (allCards.length === 0) {
    return (
      <EmptyState
        icon={Brain}
        title="No SRS cards yet"
        description="Import from your Interview Bank or Notes to get started, or create cards manually."
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{allCards.length} total cards across {Object.keys(grouped).length} categories</p>
      {Object.entries(grouped).map(([type, cards]) => (
        <div key={type}>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {type.replace('_', ' ')} ({cards.length})
          </h3>
          <div className="space-y-1.5">
            {cards.map(card => (
              <div key={card.id} className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5 hover:border-zinc-600">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{card.front}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">Due: {card.due_date}</span>
                    <span className="text-xs text-muted-foreground">Interval: {card.interval_days}d</span>
                    <span className="text-xs text-muted-foreground">Reps: {card.repetitions}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={cn('h-2.5 w-2.5', i < Math.round(card.retention_score * 5) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')} />
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setDeletingId(card.id)} className="opacity-0 group-hover:opacity-100 hover:text-destructive">
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={!!deletingId} onOpenChange={o => { if (!o) setDeletingId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete card?</DialogTitle>
            <DialogDescription>This SRS card and its review history will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (deletingId) { void deleteCard(deletingId).then(() => setDeletingId(null)) }
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function LearningSystemPage() {
  const { mode, isLoading, fetchStats, fetchDueCards, fetchFeynmanEntries, setMode } = useLearningSystemStore()

  useEffect(() => {
    void fetchStats()
    void fetchDueCards()
    void fetchFeynmanEntries()
  }, [fetchStats, fetchDueCards, fetchFeynmanEntries])

  if (mode === 'review') {
    return (
      <div className="flex flex-col h-full p-6">
        <ReviewMode />
      </div>
    )
  }

  if (mode === 'active-recall') {
    return (
      <div className="flex flex-col h-full p-6">
        <ActiveRecallMode />
      </div>
    )
  }

  if (mode === 'feynman') {
    return (
      <div className="p-6">
        <FeynmanMode />
      </div>
    )
  }

  return (
    <PageLayout
      title="Learning System"
      description="Spaced Repetition · Active Recall · Feynman Technique — your complete learning engine."
      actions={
        <Button variant="outline" size="sm" onClick={() => setMode('feynman')} className="gap-1.5">
          <Lightbulb className="h-3.5 w-3.5" />Feynman Mode
        </Button>
      }
    >
      {isLoading ? <PageLoader /> : (
        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="cards">Card Manager</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-4">
            <StatsDashboard />
          </TabsContent>
          <TabsContent value="cards" className="mt-4">
            <CardManager />
          </TabsContent>
        </Tabs>
      )}
    </PageLayout>
  )
}
