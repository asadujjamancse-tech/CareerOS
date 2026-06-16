import { useState } from 'react'
import { MessageSquare, Unlink, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { cn } from '@shared/lib/utils'
import type { LinkedInterviewQuestion } from '@shared/types/ipc.types'
import { useSkillHubStore } from '../../store/skill-hub.store'

interface Props {
  skillId: string
  questions: LinkedInterviewQuestion[]
  isLoading: boolean
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy:   'bg-green-500/10 text-green-400',
  medium: 'bg-amber-500/10 text-amber-400',
  hard:   'bg-red-500/10 text-red-400',
}

function MasteryDots({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={cn('h-1.5 w-1.5 rounded-full', i <= score ? 'bg-primary' : 'bg-border')} />
      ))}
    </div>
  )
}

function QuestionCard({ question, skillId }: { question: LinkedInterviewQuestion; skillId: string }) {
  const [expanded, setExpanded] = useState(false)
  const { unlinkInterviewQuestion } = useSkillHubStore()

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden group">
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="rounded-md p-1.5 shrink-0 mt-0.5" style={{ backgroundColor: `${question.category_color}20` }}>
          <MessageSquare className="h-3.5 w-3.5" style={{ color: question.category_color }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2">{question.question}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">{question.category_name}</span>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-sm font-medium capitalize', DIFFICULTY_STYLES[question.difficulty])}>
              {question.difficulty}
            </span>
            <MasteryDots score={question.mastery_score} />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost" size="icon-sm"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={e => { e.stopPropagation(); void unlinkInterviewQuestion(skillId, question.id) }}
          >
            <Unlink className="h-3 w-3" />
          </Button>
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2 bg-accent/10">
          <div className="text-xs text-muted-foreground">
            Last reviewed: {question.last_reviewed_at
              ? new Date(question.last_reviewed_at).toLocaleDateString('en-AU')
              : 'Never'}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.hash = '#/interview-questions'}>
            <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open in Interview Bank
          </Button>
        </div>
      )}
    </div>
  )
}

export function InterviewPrepTab({ skillId, questions, isLoading }: Props) {
  if (isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading questions…</div>

  const avgMastery = questions.length > 0
    ? (questions.reduce((s, q) => s + q.mastery_score, 0) / questions.length).toFixed(1)
    : '0'
  const mastered = questions.filter(q => q.mastery_score >= 4).length

  return (
    <div className="space-y-4">
      {questions.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{questions.length} questions</span>
          <span>Avg mastery: {avgMastery}/5</span>
          <span>{mastered} mastered (≥4)</span>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-border p-4 mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No interview questions linked</p>
          <p className="text-xs text-muted-foreground mb-4">
            Link questions from the Interview Bank to track your readiness for this skill.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.hash = '#/interview-questions'}>
            <ExternalLink className="h-3.5 w-3.5 mr-2" /> Go to Interview Bank
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map(q => <QuestionCard key={q.id} question={q} skillId={skillId} />)}
        </div>
      )}
    </div>
  )
}
