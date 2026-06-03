import { z } from 'zod'

export const videoFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(2000).optional(),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  source: z.enum(['youtube', 'vimeo', 'udemy', 'coursera', 'pluralsight', 'local', 'other']),
  channel: z.string().max(200).optional(),
  watch_status: z.enum(['unwatched', 'watching', 'completed', 'revisit']),
  duration_seconds: z.coerce.number().int().min(0).nullable().optional(),
  notes: z.string().max(5000).optional(),
  skill_ids: z.array(z.string()),
  tag_ids: z.array(z.string()),
})

export type VideoFormValues = z.infer<typeof videoFormSchema>

export const videoFormDefaults: VideoFormValues = {
  title: '',
  description: '',
  url: '',
  source: 'youtube',
  channel: '',
  watch_status: 'unwatched',
  duration_seconds: null,
  notes: '',
  skill_ids: [],
  tag_ids: [],
}
