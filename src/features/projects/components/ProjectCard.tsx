import { Edit2, Trash2, GitBranch, ExternalLink, Code2, Star } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { truncate, formatDate } from '@shared/lib/utils'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import type { ProjectWithMeta } from '../types/project.types'

const TYPE_LABEL: Record<string, string> = {
  personal: 'Personal',
  professional: 'Professional',
  'open-source': 'Open Source',
  freelance: 'Freelance',
  academic: 'Academic',
}

interface ProjectCardProps {
  project: ProjectWithMeta
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-zinc-600">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-sm text-foreground truncate" title={project.title}>
              {project.title}
            </h3>
            {project.is_featured === 1 && (
              <Star className="h-3 w-3 text-amber-400 shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{TYPE_LABEL[project.type] ?? project.type}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(project.id)} aria-label={`Edit ${project.title}`}>
            <Edit2 />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(project.id)}
            aria-label={`Delete ${project.title}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {/* Summary */}
      {project.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {truncate(project.summary, 100)}
        </p>
      )}

      {/* Status badge */}
      <ProjectStatusBadge status={project.status} />

      {/* Links */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {project.repo_url && (
          <a
            href={project.repo_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <GitBranch className="h-3 w-3" /> Repo
          </a>
        )}
        {project.live_url && (
          <a
            href={project.live_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" /> Live
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2 mt-auto">
        <div className="flex items-center gap-3">
          {project.skill_count > 0 && (
            <span className="flex items-center gap-1">
              <Code2 className="h-3 w-3" /> {project.skill_count}
            </span>
          )}
        </div>
        {project.started_at && (
          <span>{formatDate(project.started_at)}</span>
        )}
      </div>
    </div>
  )
}
