export const version = '008_learning_system'
export const name = '008_learning_system.sql'

export const sql = `
-- ── Spaced Repetition System (SM-2 Algorithm) ───────────────────────────────

CREATE TABLE IF NOT EXISTS srs_cards (
  id              TEXT    NOT NULL PRIMARY KEY,
  entity_type     TEXT    NOT NULL
                  CHECK (entity_type IN ('note','interview_question','skill','document','scenario','custom')),
  entity_id       TEXT    NOT NULL,
  front           TEXT    NOT NULL,
  back            TEXT    NOT NULL,
  interval_days   INTEGER NOT NULL DEFAULT 1,
  ease_factor     REAL    NOT NULL DEFAULT 2.5,
  repetitions     INTEGER NOT NULL DEFAULT 0,
  due_date        TEXT    NOT NULL DEFAULT (date('now')),
  last_review_at  TEXT,
  retention_score REAL    NOT NULL DEFAULT 0.0,
  is_suspended    INTEGER NOT NULL DEFAULT 0 CHECK (is_suspended IN (0,1)),
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_srs_cards_due ON srs_cards (due_date) WHERE is_suspended = 0;
CREATE INDEX IF NOT EXISTS idx_srs_cards_entity ON srs_cards (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS srs_reviews (
  id          TEXT    NOT NULL PRIMARY KEY,
  card_id     TEXT    NOT NULL REFERENCES srs_cards(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 0 AND 5),
  time_spent_ms INTEGER NOT NULL DEFAULT 0,
  reviewed_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_srs_reviews_card ON srs_reviews (card_id);
CREATE INDEX IF NOT EXISTS idx_srs_reviews_date ON srs_reviews (reviewed_at);

-- ── Document Annotations (highlights, notes, bookmarks for PDF/DOCX/TXT) ────

CREATE TABLE IF NOT EXISTS document_annotations (
  id              TEXT    NOT NULL PRIMARY KEY,
  document_id     TEXT    NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  type            TEXT    NOT NULL DEFAULT 'highlight'
                  CHECK (type IN ('highlight','note','bookmark','comment')),
  color_hex       TEXT    NOT NULL DEFAULT '#FBBF24',
  color_meaning   TEXT,
  page_number     INTEGER,
  position_json   TEXT    NOT NULL DEFAULT '{}',
  selected_text   TEXT,
  content         TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_doc_annotations_doc ON document_annotations (document_id);
CREATE INDEX IF NOT EXISTS idx_doc_annotations_type ON document_annotations (type);
CREATE INDEX IF NOT EXISTS idx_doc_annotations_page ON document_annotations (document_id, page_number);

-- Reading progress tracking
CREATE TABLE IF NOT EXISTS document_reading_progress (
  document_id       TEXT    NOT NULL PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  current_page      INTEGER NOT NULL DEFAULT 1,
  total_pages       INTEGER,
  scroll_position   REAL    NOT NULL DEFAULT 0.0,
  reading_time_min  INTEGER NOT NULL DEFAULT 0,
  completed         INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
  last_read_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  first_opened_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ── Knowledge Color System ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_colors (
  id          TEXT    NOT NULL PRIMARY KEY,
  color_hex   TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  meaning     TEXT    NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_system   INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0,1)),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Seed default knowledge colors
INSERT OR IGNORE INTO knowledge_colors (id, color_hex, name, meaning, description, order_index, is_system) VALUES
  ('kc_red',    '#EF4444', 'Red',    'Critical',          'Must know — exam critical, blocker knowledge', 1, 1),
  ('kc_orange', '#F97316', 'Orange', 'Need Revision',     'Shaky on this — revisit and strengthen',       2, 1),
  ('kc_yellow', '#EAB308', 'Yellow', 'Important',         'Important concept worth remembering',          3, 1),
  ('kc_blue',   '#3B82F6', 'Blue',   'Useful',            'Good to know, useful reference',               4, 1),
  ('kc_green',  '#22C55E', 'Green',  'Mastered',          'Fully understood and can explain confidently', 5, 1),
  ('kc_purple', '#A855F7', 'Purple', 'Interview Question','Likely interview question — practice this',    6, 1);

-- ── Feynman Learning Entries ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feynman_entries (
  id                TEXT    NOT NULL PRIMARY KEY,
  topic             TEXT    NOT NULL,
  entity_type       TEXT,
  entity_id         TEXT,
  explanation       TEXT    NOT NULL,
  gaps_identified   TEXT,
  revised_explanation TEXT,
  understanding_score INTEGER NOT NULL DEFAULT 0 CHECK (understanding_score BETWEEN 0 AND 10),
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_feynman_entity ON feynman_entries (entity_type, entity_id);

-- ── Learning Scenarios ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS learning_scenarios (
  id              TEXT    NOT NULL PRIMARY KEY,
  title           TEXT    NOT NULL,
  description     TEXT,
  category        TEXT    NOT NULL DEFAULT 'it-support'
                  CHECK (category IN ('it-support','msp','cloud','interview','troubleshooting','custom')),
  difficulty      TEXT    NOT NULL DEFAULT 'medium'
                  CHECK (difficulty IN ('beginner','medium','advanced','expert')),
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  context_story   TEXT    NOT NULL,
  success_criteria TEXT   NOT NULL,
  hints           TEXT,
  solution        TEXT,
  tags            TEXT    NOT NULL DEFAULT '[]',
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_scenarios_category ON learning_scenarios (category) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_scenarios_difficulty ON learning_scenarios (difficulty) WHERE is_active = 1;

CREATE TABLE IF NOT EXISTS scenario_steps (
  id            TEXT    NOT NULL PRIMARY KEY,
  scenario_id   TEXT    NOT NULL REFERENCES learning_scenarios(id) ON DELETE CASCADE,
  step_number   INTEGER NOT NULL,
  title         TEXT    NOT NULL,
  instruction   TEXT    NOT NULL,
  expected_action TEXT,
  hint          TEXT,
  is_checkpoint INTEGER NOT NULL DEFAULT 0 CHECK (is_checkpoint IN (0,1)),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_scenario_steps_scenario ON scenario_steps (scenario_id, step_number);

CREATE TABLE IF NOT EXISTS scenario_attempts (
  id              TEXT    NOT NULL PRIMARY KEY,
  scenario_id     TEXT    NOT NULL REFERENCES learning_scenarios(id) ON DELETE CASCADE,
  status          TEXT    NOT NULL DEFAULT 'in-progress'
                  CHECK (status IN ('in-progress','completed','abandoned')),
  steps_completed INTEGER NOT NULL DEFAULT 0,
  total_steps     INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,
  lessons_learned TEXT,
  time_spent_min  INTEGER NOT NULL DEFAULT 0,
  score           INTEGER CHECK (score BETWEEN 0 AND 100),
  started_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_scenario_attempts_scenario ON scenario_attempts (scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_attempts_status ON scenario_attempts (status);

-- ── Challenge System ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS challenges (
  id              TEXT    NOT NULL PRIMARY KEY,
  title           TEXT    NOT NULL,
  description     TEXT    NOT NULL,
  type            TEXT    NOT NULL DEFAULT 'daily'
                  CHECK (type IN ('daily','weekly','lab','project','custom')),
  difficulty      TEXT    NOT NULL DEFAULT 'medium'
                  CHECK (difficulty IN ('easy','medium','hard','expert')),
  category        TEXT,
  xp_reward       INTEGER NOT NULL DEFAULT 50,
  target_count    INTEGER NOT NULL DEFAULT 1,
  linked_entity_type TEXT,
  linked_entity_id   TEXT,
  challenge_date  TEXT    NOT NULL DEFAULT (date('now')),
  expires_at      TEXT,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_challenges_date ON challenges (challenge_date, type);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges (type);

CREATE TABLE IF NOT EXISTS challenge_completions (
  id            TEXT    NOT NULL PRIMARY KEY,
  challenge_id  TEXT    NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  status        TEXT    NOT NULL DEFAULT 'in-progress'
                CHECK (status IN ('in-progress','completed','failed')),
  progress      INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  completed_at  TEXT,
  started_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge ON challenge_completions (challenge_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_completions_unique ON challenge_completions (challenge_id);

-- ── Knowledge Vault Items (enhanced documents with richer metadata) ──────────

-- Add new columns to existing documents table (safe IF NOT EXISTS approach)
-- We handle this gracefully since SQLite doesn't support ADD COLUMN IF NOT EXISTS
-- The columns are added with a unique approach

CREATE TABLE IF NOT EXISTS vault_metadata (
  document_id       TEXT NOT NULL PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  source_url        TEXT,
  source_type       TEXT NOT NULL DEFAULT 'local'
                    CHECK (source_type IN ('local','youtube','website','ms-learn','github','custom')),
  thumbnail_path    TEXT,
  language          TEXT NOT NULL DEFAULT 'en',
  author            TEXT,
  publisher         TEXT,
  published_date    TEXT,
  topic_category    TEXT,
  difficulty        TEXT CHECK (difficulty IN ('beginner','intermediate','advanced','expert')),
  reading_time_est  INTEGER,
  key_takeaways     TEXT NOT NULL DEFAULT '[]',
  related_skills    TEXT NOT NULL DEFAULT '[]',
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_vault_metadata_source_type ON vault_metadata (source_type);
CREATE INDEX IF NOT EXISTS idx_vault_metadata_category ON vault_metadata (topic_category);

-- Seed starter scenarios for IT learning
INSERT OR IGNORE INTO learning_scenarios (id, title, description, category, difficulty, estimated_minutes, context_story, success_criteria, hints, solution, tags) VALUES
  (
    'scn_001',
    'Helpdesk: User Cannot Access Shared Drive',
    'A classic MSP L1 support scenario about network drive connectivity.',
    'it-support',
    'beginner',
    20,
    'You receive a ticket: "Hi IT, I cannot access the Z: drive anymore. It was working yesterday. I am on Windows 10. Please help!" The user works in Accounts Payable and needs access urgently.',
    'Diagnose and resolve the shared drive access issue. Document your troubleshooting steps.',
    '["Check if the user is connected to VPN or the office network","Verify the drive mapping with net use command","Check Active Directory group membership","Test with UNC path directly","Review Event Viewer for access denied errors"]',
    'Root cause is usually: 1) VPN not connected, 2) Expired password causing auth failure, 3) Removed from security group, 4) Drive mapping lost after profile issue. Resolution: reconnect VPN or verify credentials, re-map drive, check group membership in AD.',
    '["Active Directory","Windows 10","Shared Drives","MSP","L1 Support"]'
  ),
  (
    'scn_002',
    'Azure AD: User Cannot Sign In to Microsoft 365',
    'Troubleshoot a Microsoft 365 / Azure AD sign-in failure.',
    'cloud',
    'medium',
    25,
    'Urgent ticket from Sales Director: "I cannot sign into Outlook or Teams. It says my account is locked. I have an important client call in 30 minutes!" You have Global Admin access to Azure AD and Microsoft 365 Admin Centre.',
    'Unlock the account, identify why it locked, and put preventive measures in place.',
    '["Check the Azure AD sign-in logs for the user","Look for MFA failures or risky sign-ins","Check if Smart Lockout triggered","Verify the UPN matches their email","Check Conditional Access policies","Confirm password has not expired"]',
    'Steps: 1) Azure AD > Users > find user > Authentication methods - check for locked state. 2) Sign-in logs > failures. 3) If Smart Lockout: wait or use Reset Password. 4) Check for MFA registration issues. 5) Review Conditional Access > what policy blocked them. 6) Enable Self-Service Password Reset to prevent recurrence.',
    '["Azure AD","Microsoft 365","Identity","MFA","Conditional Access","Cloud"]'
  ),
  (
    'scn_003',
    'Interview Simulation: Explain BGP to a Non-Technical Manager',
    'Practice the Feynman technique by explaining a complex networking concept simply.',
    'interview',
    'medium',
    15,
    'In a technical interview, the hiring manager says: "I am not very technical. Can you explain what BGP is and why it matters to our business? We rely on it for our WAN connectivity." They are a project manager evaluating your communication skills.',
    'Explain BGP clearly without jargon, using an analogy. Show you understand the business impact.',
    '["Use a postal/GPS analogy for routing","Focus on business outcomes not technical details","Mention reliability and redundancy","Avoid acronym soup"]',
    'Ideal answer: BGP is like a sophisticated GPS for the internet. While your home router knows local streets, BGP is the system that knows every road on earth and picks the best path for your data. For our business, BGP means: 1) If one internet connection fails, traffic automatically reroutes (resilience). 2) We can balance traffic across multiple providers (performance). 3) We control how our data travels (security). It is the protocol that keeps the global internet working.',
    '["Networking","BGP","Communication","Interview","Feynman"]'
  );
`
