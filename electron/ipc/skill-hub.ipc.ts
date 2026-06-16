import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getSkillHubOverview,
  getSkillModules,
  createSkillModule,
  updateSkillModule,
  deleteSkillModule,
  reorderSkillModules,
  createSkillModuleTopic,
  updateSkillModuleTopic,
  deleteSkillModuleTopic,
  getSkillResources,
  createSkillResource,
  updateSkillResource,
  deleteSkillResource,
  getSkillExperienceLog,
  createSkillExperienceEntry,
  updateSkillExperienceEntry,
  deleteSkillExperienceEntry,
  getSkillQuizQuestions,
  createSkillQuizQuestion,
  updateSkillQuizQuestion,
  deleteSkillQuizQuestion,
  logSkillQuizAttempt,
  getSkillQuizAttemptStats,
  getLinkedLabs,
  linkLab,
  unlinkLab,
  getLinkedProjects,
  linkProject,
  unlinkProject,
  getLinkedCertifications,
  linkCertification,
  unlinkCertification,
  getLinkedInterviewQuestions,
  linkInterviewQuestion,
  unlinkInterviewQuestion,
  getLinkedVideos,
  getRelatedSkills,
} from '../services/skill-hub/skill-hub.service'

export function registerSkillHubHandlers(): void {
  // ── Overview ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.GET_OVERVIEW, (_e, skillId: string) => {
    try {
      const data = getSkillHubOverview(getDatabase(), skillId)
      if (!data) return fail('Skill not found', 'NOT_FOUND')
      return ok(data)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to get skill hub overview')
    }
  })

  // ── Modules ───────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.MODULES.GET_ALL, (_e, skillId: string) => {
    try { return ok(getSkillModules(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get modules') }
  })

  ipcMain.handle(IPC.SKILL_HUB.MODULES.CREATE, (_e, params: Parameters<typeof createSkillModule>[1]) => {
    try {
      if (!params?.skill_id) return fail('skill_id is required', 'VALIDATION')
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createSkillModule(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create module') }
  })

  ipcMain.handle(IPC.SKILL_HUB.MODULES.UPDATE, (_e, id: string, params: Parameters<typeof updateSkillModule>[2]) => {
    try {
      const result = updateSkillModule(getDatabase(), id, params ?? {})
      if (!result) return fail('Module not found', 'NOT_FOUND')
      return ok(result)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update module') }
  })

  ipcMain.handle(IPC.SKILL_HUB.MODULES.DELETE, (_e, id: string) => {
    try {
      if (!deleteSkillModule(getDatabase(), id)) return fail('Module not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete module') }
  })

  ipcMain.handle(IPC.SKILL_HUB.MODULES.REORDER, (_e, skillId: string, orderedIds: string[]) => {
    try {
      reorderSkillModules(getDatabase(), skillId, orderedIds)
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to reorder modules') }
  })

  // ── Module Topics ──────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.MODULE_TOPICS.CREATE, (_e, params: Parameters<typeof createSkillModuleTopic>[1]) => {
    try {
      if (!params?.module_id) return fail('module_id is required', 'VALIDATION')
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createSkillModuleTopic(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create topic') }
  })

  ipcMain.handle(IPC.SKILL_HUB.MODULE_TOPICS.UPDATE, (_e, id: string, params: Parameters<typeof updateSkillModuleTopic>[2]) => {
    try {
      const result = updateSkillModuleTopic(getDatabase(), id, params ?? {})
      if (!result) return fail('Topic not found', 'NOT_FOUND')
      return ok(result)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update topic') }
  })

  ipcMain.handle(IPC.SKILL_HUB.MODULE_TOPICS.DELETE, (_e, id: string) => {
    try {
      if (!deleteSkillModuleTopic(getDatabase(), id)) return fail('Topic not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete topic') }
  })

  // ── Resources ─────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.RESOURCES.GET_ALL, (_e, skillId: string) => {
    try { return ok(getSkillResources(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get resources') }
  })

  ipcMain.handle(IPC.SKILL_HUB.RESOURCES.CREATE, (_e, params: Parameters<typeof createSkillResource>[1]) => {
    try {
      if (!params?.skill_id) return fail('skill_id is required', 'VALIDATION')
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createSkillResource(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create resource') }
  })

  ipcMain.handle(IPC.SKILL_HUB.RESOURCES.UPDATE, (_e, id: string, params: Parameters<typeof updateSkillResource>[2]) => {
    try {
      const result = updateSkillResource(getDatabase(), id, params ?? {})
      if (!result) return fail('Resource not found', 'NOT_FOUND')
      return ok(result)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update resource') }
  })

  ipcMain.handle(IPC.SKILL_HUB.RESOURCES.DELETE, (_e, id: string) => {
    try {
      if (!deleteSkillResource(getDatabase(), id)) return fail('Resource not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete resource') }
  })

  // ── Experience Log ────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.EXPERIENCE_LOG.GET_ALL, (_e, skillId: string) => {
    try { return ok(getSkillExperienceLog(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get experience log') }
  })

  ipcMain.handle(IPC.SKILL_HUB.EXPERIENCE_LOG.CREATE, (_e, params: Parameters<typeof createSkillExperienceEntry>[1]) => {
    try {
      if (!params?.skill_id) return fail('skill_id is required', 'VALIDATION')
      if (!params?.task?.trim()) return fail('Task is required', 'VALIDATION')
      return ok(createSkillExperienceEntry(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create entry') }
  })

  ipcMain.handle(IPC.SKILL_HUB.EXPERIENCE_LOG.UPDATE, (_e, id: string, params: Parameters<typeof updateSkillExperienceEntry>[2]) => {
    try {
      const result = updateSkillExperienceEntry(getDatabase(), id, params ?? {})
      if (!result) return fail('Entry not found', 'NOT_FOUND')
      return ok(result)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update entry') }
  })

  ipcMain.handle(IPC.SKILL_HUB.EXPERIENCE_LOG.DELETE, (_e, id: string) => {
    try {
      if (!deleteSkillExperienceEntry(getDatabase(), id)) return fail('Entry not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete entry') }
  })

  // ── Quiz Questions ────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.QUIZ_QUESTIONS.GET_ALL, (_e, skillId: string) => {
    try { return ok(getSkillQuizQuestions(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get quiz questions') }
  })

  ipcMain.handle(IPC.SKILL_HUB.QUIZ_QUESTIONS.CREATE, (_e, params: Parameters<typeof createSkillQuizQuestion>[1]) => {
    try {
      if (!params?.skill_id) return fail('skill_id is required', 'VALIDATION')
      if (!params?.question?.trim()) return fail('Question is required', 'VALIDATION')
      return ok(createSkillQuizQuestion(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create quiz question') }
  })

  ipcMain.handle(IPC.SKILL_HUB.QUIZ_QUESTIONS.UPDATE, (_e, id: string, params: Parameters<typeof updateSkillQuizQuestion>[2]) => {
    try {
      const result = updateSkillQuizQuestion(getDatabase(), id, params ?? {})
      if (!result) return fail('Question not found', 'NOT_FOUND')
      return ok(result)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update question') }
  })

  ipcMain.handle(IPC.SKILL_HUB.QUIZ_QUESTIONS.DELETE, (_e, id: string) => {
    try {
      if (!deleteSkillQuizQuestion(getDatabase(), id)) return fail('Question not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete question') }
  })

  // ── Quiz Attempts ─────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.QUIZ_ATTEMPTS.LOG, (_e, params: Parameters<typeof logSkillQuizAttempt>[1]) => {
    try {
      if (!params?.skill_id) return fail('skill_id is required', 'VALIDATION')
      logSkillQuizAttempt(getDatabase(), params)
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to log attempt') }
  })

  ipcMain.handle(IPC.SKILL_HUB.QUIZ_ATTEMPTS.GET_STATS, (_e, skillId: string) => {
    try { return ok(getSkillQuizAttemptStats(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get quiz stats') }
  })

  // ── Linked Labs ───────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.LINKED_LABS.GET_ALL, (_e, skillId: string) => {
    try { return ok(getLinkedLabs(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get linked labs') }
  })
  ipcMain.handle(IPC.SKILL_HUB.LINKED_LABS.LINK, (_e, skillId: string, labId: string) => {
    try { linkLab(getDatabase(), skillId, labId); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to link lab') }
  })
  ipcMain.handle(IPC.SKILL_HUB.LINKED_LABS.UNLINK, (_e, skillId: string, labId: string) => {
    try { unlinkLab(getDatabase(), skillId, labId); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to unlink lab') }
  })

  // ── Linked Projects ───────────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.LINKED_PROJECTS.GET_ALL, (_e, skillId: string) => {
    try { return ok(getLinkedProjects(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get linked projects') }
  })
  ipcMain.handle(IPC.SKILL_HUB.LINKED_PROJECTS.LINK, (_e, skillId: string, projectId: string) => {
    try { linkProject(getDatabase(), skillId, projectId); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to link project') }
  })
  ipcMain.handle(IPC.SKILL_HUB.LINKED_PROJECTS.UNLINK, (_e, skillId: string, projectId: string) => {
    try { unlinkProject(getDatabase(), skillId, projectId); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to unlink project') }
  })

  // ── Linked Certifications ─────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.LINKED_CERTIFICATIONS.GET_ALL, (_e, skillId: string) => {
    try { return ok(getLinkedCertifications(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get linked certifications') }
  })
  ipcMain.handle(IPC.SKILL_HUB.LINKED_CERTIFICATIONS.LINK, (_e, skillId: string, certId: string) => {
    try { linkCertification(getDatabase(), skillId, certId); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to link certification') }
  })
  ipcMain.handle(IPC.SKILL_HUB.LINKED_CERTIFICATIONS.UNLINK, (_e, skillId: string, certId: string) => {
    try { unlinkCertification(getDatabase(), skillId, certId); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to unlink certification') }
  })

  // ── Linked Interview Questions ─────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.LINKED_INTERVIEW_QUESTIONS.GET_ALL, (_e, skillId: string) => {
    try { return ok(getLinkedInterviewQuestions(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get linked interview questions') }
  })
  ipcMain.handle(IPC.SKILL_HUB.LINKED_INTERVIEW_QUESTIONS.LINK, (_e, skillId: string, questionId: string) => {
    try { linkInterviewQuestion(getDatabase(), skillId, questionId); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to link question') }
  })
  ipcMain.handle(IPC.SKILL_HUB.LINKED_INTERVIEW_QUESTIONS.UNLINK, (_e, skillId: string, questionId: string) => {
    try { unlinkInterviewQuestion(getDatabase(), skillId, questionId); return ok(undefined) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to unlink question') }
  })

  // ── Linked Videos ─────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.LINKED_VIDEOS.GET_ALL, (_e, skillId: string) => {
    try { return ok(getLinkedVideos(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get linked videos') }
  })

  // ── Related Skills ────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SKILL_HUB.RELATED_SKILLS.GET_ALL, (_e, skillId: string) => {
    try { return ok(getRelatedSkills(getDatabase(), skillId)) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to get related skills') }
  })
}
