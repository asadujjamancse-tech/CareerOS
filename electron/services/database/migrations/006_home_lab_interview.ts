export const version = '006_home_lab_interview'
export const name = '006_home_lab_interview.sql'

export const sql = `
-- ── Home Labs ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS home_labs (
  id              TEXT    NOT NULL PRIMARY KEY,
  title           TEXT    NOT NULL,
  slug            TEXT    NOT NULL UNIQUE,
  description     TEXT,
  status          TEXT    NOT NULL DEFAULT 'planned'
                  CHECK (status IN ('planned','in-progress','completed','paused','abandoned')),
  notes           TEXT,
  lessons_learned TEXT,
  completion_pct  INTEGER NOT NULL DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  started_at      TEXT,
  completed_at    TEXT,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_home_labs_status ON home_labs (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_home_labs_active ON home_labs (created_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS home_lab_tasks (
  id          TEXT    NOT NULL PRIMARY KEY,
  lab_id      TEXT    NOT NULL REFERENCES home_labs(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  is_done     INTEGER NOT NULL DEFAULT 0 CHECK (is_done IN (0,1)),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_home_lab_tasks_lab_id ON home_lab_tasks (lab_id);

CREATE TABLE IF NOT EXISTS home_lab_problems (
  id          TEXT NOT NULL PRIMARY KEY,
  lab_id      TEXT NOT NULL REFERENCES home_labs(id) ON DELETE CASCADE,
  problem     TEXT NOT NULL,
  solution    TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_home_lab_problems_lab_id ON home_lab_problems (lab_id);

CREATE TABLE IF NOT EXISTS home_lab_time_entries (
  id           TEXT    NOT NULL PRIMARY KEY,
  lab_id       TEXT    NOT NULL REFERENCES home_labs(id) ON DELETE CASCADE,
  duration_min INTEGER NOT NULL DEFAULT 0,
  note         TEXT,
  logged_date  TEXT    NOT NULL DEFAULT (date('now')),
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_home_lab_time_lab_id ON home_lab_time_entries (lab_id);

CREATE TABLE IF NOT EXISTS home_lab_assets (
  id          TEXT    NOT NULL PRIMARY KEY,
  lab_id      TEXT    NOT NULL REFERENCES home_labs(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  type        TEXT    NOT NULL DEFAULT 'screenshot'
              CHECK (type IN ('screenshot','document','link','other')),
  file_path   TEXT,
  url         TEXT,
  notes       TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_home_lab_assets_lab_id ON home_lab_assets (lab_id);

CREATE TABLE IF NOT EXISTS home_lab_skills (
  lab_id    TEXT NOT NULL REFERENCES home_labs(id)   ON DELETE CASCADE,
  skill_id  TEXT NOT NULL REFERENCES skills(id)       ON DELETE CASCADE,
  PRIMARY KEY (lab_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_home_lab_skills_skill_id ON home_lab_skills (skill_id);

CREATE TABLE IF NOT EXISTS home_lab_certifications (
  lab_id           TEXT NOT NULL REFERENCES home_labs(id)          ON DELETE CASCADE,
  certification_id TEXT NOT NULL REFERENCES certifications(id)     ON DELETE CASCADE,
  PRIMARY KEY (lab_id, certification_id)
);
CREATE INDEX IF NOT EXISTS idx_home_lab_certs_cert_id ON home_lab_certifications (certification_id);

-- ── Interview Questions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS interview_categories (
  id          TEXT    NOT NULL PRIMARY KEY,
  name        TEXT    NOT NULL UNIQUE,
  description TEXT,
  color_hex   TEXT    NOT NULL DEFAULT '#6B7280',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_interview_categories_order ON interview_categories (order_index);

CREATE TABLE IF NOT EXISTS interview_questions (
  id               TEXT    NOT NULL PRIMARY KEY,
  category_id      TEXT    NOT NULL REFERENCES interview_categories(id) ON DELETE RESTRICT,
  question         TEXT    NOT NULL,
  difficulty       TEXT    NOT NULL DEFAULT 'medium'
                   CHECK (difficulty IN ('easy','medium','hard')),
  personal_answer  TEXT,
  ideal_answer     TEXT,
  notes            TEXT,
  mastery_score    INTEGER NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 5),
  last_reviewed_at TEXT,
  review_count     INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_interview_questions_category ON interview_questions (category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_interview_questions_difficulty ON interview_questions (difficulty) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_interview_questions_mastery ON interview_questions (mastery_score) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_interview_questions_active ON interview_questions (created_at) WHERE deleted_at IS NULL;

-- Seed default interview categories
INSERT OR IGNORE INTO interview_categories (id, name, description, color_hex, order_index) VALUES
  ('ic_behavioral',   'Behavioral',        'STAR method questions about past experience', '#3B82F6', 1),
  ('ic_technical',    'Technical',         'Language and technology deep-dives',          '#10B981', 2),
  ('ic_system',       'System Design',     'Architecture and scalability questions',      '#8B5CF6', 3),
  ('ic_problem',      'Problem Solving',   'Coding challenges and algorithms',            '#F59E0B', 4),
  ('ic_cultural',     'Culture Fit',       'Values, teamwork, and motivation questions',  '#EC4899', 5),
  ('ic_situational',  'Situational',       'Hypothetical scenario questions',             '#06B6D4', 6),
  ('ic_leadership',   'Leadership',        'Management and influence questions',          '#F97316', 7),
  ('ic_career',       'Career Goals',      'Ambitions, growth, and trajectory questions', '#84CC16', 8);
`
