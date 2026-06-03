import { z } from 'zod'

export const occupationFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be under 200 characters'),
  industry: z.string().max(100, 'Industry must be under 100 characters').optional(),
  seniority_level: z
    .enum(['junior', 'mid', 'senior', 'lead', 'principal', 'staff', 'director', 'vp', 'c-level'])
    .nullable()
    .optional(),
  status: z.enum(['aspirational', 'active', 'completed', 'archived'], {
    errorMap: () => ({ message: 'Select a status' }),
  }),
  target_date: z.string().optional(),
  description: z.string().max(5000, 'Description must be under 5000 characters').optional(),
  notes: z.string().max(5000, 'Notes must be under 5000 characters').optional(),
  skill_entries: z.array(
    z.object({
      skill_id: z.string(),
      importance: z.enum(['critical', 'important', 'nice-to-have']),
    }),
  ),
  tag_ids: z.array(z.string()),
})

export type OccupationFormValues = z.infer<typeof occupationFormSchema>

export const occupationFormDefaults: OccupationFormValues = {
  title: '',
  industry: '',
  seniority_level: null,
  status: 'aspirational',
  target_date: '',
  description: '',
  notes: '',
  skill_entries: [],
  tag_ids: [],
}
