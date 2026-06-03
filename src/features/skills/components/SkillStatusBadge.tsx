import { Badge } from '@shared/components/ui/badge'
import type { SkillStatus } from '../types/skill.types'

const STATUS_CONFIG: Record<SkillStatus, { label: string; variant: 'secondary' | 'info' | 'warning' | 'success' }> = {
  learning:   { label: 'Learning',   variant: 'info'      },
  practicing: { label: 'Practicing', variant: 'warning'   },
  proficient: { label: 'Proficient', variant: 'secondary' },
  mastered:   { label: 'Mastered',   variant: 'success'   },
}

interface SkillStatusBadgeProps {
  status: SkillStatus
  className?: string
}

export function SkillStatusBadge({ status, className }: SkillStatusBadgeProps) {
  const { label, variant } = STATUS_CONFIG[status]
  return <Badge variant={variant} className={className}>{label}</Badge>
}
