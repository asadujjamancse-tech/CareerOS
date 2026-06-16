import { useState } from 'react'
import { Plus, ExternalLink, Trash2, CheckCircle2, Circle, Youtube, BookOpen, GraduationCap, Globe, FileText } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select'
import { cn } from '@shared/lib/utils'
import type { SkillResource } from '@shared/types/ipc.types'
import { useSkillHubStore } from '../../store/skill-hub.store'

const PROVIDERS = [
  { value: 'youtube',         label: 'YouTube',          icon: Youtube,     color: '#EF4444' },
  { value: 'microsoft-learn', label: 'Microsoft Learn',  icon: BookOpen,    color: '#0078D4' },
  { value: 'udemy',           label: 'Udemy',            icon: GraduationCap, color: '#A435F0' },
  { value: 'linkedin',        label: 'LinkedIn Learning', icon: Globe,      color: '#0A66C2' },
  { value: 'pluralsight',     label: 'Pluralsight',      icon: Globe,       color: '#F15B2A' },
  { value: 'blog',            label: 'Blog',             icon: FileText,    color: '#10B981' },
  { value: 'docs',            label: 'Documentation',    icon: FileText,    color: '#6B7280' },
  { value: 'pdf',             label: 'PDF / Book',       icon: FileText,    color: '#8B5CF6' },
  { value: 'other',           label: 'Other',            icon: Globe,       color: '#6B7280' },
]

function getProvider(value: string) {
  return PROVIDERS.find(p => p.value === value) ?? PROVIDERS[PROVIDERS.length - 1]!
}

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const

interface Props {
  skillId: string
  resources: SkillResource[]
  isLoading: boolean
}

function ResourceCard({ resource }: { resource: SkillResource }) {
  const { toggleResourceComplete, deleteResource } = useSkillHubStore()
  const provider = getProvider(resource.provider)
  const ProviderIcon = provider.icon

  return (
    <div className={cn(
      'group flex items-start gap-3 rounded-lg border p-3 transition-colors',
      resource.is_completed === 1 ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-card hover:border-zinc-600',
    )}>
      <div className="rounded-md p-1.5 shrink-0 mt-0.5" style={{ backgroundColor: `${provider.color}20` }}>
        <ProviderIcon className="h-3.5 w-3.5" style={{ color: provider.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium', resource.is_completed === 1 && 'line-through text-muted-foreground')}>
            {resource.title}
          </p>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => void toggleResourceComplete(resource.id, resource.is_completed)} className="text-muted-foreground hover:text-green-500 transition-colors">
              {resource.is_completed === 1
                ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                : <Circle className="h-4 w-4" />}
            </button>
            <Button variant="ghost" size="icon-sm" onClick={() => void deleteResource(resource.id)} className="text-muted-foreground hover:text-destructive h-6 w-6">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">{provider.label}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded-sm font-medium', {
            'bg-green-500/10 text-green-400': resource.difficulty === 'beginner',
            'bg-amber-500/10 text-amber-400': resource.difficulty === 'intermediate',
            'bg-red-500/10 text-red-400': resource.difficulty === 'advanced',
          })}>
            {resource.difficulty}
          </span>
          {resource.est_hours > 0 && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{resource.est_hours}h</span>
            </>
          )}
          {resource.url && (
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto">
              Open <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>

        {resource.notes && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{resource.notes}</p>
        )}
      </div>
    </div>
  )
}

function AddResourceForm({ skillId, onClose }: { skillId: string; onClose: () => void }) {
  const [form, setForm] = useState({
    title: '', provider: 'youtube', url: '', difficulty: 'beginner', est_hours: '', notes: '',
  })
  const { createResource } = useSkillHubStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    await createResource({
      skill_id: skillId,
      title: form.title.trim(),
      provider: form.provider,
      url: form.url.trim() || null,
      difficulty: form.difficulty,
      est_hours: parseFloat(form.est_hours) || 0,
      notes: form.notes.trim() || null,
    })
    onClose()
  }

  return (
    <form onSubmit={e => void handleSubmit(e)} className="rounded-lg border border-primary/30 bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Add Learning Resource</h3>

      <Input
        placeholder="Resource title *" required
        value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select value={form.provider} onValueChange={v => setForm(f => ({ ...f, provider: v }))}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="URL (optional)"
          value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
        />
        <Input
          type="number" min={0} step={0.5} placeholder="Est. hours"
          value={form.est_hours} onChange={e => setForm(f => ({ ...f, est_hours: e.target.value }))}
        />
      </div>

      <Textarea
        placeholder="Notes (optional)" rows={2}
        value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
      />

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm">Add Resource</Button>
      </div>
    </form>
  )
}

export function ResourcesTab({ skillId, resources, isLoading }: Props) {
  const [showForm, setShowForm] = useState(false)

  const completed = resources.filter(r => r.is_completed === 1).length

  if (isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading resources…</div>

  return (
    <div className="space-y-4">
      {/* Stats */}
      {resources.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {completed}/{resources.length} completed
            {resources.length > 0 && ` · ${resources.reduce((s, r) => s + r.est_hours, 0).toFixed(1)}h estimated`}
          </p>
          <div className="h-1.5 w-32 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${resources.length ? (completed/resources.length)*100 : 0}%` }} />
          </div>
        </div>
      )}

      {showForm && <AddResourceForm skillId={skillId} onClose={() => setShowForm(false)} />}

      {resources.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-border p-4 mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No resources yet</p>
          <p className="text-xs text-muted-foreground mb-4">Add YouTube videos, docs, courses, and more</p>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Add Resource</Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {resources.map(r => <ResourceCard key={r.id} resource={r} />)}
          </div>
          {!showForm && (
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Resource
            </Button>
          )}
        </>
      )}
    </div>
  )
}
