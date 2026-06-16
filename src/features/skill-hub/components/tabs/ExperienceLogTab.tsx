import { useState } from 'react'
import { Activity, Plus, Trash2 } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import type { SkillExperienceEntry } from '@shared/types/ipc.types'
import { useSkillHubStore } from '../../store/skill-hub.store'

interface Props {
  skillId: string
  entries: SkillExperienceEntry[]
  isLoading: boolean
}

function EntryCard({ entry }: { entry: SkillExperienceEntry }) {
  const { deleteExperienceEntry } = useSkillHubStore()
  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-zinc-600 transition-colors">
      <div className="rounded-md p-2 bg-purple-500/10 shrink-0">
        <Activity className="h-4 w-4 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{entry.task}</p>
          <Button
            variant="ghost" size="icon-sm"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => void deleteExperienceEntry(entry.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{new Date(entry.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span>·</span>
          <span>{entry.hours}h</span>
        </div>
        {entry.what_learned && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{entry.what_learned}</p>
        )}
      </div>
    </div>
  )
}

function AddEntryForm({ skillId, onClose }: { skillId: string; onClose: () => void }) {
  const [form, setForm] = useState({
    task: '', hours: '', what_learned: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const { createExperienceEntry } = useSkillHubStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.task.trim() || !form.hours) return
    await createExperienceEntry({
      skill_id: skillId,
      task: form.task.trim(),
      hours: parseFloat(form.hours),
      date: form.date,
      what_learned: form.what_learned.trim() || null,
    })
    onClose()
  }

  return (
    <form onSubmit={e => void handleSubmit(e)} className="rounded-lg border border-primary/30 bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Add Experience Entry</h3>
      <Input
        placeholder="What did you do? *" required
        value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date" required
          value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
        />
        <Input
          type="number" min={0} step={0.5} placeholder="Hours *" required
          value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
        />
      </div>
      <Textarea
        placeholder="What did you learn? (optional)" rows={3}
        value={form.what_learned} onChange={e => setForm(f => ({ ...f, what_learned: e.target.value }))}
      />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm">Add Entry</Button>
      </div>
    </form>
  )
}

export function ExperienceLogTab({ skillId, entries, isLoading }: Props) {
  const [showForm, setShowForm] = useState(false)

  if (isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading experience log…</div>

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)

  return (
    <div className="space-y-4">
      {entries.length > 0 && (
        <p className="text-xs text-muted-foreground">{entries.length} entries · {totalHours.toFixed(1)}h total</p>
      )}

      {showForm && <AddEntryForm skillId={skillId} onClose={() => setShowForm(false)} />}

      {entries.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-border p-4 mb-4">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No experience entries yet</p>
          <p className="text-xs text-muted-foreground mb-4">Record what you did, how long it took, and what you learned</p>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Add Entry</Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {entries.map(e => <EntryCard key={e.id} entry={e} />)}
          </div>
          {!showForm && (
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Entry
            </Button>
          )}
        </>
      )}
    </div>
  )
}
