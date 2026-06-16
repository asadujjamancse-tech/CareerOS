import { Code2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@shared/lib/utils'
import type { RelatedSkill } from '@shared/types/ipc.types'

interface Props {
  skills: RelatedSkill[]
  isLoading: boolean
}

const LEVEL_STYLES: Record<string, string> = {
  beginner:     'bg-zinc-500/10 text-zinc-400',
  intermediate: 'bg-blue-500/10 text-blue-400',
  advanced:     'bg-purple-500/10 text-purple-400',
  expert:       'bg-amber-500/10 text-amber-400',
}

const STATUS_STYLES: Record<string, string> = {
  learning:   'bg-blue-500/10 text-blue-400',
  practicing: 'bg-amber-500/10 text-amber-400',
  proficient: 'bg-green-500/10 text-green-400',
  mastered:   'bg-purple-500/10 text-purple-400',
}

function RelatedSkillCard({ skill }: { skill: RelatedSkill }) {
  const navigate = useNavigate()
  return (
    <button
      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-zinc-600 transition-colors w-full text-left"
      onClick={() => navigate(`/skills/${skill.id}`)}
    >
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: skill.category_color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{skill.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={cn('text-xs px-1.5 py-0.5 rounded-sm font-medium capitalize', LEVEL_STYLES[skill.proficiency_level])}>
            {skill.proficiency_level}
          </span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded-sm font-medium capitalize', STATUS_STYLES[skill.status])}>
            {skill.status}
          </span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  )
}

export function RelatedSkillsTab({ skills, isLoading }: Props) {
  if (isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading related skills…</div>

  return (
    <div className="space-y-4">
      {skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-border p-4 mb-4">
            <Code2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No related skills</p>
          <p className="text-xs text-muted-foreground">
            Skills in the same category will appear here.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{skills.length} skills in the same category</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {skills.map(s => <RelatedSkillCard key={s.id} skill={s} />)}
          </div>
        </>
      )}
    </div>
  )
}
