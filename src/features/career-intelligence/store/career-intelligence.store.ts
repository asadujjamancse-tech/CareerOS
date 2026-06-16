import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type {
  CareerRoadmap,
  CareerRoadmapDetail,
  SkillProgressItem,
  StudySession,
  CoachRecommendations,
  KnowledgeGraphData,
  AnalyticsDashboard,
  CreateRoadmapInput,
  RoadmapSkillInput,
  RoadmapCertInput,
  RoadmapProjectInput,
  MilestoneInput,
  UpsertSkillProgressInput,
  LogStudySessionInput,
} from '@shared/types/ipc.types'

interface CareerIntelligenceState {
  // ── Roadmaps ───────────────────────────────────────────────────────────────
  roadmaps: CareerRoadmap[]
  activeRoadmap: CareerRoadmapDetail | null
  isLoadingRoadmaps: boolean
  roadmapError: string | null
  isRoadmapFormOpen: boolean
  editingRoadmapId: string | null
  isSubmittingRoadmap: boolean
  deletingRoadmapId: string | null
  isDeletingRoadmap: boolean

  // ── Skill Progress ─────────────────────────────────────────────────────────
  skillProgress: SkillProgressItem[]
  isLoadingSkillProgress: boolean
  skillProgressError: string | null
  editingSkillId: string | null
  isSubmittingSkillProgress: boolean

  // ── Study Sessions ─────────────────────────────────────────────────────────
  studySessions: StudySession[]
  isLoadingStudySessions: boolean
  isSessionFormOpen: boolean
  isSubmittingSession: boolean
  deletingSessionId: string | null

  // ── Coach ──────────────────────────────────────────────────────────────────
  recommendations: CoachRecommendations | null
  isLoadingRecommendations: boolean
  recommendationsError: string | null

  // ── Knowledge Graph ────────────────────────────────────────────────────────
  graphData: KnowledgeGraphData | null
  isLoadingGraph: boolean
  graphError: string | null

  // ── Analytics ──────────────────────────────────────────────────────────────
  analytics: AnalyticsDashboard | null
  isLoadingAnalytics: boolean
  analyticsError: string | null

  // ── Actions ────────────────────────────────────────────────────────────────

  // Roadmaps
  fetchRoadmaps: () => Promise<void>
  fetchActiveRoadmap: (id: string) => Promise<void>
  setActiveRoadmapId: (id: string | null) => void
  openCreateRoadmap: () => void
  openEditRoadmap: (id: string) => void
  closeRoadmapForm: () => void
  submitRoadmap: (values: CreateRoadmapInput) => Promise<boolean>
  confirmDeleteRoadmap: (id: string) => void
  cancelDeleteRoadmap: () => void
  executeDeleteRoadmap: () => Promise<boolean>
  toggleMilestone: (milestoneId: string, completed: boolean) => Promise<void>
  setRoadmapSkills: (roadmapId: string, skills: RoadmapSkillInput[]) => Promise<boolean>
  setRoadmapCerts: (roadmapId: string, certs: RoadmapCertInput[]) => Promise<boolean>
  setRoadmapProjects: (roadmapId: string, projects: RoadmapProjectInput[]) => Promise<boolean>
  setRoadmapMilestones: (roadmapId: string, milestones: MilestoneInput[]) => Promise<boolean>

  // Skill Progress
  fetchSkillProgress: () => Promise<void>
  openEditSkillProgress: (skillId: string) => void
  closeSkillProgressEdit: () => void
  submitSkillProgress: (skillId: string, values: UpsertSkillProgressInput) => Promise<boolean>

  // Study Sessions
  fetchStudySessions: () => Promise<void>
  openSessionForm: () => void
  closeSessionForm: () => void
  submitSession: (values: LogStudySessionInput) => Promise<boolean>
  confirmDeleteSession: (id: string) => void
  cancelDeleteSession: () => void
  executeDeleteSession: () => Promise<boolean>

  // Coach
  fetchRecommendations: (roadmapId?: string) => Promise<void>

  // Knowledge Graph
  fetchGraph: () => Promise<void>

  // Analytics
  fetchAnalytics: () => Promise<void>
}

