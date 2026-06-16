# Career Intelligence Module

## Purpose

Career Intelligence is the strategic planning hub of CareerOS. It aggregates data from all other modules to provide a unified view of career readiness, skill progression, study activity, and gap analysis. Users create **career roadmaps** that enumerate the skills, certifications, projects, and milestones required for a target role, then track progress toward those goals through a weighted scoring model.

---

## Features

- Create and manage multiple career roadmaps (e.g., "Cloud Architect", "DevOps Engineer")
- Mark one roadmap as active; the active roadmap drives recommendations
- Attach existing Skills, Certifications, and Projects to a roadmap with importance weighting (critical / important / optional)
- Define milestone checkpoints with optional target dates; toggle completion manually
- Weighted progress score: skills 50%, certifications 25%, projects 15%, milestones 10%
- Estimated months remaining computed from roadmap `estimated_months` and current progress
- Skill Progress tracker — set target levels, confidence scores, weekly hour goals, and track `last_studied_at`
- Study Session log — record study sessions tied to specific skills with duration and notes
- AI Career Coach tab — heuristic readiness score (0–100) based on skill depth, certifications, projects, and experience
- Knowledge Graph visualization (auto-generated from skill associations across modules) — see `knowledge-graph.md` for the independent Knowledge Graph module
- Analytics Dashboard — count totals, level/status distributions, weekly study-hour chart, top-skills-by-progress

---

## Database Tables

| Table | Key Columns | Notes |
|---|---|---|
| `career_roadmaps` | `id`, `title`, `category`, `seniority_level`, `estimated_months`, `is_active` | Soft-delete via `deleted_at` |
| `roadmap_skills` | `id`, `roadmap_id`, `skill_id` (nullable), `skill_name`, `target_level`, `importance`, `order_index` | Joined to `skills` to read current proficiency |
| `roadmap_certifications` | `id`, `roadmap_id`, `certification_id` (nullable), `name`, `issuer`, `importance`, `order_index` | Joined to `certifications` for status |
| `roadmap_projects` | `id`, `roadmap_id`, `project_id` (nullable), `title`, `importance`, `order_index` | Joined to `projects` for status |
| `roadmap_milestones` | `id`, `roadmap_id`, `title`, `description`, `target_date`, `is_completed`, `completed_at`, `order_index` | Toggled individually |
| `skill_progress` | `skill_id` (PK), `target_level`, `confidence_score`, `last_studied_at`, `weekly_goal_hours` | UPSERT pattern; one row per skill |
| `study_sessions` | `id`, `skill_id` (nullable), `title`, `notes`, `duration_minutes`, `session_date` | Updating `skill_progress.last_studied_at` on insert |

**Migration:** `005_career_intelligence`

---

## IPC Channels

```
CAREER_INTELLIGENCE.ROADMAPS
  career:roadmaps:get-all          — list all roadmaps
  career:roadmaps:get-by-id        — detail with skills/certs/projects/milestones/progress
  career:roadmaps:create           — create roadmap
  career:roadmaps:update           — update roadmap metadata
  career:roadmaps:delete           — soft-delete
  career:roadmaps:set-skills       — replace skill list (destructive replace)
  career:roadmaps:set-certifications
  career:roadmaps:set-projects
  career:roadmaps:set-milestones
  career:roadmaps:toggle-milestone — toggle is_completed on a single milestone

CAREER_INTELLIGENCE.SKILL_PROGRESS
  career:skill-progress:get-all    — all skills with progress metadata
  career:skill-progress:upsert     — set target/confidence/goal for a skill

CAREER_INTELLIGENCE.STUDY_SESSIONS
  career:study-sessions:get-all    — 50 most recent sessions
  career:study-sessions:log        — create session + update skill last_studied_at
  career:study-sessions:delete

CAREER_INTELLIGENCE.COACH
  career:coach:get-recommendations — heuristic readiness score and action plan

CAREER_INTELLIGENCE.KNOWLEDGE_GRAPH
  career:knowledge-graph:get       — auto-generated graph from skill associations

CAREER_INTELLIGENCE.ANALYTICS
  career:analytics:get-dashboard   — aggregated totals and distributions
```

