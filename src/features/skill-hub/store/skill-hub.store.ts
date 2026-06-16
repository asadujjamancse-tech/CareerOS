import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type {
  SkillHubOverview,
  SkillModule,
  SkillResource,
  SkillExperienceEntry,
  SkillQuizQuestion,
  QuizAttemptStats,
  LinkedLab,
  LinkedProject,
  LinkedCertification,
  LinkedInterviewQuestion,
  LinkedVideo,
  RelatedSkill,
  CreateSkillModuleInput,
  UpdateSkillModuleInput,
  CreateSkillModuleTopicInput,
  UpdateSkillModuleTopicInput,
  CreateSkillResourceInput,
  UpdateSkillResourceInput,
  CreateSkillExperienceEntryInput,
  CreateSkillQuizQuestionInput,
  UpdateSkillQuizQuestionInput,
  LogQuizAttemptInput,
} from '@shared/types/ipc.types'

interface SkillHubState {
  skillId: string | null
  overview: SkillHubOverview | null
  modules: SkillModule[]
  resources: SkillResource[]
  experienceLog: SkillExperienceEntry[]
  quizQuestions: SkillQuizQuestion[]
  quizStats: QuizAttemptStats | null
  linkedLabs: LinkedLab[]
  linkedProjects: LinkedProject[]
  linkedCertifications: LinkedCertification[]
  linkedInterviewQuestions: LinkedInterviewQuestion[]
  linkedVideos: LinkedVideo[]
  relatedSkills: RelatedSkill[]

  isLoadingOverview: boolean
  isLoadingModules: boolean
  isLoadingResources: boolean
  isLoadingExperienceLog: boolean
  isLoadingQuiz: boolean
  isLoadingLabs: boolean
  isLoadingProjects: boolean
  isLoadingCerts: boolean
  isLoadingInterview: boolean
  isLoadingVideos: boolean
  isLoadingRelated: boolean

  overviewError: string | null

  loadOverview: (skillId: string) => Promise<void>
  loadModules: (skillId: string) => Promise<void>
  loadResources: (skillId: string) => Promise<void>
  loadExperienceLog: (skillId: string) => Promise<void>
  loadQuizQuestions: (skillId: string) => Promise<void>
  loadQuizStats: (skillId: string) => Promise<void>
  loadLinkedLabs: (skillId: string) => Promise<void>
  loadLinkedProjects: (skillId: string) => Promise<void>
  loadLinkedCertifications: (skillId: string) => Promise<void>
  loadLinkedInterviewQuestions: (skillId: string) => Promise<void>
  loadLinkedVideos: (skillId: string) => Promise<void>
  loadRelatedSkills: (skillId: string) => Promise<void>

  createModule: (params: CreateSkillModuleInput) => Promise<void>
  updateModule: (id: string, params: UpdateSkillModuleInput) => Promise<void>
  deleteModule: (id: string) => Promise<void>
  toggleModuleComplete: (id: string, current: 0 | 1) => Promise<void>

  createTopic: (params: CreateSkillModuleTopicInput) => Promise<void>
  updateTopic: (moduleId: string, topicId: string, params: UpdateSkillModuleTopicInput) => Promise<void>
  deleteTopic: (moduleId: string, topicId: string) => Promise<void>

  createResource: (params: CreateSkillResourceInput) => Promise<void>
  updateResource: (id: string, params: UpdateSkillResourceInput) => Promise<void>
  deleteResource: (id: string) => Promise<void>
  toggleResourceComplete: (id: string, current: 0 | 1) => Promise<void>

  createExperienceEntry: (params: CreateSkillExperienceEntryInput) => Promise<void>
  deleteExperienceEntry: (id: string) => Promise<void>

  createQuizQuestion: (params: CreateSkillQuizQuestionInput) => Promise<void>
  updateQuizQuestion: (id: string, params: UpdateSkillQuizQuestionInput) => Promise<void>
  deleteQuizQuestion: (id: string) => Promise<void>
  logQuizAttempt: (params: LogQuizAttemptInput) => Promise<void>

