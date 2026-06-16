import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { whiteboardFormSchema, type WhiteboardForm } from '../schemas/whiteboard.schema'
import { BOARD_TYPE_LABELS, type BoardType } from '../types/whiteboard.types'
import type { WhiteboardSummary } from '../types/whiteboard.types'

const BOARD_TYPES: BoardType[] = [
  'free-drawing', 'mind-map', 'network', 'azure', 'active-directory', 'flowchart',
]

interface Props {
  onSubmit: (data: WhiteboardForm) => Promise<void>
  onCancel: () => void
  initial?: WhiteboardSummary
}

export function WhiteboardForm({ onSubmit, onCancel, initial }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<WhiteboardForm>({
    resolver: zodResolver(whiteboardFormSchema),
    defaultValues: {
      title: initial?.title ?? '',
      board_type: initial?.board_type ?? 'free-drawing',
      description: initial?.description ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Title *</label>
        <input
          {...register('title')}
          autoFocus
          placeholder="My Whiteboard"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
        />
        {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">Diagram Type</label>
        <select
          {...register('board_type')}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
        >
          {BOARD_TYPES.map(t => (
            <option key={t} value={t}>{BOARD_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-1">Description</label>
        <textarea
          {...register('description')}
          placeholder="Optional description…"
          rows={2}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-md bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : initial ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  )
}
