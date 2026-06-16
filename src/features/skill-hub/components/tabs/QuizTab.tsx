import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2, XCircle, Brain } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Textarea } from '@shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { cn } from '@shared/lib/utils'
import type { SkillQuizQuestion, QuizAttemptStats } from '@shared/types/ipc.types'
import { useSkillHubStore } from '../../store/skill-hub.store'

interface Props {
  skillId: string
  questions: SkillQuizQuestion[]
  stats: QuizAttemptStats | null
  isLoading: boolean
}

function QuestionCard({ question, skillId }: { question: SkillQuizQuestion; skillId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [answered, setAnswered] = useState<boolean | null>(null)
  const { deleteQuizQuestion, logQuizAttempt } = useSkillHubStore()

  async function handleAnswer(correct: boolean) {
    setAnswered(correct)
    await logQuizAttempt({ skill_id: skillId, question_id: question.id, is_correct: correct ? 1 : 0 })
  }

  const diffCls = question.difficulty === 'easy' ? 'bg-green-500/10 text-green-400'
    : question.difficulty === 'hard' ? 'bg-red-500/10 text-red-400'
    : 'bg-amber-500/10 text-amber-400'

  const typeCls = question.type === 'flashcard' ? 'bg-blue-500/10 text-blue-400'
    : question.type === 'mcq' ? 'bg-purple-500/10 text-purple-400'
    : 'bg-cyan-500/10 text-cyan-400'

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden group">
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => { setExpanded(e => !e); setAnswered(null) }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{question.question}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn('text-xs px-1.5 py-0.5 rounded-sm font-medium capitalize', typeCls)}>{question.type}</span>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-sm font-medium capitalize', diffCls)}>{question.difficulty}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={e => { e.stopPropagation(); void deleteQuizQuestion(question.id) }}>
            <Trash2 className="h-3 w-3" />
          </Button>
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3 bg-accent/10">
          {/* MCQ Options */}
          {question.type === 'mcq' && question.options_json && (() => {
            try {
              const opts = JSON.parse(question.options_json) as string[]
              return (
                <div className="space-y-1">
                  {opts.map((opt, i) => (
                    <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-border flex items-center justify-center text-[10px] font-bold shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </div>
                  ))}
                </div>
              )
            } catch { return null }
          })()}

          {/* Answer */}
          {question.answer && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Answer</p>
              <p className="text-sm text-foreground">{question.answer}</p>
            </div>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Explanation</p>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          )}

          {/* Self-assessment */}
          {answered === null ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-green-400 border-green-500/30 hover:bg-green-500/10"
                onClick={() => void handleAnswer(true)}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Got it
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                onClick={() => void handleAnswer(false)}>
                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Need to review
              </Button>
            </div>
          ) : (
            <p className={cn('text-xs font-medium', answered ? 'text-green-400' : 'text-red-400')}>
              {answered ? '✓ Marked as correct' : '✗ Marked for review'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function AddQuestionForm({ skillId, onClose }: { skillId: string; onClose: () => void }) {
  const [form, setForm] = useState({
    question: '', type: 'flashcard', answer: '', explanation: '', difficulty: 'medium',
    optionsRaw: '',
  })
  const { createQuizQuestion } = useSkillHubStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.question.trim()) return
    let options_json: string | null = null
    if (form.type === 'mcq' && form.optionsRaw.trim()) {
      const opts = form.optionsRaw.split('\n').map(o => o.trim()).filter(Boolean)
      if (opts.length) options_json = JSON.stringify(opts)
    }
    await createQuizQuestion({
      skill_id: skillId,
      question: form.question.trim(),
      type: form.type as 'flashcard' | 'mcq' | 'scenario',
      answer: form.answer.trim() || null,
      options_json,
      explanation: form.explanation.trim() || null,
      difficulty: form.difficulty as 'easy' | 'medium' | 'hard',
    })
    onClose()
  }

  return (
    <form onSubmit={e => void handleSubmit(e)} className="rounded-lg border border-primary/30 bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Add Quiz Question</h3>
      <Textarea placeholder="Question *" required rows={2}
        value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
      <div className="grid grid-cols-2 gap-3">
        <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="flashcard">Flashcard</SelectItem>
            <SelectItem value="mcq">Multiple Choice</SelectItem>
            <SelectItem value="scenario">Scenario</SelectItem>
          </SelectContent>
        </Select>
        <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {form.type === 'mcq' && (
        <Textarea placeholder="Options (one per line)" rows={3}
          value={form.optionsRaw} onChange={e => setForm(f => ({ ...f, optionsRaw: e.target.value }))} />
      )}
      <Textarea placeholder="Answer (optional)" rows={2}
        value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} />
      <Textarea placeholder="Explanation (optional)" rows={2}
        value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm">Add Question</Button>
      </div>
    </form>
  )
}

export function QuizTab({ skillId, questions, stats, isLoading }: Props) {
  const [showForm, setShowForm] = useState(false)

  if (isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading quiz…</div>

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {stats && stats.total_attempts > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 text-xs">
          <span className="text-muted-foreground">{stats.total_attempts} attempts</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-green-400 font-medium">{stats.accuracy_pct}% accuracy</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{stats.correct_attempts} correct</span>
        </div>
      )}

      {showForm && <AddQuestionForm skillId={skillId} onClose={() => setShowForm(false)} />}

      {questions.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-border p-4 mb-4">
            <Brain className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No quiz questions yet</p>
          <p className="text-xs text-muted-foreground mb-4">Add flashcards, MCQs, and scenario questions to test yourself</p>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Question</Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {questions.map(q => <QuestionCard key={q.id} question={q} skillId={skillId} />)}
          </div>
          {!showForm && (
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Question
            </Button>
          )}
        </>
      )}
    </div>
  )
}