---

## Service Functions

Located at `electron/services/career-intelligence/career-intelligence.service.ts`.

| Function | Purpose |
|---|---|
| `getAllRoadmaps` | SELECT all non-deleted roadmaps, ordered by active first |
| `getRoadmapById` | Full detail including joined skills, certs, projects, milestones, computed progress |
| `createRoadmap` | INSERT with nanoid |
| `updateRoadmap` | COALESCE-based partial update |
| `deleteRoadmap` | Soft-delete via `deleted_at` |
| `setRoadmapSkills` | DELETE then INSERT batch; replaces the full skill list |
| `setRoadmapCertifications` | Same pattern |
| `setRoadmapProjects` | Same pattern |
| `setRoadmapMilestones` | Same pattern |
| `toggleMilestone` | UPDATE `is_completed` + `completed_at` |
| `getAllSkillProgress` | JOIN `skills` + `skill_categories` + `skill_progress`; computes `progress_pct` |
| `upsertSkillProgress` | INSERT OR CONFLICT DO UPDATE for `skill_progress` |
| `logStudySession` | INSERT session + upsert `last_studied_at` |
| `getStudySessions` | 50 most recent, joined to skill name |
| `deleteStudySession` | Hard delete |
| `getCoachRecommendations` | Heuristic scoring; accepts optional `roadmapId` for context |
| `getKnowledgeGraph` | Auto-generates nodes and edges from skill/project/cert/video/lab/interview relationships |
| `getAnalyticsDashboard` | Aggregates counts, distributions, weekly hours, top skills |

**Progress computation** (`computeProgressPct`): maps beginner/intermediate/advanced/expert to 1/2/3/4 and returns `(current / target) × 100`, capped at 100.

**Readiness scoring weights** (`getCoachRecommendations`):
- Skills: 45%
- Certifications: 25%
- Projects: 20%
- Experience (years): 10%

---

## State Management

Store: `src/features/career-intelligence/store/career-intelligence.store.ts`

```typescript
interface CareerIntelligenceState {
  roadmaps: CareerRoadmap[]
  activeRoadmap: CareerRoadmapDetail | null
  isLoadingRoadmaps: boolean
  roadmapError: string | null
  isRoadmapFormOpen: boolean
  editingRoadmapId: string | null
  isSubmittingRoadmap: boolean
  deletingRoadmapId: string | null
  isDeletingRoadmap: boolean

  skillProgress: SkillProgressItem[]
  isLoadingSkillProgress: boolean
  editingSkillId: string | null
  isSubmittingSkillProgress: boolean

  studySessions: StudySession[]
  isLoadingStudySessions: boolean
  isSessionFormOpen: boolean
  isSubmittingSession: boolean
  deletingSessionId: string | null

  recommendations: CoachRecommendations | null
  isLoadingRecommendations: boolean

  graphData: KnowledgeGraphData | null
  isLoadingGraph: boolean

  analytics: AnalyticsDashboard | null
  isLoadingAnalytics: boolean
}
```

Notable behaviors:
- On `fetchRoadmaps`, if any roadmap has `is_active === 1`, `fetchActiveRoadmap` is called automatically to populate the detail view
- `submitRoadmap` dispatches create or update based on `editingRoadmapId`
- `submitSession` triggers both `fetchStudySessions` and `fetchSkillProgress` to reflect updated `last_studied_at`

---

## Data Flow

