import { FolderOpen, ExternalLink, Github, Unlink } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { cn } from '@shared/lib/utils'
import type { LinkedProject } from '@shared/types/ipc.types'
import { useSkillHubStore } from '../../store/skill-hub.store'

interface Props {
  skillId: string
  projects: LinkedProject[]
  isLoading: boolean
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-400',
  active:    'bg-blue-500/10 text-blue-400',
  planning:  'bg-zinc-500/10 text-zinc-400',
  paused:    'bg-amber-500/10 text-amber-400',
  abandoned: 'bg-red-500/10 text-red-400',
}

function ProjectCard({ project, skillId }: { project: LinkedProject; skillId: string }) {
  const { unlinkProject } = useSkillHubStore()

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-zinc-600 transition-colors">
      <div className="rounded-md p-2 bg-pink-500/10 shrink-0">
        <FolderOpen className="h-4 w-4 text-pink-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{project.title}</p>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {project.repo_url && (
              <a href={project.repo_url} target="_blank" rel="noopener noreferrer" title="Repository">
                <Button variant="ghost" size="icon-sm" className="h-6 w-6"><Github className="h-3 w-3" /></Button>
              </a>
            )}
            {project.live_url && (
              <a href={project.live_url} target="_blank" rel="noopener noreferrer" title="Live demo">
                <Button variant="ghost" size="icon-sm" className="h-6 w-6"><ExternalLink className="h-3 w-3" /></Button>
              </a>
            )}
            <Button
              variant="ghost" size="icon-sm"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => void unlinkProject(skillId, project.id)}
            >
              <Unlink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={cn('text-xs px-1.5 py-0.5 rounded-sm font-medium capitalize', STATUS_STYLES[project.status] ?? 'bg-zinc-500/10 text-zinc-400')}>
            {project.status}
          </span>
          <span className="text-xs text-muted-foreground capitalize">{project.type}</span>
          {project.completed_at && (
            <span className="text-xs text-muted-foreground">
              Completed {new Date(project.completed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProjectsTab({ skillId, projects, isLoading }: Props) {
  if (isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading projects…</div>

  const completed = projects.filter(p => p.status === 'completed').length

  return (
    <div className="space-y-4">
      {projects.length > 0 && (
        <p className="text-xs text-muted-foreground">{completed}/{projects.length} completed</p>
      )}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-border p-4 mb-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No projects linked</p>
          <p className="text-xs text-muted-foreground mb-4">
            Link projects to this skill from the Projects page.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.hash = '#/projects'}>
            <ExternalLink className="h-3.5 w-3.5 mr-2" /> Go to Projects
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map(p => <ProjectCard key={p.id} project={p} skillId={skillId} />)}
        </div>
      )}
    </div>
  )
}
