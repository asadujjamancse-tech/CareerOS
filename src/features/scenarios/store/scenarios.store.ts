import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type {
  Scenario, ScenarioStep, ScenarioAttempt,
  ScenarioCategory, ScenarioDifficulty, ScenarioFormData,
} from '../types/scenarios.types'

interface ScenariosState {
  scenarios: Scenario[]
  activeScenario: Scenario | null
  activeSteps: ScenarioStep[]
  activeAttempt: ScenarioAttempt | null
  attempts: ScenarioAttempt[]
  isLoading: boolean
  error: string | null

  // UI state
  view: 'list' | 'detail' | 'running'
  hintsVisible: boolean
  solutionVisible: boolean
  currentStepIndex: number
  sessionNotes: string
  sessionLessons: string
  elapsedMinutes: number

  filters: { category: ScenarioCategory | undefined; difficulty: ScenarioDifficulty | undefined }

  // Form state (create / edit)
  isFormOpen: boolean
  editingScenario: Scenario | null
  isSubmitting: boolean
  formError: string | null

  // Delete state
  deletingScenarioId: string | null
  isDeleting: boolean

  // ── List actions ─────────────────────────────────────────────────────────────
  fetchAll: (category?: ScenarioCategory | undefined, difficulty?: ScenarioDifficulty | undefined) => Promise<void>
  setFilters: (f: { category?: ScenarioCategory | undefined; difficulty?: ScenarioDifficulty | undefined }) => void

  // ── Detail / run actions ──────────────────────────────────────────────────────
  openScenario: (id: string) => Promise<void>
  closeScenario: () => void
  startAttempt: () => Promise<void>
  advanceStep: () => Promise<void>
  completeAttempt: (score: number) => Promise<void>
  abandonAttempt: () => Promise<void>
  toggleHints: () => void
  toggleSolution: () => void
  setSessionNotes: (v: string) => void
  setSessionLessons: (v: string) => void
  tickTimer: () => void

  // ── CRUD actions ─────────────────────────────────────────────────────────────
  openCreateScenario: () => void
  openEditScenario: (scenario: Scenario) => void
  closeScenarioForm: () => void
  submitScenario: (data: ScenarioFormData) => Promise<void>

  confirmDeleteScenario: (id: string) => void
  cancelDeleteScenario: () => void
  executeDeleteScenario: () => Promise<void>

  // ── Step actions (within detail view) ────────────────────────────────────────
  addScenarioStep: (params: {
    title: string; instruction: string; hint?: string; expected_action?: string
  }) => Promise<void>
  updateScenarioStep: (stepId: string, params: {
    title?: string; instruction?: string; hint?: string; expected_action?: string
  }) => Promise<void>
  deleteScenarioStep: (stepId: string) => Promise<void>
}

async function refreshActiveSteps(get: () => ScenariosState, set: (s: Partial<ScenariosState>) => void) {
  const { activeScenario } = get()
  if (!activeScenario) return
  const [stepsRes, scenarioRes] = await Promise.all([
    api.scenarios.getSteps(activeScenario.id),
    api.scenarios.getById(activeScenario.id),
  ]) as [{ success: boolean; data?: unknown }, { success: boolean; data?: unknown }]
  const updates: Partial<ScenariosState> = {}
  if (stepsRes.success) updates.activeSteps = stepsRes.data as ScenarioStep[]
  if (scenarioRes.success) updates.activeScenario = scenarioRes.data as Scenario
  set(updates)
}

