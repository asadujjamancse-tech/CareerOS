# Projects Module — Feature Documentation

**Module:** `src/features/projects/`  
**Backend:** `electron/services/projects/`, `electron/ipc/projects.ipc.ts`  
**Status:** Complete

---

## Requirements

| Requirement | Status |
|---|---|
| CRUD (create, read, update, soft-delete) | ✅ |
| Project status (5 states) | ✅ |
| Project type (5 types) | ✅ |
| Start / end dates | ✅ |
| Repository + live URL | ✅ |
| Skills used (M:N junction) | ✅ |
| Project assets (images, screenshots, docs, links) | ✅ |
| Tag associations (polymorphic) | ✅ |
| Lessons learned | ✅ |
| Featured flag | ✅ |
| Full-text search (FTS5) | ✅ |
| Filter by status / type / featured | ✅ |
| Pagination (24/page) | ✅ |

---

## Architecture

```
Renderer                         Main Process
──────────────────────────────   ──────────────────────────────
ProjectsPage                     projects.ipc.ts
  ├── ProjectFilters               ├── projects:get-all
  ├── ProjectCard (×N)             ├── projects:get-by-id
  ├── ProjectForm (Sheet, 3 tabs)  ├── projects:create
  └── DeleteProjectDialog          ├── projects:update
                                   └── projects:delete
useProjectsStore (Zustand)
  └── api.projects.*            project-assets.ipc.ts
                                  ├── project-assets:create
                                  ├── project-assets:delete
                                  └── project-assets:reorder

                                projects.service.ts
                                  ├── getAllProjects()
                                  ├── getProjectById()
                                  ├── createProject()
                                  ├── updateProject()
                                  ├── softDeleteProject()
                                  ├── createProjectAsset()
                                  └── syncProjectSkills()
```

---

## File Structure

```
src/features/projects/
├── types/
│   └── project.types.ts
├── schemas/
│   └── project.schema.ts
├── store/
│   └── projects.store.ts
├── components/
│   ├── ProjectsPage.tsx
│   ├── ProjectCard.tsx
│   ├── ProjectFilters.tsx
│   ├── ProjectForm.tsx          3-tab form: Info / Details / Links & Skills
│   ├── ProjectStatusBadge.tsx
│   └── DeleteProjectDialog.tsx
└── index.ts
```

---

## IPC Channels

| Channel | Input | Output |
|---|---|---|
| `projects:get-all` | `ProjectFilters?` | `IpcResult<PaginatedProjects>` |
| `projects:get-by-id` | `id` | `IpcResult<ProjectDetail>` |
| `projects:create` | `CreateProjectParams` | `IpcResult<ProjectRow>` |
| `projects:update` | `id, params` | `IpcResult<ProjectRow>` |
| `projects:delete` | `id` | `IpcResult<void>` |
| `project-assets:create` | `CreateProjectAssetParams` | `IpcResult<ProjectAssetRow>` |
| `project-assets:delete` | `id` | `IpcResult<void>` |
| `project-assets:reorder` | `projectId, ids[]` | `IpcResult<void>` |

---

## Form Tabs

| Tab | Fields |
|---|---|
| **Info** | Title, Summary, Status, Type, Start/End dates, Featured toggle |
| **Details** | Description, Lessons Learned, Tags |
| **Links & Skills** | Repo URL, Live URL, Skills Used (multi-select) |

---

## Testing Strategy

### Unit Tests

```
tests/unit/services/projects.service.test.ts
  ✓ createProject() generates unique slug
  ✓ createProject() links skill_ids via project_skills
  ✓ updateProject() updates slug when title changes
  ✓ softDeleteProject() sets deleted_at
  ✓ getAllProjects() excludes soft-deleted rows
  ✓ createProjectAsset() auto-assigns order_index
  ✓ reorderProjectAssets() updates order_index correctly
```

### Integration Tests

```
tests/integration/projects.ipc.test.ts
  ✓ projects:create returns project with correct fields
  ✓ projects:get-by-id returns ProjectDetail with assets and skills
  ✓ projects:update changes fields
  ✓ projects:delete soft-deletes
  ✓ project-assets:create adds asset to project
  ✓ project-assets:reorder updates order
```

### E2E Tests

```
tests/e2e/projects.spec.ts
  ✓ Empty state on first load
  ✓ Add project form opens with 3 tabs
  ✓ Title validation shows error
  ✓ Created project appears in grid
  ✓ Skills can be linked via Links & Skills tab
  ✓ Featured star appears on featured projects
  ✓ Status filter narrows grid
  ✓ Search finds projects by title
  ✓ Delete dialog confirms before removing
```
