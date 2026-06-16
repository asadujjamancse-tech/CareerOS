import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getLearningDashboard,
  getWeeklyReport,
  getMonthlyReport,
} from '../services/learning-dashboard/learning-dashboard.service'

export function registerLearningDashboardHandlers(): void {
  ipcMain.handle(IPC.LEARNING_DASHBOARD.GET_DASHBOARD, () => {
    try { return ok(getLearningDashboard(getDatabase())) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch dashboard') }
  })

  ipcMain.handle(IPC.LEARNING_DASHBOARD.GET_WEEKLY_REPORT, (_e, weekStart: string) => {
    try {
      if (!weekStart) return fail('Week start date is required', 'VALIDATION')
      return ok(getWeeklyReport(getDatabase(), weekStart))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch weekly report') }
  })

  ipcMain.handle(IPC.LEARNING_DASHBOARD.GET_MONTHLY_REPORT, (_e, month: string) => {
    try {
      if (!month) return fail('Month is required', 'VALIDATION')
      return ok(getMonthlyReport(getDatabase(), month))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch monthly report') }
  })
}
