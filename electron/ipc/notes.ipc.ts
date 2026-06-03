import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllNotes, getNoteById, createNote, updateNote, softDeleteNote,
  type GetAllNotesParams, type CreateNoteParams, type UpdateNoteParams,
} from '../services/notes/notes.service'

export function registerNotesHandlers(): void {
  ipcMain.handle(IPC.NOTES.GET_ALL, (_e, params: GetAllNotesParams | undefined) => {
    try { return ok(getAllNotes(getDatabase(), params ?? {})) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch notes') }
  })

  ipcMain.handle(IPC.NOTES.GET_BY_ID, (_e, id: string) => {
    try {
      const note = getNoteById(getDatabase(), id)
      if (!note) return fail('Note not found', 'NOT_FOUND')
      return ok(note)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch note') }
  })

  ipcMain.handle(IPC.NOTES.CREATE, (_e, params: CreateNoteParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createNote(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create note') }
  })

  ipcMain.handle(IPC.NOTES.UPDATE, (_e, id: string, params: UpdateNoteParams) => {
    try {
      const updated = updateNote(getDatabase(), id, params)
      if (!updated) return fail('Note not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update note') }
  })

  ipcMain.handle(IPC.NOTES.DELETE, (_e, id: string) => {
    try {
      const deleted = softDeleteNote(getDatabase(), id)
      if (!deleted) return fail('Note not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete note') }
  })
}
