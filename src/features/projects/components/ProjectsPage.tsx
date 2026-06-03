import { useEffect } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import { PageLayout } from '@shared/components/layout/PageLayout'
import { EmptyState } from '@shared/components/common/EmptyState'
import { PageLoader } from '@shared/components/common/LoadingSpinner'
import { SearchInput } from '@shared/components/common/SearchInput'
import { Pagination } from '@shared/components/common/Pagination'
import { Button } from '@shared/components/ui/button'
import { ProjectCard } from './ProjectCard'
import { ProjectFilters } from './ProjectFilters'
import { ProjectForm } from './ProjectForm'
import { DeleteProjectDialog } from './DeleteProjectDialog'
import { useProjectsStore } from '../store/projects.store'

export function ProjectsPage() {
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
  } = useProjectsStore()

  useEffect(() => {
    void fetch()
  }, [fetch])

  const hasFilters = !!filters.search || !!filters.status || !!filters.type || filters.is_featured !== null

  return (
    <>
      <PageLayout
        title="Projects"
        description="Document your portfolio projects, tech stack, and outcomes."
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus />
            Add Project
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchInput
            value={filters.search}
            onChange={setSearch}
            placeholder="Search projects…"
            className="w-64"
          />
          <ProjectFilters />
        </div>

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
            icon={FolderOpen}
            title={hasFilters ? 'No projects match your filters' : 'No projects yet'}
            description={
              hasFilters
                ? 'Try adjusting your search or filters.'
                : 'Add your first project to start building your portfolio.'
            }
            action={
              !hasFilters ? (
                <Button onClick={openCreate}>
                  <Plus />
                  Add your first project
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              {total} {total === 1 ? 'project' : 'projects'}
              {hasFilters && ' matching filters'}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={openEdit}
                  onDelete={confirmDelete}
                />
              ))}
            </div>

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

      <ProjectForm />
      <DeleteProjectDialog />
    </>
  )
}
