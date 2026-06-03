import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllOccupations,
  getOccupationById,
  createOccupation,
  updateOccupation,
  softDeleteOccupation,
  getOccupationSkills,
  setOccupationSkills,
  updateOccupationSkill,
  removeOccupationSkill,
  type GetAllOccupationsParams,
  type CreateOccupationParams,
  type UpdateOccupationParams,
  type SkillEntry,
} from '../services/occupations/occupations.service'

export function registerOccupationsHandlers(): void {
  ipcMain.handle(IPC.OCCUPATIONS.GET_ALL, (_e, params: GetAllOccupationsParams | undefined) => {
    try {
      return ok(getAllOccupations(getDatabase(), params ?? {}))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch occupations')
    }
  })

  ipcMain.handle(IPC.OCCUPATIONS.GET_BY_ID, (_e, id: string) => {
    try {
      const occupation = getOccupationById(getDatabase(), id)
      if (!occupation) return fail('Occupation not found', 'NOT_FOUND')
      return ok(occupation)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch occupation')
    }
  })

  ipcMain.handle(IPC.OCCUPATIONS.CREATE, (_e, params: CreateOccupationParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createOccupation(getDatabase(), params))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to create occupation')
    }
  })

  ipcMain.handle(IPC.OCCUPATIONS.UPDATE, (_e, id: string, params: UpdateOccupationParams) => {
    try {
      const updated = updateOccupation(getDatabase(), id, params)
      if (!updated) return fail('Occupation not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to update occupation')
    }
  })

  ipcMain.handle(IPC.OCCUPATIONS.DELETE, (_e, id: string) => {
    try {
      const deleted = softDeleteOccupation(getDatabase(), id)
      if (!deleted) return fail('Occupation not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to delete occupation')
    }
  })
}

export function registerOccupationSkillsHandlers(): void {
  ipcMain.handle(IPC.OCCUPATIONS.SKILLS.GET, (_e, occupationId: string) => {
    try {
      return ok(getOccupationSkills(getDatabase(), occupationId))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch occupation skills')
    }
  })

  ipcMain.handle(IPC.OCCUPATIONS.SKILLS.SET, (_e, occupationId: string, entries: SkillEntry[]) => {
    try {
      if (!occupationId) return fail('occupationId is required', 'VALIDATION')
      setOccupationSkills(getDatabase(), occupationId, entries ?? [])
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to set occupation skills')
    }
  })

  ipcMain.handle(
    IPC.OCCUPATIONS.SKILLS.UPDATE,
    (_e, id: string, params: Partial<{ importance: string; is_acquired: number; notes: string | null }>) => {
      try {
        const updated = updateOccupationSkill(getDatabase(), id, params)
        if (!updated) return fail('Skill link not found', 'NOT_FOUND')
        return ok(updated)
      } catch (err) {
        return fail(err instanceof Error ? err.message : 'Failed to update occupation skill')
      }
    },
  )

  ipcMain.handle(IPC.OCCUPATIONS.SKILLS.REMOVE, (_e, id: string) => {
    try {
      const removed = removeOccupationSkill(getDatabase(), id)
      if (!removed) return fail('Skill link not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to remove occupation skill')
    }
  })
}
