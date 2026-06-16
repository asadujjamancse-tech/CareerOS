import { FlaskConical, Clock, CheckCircle2, ExternalLink, Unlink } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { cn } from '@shared/lib/utils'
import type { LinkedLab } from '@shared/types/ipc.types'
import { useSkillHubStore } from '../../store/skill-hub.store'
import { formatDuration } from '../../types/skill-hub.types'

interface Props {
  skillId: string
  labs: LinkedLab[]
  isLoading: boolean
}

const STATUS_STYLES: Record<string, string> = {
  completed:    'bg-green-500/10 text-green-400',
  'in-progress':'bg-blue-500/10 text-blue-400',
  planned:      'bg-zinc-500/10 text-zinc-400',
  paused:       'bg-amber-500/10 text-amber-400',
  abandoned:    'bg-red-500/10 text-red-400',
}

function LabCard({ lab, skillId }: { lab: LinkedLab; skillId: string }) {
  const { unlinkLab } = useSkillHubStore()

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-zinc-600 transition-colors">
      <div className="rounded-md p-2 bg-green-500/10 shrink-0">
        <FlaskConical className="h-4 w-4 text-green-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{lab.title}</p>
          <Button
            variant="ghost" size="icon-sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => void unlinkLab(skillId, lab.id)}
            title="Unlink lab"
          >
            <Unlink className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={cn('text-xs px-1.5 py-0.5 rounded-sm font-medium capitalize', STATUS_STYLES[lab.status] ?? 'bg-zinc-500/10 text-zinc-400')}>
            {lab.status}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDuration(lab.total_minutes)}
          </span>
          {lab.completion_pct > 0 && (
            <span className="text-xs text-muted-foreground">{lab.completion_pct}% done</span>
          )}
        </div>

        {/* Progress bar */}
        {lab.completion_pct > 0 && (
          <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
            <div
              className={cn('h-full rounded-full', lab.status === 'completed' ? 'bg-green-500' : 'bg-blue-500')}
              style={{ width: `${lab.completion_pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function HomeLabsTab({ skillId, labs, isLoading }: Props) {
  if (isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading labs…</div>

  const completed = labs.filter(l => l.status === 'completed').length
  const totalMinutes = labs.reduce((s, l) => s + l.total_minutes, 0)

  return (
    <div className="space-y-4">
      {labs.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> {completed}/{labs.length} completed</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDuration(totalMinutes)} total</span>
        </div>
      )}

      {labs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-border p-4 mb-4">
            <FlaskConical className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No labs linked</p>
          <p className="text-xs text-muted-foreground mb-4">
            Link home labs to this skill from the Home Labs page by selecting this skill when editing a lab.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.hash = '#/home-lab'}>
            <ExternalLink className="h-3.5 w-3.5 mr-2" /> Go to Home Labs
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {labs.map(l => <LabCard key={l.id} lab={l} skillId={skillId} />)}
        </div>
      )}
    </div>
  )
}
