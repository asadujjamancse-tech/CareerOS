import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllVideos, getVideoById, createVideo, updateVideo, softDeleteVideo, updateVideoProgress,
  type GetAllVideosParams, type CreateVideoParams, type UpdateVideoParams,
} from '../services/videos/videos.service'

export function registerVideosHandlers(): void {
  ipcMain.handle(IPC.VIDEOS.GET_ALL, (_e, params: GetAllVideosParams | undefined) => {
    try { return ok(getAllVideos(getDatabase(), params ?? {})) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch videos') }
  })

  ipcMain.handle(IPC.VIDEOS.GET_BY_ID, (_e, id: string) => {
    try {
      const video = getVideoById(getDatabase(), id)
      if (!video) return fail('Video not found', 'NOT_FOUND')
      return ok(video)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch video') }
  })

  ipcMain.handle(IPC.VIDEOS.CREATE, (_e, params: CreateVideoParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createVideo(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create video') }
  })

  ipcMain.handle(IPC.VIDEOS.UPDATE, (_e, id: string, params: UpdateVideoParams) => {
    try {
      const updated = updateVideo(getDatabase(), id, params)
      if (!updated) return fail('Video not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update video') }
  })

  ipcMain.handle(IPC.VIDEOS.DELETE, (_e, id: string) => {
    try {
      const deleted = softDeleteVideo(getDatabase(), id)
      if (!deleted) return fail('Video not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete video') }
  })

  ipcMain.handle(IPC.VIDEOS.UPDATE_PROGRESS, (_e, id: string, seconds: number) => {
    try {
      updateVideoProgress(getDatabase(), id, seconds)
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update progress') }
  })
}
