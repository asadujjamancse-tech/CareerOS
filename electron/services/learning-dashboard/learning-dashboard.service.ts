import type { Database } from 'better-sqlite3'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardTotals {
  skills_total: number
  skills_mastered: number
  projects_total: number
  projects_completed: number
  certifications_total: number
  certifications_earned: number
  labs_total: number
  labs_completed: number
  interview_questions_total: number
  interview_questions_mastered: number
  total_study_minutes: number
  total_lab_minutes: number
}

export interface CareerReadinessScore {
  overall: number
  skills_score: number
  certifications_score: number
  projects_score: number
  labs_score: number
  interview_score: number
}

export interface WeeklyActivity {
  week_start: string
  study_minutes: number
  lab_minutes: number
  skills_added: number
  questions_reviewed: number
}

export interface MonthlyActivity {
  month: string
  study_minutes: number
  lab_minutes: number
  skills_added: number
  labs_completed: number
  certs_earned: number
  questions_mastered: number
}

export interface SkillGrowth {
  month: string
  count: number
  mastered: number
}

export interface RecentActivity {
  type: 'skill' | 'lab' | 'certification' | 'project' | 'interview_question'
  id: string
  title: string
  detail: string
  occurred_at: string
}

export interface LearningDashboard {
  totals: DashboardTotals
  career_readiness: CareerReadinessScore
  weekly_activity: WeeklyActivity[]
  monthly_activity: MonthlyActivity[]
  skill_growth: SkillGrowth[]
  recent_activity: RecentActivity[]
  top_skills: Array<{ name: string; category: string; level: string; status: string }>
  upcoming_cert_renewals: Array<{ name: string; issuer: string; expiry_date: string; days_left: number }>
}

// ── Queries ───────────────────────────────────────────────────────────────────

function computeReadiness(totals: DashboardTotals): CareerReadinessScore {
  const skills_score = totals.skills_total > 0
    ? Math.min(100, Math.round((totals.skills_mastered / totals.skills_total) * 100))
    : 0

  const certifications_score = totals.certifications_total > 0
    ? Math.min(100, Math.round((totals.certifications_earned / totals.certifications_total) * 100))
    : 0

  const projects_score = totals.projects_total > 0
    ? Math.min(100, Math.round((totals.projects_completed / totals.projects_total) * 100))
    : 0

  const labs_score = totals.labs_total > 0
    ? Math.min(100, Math.round((totals.labs_completed / totals.labs_total) * 100))
    : 0

  const interview_score = totals.interview_questions_total > 0
    ? Math.min(100, Math.round((totals.interview_questions_mastered / totals.interview_questions_total) * 100))
    : 0

  const overall = Math.round(
    skills_score * 0.30 +
    certifications_score * 0.20 +
    projects_score * 0.20 +
    labs_score * 0.15 +
    interview_score * 0.15,
  )

  return { overall, skills_score, certifications_score, projects_score, labs_score, interview_score }
}

