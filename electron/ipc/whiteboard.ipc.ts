import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllWhiteboards,
  getWhiteboardById,
  createWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  saveCanvasData,
  getLinks,
  addLink,
  removeLink,
} from '../services/whiteboard/whiteboard.service'

export function registerWhiteboardHandlers(): void {
  // ── Whiteboards ─────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.WHITEBOARD.GET_ALL, () => {
    try { return ok(getAllWhiteboards(getDatabase())) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get whiteboards') }
  })

  ipcMain.handle(IPC.WHITEBOARD.GET_BY_ID, (_e, id: string) => {
    try {
      const wb = getWhiteboardById(getDatabase(), id)
      if (!wb) return fail('Whiteboard not found', 'NOT_FOUND')
      return ok(wb)
    }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get whiteboard') }
  })

  ipcMain.handle(IPC.WHITEBOARD.CREATE, (_e, params: unknown) => {
    try { return ok(createWhiteboard(getDatabase(), params as Parameters<typeof createWhiteboard>[1])) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create whiteboard') }
  })

  ipcMain.handle(IPC.WHITEBOARD.UPDATE, (_e, id: string, params: unknown) => {
    try { return ok(updateWhiteboard(getDatabase(), id, params as Parameters<typeof updateWhiteboard>[2])) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update whiteboard') }
  })

  ipcMain.handle(IPC.WHITEBOARD.DELETE, (_e, id: string) => {
    try { deleteWhiteboard(getDatabase(), id); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete whiteboard') }
  })

  ipcMain.handle(IPC.WHITEBOARD.SAVE_CANVAS, (_e, id: string, canvasData: string) => {
    try { saveCanvasData(getDatabase(), id, canvasData); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to save canvas') }
  })

  // ── Links ────────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.WHITEBOARD.LINKS.GET, (_e, whiteboardId: string) => {
    try { return ok(getLinks(getDatabase(), whiteboardId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get links') }
  })

  ipcMain.handle(IPC.WHITEBOARD.LINKS.ADD, (_e, whiteboardId: string, entityType: string, entityId: string) => {
    try { return ok(addLink(getDatabase(), whiteboardId, entityType, entityId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to add link') }
  })

  ipcMain.handle(IPC.WHITEBOARD.LINKS.REMOVE, (_e, whiteboardId: string, entityType: string, entityId: string) => {
    try { removeLink(getDatabase(), whiteboardId, entityType, entityId); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to remove link') }
  })
}
