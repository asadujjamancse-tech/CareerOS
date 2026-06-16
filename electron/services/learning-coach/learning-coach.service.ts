import { nanoid } from 'nanoid'
import { getDatabase } from '../database/connection'

// ── Row types ─────────────────────────────────────────────────────────────────

interface LearningPathRow {
  id: string
  title: string
  career_goal: string
  description: string | null
  category: string
  seniority_level: string
  estimated_weeks: number
  available_hours_per_week: number
  is_active: 0 | 1
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface LearningPathSkillRow {
  id: string
  path_id: string
  skill_id: string | null
  skill_name: string
  order_index: number
  why_it_matters: string | null
  prerequisites_json: string | null
  estimated_hours: number
  target_level: string
  is_unlocked: 0 | 1
  current_level: string | null
  current_status: string | null
  created_at: string
  updated_at: string
}

interface SkillMethodRow {
  id: string
  skill_id: string
  skill_name: string
  home_lab_pct: number
  notes_pct: number
  videos_pct: number
  active_recall_pct: number
  flashcards_pct: number
  interview_pct: number
  projects_pct: number
  rationale: string | null
  is_custom: 0 | 1
  created_at: string
  updated_at: string
}

interface RetentionRow {
  id: string
  skill_id: string
  skill_name: string
  skill_slug: string
  category_name: string
  category_color: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  last_reviewed_at: string | null
  retention_score: number
  created_at: string
  updated_at: string
}

interface ReviewLogRow {
  id: string
  skill_id: string
  skill_name: string
  quality: number
  ease_factor_after: number
  interval_after: number
  notes: string | null
  reviewed_at: string
  created_at: string
}

interface StudyPlanRow {
  id: string
  title: string
  career_goal: string
  plan_type: string
  start_date: string
  end_date: string | null
  available_hours_per_week: number
  is_active: 0 | 1
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface StudyPlanItemRow {
  id: string
  plan_id: string
  skill_id: string | null
  skill_name: string
  action: string
  method: string
  estimated_minutes: number
  day_of_plan: number
  order_index: number
  is_done: 0 | 1
  done_at: string | null
  created_at: string
}

interface SkillDependencyRow {
  skill_id: string
  skill_name: string
  prerequisite_id: string
  prerequisite_name: string
  strength: string
  created_at: string
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface LearningPath extends LearningPathRow {
  skills: LearningPathSkillRow[]
  total_skills: number
  completed_skills: number
  progress_pct: number
  next_skill: LearningPathSkillRow | null
}

export interface LearningPathDetail extends LearningPath {
  skills: LearningPathSkillRow[]
}

export interface EffectivenessMetrics {
  total_study_minutes: number
  total_lab_minutes: number
  total_review_sessions: number
  avg_review_quality: number
  skills_with_retention: number
  avg_retention_score: number
  skills_due_for_review: number
  weekly_study_trend: Array<{ week: string; minutes: number; reviews: number }>
  skill_accuracy_stats: Array<{ skill_name: string; accuracy_pct: number; total_attempts: number }>
  top_retained_skills: Array<{ skill_name: string; retention_score: number; interval_days: number }>
  learning_velocity: number
}

export interface DependencyGraph {
  nodes: Array<{
    id: string
    name: string
    level: string
    status: string
    category: string
    category_color: string
    has_deps: boolean
    deps_met: boolean
  }>
  edges: Array<{
    from: string
    to: string
    strength: string
  }>
}

// ── SM-2 Algorithm ────────────────────────────────────────────────────────────

interface SM2Result {
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  retention_score: number
}

function sm2(quality: number, prev: { ease_factor: number; interval_days: number; repetitions: number }): SM2Result {
  let { ease_factor, interval_days, repetitions } = prev

  if (quality >= 3) {
    if (repetitions === 0) interval_days = 1
    else if (repetitions === 1) interval_days = 6
    else interval_days = Math.round(interval_days * ease_factor)

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if (ease_factor < 1.3) ease_factor = 1.3
    repetitions += 1
  } else {
    repetitions = 0
    interval_days = 1
  }

  const next = new Date()
  next.setDate(next.getDate() + interval_days)
  const next_review_at = next.toISOString().split('T')[0]!

  // retention score: higher quality and longer intervals = higher score
  const retention_score = Math.min(100, Math.round(quality * 20 * (ease_factor / 2.5)))

  return { ease_factor: Math.round(ease_factor * 100) / 100, interval_days, repetitions, next_review_at, retention_score }
}

// ── Default method configs by skill category/name ────────────────────────────

const METHOD_DEFAULTS: Record<string, { home_lab_pct: number; notes_pct: number; videos_pct: number; active_recall_pct: number; flashcards_pct: number; interview_pct: number; projects_pct: number; rationale: string }> = {
  'networking': { home_lab_pct: 30, notes_pct: 15, videos_pct: 20, active_recall_pct: 10, flashcards_pct: 15, interview_pct: 5, projects_pct: 5, rationale: 'Networking is best learned by doing — lab practice builds muscle memory for subnetting and protocols.' },
  'dns': { home_lab_pct: 20, notes_pct: 15, videos_pct: 10, active_recall_pct: 10, flashcards_pct: 40, interview_pct: 5, projects_pct: 0, rationale: 'DNS has many terminology-heavy concepts — flashcards are highly effective. Supplement with labs.' },
  'dhcp': { home_lab_pct: 30, notes_pct: 10, videos_pct: 10, active_recall_pct: 10, flashcards_pct: 30, interview_pct: 5, projects_pct: 5, rationale: 'DHCP needs both conceptual flashcard mastery and hands-on configuration practice.' },
  'active directory': { home_lab_pct: 35, notes_pct: 15, videos_pct: 20, active_recall_pct: 10, flashcards_pct: 10, interview_pct: 5, projects_pct: 5, rationale: 'Active Directory is a large domain — home lab practice is essential. Video walkthroughs help with unfamiliar admin tasks.' },
  'azure': { home_lab_pct: 25, notes_pct: 15, videos_pct: 25, active_recall_pct: 10, flashcards_pct: 10, interview_pct: 5, projects_pct: 10, rationale: 'Azure requires both video learning (Microsoft Learn) and hands-on portal practice. Build real projects.' },
  'powershell': { home_lab_pct: 20, notes_pct: 20, videos_pct: 15, active_recall_pct: 15, flashcards_pct: 5, interview_pct: 5, projects_pct: 20, rationale: 'PowerShell is a language — write scripts daily. Notes and active recall reinforce syntax.' },
  'security': { home_lab_pct: 25, notes_pct: 20, videos_pct: 20, active_recall_pct: 10, flashcards_pct: 10, interview_pct: 10, projects_pct: 5, rationale: 'Security requires conceptual depth and lab threat simulation. Interview prep builds scenario thinking.' },
  'windows server': { home_lab_pct: 35, notes_pct: 10, videos_pct: 25, active_recall_pct: 10, flashcards_pct: 10, interview_pct: 5, projects_pct: 5, rationale: 'Windows Server is a hands-on tool — lab hours dominate. Video walkthroughs for unfamiliar features.' },
  'linux': { home_lab_pct: 35, notes_pct: 15, videos_pct: 15, active_recall_pct: 10, flashcards_pct: 10, interview_pct: 5, projects_pct: 10, rationale: 'Linux is best learned in the terminal. Daily command practice builds fluency faster than passive study.' },
  'default': { home_lab_pct: 20, notes_pct: 20, videos_pct: 20, active_recall_pct: 15, flashcards_pct: 15, interview_pct: 5, projects_pct: 5, rationale: 'Balanced approach: mix of hands-on, conceptual, and recall-based learning.' },
}

function getDefaultMethods(skillName: string) {
  const name = skillName.toLowerCase()
  for (const [key, config] of Object.entries(METHOD_DEFAULTS)) {
    if (name.includes(key)) return config
  }
  return METHOD_DEFAULTS['default']!
}

// ── Study plan generation ─────────────────────────────────────────────────────

interface GeneratePlanInput {
  title: string
  career_goal: string
  plan_type: 'daily' | 'weekly' | 'monthly'
  available_hours_per_week: number
  start_date?: string
  notes?: string | null
}

// ── Service ───────────────────────────────────────────────────────────────────

export const learningCoachService = {

  // ── Learning Paths ──────────────────────────────────────────────────────────

  getAllPaths(): LearningPath[] {
    const db = getDatabase()

    const paths = db.prepare<[], LearningPathRow>(`
      SELECT * FROM learning_paths WHERE deleted_at IS NULL ORDER BY created_at DESC
    `).all()

    return paths.map(p => {
      const skills = db.prepare<[string], LearningPathSkillRow>(`
        SELECT lps.*, s.proficiency_level AS current_level, s.status AS current_status
        FROM learning_path_skills lps
        LEFT JOIN skills s ON s.id = lps.skill_id
        WHERE lps.path_id = ?
        ORDER BY lps.order_index
      `).all(p.id)

      const completed = skills.filter(s => s.current_status === 'mastered' || s.current_level === s.target_level).length
      const total = skills.length
      const progress_pct = total > 0 ? Math.round((completed / total) * 100) : 0

      const unlocked = computeUnlockedSkills(skills)
      const next_skill = unlocked.find(s => s.current_status !== 'mastered' && s.current_level !== s.target_level) ?? null

      return { ...p, skills: unlocked, total_skills: total, completed_skills: completed, progress_pct, next_skill }
    })
  },

  getPathById(id: string): LearningPathDetail {
    const db = getDatabase()

    const path = db.prepare<[string], LearningPathRow>(`
      SELECT * FROM learning_paths WHERE id = ? AND deleted_at IS NULL
    `).get(id)

    if (!path) throw new Error('Learning path not found')

    const skills = db.prepare<[string], LearningPathSkillRow>(`
      SELECT lps.*, s.proficiency_level AS current_level, s.status AS current_status
      FROM learning_path_skills lps
      LEFT JOIN skills s ON s.id = lps.skill_id
      WHERE lps.path_id = ?
      ORDER BY lps.order_index
    `).all(id)

    const unlocked = computeUnlockedSkills(skills)
    const completed = unlocked.filter(s => s.current_status === 'mastered' || s.current_level === s.target_level).length
    const total = skills.length
    const progress_pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const next_skill = unlocked.find(s => s.current_status !== 'mastered' && s.current_level !== s.target_level) ?? null

    return { ...path, skills: unlocked, total_skills: total, completed_skills: completed, progress_pct, next_skill }
  },

  createPath(data: { title: string; career_goal: string; description?: string | null; category?: string; seniority_level?: string; estimated_weeks?: number; available_hours_per_week?: number; notes?: string | null }): LearningPath {
    const db = getDatabase()
    const id = nanoid()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO learning_paths (id, title, career_goal, description, category, seniority_level, estimated_weeks, available_hours_per_week, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, data.title, data.career_goal, data.description ?? null,
      data.category ?? 'custom', data.seniority_level ?? 'entry',
      data.estimated_weeks ?? 12, data.available_hours_per_week ?? 10,
      data.notes ?? null, now, now
    )

    return this.getPathById(id)
  },

  updatePath(id: string, data: Partial<{ title: string; career_goal: string; description: string | null; category: string; seniority_level: string; estimated_weeks: number; available_hours_per_week: number; is_active: 0 | 1; notes: string | null }>): LearningPath {
    const db = getDatabase()
    const fields = Object.entries(data).map(([k]) => `${k} = ?`).join(', ')
    const values = Object.values(data)
    db.prepare(`UPDATE learning_paths SET ${fields}, updated_at = ? WHERE id = ?`).run(...values, new Date().toISOString(), id)
    return this.getPathById(id)
  },

  deletePath(id: string): void {
    const db = getDatabase()
    db.prepare(`UPDATE learning_paths SET deleted_at = ? WHERE id = ?`).run(new Date().toISOString(), id)
  },

  setPathSkills(pathId: string, skills: Array<{ skill_id?: string | null; skill_name: string; order_index?: number; why_it_matters?: string | null; prerequisites_json?: string | null; estimated_hours?: number; target_level?: string }>): void {
    const db = getDatabase()
    db.transaction(() => {
      db.prepare(`DELETE FROM learning_path_skills WHERE path_id = ?`).run(pathId)
      const stmt = db.prepare(`
        INSERT INTO learning_path_skills (id, path_id, skill_id, skill_name, order_index, why_it_matters, prerequisites_json, estimated_hours, target_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      skills.forEach((s, i) => {
        stmt.run(nanoid(), pathId, s.skill_id ?? null, s.skill_name, s.order_index ?? i, s.why_it_matters ?? null, s.prerequisites_json ?? null, s.estimated_hours ?? 5, s.target_level ?? 'intermediate')
      })
      db.prepare(`UPDATE learning_paths SET updated_at = ? WHERE id = ?`).run(new Date().toISOString(), pathId)
    })()
  },

  // ── Skill Method Configs ────────────────────────────────────────────────────

  getAllMethodConfigs(): SkillMethodRow[] {
    const db = getDatabase()
    return db.prepare<[], SkillMethodRow>(`
      SELECT smc.*, s.name AS skill_name
      FROM skill_method_configs smc
      JOIN skills s ON s.id = smc.skill_id
      ORDER BY s.name
    `).all()
  },

  getMethodConfigBySkill(skillId: string): SkillMethodRow | null {
    const db = getDatabase()
    const row = db.prepare<[string], SkillMethodRow>(`
      SELECT smc.*, s.name AS skill_name
      FROM skill_method_configs smc
      JOIN skills s ON s.id = smc.skill_id
      WHERE smc.skill_id = ?
    `).get(skillId)

    if (row) return row

    // Auto-generate from defaults
    const skill = db.prepare<[string], { name: string }>(`SELECT name FROM skills WHERE id = ?`).get(skillId)
    if (!skill) return null

    const defaults = getDefaultMethods(skill.name)
    return this.upsertMethodConfig(skillId, defaults)
  },

  upsertMethodConfig(skillId: string, data: Partial<{ home_lab_pct: number; notes_pct: number; videos_pct: number; active_recall_pct: number; flashcards_pct: number; interview_pct: number; projects_pct: number; rationale: string | null; is_custom: 0 | 1 }>): SkillMethodRow {
    const db = getDatabase()
    const existing = db.prepare<[string], { id: string }>(`SELECT id FROM skill_method_configs WHERE skill_id = ?`).get(skillId)
    const now = new Date().toISOString()

    if (existing) {
      const fields = Object.entries(data).map(([k]) => `${k} = ?`).join(', ')
      const values = Object.values(data)
      db.prepare(`UPDATE skill_method_configs SET ${fields}, updated_at = ? WHERE skill_id = ?`).run(...values, now, skillId)
    } else {
      const defaults = { home_lab_pct: 20, notes_pct: 20, videos_pct: 20, active_recall_pct: 15, flashcards_pct: 15, interview_pct: 5, projects_pct: 5, rationale: null, is_custom: 0 as 0 | 1 }
      const merged = { ...defaults, ...data }
      db.prepare(`
        INSERT INTO skill_method_configs (id, skill_id, home_lab_pct, notes_pct, videos_pct, active_recall_pct, flashcards_pct, interview_pct, projects_pct, rationale, is_custom, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(nanoid(), skillId, merged.home_lab_pct, merged.notes_pct, merged.videos_pct, merged.active_recall_pct, merged.flashcards_pct, merged.interview_pct, merged.projects_pct, merged.rationale, merged.is_custom, now, now)
    }

    return this.getMethodConfigBySkill(skillId)!
  },

  // ── Retention System ────────────────────────────────────────────────────────

  getAllRetentionRecords(): RetentionRow[] {
    const db = getDatabase()
    return db.prepare<[], RetentionRow>(`
      SELECT r.*, s.name AS skill_name, s.slug AS skill_slug,
             sc.name AS category_name, sc.color AS category_color
      FROM retention_records r
      JOIN skills s ON s.id = r.skill_id
      LEFT JOIN skill_categories sc ON sc.id = s.category_id
      ORDER BY r.next_review_at ASC
    `).all()
  },

  getDueReviews(): RetentionRow[] {
    const db = getDatabase()
    const today = new Date().toISOString().split('T')[0]!
    return db.prepare<[string], RetentionRow>(`
      SELECT r.*, s.name AS skill_name, s.slug AS skill_slug,
             sc.name AS category_name, sc.color AS category_color
      FROM retention_records r
      JOIN skills s ON s.id = r.skill_id
      LEFT JOIN skill_categories sc ON sc.id = s.category_id
      WHERE r.next_review_at <= ?
      ORDER BY r.next_review_at ASC
    `).all(today)
  },

  upsertRetention(skillId: string): RetentionRow {
    const db = getDatabase()
    const existing = db.prepare<[string], { id: string }>(`SELECT id FROM retention_records WHERE skill_id = ?`).get(skillId)
    const now = new Date().toISOString()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextReview = tomorrow.toISOString().split('T')[0]!

    if (!existing) {
      db.prepare(`
        INSERT INTO retention_records (id, skill_id, ease_factor, interval_days, repetitions, next_review_at, retention_score, created_at, updated_at)
        VALUES (?, ?, 2.5, 1, 0, ?, 0, ?, ?)
      `).run(nanoid(), skillId, nextReview, now, now)
    }

    const rows = db.prepare<[string], RetentionRow>(`
      SELECT r.*, s.name AS skill_name, s.slug AS skill_slug,
             sc.name AS category_name, sc.color AS category_color
      FROM retention_records r
      JOIN skills s ON s.id = r.skill_id
      LEFT JOIN skill_categories sc ON sc.id = s.category_id
      WHERE r.skill_id = ?
    `).all(skillId)

    return rows[0]!
  },

  recordReview(skillId: string, quality: number, notes?: string | null): RetentionRow {
    const db = getDatabase()
    const now = new Date().toISOString()

    const existing = db.prepare<[string], { ease_factor: number; interval_days: number; repetitions: number }>(`
      SELECT ease_factor, interval_days, repetitions FROM retention_records WHERE skill_id = ?
    `).get(skillId)

    const prev = existing ?? { ease_factor: 2.5, interval_days: 1, repetitions: 0 }
    const result = sm2(quality, prev)

    db.prepare(`
      INSERT INTO review_logs (id, skill_id, quality, ease_factor_after, interval_after, notes, reviewed_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(nanoid(), skillId, quality, result.ease_factor, result.interval_days, notes ?? null, now, now)

    if (!existing) {
      db.prepare(`
        INSERT INTO retention_records (id, skill_id, ease_factor, interval_days, repetitions, next_review_at, last_reviewed_at, retention_score, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(nanoid(), skillId, result.ease_factor, result.interval_days, result.repetitions, result.next_review_at, now, result.retention_score, now, now)
    } else {
      db.prepare(`
        UPDATE retention_records
        SET ease_factor = ?, interval_days = ?, repetitions = ?, next_review_at = ?, last_reviewed_at = ?, retention_score = ?, updated_at = ?
        WHERE skill_id = ?
      `).run(result.ease_factor, result.interval_days, result.repetitions, result.next_review_at, now, result.retention_score, now, skillId)
    }

    return this.upsertRetention(skillId)
  },

  getReviewLogs(skillId?: string): ReviewLogRow[] {
    const db = getDatabase()
    if (skillId) {
      return db.prepare<[string], ReviewLogRow>(`
        SELECT rl.*, s.name AS skill_name FROM review_logs rl
        JOIN skills s ON s.id = rl.skill_id
        WHERE rl.skill_id = ? ORDER BY rl.reviewed_at DESC LIMIT 50
      `).all(skillId)
    }
    return db.prepare<[], ReviewLogRow>(`
      SELECT rl.*, s.name AS skill_name FROM review_logs rl
      JOIN skills s ON s.id = rl.skill_id
      ORDER BY rl.reviewed_at DESC LIMIT 100
    `).all()
  },

  // ── Study Plans ─────────────────────────────────────────────────────────────

  getAllPlans(): Array<StudyPlanRow & { items: StudyPlanItemRow[]; completed_items: number; total_items: number; progress_pct: number }> {
    const db = getDatabase()
    const plans = db.prepare<[], StudyPlanRow>(`
      SELECT * FROM study_plans WHERE deleted_at IS NULL ORDER BY created_at DESC
    `).all()

    return plans.map(p => {
      const items = db.prepare<[string], StudyPlanItemRow>(`
        SELECT * FROM study_plan_items WHERE plan_id = ? ORDER BY day_of_plan, order_index
      `).all(p.id)
      const completed_items = items.filter(i => i.is_done === 1).length
      const total_items = items.length
      const progress_pct = total_items > 0 ? Math.round((completed_items / total_items) * 100) : 0
      return { ...p, items, completed_items, total_items, progress_pct }
    })
  },

  getPlanById(id: string): StudyPlanRow & { items: StudyPlanItemRow[]; completed_items: number; total_items: number; progress_pct: number } {
    const db = getDatabase()
    const plan = db.prepare<[string], StudyPlanRow>(`SELECT * FROM study_plans WHERE id = ? AND deleted_at IS NULL`).get(id)
    if (!plan) throw new Error('Study plan not found')

    const items = db.prepare<[string], StudyPlanItemRow>(`
      SELECT * FROM study_plan_items WHERE plan_id = ? ORDER BY day_of_plan, order_index
    `).all(id)
    const completed_items = items.filter(i => i.is_done === 1).length
    const total_items = items.length
    const progress_pct = total_items > 0 ? Math.round((completed_items / total_items) * 100) : 0
    return { ...plan, items, completed_items, total_items, progress_pct }
  },

  generatePlan(input: GeneratePlanInput): StudyPlanRow & { items: StudyPlanItemRow[]; completed_items: number; total_items: number; progress_pct: number } {
    const db = getDatabase()
    const id = nanoid()
    const now = new Date().toISOString()
    const start = input.start_date ?? new Date().toISOString().split('T')[0]!

    // Compute end date based on plan type
    const endDate = new Date(start)
    if (input.plan_type === 'daily') endDate.setDate(endDate.getDate() + 1)
    else if (input.plan_type === 'weekly') endDate.setDate(endDate.getDate() + 7)
    else endDate.setMonth(endDate.getMonth() + 1)
    const end = endDate.toISOString().split('T')[0]!

    db.prepare(`
      INSERT INTO study_plans (id, title, career_goal, plan_type, start_date, end_date, available_hours_per_week, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, input.title, input.career_goal, input.plan_type, start, end, input.available_hours_per_week, input.notes ?? null, now, now)

    // Pull skill gaps from skill_progress
    const skillGaps = db.prepare<[], { skill_id: string; skill_name: string; current_level: string; target_level: string; confidence_score: number; weekly_goal_hours: number }>(`
      SELECT sp.skill_id, s.name AS skill_name, s.proficiency_level AS current_level,
             sp.target_level, sp.confidence_score, sp.weekly_goal_hours
      FROM skill_progress sp
      JOIN skills s ON s.id = sp.skill_id
      WHERE s.deleted_at IS NULL
      ORDER BY sp.confidence_score ASC
      LIMIT 10
    `).all()

    // Also pull due reviews
    const today = new Date().toISOString().split('T')[0]!
    const dueReviews = db.prepare<[string], { skill_id: string; skill_name: string }>(`
      SELECT r.skill_id, s.name AS skill_name FROM retention_records r
      JOIN skills s ON s.id = r.skill_id
      WHERE r.next_review_at <= ?
      LIMIT 5
    `).all(today)

    const totalMinutes = input.available_hours_per_week * 60
    const days = input.plan_type === 'daily' ? 1 : input.plan_type === 'weekly' ? 7 : 30
    const minutesPerDay = Math.round(totalMinutes / (input.plan_type === 'monthly' ? 4 : days))

    const itemStmt = db.prepare(`
      INSERT INTO study_plan_items (id, plan_id, skill_id, skill_name, action, method, estimated_minutes, day_of_plan, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const methods: Array<'home-lab' | 'notes' | 'videos' | 'active-recall' | 'flashcards' | 'interview-questions' | 'projects'> =
      ['home-lab', 'notes', 'videos', 'active-recall', 'flashcards', 'interview-questions', 'projects']

    db.transaction(() => {
      let day = 1
      let dayMinutes = 0
      let order = 0

      // First add review sessions
      for (const review of dueReviews) {
        if (dayMinutes + 15 > minutesPerDay && day < days) { day++; dayMinutes = 0; order = 0 }
        itemStmt.run(nanoid(), id, review.skill_id, review.skill_name, `Spaced repetition review: ${review.skill_name}`, 'active-recall', 15, day, order++, now)
        dayMinutes += 15
      }

      // Then add skill study items
      for (const gap of skillGaps) {
        const methodConfig = db.prepare<[string], { home_lab_pct: number; notes_pct: number; videos_pct: number; active_recall_pct: number; flashcards_pct: number; interview_pct: number; projects_pct: number } | null>(`
          SELECT * FROM skill_method_configs WHERE skill_id = ?
        `).get(gap.skill_id)

        const pcts = methodConfig ?? { home_lab_pct: 20, notes_pct: 20, videos_pct: 20, active_recall_pct: 15, flashcards_pct: 15, interview_pct: 5, projects_pct: 5 }
        const skillMinutes = Math.min(gap.weekly_goal_hours * 60, minutesPerDay * 2)

        // Allocate minutes to methods by percentage
        type MethodAlloc = { method: typeof methods[number]; minutes: number; action: string }
        const rawAllocations: MethodAlloc[] = [
          { method: 'home-lab',             minutes: Math.round(skillMinutes * pcts.home_lab_pct / 100),       action: `Home lab practice: ${gap.skill_name}` },
          { method: 'notes',                minutes: Math.round(skillMinutes * pcts.notes_pct / 100),           action: `Read & take notes: ${gap.skill_name}` },
          { method: 'videos',               minutes: Math.round(skillMinutes * pcts.videos_pct / 100),          action: `Watch training videos: ${gap.skill_name}` },
          { method: 'active-recall',        minutes: Math.round(skillMinutes * pcts.active_recall_pct / 100),   action: `Active recall session: ${gap.skill_name}` },
          { method: 'flashcards',           minutes: Math.round(skillMinutes * pcts.flashcards_pct / 100),      action: `Flashcard review: ${gap.skill_name}` },
          { method: 'interview-questions',  minutes: Math.round(skillMinutes * pcts.interview_pct / 100),       action: `Interview question practice: ${gap.skill_name}` },
          { method: 'projects',             minutes: Math.round(skillMinutes * pcts.projects_pct / 100),        action: `Project work: ${gap.skill_name}` },
        ]
        const allocations: MethodAlloc[] = rawAllocations.filter(a => a.minutes >= 5)

        for (const alloc of allocations) {
          if (day > days) break
          if (dayMinutes + alloc.minutes > minutesPerDay && day < days) { day++; dayMinutes = 0; order = 0 }
          itemStmt.run(nanoid(), id, gap.skill_id, gap.skill_name, alloc.action, alloc.method, alloc.minutes, day, order++, now)
          dayMinutes += alloc.minutes
        }
      }
    })()

    return this.getPlanById(id)
  },

  deletePlan(id: string): void {
    const db = getDatabase()
    db.prepare(`UPDATE study_plans SET deleted_at = ? WHERE id = ?`).run(new Date().toISOString(), id)
  },

  markPlanItemDone(itemId: string, done: boolean): StudyPlanItemRow {
    const db = getDatabase()
    db.prepare(`UPDATE study_plan_items SET is_done = ?, done_at = ? WHERE id = ?`).run(
      done ? 1 : 0,
      done ? new Date().toISOString() : null,
      itemId
    )
    return db.prepare<[string], StudyPlanItemRow>(`SELECT * FROM study_plan_items WHERE id = ?`).get(itemId)!
  },

  // ── Skill Dependencies ──────────────────────────────────────────────────────

  getAllDependencies(): SkillDependencyRow[] {
    const db = getDatabase()
    return db.prepare<[], SkillDependencyRow>(`
      SELECT sd.skill_id, s1.name AS skill_name,
             sd.prerequisite_id, s2.name AS prerequisite_name,
             sd.strength, sd.created_at
      FROM skill_dependencies sd
      JOIN skills s1 ON s1.id = sd.skill_id
      JOIN skills s2 ON s2.id = sd.prerequisite_id
      ORDER BY s1.name, s2.name
    `).all()
  },

  addDependency(skillId: string, prerequisiteId: string, strength: 'required' | 'recommended' | 'optional' = 'required'): void {
    const db = getDatabase()
    db.prepare(`
      INSERT OR REPLACE INTO skill_dependencies (skill_id, prerequisite_id, strength, created_at)
      VALUES (?, ?, ?, ?)
    `).run(skillId, prerequisiteId, strength, new Date().toISOString())
  },

  removeDependency(skillId: string, prerequisiteId: string): void {
    const db = getDatabase()
    db.prepare(`DELETE FROM skill_dependencies WHERE skill_id = ? AND prerequisite_id = ?`).run(skillId, prerequisiteId)
  },

  getDependencyGraph(): DependencyGraph {
    const db = getDatabase()

    const skills = db.prepare<[], { id: string; name: string; proficiency_level: string; status: string; category_name: string; category_color: string }>(`
      SELECT s.id, s.name, s.proficiency_level, s.status,
             COALESCE(sc.name, 'Uncategorized') AS category_name,
             COALESCE(sc.color, '#6B7280') AS category_color
      FROM skills s
      LEFT JOIN skill_categories sc ON sc.id = s.category_id
      WHERE s.deleted_at IS NULL
      ORDER BY s.name
    `).all()

    const deps = db.prepare<[], { skill_id: string; prerequisite_id: string; strength: string }>(`
      SELECT skill_id, prerequisite_id, strength FROM skill_dependencies
    `).all()

    const depMap = new Map<string, Set<string>>()
    for (const dep of deps) {
      if (!depMap.has(dep.skill_id)) depMap.set(dep.skill_id, new Set())
      depMap.get(dep.skill_id)!.add(dep.prerequisite_id)
    }

    const skillIds = new Set(skills.map(s => s.id))
    const masteredOrAdvanced = new Set(skills.filter(s => s.status === 'mastered' || s.proficiency_level === 'advanced' || s.proficiency_level === 'expert').map(s => s.id))

    const nodes = skills.map(s => {
      const prereqs = depMap.get(s.id) ?? new Set()
      const has_deps = prereqs.size > 0
      const deps_met = has_deps
        ? [...prereqs].every(p => !skillIds.has(p) || masteredOrAdvanced.has(p))
        : true
      return { id: s.id, name: s.name, level: s.proficiency_level, status: s.status, category: s.category_name, category_color: s.category_color, has_deps, deps_met }
    })

    const edges = deps.map(d => ({ from: d.prerequisite_id, to: d.skill_id, strength: d.strength }))

    return { nodes, edges }
  },

  // ── Effectiveness Metrics ───────────────────────────────────────────────────

  getEffectivenessMetrics(): EffectivenessMetrics {
    const db = getDatabase()

    const studyMinutes = (db.prepare(`SELECT COALESCE(SUM(duration_minutes), 0) AS total FROM study_sessions`).get() as { total: number }).total
    const labMinutes = (db.prepare(`SELECT COALESCE(SUM(duration_min), 0) AS total FROM home_lab_time_entries`).get() as { total: number }).total
    const reviewStats = db.prepare<[], { total: number; avg_quality: number }>(`
      SELECT COUNT(*) AS total, ROUND(AVG(quality), 2) AS avg_quality FROM review_logs
    `).get() ?? { total: 0, avg_quality: 0 }

    const retentionStats = db.prepare<[], { count: number; avg_score: number }>(`
      SELECT COUNT(*) AS count, ROUND(AVG(retention_score), 1) AS avg_score FROM retention_records
    `).get() ?? { count: 0, avg_score: 0 }

    const today = new Date().toISOString().split('T')[0]!
    const dueCount = (db.prepare<[string], { cnt: number }>(`SELECT COUNT(*) AS cnt FROM retention_records WHERE next_review_at <= ?`).get(today) ?? { cnt: 0 }).cnt

    const weeklyStudy = db.prepare<[], { week: string; minutes: number; reviews: number }>(`
      SELECT strftime('%Y-W%W', session_date) AS week,
             SUM(duration_minutes) AS minutes, 0 AS reviews
      FROM study_sessions
      WHERE session_date >= date('now', '-12 weeks')
      GROUP BY week ORDER BY week DESC LIMIT 12
    `).all()

    const quizStats = db.prepare<[], { skill_name: string; accuracy_pct: number; total_attempts: number }>(`
      SELECT s.name AS skill_name,
             ROUND(100.0 * SUM(qa.is_correct) / COUNT(*), 1) AS accuracy_pct,
             COUNT(*) AS total_attempts
      FROM skill_quiz_attempts qa
      JOIN skills s ON s.id = qa.skill_id
      GROUP BY qa.skill_id
      ORDER BY accuracy_pct DESC
      LIMIT 10
    `).all()

    const topRetained = db.prepare<[], { skill_name: string; retention_score: number; interval_days: number }>(`
      SELECT s.name AS skill_name, r.retention_score, r.interval_days
      FROM retention_records r
      JOIN skills s ON s.id = r.skill_id
      ORDER BY r.retention_score DESC LIMIT 5
    `).all()

    // Learning velocity: skills added per month over last 3 months
    const velocity = (db.prepare(`
      SELECT COUNT(*) AS cnt FROM skills
      WHERE created_at >= date('now', '-90 days') AND deleted_at IS NULL
    `).get() as { cnt: number }).cnt

    return {
      total_study_minutes: studyMinutes,
      total_lab_minutes: labMinutes,
      total_review_sessions: reviewStats.total,
      avg_review_quality: reviewStats.avg_quality ?? 0,
      skills_with_retention: retentionStats.count,
      avg_retention_score: retentionStats.avg_score ?? 0,
      skills_due_for_review: dueCount,
      weekly_study_trend: weeklyStudy,
      skill_accuracy_stats: quizStats,
      top_retained_skills: topRetained,
      learning_velocity: velocity,
    }
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeUnlockedSkills(skills: LearningPathSkillRow[]): LearningPathSkillRow[] {
  const masteredNames = new Set(
    skills
      .filter(s => s.current_status === 'mastered' || s.current_level === s.target_level)
      .map(s => s.skill_name.toLowerCase())
  )

  return skills.map((s, i) => {
    if (i === 0) return { ...s, is_unlocked: 1 as 0 | 1 }

    let prereqs: string[] = []
    try { prereqs = s.prerequisites_json ? JSON.parse(s.prerequisites_json) as string[] : [] } catch { prereqs = [] }

    const met = prereqs.length === 0 || prereqs.every(p => masteredNames.has(p.toLowerCase()))
    return { ...s, is_unlocked: met ? 1 : 0 as 0 | 1 }
  })
}
