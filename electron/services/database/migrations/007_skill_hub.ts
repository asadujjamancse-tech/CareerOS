export const version = '007_skill_hub'
export const name = '007_skill_hub.sql'

export const sql = `
-- ── Skill Modules (per-skill learning roadmap) ───────────────────────────────

CREATE TABLE IF NOT EXISTS skill_modules (
  id           TEXT    NOT NULL PRIMARY KEY,
  skill_id     TEXT    NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  description  TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  is_complete  INTEGER NOT NULL DEFAULT 0 CHECK (is_complete IN (0,1)),
  hours_spent  REAL    NOT NULL DEFAULT 0,
  notes        TEXT,
  completed_at TEXT,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_skill_modules_skill_id ON skill_modules (skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_modules_order    ON skill_modules (skill_id, order_index);

CREATE TABLE IF NOT EXISTS skill_module_topics (
  id          TEXT    NOT NULL PRIMARY KEY,
  module_id   TEXT    NOT NULL REFERENCES skill_modules(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  is_complete INTEGER NOT NULL DEFAULT 0 CHECK (is_complete IN (0,1)),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_skill_module_topics_module_id ON skill_module_topics (module_id);

-- ── Skill Learning Resources ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skill_resources (
  id           TEXT    NOT NULL PRIMARY KEY,
  skill_id     TEXT    NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  provider     TEXT    NOT NULL DEFAULT 'other'
               CHECK (provider IN ('youtube','microsoft-learn','udemy','linkedin','pluralsight','blog','docs','pdf','other')),
  url          TEXT,
  difficulty   TEXT    NOT NULL DEFAULT 'beginner'
               CHECK (difficulty IN ('beginner','intermediate','advanced')),
  est_hours    REAL    NOT NULL DEFAULT 0,
  notes        TEXT,
  is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0,1)),
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_skill_resources_skill_id ON skill_resources (skill_id);

-- ── Experience Log ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skill_experience_log (
  id           TEXT NOT NULL PRIMARY KEY,
  skill_id     TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  date         TEXT NOT NULL DEFAULT (date('now')),
  task         TEXT NOT NULL,
  hours        REAL NOT NULL DEFAULT 0,
  what_learned TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_skill_experience_log_skill_id ON skill_experience_log (skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_experience_log_date     ON skill_experience_log (skill_id, date DESC);

-- ── Skill Quiz Questions & Attempts ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS skill_quiz_questions (
  id           TEXT    NOT NULL PRIMARY KEY,
  skill_id     TEXT    NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  question     TEXT    NOT NULL,
  type         TEXT    NOT NULL DEFAULT 'flashcard'
               CHECK (type IN ('flashcard','mcq','scenario')),
  answer       TEXT,
  options_json TEXT,
  explanation  TEXT,
  difficulty   TEXT    NOT NULL DEFAULT 'medium'
               CHECK (difficulty IN ('easy','medium','hard')),
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_skill_quiz_questions_skill_id ON skill_quiz_questions (skill_id);

CREATE TABLE IF NOT EXISTS skill_quiz_attempts (
  id           TEXT    NOT NULL PRIMARY KEY,
  skill_id     TEXT    NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  question_id  TEXT    REFERENCES skill_quiz_questions(id) ON DELETE SET NULL,
  is_correct   INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0,1)),
  time_taken_s INTEGER,
  attempt_date TEXT    NOT NULL DEFAULT (date('now')),
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_skill_quiz_attempts_skill_id    ON skill_quiz_attempts (skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_quiz_attempts_question_id ON skill_quiz_attempts (question_id);

-- ── Cross-entity Junction Tables ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_skills (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id   TEXT NOT NULL REFERENCES skills(id)   ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_project_skills_skill_id   ON project_skills (skill_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_project_id ON project_skills (project_id);

CREATE TABLE IF NOT EXISTS certification_skills (
  certification_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  skill_id         TEXT NOT NULL REFERENCES skills(id)          ON DELETE CASCADE,
  PRIMARY KEY (certification_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_certification_skills_skill_id          ON certification_skills (skill_id);
CREATE INDEX IF NOT EXISTS idx_certification_skills_certification_id  ON certification_skills (certification_id);

CREATE TABLE IF NOT EXISTS interview_question_skills (
  question_id TEXT NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
  skill_id    TEXT NOT NULL REFERENCES skills(id)              ON DELETE CASCADE,
  PRIMARY KEY (question_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_interview_question_skills_skill_id    ON interview_question_skills (skill_id);
CREATE INDEX IF NOT EXISTS idx_interview_question_skills_question_id ON interview_question_skills (question_id);
`
