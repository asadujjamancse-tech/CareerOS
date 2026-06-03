import type { Database } from 'better-sqlite3'
import { nanoid } from 'nanoid'

export interface CertificationRow {
  id: string
  name: string
  issuer: string
  description: string | null
  status: string
  credential_id: string | null
  credential_url: string | null
  certificate_path: string | null
  issue_date: string | null
  expiry_date: string | null
  score: number | null
  passing_score: number | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CertificationWithMeta extends CertificationRow {
  skill_count: number
  tag_count: number
  days_until_expiry: number | null
}

export interface SkillRefRow {
  id: string; name: string; category_name: string; category_color: string; proficiency_level: string
}
export interface TagRow { id: string; name: string; slug: string; color_hex: string; created_at: string; updated_at: string }

export interface CertificationDetail extends CertificationWithMeta {
  skills: SkillRefRow[]
  tags: TagRow[]
}

export interface PaginatedCertifications {
  items: CertificationWithMeta[]
  total: number; page: number; pageSize: number; totalPages: number
}

export interface GetAllCertsParams {
  search?: string | undefined
  status?: string | undefined
  page?: number | undefined
  pageSize?: number | undefined
}

export interface CreateCertificationParams {
  name: string
  issuer: string
  description?: string | null
  status?: string
  credential_id?: string | null
  credential_url?: string | null
  certificate_path?: string | null
  issue_date?: string | null
  expiry_date?: string | null
  score?: number | null
  passing_score?: number | null
  notes?: string | null
  skill_ids?: string[]
  tag_ids?: string[]
}

export type UpdateCertificationParams = Partial<CreateCertificationParams>

function buildFtsQuery(s: string): string {
  return s.trim().split(/\s+/).filter(Boolean).map(w => `"${w.replace(/"/g, '')}"*`).join(' ')
}
function nowIso(): string { return new Date().toISOString() }

const CERT_SELECT = `
  c.id, c.name, c.issuer, c.description, c.status, c.credential_id, c.credential_url,
  c.certificate_path, c.issue_date, c.expiry_date, c.score, c.passing_score, c.notes,
  c.created_at, c.updated_at, c.deleted_at,
  (SELECT COUNT(*) FROM certification_skills WHERE certification_id = c.id) AS skill_count,
  (SELECT COUNT(*) FROM entity_tags WHERE entity_type = 'certification' AND entity_id = c.id) AS tag_count,
  CASE WHEN c.expiry_date IS NOT NULL
    THEN CAST((julianday(c.expiry_date) - julianday('now')) AS INTEGER)
    ELSE NULL END AS days_until_expiry
`

export function getAllCertifications(db: Database, params: GetAllCertsParams): PaginatedCertifications {
  const { search, status, page = 1, pageSize = 24 } = params
  const offset = (page - 1) * pageSize

  if (search?.trim()) return searchCertsFts(db, { search, status, page, pageSize })

  const bind: Record<string, string | number | null> = { status: status ?? null, limit: pageSize, offset }
  const WHERE = `WHERE c.deleted_at IS NULL AND (c.status = :status OR :status IS NULL)`
  const total = (db.prepare(`SELECT COUNT(*) AS total FROM certifications c ${WHERE}`).get(bind) as { total: number }).total
  const items = db.prepare(`SELECT ${CERT_SELECT} FROM certifications c ${WHERE} ORDER BY c.updated_at DESC LIMIT :limit OFFSET :offset`).all(bind) as CertificationWithMeta[]
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

function searchCertsFts(db: Database, params: GetAllCertsParams & { search: string; page: number; pageSize: number }): PaginatedCertifications {
  const { search, status, page, pageSize } = params
  const ftsQuery = buildFtsQuery(search)
  const offset = (page - 1) * pageSize
  const cond: string[] = ['c.deleted_at IS NULL']
  const extra: Record<string, string | null> = {}
  if (status) { cond.push('c.status = :status'); extra['status'] = status }
  const extraWhere = cond.length ? 'AND ' + cond.join(' AND ') : ''
  const bind = { fts: ftsQuery, ...extra, limit: pageSize, offset }
  const total = (db.prepare(`SELECT COUNT(*) AS total FROM certifications_fts JOIN certifications c ON c.rowid = certifications_fts.rowid WHERE certifications_fts MATCH :fts ${extraWhere}`).get(bind) as { total: number }).total
  const items = db.prepare(`SELECT ${CERT_SELECT} FROM certifications_fts JOIN certifications c ON c.rowid = certifications_fts.rowid WHERE certifications_fts MATCH :fts ${extraWhere} ORDER BY rank LIMIT :limit OFFSET :offset`).all(bind) as CertificationWithMeta[]
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export function getCertificationById(db: Database, id: string): CertificationDetail | null {
  const cert = db.prepare(`SELECT ${CERT_SELECT} FROM certifications c WHERE c.id = ? AND c.deleted_at IS NULL`).get(id) as CertificationWithMeta | undefined
  if (!cert) return null
  const skills = db.prepare(`SELECT s.id, s.name, sc.name AS category_name, sc.color_hex AS category_color, s.proficiency_level FROM skills s JOIN skill_categories sc ON sc.id = s.category_id JOIN certification_skills cs ON cs.skill_id = s.id WHERE cs.certification_id = ? AND s.deleted_at IS NULL ORDER BY s.name`).all(id) as SkillRefRow[]
  const tags = db.prepare(`SELECT t.* FROM tags t JOIN entity_tags et ON et.tag_id = t.id WHERE et.entity_type = 'certification' AND et.entity_id = ? ORDER BY t.name`).all(id) as TagRow[]
  return { ...cert, skills, tags }
}

export function createCertification(db: Database, params: CreateCertificationParams): CertificationRow {
  const id = nanoid(); const now = nowIso()
  db.transaction(() => {
    db.prepare(`INSERT INTO certifications (id, name, issuer, description, status, credential_id, credential_url, certificate_path, issue_date, expiry_date, score, passing_score, notes, created_at, updated_at) VALUES (:id,:name,:issuer,:description,:status,:credential_id,:credential_url,:certificate_path,:issue_date,:expiry_date,:score,:passing_score,:notes,:now,:now)`)
      .run({ id, name: params.name, issuer: params.issuer, description: params.description ?? null, status: params.status ?? 'planned', credential_id: params.credential_id ?? null, credential_url: params.credential_url ?? null, certificate_path: params.certificate_path ?? null, issue_date: params.issue_date ?? null, expiry_date: params.expiry_date ?? null, score: params.score ?? null, passing_score: params.passing_score ?? null, notes: params.notes ?? null, now })
    if (params.skill_ids?.length) syncSkills(db, id, params.skill_ids)
    if (params.tag_ids?.length) syncTags(db, id, params.tag_ids)
  })()
  return db.prepare('SELECT * FROM certifications WHERE id = ?').get(id) as CertificationRow
}

export function updateCertification(db: Database, id: string, params: UpdateCertificationParams): CertificationRow | null {
  const existing = db.prepare('SELECT * FROM certifications WHERE id = ? AND deleted_at IS NULL').get(id) as CertificationRow | undefined
  if (!existing) return null
  db.transaction(() => {
    db.prepare(`UPDATE certifications SET name=COALESCE(:name,name), issuer=COALESCE(:issuer,issuer), description=COALESCE(:description,description), status=COALESCE(:status,status), credential_id=COALESCE(:credential_id,credential_id), credential_url=COALESCE(:credential_url,credential_url), certificate_path=COALESCE(:certificate_path,certificate_path), issue_date=COALESCE(:issue_date,issue_date), expiry_date=COALESCE(:expiry_date,expiry_date), score=COALESCE(:score,score), passing_score=COALESCE(:passing_score,passing_score), notes=COALESCE(:notes,notes), updated_at=:now WHERE id=:id AND deleted_at IS NULL`)
      .run({ id, name: params.name ?? null, issuer: params.issuer ?? null, description: params.description ?? null, status: params.status ?? null, credential_id: params.credential_id ?? null, credential_url: params.credential_url ?? null, certificate_path: params.certificate_path ?? null, issue_date: params.issue_date ?? null, expiry_date: params.expiry_date ?? null, score: params.score ?? null, passing_score: params.passing_score ?? null, notes: params.notes ?? null, now: nowIso() })
    if (params.skill_ids !== undefined) syncSkills(db, id, params.skill_ids)
    if (params.tag_ids !== undefined) syncTags(db, id, params.tag_ids)
  })()
  return db.prepare('SELECT * FROM certifications WHERE id = ?').get(id) as CertificationRow
}

export function softDeleteCertification(db: Database, id: string): boolean {
  return (db.prepare('UPDATE certifications SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL').run(nowIso(), id)).changes > 0
}

function syncSkills(db: Database, certId: string, skillIds: string[]): void {
  db.prepare('DELETE FROM certification_skills WHERE certification_id = ?').run(certId)
  const ins = db.prepare('INSERT OR IGNORE INTO certification_skills (certification_id, skill_id) VALUES (?, ?)')
  for (const s of skillIds) ins.run(certId, s)
}

function syncTags(db: Database, entityId: string, tagIds: string[]): void {
  db.prepare(`DELETE FROM entity_tags WHERE entity_type = 'certification' AND entity_id = ?`).run(entityId)
  const ins = db.prepare(`INSERT OR IGNORE INTO entity_tags (tag_id, entity_type, entity_id) VALUES (?, 'certification', ?)`)
  for (const t of tagIds) ins.run(t, entityId)
}
