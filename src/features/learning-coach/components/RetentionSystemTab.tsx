import { useState } from 'react'
import { Brain, Clock, Star, AlertCircle, CheckCircle2, RotateCcw, Plus } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Badge } from '@shared/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/components/ui/dialog'
import { Textarea } from '@shared/components/ui/textarea'
import { Label } from '@shared/components/ui/label'
import { useLearningCoachStore } from '../store/learning-coach.store'
import type { RetentionRecord } from '../types/learning-coach.types'

function RetentionScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : score >= 40 ? '#F97316' : '#EF4444'
  const label = score >= 80 ? 'Strong' : score >= 60 ? 'Good' : score >= 40 ? 'Fading' : 'Weak'
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: color }}>
      <Star className="w-3 h-3" />{score}% {label}
    </span>
  )
}

function ForgettingCurveBar({ intervalDays, retentionScore }: { intervalDays: number; retentionScore: number }) {
  const maxInterval = 120
  const widthPct = Math.min((intervalDays / maxInterval) * 100, 100)
  const color = retentionScore >= 80 ? '#22C55E' : retentionScore >= 60 ? '#F59E0B' : retentionScore >= 40 ? '#F97316' : '#EF4444'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Review interval</span>
        <span className="font-medium text-foreground">{intervalDays}d</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${widthPct}%`, background: color }} />
      </div>
    </div>
  )
}

function ReviewCard({ record, isDue, onReview }: { record: RetentionRecord; isDue: boolean; onReview: (r: RetentionRecord) => void }) {
  const today = new Date().toISOString().split('T')[0]!
  const daysUntilReview = Math.max(0, Math.round((new Date(record.next_review_at).getTime() - new Date(today).getTime()) / 86400000))

  return (
    <div className={`rounded-xl border p-4 transition-colors ${isDue ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-card'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{record.skill_name}</h3>
            {isDue && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground capitalize">{record.category_name}</span>
            <RetentionScoreBadge score={record.retention_score} />
          </div>
        </div>
        <Button size="sm" variant={isDue ? 'default' : 'outline'} onClick={() => onReview(record)} className="shrink-0">
          {isDue ? <><AlertCircle className="w-3.5 h-3.5 mr-1.5" />Review Now</> : <><RotateCcw className="w-3.5 h-3.5 mr-1.5" />Review</>}
        </Button>
      </div>

      <ForgettingCurveBar intervalDays={record.interval_days} retentionScore={record.retention_score} />

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-center">
        <div className="bg-muted/30 rounded p-1.5">
          <div className="font-medium text-foreground">{record.repetitions}</div>
          <div className="text-muted-foreground">Reviews</div>
        </div>
        <div className="bg-muted/30 rounded p-1.5">
          <div className="font-medium text-foreground">{record.ease_factor.toFixed(1)}</div>
          <div className="text-muted-foreground">Ease</div>
        </div>
        <div className={`rounded p-1.5 ${isDue ? 'bg-amber-500/10' : 'bg-muted/30'}`}>
          <div className={`font-medium ${isDue ? 'text-amber-500' : 'text-foreground'}`}>
            {isDue ? 'Today!' : `+${daysUntilReview}d`}
          </div>
          <div className="text-muted-foreground">Next</div>
        </div>
      </div>

      {record.last_reviewed_at && (
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />Last reviewed: {new Date(record.last_reviewed_at).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}

function ReviewDialog({ record, open, onClose, onRate }: { record: RetentionRecord; open: boolean; onClose: () => void; onRate: (quality: number, notes: string) => void }) {
  const [quality, setQuality] = useState<number | null>(null)
  const [notes, setNotes] = useState('')

  const ratings = [
    { value: 0, label: 'Complete blackout', desc: 'No recall at all', color: '#EF4444' },
    { value: 1, label: 'Incorrect, familiar', desc: 'Wrong answer but recognised it', color: '#F97316' },
    { value: 2, label: 'Incorrect, easy recall', desc: 'Wrong but could see the answer', color: '#EAB308' },
    { value: 3, label: 'Correct with effort', desc: 'Got it right after serious thought', color: '#84CC16' },
    { value: 4, label: 'Correct, hesitant', desc: 'Got it right with some hesitation', color: '#22C55E' },
    { value: 5, label: 'Perfect recall', desc: 'Instant, correct, and confident', color: '#10B981' },
  ]

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Review: {record.skill_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted/30 rounded-lg text-sm text-center text-muted-foreground">
            Recall this skill from memory. Rate how well you remembered it.
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">How well did you recall this? (SM-2 scale)</Label>
            <div className="grid grid-cols-2 gap-2">
              {ratings.map(r => (
                <button key={r.value}
                  onClick={() => setQuality(r.value)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all ${quality === r.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                    <span className="font-medium text-foreground">{r.label}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {quality !== null && (
            <div className="p-3 bg-primary/5 rounded-lg text-xs">
              <div className="font-medium text-foreground mb-1">What this means:</div>
              <div className="text-muted-foreground">
                {quality >= 3
                  ? `Good recall! Your next review will be scheduled in ~${quality >= 4 ? 'several' : 'a few'} days.`
                  : 'Needs work. Review again tomorrow to reinforce this skill.'}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What did you struggle with? Key points to remember..." rows={2} className="mt-1" />
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={() => { if (quality !== null) { onRate(quality, notes); onClose() } }} disabled={quality === null} className="flex-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddSkillRetentionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Track Skill Retention</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          To add a skill to spaced repetition tracking, go to that skill's <strong>Skill Hub</strong> page and click "Track Retention".
          This connects your skill data to the SM-2 algorithm.
        </p>
        <Button onClick={onClose}>Got it</Button>
      </DialogContent>
    </Dialog>
  )
}

export function RetentionSystemTab() {
  const { retentionRecords, dueReviews, recordReview } = useLearningCoachStore()
  const [reviewRecord, setReviewRecord] = useState<RetentionRecord | null>(null)
  const [showAddInfo, setShowAddInfo] = useState(false)
  const [filter, setFilter] = useState<'all' | 'due' | 'strong'>('all')

  const dueSet = new Set(dueReviews.map(r => r.skill_id))

  const filtered = retentionRecords.filter(r => {
    if (filter === 'due') return dueSet.has(r.skill_id)
    if (filter === 'strong') return r.retention_score >= 70
    return true
  })

  const avgRetention = retentionRecords.length > 0
    ? Math.round(retentionRecords.reduce((s, r) => s + r.retention_score, 0) / retentionRecords.length)
    : 0

  async function handleRate(quality: number, notes: string) {
    if (!reviewRecord) return
    await recordReview(reviewRecord.skill_id, quality, notes || undefined)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Brain Retention System</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Spaced repetition (SM-2 algorithm) to fight the forgetting curve</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAddInfo(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />Add Skill
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Tracked Skills', value: retentionRecords.length, color: 'text-foreground' },
          { label: 'Due Today', value: dueReviews.length, color: dueReviews.length > 0 ? 'text-amber-500' : 'text-foreground' },
          { label: 'Avg Retention', value: `${avgRetention}%`, color: avgRetention >= 70 ? 'text-emerald-500' : avgRetention >= 50 ? 'text-amber-500' : 'text-destructive' },
          { label: 'Strong Skills', value: retentionRecords.filter(r => r.retention_score >= 80).length, color: 'text-emerald-500' },
        ].map(s => (
          <div key={s.label} className="p-3 bg-muted/30 rounded-xl text-center">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'all' as const, label: `All (${retentionRecords.length})` },
          { value: 'due' as const, label: `Due (${dueReviews.length})` },
          { value: 'strong' as const, label: `Strong (${retentionRecords.filter(r => r.retention_score >= 70).length})` },
        ].map(f => (
          <button key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:text-foreground'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <Brain className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {filter === 'due' ? 'No skills due for review today!' : 'No skills tracked yet'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {filter === 'due' ? 'Come back tomorrow for your scheduled reviews.' : 'Visit Skill Hub and enable retention tracking for your skills.'}
          </p>
          {filter === 'due' && <Badge variant="outline" className="mt-3 text-emerald-500 border-emerald-500/30">All caught up ✓</Badge>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto flex-1">
          {filtered.map(r => (
            <ReviewCard key={r.skill_id} record={r} isDue={dueSet.has(r.skill_id)} onReview={setReviewRecord} />
          ))}
        </div>
      )}

      {reviewRecord && (
        <ReviewDialog
          record={reviewRecord}
          open={!!reviewRecord}
          onClose={() => setReviewRecord(null)}
          onRate={(quality, notes) => { void handleRate(quality, notes) }}
        />
      )}
      <AddSkillRetentionDialog open={showAddInfo} onClose={() => setShowAddInfo(false)} />
    </div>
  )
}
