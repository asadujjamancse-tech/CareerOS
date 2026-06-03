import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllJournalEntries, getJournalEntryById, createJournalEntry, updateJournalEntry, softDeleteJournalEntry,
  type GetAllJournalParams, type CreateJournalParams, type UpdateJournalParams,
} from '../services/journal/journal.service'

export function registerJournalHandlers(): void {
  ipcMain.handle(IPC.JOURNAL.GET_ALL, (_e, params: GetAllJournalParams | undefined) => {
    try { return ok(getAllJournalEntries(getDatabase(), params ?? {})) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch journal entries') }
  })

  ipcMain.handle(IPC.JOURNAL.GET_BY_ID, (_e, id: string) => {
    try {
      const entry = getJournalEntryById(getDatabase(), id)
      if (!entry) return fail('Entry not found', 'NOT_FOUND')
      return ok(entry)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch entry') }
  })

  ipcMain.handle(IPC.JOURNAL.CREATE, (_e, params: CreateJournalParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      if (!params?.entry_date) return fail('Entry date is required', 'VALIDATION')
      return ok(createJournalEntry(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create entry') }
  })

  ipcMain.handle(IPC.JOURNAL.UPDATE, (_e, id: string, params: UpdateJournalParams) => {
    try {
      const updated = updateJournalEntry(getDatabase(), id, params)
      if (!updated) return fail('Entry not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update entry') }
  })

  ipcMain.handle(IPC.JOURNAL.DELETE, (_e, id: string) => {
    try {
      const deleted = softDeleteJournalEntry(getDatabase(), id)
      if (!deleted) return fail('Entry not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete entry') }
  })
}
