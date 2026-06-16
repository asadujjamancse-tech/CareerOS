import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type {
  LearningPath, SkillMethodConfig, RetentionRecord, ReviewLog,
  StudyPlan, SkillDependencyItem, LearningCoachDependencyGraph,
  LearningEffectivenessMetrics,
  CreateLearningPathInput, LearningPathSkillInput, GenerateStudyPlanInput,
} from '../types/learning-coach.types'

interface LearningCoachState {
  paths: LearningPath[]
  methodConfigs: SkillMethodConfig[]
  retentionRecords: RetentionRecord[]
  dueReviews: RetentionRecord[]
  reviewLogs: ReviewLog[]
  studyPlans: StudyPlan[]
  dependencies: SkillDependencyItem[]
  dependencyGraph: LearningCoachDependencyGraph
  effectiveness: LearningEffectivenessMetrics | null
  loading: boolean
  error: string | null

  // actions
  fetchPaths: () => Promise<void>
  fetchMethodConfigs: () => Promise<void>
  fetchRetention: () => Promise<void>
  fetchDueReviews: () => Promise<void>
  fetchStudyPlans: () => Promise<void>
  fetchDependencies: () => Promise<void>
  fetchDependencyGraph: () => Promise<void>
  fetchEffectiveness: () => Promise<void>

  createPath: (data: CreateLearningPathInput) => Promise<LearningPath | null>
  updatePath: (id: string, data: Partial<CreateLearningPathInput & { is_active: 0 | 1 }>) => Promise<void>
  deletePath: (id: string) => Promise<void>
  setPathSkills: (pathId: string, skills: LearningPathSkillInput[]) => Promise<void>

  upsertMethodConfig: (skillId: string, data: Partial<SkillMethodConfig>) => Promise<void>

  upsertRetention: (skillId: string) => Promise<void>
  recordReview: (skillId: string, quality: number, notes?: string | null) => Promise<void>
  fetchReviewLogs: (skillId?: string) => Promise<void>

  generateStudyPlan: (input: GenerateStudyPlanInput) => Promise<StudyPlan | null>
  deleteStudyPlan: (id: string) => Promise<void>
  markPlanItemDone: (itemId: string, planId: string, done: boolean) => Promise<void>

  addDependency: (skillId: string, prerequisiteId: string, strength?: 'required' | 'recommended' | 'optional') => Promise<void>
  removeDependency: (skillId: string, prerequisiteId: string) => Promise<void>
}

