import { Badge } from '@shared/components/ui/badge'
import type { SkillProficiencyLevel } from '../types/skill.types'

const LEVEL_CONFIG: Record<SkillProficiencyLevel, { label: string; variant: 'info' | 'success' | 'warning' | 'purple' | 'orange' }> = {
  beginner:     { label: 'Beginner',     variant: 'info' },
  intermediate: { label: 'Intermediate', variant: 'warning' },
  advanced:     { label: 'Advanced',     variant: 'orange' },
  expert:       { label: 'Expert',       variant: 'purple' },
}

interface SkillLevelBadgeProps {
  level: SkillProficiencyLevel
  className?: string
}

export function SkillLevelBadge({ level, className }: SkillLevelBadgeProps) {
  const { label, variant } = LEVEL_CONFIG[level]
  return <Badge variant={variant} className={className}>{label}</Badge>
}
