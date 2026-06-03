import { z } from 'zod'

export const projectFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title must be under 150 characters'),
  summary: z.string().max(500, 'Summary must be under 500 characters').optional(),
  description: z.string().max(10000, 'Description must be under 10,000 characters').optional(),
  status: z.enum(['planning', 'active', 'completed', 'paused', 'abandoned']),
  type: z.enum(['personal', 'professional', 'open-source', 'freelance', 'academic']),
  repo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  live_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  is_featured: z.boolean(),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  skill_ids: z.array(z.string()),
  tag_ids: z.array(z.string()),
  lessons_learned: z.string().max(10000, 'Must be under 10,000 characters').optional(),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>

export const projectFormDefaults: ProjectFormValues = {
  title: '',
  summary: '',
  description: '',
  status: 'planning',
  type: 'personal',
  repo_url: '',
  live_url: '',
  is_featured: false,
  started_at: '',
  completed_at: '',
  skill_ids: [],
  tag_ids: [],
  lessons_learned: '',
}
