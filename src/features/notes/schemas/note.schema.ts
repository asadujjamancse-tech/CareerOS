import { z } from 'zod'

export const noteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().max(50000, 'Content too long'),
  type: z.enum(['general', 'meeting', 'research', 'tutorial', 'reference', 'idea']),
  is_pinned: z.boolean(),
  tag_ids: z.array(z.string()),
})

export type NoteFormValues = z.infer<typeof noteFormSchema>

export const noteFormDefaults: NoteFormValues = {
  title: '', content: '', type: 'general', is_pinned: false, tag_ids: [],
}
