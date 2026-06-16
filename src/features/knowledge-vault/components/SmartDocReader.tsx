import { useRef, useState, useCallback, useEffect } from 'react'
import {
  Highlighter, MessageSquare, Bookmark, X, Save,
} from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Textarea } from '@shared/components/ui/textarea'
import { Badge } from '@shared/components/ui/badge'
import { useVaultStore } from '../store/vault.store'
import type { VaultAnnotation } from '../types/vault.types'
import { cn } from '@shared/lib/utils'
import { PageLoader } from '@shared/components/common/LoadingSpinner'

const HIGHLIGHT_COLORS = [
  { hex: '#EF4444', name: 'Critical', label: 'Red' },
  { hex: '#F97316', name: 'Need Revision', label: 'Orange' },
  { hex: '#EAB308', name: 'Important', label: 'Yellow' },
  { hex: '#3B82F6', name: 'Useful', label: 'Blue' },
  { hex: '#22C55E', name: 'Mastered', label: 'Green' },
  { hex: '#A855F7', name: 'Interview Q', label: 'Purple' },
]

interface StoredHighlight {
  id: string
  startOffset: number
  endOffset: number
  text: string
  colorHex: string
  meaning: string | null
  note: string | null
}

function NoteEditor({ ann, onSave, onClose }: { ann: VaultAnnotation; onSave: (text: string) => void; onClose: () => void }) {
  const [text, setText] = useState(ann.content ?? '')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-5 w-80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Annotation Note</h3>
          <button type="button" onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        {ann.selected_text && (
          <blockquote className="text-xs italic text-muted-foreground border-l-2 pl-2" style={{ borderColor: ann.color_hex }}>
            &quot;{ann.selected_text.slice(0, 100)}&quot;
          </blockquote>
        )}
        <Textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Add your note here…" className="text-xs" />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => { onSave(text); onClose() }} className="gap-1">
            <Save className="h-3.5 w-3.5" />Save
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SmartDocReader() {
  const { docContent, docContentLoading, annotations, createAnnotation, updateAnnotation, deleteAnnotation } = useVaultStore()
  const contentRef = useRef<HTMLDivElement>(null)
  const [selectedColor, setSelectedColor] = useState('#EAB308')
  const [editingAnn, setEditingAnn] = useState<VaultAnnotation | null>(null)
  const [, setHighlights] = useState<StoredHighlight[]>([])

  // Sync highlights from annotations
  useEffect(() => {
    const stored: StoredHighlight[] = annotations
      .filter(a => a.type === 'highlight')
      .map(a => {
        try {
          const pos = JSON.parse(a.position_json) as { startOffset?: number; endOffset?: number }
          return {
            id: a.id,
            startOffset: pos.startOffset ?? 0,
            endOffset: pos.endOffset ?? 0,
            text: a.selected_text ?? '',
            colorHex: a.color_hex,
            meaning: a.color_meaning,
            note: a.content,
          }
        } catch { return null }
      })
      .filter(Boolean) as StoredHighlight[]
    setHighlights(stored)
  }, [annotations])

  const handleHighlight = useCallback(async () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !contentRef.current) return

    const range = selection.getRangeAt(0)
    const selectedText = selection.toString().trim()
    if (!selectedText || selectedText.length < 2) return

    // Get text offsets within the content div
    const preSelectionRange = range.cloneRange()
    preSelectionRange.selectNodeContents(contentRef.current)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const startOffset = preSelectionRange.toString().length
    const endOffset = startOffset + selectedText.length

    await createAnnotation({
      type: 'highlight',
      position: { startOffset, endOffset, x: 0, y: 0, width: 0, height: 0, pageWidth: 1, pageHeight: 1 } as unknown as { x: number; y: number; width: number; height: number; pageWidth: number; pageHeight: number },
      selectedText,
    })

    selection.removeAllRanges()
  }, [createAnnotation])

  const handleAddNote = useCallback(async () => {
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim() ?? ''

    await createAnnotation({
      type: 'note',
      position: { x: 0, y: 0, width: 0, height: 0, pageWidth: 1, pageHeight: 1 },
      ...(selectedText ? { selectedText } : {}),
      content: '',
    })

    const created = annotations[annotations.length - 1]
    if (created) setEditingAnn(created)
  }, [createAnnotation, annotations])

  // Render HTML with highlight markers
  const renderContent = useCallback(() => {
    if (!docContent) return ''
    const html = docContent
    // We don't do complex DOM injection here — highlights are shown in the sidebar
    return html
  }, [docContent])

  if (docContentLoading) return <PageLoader />
  if (!docContent) return <div className="p-6 text-sm text-muted-foreground">No content to display.</div>

  const allAnnotations = annotations.filter(a => ['highlight', 'note', 'bookmark', 'comment'].includes(a.type))

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Highlighter className="h-3.5 w-3.5 text-muted-foreground" />
          {HIGHLIGHT_COLORS.map(c => (
            <button
              key={c.hex}
              type="button"
              title={`${c.label} — ${c.name}`}
              onClick={() => setSelectedColor(c.hex)}
              className={cn('h-5 w-5 rounded-full border-2 transition-transform hover:scale-110', selectedColor === c.hex ? 'border-white scale-110' : 'border-transparent')}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <Button size="sm" variant="outline" onClick={() => void handleHighlight()} className="gap-1 h-7 text-xs">
            <Highlighter className="h-3 w-3" />Highlight Selection
          </Button>
          <Button size="sm" variant="outline" onClick={() => void handleAddNote()} className="gap-1 h-7 text-xs">
            <MessageSquare className="h-3 w-3" />Add Note
          </Button>
          <Button size="sm" variant="outline" onClick={() => { void createAnnotation({ type: 'bookmark', position: { x: 0, y: 0, width: 0, height: 0, pageWidth: 1, pageHeight: 1 }, content: 'Bookmark' }) }} className="gap-1 h-7 text-xs">
            <Bookmark className="h-3 w-3" />Bookmark
          </Button>
          <Badge variant="outline" className="text-xs">{allAnnotations.length} annotations</Badge>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Document content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div
            ref={contentRef}
            className="max-w-3xl mx-auto prose prose-invert prose-sm document-content"
            dangerouslySetInnerHTML={{ __html: renderContent() }}
            style={{ userSelect: 'text', cursor: 'text' }}
          />
        </div>

        {/* Annotations panel */}
        {allAnnotations.length > 0 && (
          <div className="w-64 shrink-0 border-l border-border bg-card overflow-y-auto">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Annotations</p>
            </div>
            <div className="space-y-2 p-3">
              {allAnnotations.map(ann => (
                <div key={ann.id} className="group rounded-lg border border-border p-2.5 hover:border-zinc-500 transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: ann.color_hex }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground capitalize">{ann.type}</p>
                      {ann.selected_text && (
                        <p className="text-xs italic line-clamp-2 mt-0.5">&quot;{ann.selected_text}&quot;</p>
                      )}
                      {ann.content && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button type="button" onClick={() => setEditingAnn(ann)} className="text-muted-foreground hover:text-primary">
                        <MessageSquare className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => void deleteAnnotation(ann.id)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Note editor modal */}
      {editingAnn && (
        <NoteEditor
          ann={editingAnn}
          onSave={(text) => void updateAnnotation(editingAnn.id, text)}
          onClose={() => setEditingAnn(null)}
        />
      )}
    </div>
  )
}