```mermaid
sequenceDiagram
    participant UI as React UI
    participant Store as Zustand Store
    participant Preload as contextBridge
    participant IPC as ipcMain
    participant Svc as CareerIntelligence Service
    participant DB as SQLite

    UI->>Store: fetchRoadmaps()
    Store->>Preload: api.careerIntelligence.roadmaps.getAll()
    Preload->>IPC: ipcRenderer.invoke('career:roadmaps:get-all')
    IPC->>Svc: getAllRoadmaps(db)
    Svc->>DB: SELECT * FROM career_roadmaps WHERE deleted_at IS NULL
    DB-->>Svc: rows
    Svc-->>IPC: CareerRoadmapRow[]
    IPC-->>Preload: { success: true, data }
    Preload-->>Store: result
    Store->>Store: set({ roadmaps }) → if active, fetchActiveRoadmap()
    Store-->>UI: roadmaps, activeRoadmap

    UI->>Store: submitSession(values)
    Store->>Preload: api.careerIntelligence.studySessions.log(values)
    Preload->>IPC: invoke('career:study-sessions:log', values)
    IPC->>Svc: logStudySession(db, params)
    Svc->>DB: INSERT study_sessions; UPDATE skill_progress
    DB-->>Svc: new session row
    IPC-->>Store: { success: true, data }
    Store->>Store: fetchStudySessions() + fetchSkillProgress()
```

---

## UI Components

Located at `src/features/career-intelligence/components/`:

| Component | Role |
|---|---|
| `CareerIntelligencePage.tsx` | Root page with tab bar (Roadmaps, Skill Progress, AI Coach, Analytics, Knowledge Graph) |
| `RoadmapsTab.tsx` | Roadmap list, detail panel, milestone toggling, skills/certs/projects assignment |
| `SkillProgressTab.tsx` | Table of all skills with progress bars, inline editing of target level and weekly goals |
| `AICoachTab.tsx` | Readiness score gauge, breakdown bars, missing skills list, weekly study plan, skill gaps |
| `AnalyticsTab.tsx` | Count cards, bar/distribution charts, study-hours-by-week chart, top skills |
| `KnowledgeGraphTab.tsx` | Auto-generated force-directed graph of skill associations (uses `career:knowledge-graph:get`) |

> Note: `KnowledgeGraphTab` inside Career Intelligence renders the **auto-generated** graph derived from relational joins. The standalone Knowledge Graph module (`/knowledge-graph`) renders the **user-curated** explicit node graph.

---

## Dependencies

- **Skills** — roadmap skills reference `skills` table; skill progress is keyed on `skill_id`
- **Certifications** — roadmap certifications reference `certifications` table
- **Projects** — roadmap projects reference `projects` table
- **Home Labs** — graph edges include skill-lab connections
- **Interview Questions** — graph edges include skill-interview connections
- **Videos** — graph edges include skill-video connections

---

## User Workflow

1. Navigate to **Career Intelligence**
2. Open the **Roadmaps** tab and click **New Roadmap**
3. Fill in title, category (e.g., `it`), seniority level, estimated months; check **Set as Active**
4. Save. Open the roadmap detail to add skills with target proficiency and importance
5. Add required certifications and projects similarly; add milestone checkpoints
6. Switch to **Skill Progress** tab to set weekly hour goals and confidence scores per skill
7. Click **Log Study Session** to record learning activity; select the skill studied
8. Open the **AI Coach** tab to view the heuristic readiness score and weekly study plan
9. Use the **Analytics** tab to review long-term trends

---

## Known Limitations

- The AI Coach is entirely heuristic — no external AI/LLM call is made. Recommendations are derived from database queries only.
- Roadmap skill/cert/project sets are **replaced entirely** on each save (no differential update).
- The auto-generated knowledge graph (in the Analytics tab) is limited to the top 40 skills by connection count.
- No goal-deadline notifications or reminders.
- Study session deletion is a hard delete; no soft-delete.

---

## Future Roadmap

- Integrate Claude API for natural language career advice in the AI Coach tab
- Allow partial skill/cert updates without full list replacement
- Add deadline alerts for roadmap milestones
- Export roadmap as PDF or shareable format
- Allow multiple active roadmaps with priority ranking
- Add SRS card generation from roadmap skill gaps
