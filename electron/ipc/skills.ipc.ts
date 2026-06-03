import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllSkills,
  getSkillById,
  createSkill,
  updateSkill,
  softDeleteSkill,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type GetAllParams,
  type CreateSkillParams,
  type UpdateSkillParams,
} from '../services/skills/skills.service'

export function registerSkillsHandlers(): void {
  ipcMain.handle(IPC.SKILLS.GET_ALL, (_event, filters: GetAllParams | undefined) => {
    try {
      const db = getDatabase()
      return ok(getAllSkills(db, filters ?? {}))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch skills')
    }
  })

  ipcMain.handle(IPC.SKILLS.GET_BY_ID, (_event, id: string) => {
    try {
      const db = getDatabase()
      const skill = getSkillById(db, id)
      if (!skill) return fail('Skill not found', 'NOT_FOUND')
      return ok(skill)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch skill')
    }
  })

  ipcMain.handle(IPC.SKILLS.CREATE, (_event, params: CreateSkillParams) => {
    try {
      if (!params?.name?.trim()) return fail('Name is required', 'VALIDATION')
      if (!params?.category_id) return fail('Category is required', 'VALIDATION')
      const db = getDatabase()
      return ok(createSkill(db, params))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to create skill')
    }
  })

  ipcMain.handle(IPC.SKILLS.UPDATE, (_event, id: string, params: UpdateSkillParams) => {
    try {
      const db = getDatabase()
      const updated = updateSkill(db, id, params)
      if (!updated) return fail('Skill not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to update skill')
    }
  })

  ipcMain.handle(IPC.SKILLS.DELETE, (_event, id: string) => {
    try {
      const db = getDatabase()
      const deleted = softDeleteSkill(db, id)
      if (!deleted) return fail('Skill not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to delete skill')
    }
  })
}

export function registerSkillCategoriesHandlers(): void {
  ipcMain.handle(IPC.SKILL_CATEGORIES.GET_ALL, () => {
    try {
      return ok(getAllCategories(getDatabase()))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch categories')
    }
  })

  ipcMain.handle(IPC.SKILL_CATEGORIES.CREATE, (_event, params: Parameters<typeof createCategory>[1]) => {
    try {
      if (!params?.name?.trim()) return fail('Name is required', 'VALIDATION')
      return ok(createCategory(getDatabase(), params))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to create category')
    }
  })

  ipcMain.handle(IPC.SKILL_CATEGORIES.UPDATE, (_event, id: string, params: Parameters<typeof updateCategory>[2]) => {
    try {
      const updated = updateCategory(getDatabase(), id, params ?? {})
      if (!updated) return fail('Category not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to update category')
    }
  })

  ipcMain.handle(IPC.SKILL_CATEGORIES.DELETE, (_event, id: string) => {
    try {
      const deleted = deleteCategory(getDatabase(), id)
      if (!deleted) return fail('Category not found or has skills assigned', 'CONFLICT')
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to delete category')
    }
  })
}
