import { create } from 'zustand'
import { api } from '@shared/lib/ipc-client'
import type { LearningDashboardData, WeeklyReport, MonthlyReport } from '@shared/types/ipc.types'

interface DashboardState {
  dashboard: LearningDashboardData | null
  isLoading: boolean
  error: string | null

  weeklyReport: WeeklyReport | null
  isLoadingWeekly: boolean

  monthlyReport: MonthlyReport | null
  isLoadingMonthly: boolean

  selectedWeek: string
  selectedMonth: string

  fetch: () => Promise<void>
  fetchWeeklyReport: (weekStart: string) => Promise<void>
  fetchMonthlyReport: (month: string) => Promise<void>
  setSelectedWeek: (week: string) => void
  setSelectedMonth: (month: string) => void
}

function currentWeekStart(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().slice(0, 10)
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboard: null,
  isLoading: false,
  error: null,
  weeklyReport: null,
  isLoadingWeekly: false,
  monthlyReport: null,
  isLoadingMonthly: false,
  selectedWeek: currentWeekStart(),
  selectedMonth: currentMonth(),

  async fetch() {
    set({ isLoading: true, error: null })
    try {
      const r = await api.learningDashboard.getDashboard()
      if (r.success) set({ dashboard: r.data })
      else set({ error: r.error })
    } catch { set({ error: 'Failed to load dashboard' }) }
    finally { set({ isLoading: false }) }
  },

  async fetchWeeklyReport(weekStart) {
    set({ isLoadingWeekly: true })
    try {
      const r = await api.learningDashboard.getWeeklyReport(weekStart)
      if (r.success) set({ weeklyReport: r.data })
    } finally { set({ isLoadingWeekly: false }) }
  },

  async fetchMonthlyReport(month) {
    set({ isLoadingMonthly: true })
    try {
      const r = await api.learningDashboard.getMonthlyReport(month)
      if (r.success) set({ monthlyReport: r.data })
    } finally { set({ isLoadingMonthly: false }) }
  },

  setSelectedWeek(week) {
    set({ selectedWeek: week })
    void get().fetchWeeklyReport(week)
  },

  setSelectedMonth(month) {
    set({ selectedMonth: month })
    void get().fetchMonthlyReport(month)
  },
}))
