import { ipcMain } from 'electron'
import { IPC, ok, fail } from './channels'
import { learningCoachService } from '../services/learning-coach/learning-coach.service'

export function registerLearningCoachHandlers(): void {
  const LC = IPC.LEARNING_COACH

  // ── Learning Paths ──────────────────────────────────────────────────────────

  ipcMain.handle(LC.LEARNING_PATHS.GET_ALL, () => {
    try { return ok(learningCoachService.getAllPaths()) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.LEARNING_PATHS.GET_BY_ID, (_e, id: string) => {
    try { return ok(learningCoachService.getPathById(id)) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.LEARNING_PATHS.CREATE, (_e, data: Parameters<typeof learningCoachService.createPath>[0]) => {
    try { return ok(learningCoachService.createPath(data)) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.LEARNING_PATHS.UPDATE, (_e, id: string, data: Parameters<typeof learningCoachService.updatePath>[1]) => {
    try { return ok(learningCoachService.updatePath(id, data)) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.LEARNING_PATHS.DELETE, (_e, id: string) => {
    try { learningCoachService.deletePath(id); return ok(undefined) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.LEARNING_PATHS.SET_SKILLS, (_e, pathId: string, skills: Parameters<typeof learningCoachService.setPathSkills>[1]) => {
    try { learningCoachService.setPathSkills(pathId, skills); return ok(undefined) }
    catch (e) { return fail(String(e)) }
  })

  // ── Skill Methods ───────────────────────────────────────────────────────────

  ipcMain.handle(LC.SKILL_METHODS.GET_ALL, () => {
    try { return ok(learningCoachService.getAllMethodConfigs()) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.SKILL_METHODS.GET_BY_SKILL, (_e, skillId: string) => {
    try { return ok(learningCoachService.getMethodConfigBySkill(skillId)) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.SKILL_METHODS.UPSERT, (_e, skillId: string, data: Parameters<typeof learningCoachService.upsertMethodConfig>[1]) => {
    try { return ok(learningCoachService.upsertMethodConfig(skillId, data)) }
    catch (e) { return fail(String(e)) }
  })

  // ── Retention ───────────────────────────────────────────────────────────────

  ipcMain.handle(LC.RETENTION.GET_ALL, () => {
    try { return ok(learningCoachService.getAllRetentionRecords()) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.RETENTION.GET_DUE, () => {
    try { return ok(learningCoachService.getDueReviews()) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.RETENTION.UPSERT, (_e, skillId: string) => {
    try { return ok(learningCoachService.upsertRetention(skillId)) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.RETENTION.RECORD_REVIEW, (_e, skillId: string, quality: number, notes?: string | null) => {
    try { return ok(learningCoachService.recordReview(skillId, quality, notes)) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.RETENTION.GET_LOGS, (_e, skillId?: string) => {
    try { return ok(learningCoachService.getReviewLogs(skillId)) }
    catch (e) { return fail(String(e)) }
  })

  // ── Study Plans ─────────────────────────────────────────────────────────────

  ipcMain.handle(LC.STUDY_PLANS.GET_ALL, () => {
    try { return ok(learningCoachService.getAllPlans()) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.STUDY_PLANS.GET_BY_ID, (_e, id: string) => {
    try { return ok(learningCoachService.getPlanById(id)) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.STUDY_PLANS.GENERATE, (_e, input: Parameters<typeof learningCoachService.generatePlan>[0]) => {
    try { return ok(learningCoachService.generatePlan(input)) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.STUDY_PLANS.DELETE, (_e, id: string) => {
    try { learningCoachService.deletePlan(id); return ok(undefined) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.STUDY_PLANS.MARK_ITEM_DONE, (_e, itemId: string, done: boolean) => {
    try { return ok(learningCoachService.markPlanItemDone(itemId, done)) }
    catch (e) { return fail(String(e)) }
  })

  // ── Dependencies ────────────────────────────────────────────────────────────

  ipcMain.handle(LC.DEPENDENCIES.GET_ALL, () => {
    try { return ok(learningCoachService.getAllDependencies()) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.DEPENDENCIES.ADD, (_e, skillId: string, prerequisiteId: string, strength?: 'required' | 'recommended' | 'optional') => {
    try { learningCoachService.addDependency(skillId, prerequisiteId, strength); return ok(undefined) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.DEPENDENCIES.REMOVE, (_e, skillId: string, prerequisiteId: string) => {
    try { learningCoachService.removeDependency(skillId, prerequisiteId); return ok(undefined) }
    catch (e) { return fail(String(e)) }
  })

  ipcMain.handle(LC.DEPENDENCIES.GET_GRAPH, () => {
    try { return ok(learningCoachService.getDependencyGraph()) }
    catch (e) { return fail(String(e)) }
  })

  // ── Effectiveness ───────────────────────────────────────────────────────────

  ipcMain.handle(LC.EFFECTIVENESS.GET_METRICS, () => {
    try { return ok(learningCoachService.getEffectivenessMetrics()) }
    catch (e) { return fail(String(e)) }
  })
}
