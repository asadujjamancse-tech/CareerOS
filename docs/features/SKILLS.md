# Skills Library — Feature Documentation

**Module:** `src/features/skills/`  
**Backend:** `electron/services/skills/`, `electron/ipc/skills.ipc.ts`  
**Status:** Complete

---

## Requirements

| Requirement | Status |
|---|---|
| CRUD (create, read, update, soft-delete) | ✅ |
| Skill categories (hierarchical) | ✅ |
| Proficiency levels (4 tiers) | ✅ |
| Learning status tracking | ✅ |
| Tag associations (polymorphic) | ✅ |
| Related occupations (read-only) | ✅ |
| Related videos (read-only) | ✅ |
| Full-text search (FTS5) | ✅ |
| Filter by category / level / status | ✅ |
| Pagination (24/page) | ✅ |
| Public/private flag | ✅ |
| Years of experience | ✅ |

---

## Architecture

```
Renderer (React)                  Main Process (Node.js)
────────────────────────────      ──────────────────────────────
SkillsPage                        skills.ipc.ts
  ├── SkillFilters                  ├── skills:get-all
  ├── SkillCard (×N)                ├── skills:get-by-id
  ├── SkillForm (Sheet)             ├── skills:create
  └── DeleteSkillDialog             ├── skills:update
                                    └── skills:delete
useSkillsStore (Zustand)
  └── api.skills.*              skills.service.ts
                                  ├── getAllSkills()
useCategoriesStore (Zustand)      ├── getSkillById()
  └── api.skillCategories.*       ├── createSkill()
                                  ├── updateSkill()
                                  ├── softDeleteSkill()
                                  └── syncTags()
```

---

## File Structure

```
src/features/skills/
├── types/
│   └── skill.types.ts          Entity interfaces, filter types
├── schemas/
│   └── skill.schema.ts         Zod form schema + defaults
├── store/
│   ├── skills.store.ts         Zustand store (list, CRUD, UI state)
│   └── categories.store.ts     Zustand store (skill categories)
├── components/
│   ├── SkillsPage.tsx          Main page — orchestrates all sub-components
│   ├── SkillCard.tsx           Card in the grid with edit/delete buttons
│   ├── SkillFilters.tsx        Category / level / status dropdowns
│   ├── SkillForm.tsx           Sheet form for create + edit
│   ├── DeleteSkillDialog.tsx   Confirm-delete modal
│   ├── SkillLevelBadge.tsx     Coloured level badge
│   └── SkillStatusBadge.tsx    Coloured status badge
└── index.ts                    Public barrel exports
```

---

## IPC Channels

| Channel | Input | Output |
|---|---|---|
| `skills:get-all` | `SkillFilters?` | `IpcResult<PaginatedSkills>` |
| `skills:get-by-id` | `id: string` | `IpcResult<SkillDetail>` |
| `skills:create` | `CreateSkillParams` | `IpcResult<SkillRow>` |
| `skills:update` | `id, UpdateSkillParams` | `IpcResult<SkillRow>` |
| `skills:delete` | `id: string` | `IpcResult<void>` |
| `skill-categories:get-all` | — | `IpcResult<SkillCategory[]>` |
| `skill-categories:create` | `params` | `IpcResult<SkillCategory>` |
| `skill-categories:update` | `id, params` | `IpcResult<SkillCategory>` |
| `skill-categories:delete` | `id` | `IpcResult<void>` |

---

## Data Model

```
skills
  id                TEXT PK (nanoid)
  name              TEXT NOT NULL
  slug              TEXT UNIQUE
  description       TEXT
  category_id       TEXT FK → skill_categories
  proficiency_level TEXT  CHECK (beginner|intermediate|advanced|expert)
  status            TEXT  CHECK (learning|practicing|proficient|mastered)
  years_experience  REAL  DEFAULT 0
  notes             TEXT
  is_public         INT   CHECK (0|1) DEFAULT 1
  created_at        TEXT  ISO 8601
  updated_at        TEXT  ISO 8601
  deleted_at        TEXT  NULL = not deleted (soft delete)

skill_categories
  id          TEXT PK (nanoid) -- 10 seeded defaults
  name        TEXT NOT NULL
  color_hex   TEXT DEFAULT '#6B7280'
  icon        TEXT             -- Lucide icon name
  parent_id   TEXT FK → skill_categories (self)
  order_index INT

entity_tags (polymorphic)
  tag_id      TEXT FK → tags
  entity_type TEXT CHECK ('skill'|...)
  entity_id   TEXT
  PK (tag_id, entity_type, entity_id)
```

---

## Search

The skills FTS5 index (`skills_fts`) covers: `name`, `description`, `notes`.

Query format: each word becomes `"word"*` (prefix match). Results ranked by BM25.

When `search` filter is set, the service uses `searchSkillsFts()` which queries the FTS index first, then joins back to the main table for additional filter conditions.

---

## Testing Strategy

### Unit Tests (Vitest)

```
tests/unit/services/skills.service.test.ts
  ✓ createSkill() generates unique slug
  ✓ createSkill() handles duplicate names with counter suffix
  ✓ updateSkill() updates slug when name changes
  ✓ softDeleteSkill() sets deleted_at, does not hard-delete
  ✓ getAllSkills() excludes soft-deleted rows
  ✓ getAllSkills() filters by category_id, proficiency_level, status
  ✓ syncTags() replaces all entity_tags for a skill
  ✓ searchSkillsFts() returns ranked FTS results

tests/unit/schemas/skill.schema.test.ts
  ✓ validates name min/max length
  ✓ requires category_id
  ✓ coerces years_experience to number
  ✓ rejects invalid proficiency_level enum
```

### Integration Tests

```
tests/integration/skills.ipc.test.ts
  ✓ skills:create returns created skill
  ✓ skills:create returns VALIDATION error for missing name
  ✓ skills:get-by-id returns SkillDetail with tags and related occupations
  ✓ skills:update changes fields and preserves untouched fields
  ✓ skills:delete soft-deletes and excludes from get-all
  ✓ skills:get-all paginates correctly
  ✓ skills:get-all filters by category
```

### E2E Tests (Playwright)

```
tests/e2e/skills.spec.ts
  ✓ Shows empty state on first load
  ✓ Add skill form opens on "Add Skill" click
  ✓ Form validates required fields before submitting
  ✓ Newly created skill appears in the grid
  ✓ Edit form pre-populates with existing values
  ✓ Delete dialog prompts for confirmation
  ✓ Deleted skill disappears from grid
  ✓ Search filters grid in real time
  ✓ Category filter narrows results
```
