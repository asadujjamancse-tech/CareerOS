import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllHomeLabs, getHomeLabById, createHomeLab, updateHomeLab, softDeleteHomeLab,
  createTask, updateTask, deleteTask, recomputeCompletion,
  createProblem, updateProblem, deleteProblem,
  logTime, deleteTimeEntry, getTimeEntries,
  createAsset, updateAsset, deleteAsset,
  type GetAllHomeLabsParams, type CreateHomeLabParams, type UpdateHomeLabParams,
  type CreateTaskParams, type UpdateTaskParams,
  type CreateProblemParams, type UpdateProblemParams,
  type LogTimeParams, type CreateAssetParams, type UpdateAssetParams,
} from '../services/home-labs/home-labs.service'

export function registerHomeLabsHandlers(): void {
  ipcMain.handle(IPC.HOME_LABS.GET_ALL, (_e, params: GetAllHomeLabsParams | undefined) => {
    try { return ok(getAllHomeLabs(getDatabase(), params ?? {})) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch labs') }
  })

  ipcMain.handle(IPC.HOME_LABS.GET_BY_ID, (_e, id: string) => {
    try {
      const lab = getHomeLabById(getDatabase(), id)
      if (!lab) return fail('Lab not found', 'NOT_FOUND')
      return ok(lab)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch lab') }
  })

  ipcMain.handle(IPC.HOME_LABS.CREATE, (_e, params: CreateHomeLabParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createHomeLab(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create lab') }
  })

  ipcMain.handle(IPC.HOME_LABS.UPDATE, (_e, id: string, params: UpdateHomeLabParams) => {
    try {
      const updated = updateHomeLab(getDatabase(), id, params)
      if (!updated) return fail('Lab not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update lab') }
  })

  ipcMain.handle(IPC.HOME_LABS.DELETE, (_e, id: string) => {
    try {
      const deleted = softDeleteHomeLab(getDatabase(), id)
      if (!deleted) return fail('Lab not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete lab') }
  })

  // ── Tasks ──────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.HOME_LABS.TASKS.CREATE, (_e, params: CreateTaskParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      const db = getDatabase()
      const task = createTask(db, params)
      recomputeCompletion(db, params.lab_id)
      return ok(task)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create task') }
  })

  ipcMain.handle(IPC.HOME_LABS.TASKS.UPDATE, (_e, id: string, params: UpdateTaskParams) => {
    try {
      const db = getDatabase()
      const task = updateTask(db, id, params)
      if (!task) return fail('Task not found', 'NOT_FOUND')
      recomputeCompletion(db, task.lab_id)
      return ok(task)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update task') }
  })

  ipcMain.handle(IPC.HOME_LABS.TASKS.DELETE, (_e, id: string, labId: string) => {
    try {
      const db = getDatabase()
      const deleted = deleteTask(db, id)
      if (!deleted) return fail('Task not found', 'NOT_FOUND')
      if (labId) recomputeCompletion(db, labId)
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete task') }
  })

  // ── Problems ───────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.HOME_LABS.PROBLEMS.CREATE, (_e, params: CreateProblemParams) => {
    try {
      if (!params?.problem?.trim()) return fail('Problem description is required', 'VALIDATION')
      return ok(createProblem(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create problem') }
  })

  ipcMain.handle(IPC.HOME_LABS.PROBLEMS.UPDATE, (_e, id: string, params: UpdateProblemParams) => {
    try {
      const updated = updateProblem(getDatabase(), id, params)
      if (!updated) return fail('Problem not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update problem') }
  })

  ipcMain.handle(IPC.HOME_LABS.PROBLEMS.DELETE, (_e, id: string) => {
    try {
      const deleted = deleteProblem(getDatabase(), id)
      if (!deleted) return fail('Problem not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete problem') }
  })

  // ── Time ───────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.HOME_LABS.TIME.LOG, (_e, params: LogTimeParams) => {
    try {
      if (!params?.lab_id) return fail('Lab ID is required', 'VALIDATION')
      if (!params?.duration_min || params.duration_min <= 0) return fail('Duration must be greater than 0', 'VALIDATION')
      return ok(logTime(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to log time') }
  })

  ipcMain.handle(IPC.HOME_LABS.TIME.DELETE, (_e, id: string) => {
    try {
      const deleted = deleteTimeEntry(getDatabase(), id)
      if (!deleted) return fail('Time entry not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete time entry') }
  })

  ipcMain.handle(IPC.HOME_LABS.TIME.GET_ALL, (_e, labId: string) => {
    try { return ok(getTimeEntries(getDatabase(), labId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch time entries') }
  })

  // ── Assets ─────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.HOME_LABS.ASSETS.CREATE, (_e, params: CreateAssetParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createAsset(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create asset') }
  })

  ipcMain.handle(IPC.HOME_LABS.ASSETS.UPDATE, (_e, id: string, params: UpdateAssetParams) => {
    try {
      const updated = updateAsset(getDatabase(), id, params)
      if (!updated) return fail('Asset not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update asset') }
  })

  ipcMain.handle(IPC.HOME_LABS.ASSETS.DELETE, (_e, id: string) => {
    try {
      const deleted = deleteAsset(getDatabase(), id)
      if (!deleted) return fail('Asset not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete asset') }
  })
}
