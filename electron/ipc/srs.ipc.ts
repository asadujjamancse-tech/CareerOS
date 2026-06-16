import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getDueCards, getUpcomingCards, getAllCards, getCardById,
  createCard, updateCard, recordReview, deleteCard,
  getReviewHistory, getSrsStats, bulkCreateFromInterviewQuestions, bulkCreateFromNotes,
} from '../services/srs/srs.service'
import type { SrsEntityType } from '../services/srs/srs.service'

export function registerSrsHandlers(): void {
  ipcMain.handle(IPC.SRS.GET_DUE, (_e, limit?: number) => {
    try { return ok(getDueCards(getDatabase(), limit)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get due cards') }
  })

  ipcMain.handle(IPC.SRS.GET_UPCOMING, (_e, days?: number) => {
    try { return ok(getUpcomingCards(getDatabase(), days)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get upcoming cards') }
  })

  ipcMain.handle(IPC.SRS.GET_ALL, (_e, entityType?: SrsEntityType, entityId?: string) => {
    try { return ok(getAllCards(getDatabase(), entityType, entityId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get cards') }
  })

  ipcMain.handle(IPC.SRS.GET_BY_ID, (_e, id: string) => {
    try {
      const card = getCardById(getDatabase(), id)
      if (!card) return fail('Card not found', 'NOT_FOUND')
      return ok(card)
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get card') }
  })

  ipcMain.handle(IPC.SRS.CREATE, (_e, params: unknown) => {
    try {
      const p = params as Parameters<typeof createCard>[1]
      if (!p.entity_type || !p.entity_id || !p.front || !p.back) return fail('Missing required fields')
      return ok(createCard(getDatabase(), p))
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to create card') }
  })

  ipcMain.handle(IPC.SRS.UPDATE, (_e, id: string, params: unknown) => {
    try { return ok(updateCard(getDatabase(), id, params as Parameters<typeof updateCard>[2])) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update card') }
  })

  ipcMain.handle(IPC.SRS.RECORD_REVIEW, (_e, cardId: string, rating: number, timeSpentMs: number) => {
    try {
      if (rating < 0 || rating > 5) return fail('Rating must be 0-5')
      return ok(recordReview(getDatabase(), cardId, rating, timeSpentMs ?? 0))
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to record review') }
  })

  ipcMain.handle(IPC.SRS.DELETE, (_e, id: string) => {
    try { deleteCard(getDatabase(), id); return ok(null) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete card') }
  })

  ipcMain.handle(IPC.SRS.GET_REVIEW_HISTORY, (_e, cardId: string) => {
    try { return ok(getReviewHistory(getDatabase(), cardId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get review history') }
  })

  ipcMain.handle(IPC.SRS.GET_STATS, () => {
    try { return ok(getSrsStats(getDatabase())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get SRS stats') }
  })

  ipcMain.handle(IPC.SRS.BULK_FROM_INTERVIEW, () => {
    try { return ok({ created: bulkCreateFromInterviewQuestions(getDatabase()) }) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to bulk create from interview questions') }
  })

  ipcMain.handle(IPC.SRS.BULK_FROM_NOTES, () => {
    try { return ok({ created: bulkCreateFromNotes(getDatabase()) }) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to bulk create from notes') }
  })
}
