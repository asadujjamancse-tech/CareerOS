import { z } from 'zod'

export const journalFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().max(50000),
  entry_date: z.string().min(1, 'Date is required'),
  mood: z.enum(['great', 'good', 'neutral', 'bad', 'terrible']).nullable().optional(),
  energy_level: z.coerce.number().min(1).max(5).nullable().optional(),
  category: z.enum(['achievement', 'challenge', 'reflection', 'learning', 'goal', 'feedback', 'general']),
  is_private: z.boolean(),
  tag_ids: z.array(z.string()),
})

export type JournalFormValues = z.infer<typeof journalFormSchema>

export const journalFormDefaults: JournalFormValues = {
  title: '', content: '', entry_date: new Date().toISOString().slice(0, 10),
  mood: null, energy_level: null, category: 'general', is_private: false, tag_ids: [],
}
