import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  MessageSquare, Plus, Edit2, Trash2, X, Shuffle, BookOpen,
  ChevronLeft, ChevronRight, RotateCcw, Star, BarChart2,
} from 'lucide-react'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { EmptyState } from '@shared/components/common/EmptyState'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { SearchInput } from '@shared/components/common/SearchInput'
import { Pagination } from '@shared/components/common/Pagination'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { Label } from '@shared/components/ui/label'
import { Badge } from '@shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { Separator } from '@shared/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@shared/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { questionFormSchema, questionFormDefaults, type QuestionFormValues } from '../schemas/interview.schema'
import { useInterviewStore } from '../store/interview.store'
import type { InterviewDifficulty, InterviewQuestionWithMeta } from '@shared/types/entities'
import { cn } from '@shared/lib/utils'

const DIFFICULTY_CONFIG: Record<InterviewDifficulty, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  easy: { label: 'Easy', variant: 'success' },
  medium: { label: 'Medium', variant: 'warning' },
  hard: { label: 'Hard', variant: 'destructive' },
}

function MasteryStars({ score, max = 5, onChange }: { score: number; max?: number; onChange?: (s: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className={cn('transition-colors', onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default')}
        >
          <Star className={cn('h-3.5 w-3.5', i < score ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
        </button>
      ))}
    </div>
  )
}

// ── Question Card ─────────────────────────────────────────────────────────────

function QuestionCard({ q, onEdit, onDelete }: {
  q: InterviewQuestionWithMeta
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const diffCfg = DIFFICULTY_CONFIG[q.difficulty]

  return (
    <div className="group rounded-lg border border-border bg-card p-4 hover:border-zinc-600 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: q.category_color }} />
          <p className={cn('text-sm font-medium leading-relaxed', !expanded && 'line-clamp-2')}>{q.question}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(q.id)}><Edit2 /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(q.id)} className="hover:text-destructive"><Trash2 /></Button>
        </div>
      </div>

      {q.question.length > 100 && (
        <button type="button" onClick={() => setExpanded(!expanded)} className="text-xs text-primary mt-1 ml-4">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      <div className="flex items-center justify-between mt-3 ml-4">
        <div className="flex items-center gap-2">
          <Badge variant={diffCfg.variant} className="text-[10px]">{diffCfg.label}</Badge>
          <span className="text-xs text-muted-foreground">{q.category_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <MasteryStars score={q.mastery_score} />
          {q.review_count > 0 && <span className="text-xs text-muted-foreground">{q.review_count}x</span>}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 ml-4 space-y-2 border-t border-border pt-3">
          {q.personal_answer && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">My Answer</p>
              <p className="text-xs whitespace-pre-wrap">{q.personal_answer}</p>
            </div>
          )}
          {q.ideal_answer && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Ideal Answer</p>
              <p className="text-xs whitespace-pre-wrap text-muted-foreground">{q.ideal_answer}</p>
            </div>
          )}
          {q.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-xs whitespace-pre-wrap text-muted-foreground">{q.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Question Form ─────────────────────────────────────────────────────────────

function QuestionForm() {
  const { isFormOpen, editingId, detail, isSubmitting, formError, closeForm, submit, categories } = useInterviewStore()

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: questionFormDefaults,
  })

  useEffect(() => {
    if (!isFormOpen) { reset(questionFormDefaults); return }
    if (editingId && detail) {
      reset({
        category_id: detail.category_id,
        question: detail.question,
        difficulty: detail.difficulty as QuestionFormValues['difficulty'],
        personal_answer: detail.personal_answer ?? '',
        ideal_answer: detail.ideal_answer ?? '',
        notes: detail.notes ?? '',
        mastery_score: detail.mastery_score,
      })
    }
  }, [isFormOpen, editingId, detail, reset])

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <SheetContent side="right" className="w-[520px] max-w-full">
        <SheetHeader>
          <SheetTitle>{editingId ? 'Edit Question' : 'Add Question'}</SheetTitle>
          <SheetDescription>Build your personal interview question bank.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="question-form" onSubmit={handleSubmit(async v => { await submit(v) })} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category <span className="text-destructive">*</span></Label>
              <Controller control={control} name="category_id" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color_hex }} />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.category_id?.message && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Question <span className="text-destructive">*</span></Label>
              <Textarea rows={3} placeholder="e.g. Tell me about a time you handled a difficult stakeholder…" {...register('question')} />
              {errors.question?.message && <p className="text-xs text-destructive">{errors.question.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Controller control={control} name="difficulty" render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label>Mastery (0–5)</Label>
                <Input type="number" min={0} max={5} {...register('mastery_score')} />
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label>My Answer</Label>
              <Textarea rows={4} placeholder="Write your personal answer using the STAR method…" {...register('personal_answer')} />
            </div>

            <div className="space-y-1.5">
              <Label>Ideal Answer</Label>
              <Textarea rows={4} placeholder="What's the ideal/model answer for this question?" {...register('ideal_answer')} />
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Tips, key points to remember…" {...register('notes')} />
            </div>
          </form>
        </SheetBody>
        <SheetFooter>
          {formError && <p className="text-xs text-destructive w-full text-center">{formError}</p>}
          <Button variant="outline" onClick={closeForm} disabled={isSubmitting} type="button">Cancel</Button>
          <Button form="question-form" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Add Question'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Delete Dialog ─────────────────────────────────────────────────────────────

function DeleteQuestionDialog() {
  const { deletingId, isDeleting, cancelDelete, executeDelete } = useInterviewStore()
  return (
    <Dialog open={!!deletingId} onOpenChange={open => { if (!open) cancelDelete() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete question?</DialogTitle>
          <DialogDescription>This will permanently delete the question and its answers.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={() => void executeDelete()} disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Flashcard Mode ────────────────────────────────────────────────────────────

function FlashcardMode() {
  const { flashcardQueue, flashcardIndex, flashcardFlipped, flipFlashcard, nextFlashcard, prevFlashcard, rateFlashcard, setMode } = useInterviewStore()

  if (flashcardQueue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">No questions in flashcard queue.</p>
        <Button onClick={() => setMode('list')}>Back to List</Button>
      </div>
    )
  }

  const q = flashcardQueue[flashcardIndex]
  if (!q) return null
  const progress = `${flashcardIndex + 1} / ${flashcardQueue.length}`
  const diffCfg = DIFFICULTY_CONFIG[q.difficulty]

  return (
    <div className="flex flex-col h-full gap-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setMode('list')} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />Back
        </Button>
        <span className="text-sm text-muted-foreground">{progress}</span>
        <div className="flex items-center gap-2">
          <Badge variant={diffCfg.variant} className="text-[10px]">{diffCfg.label}</Badge>
          <span className="text-xs text-muted-foreground">{q.category_name}</span>
        </div>
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-xl border border-border bg-card p-8 flex flex-col items-center justify-center gap-6 cursor-pointer select-none min-h-[300px]"
        onClick={flipFlashcard}
      >
        {!flashcardFlipped ? (
          <div className="text-center space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Question</p>
            <p className="text-lg font-medium leading-relaxed max-w-2xl">{q.question}</p>
            <p className="text-xs text-muted-foreground mt-4">Tap to reveal answer</p>
          </div>
        ) : (
          <div className="text-center space-y-4 w-full max-w-2xl">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Answer</p>
            {q.personal_answer ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{q.personal_answer}</p>
            ) : q.ideal_answer ? (
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{q.ideal_answer}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No answer written yet. Edit this question to add your answer.</p>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={prevFlashcard} disabled={flashcardIndex === 0}>
          <ChevronLeft />Prev
        </Button>

        {flashcardFlipped && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rate:</span>
            {[1, 2, 3, 4, 5].map(score => (
              <button key={score} type="button" onClick={() => void rateFlashcard(score)}
                className="h-8 w-8 rounded-full border border-border hover:border-primary hover:text-primary text-xs font-medium transition-colors">
                {score}
              </button>
            ))}
          </div>
        )}
        {!flashcardFlipped && (
          <Button variant="outline" size="sm" onClick={flipFlashcard} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />Flip
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={nextFlashcard} disabled={flashcardIndex === flashcardQueue.length - 1}>
          Next<ChevronRight />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((flashcardIndex + 1) / flashcardQueue.length) * 100}%` }} />
      </div>
    </div>
  )
}

// ── Random Interview Mode ─────────────────────────────────────────────────────

function RandomInterviewSetup({ onStart, onCancel }: { onStart: (params: { category_id?: string; difficulty?: string; count?: number }) => void; onCancel: () => void }) {
  const { categories } = useInterviewStore()
  const [categoryId, setCategoryId] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [count, setCount] = useState('10')

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 max-w-md mx-auto">
      <div className="text-center">
        <Shuffle className="h-12 w-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl font-semibold">Random Interview</h2>
        <p className="text-sm text-muted-foreground mt-1">Practice a randomized set of interview questions</p>
      </div>
      <div className="w-full space-y-4">
        <div className="space-y-1.5">
          <Label>Category (optional)</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Difficulty (optional)</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger><SelectValue placeholder="Any difficulty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any difficulty</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Number of Questions</Label>
          <Input type="number" min={1} max={50} value={count} onChange={e => setCount(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button className="flex-1 gap-2" onClick={() => onStart({
            count: parseInt(count) || 10,
            ...(categoryId && categoryId !== '__all__' && { category_id: categoryId }),
            ...(difficulty && difficulty !== '__any__' && { difficulty }),
          })}>
            <Shuffle className="h-4 w-4" />Start Interview
          </Button>
        </div>
      </div>
    </div>
  )
}

function RandomInterviewMode() {
  const { randomQueue, randomIndex, randomFlipped, flipRandom, nextRandom, prevRandom, rateRandom, setMode } = useInterviewStore()
  const [showSetup, setShowSetup] = useState(true)
  const { startRandomInterview } = useInterviewStore()

  const handleStart = async (params: { category_id?: string; difficulty?: string; count?: number }) => {
    await startRandomInterview(params)
    setShowSetup(false)
  }

  if (showSetup) {
    return <RandomInterviewSetup onStart={p => void handleStart(p)} onCancel={() => setMode('list')} />
  }

  if (randomQueue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">No questions found for selected filters.</p>
        <Button onClick={() => setShowSetup(true)}>Change Filters</Button>
        <Button variant="ghost" onClick={() => setMode('list')}>Back to List</Button>
      </div>
    )
  }

  const q = randomQueue[randomIndex]
  if (!q) return null
  const progress = `${randomIndex + 1} / ${randomQueue.length}`
  const diffCfg = DIFFICULTY_CONFIG[q.difficulty]
  const isLast = randomIndex === randomQueue.length - 1

  return (
    <div className="flex flex-col h-full gap-4 py-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => { setMode('list'); setShowSetup(true) }} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />Exit
        </Button>
        <span className="text-sm text-muted-foreground font-medium">{progress}</span>
        <div className="flex items-center gap-2">
          <Badge variant={diffCfg.variant} className="text-[10px]">{diffCfg.label}</Badge>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 cursor-pointer" onClick={flipRandom}>
        {!randomFlipped ? (
          <div className="min-h-[200px] flex flex-col items-center justify-center text-center gap-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{q.category_name}</p>
            <p className="text-base font-medium leading-relaxed">{q.question}</p>
            <p className="text-xs text-muted-foreground">Tap to see answer</p>
          </div>
        ) : (
          <div className="min-h-[200px] flex flex-col gap-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Answer</p>
            {q.personal_answer ? (
              <p className="text-sm whitespace-pre-wrap">{q.personal_answer}</p>
            ) : q.ideal_answer ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.ideal_answer}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No answer written yet.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={prevRandom} disabled={randomIndex === 0}>
          <ChevronLeft />Prev
        </Button>

        {randomFlipped && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rate:</span>
            {[1, 2, 3, 4, 5].map(score => (
              <button key={score} type="button" onClick={() => void rateRandom(score)}
                className="h-8 w-8 rounded-full border border-border hover:border-primary hover:bg-accent text-xs font-medium transition-colors">
                {score}
              </button>
            ))}
          </div>
        )}
        {!randomFlipped && <Button variant="outline" size="sm" onClick={flipRandom}><RotateCcw className="h-3.5 w-3.5" />Flip</Button>}

        {isLast ? (
          <Button size="sm" onClick={() => { setMode('list'); setShowSetup(true) }} className="gap-1">
            Finish
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={nextRandom}>Next<ChevronRight /></Button>
        )}
      </div>

      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((randomIndex + 1) / randomQueue.length) * 100}%` }} />
      </div>
    </div>
  )
}

// ── Progress Panel ────────────────────────────────────────────────────────────

function ProgressPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { progress } = useInterviewStore()

  return (
    <Sheet open={open} onOpenChange={o => { if (!o) onClose() }}>
      <SheetContent side="right" className="w-[400px] max-w-full">
        <SheetHeader><SheetTitle>Progress Overview</SheetTitle></SheetHeader>
        <SheetBody>
          {!progress ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No data yet.</p>
          ) : (
            <div className="space-y-6">
              {/* Overall */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Overall</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-2xl font-bold">{progress.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
                  <div><p className="text-2xl font-bold text-primary">{progress.mastered_count}</p><p className="text-xs text-muted-foreground">Mastered</p></div>
                  <div><p className="text-2xl font-bold">{progress.avg_mastery.toFixed(1)}</p><p className="text-xs text-muted-foreground">Avg Score</p></div>
                </div>
                {progress.total > 0 && (
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((progress.mastered_count / progress.total) * 100)}%` }} />
                  </div>
                )}
              </div>

              {/* By category */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">By Category</p>
                <div className="space-y-2">
                  {progress.by_category.map(cat => (
                    <div key={cat.category_id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{cat.category_name}</span>
                        <span className="text-muted-foreground">{cat.mastered}/{cat.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: cat.total > 0 ? `${Math.round((cat.mastered / cat.total) * 100)}%` : '0%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By difficulty */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">By Difficulty</p>
                <div className="space-y-1.5">
                  {progress.by_difficulty.map(d => (
                    <div key={d.difficulty} className="flex items-center justify-between">
                      <Badge variant={DIFFICULTY_CONFIG[d.difficulty as InterviewDifficulty]?.variant ?? 'secondary'} className="text-[10px]">
                        {d.difficulty}
                      </Badge>
                      <span className="text-sm font-medium">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mastery distribution */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Mastery Distribution</p>
                <div className="space-y-1.5">
                  {[0, 1, 2, 3, 4, 5].map(score => {
                    const entry = progress.by_mastery.find(m => m.score === score)
                    const count = entry?.count ?? 0
                    const max = Math.max(...progress.by_mastery.map(m => m.count), 1)
                    return (
                      <div key={score} className="flex items-center gap-2">
                        <MasteryStars score={score} />
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function InterviewPage() {
  const {
    items, total, page, pageSize, totalPages, isLoading, listError, filters,
    fetch, fetchCategories, fetchProgress, setSearch, setPage, setFilterField, clearFilters,
    openCreate, openEdit, confirmDelete, categories, mode, setMode, startFlashcards,
  } = useInterviewStore()

  const [showProgress, setShowProgress] = useState(false)

  useEffect(() => {
    void fetch()
    void fetchCategories()
    void fetchProgress()
  }, [fetch, fetchCategories, fetchProgress])

  const hasFilters = !!filters.search || !!filters.category_id || !!filters.difficulty

  if (mode === 'flashcard') {
    return (
      <div className="flex flex-col h-full p-6">
        <FlashcardMode />
      </div>
    )
  }

  if (mode === 'random-interview') {
    return (
      <div className="flex flex-col h-full p-6">
        <RandomInterviewMode />
      </div>
    )
  }

  return (
    <>
      <PageLayout
        title="Interview Question Bank"
        description="Build and practice your personal interview question bank with flashcard and random interview modes."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowProgress(true)} className="gap-1.5">
              <BarChart2 className="h-3.5 w-3.5" />Progress
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMode('random-interview')} className="gap-1.5">
              <Shuffle className="h-3.5 w-3.5" />Random Interview
            </Button>
            <Button variant="outline" size="sm" onClick={startFlashcards} className="gap-1.5" disabled={items.length === 0}>
              <BookOpen className="h-3.5 w-3.5" />Flashcards
            </Button>
            <Button size="sm" onClick={openCreate}><Plus />Add Question</Button>
          </div>
        }
      >
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput value={filters.search ?? ''} onChange={setSearch} placeholder="Search questions…" className="w-64" />
          <Select value={filters.category_id || '__all__'} onValueChange={v => setFilterField('category_id', v === '__all__' ? undefined : v)}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color_hex }} />{c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.difficulty || '__all__'} onValueChange={v => setFilterField('difficulty', v === '__all__' ? undefined : (v as InterviewDifficulty))}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All difficulties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1"><X className="h-3 w-3" />Clear</Button>}
        </div>

        {/* Tabs for viewing */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unmastered">Needs Practice</TabsTrigger>
            <TabsTrigger value="mastered">Mastered</TabsTrigger>
          </TabsList>

          {(['all', 'unmastered', 'mastered'] as const).map(tab => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? <PageLoader /> : listError ? (
                <div className="text-center py-20">
                  <p className="text-sm text-muted-foreground">{listError}</p>
                  <Button variant="outline" size="sm" onClick={() => void fetch()} className="mt-3">Retry</Button>
                </div>
              ) : (() => {
                const filtered = items.filter(q =>
                  tab === 'all' ? true :
                  tab === 'mastered' ? q.mastery_score >= 4 :
                  q.mastery_score < 4,
                )
                return filtered.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title={hasFilters ? 'No questions match' : tab === 'mastered' ? 'No mastered questions yet' : 'No questions yet'}
                    description={hasFilters ? 'Try adjusting your filters.' : 'Start building your interview question bank.'}
                    action={!hasFilters && tab === 'all' ? <Button onClick={openCreate}><Plus />Add your first question</Button> : undefined}
                  />
                ) : (
                  <div className="space-y-2">
                    {tab === 'all' && <p className="text-xs text-muted-foreground mb-4">{total} question{total !== 1 ? 's' : ''}{hasFilters && ' matching filters'}</p>}
                    {filtered.map(q => (
                      <QuestionCard key={q.id} q={q} onEdit={openEdit} onDelete={confirmDelete} />
                    ))}
                    {tab === 'all' && <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />}
                  </div>
                )
              })()}
            </TabsContent>
          ))}
        </Tabs>
      </PageLayout>

      <QuestionForm />
      <DeleteQuestionDialog />
      <ProgressPanel open={showProgress} onClose={() => setShowProgress(false)} />

      {void Separator}
    </>
  )
}
