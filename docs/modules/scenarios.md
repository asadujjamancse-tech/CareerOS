# Scenarios Module

## Purpose

The Scenarios module provides structured, step-by-step practice scenarios for IT professionals. A scenario presents a realistic context story (e.g., "You are the MSP engineer on call — a client's Active Directory is unreachable") along with a sequence of numbered steps to work through. Users record attempts, track progress through steps, capture lessons learned, and receive a score on completion. The module also includes **Feynman Entries** — a learning technique where users explain a topic in their own words to identify gaps.

---

## Features

- Scenarios organized by category (IT support, MSP, cloud, interview, troubleshooting, Active Directory, Windows Server, networking, Microsoft 365, Azure, cybersecurity, Hyper-V, custom)
- Difficulty levels: beginner, medium, advanced, expert
- Each scenario has a context story, success criteria, optional hints, a model solution, and estimated duration
- Numbered steps with instructions, expected actions, optional hints, and checkpoint flags
- Multiple attempt tracking per scenario: in-progress, completed, or abandoned
- Per-attempt metrics: steps completed, time spent (minutes), notes, lessons learned, score (0–100)
- Aggregate stats: best score, average completion time, total attempts per scenario
- Global stats: total active scenarios, unique scenarios completed, average score across all attempts
- **Feynman Entries**: record a plain-language explanation of any topic, identify gaps, write a revised explanation, and rate understanding (0–100)
- Soft-delete for scenarios (sets `is_active = 0`); hard-delete for steps and Feynman entries
- Scenarios stored with tags as a JSON array (`["azure", "troubleshooting"]`)

---

## Database Tables

| Table | Key Columns | Notes |
|---|---|---|
| `learning_scenarios` | `id` (`scn_` prefix), `title`, `category`, `difficulty`, `estimated_minutes`, `context_story`, `success_criteria`, `hints`, `solution`, `tags` (JSON), `is_active` | Soft-delete via `is_active = 0` |
| `scenario_steps` | `id` (`step_` prefix), `scenario_id`, `step_number`, `title`, `instruction`, `expected_action`, `hint`, `is_checkpoint` | Hard delete |
| `scenario_attempts` | `id` (`att_` prefix), `scenario_id`, `status`, `steps_completed`, `total_steps`, `notes`, `lessons_learned`, `time_spent_min`, `score`, `started_at`, `completed_at` | No FK cascade; attempts persist even if scenario is deactivated |
| `feynman_entries` | `id` (`feyn_` prefix), `topic`, `entity_type`, `entity_id`, `explanation`, `gaps_identified`, `revised_explanation`, `understanding_score` | Can be linked to any entity or standalone |

---

## IPC Channels

```
SCENARIOS
  scenarios:get-all              — list all active scenarios with attempt stats (optional category/difficulty filter)
  scenarios:get-by-id            — single scenario with stats
  scenarios:get-steps            — ordered steps for a scenario
  scenarios:create               — create scenario
  scenarios:update               — update scenario fields
  scenarios:delete               — soft-delete (is_active = 0)
  scenarios:get-stats            — global stats

SCENARIOS.STEPS
  scenarios:steps:add            — add a step to a scenario
  scenarios:steps:update         — update step fields
  scenarios:steps:delete         — hard-delete step

SCENARIOS.ATTEMPTS
  scenarios:attempts:start       — create new attempt record
  scenarios:attempts:update      — update attempt (status, steps, notes, score)
  scenarios:attempts:get-by-scenario — list all attempts for a scenario

FEYNMAN
  feynman:get-all                — all Feynman entries
  feynman:create                 — create entry
  feynman:update                 — update explanation, gaps, revised explanation, score
  feynman:delete                 — hard-delete entry
```

---

## Service Functions

Located at `electron/services/scenarios/scenarios.service.ts`.

| Function | Purpose |
|---|---|
| `getAllScenarios` | SELECT with LEFT JOIN to `scenario_attempts`; aggregates `total_attempts`, `completed_attempts`, `best_score`, `avg_time_min`, `step_count` |
| `getScenarioById` | Same aggregation for a single scenario |
| `getScenarioSteps` | SELECT steps ORDER BY `step_number` |
| `createScenario` | INSERT; tags serialized as `JSON.stringify(tags)` |
| `updateScenario` | Dynamic SET builder; tags re-serialized if provided |
| `deleteScenario` | UPDATE `is_active = 0` (soft-delete) |
| `addStep` | INSERT step with `step_` prefixed id |
| `updateStep` | Dynamic SET builder for step fields |
| `deleteStep` | Hard DELETE |
| `startAttempt` | INSERT attempt; captures `total_steps` count at start time |
| `updateAttempt` | Dynamic SET; sets `completed_at` when status becomes `completed` or `abandoned` |
| `getAttemptsByScenario` | SELECT all attempts for a scenario, DESC by `started_at` |
| `getScenarioStats` | COUNT queries for totals and AVG score |
| `getAllFeynmanEntries` | SELECT all Feynman entries |
| `createFeynmanEntry` | INSERT with `feyn_` prefixed id |
| `updateFeynmanEntry` | Dynamic SET for explanation, gaps, revised explanation, score |
| `deleteFeynmanEntry` | Hard DELETE |

