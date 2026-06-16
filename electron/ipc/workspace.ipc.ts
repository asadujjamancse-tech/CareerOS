import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import { getWorkspaceState, saveWorkspaceState } from '../services/workspace/workspace.service'
import { createFloatingWindow, getAllDisplays } from '../main/window'

export function registerWorkspaceHandlers(): void {
  ipcMain.handle(IPC.WORKSPACE.GET_STATE, () => {
    try { return ok(getWorkspaceState(getDatabase())) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get workspace state') }
  })

  ipcMain.handle(IPC.WORKSPACE.SAVE_STATE, (_e, stateJson: string) => {
    try {
      saveWorkspaceState(getDatabase(), stateJson)
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to save workspace state') }
  })

  ipcMain.handle(IPC.WORKSPACE.OPEN_FLOATING_WINDOW, (
    _e,
    type: string,
    params: Record<string, unknown> = {},
    displayId?: number,
  ) => {
    try {
      createFloatingWindow(type, params, displayId)
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to open floating window') }
  })

  ipcMain.handle(IPC.WORKSPACE.GET_DISPLAYS, () => {
    try { return ok(getAllDisplays()) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get displays') }
  })
}
