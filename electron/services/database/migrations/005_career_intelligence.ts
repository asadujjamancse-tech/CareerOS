export const version = '005_career_intelligence'
export const name = '005_career_intelligence.sql'

export const sql = `
-- Career roadmaps (named career paths, e.g. "Azure Administrator", "System Administrator")
CREATE TABLE IF NOT EXISTS career_roadmaps (
  id               TEXT    NOT NULL PRIMARY KEY,
  title            TEXT    NOT NULL,
  description      TEXT,
  category         TEXT    NOT NULL DEFAULT 'it'
                   CHECK (category IN ('it','cloud','security','development','data','management','other')),
  seniority_level  TEXT    CHECK (seniority_level IN ('entry','junior','mid','senior','expert')),
  estimated_months INTEGER,
  is_active        INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  notes            TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_career_roadmaps_active   ON career_roadmaps (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_career_roadmaps_category ON career_roadmaps (category)  WHERE deleted_at IS NULL;

-- Skills required/recommended for a roadmap, with a target proficiency level
CREATE TABLE IF NOT EXISTS roadmap_skills (
  id           TEXT NOT NULL PRIMARY KEY,
  roadmap_id   TEXT NOT NULL REFERENCES career_roadmaps(id) ON DELETE CASCADE,
  skill_id     TEXT REFERENCES skills(id) ON DELETE SET NULL,
  skill_name   TEXT NOT NULL,
  target_level TEXT NOT NULL DEFAULT 'intermediate'
               CHECK (target_level IN ('beginner','intermediate','advanced','expert')),
  importance   TEXT NOT NULL DEFAULT 'important'
               CHECK (importance IN ('critical','important','nice-to-have')),
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_roadmap_skills_roadmap_id ON roadmap_skills (roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_skills_skill_id   ON roadmap_skills (skill_id);

-- Certifications recommended for a roadmap
CREATE TABLE IF NOT EXISTS roadmap_certifications (
  id               TEXT NOT NULL PRIMARY KEY,
  roadmap_id       TEXT NOT NULL REFERENCES career_roadmaps(id) ON DELETE CASCADE,
  certification_id TEXT REFERENCES certifications(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  issuer           TEXT,
  importance       TEXT NOT NULL DEFAULT 'important'
                   CHECK (importance IN ('critical','important','nice-to-have')),
  order_index      INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_roadmap_certifications_roadmap_id ON roadmap_certifications (roadmap_id);

-- Projects recommended for a roadmap
CREATE TABLE IF NOT EXISTS roadmap_projects (
  id          TEXT NOT NULL PRIMARY KEY,
  roadmap_id  TEXT NOT NULL REFERENCES career_roadmaps(id) ON DELETE CASCADE,
  project_id  TEXT REFERENCES projects(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  importance  TEXT NOT NULL DEFAULT 'important'
              CHECK (importance IN ('critical','important','nice-to-have')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_roadmap_projects_roadmap_id ON roadmap_projects (roadmap_id);

-- Ordered milestones within a roadmap
CREATE TABLE IF NOT EXISTS roadmap_milestones (
  id           TEXT    NOT NULL PRIMARY KEY,
  roadmap_id   TEXT    NOT NULL REFERENCES career_roadmaps(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  description  TEXT,
  target_date  TEXT,
  is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0,1)),
  completed_at TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_roadmap_id ON roadmap_milestones (roadmap_id);

-- Extended skill tracking (supplements the skills table; one row per skill)
CREATE TABLE IF NOT EXISTS skill_progress (
  skill_id          TEXT NOT NULL PRIMARY KEY REFERENCES skills(id) ON DELETE CASCADE,
  target_level      TEXT NOT NULL DEFAULT 'intermediate'
                    CHECK (target_level IN ('beginner','intermediate','advanced','expert')),
  confidence_score  INTEGER NOT NULL DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  last_studied_at   TEXT,
  weekly_goal_hours REAL NOT NULL DEFAULT 0,
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Individual study session log entries
CREATE TABLE IF NOT EXISTS study_sessions (
  id               TEXT    NOT NULL PRIMARY KEY,
  skill_id         TEXT    REFERENCES skills(id) ON DELETE SET NULL,
  title            TEXT    NOT NULL,
  notes            TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  session_date     TEXT    NOT NULL,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_study_sessions_skill_id     ON study_sessions (skill_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_session_date ON study_sessions (session_date);
`
