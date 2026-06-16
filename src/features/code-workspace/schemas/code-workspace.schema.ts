import { z } from 'zod'
import { CODE_LANGUAGES } from '../types/code-workspace.types'

export const createFileSchema = z.object({
  title: z.string().min(1, 'File name is required').max(200, 'File name too long'),
  language: z.enum(CODE_LANGUAGES as [string, ...string[]]).default('typescript'),
  content: z.string().optional().default(''),
  folder_id: z.string().nullable().optional(),
})

export const updateFileSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  language: z.enum(CODE_LANGUAGES as [string, ...string[]]).optional(),
  folder_id: z.string().nullable().optional(),
})

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name too long'),
  parent_id: z.string().nullable().optional(),
})

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parent_id: z.string().nullable().optional(),
})

export type CreateFileForm = z.infer<typeof createFileSchema>
export type CreateFolderForm = z.infer<typeof createFolderSchema>
