import { z } from 'zod'

export const playlistFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(2000).optional(),
  source: z.enum(['youtube', 'custom']),
  source_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  skill_id: z.string().optional().or(z.literal('')),
})

export type PlaylistFormValues = z.infer<typeof playlistFormSchema>

export const playlistFormDefaults: PlaylistFormValues = {
  title: '',
  description: '',
  source: 'custom',
  source_url: '',
  skill_id: '',
}

export const playlistItemFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  source: z.string().min(1),
  duration_seconds: z.coerce.number().int().min(0).nullable().optional(),
})

export type PlaylistItemFormValues = z.infer<typeof playlistItemFormSchema>

export const playlistItemFormDefaults: PlaylistItemFormValues = {
  title: '',
  url: '',
  source: 'youtube',
  duration_seconds: null,
}
