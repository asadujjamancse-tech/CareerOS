import { z } from 'zod'

export const whiteboardFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  board_type: z.enum(['free-drawing', 'mind-map', 'network', 'azure', 'active-directory', 'flowchart']),
  description: z.string().max(2000).nullable().optional(),
})

export type WhiteboardForm = z.infer<typeof whiteboardFormSchema>