export const useCareerIntelligenceStore = create<CareerIntelligenceState>((set, get) => ({
  // ── Initial State ──────────────────────────────────────────────────────────
  roadmaps: [],
  activeRoadmap: null,
  isLoadingRoadmaps: false,
  roadmapError: null,
  isRoadmapFormOpen: false,
  editingRoadmapId: null,
  isSubmittingRoadmap: false,
  deletingRoadmapId: null,
  isDeletingRoadmap: false,

  skillProgress: [],
  isLoadingSkillProgress: false,
  skillProgressError: null,
  editingSkillId: null,
  isSubmittingSkillProgress: false,

  studySessions: [],
  isLoadingStudySessions: false,
  isSessionFormOpen: false,
  isSubmittingSession: false,
  deletingSessionId: null,

  recommendations: null,
  isLoadingRecommendations: false,
  recommendationsError: null,

  graphData: null,
  isLoadingGraph: false,
  graphError: null,

  analytics: null,
  isLoadingAnalytics: false,
  analyticsError: null,

  // ── Roadmap Actions ────────────────────────────────────────────────────────

  async fetchRoadmaps() {
    set({ isLoadingRoadmaps: true, roadmapError: null })
    try {
      const result = await api.careerIntelligence.roadmaps.getAll()
      if (result.success) {
        set({ roadmaps: result.data })
        const active = (result.data).find(r => r.is_active === 1)
        if (active) {
          void get().fetchActiveRoadmap(active.id)
        }
      } else {
        set({ roadmapError: result.error })
      }
    } catch {
      set({ roadmapError: 'Failed to load roadmaps' })
    } finally {
      set({ isLoadingRoadmaps: false })
    }
  },

  async fetchActiveRoadmap(id) {
    try {
      const result = await api.careerIntelligence.roadmaps.getById(id)
      if (result.success) {
        set({ activeRoadmap: result.data })
      }
    } catch {
      // non-fatal
    }
  },

  setActiveRoadmapId(id) {
    if (!id) {
      set({ activeRoadmap: null })
      return
    }
    void get().fetchActiveRoadmap(id)
  },

  openCreateRoadmap() {
    set({ isRoadmapFormOpen: true, editingRoadmapId: null })
  },

  openEditRoadmap(id) {
    set({ isRoadmapFormOpen: true, editingRoadmapId: id })
  },

  closeRoadmapForm() {
    set({ isRoadmapFormOpen: false, editingRoadmapId: null })
  },

  async submitRoadmap(values) {
    set({ isSubmittingRoadmap: true })
    const { editingRoadmapId } = get()
    try {
      const result = editingRoadmapId
        ? await api.careerIntelligence.roadmaps.update(editingRoadmapId, values)
        : await api.careerIntelligence.roadmaps.create(values)
      if (result.success) {
        set({ isRoadmapFormOpen: false, editingRoadmapId: null })
        void get().fetchRoadmaps()
        return true
      }
      return false
    } catch {
      return false
    } finally {
      set({ isSubmittingRoadmap: false })
    }
  },

  confirmDeleteRoadmap(id) {
    set({ deletingRoadmapId: id })
  },

  cancelDeleteRoadmap() {
    set({ deletingRoadmapId: null })
  },

  async executeDeleteRoadmap() {
    const { deletingRoadmapId } = get()
    if (!deletingRoadmapId) return false
    set({ isDeletingRoadmap: true })
    try {
      const result = await api.careerIntelligence.roadmaps.delete(deletingRoadmapId)
      if (result.success) {
        set({ deletingRoadmapId: null, activeRoadmap: null })
        void get().fetchRoadmaps()
        return true
      }
      return false
    } catch {
      return false
    } finally {
      set({ isDeletingRoadmap: false })
    }
  },

  async toggleMilestone(milestoneId, completed) {
    await api.careerIntelligence.roadmaps.toggleMilestone(milestoneId, completed)
    const { activeRoadmap } = get()
    if (activeRoadmap) {
      void get().fetchActiveRoadmap(activeRoadmap.id)
    }
  },

  async setRoadmapSkills(roadmapId, skills) {
    try {
      const result = await api.careerIntelligence.roadmaps.setSkills(roadmapId, skills)
      if (result.success) {
        void get().fetchActiveRoadmap(roadmapId)
        return true
      }
      return false
    } catch {
      return false
    }
  },

  async setRoadmapCerts(roadmapId, certs) {
    try {
      const result = await api.careerIntelligence.roadmaps.setCertifications(roadmapId, certs)
      if (result.success) {
        void get().fetchActiveRoadmap(roadmapId)
        return true
      }
      return false
    } catch {
      return false
    }
  },

  async setRoadmapProjects(roadmapId, projects) {
    try {
      const result = await api.careerIntelligence.roadmaps.setProjects(roadmapId, projects)
      if (result.success) {
        void get().fetchActiveRoadmap(roadmapId)
        return true
      }
      return false
    } catch {
      return false
    }
  },

  async setRoadmapMilestones(roadmapId, milestones) {
    try {
      const result = await api.careerIntelligence.roadmaps.setMilestones(roadmapId, milestones)
      if (result.success) {
        void get().fetchActiveRoadmap(roadmapId)
        return true
      }
      return false
    } catch {
      return false
    }
  },

  // ── Skill Progress Actions ─────────────────────────────────────────────────

  async fetchSkillProgress() {
    set({ isLoadingSkillProgress: true, skillProgressError: null })
    try {
      const result = await api.careerIntelligence.skillProgress.getAll()
      if (result.success) {
        set({ skillProgress: result.data })
      } else {
        set({ skillProgressError: result.error })
      }
    } catch {
      set({ skillProgressError: 'Failed to load skill progress' })
    } finally {
      set({ isLoadingSkillProgress: false })
    }
  },

  openEditSkillProgress(skillId) {
    set({ editingSkillId: skillId })
  },

  closeSkillProgressEdit() {
    set({ editingSkillId: null })
  },

  async submitSkillProgress(skillId, values) {
    set({ isSubmittingSkillProgress: true })
    try {
      const result = await api.careerIntelligence.skillProgress.upsert(skillId, values)
      if (result.success) {
        set({ editingSkillId: null })
        void get().fetchSkillProgress()
        return true
      }
      return false
    } catch {
      return false
    } finally {
      set({ isSubmittingSkillProgress: false })
    }
  },

  // ── Study Session Actions ──────────────────────────────────────────────────

  async fetchStudySessions() {
    set({ isLoadingStudySessions: true })
    try {
      const result = await api.careerIntelligence.studySessions.getAll()
      if (result.success) {
        set({ studySessions: result.data })
      }
    } catch {
      // non-fatal
    } finally {
      set({ isLoadingStudySessions: false })
    }
  },

  openSessionForm() {
    set({ isSessionFormOpen: true })
  },

  closeSessionForm() {
    set({ isSessionFormOpen: false })
  },

  async submitSession(values) {
    set({ isSubmittingSession: true })
    try {
      const result = await api.careerIntelligence.studySessions.log(values)
      if (result.success) {
        set({ isSessionFormOpen: false })
        void get().fetchStudySessions()
        void get().fetchSkillProgress()
        return true
      }
      return false
    } catch {
      return false
    } finally {
      set({ isSubmittingSession: false })
    }
  },

  confirmDeleteSession(id) {
    set({ deletingSessionId: id })
  },

  cancelDeleteSession() {
    set({ deletingSessionId: null })
  },

  async executeDeleteSession() {
    const { deletingSessionId } = get()
    if (!deletingSessionId) return false
    try {
      const result = await api.careerIntelligence.studySessions.delete(deletingSessionId)
      if (result.success) {
        set({ deletingSessionId: null })
        void get().fetchStudySessions()
        return true
      }
      return false
    } catch {
      return false
    }
  },

  // ── Coach Actions ──────────────────────────────────────────────────────────

  async fetchRecommendations(roadmapId) {
    set({ isLoadingRecommendations: true, recommendationsError: null })
    try {
      const result = await api.careerIntelligence.coach.getRecommendations(roadmapId)
      if (result.success) {
        set({ recommendations: result.data })
      } else {
        set({ recommendationsError: result.error })
      }
    } catch {
      set({ recommendationsError: 'Failed to load recommendations' })
    } finally {
      set({ isLoadingRecommendations: false })
    }
  },

  // ── Graph Actions ──────────────────────────────────────────────────────────

  async fetchGraph() {
    set({ isLoadingGraph: true, graphError: null })
    try {
      const result = await api.careerIntelligence.knowledgeGraph.get()
      if (result.success) {
        set({ graphData: result.data })
      } else {
        set({ graphError: result.error })
      }
    } catch {
      set({ graphError: 'Failed to load knowledge graph' })
    } finally {
      set({ isLoadingGraph: false })
    }
  },

  // ── Analytics Actions ──────────────────────────────────────────────────────

  async fetchAnalytics() {
    set({ isLoadingAnalytics: true, analyticsError: null })
    try {
      const result = await api.careerIntelligence.analytics.getDashboard()
      if (result.success) {
        set({ analytics: result.data })
      } else {
        set({ analyticsError: result.error })
      }
    } catch {
      set({ analyticsError: 'Failed to load analytics' })
    } finally {
      set({ isLoadingAnalytics: false })
    }
  },
}))
