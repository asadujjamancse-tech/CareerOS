import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllFolders, createFolder, updateFolder, deleteFolder,
  getAllFiles, getFileById, createFile, updateFile, saveFileContent, deleteFile,
} from '../services/code-workspace/code-workspace.service'

export function registerCodeWorkspaceHandlers(): void {
  // ── Folders ─────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.CODE_WORKSPACE.FOLDERS.GET_ALL, () => {
    try { return ok(getAllFolders(getDatabase())) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get folders') }
  })

  ipcMain.handle(IPC.CODE_WORKSPACE.FOLDERS.CREATE, (_e, params: unknown) => {
    try { return ok(createFolder(getDatabase(), params as Parameters<typeof createFolder>[1])) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create folder') }
  })

  ipcMain.handle(IPC.CODE_WORKSPACE.FOLDERS.UPDATE, (_e, id: string, params: unknown) => {
    try { return ok(updateFolder(getDatabase(), id, params as Parameters<typeof updateFolder>[2])) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update folder') }
  })

  ipcMain.handle(IPC.CODE_WORKSPACE.FOLDERS.DELETE, (_e, id: string) => {
    try { deleteFolder(getDatabase(), id); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete folder') }
  })

  // ── Files ────────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.CODE_WORKSPACE.FILES.GET_ALL, () => {
    try { return ok(getAllFiles(getDatabase())) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get files') }
  })

  ipcMain.handle(IPC.CODE_WORKSPACE.FILES.GET_BY_ID, (_e, id: string) => {
    try {
      const file = getFileById(getDatabase(), id)
      if (!file) return fail('File not found', 'NOT_FOUND')
      return ok(file)
    }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get file') }
  })

  ipcMain.handle(IPC.CODE_WORKSPACE.FILES.CREATE, (_e, params: unknown) => {
    try { return ok(createFile(getDatabase(), params as Parameters<typeof createFile>[1])) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create file') }
  })

  ipcMain.handle(IPC.CODE_WORKSPACE.FILES.UPDATE, (_e, id: string, params: unknown) => {
    try { return ok(updateFile(getDatabase(), id, params as Parameters<typeof updateFile>[2])) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update file') }
  })

  ipcMain.handle(IPC.CODE_WORKSPACE.FILES.SAVE_CONTENT, (_e, id: string, content: string) => {
    try { saveFileContent(getDatabase(), id, content); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to save content') }
  })

  ipcMain.handle(IPC.CODE_WORKSPACE.FILES.DELETE, (_e, id: string) => {
    try { deleteFile(getDatabase(), id); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete file') }
  })
}
