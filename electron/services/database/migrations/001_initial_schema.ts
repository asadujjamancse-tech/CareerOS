export const version = '001_initial_schema'
export const name = '001_initial_schema.sql'

export const sql = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT NOT NULL PRIMARY KEY,
  name       TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS skill_categories (
  id          TEXT    NOT NULL PRIMARY KEY,
  name        TEXT    NOT NULL,
  description TEXT,
  color_hex   TEXT    NOT NULL DEFAULT '#6B7280',
  icon        TEXT,
  parent_id   TEXT    REFERENCES skill_categories(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_skill_categories_parent_id ON skill_categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_skill_categories_order     ON skill_categories (order_index);

CREATE TABLE IF NOT EXISTS skills (
  id                TEXT    NOT NULL PRIMARY KEY,
  name              TEXT    NOT NULL,
  slug              TEXT    NOT NULL UNIQUE,
  description       TEXT,
  category_id       TEXT    NOT NULL REFERENCES skill_categories(id) ON DELETE RESTRICT,
  proficiency_level TEXT    NOT NULL DEFAULT 'beginner'
                    CHECK (proficiency_level IN ('beginner','intermediate','advanced','expert')),
  status            TEXT    NOT NULL DEFAULT 'learning'
                    CHECK (status IN ('learning','practicing','proficient','mastered')),
  years_experience  REAL    NOT NULL DEFAULT 0.0,
  notes             TEXT,
  is_public         INTEGER NOT NULL DEFAULT 1 CHECK (is_public IN (0,1)),
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at        TEXT
);
CREATE INDEX IF NOT EXISTS idx_skills_category_id       ON skills (category_id)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_skills_status            ON skills (status)            WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_skills_proficiency_level ON skills (proficiency_level) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_skills_active            ON skills (created_at)        WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS occupations (
  id              TEXT NOT NULL PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT,
  industry        TEXT,
  seniority_level TEXT CHECK (seniority_level IN
                    ('junior','mid','senior','lead','principal','staff','director','vp','c-level')),
  status          TEXT NOT NULL DEFAULT 'aspirational'
                  CHECK (status IN ('aspirational','active','completed','archived')),
  target_date     TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_occupations_status ON occupations (status)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_occupations_active ON occupations (created_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS occupation_skills (
  id            TEXT    NOT NULL PRIMARY KEY,
  occupation_id TEXT    NOT NULL REFERENCES occupations(id) ON DELETE CASCADE,
  skill_id      TEXT    NOT NULL REFERENCES skills(id)      ON DELETE CASCADE,
  importance    TEXT    NOT NULL DEFAULT 'important'
                CHECK (importance IN ('critical','important','nice-to-have')),
  is_acquired   INTEGER NOT NULL DEFAULT 0 CHECK (is_acquired IN (0,1)),
  order_index   INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (occupation_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_occupation_skills_occupation_id ON occupation_skills (occupation_id);
CREATE INDEX IF NOT EXISTS idx_occupation_skills_skill_id      ON occupation_skills (skill_id);
CREATE INDEX IF NOT EXISTS idx_occupation_skills_importance    ON occupation_skills (importance);
CREATE INDEX IF NOT EXISTS idx_occupation_skills_acquired      ON occupation_skills (is_acquired);

CREATE TABLE IF NOT EXISTS projects (
  id               TEXT    NOT NULL PRIMARY KEY,
  title            TEXT    NOT NULL,
  slug             TEXT    NOT NULL UNIQUE,
  summary          TEXT,
  description      TEXT,
  status           TEXT    NOT NULL DEFAULT 'planning'
                   CHECK (status IN ('planning','active','completed','paused','abandoned')),
  type             TEXT    NOT NULL DEFAULT 'personal'
                   CHECK (type IN ('personal','professional','open-source','freelance','academic')),
  repo_url         TEXT,
  live_url         TEXT,
  cover_image_path TEXT,
  is_featured      INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1)),
  started_at       TEXT,
  completed_at     TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_projects_status     ON projects (status)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_type       ON projects (type)        WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_featured   ON projects (is_featured) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_started_at ON projects (started_at)  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS project_assets (
  id              TEXT    NOT NULL PRIMARY KEY,
  project_id      TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT    NOT NULL,
  description     TEXT,
  type            TEXT    NOT NULL DEFAULT 'document'
                  CHECK (type IN ('image','video','document','link','screenshot','demo','other')),
  file_path       TEXT,
  url             TEXT,
  mime_type       TEXT,
  file_size_bytes INTEGER,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_project_assets_project_id ON project_assets (project_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_type       ON project_assets (type);
CREATE INDEX IF NOT EXISTS idx_project_assets_order      ON project_assets (project_id, order_index);

CREATE TABLE IF NOT EXISTS project_skills (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id   TEXT NOT NULL REFERENCES skills(id)   ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (project_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_project_skills_project_id ON project_skills (project_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_skill_id   ON project_skills (skill_id);

CREATE TABLE IF NOT EXISTS certifications (
  id               TEXT    NOT NULL PRIMARY KEY,
  name             TEXT    NOT NULL,
  issuer           TEXT    NOT NULL,
  description      TEXT,
  status           TEXT    NOT NULL DEFAULT 'planned'
                   CHECK (status IN ('planned','in-progress','earned','expired','revoked')),
  credential_id    TEXT,
  credential_url   TEXT,
  certificate_path TEXT,
  issue_date       TEXT,
  expiry_date      TEXT,
  score            REAL,
  passing_score    REAL,
  notes            TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_certifications_status      ON certifications (status)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_certifications_expiry_date ON certifications (expiry_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_certifications_issuer      ON certifications (issuer)      WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS certification_skills (
  certification_id TEXT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
  skill_id         TEXT NOT NULL REFERENCES skills(id)         ON DELETE CASCADE,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (certification_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_certification_skills_certification_id ON certification_skills (certification_id);
CREATE INDEX IF NOT EXISTS idx_certification_skills_skill_id         ON certification_skills (skill_id);

CREATE TABLE IF NOT EXISTS videos (
  id               TEXT    NOT NULL PRIMARY KEY,
  title            TEXT    NOT NULL,
  description      TEXT,
  url              TEXT,
  local_path       TEXT,
  source           TEXT    NOT NULL DEFAULT 'other'
                   CHECK (source IN ('youtube','vimeo','udemy','coursera','pluralsight','local','other')),
  channel          TEXT,
  duration_seconds INTEGER,
  watch_status     TEXT    NOT NULL DEFAULT 'unwatched'
                   CHECK (watch_status IN ('unwatched','watching','completed','revisit')),
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  thumbnail_path   TEXT,
  published_at     TEXT,
  notes            TEXT,
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at       TEXT
);
CREATE INDEX IF NOT EXISTS idx_videos_watch_status ON videos (watch_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_videos_source       ON videos (source)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_videos_created_at   ON videos (created_at)   WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS video_skills (
  video_id   TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  skill_id   TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (video_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_video_skills_video_id ON video_skills (video_id);
CREATE INDEX IF NOT EXISTS idx_video_skills_skill_id ON video_skills (skill_id);

CREATE TABLE IF NOT EXISTS notes (
  id         TEXT    NOT NULL PRIMARY KEY,
  title      TEXT    NOT NULL,
  content    TEXT    NOT NULL DEFAULT '',
  type       TEXT    NOT NULL DEFAULT 'general'
             CHECK (type IN ('general','meeting','research','tutorial','reference','idea')),
  is_pinned  INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0,1)),
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notes_type       ON notes (type)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notes_pinned     ON notes (is_pinned)  WHERE deleted_at IS NULL AND is_pinned = 1;
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes (updated_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS documents (
  id                TEXT    NOT NULL PRIMARY KEY,
  title             TEXT    NOT NULL,
  description       TEXT,
  file_path         TEXT    NOT NULL,
  original_filename TEXT    NOT NULL,
  mime_type         TEXT,
  file_size_bytes   INTEGER,
  type              TEXT    NOT NULL DEFAULT 'other'
                    CHECK (type IN ('resume','cover-letter','certificate','report','template','reference','other')),
  version           TEXT    NOT NULL DEFAULT '1.0',
  notes             TEXT,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at        TEXT
);
CREATE INDEX IF NOT EXISTS idx_documents_type       ON documents (type)       WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents (created_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS journal_entries (
  id           TEXT    NOT NULL PRIMARY KEY,
  title        TEXT    NOT NULL,
  content      TEXT    NOT NULL DEFAULT '',
  entry_date   TEXT    NOT NULL,
  mood         TEXT    CHECK (mood IN ('great','good','neutral','bad','terrible')),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  category     TEXT    NOT NULL DEFAULT 'general'
               CHECK (category IN ('achievement','challenge','reflection','learning','goal','feedback','general')),
  is_private   INTEGER NOT NULL DEFAULT 0 CHECK (is_private IN (0,1)),
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_date ON journal_entries (entry_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_category   ON journal_entries (category)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_entries_mood       ON journal_entries (mood)       WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS tags (
  id         TEXT NOT NULL PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  color_hex  TEXT NOT NULL DEFAULT '#6B7280',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS entity_tags (
  tag_id      TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL
              CHECK (entity_type IN
                ('skill','occupation','project','certification','video','note','document','journal_entry')),
  entity_id   TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (tag_id, entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity ON entity_tags (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_tag_id ON entity_tags (tag_id);
`
