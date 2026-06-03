import { X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { Button } from '@shared/components/ui/button'
import { useProjectsStore } from '../store/projects.store'
import type { ProjectStatus, ProjectType } from '../types/project.types'

export function ProjectFilters() {
  const { filters, setFilterField, clearFilters } = useProjectsStore()
  const hasActiveFilters = !!filters.status || !!filters.type || filters.is_featured !== null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.status || '__all__'}
        onValueChange={v =>
          setFilterField('status', v === '__all__' ? '' : (v as ProjectStatus))
        }
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All statuses</SelectItem>
          <SelectItem value="planning">Planning</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="abandoned">Abandoned</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.type || '__all__'}
        onValueChange={v =>
          setFilterField('type', v === '__all__' ? '' : (v as ProjectType))
        }
      >
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All types</SelectItem>
          <SelectItem value="personal">Personal</SelectItem>
          <SelectItem value="professional">Professional</SelectItem>
          <SelectItem value="open-source">Open Source</SelectItem>
          <SelectItem value="freelance">Freelance</SelectItem>
          <SelectItem value="academic">Academic</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.is_featured === null ? '__all__' : String(filters.is_featured)}
        onValueChange={v =>
          setFilterField('is_featured', v === '__all__' ? null : v === 'true')
        }
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Featured" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All projects</SelectItem>
          <SelectItem value="true">Featured only</SelectItem>
          <SelectItem value="false">Not featured</SelectItem>
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
