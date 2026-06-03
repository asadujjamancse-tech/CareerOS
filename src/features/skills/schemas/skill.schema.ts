import { z } from 'zod'

export const skillFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be under 100 characters'),
  category_id: z.string().min(1, 'Category is required'),
  description: z.string().max(2000, 'Description must be under 2000 characters').optional(),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert'], {
    errorMap: () => ({ message: 'Select a proficiency level' }),
  }),
  status: z.enum(['learning', 'practicing', 'proficient', 'mastered'], {
    errorMap: () => ({ message: 'Select a status' }),
  }),
  years_experience: z.coerce
    .number()
    .min(0, 'Cannot be negative')
    .max(50, 'Maximum 50 years'),
  notes: z.string().max(5000, 'Notes must be under 5000 characters').optional(),
  is_public: z.boolean(),
  tag_ids: z.array(z.string()),
})

export type SkillFormValues = z.infer<typeof skillFormSchema>

export const skillFormDefaults: SkillFormValues = {
  name: '',
  category_id: '',
  description: '',
  proficiency_level: 'beginner',
  status: 'learning',
  years_experience: 0,
  notes: '',
  is_public: true,
  tag_ids: [],
}