export function getLearningDashboard(db: Database): LearningDashboard {
  // ── Totals ───────────────────────────────────────────────────────────────────
  const skills_total = (db.prepare("SELECT COUNT(*) AS c FROM skills WHERE deleted_at IS NULL").get() as { c: number }).c
  const skills_mastered = (db.prepare("SELECT COUNT(*) AS c FROM skills WHERE deleted_at IS NULL AND status = 'mastered'").get() as { c: number }).c

  const projects_total = (db.prepare("SELECT COUNT(*) AS c FROM projects WHERE deleted_at IS NULL").get() as { c: number }).c
  const projects_completed = (db.prepare("SELECT COUNT(*) AS c FROM projects WHERE deleted_at IS NULL AND status = 'completed'").get() as { c: number }).c

  const certifications_total = (db.prepare("SELECT COUNT(*) AS c FROM certifications WHERE deleted_at IS NULL").get() as { c: number }).c
  const certifications_earned = (db.prepare("SELECT COUNT(*) AS c FROM certifications WHERE deleted_at IS NULL AND status = 'earned'").get() as { c: number }).c

  const hasHomeLabs = checkTableExists(db, 'home_labs')
  let labs_total = 0, labs_completed = 0, total_lab_minutes = 0
  if (hasHomeLabs) {
    labs_total = (db.prepare("SELECT COUNT(*) AS c FROM home_labs WHERE deleted_at IS NULL").get() as { c: number }).c
    labs_completed = (db.prepare("SELECT COUNT(*) AS c FROM home_labs WHERE deleted_at IS NULL AND status = 'completed'").get() as { c: number }).c
    total_lab_minutes = (db.prepare("SELECT COALESCE(SUM(duration_min), 0) AS m FROM home_lab_time_entries").get() as { m: number }).m
  }

  const hasInterviewQ = checkTableExists(db, 'interview_questions')
  let interview_questions_total = 0, interview_questions_mastered = 0
  if (hasInterviewQ) {
    interview_questions_total = (db.prepare("SELECT COUNT(*) AS c FROM interview_questions WHERE deleted_at IS NULL").get() as { c: number }).c
    interview_questions_mastered = (db.prepare("SELECT COUNT(*) AS c FROM interview_questions WHERE deleted_at IS NULL AND mastery_score >= 4").get() as { c: number }).c
  }

  const hasStudySessions = checkTableExists(db, 'study_sessions')
  const total_study_minutes = hasStudySessions
    ? (db.prepare("SELECT COALESCE(SUM(duration_minutes), 0) AS m FROM study_sessions").get() as { m: number }).m
    : 0

  const totals: DashboardTotals = {
    skills_total, skills_mastered,
    projects_total, projects_completed,
    certifications_total, certifications_earned,
    labs_total, labs_completed,
    interview_questions_total, interview_questions_mastered,
    total_study_minutes, total_lab_minutes,
  }

  const career_readiness = computeReadiness(totals)

  // ── Weekly Activity (last 12 weeks) ─────────────────────────────────────────
  const weekly_activity: WeeklyActivity[] = buildWeeklyActivity(db, hasStudySessions, hasHomeLabs, 12)

  // ── Monthly Activity (last 12 months) ────────────────────────────────────────
  const monthly_activity: MonthlyActivity[] = buildMonthlyActivity(db, hasStudySessions, hasHomeLabs, hasInterviewQ, 12)

  // ── Skill Growth ─────────────────────────────────────────────────────────────
  const skill_growth = db.prepare(`
    SELECT strftime('%Y-%m', created_at) AS month,
      COUNT(*) AS count,
      SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) AS mastered
    FROM skills WHERE deleted_at IS NULL
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all() as SkillGrowth[]

  // ── Recent Activity ──────────────────────────────────────────────────────────
  const recent_activity = buildRecentActivity(db, hasHomeLabs, hasInterviewQ)

  // ── Top Skills ───────────────────────────────────────────────────────────────
  const top_skills = db.prepare(`
    SELECT s.name, sc.name AS category, s.proficiency_level AS level, s.status
    FROM skills s JOIN skill_categories sc ON sc.id = s.category_id
    WHERE s.deleted_at IS NULL AND s.status IN ('proficient','mastered')
    ORDER BY s.proficiency_level DESC, s.updated_at DESC LIMIT 10
  `).all() as Array<{ name: string; category: string; level: string; status: string }>

  // ── Upcoming Cert Renewals ────────────────────────────────────────────────────
  const upcoming_cert_renewals = db.prepare(`
    SELECT name, issuer, expiry_date,
      CAST(julianday(expiry_date) - julianday('now') AS INTEGER) AS days_left
    FROM certifications
    WHERE deleted_at IS NULL AND status = 'earned' AND expiry_date IS NOT NULL
      AND julianday(expiry_date) > julianday('now')
      AND julianday(expiry_date) < julianday('now', '+180 days')
    ORDER BY expiry_date ASC LIMIT 5
  `).all() as Array<{ name: string; issuer: string; expiry_date: string; days_left: number }>

  return {
    totals,
    career_readiness,
    weekly_activity,
    monthly_activity,
    skill_growth: skill_growth.reverse(),
    recent_activity,
    top_skills,
    upcoming_cert_renewals,
  }
}

// ── Weekly report ─────────────────────────────────────────────────────────────

export interface WeeklyReport {
  week_start: string
  week_end: string
  study_minutes: number
  lab_minutes: number
  skills_added: number
  skills_mastered: number
  labs_completed: number
  questions_reviewed: number
  questions_mastered: number
}

export function getWeeklyReport(db: Database, weekStart: string): WeeklyReport {
  const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const study_minutes = checkTableExists(db, 'study_sessions')
    ? (db.prepare("SELECT COALESCE(SUM(duration_minutes), 0) AS m FROM study_sessions WHERE session_date >= ? AND session_date < ?").get(weekStart, weekEnd) as { m: number }).m
    : 0

  const lab_minutes = checkTableExists(db, 'home_lab_time_entries')
    ? (db.prepare("SELECT COALESCE(SUM(duration_min), 0) AS m FROM home_lab_time_entries WHERE logged_date >= ? AND logged_date < ?").get(weekStart, weekEnd) as { m: number }).m
    : 0

  const skills_added = (db.prepare("SELECT COUNT(*) AS c FROM skills WHERE deleted_at IS NULL AND DATE(created_at) >= ? AND DATE(created_at) < ?").get(weekStart, weekEnd) as { c: number }).c
  const skills_mastered = (db.prepare("SELECT COUNT(*) AS c FROM skills WHERE deleted_at IS NULL AND status = 'mastered' AND DATE(updated_at) >= ? AND DATE(updated_at) < ?").get(weekStart, weekEnd) as { c: number }).c

  const labs_completed = checkTableExists(db, 'home_labs')
    ? (db.prepare("SELECT COUNT(*) AS c FROM home_labs WHERE deleted_at IS NULL AND status = 'completed' AND DATE(completed_at) >= ? AND DATE(completed_at) < ?").get(weekStart, weekEnd) as { c: number }).c
    : 0

  const questions_reviewed = checkTableExists(db, 'interview_questions')
    ? (db.prepare("SELECT COUNT(*) AS c FROM interview_questions WHERE deleted_at IS NULL AND last_reviewed_at IS NOT NULL AND DATE(last_reviewed_at) >= ? AND DATE(last_reviewed_at) < ?").get(weekStart, weekEnd) as { c: number }).c
    : 0

  const questions_mastered = checkTableExists(db, 'interview_questions')
    ? (db.prepare("SELECT COUNT(*) AS c FROM interview_questions WHERE deleted_at IS NULL AND mastery_score >= 4 AND DATE(updated_at) >= ? AND DATE(updated_at) < ?").get(weekStart, weekEnd) as { c: number }).c
    : 0

  return { week_start: weekStart, week_end: weekEnd, study_minutes, lab_minutes, skills_added, skills_mastered, labs_completed, questions_reviewed, questions_mastered }
}

export interface MonthlyReport {
  month: string
  study_minutes: number
  lab_minutes: number
  skills_added: number
  skills_mastered: number
  labs_completed: number
  certs_earned: number
  questions_reviewed: number
  questions_mastered: number
  projects_completed: number
}

export function getMonthlyReport(db: Database, month: string): MonthlyReport {
  const nextMonth = new Date(new Date(month + '-01').setMonth(new Date(month + '-01').getMonth() + 1))
    .toISOString().slice(0, 7)

  const study_minutes = checkTableExists(db, 'study_sessions')
    ? (db.prepare("SELECT COALESCE(SUM(duration_minutes), 0) AS m FROM study_sessions WHERE strftime('%Y-%m', session_date) = ?").get(month) as { m: number }).m
    : 0

  const lab_minutes = checkTableExists(db, 'home_lab_time_entries')
    ? (db.prepare("SELECT COALESCE(SUM(duration_min), 0) AS m FROM home_lab_time_entries WHERE strftime('%Y-%m', logged_date) = ?").get(month) as { m: number }).m
    : 0

  const skills_added = (db.prepare("SELECT COUNT(*) AS c FROM skills WHERE deleted_at IS NULL AND strftime('%Y-%m', created_at) = ?").get(month) as { c: number }).c
  const skills_mastered = (db.prepare("SELECT COUNT(*) AS c FROM skills WHERE deleted_at IS NULL AND status = 'mastered' AND strftime('%Y-%m', updated_at) = ?").get(month) as { c: number }).c
  const projects_completed = (db.prepare("SELECT COUNT(*) AS c FROM projects WHERE deleted_at IS NULL AND status = 'completed' AND strftime('%Y-%m', completed_at) = ?").get(month) as { c: number }).c
  const certs_earned = (db.prepare("SELECT COUNT(*) AS c FROM certifications WHERE deleted_at IS NULL AND status = 'earned' AND strftime('%Y-%m', issue_date) = ?").get(month) as { c: number }).c

  const labs_completed = checkTableExists(db, 'home_labs')
    ? (db.prepare("SELECT COUNT(*) AS c FROM home_labs WHERE deleted_at IS NULL AND status = 'completed' AND strftime('%Y-%m', completed_at) = ?").get(month) as { c: number }).c
    : 0

  const questions_reviewed = checkTableExists(db, 'interview_questions')
    ? (db.prepare("SELECT COUNT(*) AS c FROM interview_questions WHERE deleted_at IS NULL AND strftime('%Y-%m', last_reviewed_at) = ?").get(month) as { c: number }).c
    : 0

  const questions_mastered = checkTableExists(db, 'interview_questions')
    ? (db.prepare("SELECT COUNT(*) AS c FROM interview_questions WHERE deleted_at IS NULL AND mastery_score >= 4 AND strftime('%Y-%m', updated_at) = ?").get(month) as { c: number }).c
    : 0

  void nextMonth
  return { month, study_minutes, lab_minutes, skills_added, skills_mastered, labs_completed, certs_earned, questions_reviewed, questions_mastered, projects_completed }
}

// ── Private helpers ──────────────────────────────────────────────────────────

function checkTableExists(db: Database, tableName: string): boolean {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(tableName)
  return !!row
}

function buildWeeklyActivity(db: Database, hasStudy: boolean, hasLabs: boolean, weeks: number): WeeklyActivity[] {
  const result: WeeklyActivity[] = []
  const now = new Date()

  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - d.getDay() - i * 7)
    const weekStart = d.toISOString().slice(0, 10)
    const weekEnd = new Date(d.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const study_minutes = hasStudy
      ? (db.prepare("SELECT COALESCE(SUM(duration_minutes), 0) AS m FROM study_sessions WHERE session_date >= ? AND session_date < ?").get(weekStart, weekEnd) as { m: number }).m
      : 0

    const lab_minutes = hasLabs
      ? (db.prepare("SELECT COALESCE(SUM(duration_min), 0) AS m FROM home_lab_time_entries WHERE logged_date >= ? AND logged_date < ?").get(weekStart, weekEnd) as { m: number }).m
      : 0

    const skills_added = (db.prepare("SELECT COUNT(*) AS c FROM skills WHERE deleted_at IS NULL AND DATE(created_at) >= ? AND DATE(created_at) < ?").get(weekStart, weekEnd) as { c: number }).c

    const questions_reviewed = checkTableExists(db, 'interview_questions')
      ? (db.prepare("SELECT COUNT(*) AS c FROM interview_questions WHERE deleted_at IS NULL AND DATE(last_reviewed_at) >= ? AND DATE(last_reviewed_at) < ?").get(weekStart, weekEnd) as { c: number }).c
      : 0

    result.push({ week_start: weekStart, study_minutes, lab_minutes, skills_added, questions_reviewed })
  }
  return result
}

function buildMonthlyActivity(db: Database, hasStudy: boolean, hasLabs: boolean, hasInterviewQ: boolean, months: number): MonthlyActivity[] {
  const result: MonthlyActivity[] = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = d.toISOString().slice(0, 7)

    const study_minutes = hasStudy
      ? (db.prepare("SELECT COALESCE(SUM(duration_minutes), 0) AS m FROM study_sessions WHERE strftime('%Y-%m', session_date) = ?").get(month) as { m: number }).m
      : 0

    const lab_minutes = hasLabs
      ? (db.prepare("SELECT COALESCE(SUM(duration_min), 0) AS m FROM home_lab_time_entries WHERE strftime('%Y-%m', logged_date) = ?").get(month) as { m: number }).m
      : 0

    const skills_added = (db.prepare("SELECT COUNT(*) AS c FROM skills WHERE deleted_at IS NULL AND strftime('%Y-%m', created_at) = ?").get(month) as { c: number }).c
    const labs_completed = hasLabs
      ? (db.prepare("SELECT COUNT(*) AS c FROM home_labs WHERE deleted_at IS NULL AND status = 'completed' AND strftime('%Y-%m', completed_at) = ?").get(month) as { c: number }).c
      : 0
    const certs_earned = (db.prepare("SELECT COUNT(*) AS c FROM certifications WHERE deleted_at IS NULL AND status = 'earned' AND strftime('%Y-%m', issue_date) = ?").get(month) as { c: number }).c
    const questions_mastered = hasInterviewQ
      ? (db.prepare("SELECT COUNT(*) AS c FROM interview_questions WHERE deleted_at IS NULL AND mastery_score >= 4 AND strftime('%Y-%m', updated_at) = ?").get(month) as { c: number }).c
      : 0

    result.push({ month, study_minutes, lab_minutes, skills_added, labs_completed, certs_earned, questions_mastered })
  }
  return result
}

function buildRecentActivity(db: Database, hasLabs: boolean, hasInterviewQ: boolean): RecentActivity[] {
  const items: RecentActivity[] = []

  const skills = db.prepare(
    "SELECT id, name AS title, status AS detail, updated_at AS occurred_at FROM skills WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 5",
  ).all() as Array<{ id: string; title: string; detail: string; occurred_at: string }>
  skills.forEach(s => items.push({ type: 'skill', ...s }))

  const certs = db.prepare(
    "SELECT id, name AS title, status AS detail, updated_at AS occurred_at FROM certifications WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 3",
  ).all() as Array<{ id: string; title: string; detail: string; occurred_at: string }>
  certs.forEach(c => items.push({ type: 'certification', ...c }))

  const projects = db.prepare(
    "SELECT id, title, status AS detail, updated_at AS occurred_at FROM projects WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 3",
  ).all() as Array<{ id: string; title: string; detail: string; occurred_at: string }>
  projects.forEach(p => items.push({ type: 'project', ...p }))

  if (hasLabs) {
    const labs = db.prepare(
      "SELECT id, title, status AS detail, updated_at AS occurred_at FROM home_labs WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 3",
    ).all() as Array<{ id: string; title: string; detail: string; occurred_at: string }>
    labs.forEach(l => items.push({ type: 'lab', ...l }))
  }

  if (hasInterviewQ) {
    const questions = db.prepare(
      "SELECT q.id, SUBSTR(q.question, 1, 80) AS title, CAST(q.mastery_score AS TEXT) AS detail, q.updated_at AS occurred_at FROM interview_questions q WHERE q.deleted_at IS NULL ORDER BY q.updated_at DESC LIMIT 3",
    ).all() as Array<{ id: string; title: string; detail: string; occurred_at: string }>
    questions.forEach(q => items.push({ type: 'interview_question', ...q }))
  }

  return items.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)).slice(0, 15)
}
