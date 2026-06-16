import { useEffect, useState } from 'react'
import { History, RotateCcw, Trash2, Save, X } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { useMarkdownStore } from '../store/markdown.store'
import type { MarkdownVersion } from '../types/markdown.types'
import { cn } from '@shared/lib/utils'

interface VersionHistoryPanelProps {
  documentId: string
  onClose: () => void
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function VersionHistoryPanel({ documentId, onClose }: VersionHistoryPanelProps) {
  const { versions, versionsLoading, fetchVersions, saveSnapshot, restoreVersion, deleteVersion } =
    useMarkdownStore()
  const [labelInput, setLabelInput] = useState('')
  const [savingLabel, setSavingLabel] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [previewVersion, setPreviewVersion] = useState<MarkdownVersion | null>(null)

  useEffect(() => {
    void fetchVersions(documentId)
  }, [documentId, fetchVersions])

  const handleSaveSnapshot = async () => {
    setSavingLabel(true)
    await saveSnapshot(documentId, labelInput.trim() || undefined)
    setLabelInput('')
    setSavingLabel(false)
  }

  const handleRestore = async (versionId: string) => {
    setRestoring(versionId)
    await restoreVersion(documentId, versionId)
    setRestoring(null)
    onClose()
  }

  return (
    <div className="flex flex-col h-full border-l border-zinc-800 bg-zinc-950 w-72 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <History className="h-4 w-4 text-zinc-400" />
          Version History
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Save snapshot */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSaveSnapshot() }}
            placeholder="Version label (optional)"
            className="flex-1 min-w-0 rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void handleSaveSnapshot()}
            disabled={savingLabel}
            className="h-7 px-2 text-xs shrink-0"
          >
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Preview pane */}
      {previewVersion && (
        <div className="border-b border-zinc-800 bg-zinc-900 max-h-40 overflow-y-auto">
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Preview — v{previewVersion.version_number}</span>
            <button onClick={() => setPreviewVersion(null)} className="text-zinc-600 hover:text-zinc-400">
              <X className="h-3 w-3" />
            </button>
          </div>
          <pre className="px-3 pb-2 text-xs text-zinc-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
            {previewVersion.content.slice(0, 800)}{previewVersion.content.length > 800 ? '\n…' : ''}
          </pre>
        </div>
      )}

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {versionsLoading && (
          <div className="px-4 py-6 text-center text-xs text-zinc-600">Loading…</div>
        )}
        {!versionsLoading && versions.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-zinc-600">
            No saved versions yet.
          </div>
        )}
        {versions.map((ver) => (
          <div
            key={ver.id}
            className={cn(
              'group px-3 py-2.5 border-b border-zinc-800/60 hover:bg-zinc-800/40 cursor-pointer',
              previewVersion?.id === ver.id && 'bg-zinc-800/40',
            )}
            onClick={() => setPreviewVersion(previewVersion?.id === ver.id ? null : ver)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-300 truncate">
                  {ver.label ?? `Version ${ver.version_number}`}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">{formatRelative(ver.created_at)}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                <button
                  title="Restore this version"
                  onClick={(e) => { e.stopPropagation(); void handleRestore(ver.id) }}
                  disabled={restoring === ver.id}
                  className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  title="Delete this version"
                  onClick={(e) => { e.stopPropagation(); void deleteVersion(ver.id) }}
                  className="p-1 rounded hover:bg-red-900/40 text-zinc-600 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
