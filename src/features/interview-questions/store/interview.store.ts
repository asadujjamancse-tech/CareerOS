import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type {
  InterviewCategory, InterviewQuestionWithMeta, InterviewQuestionFilters, QuestionProgressStats,
} from '@shared/types/entities'
import type { QuestionFormValues } from '../schemas/interview.schema'

interface PaginatedQuestions {
  items: InterviewQuestionWithMeta[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type InterviewMode = 'list' | 'flashcard' | 'random-interview'

interface InterviewState {
  items: InterviewQuestionWithMeta[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isLoading: boolean
  listError: string | null
  filters: InterviewQuestionFilters

  categories: InterviewCategory[]

  detail: InterviewQuestionWithMeta | null
  isLoadingDetail: boolean

  isFormOpen: boolean
  editingId: string | null
  isSubmitting: boolean
  formError: string | null

  deletingId: string | null
  isDeleting: boolean

  mode: InterviewMode
  flashcardQueue: InterviewQuestionWithMeta[]
  flashcardIndex: number
  flashcardFlipped: boolean

  randomQueue: InterviewQuestionWithMeta[]
  randomIndex: number
  randomFlipped: boolean

  progress: QuestionProgressStats | null

  fetch: () => Promise<void>
  fetchCategories: () => Promise<void>
  fetchProgress: () => Promise<void>
  setPage: (p: number) => void
  setSearch: (s: string) => void
  setFilterField: <K extends keyof InterviewQuestionFilters>(k: K, v: InterviewQuestionFilters[K]) => void
  clearFilters: () => void

  openCreate: () => void
  openEdit: (id: string) => void
  closeForm: () => void
  submit: (v: QuestionFormValues) => Promise<boolean>

  confirmDelete: (id: string) => void
  cancelDelete: () => void
  executeDelete: () => Promise<boolean>

  setMode: (mode: InterviewMode) => void

  startFlashcards: () => void
  nextFlashcard: () => void
  prevFlashcard: () => void
  flipFlashcard: () => void
  rateFlashcard: (score: number) => Promise<void>

  startRandomInterview: (params?: { category_id?: string; difficulty?: string; count?: number }) => Promise<void>
  nextRandom: () => void
  prevRandom: () => void
  flipRandom: () => void
  rateRandom: (score: number) => Promise<void>
}

const DF: InterviewQuestionFilters = { search: '', category_id: undefined, difficulty: undefined }

export const useInterviewStore = create<InterviewState>((set, get) => ({
  items: [], total: 0, page: 1, pageSize: 24, totalPages: 0,
  isLoading: false, listError: null, filters: { ...DF },
  categories: [],
  detail: null, isLoadingDetail: false,
  isFormOpen: false, editingId: null, isSubmitting: false, formError: null,
  deletingId: null, isDeleting: false,
  mode: 'list',
  flashcardQueue: [], flashcardIndex: 0, flashcardFlipped: false,
  randomQueue: [], randomIndex: 0, randomFlipped: false,
  progress: null,

  setSearch(search) { set(s => ({ filters: { ...s.filters, search }, page: 1 })); void get().fetch() },
  setFilterField(k, v) { set(s => ({ filters: { ...s.filters, [k]: v }, page: 1 })); void get().fetch() },
  clearFilters() { set({ filters: { ...DF }, page: 1 }); void get().fetch() },
  setPage(page) { set({ page }); void get().fetch() },
  setMode(mode) { set({ mode }) },

  async fetchCategories() {
    const r = await api.interviewCategories.getAll()
    if (r.success) set({ categories: r.data })
  },

  async fetchProgress() {
    const r = await api.interviewQuestions.getProgress()
    if (r.success) set({ progress: r.data })
  },

  async fetch() {
    const { filters, page, pageSize } = get()
    set({ isLoading: true, listError: null })
    try {
      const r = await api.interviewQuestions.getAll({
        search: filters.search || undefined,
        category_id: filters.category_id,
        difficulty: filters.difficulty,
        mastery_min: filters.mastery_min,
        mastery_max: filters.mastery_max,
        page,
        pageSize,
      })
      if (r.success) {
        const p = r.data as PaginatedQuestions
        set({ items: p.items, total: p.total, totalPages: p.totalPages })
      } else { set({ listError: r.error }) }
    } catch { set({ listError: 'Failed to load questions' }) }
    finally { set({ isLoading: false }) }
  },

  openCreate() { set({ isFormOpen: true, editingId: null, formError: null }) },
  openEdit(id) {
    const item = get().items.find(q => q.id === id)
    if (item) set({ detail: item })
    set({ isFormOpen: true, editingId: id, formError: null })
  },
  closeForm() { set({ isFormOpen: false, editingId: null, detail: null, formError: null }) },

  async submit(values) {
    set({ isSubmitting: true, formError: null })
    const { editingId } = get()
    const payload = {
      category_id: values.category_id,
      question: values.question,
      difficulty: values.difficulty,
      personal_answer: values.personal_answer || null,
      ideal_answer: values.ideal_answer || null,
      notes: values.notes || null,
      mastery_score: values.mastery_score,
    }
    try {
      const r = editingId
        ? await api.interviewQuestions.update(editingId, payload)
        : await api.interviewQuestions.create(payload)
      if (r.success) {
        set({ isFormOpen: false, editingId: null, detail: null })
        void get().fetch()
        void get().fetchProgress()
        return true
      }
      set({ formError: r.error })
      return false
    } catch { set({ formError: 'An unexpected error occurred' }); return false }
    finally { set({ isSubmitting: false }) }
  },

  confirmDelete(id) { set({ deletingId: id }) },
  cancelDelete() { set({ deletingId: null }) },
  async executeDelete() {
    const { deletingId } = get()
    if (!deletingId) return false
    set({ isDeleting: true })
    try {
      const r = await api.interviewQuestions.delete(deletingId)
      if (r.success) {
        set({ deletingId: null })
        void get().fetch()
        void get().fetchProgress()
        return true
      }
      return false
    } catch { return false }
    finally { set({ isDeleting: false }) }
  },

  // ── Flashcard mode ────────────────────────────────────────────────────────

  startFlashcards() {
    const { items } = get()
    const sorted = [...items].sort((a, b) => a.mastery_score - b.mastery_score)
    set({ flashcardQueue: sorted, flashcardIndex: 0, flashcardFlipped: false, mode: 'flashcard' })
  },

  nextFlashcard() {
    const { flashcardIndex, flashcardQueue } = get()
    if (flashcardIndex < flashcardQueue.length - 1) {
      set({ flashcardIndex: flashcardIndex + 1, flashcardFlipped: false })
    }
  },

  prevFlashcard() {
    const { flashcardIndex } = get()
    if (flashcardIndex > 0) set({ flashcardIndex: flashcardIndex - 1, flashcardFlipped: false })
  },

  flipFlashcard() { set(s => ({ flashcardFlipped: !s.flashcardFlipped })) },

  async rateFlashcard(score) {
    const { flashcardQueue, flashcardIndex } = get()
    const q = flashcardQueue[flashcardIndex]
    if (!q) return
    const r = await api.interviewQuestions.recordReview(q.id, score)
    if (r.success) {
      const updated = r.data
      const newQueue = flashcardQueue.map((item, i) => i === flashcardIndex ? updated : item)
      set({ flashcardQueue: newQueue })
      set(s => ({ items: s.items.map(i => i.id === updated.id ? updated : i) }))
    }
    get().nextFlashcard()
  },

  // ── Random interview mode ─────────────────────────────────────────────────

  async startRandomInterview(params) {
    const r = await api.interviewQuestions.getRandom(params ?? { count: 10 })
    if (r.success) {
      const queue = r.data
      set({ randomQueue: queue, randomIndex: 0, randomFlipped: false, mode: 'random-interview' })
    }
  },

  nextRandom() {
    const { randomIndex, randomQueue } = get()
    if (randomIndex < randomQueue.length - 1) set({ randomIndex: randomIndex + 1, randomFlipped: false })
  },

  prevRandom() {
    const { randomIndex } = get()
    if (randomIndex > 0) set({ randomIndex: randomIndex - 1, randomFlipped: false })
  },

  flipRandom() { set(s => ({ randomFlipped: !s.randomFlipped })) },

  async rateRandom(score) {
    const { randomQueue, randomIndex } = get()
    const q = randomQueue[randomIndex]
    if (!q) return
    const r = await api.interviewQuestions.recordReview(q.id, score)
    if (r.success) {
      const updated = r.data
      const newQueue = randomQueue.map((item, i) => i === randomIndex ? updated : item)
      set({ randomQueue: newQueue })
    }
    get().nextRandom()
  },
}))
