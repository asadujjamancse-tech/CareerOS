import { Edit2, Trash2, Tag, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/components/ui/button'
import { truncate } from '@shared/lib/utils'
import { SkillLevelBadge } from './SkillLevelBadge'
import { SkillStatusBadge } from './SkillStatusBadge'
import type { SkillWithCategory } from '../types/skill.types'

interface SkillCardProps {
  skill: SkillWithCategory
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function SkillCard({ skill, onEdit, onDelete }: SkillCardProps) {
  const navigate = useNavigate()

  return (
    <div
      className="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-zinc-600 cursor-pointer"
      onClick={() => navigate(`/skills/${skill.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/skills/${skill.id}`) }}
    >
      {/* Category dot + name */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: skill.category_color }}
          />
          <h3 className="font-semibold text-sm text-foreground truncate" title={skill.name}>
            {skill.name}
          </h3>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={e => { e.stopPropagation(); onEdit(skill.id) }}
            aria-label={`Edit ${skill.name}`}
          >
            <Edit2 />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={e => { e.stopPropagation(); onDelete(skill.id) }}
            aria-label={`Delete ${skill.name}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      {/* Category label */}
      <p className="text-xs text-muted-foreground -mt-1">{skill.category_name}</p>

      {/* Description */}
      {skill.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {truncate(skill.description, 120)}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
        <SkillLevelBadge level={skill.proficiency_level} />
        <SkillStatusBadge status={skill.status} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2 mt-1">
        <span>{skill.years_experience > 0 ? `${skill.years_experience}y exp` : 'No exp logged'}</span>
        <div className="flex items-center gap-2">
          {skill.tag_count > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {skill.tag_count}
            </span>
          )}
          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
        </div>
      </div>
    </div>
  )
}