  linkLab: (skillId: string, labId: string) => Promise<void>
  unlinkLab: (skillId: string, labId: string) => Promise<void>
  linkProject: (skillId: string, projectId: string) => Promise<void>
  unlinkProject: (skillId: string, projectId: string) => Promise<void>
  linkCertification: (skillId: string, certId: string) => Promise<void>
  unlinkCertification: (skillId: string, certId: string) => Promise<void>
  linkInterviewQuestion: (skillId: string, questionId: string) => Promise<void>
  unlinkInterviewQuestion: (skillId: string, questionId: string) => Promise<void>

  reset: () => void
}

export const useSkillHubStore = create<SkillHubState>((set, get) => ({
  skillId: null,
  overview: null,
  modules: [],
  resources: [],
  experienceLog: [],
  quizQuestions: [],
  quizStats: null,
  linkedLabs: [],
  linkedProjects: [],
  linkedCertifications: [],
  linkedInterviewQuestions: [],
  linkedVideos: [],
  relatedSkills: [],

  isLoadingOverview: false,
  isLoadingModules: false,
  isLoadingResources: false,
  isLoadingExperienceLog: false,
  isLoadingQuiz: false,
  isLoadingLabs: false,
  isLoadingProjects: false,
  isLoadingCerts: false,
  isLoadingInterview: false,
  isLoadingVideos: false,
  isLoadingRelated: false,

  overviewError: null,

  loadOverview: async (skillId) => {
    set({ isLoadingOverview: true, overviewError: null, skillId })
    const res = await api.skillHub.getOverview(skillId)
    if (res.success) set({ overview: res.data, isLoadingOverview: false })
    else set({ overviewError: res.error, isLoadingOverview: false })
  },

  loadModules: async (skillId) => {
    set({ isLoadingModules: true })
    const res = await api.skillHub.modules.getAll(skillId)
    if (res.success) set({ modules: res.data, isLoadingModules: false })
    else set({ isLoadingModules: false })
  },

  loadResources: async (skillId) => {
    set({ isLoadingResources: true })
    const res = await api.skillHub.resources.getAll(skillId)
    if (res.success) set({ resources: res.data, isLoadingResources: false })
    else set({ isLoadingResources: false })
  },

  loadExperienceLog: async (skillId) => {
    set({ isLoadingExperienceLog: true })
    const res = await api.skillHub.experienceLog.getAll(skillId)
    if (res.success) set({ experienceLog: res.data, isLoadingExperienceLog: false })
    else set({ isLoadingExperienceLog: false })
  },

  loadQuizQuestions: async (skillId) => {
    set({ isLoadingQuiz: true })
    const res = await api.skillHub.quizQuestions.getAll(skillId)
    if (res.success) set({ quizQuestions: res.data, isLoadingQuiz: false })
    else set({ isLoadingQuiz: false })
  },

  loadQuizStats: async (skillId) => {
    const res = await api.skillHub.quizAttempts.getStats(skillId)
    if (res.success) set({ quizStats: res.data })
  },

  loadLinkedLabs: async (skillId) => {
    set({ isLoadingLabs: true })
    const res = await api.skillHub.linkedLabs.getAll(skillId)
    if (res.success) set({ linkedLabs: res.data, isLoadingLabs: false })
    else set({ isLoadingLabs: false })
  },

  loadLinkedProjects: async (skillId) => {
    set({ isLoadingProjects: true })
    const res = await api.skillHub.linkedProjects.getAll(skillId)
    if (res.success) set({ linkedProjects: res.data, isLoadingProjects: false })
    else set({ isLoadingProjects: false })
  },

  loadLinkedCertifications: async (skillId) => {
    set({ isLoadingCerts: true })
    const res = await api.skillHub.linkedCertifications.getAll(skillId)
    if (res.success) set({ linkedCertifications: res.data, isLoadingCerts: false })
    else set({ isLoadingCerts: false })
  },

  loadLinkedInterviewQuestions: async (skillId) => {
    set({ isLoadingInterview: true })
    const res = await api.skillHub.linkedInterviewQuestions.getAll(skillId)
    if (res.success) set({ linkedInterviewQuestions: res.data, isLoadingInterview: false })
    else set({ isLoadingInterview: false })
  },

  loadLinkedVideos: async (skillId) => {
    set({ isLoadingVideos: true })
    const res = await api.skillHub.linkedVideos.getAll(skillId)
    if (res.success) set({ linkedVideos: res.data, isLoadingVideos: false })
    else set({ isLoadingVideos: false })
  },

  loadRelatedSkills: async (skillId) => {
    set({ isLoadingRelated: true })
    const res = await api.skillHub.relatedSkills.getAll(skillId)
    if (res.success) set({ relatedSkills: res.data, isLoadingRelated: false })
    else set({ isLoadingRelated: false })
  },

  // ── Modules ────────────────────────────────────────────────────────────────
  createModule: async (params) => {
    const res = await api.skillHub.modules.create(params)
    if (res.success) await get().loadModules(params.skill_id)
  },

  updateModule: async (id, params) => {
    const res = await api.skillHub.modules.update(id, params)
    if (res.success) {
      set(state => ({
        modules: state.modules.map(m => m.id === id ? { ...m, ...res.data } : m),
      }))
    }
  },

  deleteModule: async (id) => {
    const skillId = get().skillId
    if (!skillId) return
    const res = await api.skillHub.modules.delete(id)
    if (res.success) set(state => ({ modules: state.modules.filter(m => m.id !== id) }))
  },

  toggleModuleComplete: async (id, current) => {
    await get().updateModule(id, { is_complete: current === 1 ? 0 : 1 })
    const skillId = get().skillId
    if (skillId) await get().loadOverview(skillId)
  },

  // ── Module Topics ──────────────────────────────────────────────────────────
  createTopic: async (params) => {
    const res = await api.skillHub.moduleTopics.create(params)
    if (res.success) {
      set(state => ({
        modules: state.modules.map(m =>
          m.id === params.module_id
            ? { ...m, topics: [...m.topics, res.data] }
            : m,
        ),
      }))
    }
  },

  updateTopic: async (moduleId, topicId, params) => {
    const res = await api.skillHub.moduleTopics.update(topicId, params)
    if (res.success) {
      set(state => ({
        modules: state.modules.map(m =>
          m.id === moduleId
            ? { ...m, topics: m.topics.map(t => t.id === topicId ? { ...t, ...res.data } : t) }
            : m,
        ),
      }))
    }
  },

  deleteTopic: async (moduleId, topicId) => {
    const res = await api.skillHub.moduleTopics.delete(topicId)
    if (res.success) {
      set(state => ({
        modules: state.modules.map(m =>
          m.id === moduleId
            ? { ...m, topics: m.topics.filter(t => t.id !== topicId) }
            : m,
        ),
      }))
    }
  },

  // ── Resources ──────────────────────────────────────────────────────────────
  createResource: async (params) => {
    const res = await api.skillHub.resources.create(params)
    if (res.success) set(state => ({ resources: [...state.resources, res.data] }))
  },

  updateResource: async (id, params) => {
    const res = await api.skillHub.resources.update(id, params)
    if (res.success) {
      set(state => ({ resources: state.resources.map(r => r.id === id ? { ...r, ...res.data } : r) }))
    }
  },

  deleteResource: async (id) => {
    const res = await api.skillHub.resources.delete(id)
    if (res.success) set(state => ({ resources: state.resources.filter(r => r.id !== id) }))
  },

  toggleResourceComplete: async (id, current) => {
    await get().updateResource(id, { is_completed: current === 1 ? 0 : 1 })
    const skillId = get().skillId
    if (skillId) await get().loadOverview(skillId)
  },

  // ── Experience Log ─────────────────────────────────────────────────────────
  createExperienceEntry: async (params) => {
    const res = await api.skillHub.experienceLog.create(params)
    if (res.success) set(state => ({ experienceLog: [res.data, ...state.experienceLog] }))
  },

  deleteExperienceEntry: async (id) => {
    const res = await api.skillHub.experienceLog.delete(id)
    if (res.success) set(state => ({ experienceLog: state.experienceLog.filter(e => e.id !== id) }))
  },

  // ── Quiz ───────────────────────────────────────────────────────────────────
  createQuizQuestion: async (params) => {
    const res = await api.skillHub.quizQuestions.create(params)
    if (res.success) set(state => ({ quizQuestions: [...state.quizQuestions, res.data] }))
  },

  updateQuizQuestion: async (id, params) => {
    const res = await api.skillHub.quizQuestions.update(id, params)
    if (res.success) {
      set(state => ({ quizQuestions: state.quizQuestions.map(q => q.id === id ? { ...q, ...res.data } : q) }))
    }
  },

  deleteQuizQuestion: async (id) => {
    const res = await api.skillHub.quizQuestions.delete(id)
    if (res.success) set(state => ({ quizQuestions: state.quizQuestions.filter(q => q.id !== id) }))
  },

  logQuizAttempt: async (params) => {
    await api.skillHub.quizAttempts.log(params)
    await get().loadQuizStats(params.skill_id)
  },

  // ── Linked items ───────────────────────────────────────────────────────────
  linkLab: async (skillId, labId) => {
    const res = await api.skillHub.linkedLabs.link(skillId, labId)
    if (res.success) await get().loadLinkedLabs(skillId)
  },
  unlinkLab: async (skillId, labId) => {
    const res = await api.skillHub.linkedLabs.unlink(skillId, labId)
    if (res.success) set(state => ({ linkedLabs: state.linkedLabs.filter(l => l.id !== labId) }))
  },

  linkProject: async (skillId, projectId) => {
    const res = await api.skillHub.linkedProjects.link(skillId, projectId)
    if (res.success) await get().loadLinkedProjects(skillId)
  },
  unlinkProject: async (skillId, projectId) => {
    const res = await api.skillHub.linkedProjects.unlink(skillId, projectId)
    if (res.success) set(state => ({ linkedProjects: state.linkedProjects.filter(p => p.id !== projectId) }))
  },

  linkCertification: async (skillId, certId) => {
    const res = await api.skillHub.linkedCertifications.link(skillId, certId)
    if (res.success) await get().loadLinkedCertifications(skillId)
  },
  unlinkCertification: async (skillId, certId) => {
    const res = await api.skillHub.linkedCertifications.unlink(skillId, certId)
    if (res.success) set(state => ({ linkedCertifications: state.linkedCertifications.filter(c => c.id !== certId) }))
  },

  linkInterviewQuestion: async (skillId, questionId) => {
    const res = await api.skillHub.linkedInterviewQuestions.link(skillId, questionId)
    if (res.success) await get().loadLinkedInterviewQuestions(skillId)
  },
  unlinkInterviewQuestion: async (skillId, questionId) => {
    const res = await api.skillHub.linkedInterviewQuestions.unlink(skillId, questionId)
    if (res.success) set(state => ({ linkedInterviewQuestions: state.linkedInterviewQuestions.filter(q => q.id !== questionId) }))
  },

  reset: () => set({
    skillId: null, overview: null, modules: [], resources: [], experienceLog: [],
    quizQuestions: [], quizStats: null, linkedLabs: [], linkedProjects: [],
    linkedCertifications: [], linkedInterviewQuestions: [], linkedVideos: [], relatedSkills: [],
    overviewError: null,
  }),
}))
