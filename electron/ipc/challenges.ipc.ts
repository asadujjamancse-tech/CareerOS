import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getTodaysChallenges, getWeekChallenges, getAllChallenges,
  createChallenge, startChallenge, updateProgress, markChallengeComplete,
  generateDailyChallenges, generateWeeklyChallenge, getChallengeStats,
} from '../services/challenges/challenges.service'
import type { ChallengeType } from '../services/challenges/challenges.service'

export function registerChallengesHandlers(): void {
  ipcMain.handle(IPC.CHALLENGES.GET_TODAY, () => {
    try { return ok(getTodaysChallenges(getDatabase())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get today challenges') }
  })

  ipcMain.handle(IPC.CHALLENGES.GET_WEEK, () => {
    try { return ok(getWeekChallenges(getDatabase())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get week challenges') }
  })

  ipcMain.handle(IPC.CHALLENGES.GET_ALL, (_e, type?: ChallengeType) => {
    try { return ok(getAllChallenges(getDatabase(), type)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get challenges') }
  })

  ipcMain.handle(IPC.CHALLENGES.CREATE, (_e, params: unknown) => {
    try {
      const p = params as Parameters<typeof createChallenge>[1]
      if (!p.title || !p.description) return fail('title and description are required')
      return ok(createChallenge(getDatabase(), p))
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to create challenge') }
  })

  ipcMain.handle(IPC.CHALLENGES.START, (_e, challengeId: string) => {
    try { return ok(startChallenge(getDatabase(), challengeId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to start challenge') }
  })

  ipcMain.handle(IPC.CHALLENGES.UPDATE_PROGRESS, (_e, challengeId: string, progress: number, notes?: string) => {
    try { return ok(updateProgress(getDatabase(), challengeId, progress, notes)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update progress') }
  })

  ipcMain.handle(IPC.CHALLENGES.COMPLETE, (_e, challengeId: string, notes?: string) => {
    try { return ok(markChallengeComplete(getDatabase(), challengeId, notes)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to complete challenge') }
  })

  ipcMain.handle(IPC.CHALLENGES.GENERATE_DAILY, () => {
    try { return ok(generateDailyChallenges(getDatabase())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to generate daily challenges') }
  })

  ipcMain.handle(IPC.CHALLENGES.GENERATE_WEEKLY, () => {
    try { return ok(generateWeeklyChallenge(getDatabase())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to generate weekly challenge') }
  })

  ipcMain.handle(IPC.CHALLENGES.GET_STATS, () => {
    try { return ok(getChallengeStats(getDatabase())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get challenge stats') }
  })
}
