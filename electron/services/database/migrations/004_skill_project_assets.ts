export const version = '004_skill_project_assets'
export const name = '004_skill_project_assets.sql'

export const sql = `
-- Explicit file attachments for skills (documents linked directly to a skill)
CREATE TABLE IF NOT EXISTS skill_documents (
  skill_id    TEXT NOT NULL REFERENCES skills(id)    ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (skill_id, document_id)
);
CREATE INDEX IF NOT EXISTS idx_skill_documents_skill_id    ON skill_documents (skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_documents_document_id ON skill_documents (document_id);

-- Inline screenshots / attachments stored directly under a project
-- (project_assets already exists from migration 001; this migration adds nothing for projects)
-- Adding indexes for project queries not in migration 001
CREATE INDEX IF NOT EXISTS idx_projects_completed_at ON projects (completed_at) WHERE deleted_at IS NULL;
`
