import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllQuestions, getQuestionById, createQuestion, updateQuestion, softDeleteQuestion,
  recordReview, getRandomQuestions, getProgressStats,
  getAllCategories, createCategory, updateCategory, deleteCategory,
  type GetAllQuestionsParams, type CreateQuestionParams, type UpdateQuestionParams,
  type CreateCategoryParams, type UpdateCategoryParams,
} from '../services/interview-questions/interview-questions.service'

export function registerInterviewQuestionsHandlers(): void {
  // ── Categories ─────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.INTERVIEW_CATEGORIES.GET_ALL, () => {
    try { return ok(getAllCategories(getDatabase())) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch categories') }
  })

  ipcMain.handle(IPC.INTERVIEW_CATEGORIES.CREATE, (_e, params: CreateCategoryParams) => {
    try {
      if (!params?.name?.trim()) return fail('Name is required', 'VALIDATION')
      return ok(createCategory(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create category') }
  })

  ipcMain.handle(IPC.INTERVIEW_CATEGORIES.UPDATE, (_e, id: string, params: UpdateCategoryParams) => {
    try {
      const updated = updateCategory(getDatabase(), id, params)
      if (!updated) return fail('Category not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update category') }
  })

  ipcMain.handle(IPC.INTERVIEW_CATEGORIES.DELETE, (_e, id: string) => {
    try {
      const deleted = deleteCategory(getDatabase(), id)
      if (!deleted) return fail('Category in use or not found', 'CONFLICT')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete category') }
  })

  // ── Questions ──────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.INTERVIEW_QUESTIONS.GET_ALL, (_e, params: GetAllQuestionsParams | undefined) => {
    try { return ok(getAllQuestions(getDatabase(), params ?? {})) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch questions') }
  })

  ipcMain.handle(IPC.INTERVIEW_QUESTIONS.GET_BY_ID, (_e, id: string) => {
    try {
      const q = getQuestionById(getDatabase(), id)
      if (!q) return fail('Question not found', 'NOT_FOUND')
      return ok(q)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch question') }
  })

  ipcMain.handle(IPC.INTERVIEW_QUESTIONS.CREATE, (_e, params: CreateQuestionParams) => {
    try {
      if (!params?.question?.trim()) return fail('Question is required', 'VALIDATION')
      if (!params?.category_id) return fail('Category is required', 'VALIDATION')
      return ok(createQuestion(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create question') }
  })

  ipcMain.handle(IPC.INTERVIEW_QUESTIONS.UPDATE, (_e, id: string, params: UpdateQuestionParams) => {
    try {
      const updated = updateQuestion(getDatabase(), id, params)
      if (!updated) return fail('Question not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update question') }
  })

  ipcMain.handle(IPC.INTERVIEW_QUESTIONS.DELETE, (_e, id: string) => {
    try {
      const deleted = softDeleteQuestion(getDatabase(), id)
      if (!deleted) return fail('Question not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete question') }
  })

  ipcMain.handle(IPC.INTERVIEW_QUESTIONS.GET_RANDOM, (_e, params: { category_id?: string; difficulty?: string; count?: number } | undefined) => {
    try { return ok(getRandomQuestions(getDatabase(), params ?? {})) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch random questions') }
  })

  ipcMain.handle(IPC.INTERVIEW_QUESTIONS.RECORD_REVIEW, (_e, id: string, mastery_score: number) => {
    try {
      if (mastery_score < 0 || mastery_score > 5) return fail('Mastery score must be 0–5', 'VALIDATION')
      const updated = recordReview(getDatabase(), id, mastery_score)
      if (!updated) return fail('Question not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to record review') }
  })

  ipcMain.handle(IPC.INTERVIEW_QUESTIONS.GET_PROGRESS, () => {
    try { return ok(getProgressStats(getDatabase())) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch progress') }
  })
}
