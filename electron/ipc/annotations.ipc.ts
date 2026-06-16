import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAnnotationsByDocument, createAnnotation, updateAnnotation,
  deleteAnnotation, deleteAnnotationsByDocument,
  getReadingProgress, upsertReadingProgress, getDocumentReadingStats,
} from '../services/annotations/annotations.service'
import type { AnnotationType } from '../services/annotations/annotations.service'

export function registerAnnotationsHandlers(): void {
  ipcMain.handle(IPC.ANNOTATIONS.GET_BY_DOCUMENT, (_e, documentId: string, type?: AnnotationType) => {
    try { return ok(getAnnotationsByDocument(getDatabase(), documentId, type)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get annotations') }
  })

  ipcMain.handle(IPC.ANNOTATIONS.CREATE, (_e, params: unknown) => {
    try {
      const p = params as Parameters<typeof createAnnotation>[1]
      if (!p.document_id || !p.position_json) return fail('Missing required fields')
      return ok(createAnnotation(getDatabase(), p))
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to create annotation') }
  })

  ipcMain.handle(IPC.ANNOTATIONS.UPDATE, (_e, id: string, params: unknown) => {
    try { return ok(updateAnnotation(getDatabase(), id, params as Parameters<typeof updateAnnotation>[2])) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update annotation') }
  })

  ipcMain.handle(IPC.ANNOTATIONS.DELETE, (_e, id: string) => {
    try { deleteAnnotation(getDatabase(), id); return ok(null) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete annotation') }
  })

  ipcMain.handle(IPC.ANNOTATIONS.DELETE_BY_DOCUMENT, (_e, documentId: string) => {
    try { deleteAnnotationsByDocument(getDatabase(), documentId); return ok(null) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete annotations') }
  })

  ipcMain.handle(IPC.ANNOTATIONS.GET_READING_PROGRESS, (_e, documentId: string) => {
    try { return ok(getReadingProgress(getDatabase(), documentId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get reading progress') }
  })

  ipcMain.handle(IPC.ANNOTATIONS.UPDATE_READING_PROGRESS, (
    _e, documentId: string, currentPage: number, totalPages?: number,
    scrollPosition?: number, additionalMinutes?: number, completed?: boolean
  ) => {
    try {
      return ok(upsertReadingProgress(getDatabase(), documentId, currentPage, totalPages, scrollPosition, additionalMinutes, completed))
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update reading progress') }
  })

  ipcMain.handle(IPC.ANNOTATIONS.GET_READING_STATS, () => {
    try { return ok(getDocumentReadingStats(getDatabase())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get reading stats') }
  })
}
