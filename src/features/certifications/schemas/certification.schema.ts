import { z } from 'zod'

export const certFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  issuer: z.string().min(1, 'Issuer is required').max(200),
  status: z.enum(['planned', 'in-progress', 'earned', 'expired', 'revoked']),
  description: z.string().max(2000).optional(),
  credential_id: z.string().max(200).optional(),
  credential_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  certificate_path: z.string().optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  score: z.coerce.number().min(0).max(100).nullable().optional(),
  passing_score: z.coerce.number().min(0).max(100).nullable().optional(),
  notes: z.string().max(5000).optional(),
  skill_ids: z.array(z.string()),
  tag_ids: z.array(z.string()),
})

export type CertFormValues = z.infer<typeof certFormSchema>

export const certFormDefaults: CertFormValues = {
  name: '', issuer: '', status: 'planned', description: '', credential_id: '',
  credential_url: '', certificate_path: '', issue_date: '', expiry_date: '',
  score: null, passing_score: null, notes: '', skill_ids: [], tag_ids: [],
}
