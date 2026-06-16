import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllRoadmaps,
  getRoadmapById,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  setRoadmapSkills,
  setRoadmapCertifications,
  setRoadmapProjects,
  setRoadmapMilestones,
  toggleMilestone,
  getAllSkillProgress,
  upsertSkillProgress,
  logStudySession,
  getStudySessions,
  deleteStudySession,
  getCoachRecommendations,
  getKnowledgeGraph,
  getAnalyticsDashboard,
  type CreateRoadmapParams,
  type RoadmapSkillInput,
  type RoadmapCertInput,
  type RoadmapProjectInput,
  type MilestoneInput,
  type UpsertSkillProgressParams,
  type LogStudySessionParams,
} from '../services/career-intelligence/career-intelligence.service'

export function registerCareerIntelligenceHandlers(): void {
  const CI = IPC.CAREER_INTELLIGENCE

  // ── Roadmaps ──────────────────────────────────────────────────────────────

  ipcMain.handle(CI.ROADMAPS.GET_ALL, () => {
    try {
      return ok(getAllRoadmaps(getDatabase()))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch roadmaps')
    }
  })

  ipcMain.handle(CI.ROADMAPS.GET_BY_ID, (_event, id: string) => {
    try {
      const roadmap = getRoadmapById(getDatabase(), id)
      if (!roadmap) return fail('Roadmap not found', 'NOT_FOUND')
      return ok(roadmap)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch roadmap')
    }
  })

  ipcMain.handle(CI.ROADMAPS.CREATE, (_event, params: CreateRoadmapParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      return ok(createRoadmap(getDatabase(), params))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to create roadmap')
    }
  })

  ipcMain.handle(CI.ROADMAPS.UPDATE, (_event, id: string, params: Partial<CreateRoadmapParams>) => {
    try {
      const updated = updateRoadmap(getDatabase(), id, params)
      if (!updated) return fail('Roadmap not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to update roadmap')
    }
  })

  ipcMain.handle(CI.ROADMAPS.DELETE, (_event, id: string) => {
    try {
      const deleted = deleteRoadmap(getDatabase(), id)
      if (!deleted) return fail('Roadmap not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to delete roadmap')
    }
  })

  ipcMain.handle(CI.ROADMAPS.SET_SKILLS, (_event, roadmapId: string, skills: RoadmapSkillInput[]) => {
    try {
      setRoadmapSkills(getDatabase(), roadmapId, skills)
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to update roadmap skills')
    }
  })

  ipcMain.handle(CI.ROADMAPS.SET_CERTIFICATIONS, (_event, roadmapId: string, certs: RoadmapCertInput[]) => {
    try {
      setRoadmapCertifications(getDatabase(), roadmapId, certs)
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to update roadmap certifications')
    }
  })

  ipcMain.handle(CI.ROADMAPS.SET_PROJECTS, (_event, roadmapId: string, projects: RoadmapProjectInput[]) => {
    try {
      setRoadmapProjects(getDatabase(), roadmapId, projects)
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to update roadmap projects')
    }
  })

  ipcMain.handle(CI.ROADMAPS.SET_MILESTONES, (_event, roadmapId: string, milestones: MilestoneInput[]) => {
    try {
      setRoadmapMilestones(getDatabase(), roadmapId, milestones)
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to update roadmap milestones')
    }
  })

  ipcMain.handle(CI.ROADMAPS.TOGGLE_MILESTONE, (_event, id: string, completed: boolean) => {
    try {
      const milestone = toggleMilestone(getDatabase(), id, completed)
      if (!milestone) return fail('Milestone not found', 'NOT_FOUND')
      return ok(milestone)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to toggle milestone')
    }
  })

  // ── Skill Progress ────────────────────────────────────────────────────────

  ipcMain.handle(CI.SKILL_PROGRESS.GET_ALL, () => {
    try {
      return ok(getAllSkillProgress(getDatabase()))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch skill progress')
    }
  })

  ipcMain.handle(CI.SKILL_PROGRESS.UPSERT, (_event, skillId: string, params: UpsertSkillProgressParams) => {
    try {
      if (!skillId) return fail('Skill ID is required', 'VALIDATION')
      upsertSkillProgress(getDatabase(), skillId, params)
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to update skill progress')
    }
  })

  // ── Study Sessions ────────────────────────────────────────────────────────

  ipcMain.handle(CI.STUDY_SESSIONS.GET_ALL, () => {
    try {
      return ok(getStudySessions(getDatabase()))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch study sessions')
    }
  })

  ipcMain.handle(CI.STUDY_SESSIONS.LOG, (_event, params: LogStudySessionParams) => {
    try {
      if (!params?.title?.trim()) return fail('Title is required', 'VALIDATION')
      if (!params?.session_date) return fail('Session date is required', 'VALIDATION')
      if (params.duration_minutes <= 0) return fail('Duration must be greater than 0', 'VALIDATION')
      return ok(logStudySession(getDatabase(), params))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to log study session')
    }
  })

  ipcMain.handle(CI.STUDY_SESSIONS.DELETE, (_event, id: string) => {
    try {
      const deleted = deleteStudySession(getDatabase(), id)
      if (!deleted) return fail('Session not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to delete study session')
    }
  })

  // ── Coach ─────────────────────────────────────────────────────────────────

  ipcMain.handle(CI.COACH.GET_RECOMMENDATIONS, (_event, roadmapId?: string) => {
    try {
      return ok(getCoachRecommendations(getDatabase(), roadmapId))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to generate recommendations')
    }
  })

  // ── Knowledge Graph ───────────────────────────────────────────────────────

  ipcMain.handle(CI.KNOWLEDGE_GRAPH.GET, () => {
    try {
      return ok(getKnowledgeGraph(getDatabase()))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to build knowledge graph')
    }
  })

  // ── Analytics ─────────────────────────────────────────────────────────────

  ipcMain.handle(CI.ANALYTICS.GET_DASHBOARD, () => {
    try {
      return ok(getAnalyticsDashboard(getDatabase()))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch analytics')
    }
  })
}
