import { z } from 'zod'

export const homeLabFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(5000).optional(),
  status: z.enum(['planned', 'in-progress', 'completed', 'paused', 'abandoned']),
  notes: z.string().max(10000).optional(),
  lessons_learned: z.string().max(10000).optional(),
  completion_pct: z.coerce.number().min(0).max(100),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  skill_ids: z.array(z.string()),
  certification_ids: z.array(z.string()),
})

export type HomeLabFormValues = z.infer<typeof homeLabFormSchema>

export const homeLabFormDefaults: HomeLabFormValues = {
  title: '',
  description: '',
  status: 'planned',
  notes: '',
  lessons_learned: '',
  completion_pct: 0,
  started_at: '',
  completed_at: '',
  skill_ids: [],
  certification_ids: [],
}
