# Tags Module

## Purpose

The Tags module provides a centralized tagging system that can annotate any entity across CareerOS. Tags are colored, named labels stored in a single `tags` table with a many-to-many bridge table (`entity_tags`) that associates tags to any entity by `entity_type` and `entity_id`. This avoids duplicating tagging logic in every module and enables cross-module tag browsing.

---

## Features

- Global tag management: create, rename, recolor, and delete tags from a central Tags page
- Slugs auto-generated from tag names with uniqueness enforcement
- Default tag color: `#6B7280` (gray)
- Apply tags to any entity via `setEntityTags` (replaces the entire tag set for an entity transactionally)
- Retrieve all tags for a specific entity via `getEntityTags`
- Usage count per tag shown in the tags list
- Tags used by Occupations (confirmed); other modules may also use entity_tags via the same IPC

---

## Database Tables

| Table | Key Columns | Notes |
|---|---|---|
| `tags` | `id`, `name`, `slug` (UNIQUE), `color_hex`, `created_at`, `updated_at` | Slug auto-generated; uniqueness enforced with suffix counter |
| `entity_tags` | `tag_id` → `tags`, `entity_type` (TEXT), `entity_id` (TEXT), PRIMARY KEY (tag_id, entity_type, entity_id) | No FK on entity_id — opaque reference; INSERT OR IGNORE for deduplication |

---

## IPC Channels

```
TAGS
  tags:get-all             — all tags with usage_count
  tags:create              — create tag
  tags:update              — rename or recolor tag
  tags:delete              — hard-delete tag (removes all entity_tags entries too)
  tags:get-entity-tags     — get tags for a specific entity
  tags:set-entity-tags     — replace all tags for a specific entity (transactional)
```

---

## Service Functions

Located at `electron/services/tags/tags.service.ts`.

| Function | Purpose |
|---|---|
| `getAllTags` | SELECT tags with `(SELECT COUNT(*) FROM entity_tags WHERE tag_id = t.id)` subquery |
| `getTagById` | Single tag by id |
| `createTag` | INSERT with auto-generated unique slug; default color `#6B7280` |
| `updateTag` | COALESCE update; re-slugifies if name changes |
| `deleteTag` | Hard DELETE tag (entity_tags CASCADE if FK set — not determined from source whether FK exists) |
| `getEntityTags` | SELECT tags JOIN entity_tags WHERE entity_type = ? AND entity_id = ? |
| `setEntityTags` | Transaction: DELETE existing entity_tags for entity, then INSERT OR IGNORE new ones |
| `slugify(text)` | Lowercase, strip non-word chars, replace spaces with hyphens |
| `uniqueSlug(db, name)` | Generate base slug; append `-2`, `-3`, etc. if taken |

---

## State Management

Store location: `src/features/tags/` (may use component-local state or small Zustand slice)

State shape (inferred):

```typescript
interface TagsState {
  tags: TagWithCount[]
  isLoading: boolean
  isFormOpen: boolean
  editingTagId: string | null

  // Actions
  fetchTags: () => Promise<void>
  createTag: (params: CreateTagParams) => Promise<void>
  updateTag: (id: string, params: UpdateTagParams) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  getEntityTags: (entityType: string, entityId: string) => Promise<TagRow[]>
  setEntityTags: (entityType: string, entityId: string, tagIds: string[]) => Promise<void>
}
```

---

## Data Flow

```mermaid
sequenceDiagram
    participant UI as TagsPage / Any Module
    participant Store as Zustand Store
    participant Preload as contextBridge
    participant IPC as ipcMain
    participant Svc as Tags Service
    participant DB as SQLite

    UI->>Store: fetchTags()
    Store->>Preload: api.tags.getAll()
    Preload->>IPC: invoke('tags:get-all')
    IPC->>Svc: getAllTags(db)
    Svc->>DB: SELECT t.*, (SELECT COUNT(*) FROM entity_tags ...) AS usage_count
    DB-->>Svc: TagWithCount[]
    IPC-->>Store: { success: true, data }
    Store-->>UI: tags[]

    UI->>Store: setEntityTags('occupation', occId, [tagId1, tagId2])
    Store->>Preload: api.tags.setEntityTags('occupation', occId, [tagId1, tagId2])
    Preload->>IPC: invoke('tags:set-entity-tags', 'occupation', occId, [tagId1, tagId2])
    IPC->>Svc: setEntityTags(db, 'occupation', occId, [tagId1, tagId2])
    Svc->>DB: [transaction] DELETE entity_tags; INSERT OR IGNORE 2 rows
    IPC-->>Store: { success: true, data: null }
```

---

## UI Components

Located at `src/features/tags/components/` (inferred — directory observed but file names not individually listed):

| Component | Role |
|---|---|
| Tags list view | Displays all tags with usage count, color swatch, and edit/delete actions |
| Tag form | Create or rename tag with color picker |
| Tag selector | Reusable component used in other module forms (Occupations, etc.) to select tags for an entity |

---

## Dependencies

- **Occupations** — uses `entity_tags` for occupation-level tags (confirmed in occupations.service.ts)
- Any module can use tags via the `tags:get-entity-tags` and `tags:set-entity-tags` channels; adoption per module varies

---

## User Workflow

1. Navigate to **Tags** (`/tags`)
2. Click **New Tag** to create a label with a name and color
3. The slug is auto-generated from the name
4. Assign tags to an entity from that entity's form (e.g., an Occupation's detail page)
5. The tag selector calls `setEntityTags` which atomically replaces the tag set for that entity
6. Return to the Tags page to see usage counts, rename, or delete tags
7. Deleting a tag removes it from all entities

---

## Known Limitations

- `deleteTag` removes the tag from the `tags` table; whether `entity_tags` rows are cascade-deleted depends on whether the FK has ON DELETE CASCADE defined (not confirmed from source)
- The tag system is applied to Occupations; it is not confirmed which other modules actively use tags beyond what is visible in the occupations service
- No search or filter on the Tags page
- No tag merge/consolidation tool (e.g., merge two duplicate tags into one)

---

## Future Roadmap

- Apply tags to Skills, Projects, Notes, Videos for cross-module filtering
- Tag-based filter views on each module's list page
- Tag merge / deduplication tool
- Auto-suggest tags based on entity content
- Tag hierarchies (parent/child relationships)
