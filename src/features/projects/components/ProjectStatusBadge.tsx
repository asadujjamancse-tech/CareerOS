import { Badge } from '@shared/components/ui/badge'
import type { ProjectStatus } from '../types/project.types'

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: 'info' | 'success' | 'warning' | 'secondary' | 'destructive' }
> = {
  planning:   { label: 'Planning',   variant: 'info'        },
  active:     { label: 'Active',     variant: 'success'     },
  completed:  { label: 'Completed',  variant: 'secondary'   },
  paused:     { label: 'Paused',     variant: 'warning'     },
  abandoned:  { label: 'Abandoned',  variant: 'destructive' },
}

interface ProjectStatusBadgeProps {
  status: ProjectStatus
  className?: string
}

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const { label, variant } = STATUS_CONFIG[status]
  return <Badge variant={variant} className={className}>{label}</Badge>
}
