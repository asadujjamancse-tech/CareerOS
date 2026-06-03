import { z } from 'zod'

export const documentFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(2000).optional(),
  type: z.enum(['resume', 'cover-letter', 'certificate', 'report', 'template', 'reference', 'other']),
  version: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  tag_ids: z.array(z.string()),
  file_path: z.string().optional(),
  original_filename: z.string().optional(),
  mime_type: z.string().nullable().optional(),
  file_size_bytes: z.number().nullable().optional(),
})

export type DocumentFormValues = z.infer<typeof documentFormSchema>

export const documentFormDefaults: DocumentFormValues = {
  title: '',
  description: '',
  type: 'other',
  version: '1.0',
  notes: '',
  tag_ids: [],
  file_path: '',
  original_filename: '',
  mime_type: null,
  file_size_bytes: null,
}
