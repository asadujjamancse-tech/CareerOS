import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  softDeleteProject,
  createProjectAsset,
  deleteProjectAsset,
  reorderProjectAssets,
  type GetAllProjectsParams,
  type CreateProjectParams,
  type UpdateProjectParams,
  type CreateProjectAssetParams,
} from '../services/projects/projects.service'

export function registerProjectsHandlers(): void {
  ipcMain.handle(IPC.PROJECTS.GET_ALL, (_event, params: GetAllProjectsParams | undefined) => {
    try {
      return ok(getAllProjects(getDatabase(), params ?? {}))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch projects')
    }
  })

  ipcMain.handle(IPC.PROJECTS.GET_BY_ID, (_event, id: string) => {
    try {
      const project = getProjectById(getDatabase(), id)
      if (!project) return fail('Project not found', 'NOT_FOUND')
      return ok(project)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch project')
    }
  })

  ipcMain.handle(IPC.PROJECTS.CREATE, (_event, params: CreateProjectParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createProject(getDatabase(), params))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to create project')
    }
  })

  ipcMain.handle(IPC.PROJECTS.UPDATE, (_event, id: string, params: UpdateProjectParams) => {
    try {
      const updated = updateProject(getDatabase(), id, params)
      if (!updated) return fail('Project not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to update project')
    }
  })

  ipcMain.handle(IPC.PROJECTS.DELETE, (_event, id: string) => {
    try {
      const deleted = softDeleteProject(getDatabase(), id)
      if (!deleted) return fail('Project not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to delete project')
    }
  })
}

export function registerProjectAssetsHandlers(): void {
  ipcMain.handle(IPC.PROJECT_ASSETS.CREATE, (_event, params: CreateProjectAssetParams) => {
    try {
      if (!params?.project_id) return fail('project_id is required', 'VALIDATION')
      if (!params?.title?.trim()) return fail('title is required', 'VALIDATION')
      return ok(createProjectAsset(getDatabase(), params))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to create asset')
    }
  })

  ipcMain.handle(IPC.PROJECT_ASSETS.DELETE, (_event, id: string) => {
    try {
      const deleted = deleteProjectAsset(getDatabase(), id)
      if (!deleted) return fail('Asset not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to delete asset')
    }
  })

  ipcMain.handle(IPC.PROJECT_ASSETS.REORDER, (_event, projectId: string, ids: string[]) => {
    try {
      reorderProjectAssets(getDatabase(), projectId, ids)
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to reorder assets')
    }
  })
}
