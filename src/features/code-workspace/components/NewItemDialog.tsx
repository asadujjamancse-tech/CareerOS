import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileCode, FolderPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Label } from '@shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { createFileSchema, createFolderSchema, type CreateFileForm, type CreateFolderForm } from '../schemas/code-workspace.schema'
import { CODE_LANGUAGES, LANGUAGE_LABELS, type CodeLanguage } from '../types/code-workspace.types'

// ── New File Dialog ───────────────────────────────────────────────────────────

interface NewFileDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateFileForm) => Promise<void>
  defaultFolderId?: string | null
}

export function NewFileDialog({ open, onClose, onSubmit, defaultFolderId }: NewFileDialogProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateFileForm>({
    resolver: zodResolver(createFileSchema),
    defaultValues: { title: '', language: 'typescript', content: '', folder_id: defaultFolderId ?? null },
  })

  useEffect(() => {
    if (open) {
      reset({ title: '', language: 'typescript', content: '', folder_id: defaultFolderId ?? null })
    }
  }, [open, defaultFolderId, reset])

  const language = watch('language') as CodeLanguage

  const handleSubmitForm = handleSubmit(async (data) => {
    await onSubmit(data)
    onClose()
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-blue-400" />
            New File
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmitForm} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="file-title">File Name</Label>
            <Input
              id="file-title"
              placeholder="main.ts"
              autoFocus
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Language</Label>
            <Select value={language} onValueChange={(v) => setValue('language', v as CodeLanguage)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CODE_LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create File'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── New Folder Dialog ─────────────────────────────────────────────────────────

interface NewFolderDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateFolderForm) => Promise<void>
  defaultParentId?: string | null
}

export function NewFolderDialog({ open, onClose, onSubmit, defaultParentId }: NewFolderDialogProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateFolderForm>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: { name: '', parent_id: defaultParentId ?? null },
  })

  useEffect(() => {
    if (open) reset({ name: '', parent_id: defaultParentId ?? null })
  }, [open, defaultParentId, reset])

  const handleSubmitForm = handleSubmit(async (data) => {
    await onSubmit(data)
    onClose()
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-amber-400" />
            New Folder
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmitForm} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="src"
              autoFocus
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Rename Dialog ─────────────────────────────────────────────────────────────

interface RenameDialogProps {
  open: boolean
  currentName: string
  itemType: 'file' | 'folder'
  onClose: () => void
  onSubmit: (newName: string) => Promise<void>
}

export function RenameDialog({ open, currentName, itemType, onClose, onSubmit }: RenameDialogProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<{ name: string }>({
    defaultValues: { name: currentName },
  })

  useEffect(() => {
    if (open) reset({ name: currentName })
  }, [open, currentName, reset])

  const handleSubmitForm = handleSubmit(async ({ name }) => {
    if (name.trim() && name.trim() !== currentName) {
      await onSubmit(name.trim())
    }
    onClose()
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename {itemType === 'file' ? 'File' : 'Folder'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmitForm} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="rename-input">New Name</Label>
            <Input
              id="rename-input"
              autoFocus
              {...register('name', { required: 'Name is required', minLength: 1 })}
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>Rename</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
