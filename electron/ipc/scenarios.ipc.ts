import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllScenarios, getScenarioById, getScenarioSteps,
  createScenario, updateScenario, deleteScenario,
  addStep, updateStep, deleteStep,
  startAttempt, updateAttempt, getAttemptsByScenario, getScenarioStats,
  getAllFeynmanEntries, createFeynmanEntry, updateFeynmanEntry, deleteFeynmanEntry,
} from '../services/scenarios/scenarios.service'
import type { ScenarioCategory, ScenarioDifficulty } from '../services/scenarios/scenarios.service'

export function registerScenariosHandlers(): void {
  ipcMain.handle(IPC.SCENARIOS.GET_ALL, (_e, category?: ScenarioCategory, difficulty?: ScenarioDifficulty) => {
    try { return ok(getAllScenarios(getDatabase(), category, difficulty)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get scenarios') }
  })

  ipcMain.handle(IPC.SCENARIOS.GET_BY_ID, (_e, id: string) => {
    try {
      const s = getScenarioById(getDatabase(), id)
      if (!s) return fail('Scenario not found', 'NOT_FOUND')
      return ok(s)
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get scenario') }
  })

  ipcMain.handle(IPC.SCENARIOS.GET_STEPS, (_e, scenarioId: string) => {
    try { return ok(getScenarioSteps(getDatabase(), scenarioId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get steps') }
  })

  ipcMain.handle(IPC.SCENARIOS.CREATE, (_e, params: unknown) => {
    try {
      const p = params as Parameters<typeof createScenario>[1]
      if (!p.title || !p.context_story || !p.success_criteria) return fail('title, context_story, and success_criteria are required')
      return ok(createScenario(getDatabase(), p))
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to create scenario') }
  })

  ipcMain.handle(IPC.SCENARIOS.UPDATE, (_e, id: string, params: unknown) => {
    try { return ok(updateScenario(getDatabase(), id, params as Parameters<typeof updateScenario>[2])) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update scenario') }
  })

  ipcMain.handle(IPC.SCENARIOS.DELETE, (_e, id: string) => {
    try { deleteScenario(getDatabase(), id); return ok(null) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete scenario') }
  })

  ipcMain.handle(IPC.SCENARIOS.STEPS.ADD, (_e, params: unknown) => {
    try { return ok(addStep(getDatabase(), params as Parameters<typeof addStep>[1])) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to add step') }
  })

  ipcMain.handle(IPC.SCENARIOS.STEPS.UPDATE, (_e, id: string, params: unknown) => {
    try { return ok(updateStep(getDatabase(), id, params as Parameters<typeof updateStep>[2])) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update step') }
  })

  ipcMain.handle(IPC.SCENARIOS.STEPS.DELETE, (_e, id: string) => {
    try { deleteStep(getDatabase(), id); return ok(null) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete step') }
  })

  ipcMain.handle(IPC.SCENARIOS.ATTEMPTS.START, (_e, scenarioId: string) => {
    try { return ok(startAttempt(getDatabase(), scenarioId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to start attempt') }
  })

  ipcMain.handle(IPC.SCENARIOS.ATTEMPTS.UPDATE, (_e, id: string, updates: unknown) => {
    try { return ok(updateAttempt(getDatabase(), id, updates as Parameters<typeof updateAttempt>[2])) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update attempt') }
  })

  ipcMain.handle(IPC.SCENARIOS.ATTEMPTS.GET_BY_SCENARIO, (_e, scenarioId: string) => {
    try { return ok(getAttemptsByScenario(getDatabase(), scenarioId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get attempts') }
  })

  ipcMain.handle(IPC.SCENARIOS.GET_STATS, () => {
    try { return ok(getScenarioStats(getDatabase())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get scenario stats') }
  })

  // Feynman entries
  ipcMain.handle(IPC.FEYNMAN.GET_ALL, () => {
    try { return ok(getAllFeynmanEntries(getDatabase())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get Feynman entries') }
  })

  ipcMain.handle(IPC.FEYNMAN.CREATE, (_e, params: unknown) => {
    try {
      const p = params as Parameters<typeof createFeynmanEntry>[1]
      if (!p.topic || !p.explanation) return fail('topic and explanation are required')
      return ok(createFeynmanEntry(getDatabase(), p))
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to create Feynman entry') }
  })

  ipcMain.handle(IPC.FEYNMAN.UPDATE, (_e, id: string, params: unknown) => {
    try { return ok(updateFeynmanEntry(getDatabase(), id, params as Parameters<typeof updateFeynmanEntry>[2])) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update Feynman entry') }
  })

  ipcMain.handle(IPC.FEYNMAN.DELETE, (_e, id: string) => {
    try { deleteFeynmanEntry(getDatabase(), id); return ok(null) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete Feynman entry') }
  })
}
