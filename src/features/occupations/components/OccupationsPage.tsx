import { useEffect } from 'react'
import { Plus, Briefcase } from 'lucide-react'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { EmptyState } from '@shared/components/common/EmptyState'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { SearchInput } from '@shared/components/common/SearchInput'
import { Pagination } from '@shared/components/common/Pagination'
import { Button } from '@shared/components/ui/button'
import { OccupationCard } from './OccupationCard'
import { OccupationFilters } from './OccupationFilters'
import { OccupationForm } from './OccupationForm'
import { DeleteOccupationDialog } from './DeleteOccupationDialog'
import { useOccupationsStore } from '../store/occupations.store'

export function OccupationsPage() {
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
  } = useOccupationsStore()

  useEffect(() => {
    void fetch()
  }, [fetch])

  const hasFilters =
    !!filters.search || !!filters.status || !!filters.seniority_level

  return (
    <>
      <PageLayout
        title="Occupations"
        description="Define target roles, map required skills, and track your readiness for each position."
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus />
            Add Occupation
          </Button>
        }
      >
        {/* Search + Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput
            value={filters.search}
            onChange={setSearch}
            placeholder="Search occupations…"
            className="w-64"
          />
          <OccupationFilters />
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
            icon={Briefcase}
            title={hasFilters ? 'No occupations match your filters' : 'No occupations yet'}
            description={
              hasFilters
                ? "Try adjusting your search or filters."
                : 'Add a target occupation to map the required skills and track your career readiness.'
            }
            action={
              !hasFilters ? (
                <Button onClick={openCreate}>
                  <Plus />
                  Add your first occupation
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Stats row */}
            <p className="text-xs text-muted-foreground mb-4">
              {total} {total === 1 ? 'occupation' : 'occupations'}
              {hasFilters && ' matching filters'}
            </p>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(occ => (
                <OccupationCard
                  key={occ.id}
                  occupation={occ}
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
      <OccupationForm />
      <DeleteOccupationDialog />
    </>
  )
}
