import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  getVersions,
  saveManualSnapshot,
  restoreVersion,
  deleteVersion,
  type CreateDocumentParams,
  type UpdateDocumentParams,
} from '../services/markdown/markdown.service'

export function registerMarkdownHandlers(): void {
  const db = () => getDatabase()

  ipcMain.handle(IPC.MARKDOWN.GET_ALL, () => {
    try { return ok(getAllDocuments(db())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get markdown documents') }
  })

  ipcMain.handle(IPC.MARKDOWN.GET_BY_ID, (_e, id: string) => {
    try { return ok(getDocumentById(db(), id)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get markdown document') }
  })

  ipcMain.handle(IPC.MARKDOWN.CREATE, (_e, params: CreateDocumentParams) => {
    try { return ok(createDocument(db(), params)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to create markdown document') }
  })

  ipcMain.handle(IPC.MARKDOWN.UPDATE, (_e, id: string, params: UpdateDocumentParams) => {
    try { return ok(updateDocument(db(), id, params)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update markdown document') }
  })

  ipcMain.handle(IPC.MARKDOWN.DELETE, (_e, id: string) => {
    try { return ok(deleteDocument(db(), id)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete markdown document') }
  })

  ipcMain.handle(IPC.MARKDOWN.VERSIONS.GET, (_e, documentId: string) => {
    try { return ok(getVersions(db(), documentId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get versions') }
  })

  ipcMain.handle(IPC.MARKDOWN.VERSIONS.SAVE, (_e, documentId: string, label?: string) => {
    try { return ok(saveManualSnapshot(db(), documentId, label)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to save version') }
  })

  ipcMain.handle(IPC.MARKDOWN.VERSIONS.RESTORE, (_e, documentId: string, versionId: string) => {
    try { return ok(restoreVersion(db(), documentId, versionId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to restore version') }
  })

  ipcMain.handle(IPC.MARKDOWN.VERSIONS.DELETE, (_e, versionId: string) => {
    try { return ok(deleteVersion(db(), versionId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete version') }
  })
}
