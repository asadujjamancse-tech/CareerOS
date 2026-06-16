import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getPDFProgress,
  upsertPDFProgress,
  deletePDFProgress,
  getRecentlyReadPDFs,
  getReadingStats,
  type UpsertPDFProgressParams,
} from '../services/vault/pdf-progress.service'

export function registerPDFReaderHandlers(): void {
  const db = () => getDatabase()

  ipcMain.handle(IPC.PDF_READER.GET_PROGRESS, (_e, documentId: string) => {
    try { return ok(getPDFProgress(db(), documentId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get PDF progress') }
  })

  ipcMain.handle(IPC.PDF_READER.SAVE_PROGRESS, (_e, documentId: string, params: UpsertPDFProgressParams) => {
    try { return ok(upsertPDFProgress(db(), documentId, params)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to save PDF progress') }
  })

  ipcMain.handle(IPC.PDF_READER.DELETE_PROGRESS, (_e, documentId: string) => {
    try { return ok(deletePDFProgress(db(), documentId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete PDF progress') }
  })

  ipcMain.handle(IPC.PDF_READER.GET_RECENT, (_e, limit?: number) => {
    try { return ok(getRecentlyReadPDFs(db(), limit)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get recent PDFs') }
  })

  ipcMain.handle(IPC.PDF_READER.GET_STATS, () => {
    try { return ok(getReadingStats(db())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get reading stats') }
  })
}