export const useLearningCoachStore = create<LearningCoachState>((set, get) => ({
  paths: [],
  methodConfigs: [],
  retentionRecords: [],
  dueReviews: [],
  reviewLogs: [],
  studyPlans: [],
  dependencies: [],
  dependencyGraph: { nodes: [], edges: [] },
  effectiveness: null,
  loading: false,
  error: null,

  fetchPaths: async () => {
    const res = await api.learningCoach.learningPaths.getAll()
    if (res.success) set({ paths: res.data })
  },

  fetchMethodConfigs: async () => {
    const res = await api.learningCoach.skillMethods.getAll()
    if (res.success) set({ methodConfigs: res.data })
  },

  fetchRetention: async () => {
    const res = await api.learningCoach.retention.getAll()
    if (res.success) set({ retentionRecords: res.data })
  },

  fetchDueReviews: async () => {
    const res = await api.learningCoach.retention.getDue()
    if (res.success) set({ dueReviews: res.data })
  },

  fetchStudyPlans: async () => {
    const res = await api.learningCoach.studyPlans.getAll()
    if (res.success) set({ studyPlans: res.data })
  },

  fetchDependencies: async () => {
    const res = await api.learningCoach.dependencies.getAll()
    if (res.success) set({ dependencies: res.data })
  },

  fetchDependencyGraph: async () => {
    const res = await api.learningCoach.dependencies.getGraph()
    if (res.success) set({ dependencyGraph: res.data })
  },

  fetchEffectiveness: async () => {
    const res = await api.learningCoach.effectiveness.getMetrics()
    if (res.success) set({ effectiveness: res.data })
  },

  fetchReviewLogs: async (skillId?: string) => {
    const res = await api.learningCoach.retention.getLogs(skillId)
    if (res.success) set({ reviewLogs: res.data })
  },

  createPath: async (data) => {
    const res = await api.learningCoach.learningPaths.create(data)
    if (res.success) {
      set(s => ({ paths: [res.data, ...s.paths] }))
      return res.data
    }
    set({ error: res.error })
    return null
  },

  updatePath: async (id, data) => {
    const res = await api.learningCoach.learningPaths.update(id, data)
    if (res.success) set(s => ({ paths: s.paths.map(p => p.id === id ? res.data : p) }))
  },

  deletePath: async (id) => {
    const res = await api.learningCoach.learningPaths.delete(id)
    if (res.success) set(s => ({ paths: s.paths.filter(p => p.id !== id) }))
  },

  setPathSkills: async (pathId, skills) => {
    const res = await api.learningCoach.learningPaths.setSkills(pathId, skills)
    if (res.success) await get().fetchPaths()
  },

  upsertMethodConfig: async (skillId, data) => {
    const res = await api.learningCoach.skillMethods.upsert(skillId, data)
    if (res.success) {
      set(s => ({
        methodConfigs: s.methodConfigs.some(m => m.skill_id === skillId)
          ? s.methodConfigs.map(m => m.skill_id === skillId ? res.data : m)
          : [...s.methodConfigs, res.data],
      }))
    }
  },

  upsertRetention: async (skillId) => {
    const res = await api.learningCoach.retention.upsert(skillId)
    if (res.success) {
      set(s => ({
        retentionRecords: s.retentionRecords.some(r => r.skill_id === skillId)
          ? s.retentionRecords.map(r => r.skill_id === skillId ? res.data : r)
          : [...s.retentionRecords, res.data],
      }))
    }
  },

  recordReview: async (skillId, quality, notes) => {
    const res = await api.learningCoach.retention.recordReview(skillId, quality, notes)
    if (res.success) {
      set(s => ({
        retentionRecords: s.retentionRecords.map(r => r.skill_id === skillId ? res.data : r),
        dueReviews: s.dueReviews.filter(r => r.skill_id !== skillId),
      }))
    }
  },

  generateStudyPlan: async (input) => {
    const res = await api.learningCoach.studyPlans.generate(input)
    if (res.success) {
      set(s => ({ studyPlans: [res.data, ...s.studyPlans] }))
      return res.data
    }
    set({ error: res.error })
    return null
  },

  deleteStudyPlan: async (id) => {
    const res = await api.learningCoach.studyPlans.delete(id)
    if (res.success) set(s => ({ studyPlans: s.studyPlans.filter(p => p.id !== id) }))
  },

  markPlanItemDone: async (itemId, planId, done) => {
    const res = await api.learningCoach.studyPlans.markItemDone(itemId, done)
    if (res.success) {
      const updated = res.data
      set(s => ({
        studyPlans: s.studyPlans.map(plan => {
          if (plan.id !== planId) return plan
          const items = plan.items.map(item => item.id === itemId ? updated : item)
          const completed_items = items.filter(i => i.is_done === 1).length
          const progress_pct = items.length > 0 ? Math.round((completed_items / items.length) * 100) : 0
          return { ...plan, items, completed_items, progress_pct }
        }),
      }))
    }
  },

  addDependency: async (skillId, prerequisiteId, strength) => {
    const res = await api.learningCoach.dependencies.add(skillId, prerequisiteId, strength)
    if (res.success) {
      await get().fetchDependencies()
      await get().fetchDependencyGraph()
    }
  },

  removeDependency: async (skillId, prerequisiteId) => {
    const res = await api.learningCoach.dependencies.remove(skillId, prerequisiteId)
    if (res.success) {
      set(s => ({
        dependencies: s.dependencies.filter(d => !(d.skill_id === skillId && d.prerequisite_id === prerequisiteId)),
      }))
      await get().fetchDependencyGraph()
    }
  },
}))
