import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllPlaylists, getPlaylistById, createPlaylist, updatePlaylist, deletePlaylist,
  createPlaylistItem, updatePlaylistItem, deletePlaylistItem, reorderPlaylistItems,
  type CreatePlaylistParams, type UpdatePlaylistParams,
  type CreatePlaylistItemParams, type UpdatePlaylistItemParams,
} from '../services/playlists/playlists.service'

export function registerPlaylistsHandlers(): void {
  ipcMain.handle(IPC.PLAYLISTS.GET_ALL, (_e, skillId?: string) => {
    try { return ok(getAllPlaylists(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch playlists') }
  })

  ipcMain.handle(IPC.PLAYLISTS.GET_BY_ID, (_e, id: string) => {
    try {
      const playlist = getPlaylistById(getDatabase(), id)
      if (!playlist) return fail('Playlist not found', 'NOT_FOUND')
      return ok(playlist)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch playlist') }
  })

  ipcMain.handle(IPC.PLAYLISTS.CREATE, (_e, params: CreatePlaylistParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createPlaylist(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create playlist') }
  })

  ipcMain.handle(IPC.PLAYLISTS.UPDATE, (_e, id: string, params: UpdatePlaylistParams) => {
    try {
      const result = updatePlaylist(getDatabase(), id, params)
      if (!result) return fail('Playlist not found', 'NOT_FOUND')
      return ok(result)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update playlist') }
  })

  ipcMain.handle(IPC.PLAYLISTS.DELETE, (_e, id: string) => {
    try {
      if (!deletePlaylist(getDatabase(), id)) return fail('Playlist not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete playlist') }
  })

  ipcMain.handle(IPC.PLAYLISTS.ITEMS.CREATE, (_e, params: CreatePlaylistItemParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createPlaylistItem(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to add item') }
  })

  ipcMain.handle(IPC.PLAYLISTS.ITEMS.UPDATE, (_e, id: string, params: UpdatePlaylistItemParams) => {
    try {
      const result = updatePlaylistItem(getDatabase(), id, params)
      if (!result) return fail('Item not found', 'NOT_FOUND')
      return ok(result)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update item') }
  })

  ipcMain.handle(IPC.PLAYLISTS.ITEMS.DELETE, (_e, id: string) => {
    try {
      if (!deletePlaylistItem(getDatabase(), id)) return fail('Item not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete item') }
  })

  ipcMain.handle(IPC.PLAYLISTS.ITEMS.REORDER, (_e, playlistId: string, orderedIds: string[]) => {
    try {
      reorderPlaylistItems(getDatabase(), playlistId, orderedIds)
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to reorder items') }
  })
}
