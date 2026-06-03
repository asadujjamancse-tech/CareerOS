import { Badge } from '@shared/components/ui/badge'
import type { OccupationStatus } from '../types/occupation.types'

const STATUS_CONFIG: Record<OccupationStatus, {
  label: string
  variant: 'secondary' | 'info' | 'warning' | 'success' | 'default'
}> = {
  aspirational: { label: 'Aspirational', variant: 'info'      },
  active:       { label: 'Active',       variant: 'warning'   },
  completed:    { label: 'Completed',    variant: 'success'   },
  archived:     { label: 'Archived',     variant: 'secondary' },
}

interface OccupationStatusBadgeProps {
  status: OccupationStatus
  className?: string
}

export function OccupationStatusBadge({ status, className }: OccupationStatusBadgeProps) {
  const { label, variant } = STATUS_CONFIG[status]
  return <Badge variant={variant} className={className}>{label}</Badge>
}