---

## State Management

Store location: `src/features/scenarios/store/`

State shape (inferred from component usage):

```typescript
interface ScenariosState {
  scenarios: ScenarioWithStats[]
  activeScenario: ScenarioWithStats | null
  steps: ScenarioStepRow[]
  attempts: ScenarioAttemptRow[]
  stats: GlobalScenarioStats | null
  feynmanEntries: FeynmanRow[]
  isLoading: boolean
  activeAttempt: ScenarioAttemptRow | null

  // Actions
  fetchScenarios: (category?: ScenarioCategory, difficulty?: ScenarioDifficulty) => Promise<void>
  openScenario: (id: string) => Promise<void>
  createScenario: (params: CreateScenarioParams) => Promise<void>
  updateScenario: (id: string, params: Partial<CreateScenarioParams>) => Promise<void>
  deleteScenario: (id: string) => Promise<void>
  addStep: (params: CreateStepParams) => Promise<void>
  updateStep: (id: string, params: Partial<Omit<CreateStepParams, 'scenario_id'>>) => Promise<void>
  deleteStep: (id: string) => Promise<void>
  startAttempt: (scenarioId: string) => Promise<void>
  updateAttempt: (id: string, updates: AttemptUpdates) => Promise<void>
  fetchAttempts: (scenarioId: string) => Promise<void>
  fetchStats: () => Promise<void>
  fetchFeynmanEntries: () => Promise<void>
  createFeynmanEntry: (params: CreateFeynmanParams) => Promise<void>
  updateFeynmanEntry: (id: string, params: UpdateFeynmanParams) => Promise<void>
  deleteFeynmanEntry: (id: string) => Promise<void>
}
```

---

## Data Flow

```mermaid
sequenceDiagram
    participant UI as ScenarioCenterPage
    participant Store as Zustand Store
    participant Preload as contextBridge
    participant IPC as ipcMain
    participant Svc as Scenarios Service
    participant DB as SQLite

    UI->>Store: fetchScenarios()
    Store->>Preload: api.scenarios.getAll()
    Preload->>IPC: invoke('scenarios:get-all')
    IPC->>Svc: getAllScenarios(db)
    Svc->>DB: SELECT with GROUP BY, aggregate attempt stats
    DB-->>Svc: ScenarioWithStats[]
    IPC-->>Store: { success: true, data }
    Store-->>UI: scenarios[]

    UI->>Store: startAttempt(scenarioId)
    Store->>Preload: api.scenarios.attempts.start(scenarioId)
    Preload->>IPC: invoke('scenarios:attempts:start', id)
    IPC->>Svc: startAttempt(db, scenarioId)
    Svc->>DB: COUNT scenario_steps; INSERT scenario_attempts
    IPC-->>Store: { success: true, data: attempt }
    Store->>Store: set({ activeAttempt })
    Store-->>UI: attempt tracking begins
```

---

## UI Components

Located at `src/features/scenarios/components/`:

| Component | Role |
|---|---|
| `ScenarioCenterPage.tsx` | Root page; lists scenarios with filter by category/difficulty, opens scenario detail, shows global stats, and lists Feynman entries |

---

## Dependencies

- No other module depends on Scenarios
- `feynman_entries.entity_type` + `entity_id` can reference entities from Skills, Projects, Videos, Notes, etc. (opaque link — no FK enforcement)

---

## User Workflow

1. Navigate to **Scenario Center** (`/scenario-center`)
2. Browse scenarios filtered by category (e.g., "Azure") or difficulty
3. Open a scenario to read the context story and success criteria
4. Click **Start Attempt** to begin; a timer or manual time entry tracks duration
5. Work through each step in the step list; mark steps as completed
6. Record notes and lessons learned as you go
7. When done, submit the attempt with an optional self-score (0–100) and completion status
8. Review attempt history and best scores per scenario
9. Use **Feynman Entries** to solidify learning: write a plain-language explanation, identify gaps, and revise

---

## Known Limitations

- No built-in timer — time tracking is manual entry
- The `score` field is self-assigned; there is no automated scoring engine
- Scenarios can be created by the user but there is no curated scenario library shipped with the application
- Soft-delete hides scenarios but all historical attempt data is retained, which may cause confusion if a deactivated scenario is later searched
- No import of scenarios from external sources (e.g., from the community)

---

## Future Roadmap

- Built-in timer with pause/resume for accurate time tracking
- AI-generated scenario creation from skill and roadmap data
- Community scenario library (import/export JSON)
- Automated step verification where possible (e.g., running a PowerShell command and checking output)
- Integration with Feynman entries — auto-suggest a Feynman topic after completing a scenario
