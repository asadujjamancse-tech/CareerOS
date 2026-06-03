import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { SkillCategory } from '../types/skill.types'

interface CategoriesState {
  categories: SkillCategory[]
  isLoading: boolean
  fetch: () => Promise<void>
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  isLoading: false,

  async fetch() {
    set({ isLoading: true })
    try {
      const result = await api.skillCategories.getAll()
      if (result.success) set({ categories: result.data as SkillCategory[] })
    } finally {
      set({ isLoading: false })
    }
  },
}))
