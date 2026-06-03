import { ipcMain, shell } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllDocuments, getDocumentById, createDocument, updateDocument, softDeleteDocument,
  type GetAllDocsParams, type CreateDocumentParams, type UpdateDocumentParams,
} from '../services/documents/documents.service'

export function registerDocumentsHandlers(): void {
  ipcMain.handle(IPC.DOCUMENTS.GET_ALL, (_e, params: GetAllDocsParams | undefined) => {
    try { return ok(getAllDocuments(getDatabase(), params ?? {})) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch documents') }
  })

  ipcMain.handle(IPC.DOCUMENTS.GET_BY_ID, (_e, id: string) => {
    try {
      const doc = getDocumentById(getDatabase(), id)
      if (!doc) return fail('Document not found', 'NOT_FOUND')
      return ok(doc)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch document') }
  })

  ipcMain.handle(IPC.DOCUMENTS.CREATE, (_e, params: CreateDocumentParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      if (!params?.file_path?.trim()) return fail('File path is required', 'VALIDATION')
      if (!params?.original_filename?.trim()) return fail('Filename is required', 'VALIDATION')
      return ok(createDocument(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create document') }
  })

  ipcMain.handle(IPC.DOCUMENTS.UPDATE, (_e, id: string, params: UpdateDocumentParams) => {
    try {
      const updated = updateDocument(getDatabase(), id, params)
      if (!updated) return fail('Document not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update document') }
  })

  ipcMain.handle(IPC.DOCUMENTS.DELETE, (_e, id: string) => {
    try {
      const deleted = softDeleteDocument(getDatabase(), id)
      if (!deleted) return fail('Document not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete document') }
  })

  ipcMain.handle(IPC.DOCUMENTS.OPEN, async (_e, id: string) => {
    try {
      const doc = getDocumentById(getDatabase(), id)
      if (!doc) return fail('Document not found', 'NOT_FOUND')
      const errMsg = await shell.openPath(doc.file_path)
      if (errMsg) return fail(`Could not open file: ${errMsg}`)
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to open document') }
  })
}
