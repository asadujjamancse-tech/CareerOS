import { Edit2, Trash2, Target, AlertTriangle, Tag } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { truncate } from '@shared/lib/utils'
import { OccupationStatusBadge } from './OccupationStatusBadge'
import type { OccupationWithStats, OccupationSeniorityLevel } from '../types/occupation.types'

const SENIORITY_LABELS: Record<OccupationSeniorityLevel, string> = {
  junior:    'Junior',
  mid:       'Mid-level',
  senior:    'Senior',
  lead:      'Lead',
  principal: 'Principal',
  staff:     'Staff',
  director:  'Director',
  vp:        'VP',
  'c-level': 'C-Level',
}

interface OccupationCardProps {
  occupation: OccupationWithStats
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function OccupationCard({ occupation, onEdit, onDelete }: OccupationCardProps) {
  const readinessPercent =
    occupation.skill_count > 0
      ? Math.round((occupation.acquired_count / occupation.skill_count) * 100)
      : 0
  const hasUnacquiredCritical =
    occupation.critical_count > 0 &&
    occupation.acquired_count < occupation.skill_count

  return (
    <div className="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-zinc-600">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Target className="h-4 w-4 shrink-0 text-primary" />
          <h3 className="font-semibold text-sm text-foreground truncate" title={occupation.title}>
            {occupation.title}
          </h3>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(occupation.id)}
            aria-label={`Edit ${occupation.title}`}
          >
            <Edit2 />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(occupation.id)}
            aria-label={`Delete ${occupation.title}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {/* Industry + Seniority */}
      {(occupation.industry || occupation.seniority_level) && (
        <p className="text-xs text-muted-foreground -mt-1 truncate">
          {[
            occupation.seniority_level
              ? SENIORITY_LABELS[occupation.seniority_level]
              : null,
            occupation.industry,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      {/* Description */}
      {occupation.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {truncate(occupation.description, 120)}
        </p>
      )}

      {/* Skill readiness */}
      {occupation.skill_count > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Skill readiness</span>
            <span className="font-medium text-foreground">
              {occupation.acquired_count}/{occupation.skill_count}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${readinessPercent}%` }}
            />
          </div>
          {hasUnacquiredCritical && (
            <div className="flex items-center gap-1 text-xs text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              <span>{occupation.critical_count} critical skill{occupation.critical_count > 1 ? 's' : ''} pending</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
        <OccupationStatusBadge status={occupation.status} />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {occupation.target_date && (
            <span>
              {new Date(occupation.target_date).toLocaleDateString('en-AU', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
          {occupation.tag_count > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {occupation.tag_count}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
