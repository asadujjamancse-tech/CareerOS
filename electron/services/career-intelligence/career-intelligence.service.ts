import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

// ─── Row types ───────────────────────────────────────────────────────────────

export interface CareerRoadmapRow {
  id: string
  title: string
  description: string | null
  category: string
  seniority_level: string | null
  estimated_months: number | null
  is_active: number
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface RoadmapSkillRow {
  id: string
  roadmap_id: string
  skill_id: string | null
  skill_name: string
  target_level: string
  importance: string
  order_index: number
  created_at: string
  current_level: string | null
  current_status: string | null
}

export interface RoadmapCertificationRow {
  id: string
  roadmap_id: string
  certification_id: string | null
  name: string
  issuer: string | null
  importance: string
  order_index: number
  created_at: string
  cert_status: string | null
}

export interface RoadmapProjectRow {
  id: string
  roadmap_id: string
  project_id: string | null
  title: string
  description: string | null
  importance: string
  order_index: number
  created_at: string
  project_status: string | null
}

export interface RoadmapMilestoneRow {
  id: string
  roadmap_id: string
  title: string
  description: string | null
  target_date: string | null
  is_completed: number
  completed_at: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface RoadmapProgress {
  total_skills: number
  completed_skills: number
  total_certifications: number
  completed_certifications: number
  total_projects: number
  completed_projects: number
  total_milestones: number
  completed_milestones: number
  progress_pct: number
  estimated_months_remaining: number | null
}

export interface CareerRoadmapDetail extends CareerRoadmapRow {
  skills: RoadmapSkillRow[]
  certifications: RoadmapCertificationRow[]
  projects: RoadmapProjectRow[]
  milestones: RoadmapMilestoneRow[]
  progress: RoadmapProgress
}

export interface SkillProgressRow {
  skill_id: string
  skill_name: string
  skill_slug: string
  category_name: string
  category_color: string
  current_level: string
  current_status: string
  years_experience: number
  target_level: string
  confidence_score: number
  last_studied_at: string | null
  weekly_goal_hours: number
  progress_pct: number
  updated_at: string
}

export interface StudySessionRow {
  id: string
  skill_id: string | null
  skill_name: string | null
  title: string
  notes: string | null
  duration_minutes: number
  session_date: string
  created_at: string
}

export interface CoachRecommendations {
  job_readiness_score: number
  readiness_breakdown: {
    skills_score: number
    certifications_score: number
    projects_score: number
    experience_score: number
  }
  missing_skills: Array<{ name: string; importance: string; skill_id: string | null }>
  next_certification: string | null
  next_project: string | null
  weekly_study_plan: Array<{ skill_name: string; recommended_hours: number; reason: string }>
  top_skill_gaps: Array<{ skill_name: string; current_level: string; target_level: string; gap: number }>
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

export interface KnowledgeNode {
  id: string
  label: string
  type: 'skill' | 'project' | 'certification' | 'note' | 'document' | 'video' | 'lab' | 'interview_question'
  weight: number
  metadata: Record<string, string | number | null>
}

export interface KnowledgeEdge {
  source: string
  target: string
  label: string
  type: 'skill-project' | 'skill-certification' | 'skill-video' | 'skill-occupation' | 'skill-lab' | 'skill-interview'
}

export interface AnalyticsDashboard {
  totals: {
    skills: number
    skills_mastered: number
    projects: number
    projects_completed: number
    certifications: number
    certifications_earned: number
    notes: number
    documents: number
    videos: number
    videos_completed: number
    study_sessions: number
    total_study_hours: number
  }
  skill_level_distribution: Array<{ level: string; count: number }>
  skill_status_distribution: Array<{ status: string; count: number }>
  recent_study_sessions: StudySessionRow[]
  study_hours_by_week: Array<{ week: string; hours: number }>
  top_skills_by_progress: SkillProgressRow[]
  certification_status_distribution: Array<{ status: string; count: number }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString()
}

const LEVEL_RANK: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
}

function computeProgressPct(current: string | null, target: string): number {
  if (!current) return 0
  const c = LEVEL_RANK[current] ?? 0
  const t = LEVEL_RANK[target] ?? 1
  return Math.min(100, Math.round((c / t) * 100))
}

// ─── Career Roadmaps ─────────────────────────────────────────────────────────

export function getAllRoadmaps(db: Database): CareerRoadmapRow[] {
  return db.prepare(`
    SELECT * FROM career_roadmaps WHERE deleted_at IS NULL ORDER BY is_active DESC, updated_at DESC
  `).all() as CareerRoadmapRow[]
}

export function getRoadmapById(db: Database, id: string): CareerRoadmapDetail | null {
  const roadmap = db.prepare(
    `SELECT * FROM career_roadmaps WHERE id = ? AND deleted_at IS NULL`,
  ).get(id) as CareerRoadmapRow | undefined
  if (!roadmap) return null

  const skills = db.prepare(`
    SELECT rs.*, s.proficiency_level AS current_level, s.status AS current_status
    FROM roadmap_skills rs
    LEFT JOIN skills s ON s.id = rs.skill_id AND s.deleted_at IS NULL
    WHERE rs.roadmap_id = ?
    ORDER BY rs.order_index, rs.importance DESC
  `).all(id) as RoadmapSkillRow[]

  const certifications = db.prepare(`
    SELECT rc.*, c.status AS cert_status
    FROM roadmap_certifications rc
    LEFT JOIN certifications c ON c.id = rc.certification_id AND c.deleted_at IS NULL
    WHERE rc.roadmap_id = ?
    ORDER BY rc.order_index
  `).all(id) as RoadmapCertificationRow[]

  const projects = db.prepare(`
    SELECT rp.*, p.status AS project_status
    FROM roadmap_projects rp
    LEFT JOIN projects p ON p.id = rp.project_id AND p.deleted_at IS NULL
    WHERE rp.roadmap_id = ?
    ORDER BY rp.order_index
  `).all(id) as RoadmapProjectRow[]

  const milestones = db.prepare(`
    SELECT * FROM roadmap_milestones WHERE roadmap_id = ? ORDER BY order_index
  `).all(id) as RoadmapMilestoneRow[]

  const progress = computeRoadmapProgress(roadmap, skills, certifications, projects, milestones)

  return { ...roadmap, skills, certifications, projects, milestones, progress }
}

function computeRoadmapProgress(
  roadmap: CareerRoadmapRow,
  skills: RoadmapSkillRow[],
  certifications: RoadmapCertificationRow[],
  projects: RoadmapProjectRow[],
  milestones: RoadmapMilestoneRow[],
): RoadmapProgress {
  const completedSkills = skills.filter(s => {
    const rank = LEVEL_RANK[s.current_level ?? ''] ?? 0
    const target = LEVEL_RANK[s.target_level] ?? 1
    return rank >= target
  })

  const completedCerts = certifications.filter(c => c.cert_status === 'earned')
  const completedProjects = projects.filter(p =>
    p.project_status === 'completed' || p.project_status === 'active',
  )
  const completedMilestones = milestones.filter(m => m.is_completed === 1)

  // Weighted progress: skills 50%, certs 25%, projects 15%, milestones 10%
  const skillsPct = skills.length > 0
    ? (completedSkills.length / skills.length) * 50
    : 50
  const certsPct = certifications.length > 0
    ? (completedCerts.length / certifications.length) * 25
    : 25
  const projectsPct = projects.length > 0
    ? (completedProjects.length / projects.length) * 15
    : 15
  const milestonesPct = milestones.length > 0
    ? (completedMilestones.length / milestones.length) * 10
    : 10

  const progress_pct = Math.round(skillsPct + certsPct + projectsPct + milestonesPct)

  const remainingPct = 1 - progress_pct / 100
  const estimated_months_remaining = roadmap.estimated_months != null
    ? Math.round(roadmap.estimated_months * remainingPct)
    : null

  return {
    total_skills: skills.length,
    completed_skills: completedSkills.length,
    total_certifications: certifications.length,
    completed_certifications: completedCerts.length,
    total_projects: projects.length,
    completed_projects: completedProjects.length,
    total_milestones: milestones.length,
    completed_milestones: completedMilestones.length,
    progress_pct,
    estimated_months_remaining,
  }
}

export interface CreateRoadmapParams {
  title: string
  description?: string | null
  category?: string
  seniority_level?: string | null
  estimated_months?: number | null
  is_active?: number
  notes?: string | null
}

export function createRoadmap(db: Database, params: CreateRoadmapParams): CareerRoadmapRow {
  const id = nanoid()
  const now = nowIso()
  db.prepare(`
    INSERT INTO career_roadmaps (id, title, description, category, seniority_level, estimated_months, is_active, notes, created_at, updated_at)
    VALUES (:id, :title, :description, :category, :seniority_level, :estimated_months, :is_active, :notes, :now, :now)
  `).run({
    id,
    title: params.title,
    description: params.description ?? null,
    category: params.category ?? 'it',
    seniority_level: params.seniority_level ?? null,
    estimated_months: params.estimated_months ?? null,
    is_active: params.is_active ?? 0,
    notes: params.notes ?? null,
    now,
  })
  return db.prepare('SELECT * FROM career_roadmaps WHERE id = ?').get(id) as CareerRoadmapRow
}

export function updateRoadmap(
  db: Database,
  id: string,
  params: Partial<CreateRoadmapParams>,
): CareerRoadmapRow | null {
  const existing = db.prepare(
    'SELECT id FROM career_roadmaps WHERE id = ? AND deleted_at IS NULL',
  ).get(id)
  if (!existing) return null

  db.prepare(`
    UPDATE career_roadmaps SET
      title            = COALESCE(:title, title),
      description      = COALESCE(:description, description),
      category         = COALESCE(:category, category),
      seniority_level  = COALESCE(:seniority_level, seniority_level),
      estimated_months = COALESCE(:estimated_months, estimated_months),
      is_active        = COALESCE(:is_active, is_active),
      notes            = COALESCE(:notes, notes),
      updated_at       = :now
    WHERE id = :id AND deleted_at IS NULL
  `).run({
    id,
    title: params.title ?? null,
    description: params.description ?? null,
    category: params.category ?? null,
    seniority_level: params.seniority_level ?? null,
    estimated_months: params.estimated_months ?? null,
    is_active: params.is_active ?? null,
    notes: params.notes ?? null,
    now: nowIso(),
  })
  return db.prepare('SELECT * FROM career_roadmaps WHERE id = ?').get(id) as CareerRoadmapRow
}

export function deleteRoadmap(db: Database, id: string): boolean {
  const result = db.prepare(
    'UPDATE career_roadmaps SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL',
  ).run(nowIso(), id)
  return result.changes > 0
}

// ─── Roadmap Skills / Certs / Projects ───────────────────────────────────────

export interface RoadmapSkillInput {
  skill_id?: string | null
  skill_name: string
  target_level?: string
  importance?: string
  order_index?: number
}

export function setRoadmapSkills(db: Database, roadmapId: string, skills: RoadmapSkillInput[]): void {
  db.prepare('DELETE FROM roadmap_skills WHERE roadmap_id = ?').run(roadmapId)
  const insert = db.prepare(`
    INSERT INTO roadmap_skills (id, roadmap_id, skill_id, skill_name, target_level, importance, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  skills.forEach((s, i) => {
    insert.run(nanoid(), roadmapId, s.skill_id ?? null, s.skill_name, s.target_level ?? 'intermediate', s.importance ?? 'important', s.order_index ?? i)
  })
}

export interface RoadmapCertInput {
  certification_id?: string | null
  name: string
  issuer?: string | null
  importance?: string
  order_index?: number
}

export function setRoadmapCertifications(db: Database, roadmapId: string, certs: RoadmapCertInput[]): void {
  db.prepare('DELETE FROM roadmap_certifications WHERE roadmap_id = ?').run(roadmapId)
  const insert = db.prepare(`
    INSERT INTO roadmap_certifications (id, roadmap_id, certification_id, name, issuer, importance, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  certs.forEach((c, i) => {
    insert.run(nanoid(), roadmapId, c.certification_id ?? null, c.name, c.issuer ?? null, c.importance ?? 'important', c.order_index ?? i)
  })
}

export interface RoadmapProjectInput {
  project_id?: string | null
  title: string
  description?: string | null
  importance?: string
  order_index?: number
}

export function setRoadmapProjects(db: Database, roadmapId: string, projects: RoadmapProjectInput[]): void {
  db.prepare('DELETE FROM roadmap_projects WHERE roadmap_id = ?').run(roadmapId)
  const insert = db.prepare(`
    INSERT INTO roadmap_projects (id, roadmap_id, project_id, title, description, importance, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  projects.forEach((p, i) => {
    insert.run(nanoid(), roadmapId, p.project_id ?? null, p.title, p.description ?? null, p.importance ?? 'important', p.order_index ?? i)
  })
}

// ─── Milestones ───────────────────────────────────────────────────────────────

export interface MilestoneInput {
  title: string
  description?: string | null
  target_date?: string | null
  order_index?: number
}

export function setRoadmapMilestones(db: Database, roadmapId: string, milestones: MilestoneInput[]): void {
  db.prepare('DELETE FROM roadmap_milestones WHERE roadmap_id = ?').run(roadmapId)
  const insert = db.prepare(`
    INSERT INTO roadmap_milestones (id, roadmap_id, title, description, target_date, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  milestones.forEach((m, i) => {
    insert.run(nanoid(), roadmapId, m.title, m.description ?? null, m.target_date ?? null, m.order_index ?? i)
  })
}

export function toggleMilestone(db: Database, id: string, completed: boolean): RoadmapMilestoneRow | null {
  const now = nowIso()
  db.prepare(`
    UPDATE roadmap_milestones SET
      is_completed = ?,
      completed_at = ?,
      updated_at   = ?
    WHERE id = ?
  `).run(completed ? 1 : 0, completed ? now : null, now, id)
  return db.prepare('SELECT * FROM roadmap_milestones WHERE id = ?').get(id) as RoadmapMilestoneRow | null
}

// ─── Skill Progress ───────────────────────────────────────────────────────────

export function getAllSkillProgress(db: Database): SkillProgressRow[] {
  const rows = db.prepare(`
    SELECT
      s.id            AS skill_id,
      s.name          AS skill_name,
      s.slug          AS skill_slug,
      sc.name         AS category_name,
      sc.color_hex    AS category_color,
      s.proficiency_level AS current_level,
      s.status        AS current_status,
      s.years_experience,
      COALESCE(sp.target_level, 'intermediate')  AS target_level,
      COALESCE(sp.confidence_score, 50)          AS confidence_score,
      sp.last_studied_at,
      COALESCE(sp.weekly_goal_hours, 0)          AS weekly_goal_hours,
      sp.updated_at
    FROM skills s
    JOIN skill_categories sc ON sc.id = s.category_id
    LEFT JOIN skill_progress sp ON sp.skill_id = s.id
    WHERE s.deleted_at IS NULL
    ORDER BY sc.name, s.name
  `).all() as Omit<SkillProgressRow, 'progress_pct'>[]

  return rows.map(r => ({
    ...r,
    progress_pct: computeProgressPct(r.current_level, r.target_level),
  }))
}

export interface UpsertSkillProgressParams {
  target_level?: string
  confidence_score?: number
  last_studied_at?: string | null
  weekly_goal_hours?: number
}

export function upsertSkillProgress(
  db: Database,
  skillId: string,
  params: UpsertSkillProgressParams,
): void {
  const now = nowIso()
  db.prepare(`
    INSERT INTO skill_progress (skill_id, target_level, confidence_score, last_studied_at, weekly_goal_hours, updated_at)
    VALUES (:skill_id, :target_level, :confidence_score, :last_studied_at, :weekly_goal_hours, :now)
    ON CONFLICT(skill_id) DO UPDATE SET
      target_level      = COALESCE(:target_level, target_level),
      confidence_score  = COALESCE(:confidence_score, confidence_score),
      last_studied_at   = COALESCE(:last_studied_at, last_studied_at),
      weekly_goal_hours = COALESCE(:weekly_goal_hours, weekly_goal_hours),
      updated_at        = :now
  `).run({
    skill_id: skillId,
    target_level: params.target_level ?? null,
    confidence_score: params.confidence_score ?? null,
    last_studied_at: params.last_studied_at ?? null,
    weekly_goal_hours: params.weekly_goal_hours ?? null,
    now,
  })
}

// ─── Study Sessions ───────────────────────────────────────────────────────────

export interface LogStudySessionParams {
  skill_id?: string | null
  title: string
  notes?: string | null
  duration_minutes: number
  session_date: string
}

export function logStudySession(db: Database, params: LogStudySessionParams): StudySessionRow {
  const id = nanoid()
  db.prepare(`
    INSERT INTO study_sessions (id, skill_id, title, notes, duration_minutes, session_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, params.skill_id ?? null, params.title, params.notes ?? null, params.duration_minutes, params.session_date)

  if (params.skill_id) {
    upsertSkillProgress(db, params.skill_id, { last_studied_at: params.session_date })
  }

  return db.prepare(`
    SELECT ss.*, s.name AS skill_name
    FROM study_sessions ss
    LEFT JOIN skills s ON s.id = ss.skill_id
    WHERE ss.id = ?
  `).get(id) as StudySessionRow
}

export function getStudySessions(db: Database, limit = 50): StudySessionRow[] {
  return db.prepare(`
    SELECT ss.*, s.name AS skill_name
    FROM study_sessions ss
    LEFT JOIN skills s ON s.id = ss.skill_id
    ORDER BY ss.session_date DESC, ss.created_at DESC
    LIMIT ?
  `).all(limit) as StudySessionRow[]
}

export function deleteStudySession(db: Database, id: string): boolean {
  const result = db.prepare('DELETE FROM study_sessions WHERE id = ?').run(id)
  return result.changes > 0
}

// ─── AI Career Coach ─────────────────────────────────────────────────────────

export function getCoachRecommendations(db: Database, roadmapId?: string): CoachRecommendations {
  // Total skills and mastery
  const skillStats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN proficiency_level IN ('advanced','expert') OR status = 'mastered' THEN 1 ELSE 0 END) AS strong,
      SUM(CASE WHEN proficiency_level IN ('intermediate') OR status = 'proficient' THEN 1 ELSE 0 END) AS mid,
      SUM(years_experience) AS total_years
    FROM skills WHERE deleted_at IS NULL
  `).get() as { total: number; strong: number; mid: number; total_years: number }

  const certStats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'earned' THEN 1 ELSE 0 END) AS earned,
      SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress
    FROM certifications WHERE deleted_at IS NULL
  `).get() as { total: number; earned: number; in_progress: number }

  const projectStats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active
    FROM projects WHERE deleted_at IS NULL
  `).get() as { total: number; completed: number; active: number }

  // Skills score: based on distribution
  const skillsScore = skillStats.total === 0 ? 0 : Math.min(100, Math.round(
    ((skillStats.strong * 3 + skillStats.mid * 1.5) / (skillStats.total * 3)) * 100,
  ))

  // Certifications score
  const certsScore = certStats.total === 0 ? 0 : Math.min(100, Math.round(
    ((certStats.earned * 2 + certStats.in_progress) / (certStats.total * 2)) * 100,
  ))

  // Projects score
  const projectsScore = projectStats.total === 0 ? 0 : Math.min(100, Math.round(
    ((projectStats.completed * 2 + projectStats.active) / (projectStats.total * 2)) * 100,
  ))

  // Experience score (capped at 5 years = 100)
  const experienceScore = Math.min(100, Math.round((skillStats.total_years ?? 0) / 5 * 100))

  const job_readiness_score = Math.round(
    skillsScore * 0.45 + certsScore * 0.25 + projectsScore * 0.20 + experienceScore * 0.10,
  )

  // Missing skills from active roadmap
  let missing_skills: Array<{ name: string; importance: string; skill_id: string | null }> = []
  if (roadmapId) {
    missing_skills = db.prepare(`
      SELECT rs.skill_name AS name, rs.importance, rs.skill_id
      FROM roadmap_skills rs
      LEFT JOIN skills s ON s.id = rs.skill_id AND s.deleted_at IS NULL
      WHERE rs.roadmap_id = ?
        AND (s.id IS NULL
          OR COALESCE(CASE s.proficiency_level WHEN 'beginner' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'advanced' THEN 3 WHEN 'expert' THEN 4 END, 0)
             < CASE rs.target_level WHEN 'beginner' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'advanced' THEN 3 WHEN 'expert' THEN 4 END)
      ORDER BY CASE rs.importance WHEN 'critical' THEN 0 WHEN 'important' THEN 1 ELSE 2 END
      LIMIT 10
    `).all(roadmapId) as Array<{ name: string; importance: string; skill_id: string | null }>
  } else {
    // Default: skills still at beginner with target higher
    missing_skills = db.prepare(`
      SELECT s.name, 'important' AS importance, s.id AS skill_id
      FROM skills s
      LEFT JOIN skill_progress sp ON sp.skill_id = s.id
      WHERE s.deleted_at IS NULL
        AND s.proficiency_level = 'beginner'
        AND COALESCE(sp.target_level, 'intermediate') != 'beginner'
      ORDER BY s.updated_at DESC
      LIMIT 10
    `).all() as Array<{ name: string; importance: string; skill_id: string | null }>
  }

  // Next certification: planned or in-progress with nearest target
  const nextCert = db.prepare(`
    SELECT name FROM certifications
    WHERE deleted_at IS NULL AND status IN ('planned','in-progress')
    ORDER BY CASE status WHEN 'in-progress' THEN 0 ELSE 1 END, created_at ASC
    LIMIT 1
  `).get() as { name: string } | undefined

  // Next project: planning or active projects
  const nextProject = db.prepare(`
    SELECT title FROM projects
    WHERE deleted_at IS NULL AND status IN ('planning','active')
    ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, created_at ASC
    LIMIT 1
  `).get() as { title: string } | undefined

  // Weekly study plan: top skills needing work
  const weeklyPlanRows = db.prepare(`
    SELECT
      s.name AS skill_name,
      s.proficiency_level AS current_level,
      COALESCE(sp.target_level, 'intermediate') AS target_level,
      COALESCE(sp.weekly_goal_hours, 2) AS recommended_hours
    FROM skills s
    LEFT JOIN skill_progress sp ON sp.skill_id = s.id
    WHERE s.deleted_at IS NULL
      AND s.status NOT IN ('mastered')
      AND s.proficiency_level != 'expert'
    ORDER BY
      CASE s.proficiency_level WHEN 'beginner' THEN 0 WHEN 'intermediate' THEN 1 ELSE 2 END,
      s.updated_at DESC
    LIMIT 5
  `).all() as Array<{ skill_name: string; current_level: string; target_level: string; recommended_hours: number }>

  const weekly_study_plan = weeklyPlanRows.map(r => ({
    skill_name: r.skill_name,
    recommended_hours: r.recommended_hours || 2,
    reason: r.current_level === 'beginner' ? 'Foundation building' : 'Advancing proficiency',
  }))

  // Skill gaps (from roadmap or general)
  const top_skill_gaps = db.prepare(`
    SELECT
      s.name AS skill_name,
      s.proficiency_level AS current_level,
      COALESCE(sp.target_level, 'intermediate') AS target_level,
      (CASE COALESCE(sp.target_level,'intermediate')
         WHEN 'beginner' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'advanced' THEN 3 WHEN 'expert' THEN 4
       END
       - CASE s.proficiency_level
           WHEN 'beginner' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'advanced' THEN 3 WHEN 'expert' THEN 4
         END) AS gap
    FROM skills s
    LEFT JOIN skill_progress sp ON sp.skill_id = s.id
    WHERE s.deleted_at IS NULL
      AND (CASE COALESCE(sp.target_level,'intermediate')
             WHEN 'beginner' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'advanced' THEN 3 WHEN 'expert' THEN 4
           END
           > CASE s.proficiency_level
               WHEN 'beginner' THEN 1 WHEN 'intermediate' THEN 2 WHEN 'advanced' THEN 3 WHEN 'expert' THEN 4
             END)
    ORDER BY gap DESC, s.updated_at DESC
    LIMIT 6
  `).all() as Array<{ skill_name: string; current_level: string; target_level: string; gap: number }>

  return {
    job_readiness_score,
    readiness_breakdown: {
      skills_score: skillsScore,
      certifications_score: certsScore,
      projects_score: projectsScore,
      experience_score: experienceScore,
    },
    missing_skills,
    next_certification: nextCert?.name ?? null,
    next_project: nextProject?.title ?? null,
    weekly_study_plan,
    top_skill_gaps,
  }
}

// ─── Knowledge Graph ──────────────────────────────────────────────────────────

export function getKnowledgeGraph(db: Database): KnowledgeGraphData {
  const skillNodes = db.prepare(`
    SELECT s.id, s.name AS label, 'skill' AS type,
           COUNT(DISTINCT ps.project_id)
           + COUNT(DISTINCT cs.certification_id)
           + COUNT(DISTINCT vs.video_id)
           + COUNT(DISTINCT hls.lab_id)
           + COUNT(DISTINCT iqs.question_id) AS weight,
           s.proficiency_level AS level, s.status
    FROM skills s
    LEFT JOIN project_skills ps         ON ps.skill_id = s.id
    LEFT JOIN certification_skills cs   ON cs.skill_id = s.id
    LEFT JOIN video_skills vs           ON vs.skill_id = s.id
    LEFT JOIN home_lab_skills hls       ON hls.skill_id = s.id
    LEFT JOIN interview_question_skills iqs ON iqs.skill_id = s.id
    WHERE s.deleted_at IS NULL
    GROUP BY s.id
    ORDER BY weight DESC
    LIMIT 40
  `).all() as Array<{ id: string; label: string; type: 'skill'; weight: number; level: string; status: string }>

  const skillIds = skillNodes.map(n => n.id)
  if (skillIds.length === 0) return { nodes: [], edges: [] }

  const placeholders = skillIds.map(() => '?').join(',')

  const projectNodes = db.prepare(`
    SELECT DISTINCT p.id, p.title AS label, 'project' AS type, 1 AS weight, p.status
    FROM projects p
    JOIN project_skills ps ON ps.project_id = p.id
    WHERE p.deleted_at IS NULL AND ps.skill_id IN (${placeholders})
    LIMIT 20
  `).all(...skillIds) as Array<{ id: string; label: string; type: 'project'; weight: number; status: string }>

  const certNodes = db.prepare(`
    SELECT DISTINCT c.id, c.name AS label, 'certification' AS type, 1 AS weight, c.status
    FROM certifications c
    JOIN certification_skills cs ON cs.certification_id = c.id
    WHERE c.deleted_at IS NULL AND cs.skill_id IN (${placeholders})
    LIMIT 20
  `).all(...skillIds) as Array<{ id: string; label: string; type: 'certification'; weight: number; status: string }>

  const videoNodes = db.prepare(`
    SELECT DISTINCT v.id, v.title AS label, 'video' AS type, 1 AS weight, v.watch_status AS status
    FROM videos v
    JOIN video_skills vs ON vs.video_id = v.id
    WHERE v.deleted_at IS NULL AND vs.skill_id IN (${placeholders})
    LIMIT 15
  `).all(...skillIds) as Array<{ id: string; label: string; type: 'video'; weight: number; status: string }>

  const labNodes = db.prepare(`
    SELECT DISTINCT hl.id, hl.title AS label, 'lab' AS type, 1 AS weight, hl.status
    FROM home_labs hl
    JOIN home_lab_skills hls ON hls.lab_id = hl.id
    WHERE hl.deleted_at IS NULL AND hls.skill_id IN (${placeholders})
    LIMIT 15
  `).all(...skillIds) as Array<{ id: string; label: string; type: 'lab'; weight: number; status: string }>

  const interviewNodes = db.prepare(`
    SELECT DISTINCT iq.id,
           CASE WHEN LENGTH(iq.question) > 40 THEN SUBSTR(iq.question,1,37)||'...' ELSE iq.question END AS label,
           'interview_question' AS type, 1 AS weight, iq.difficulty AS status
    FROM interview_questions iq
    JOIN interview_question_skills iqs ON iqs.question_id = iq.id
    WHERE iq.deleted_at IS NULL AND iqs.skill_id IN (${placeholders})
    LIMIT 15
  `).all(...skillIds) as Array<{ id: string; label: string; type: 'interview_question'; weight: number; status: string }>

  const allNodes: KnowledgeNode[] = [
    ...skillNodes.map(n => ({
      id: n.id,
      label: n.label,
      type: 'skill' as const,
      weight: Math.max(1, n.weight),
      metadata: { level: n.level, status: n.status },
    })),
    ...projectNodes.map(n => ({
      id: n.id,
      label: n.label,
      type: 'project' as const,
      weight: 1,
      metadata: { status: n.status },
    })),
    ...certNodes.map(n => ({
      id: n.id,
      label: n.label,
      type: 'certification' as const,
      weight: 1,
      metadata: { status: n.status },
    })),
    ...videoNodes.map(n => ({
      id: n.id,
      label: n.label,
      type: 'video' as const,
      weight: 1,
      metadata: { status: n.status },
    })),
    ...labNodes.map(n => ({
      id: n.id,
      label: n.label,
      type: 'lab' as const,
      weight: 1,
      metadata: { status: n.status },
    })),
    ...interviewNodes.map(n => ({
      id: n.id,
      label: n.label,
      type: 'interview_question' as const,
      weight: 1,
      metadata: { status: n.status },
    })),
  ]

  const nodeSet = new Set(allNodes.map(n => n.id))

  const projectEdges = db.prepare(`
    SELECT ps.skill_id AS source, ps.project_id AS target
    FROM project_skills ps WHERE ps.skill_id IN (${placeholders})
  `).all(...skillIds) as Array<{ source: string; target: string }>

  const certEdges = db.prepare(`
    SELECT cs.skill_id AS source, cs.certification_id AS target
    FROM certification_skills cs WHERE cs.skill_id IN (${placeholders})
  `).all(...skillIds) as Array<{ source: string; target: string }>

  const videoEdges = db.prepare(`
    SELECT vs.skill_id AS source, vs.video_id AS target
    FROM video_skills vs WHERE vs.skill_id IN (${placeholders})
  `).all(...skillIds) as Array<{ source: string; target: string }>

  const labEdges = db.prepare(`
    SELECT hls.skill_id AS source, hls.lab_id AS target
    FROM home_lab_skills hls WHERE hls.skill_id IN (${placeholders})
  `).all(...skillIds) as Array<{ source: string; target: string }>

  const interviewEdges = db.prepare(`
    SELECT iqs.skill_id AS source, iqs.question_id AS target
    FROM interview_question_skills iqs WHERE iqs.skill_id IN (${placeholders})
  `).all(...skillIds) as Array<{ source: string; target: string }>

  const edges: KnowledgeEdge[] = [
    ...projectEdges
      .filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
      .map(e => ({ ...e, label: 'used in', type: 'skill-project' as const })),
    ...certEdges
      .filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
      .map(e => ({ ...e, label: 'tested by', type: 'skill-certification' as const })),
    ...videoEdges
      .filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
      .map(e => ({ ...e, label: 'covered in', type: 'skill-video' as const })),
    ...labEdges
      .filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
      .map(e => ({ ...e, label: 'practiced in', type: 'skill-lab' as const })),
    ...interviewEdges
      .filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
      .map(e => ({ ...e, label: 'tested by', type: 'skill-interview' as const })),
  ]

  return { nodes: allNodes, edges }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function getAnalyticsDashboard(db: Database): AnalyticsDashboard {
  const totals = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM skills WHERE deleted_at IS NULL) AS skills,
      (SELECT COUNT(*) FROM skills WHERE deleted_at IS NULL AND status = 'mastered') AS skills_mastered,
      (SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL) AS projects,
      (SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL AND status = 'completed') AS projects_completed,
      (SELECT COUNT(*) FROM certifications WHERE deleted_at IS NULL) AS certifications,
      (SELECT COUNT(*) FROM certifications WHERE deleted_at IS NULL AND status = 'earned') AS certifications_earned,
      (SELECT COUNT(*) FROM notes WHERE deleted_at IS NULL) AS notes,
      (SELECT COUNT(*) FROM documents WHERE deleted_at IS NULL) AS documents,
      (SELECT COUNT(*) FROM videos WHERE deleted_at IS NULL) AS videos,
      (SELECT COUNT(*) FROM videos WHERE deleted_at IS NULL AND watch_status = 'completed') AS videos_completed,
      (SELECT COUNT(*) FROM study_sessions) AS study_sessions,
      (SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 FROM study_sessions) AS total_study_hours
  `).get() as AnalyticsDashboard['totals']

  const skill_level_distribution = db.prepare(`
    SELECT proficiency_level AS level, COUNT(*) AS count
    FROM skills WHERE deleted_at IS NULL
    GROUP BY proficiency_level
    ORDER BY CASE proficiency_level WHEN 'beginner' THEN 0 WHEN 'intermediate' THEN 1 WHEN 'advanced' THEN 2 WHEN 'expert' THEN 3 END
  `).all() as Array<{ level: string; count: number }>

  const skill_status_distribution = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM skills WHERE deleted_at IS NULL
    GROUP BY status
    ORDER BY count DESC
  `).all() as Array<{ status: string; count: number }>

  const certification_status_distribution = db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM certifications WHERE deleted_at IS NULL
    GROUP BY status
    ORDER BY count DESC
  `).all() as Array<{ status: string; count: number }>

  const recent_study_sessions = getStudySessions(db, 10)

  // Study hours by week (last 8 weeks)
  const study_hours_by_week = db.prepare(`
    SELECT
      strftime('%Y-W%W', session_date) AS week,
      ROUND(SUM(duration_minutes) / 60.0, 1) AS hours
    FROM study_sessions
    WHERE session_date >= date('now', '-56 days')
    GROUP BY week
    ORDER BY week ASC
  `).all() as Array<{ week: string; hours: number }>

  // Top skills by progress
  const top_skills_by_progress = getAllSkillProgress(db)
    .sort((a, b) => b.progress_pct - a.progress_pct)
    .slice(0, 8)

  return {
    totals,
    skill_level_distribution,
    skill_status_distribution,
    recent_study_sessions,
    study_hours_by_week,
    top_skills_by_progress,
    certification_status_distribution,
  }
}