export const useScenariosStore = create<ScenariosState>((set, get) => ({
  scenarios: [],
  activeScenario: null,
  activeSteps: [],
  activeAttempt: null,
  attempts: [],
  isLoading: false,
  error: null,
  view: 'list',
  hintsVisible: false,
  solutionVisible: false,
  currentStepIndex: 0,
  sessionNotes: '',
  sessionLessons: '',
  elapsedMinutes: 0,
  filters: { category: undefined, difficulty: undefined },
  isFormOpen: false,
  editingScenario: null,
  isSubmitting: false,
  formError: null,
  deletingScenarioId: null,
  isDeleting: false,

  // ── List ──────────────────────────────────────────────────────────────────────
  fetchAll: async (category, difficulty) => {
    set({ isLoading: true, error: null })
    const res = await api.scenarios.getAll(category, difficulty) as { success: boolean; data?: Scenario[]; error?: string }
    if (res.success && res.data) set({ scenarios: res.data, isLoading: false })
    else set({ error: res.error ?? 'Failed', isLoading: false })
  },

  setFilters: (f) => {
    const newFilters = { ...get().filters, ...f }
    set({ filters: newFilters })
    void get().fetchAll(newFilters.category, newFilters.difficulty)
  },

  // ── Detail / run ──────────────────────────────────────────────────────────────
  openScenario: async (id) => {
    const res = await api.scenarios.getById(id) as { success: boolean; data?: Scenario }
    const stepsRes = await api.scenarios.getSteps(id) as { success: boolean; data?: ScenarioStep[] }
    const attemptsRes = await api.scenarios.attempts.getByScenario(id) as { success: boolean; data?: ScenarioAttempt[] }
    set({
      activeScenario: res.data ?? null,
      activeSteps: stepsRes.data ?? [],
      attempts: attemptsRes.data ?? [],
      view: 'detail',
      hintsVisible: false,
      solutionVisible: false,
    })
  },

  closeScenario: () => set({ activeScenario: null, activeSteps: [], activeAttempt: null, view: 'list', attempts: [] }),

  startAttempt: async () => {
    const { activeScenario } = get()
    if (!activeScenario) return
    const res = await api.scenarios.attempts.start(activeScenario.id) as { success: boolean; data?: ScenarioAttempt }
    if (res.success && res.data) {
      set({ activeAttempt: res.data, view: 'running', currentStepIndex: 0, elapsedMinutes: 0, sessionNotes: '', sessionLessons: '' })
    }
  },

  advanceStep: async () => {
    const { activeAttempt, currentStepIndex, elapsedMinutes, sessionNotes } = get()
    if (!activeAttempt) return
    const nextIndex = currentStepIndex + 1
    set({ currentStepIndex: nextIndex })
    const res = await api.scenarios.attempts.update(activeAttempt.id, {
      steps_completed: nextIndex,
      time_spent_min: elapsedMinutes,
      notes: sessionNotes || null,
    }) as { success: boolean; data?: ScenarioAttempt }
    if (res.success && res.data) set({ activeAttempt: res.data })
  },

  completeAttempt: async (score) => {
    const { activeAttempt, elapsedMinutes, sessionNotes, sessionLessons, activeScenario } = get()
    if (!activeAttempt) return
    await api.scenarios.attempts.update(activeAttempt.id, {
      status: 'completed',
      steps_completed: get().activeSteps.length,
      time_spent_min: elapsedMinutes,
      notes: sessionNotes || null,
      lessons_learned: sessionLessons || null,
      score,
    })
    if (activeScenario) await get().openScenario(activeScenario.id)
    set({ activeAttempt: null, view: 'detail' })
  },

  abandonAttempt: async () => {
    const { activeAttempt, elapsedMinutes, activeScenario } = get()
    if (!activeAttempt) return
    await api.scenarios.attempts.update(activeAttempt.id, { status: 'abandoned', time_spent_min: elapsedMinutes })
    if (activeScenario) await get().openScenario(activeScenario.id)
    set({ activeAttempt: null, view: 'detail' })
  },

  toggleHints: () => set(s => ({ hintsVisible: !s.hintsVisible })),
  toggleSolution: () => set(s => ({ solutionVisible: !s.solutionVisible })),
  setSessionNotes: (v) => set({ sessionNotes: v }),
  setSessionLessons: (v) => set({ sessionLessons: v }),
  tickTimer: () => set(s => ({ elapsedMinutes: s.elapsedMinutes + 1 })),

  // ── CRUD ──────────────────────────────────────────────────────────────────────
  openCreateScenario: () => set({ isFormOpen: true, editingScenario: null, formError: null }),
  openEditScenario: (scenario) => set({ isFormOpen: true, editingScenario: scenario, formError: null }),
  closeScenarioForm: () => set({ isFormOpen: false, editingScenario: null, formError: null }),

  submitScenario: async (data) => {
    const { editingScenario, activeScenario } = get()
    set({ isSubmitting: true, formError: null })
    try {
      const payload = {
        title: data.title,
        description: data.description || null,
        category: data.category,
        difficulty: data.difficulty,
        estimated_minutes: data.estimated_minutes,
        context_story: data.context_story,
        success_criteria: data.success_criteria,
        solution: data.solution || null,
        hints: data.hints.length > 0 ? JSON.stringify(data.hints) : null,
        tags: data.tags,
      }
      const r = (editingScenario
        ? await api.scenarios.update(editingScenario.id, payload)
        : await api.scenarios.create(payload)) as { success: boolean; error?: string }
      if (r.success) {
        set({ isFormOpen: false, editingScenario: null })
        const { filters } = get()
        await get().fetchAll(filters.category, filters.difficulty)
        if (editingScenario && activeScenario?.id === editingScenario.id) {
          await get().openScenario(editingScenario.id)
        }
      } else {
        set({ formError: r.error ?? 'Failed to save scenario' })
      }
    } catch {
      set({ formError: 'An unexpected error occurred' })
    } finally {
      set({ isSubmitting: false })
    }
  },

  confirmDeleteScenario: (id) => set({ deletingScenarioId: id }),
  cancelDeleteScenario: () => set({ deletingScenarioId: null }),

  executeDeleteScenario: async () => {
    const { deletingScenarioId, activeScenario } = get()
    if (!deletingScenarioId) return
    set({ isDeleting: true })
    try {
      const r = await api.scenarios.delete(deletingScenarioId) as { success: boolean }
      if (r.success) {
        set({ deletingScenarioId: null })
        if (activeScenario?.id === deletingScenarioId) {
          set({ activeScenario: null, activeSteps: [], attempts: [], view: 'list' })
        }
        const { filters } = get()
        await get().fetchAll(filters.category, filters.difficulty)
      }
    } finally {
      set({ isDeleting: false })
    }
  },

  // ── Steps ─────────────────────────────────────────────────────────────────────
  addScenarioStep: async ({ title, instruction, hint, expected_action }) => {
    const { activeScenario, activeSteps } = get()
    if (!activeScenario) return
    await api.scenarios.steps.add({
      scenario_id: activeScenario.id,
      step_number: activeSteps.length + 1,
      title,
      instruction,
      hint: hint || null,
      expected_action: expected_action || null,
      is_checkpoint: false,
    })
    await refreshActiveSteps(get, set as (s: Partial<ScenariosState>) => void)
  },

  updateScenarioStep: async (stepId, params) => {
    await api.scenarios.steps.update(stepId, params)
    await refreshActiveSteps(get, set as (s: Partial<ScenariosState>) => void)
  },

  deleteScenarioStep: async (stepId) => {
    await api.scenarios.steps.delete(stepId)
    await refreshActiveSteps(get, set as (s: Partial<ScenariosState>) => void)
  },
}))
