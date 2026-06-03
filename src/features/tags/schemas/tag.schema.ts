import { z } from 'zod'

export const TAG_PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#6B7280',
]

export const tagFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be under 50 characters'),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
})

export type TagFormValues = z.infer<typeof tagFormSchema>

export const tagFormDefaults: TagFormValues = {
  name: '',
  color_hex: '#6366F1',
}
