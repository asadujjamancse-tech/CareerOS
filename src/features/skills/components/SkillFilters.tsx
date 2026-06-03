import { X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { Button } from '@shared/components/ui/button'
import { useSkillsStore } from '../store/skills.store'
import { useCategoriesStore } from '../store/categories.store'
import type { SkillProficiencyLevel, SkillStatus } from '../types/skill.types'

export function SkillFilters() {
  const { filters, setFilterField, clearFilters } = useSkillsStore()
  const { categories } = useCategoriesStore()

  const hasActiveFilters =
    !!filters.category_id || !!filters.proficiency_level || !!filters.status

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Category */}
      <Select
        value={filters.category_id || '__all__'}
        onValueChange={v => setFilterField('category_id', v === '__all__' ? '' : v)}
      >
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All categories</SelectItem>
          {categories.map(cat => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Level */}
      <Select
        value={filters.proficiency_level || '__all__'}
        onValueChange={v =>
          setFilterField(
            'proficiency_level',
            v === '__all__'
              ? ''
              : (v as SkillProficiencyLevel),
          )
        }
      >
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="All levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All levels</SelectItem>
          <SelectItem value="beginner">Beginner</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="advanced">Advanced</SelectItem>
          <SelectItem value="expert">Expert</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status || '__all__'}
        onValueChange={v =>
          setFilterField(
            'status',
            v === '__all__'
              ? ''
              : (v as SkillStatus),
          )
        }
      >
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All statuses</SelectItem>
          <SelectItem value="learning">Learning</SelectItem>
          <SelectItem value="practicing">Practicing</SelectItem>
          <SelectItem value="proficient">Proficient</SelectItem>
          <SelectItem value="mastered">Mastered</SelectItem>
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
