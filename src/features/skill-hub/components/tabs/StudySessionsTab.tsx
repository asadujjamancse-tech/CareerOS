import { useEffect, useState } from 'react'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { api } from '@shared/lib/ipc-client'
import type { StudySession, LogStudySessionInput } from '@shared/types/ipc.types'
import { formatDuration } from '../../types/skill-hub.types'

interface Props {
  skillId: string
}

function SessionCard({ session, onDelete }: { session: StudySession; onDelete: () => void }) {
  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-zinc-600 transition-colors">
      <div className="rounded-md p-2 bg-blue-500/10 shrink-0">
        <Clock className="h-4 w-4 text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{session.title}</p>
          <Button
            variant="ghost" size="icon-sm"
            className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{new Date(session.session_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span>·</span>
          <span>{formatDuration(session.duration_minutes)}</span>
        </div>
        {session.notes && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{session.notes}</p>}
      </div>
    </div>
  )
}

function LogSessionForm({ skillId, onSaved }: { skillId: string; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: '', duration_minutes: '', notes: '',
    session_date: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.duration_minutes) return
    setSaving(true)
    const input: LogStudySessionInput = {
      skill_id: skillId,
      title: form.title.trim(),
      duration_minutes: parseInt(form.duration_minutes),
      notes: form.notes.trim() || null,
      session_date: form.session_date,
    }
    await api.careerIntelligence.studySessions.log(input)
    setSaving(false)
    onSaved()
  }

  return (
    <form onSubmit={e => void handleSubmit(e)} className="rounded-lg border border-primary/30 bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Log Study Session</h3>
      <Input
        placeholder="Session title *" required
        value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date" required
          value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
        />
        <Input
          type="number" min={1} placeholder="Duration (minutes) *" required
          value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
        />
      </div>
      <Textarea
        placeholder="Notes (optional)" rows={2}
        value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
      />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onSaved}>Cancel</Button>
        <Button type="submit" size="sm" disabled={saving}>{saving ? 'Saving…' : 'Log Session'}</Button>
      </div>
    </form>
  )
}

export function StudySessionsTab({ skillId }: Props) {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    setIsLoading(true)
    const res = await api.careerIntelligence.studySessions.getAll()
    if (res.success) setSessions(res.data.filter(s => s.skill_id === skillId))
    setIsLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId])

  async function handleDelete(id: string) {
    await api.careerIntelligence.studySessions.delete(id)
    setSessions(s => s.filter(x => x.id !== id))
  }

  const totalMinutes = sessions.reduce((s, x) => s + x.duration_minutes, 0)

  return (
    <div className="space-y-4">
      {sessions.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {sessions.length} sessions · {formatDuration(totalMinutes)} total
        </div>
      )}

      {showForm && (
        <LogSessionForm
          skillId={skillId}
          onSaved={() => { setShowForm(false); void load() }}
        />
      )}

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : sessions.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-border p-4 mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No study sessions yet</p>
          <p className="text-xs text-muted-foreground mb-4">Log your study sessions to track time spent on this skill</p>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Log Session</Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {sessions.map(s => <SessionCard key={s.id} session={s} onDelete={() => void handleDelete(s.id)} />)}
          </div>
          {!showForm && (
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Log Session
            </Button>
          )}
        </>
      )}
    </div>
  )
}
