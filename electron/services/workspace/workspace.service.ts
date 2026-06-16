import type { Database } from 'better-sqlite3'

export function getWorkspaceState(db: Database): string {
  const row = db.prepare('SELECT state_json FROM workspace_state WHERE id = ?').get('singleton') as
    | { state_json: string }
    | undefined
  return row?.state_json ?? '{}'
}

export function saveWorkspaceState(db: Database, stateJson: string): void {
  db.prepare(`
    INSERT INTO workspace_state (id, state_json, updated_at)
    VALUES ('singleton', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    ON CONFLICT(id) DO UPDATE SET
      state_json = excluded.state_json,
      updated_at = excluded.updated_at
  `).run(stateJson)
}
