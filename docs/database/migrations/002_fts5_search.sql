-- CareerOS Migration 002: FTS5 Full-Text Search
-- Creates FTS5 content-table virtual tables and INSERT/UPDATE/DELETE sync
-- triggers for all content-bearing entity tables.
-- Version: 002_fts5_search

-- ── FTS5 Virtual Tables ───────────────────────

CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
  name,
  description,
  notes,
  content       = 'skills',
  content_rowid = 'rowid',
  tokenize      = 'unicode61 remove_diacritics 1'
);

CREATE VIRTUAL TABLE IF NOT EXISTS occupations_fts USING fts5(
  title,
  description,
  industry,
  notes,
  content       = 'occupations',
  content_rowid = 'rowid',
  tokenize      = 'unicode61 remove_diacritics 1'
);

CREATE VIRTUAL TABLE IF NOT EXISTS projects_fts USING fts5(
  title,
  summary,
  description,
  content       = 'projects',
  content_rowid = 'rowid',
  tokenize      = 'unicode61 remove_diacritics 1'
);

CREATE VIRTUAL TABLE IF NOT EXISTS certifications_fts USING fts5(
  name,
  issuer,
  description,
  notes,
  content       = 'certifications',
  content_rowid = 'rowid',
  tokenize      = 'unicode61 remove_diacritics 1'
);

CREATE VIRTUAL TABLE IF NOT EXISTS videos_fts USING fts5(
  title,
  description,
  channel,
  notes,
  content       = 'videos',
  content_rowid = 'rowid',
  tokenize      = 'unicode61 remove_diacritics 1'
);

CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  title,
  content,
  content       = 'notes',
  content_rowid = 'rowid',
  tokenize      = 'unicode61 remove_diacritics 1'
);

CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  title,
  description,
  notes,
  content       = 'documents',
  content_rowid = 'rowid',
  tokenize      = 'unicode61 remove_diacritics 1'
);

CREATE VIRTUAL TABLE IF NOT EXISTS journal_entries_fts USING fts5(
  title,
  content,
  content       = 'journal_entries',
  content_rowid = 'rowid',
  tokenize      = 'unicode61 remove_diacritics 1'
);

-- ── skills sync triggers ──────────────────────

CREATE TRIGGER IF NOT EXISTS skills_fts_ai
AFTER INSERT ON skills BEGIN
  INSERT INTO skills_fts (rowid, name, description, notes)
  VALUES (new.rowid, new.name, new.description, new.notes);
END;

CREATE TRIGGER IF NOT EXISTS skills_fts_ad
AFTER DELETE ON skills BEGIN
  INSERT INTO skills_fts (skills_fts, rowid, name, description, notes)
  VALUES ('delete', old.rowid, old.name, old.description, old.notes);
END;

CREATE TRIGGER IF NOT EXISTS skills_fts_au
AFTER UPDATE ON skills BEGIN
  INSERT INTO skills_fts (skills_fts, rowid, name, description, notes)
  VALUES ('delete', old.rowid, old.name, old.description, old.notes);
  INSERT INTO skills_fts (rowid, name, description, notes)
  VALUES (new.rowid, new.name, new.description, new.notes);
END;

-- ── occupations sync triggers ─────────────────

CREATE TRIGGER IF NOT EXISTS occupations_fts_ai
AFTER INSERT ON occupations BEGIN
  INSERT INTO occupations_fts (rowid, title, description, industry, notes)
  VALUES (new.rowid, new.title, new.description, new.industry, new.notes);
END;

CREATE TRIGGER IF NOT EXISTS occupations_fts_ad
AFTER DELETE ON occupations BEGIN
  INSERT INTO occupations_fts (occupations_fts, rowid, title, description, industry, notes)
  VALUES ('delete', old.rowid, old.title, old.description, old.industry, old.notes);
END;

CREATE TRIGGER IF NOT EXISTS occupations_fts_au
AFTER UPDATE ON occupations BEGIN
  INSERT INTO occupations_fts (occupations_fts, rowid, title, description, industry, notes)
  VALUES ('delete', old.rowid, old.title, old.description, old.industry, old.notes);
  INSERT INTO occupations_fts (rowid, title, description, industry, notes)
  VALUES (new.rowid, new.title, new.description, new.industry, new.notes);
END;

-- ── projects sync triggers ────────────────────

CREATE TRIGGER IF NOT EXISTS projects_fts_ai
AFTER INSERT ON projects BEGIN
  INSERT INTO projects_fts (rowid, title, summary, description)
  VALUES (new.rowid, new.title, new.summary, new.description);
END;

CREATE TRIGGER IF NOT EXISTS projects_fts_ad
AFTER DELETE ON projects BEGIN
  INSERT INTO projects_fts (projects_fts, rowid, title, summary, description)
  VALUES ('delete', old.rowid, old.title, old.summary, old.description);
END;

