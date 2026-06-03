import { X } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@shared/components/ui/select'
import { Button } from '@shared/components/ui/button'
import { useOccupationsStore } from '../store/occupations.store'
import type { OccupationStatus, OccupationSeniorityLevel } from '../types/occupation.types'

export function OccupationFilters() {
  const { filters, setFilterField, clearFilters } = useOccupationsStore()
  const hasActiveFilters = !!filters.status || !!filters.seniority_level

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Status */}
      <Select
        value={filters.status || '__all__'}
        onValueChange={v => setFilterField('status', v === '__all__' ? '' : v as OccupationStatus)}
      >
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All statuses</SelectItem>
          <SelectItem value="aspirational">Aspirational</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      {/* Seniority */}
      <Select
        value={filters.seniority_level || '__all__'}
        onValueChange={v =>
          setFilterField('seniority_level', v === '__all__' ? '' : v as OccupationSeniorityLevel)
        }
      >
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder="All levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All levels</SelectItem>
          <SelectItem value="junior">Junior</SelectItem>
          <SelectItem value="mid">Mid-level</SelectItem>
          <SelectItem value="senior">Senior</SelectItem>
          <SelectItem value="lead">Lead</SelectItem>
          <SelectItem value="principal">Principal</SelectItem>
          <SelectItem value="staff">Staff</SelectItem>
          <SelectItem value="director">Director</SelectItem>
          <SelectItem value="vp">VP</SelectItem>
          <SelectItem value="c-level">C-Level</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs gap-1">
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  )
}
