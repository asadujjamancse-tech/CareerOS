import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { SrsCard, DueCard, SrsStats, FeynmanEntry, LearningMode } from '../types/learning-system.types'

interface ReviewSession {
  cards: DueCard[]
  currentIndex: number
  revealed: boolean
  sessionStartTime: number
  cardStartTime: number
  results: Array<{ cardId: string; rating: number; timeMs: number }>
}

interface LearningSystemState {
  mode: LearningMode
  stats: SrsStats | null
  allCards: SrsCard[]
  dueCards: DueCard[]
  feynmanEntries: FeynmanEntry[]
  reviewSession: ReviewSession | null
  isLoading: boolean
  error: string | null

  // Active recall state
  recallCards: DueCard[]
  recallIndex: number
  recallRevealed: boolean

  // Feynman form
  feynmanFormOpen: boolean
  editingFeynmanId: string | null

  fetchStats: () => Promise<void>
  fetchDueCards: () => Promise<void>
  fetchAllCards: () => Promise<void>
  fetchFeynmanEntries: () => Promise<void>

  setMode: (mode: LearningMode) => void
  startReviewSession: () => void
  revealCard: () => void
  rateCard: (rating: number) => Promise<void>
  skipCard: () => void
  endSession: () => void

  startActiveRecall: () => void
  revealRecall: () => void
  nextRecall: () => void
  rateRecall: (rating: number) => Promise<void>

  openFeynmanForm: (id?: string) => void
  closeFeynmanForm: () => void
  submitFeynman: (params: {
    topic: string
    explanation: string
    gaps_identified?: string | null
    understanding_score: number
    entity_type?: string | null
    entity_id?: string | null
  }) => Promise<void>
  updateFeynman: (id: string, params: {
    explanation?: string
    gaps_identified?: string | null
    revised_explanation?: string | null
    understanding_score?: number
  }) => Promise<void>
  deleteFeynman: (id: string) => Promise<void>

  createCard: (params: { entity_type: SrsCard['entity_type']; entity_id: string; front: string; back: string }) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  bulkFromInterview: () => Promise<{ created: number }>
  bulkFromNotes: () => Promise<{ created: number }>
}

