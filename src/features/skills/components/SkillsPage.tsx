import { useEffect } from 'react'
import { Plus, Code2 } from 'lucide-react'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { EmptyState } from '@shared/components/common/EmptyState'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { SearchInput } from '@shared/components/common/SearchInput'
import { Pagination } from '@shared/components/common/Pagination'
import { Button } from '@shared/components/ui/button'
import { SkillCard } from './SkillCard'
import { SkillFilters } from './SkillFilters'
import { SkillForm } from './SkillForm'
import { DeleteSkillDialog } from './DeleteSkillDialog'
import { useSkillsStore } from '../store/skills.store'
import { useCategoriesStore } from '../store/categories.store'

export function SkillsPage() {
  const {
    items,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    listError,
    filters,
    fetch,
    setSearch,
    setPage,
    openCreate,
    openEdit,
    confirmDelete,
  } = useSkillsStore()

  const { fetch: fetchCategories } = useCategoriesStore()

  useEffect(() => {
    void fetch()
    void fetchCategories()
  }, [fetch, fetchCategories])

  const hasFilters = !!filters.search || !!filters.category_id || !!filters.proficiency_level || !!filters.status

  return (
    <>
      <PageLayout
        title="Skills"
        description="Track your technical and professional skills across all categories."
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus />
            Add Skill
          </Button>
        }
      >
        {/* Search + Filters bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput
            value={filters.search}
            onChange={setSearch}
            placeholder="Search skills…"
            className="w-64"
          />
          <SkillFilters />
        </div>

        {/* Content */}
        {isLoading ? (
          <PageLoader />
        ) : listError ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground">{listError}</p>
            <Button variant="outline" size="sm" onClick={() => void fetch()} className="mt-3">
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Code2}
            title={hasFilters ? 'No skills match your filters' : 'No skills yet'}
            description={
              hasFilters
                ? "Try adjusting your search or filters to find what you're looking for."
                : 'Add your first skill to start tracking your technical expertise and learning progress.'
            }
            action={
              !hasFilters ? (
                <Button onClick={openCreate}>
                  <Plus />
                  Add your first skill
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Stats row */}
            <p className="text-xs text-muted-foreground mb-4">
              {total} {total === 1 ? 'skill' : 'skills'}
              {hasFilters && ' matching filters'}
            </p>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(skill => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onEdit={openEdit}
                  onDelete={confirmDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </PageLayout>

      {/* Portals */}
      <SkillForm />
      <DeleteSkillDialog />
    </>
  )
}
