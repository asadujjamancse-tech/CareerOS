export const version = '009_learning_coach'
export const name = '009_learning_coach.sql'

export const sql = `
-- ── Learning Paths ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS learning_paths (
  id                      TEXT    NOT NULL PRIMARY KEY,
  title                   TEXT    NOT NULL,
  career_goal             TEXT    NOT NULL,
  description             TEXT,
  category                TEXT    NOT NULL DEFAULT 'it-support'
                          CHECK (category IN ('it-support','msp','sysadmin','azure-admin','cloud-support','cyber-security','custom')),
  seniority_level         TEXT    NOT NULL DEFAULT 'entry'
                          CHECK (seniority_level IN ('entry','junior','mid','senior','lead')),
  estimated_weeks         INTEGER NOT NULL DEFAULT 12,
  available_hours_per_week INTEGER NOT NULL DEFAULT 10,
  is_active               INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  notes                   TEXT,
  created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at              TEXT
);
CREATE INDEX IF NOT EXISTS idx_learning_paths_active   ON learning_paths (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_learning_paths_category ON learning_paths (category) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS learning_path_skills (
  id                  TEXT    NOT NULL PRIMARY KEY,
  path_id             TEXT    NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  skill_id            TEXT    REFERENCES skills(id) ON DELETE SET NULL,
  skill_name          TEXT    NOT NULL,
  order_index         INTEGER NOT NULL DEFAULT 0,
  why_it_matters      TEXT,
  prerequisites_json  TEXT,
  estimated_hours     REAL    NOT NULL DEFAULT 5,
  target_level        TEXT    NOT NULL DEFAULT 'intermediate'
                      CHECK (target_level IN ('beginner','intermediate','advanced','expert')),
  is_unlocked         INTEGER NOT NULL DEFAULT 0 CHECK (is_unlocked IN (0,1)),
  created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_lp_skills_path    ON learning_path_skills (path_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lp_skills_skill   ON learning_path_skills (skill_id);

-- ── Skill Method Configurations ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skill_method_configs (
  id                 TEXT    NOT NULL PRIMARY KEY,
  skill_id           TEXT    NOT NULL UNIQUE REFERENCES skills(id) ON DELETE CASCADE,
  home_lab_pct       INTEGER NOT NULL DEFAULT 0  CHECK (home_lab_pct BETWEEN 0 AND 100),
  notes_pct          INTEGER NOT NULL DEFAULT 0  CHECK (notes_pct BETWEEN 0 AND 100),
  videos_pct         INTEGER NOT NULL DEFAULT 0  CHECK (videos_pct BETWEEN 0 AND 100),
  active_recall_pct  INTEGER NOT NULL DEFAULT 0  CHECK (active_recall_pct BETWEEN 0 AND 100),
  flashcards_pct     INTEGER NOT NULL DEFAULT 0  CHECK (flashcards_pct BETWEEN 0 AND 100),
  interview_pct      INTEGER NOT NULL DEFAULT 0  CHECK (interview_pct BETWEEN 0 AND 100),
  projects_pct       INTEGER NOT NULL DEFAULT 0  CHECK (projects_pct BETWEEN 0 AND 100),
  rationale          TEXT,
  is_custom          INTEGER NOT NULL DEFAULT 0 CHECK (is_custom IN (0,1)),
  created_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ── Spaced Repetition / Retention System ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS retention_records (
  id               TEXT    NOT NULL PRIMARY KEY,
  skill_id         TEXT    NOT NULL UNIQUE REFERENCES skills(id) ON DELETE CASCADE,
  ease_factor      REAL    NOT NULL DEFAULT 2.5,
  interval_days    INTEGER NOT NULL DEFAULT 1,
  repetitions      INTEGER NOT NULL DEFAULT 0,
  next_review_at   TEXT    NOT NULL DEFAULT (date('now', '+1 day')),
  last_reviewed_at TEXT,
  retention_score  INTEGER NOT NULL DEFAULT 0 CHECK (retention_score BETWEEN 0 AND 100),
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_retention_next_review ON retention_records (next_review_at);

CREATE TABLE IF NOT EXISTS review_logs (
  id               TEXT    NOT NULL PRIMARY KEY,
  skill_id         TEXT    NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  quality          INTEGER NOT NULL CHECK (quality BETWEEN 0 AND 5),
  ease_factor_after REAL   NOT NULL,
  interval_after   INTEGER NOT NULL,
  notes            TEXT,
  reviewed_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_review_logs_skill      ON review_logs (skill_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed   ON review_logs (reviewed_at DESC);

-- ── Study Plans ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_plans (
  id                       TEXT    NOT NULL PRIMARY KEY,
  title                    TEXT    NOT NULL,
  career_goal              TEXT    NOT NULL,
  plan_type                TEXT    NOT NULL DEFAULT 'weekly'
                           CHECK (plan_type IN ('daily','weekly','monthly')),
  start_date               TEXT    NOT NULL DEFAULT (date('now')),
  end_date                 TEXT,
  available_hours_per_week INTEGER NOT NULL DEFAULT 10,
  is_active                INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  notes                    TEXT,
  created_at               TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at               TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at               TEXT
);
CREATE INDEX IF NOT EXISTS idx_study_plans_active ON study_plans (is_active) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS study_plan_items (
  id                  TEXT    NOT NULL PRIMARY KEY,
  plan_id             TEXT    NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  skill_id            TEXT    REFERENCES skills(id) ON DELETE SET NULL,
  skill_name          TEXT    NOT NULL,
  action              TEXT    NOT NULL,
  method              TEXT    NOT NULL DEFAULT 'notes'
                      CHECK (method IN ('home-lab','notes','videos','active-recall','flashcards','interview-questions','projects')),
  estimated_minutes   INTEGER NOT NULL DEFAULT 30,
  day_of_plan         INTEGER NOT NULL DEFAULT 1,
  order_index         INTEGER NOT NULL DEFAULT 0,
  is_done             INTEGER NOT NULL DEFAULT 0 CHECK (is_done IN (0,1)),
  done_at             TEXT,
  created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_study_plan_items_plan ON study_plan_items (plan_id, day_of_plan, order_index);

-- ── Skill Dependencies ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skill_dependencies (
  skill_id             TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  prerequisite_id      TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  strength             TEXT NOT NULL DEFAULT 'required'
                       CHECK (strength IN ('required','recommended','optional')),
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (skill_id, prerequisite_id)
);
CREATE INDEX IF NOT EXISTS idx_skill_deps_prereq ON skill_dependencies (prerequisite_id);
`
