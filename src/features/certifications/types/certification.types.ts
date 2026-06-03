import type { BaseEntity } from '@shared/types/common.types'

export type CertificationStatus = 'planned' | 'in-progress' | 'earned' | 'expired' | 'revoked'

export interface Certification extends BaseEntity {
  name: string; issuer: string; description: string | null; status: CertificationStatus
  credential_id: string | null; credential_url: string | null; certificate_path: string | null
  issue_date: string | null; expiry_date: string | null; score: number | null
  passing_score: number | null; notes: string | null
}

export interface CertificationWithMeta extends Certification {
  skill_count: number; tag_count: number; days_until_expiry: number | null
}

export interface SkillRef {
  id: string; name: string; category_name: string; category_color: string; proficiency_level: string
}
export interface Tag { id: string; name: string; slug: string; color_hex: string; created_at: string; updated_at: string }
export interface CertificationDetail extends CertificationWithMeta { skills: SkillRef[]; tags: Tag[] }

export interface CertificationFilters {
  search: string; status: CertificationStatus | ''
}

export interface PaginatedCertifications {
  items: CertificationWithMeta[]; total: number; page: number; pageSize: number; totalPages: number
}
