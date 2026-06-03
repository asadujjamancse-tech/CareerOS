import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllTags, getTagById, createTag, updateTag, deleteTag,
  getEntityTags, setEntityTags,
  type CreateTagParams, type UpdateTagParams,
} from '../services/tags/tags.service'

export function registerTagsHandlers(): void {
  ipcMain.handle(IPC.TAGS.GET_ALL, () => {
    try { return ok(getAllTags(getDatabase())) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch tags') }
  })

  ipcMain.handle(IPC.TAGS.CREATE, (_e, params: CreateTagParams) => {
    try {
      if (!params?.name?.trim()) return fail('Name is required', 'VALIDATION')
      return ok(createTag(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create tag') }
  })

  ipcMain.handle(IPC.TAGS.UPDATE, (_e, id: string, params: UpdateTagParams) => {
    try {
      const updated = updateTag(getDatabase(), id, params)
      if (!updated) return fail('Tag not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update tag') }
  })

  ipcMain.handle(IPC.TAGS.DELETE, (_e, id: string) => {
    try {
      const deleted = deleteTag(getDatabase(), id)
      if (!deleted) return fail('Tag not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete tag') }
  })

  ipcMain.handle(IPC.TAGS.GET_ENTITY_TAGS, (_e, entityType: string, entityId: string) => {
    try { return ok(getEntityTags(getDatabase(), entityType, entityId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch entity tags') }
  })

  ipcMain.handle(IPC.TAGS.SET_ENTITY_TAGS, (_e, entityType: string, entityId: string, tagIds: string[]) => {
    try {
      setEntityTags(getDatabase(), entityType, entityId, tagIds ?? [])
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to set entity tags') }
  })

  // Used internally for tag lookup — expose single tag by id
  ipcMain.handle('tags:get-by-id', (_e, id: string) => {
    try {
      const tag = getTagById(getDatabase(), id)
      if (!tag) return fail('Tag not found', 'NOT_FOUND')
      return ok(tag)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch tag') }
  })
}