export const useLearningSystemStore = create<LearningSystemState>((set, get) => ({
  mode: 'dashboard',
  stats: null,
  allCards: [],
  dueCards: [],
  feynmanEntries: [],
  reviewSession: null,
  isLoading: false,
  error: null,
  recallCards: [],
  recallIndex: 0,
  recallRevealed: false,
  feynmanFormOpen: false,
  editingFeynmanId: null,

  fetchStats: async () => {
    const res = await api.srs.getStats() as { success: boolean; data?: SrsStats; error?: string }
    if (res.success && res.data) set({ stats: res.data })
  },

  fetchDueCards: async () => {
    set({ isLoading: true, error: null })
    const res = await api.srs.getDue() as { success: boolean; data?: DueCard[]; error?: string }
    if (res.success && res.data) set({ dueCards: res.data, isLoading: false })
    else set({ error: res.error ?? 'Failed', isLoading: false })
  },

  fetchAllCards: async () => {
    const res = await api.srs.getAll() as { success: boolean; data?: SrsCard[]; error?: string }
    if (res.success && res.data) set({ allCards: res.data })
  },

  fetchFeynmanEntries: async () => {
    const res = await api.feynman.getAll() as { success: boolean; data?: FeynmanEntry[]; error?: string }
    if (res.success && res.data) set({ feynmanEntries: res.data })
  },

  setMode: (mode) => set({ mode }),

  startReviewSession: () => {
    const { dueCards } = get()
    if (dueCards.length === 0) return
    set({
      reviewSession: {
        cards: [...dueCards],
        currentIndex: 0,
        revealed: false,
        sessionStartTime: Date.now(),
        cardStartTime: Date.now(),
        results: [],
      },
      mode: 'review',
    })
  },

  revealCard: () => {
    set(s => ({
      reviewSession: s.reviewSession ? { ...s.reviewSession, revealed: true } : null,
    }))
  },

  rateCard: async (rating) => {
    const { reviewSession } = get()
    if (!reviewSession) return

    const card = reviewSession.cards[reviewSession.currentIndex]
    if (!card) return

    const timeMs = Date.now() - reviewSession.cardStartTime
    await api.srs.recordReview(card.id, rating, timeMs)

    const results = [...reviewSession.results, { cardId: card.id, rating, timeMs }]
    const nextIndex = reviewSession.currentIndex + 1
    const isLast = nextIndex >= reviewSession.cards.length

    if (isLast) {
      set({ reviewSession: null, mode: 'dashboard' })
      await get().fetchStats()
      await get().fetchDueCards()
    } else {
      set({
        reviewSession: {
          ...reviewSession,
          currentIndex: nextIndex,
          revealed: false,
          cardStartTime: Date.now(),
          results,
        },
      })
    }
  },

  skipCard: () => {
    const { reviewSession } = get()
    if (!reviewSession) return
    const nextIndex = reviewSession.currentIndex + 1
    if (nextIndex >= reviewSession.cards.length) {
      set({ reviewSession: null, mode: 'dashboard' })
    } else {
      set({ reviewSession: { ...reviewSession, currentIndex: nextIndex, revealed: false, cardStartTime: Date.now() } })
    }
  },

  endSession: () => {
    set({ reviewSession: null, mode: 'dashboard' })
    void get().fetchStats()
    void get().fetchDueCards()
  },

  startActiveRecall: () => {
    const { dueCards } = get()
    const shuffled = [...dueCards].sort(() => Math.random() - 0.5)
    set({ recallCards: shuffled, recallIndex: 0, recallRevealed: false, mode: 'active-recall' })
  },

  revealRecall: () => set({ recallRevealed: true }),

  nextRecall: () => {
    const { recallIndex, recallCards } = get()
    const next = recallIndex + 1
    if (next >= recallCards.length) {
      set({ mode: 'dashboard', recallCards: [], recallIndex: 0, recallRevealed: false })
      void get().fetchStats()
    } else {
      set({ recallIndex: next, recallRevealed: false })
    }
  },

  rateRecall: async (rating) => {
    const { recallCards, recallIndex } = get()
    const card = recallCards[recallIndex]
    if (!card) return
    const timeMs = 5000
    await api.srs.recordReview(card.id, rating, timeMs)
    get().nextRecall()
  },

  openFeynmanForm: (id) => set({ feynmanFormOpen: true, editingFeynmanId: id ?? null }),
  closeFeynmanForm: () => set({ feynmanFormOpen: false, editingFeynmanId: null }),

  submitFeynman: async (params) => {
    const { editingFeynmanId } = get()
    if (editingFeynmanId) {
      await api.feynman.update(editingFeynmanId, {
        explanation: params.explanation,
        gaps_identified: params.gaps_identified,
        understanding_score: params.understanding_score,
      })
    } else {
      await api.feynman.create(params)
    }
    await get().fetchFeynmanEntries()
    set({ feynmanFormOpen: false, editingFeynmanId: null })
  },

  updateFeynman: async (id, params) => {
    await api.feynman.update(id, params)
    await get().fetchFeynmanEntries()
  },

  deleteFeynman: async (id) => {
    await api.feynman.delete(id)
    await get().fetchFeynmanEntries()
  },

  createCard: async (params) => {
    await api.srs.create(params)
    await get().fetchAllCards()
    await get().fetchDueCards()
    await get().fetchStats()
  },

  deleteCard: async (id) => {
    await api.srs.delete(id)
    await get().fetchAllCards()
    await get().fetchStats()
  },

  bulkFromInterview: async () => {
    const res = await api.srs.bulkFromInterview() as { success: boolean; data?: { created: number }; error?: string }
    if (res.success && res.data) {
      await get().fetchAllCards()
      await get().fetchDueCards()
      await get().fetchStats()
      return res.data
    }
    return { created: 0 }
  },

  bulkFromNotes: async () => {
    const res = await api.srs.bulkFromNotes() as { success: boolean; data?: { created: number }; error?: string }
    if (res.success && res.data) {
      await get().fetchAllCards()
      await get().fetchDueCards()
      await get().fetchStats()
      return res.data
    }
    return { created: 0 }
  },
}))
