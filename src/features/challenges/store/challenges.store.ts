import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { Challenge, ChallengeStats, ChallengeType } from '../types/challenges.types'

interface ChallengesState {
  todayChallenges: Challenge[]
  weekChallenges: Challenge[]
  allChallenges: Challenge[]
  stats: ChallengeStats | null
  isLoading: boolean
  error: string | null
  generatingDaily: boolean

  fetchToday: () => Promise<void>
  fetchWeek: () => Promise<void>
  fetchAll: (type?: ChallengeType) => Promise<void>
  fetchStats: () => Promise<void>
  generateDaily: () => Promise<void>
  generateWeekly: () => Promise<void>
  startChallenge: (challengeId: string) => Promise<void>
  completeChallenge: (challengeId: string, notes?: string) => Promise<void>
  updateProgress: (challengeId: string, progress: number) => Promise<void>
  createCustom: (params: {
    title: string
    description: string
    type?: ChallengeType
    difficulty?: string
    category?: string
    xp_reward?: number
    target_count?: number
  }) => Promise<void>
}

export const useChallengesStore = create<ChallengesState>((set, get) => ({
  todayChallenges: [],
  weekChallenges: [],
  allChallenges: [],
  stats: null,
  isLoading: false,
  error: null,
  generatingDaily: false,

  fetchToday: async () => {
    const res = await api.challenges.getToday() as { success: boolean; data?: Challenge[]; error?: string }
    if (res.success && res.data) set({ todayChallenges: res.data })
  },

  fetchWeek: async () => {
    const res = await api.challenges.getWeek() as { success: boolean; data?: Challenge[]; error?: string }
    if (res.success && res.data) set({ weekChallenges: res.data })
  },

  fetchAll: async (type) => {
    set({ isLoading: true })
    const res = await api.challenges.getAll(type) as { success: boolean; data?: Challenge[]; error?: string }
    if (res.success && res.data) set({ allChallenges: res.data, isLoading: false })
    else set({ error: res.error ?? 'Failed', isLoading: false })
  },

  fetchStats: async () => {
    const res = await api.challenges.getStats() as { success: boolean; data?: ChallengeStats }
    if (res.success && res.data) set({ stats: res.data })
  },

  generateDaily: async () => {
    set({ generatingDaily: true })
    await api.challenges.generateDaily()
    await get().fetchToday()
    set({ generatingDaily: false })
  },

  generateWeekly: async () => {
    await api.challenges.generateWeekly()
    await get().fetchWeek()
  },

  startChallenge: async (challengeId) => {
    await api.challenges.start(challengeId)
    await get().fetchToday()
    await get().fetchWeek()
  },

  completeChallenge: async (challengeId, notes) => {
    await api.challenges.complete(challengeId, notes)
    await Promise.all([get().fetchToday(), get().fetchWeek(), get().fetchStats()])
  },

  updateProgress: async (challengeId, progress) => {
    await api.challenges.updateProgress(challengeId, progress)
    await get().fetchToday()
  },

  createCustom: async (params) => {
    await api.challenges.create(params)
    await get().fetchAll()
  },
}))
