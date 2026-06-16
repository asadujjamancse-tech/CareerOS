import { z } from 'zod'

export const questionFormSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  question: z.string().min(1, 'Question is required').max(2000),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  personal_answer: z.string().max(10000).optional(),
  ideal_answer: z.string().max(10000).optional(),
  notes: z.string().max(5000).optional(),
  mastery_score: z.coerce.number().min(0).max(5),
})

export type QuestionFormValues = z.infer<typeof questionFormSchema>

export const questionFormDefaults: QuestionFormValues = {
  category_id: '',
  question: '',
  difficulty: 'medium',
  personal_answer: '',
  ideal_answer: '',
  notes: '',
  mastery_score: 0,
}

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export const categoryFormDefaults: CategoryFormValues = {
  name: '',
  description: '',
  color_hex: '#6B7280',
}
