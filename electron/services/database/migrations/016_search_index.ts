export const version = '016_search_index'
export const name = '016_search_index'

export const sql = `
-- FTS for home_labs (not covered in 002_fts5_search)
CREATE VIRTUAL TABLE IF NOT EXISTS home_labs_fts USING fts5(
  title, description, notes, lessons_learned,
  content='home_labs', content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 1'
);

CREATE TRIGGER IF NOT EXISTS home_labs_fts_ai AFTER INSERT ON home_labs BEGIN
  INSERT INTO home_labs_fts(rowid, title, description, notes, lessons_learned)
  VALUES(new.rowid, new.title, COALESCE(new.description,''), COALESCE(new.notes,''), COALESCE(new.lessons_learned,''));
END;
CREATE TRIGGER IF NOT EXISTS home_labs_fts_ad AFTER DELETE ON home_labs BEGIN
  INSERT INTO home_labs_fts(home_labs_fts, rowid, title, description, notes, lessons_learned)
  VALUES('delete', old.rowid, old.title, COALESCE(old.description,''), COALESCE(old.notes,''), COALESCE(old.lessons_learned,''));
END;
CREATE TRIGGER IF NOT EXISTS home_labs_fts_au AFTER UPDATE ON home_labs BEGIN
  INSERT INTO home_labs_fts(home_labs_fts, rowid, title, description, notes, lessons_learned)
  VALUES('delete', old.rowid, old.title, COALESCE(old.description,''), COALESCE(old.notes,''), COALESCE(old.lessons_learned,''));
  INSERT INTO home_labs_fts(rowid, title, description, notes, lessons_learned)
  VALUES(new.rowid, new.title, COALESCE(new.description,''), COALESCE(new.notes,''), COALESCE(new.lessons_learned,''));
END;

-- FTS for interview_questions (not covered in 002_fts5_search)
CREATE VIRTUAL TABLE IF NOT EXISTS interview_questions_fts USING fts5(
  question, personal_answer, ideal_answer, notes,
  content='interview_questions', content_rowid='rowid',
  tokenize='unicode61 remove_diacritics 1'
);

CREATE TRIGGER IF NOT EXISTS interview_questions_fts_ai AFTER INSERT ON interview_questions BEGIN
  INSERT INTO interview_questions_fts(rowid, question, personal_answer, ideal_answer, notes)
  VALUES(new.rowid, new.question, COALESCE(new.personal_answer,''), COALESCE(new.ideal_answer,''), COALESCE(new.notes,''));
END;
CREATE TRIGGER IF NOT EXISTS interview_questions_fts_ad AFTER DELETE ON interview_questions BEGIN
  INSERT INTO interview_questions_fts(interview_questions_fts, rowid, question, personal_answer, ideal_answer, notes)
  VALUES('delete', old.rowid, old.question, COALESCE(old.personal_answer,''), COALESCE(old.ideal_answer,''), COALESCE(old.notes,''));
END;
CREATE TRIGGER IF NOT EXISTS interview_questions_fts_au AFTER UPDATE ON interview_questions BEGIN
  INSERT INTO interview_questions_fts(interview_questions_fts, rowid, question, personal_answer, ideal_answer, notes)
  VALUES('delete', old.rowid, old.question, COALESCE(old.personal_answer,''), COALESCE(old.ideal_answer,''), COALESCE(old.notes,''));
  INSERT INTO interview_questions_fts(rowid, question, personal_answer, ideal_answer, notes)
  VALUES(new.rowid, new.question, COALESCE(new.personal_answer,''), COALESCE(new.ideal_answer,''), COALESCE(new.notes,''));
END;

-- Search history (deduplicated by query text via UNIQUE constraint)
CREATE TABLE IF NOT EXISTS search_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  query        TEXT    NOT NULL UNIQUE,
  result_count INTEGER NOT NULL DEFAULT 0,
  searched_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_search_history_recent ON search_history(searched_at DESC);

-- Populate FTS tables from existing rows (safe even if tables are empty)
INSERT OR IGNORE INTO home_labs_fts(rowid, title, description, notes, lessons_learned)
  SELECT rowid, title, COALESCE(description,''), COALESCE(notes,''), COALESCE(lessons_learned,'')
  FROM home_labs WHERE deleted_at IS NULL;

INSERT OR IGNORE INTO interview_questions_fts(rowid, question, personal_answer, ideal_answer, notes)
  SELECT rowid, question, COALESCE(personal_answer,''), COALESCE(ideal_answer,''), COALESCE(notes,'')
  FROM interview_questions WHERE deleted_at IS NULL;
`