CREATE TRIGGER IF NOT EXISTS projects_fts_au
AFTER UPDATE ON projects BEGIN
  INSERT INTO projects_fts (projects_fts, rowid, title, summary, description)
  VALUES ('delete', old.rowid, old.title, old.summary, old.description);
  INSERT INTO projects_fts (rowid, title, summary, description)
  VALUES (new.rowid, new.title, new.summary, new.description);
END;

-- ── certifications sync triggers ──────────────

CREATE TRIGGER IF NOT EXISTS certifications_fts_ai
AFTER INSERT ON certifications BEGIN
  INSERT INTO certifications_fts (rowid, name, issuer, description, notes)
  VALUES (new.rowid, new.name, new.issuer, new.description, new.notes);
END;

CREATE TRIGGER IF NOT EXISTS certifications_fts_ad
AFTER DELETE ON certifications BEGIN
  INSERT INTO certifications_fts (certifications_fts, rowid, name, issuer, description, notes)
  VALUES ('delete', old.rowid, old.name, old.issuer, old.description, old.notes);
END;

CREATE TRIGGER IF NOT EXISTS certifications_fts_au
AFTER UPDATE ON certifications BEGIN
  INSERT INTO certifications_fts (certifications_fts, rowid, name, issuer, description, notes)
  VALUES ('delete', old.rowid, old.name, old.issuer, old.description, old.notes);
  INSERT INTO certifications_fts (rowid, name, issuer, description, notes)
  VALUES (new.rowid, new.name, new.issuer, new.description, new.notes);
END;

-- ── videos sync triggers ──────────────────────

CREATE TRIGGER IF NOT EXISTS videos_fts_ai
AFTER INSERT ON videos BEGIN
  INSERT INTO videos_fts (rowid, title, description, channel, notes)
  VALUES (new.rowid, new.title, new.description, new.channel, new.notes);
END;

CREATE TRIGGER IF NOT EXISTS videos_fts_ad
AFTER DELETE ON videos BEGIN
  INSERT INTO videos_fts (videos_fts, rowid, title, description, channel, notes)
  VALUES ('delete', old.rowid, old.title, old.description, old.channel, old.notes);
END;

CREATE TRIGGER IF NOT EXISTS videos_fts_au
AFTER UPDATE ON videos BEGIN
  INSERT INTO videos_fts (videos_fts, rowid, title, description, channel, notes)
  VALUES ('delete', old.rowid, old.title, old.description, old.channel, old.notes);
  INSERT INTO videos_fts (rowid, title, description, channel, notes)
  VALUES (new.rowid, new.title, new.description, new.channel, new.notes);
END;

-- ── notes sync triggers ───────────────────────

CREATE TRIGGER IF NOT EXISTS notes_fts_ai
AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts (rowid, title, content)
  VALUES (new.rowid, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS notes_fts_ad
AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts (notes_fts, rowid, title, content)
  VALUES ('delete', old.rowid, old.title, old.content);
END;

CREATE TRIGGER IF NOT EXISTS notes_fts_au
AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts (notes_fts, rowid, title, content)
  VALUES ('delete', old.rowid, old.title, old.content);
  INSERT INTO notes_fts (rowid, title, content)
  VALUES (new.rowid, new.title, new.content);
END;

-- ── documents sync triggers ───────────────────

CREATE TRIGGER IF NOT EXISTS documents_fts_ai
AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts (rowid, title, description, notes)
  VALUES (new.rowid, new.title, new.description, new.notes);
END;

CREATE TRIGGER IF NOT EXISTS documents_fts_ad
AFTER DELETE ON documents BEGIN
  INSERT INTO documents_fts (documents_fts, rowid, title, description, notes)
  VALUES ('delete', old.rowid, old.title, old.description, old.notes);
END;

CREATE TRIGGER IF NOT EXISTS documents_fts_au
AFTER UPDATE ON documents BEGIN
  INSERT INTO documents_fts (documents_fts, rowid, title, description, notes)
  VALUES ('delete', old.rowid, old.title, old.description, old.notes);
  INSERT INTO documents_fts (rowid, title, description, notes)
  VALUES (new.rowid, new.title, new.description, new.notes);
END;

-- ── journal_entries sync triggers ─────────────

CREATE TRIGGER IF NOT EXISTS journal_entries_fts_ai
AFTER INSERT ON journal_entries BEGIN
  INSERT INTO journal_entries_fts (rowid, title, content)
  VALUES (new.rowid, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS journal_entries_fts_ad
AFTER DELETE ON journal_entries BEGIN
  INSERT INTO journal_entries_fts (journal_entries_fts, rowid, title, content)
  VALUES ('delete', old.rowid, old.title, old.content);
END;

CREATE TRIGGER IF NOT EXISTS journal_entries_fts_au
AFTER UPDATE ON journal_entries BEGIN
  INSERT INTO journal_entries_fts (journal_entries_fts, rowid, title, content)
  VALUES ('delete', old.rowid, old.title, old.content);
  INSERT INTO journal_entries_fts (rowid, title, content)
  VALUES (new.rowid, new.title, new.content);
END;
