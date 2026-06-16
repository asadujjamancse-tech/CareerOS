import { useState } from 'react'
import { Plus, CheckCircle2, Circle, ChevronDown, ChevronRight, Clock, Trash2, Edit2, Check, X } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { cn } from '@shared/lib/utils'
import type { SkillModule } from '@shared/types/ipc.types'
import { useSkillHubStore } from '../../store/skill-hub.store'

interface Props {
  skillId: string
  modules: SkillModule[]
  isLoading: boolean
}

function TopicRow({ topic, onToggle, onDelete }: {
  topic: SkillModule['topics'][number]
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-2 py-1 pl-6 group">
      <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
        {topic.is_complete === 1
          ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          : <Circle className="h-3.5 w-3.5" />}
      </button>
      <span className={cn('text-sm flex-1', topic.is_complete === 1 && 'line-through text-muted-foreground')}>
        {topic.title}
      </span>
      <Button
        variant="ghost" size="icon-sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5"
        onClick={onDelete}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

function ModuleCard({ module }: { module: SkillModule }) {
  const [expanded, setExpanded] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(module.title)
  const [hoursDraft, setHoursDraft] = useState(String(module.hours_spent))
  const [addingTopic, setAddingTopic] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  const { updateModule, deleteModule, toggleModuleComplete, createTopic, updateTopic, deleteTopic } = useSkillHubStore()

  const topicsDone = module.topics.filter(t => t.is_complete === 1).length
  const topicsTotal = module.topics.length

  function saveTitle() {
    if (titleDraft.trim() && titleDraft !== module.title) {
      void updateModule(module.id, { title: titleDraft.trim() })
    }
    setEditingTitle(false)
  }

  async function saveHours() {
    const h = parseFloat(hoursDraft)
    if (!isNaN(h) && h >= 0) await updateModule(module.id, { hours_spent: h })
  }

  async function addTopic() {
    if (!newTopic.trim()) return
    await createTopic({ module_id: module.id, title: newTopic.trim() })
    setNewTopic('')
    setAddingTopic(false)
  }

  return (
    <div className={cn(
      'rounded-lg border transition-colors',
      module.is_complete === 1 ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-card',
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <button onClick={() => void toggleModuleComplete(module.id, module.is_complete)} className="shrink-0">
          {module.is_complete === 1
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />}
        </button>

        {editingTitle ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
              className="h-7 text-sm" autoFocus
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleDraft(module.title); setEditingTitle(false) } }}
            />
            <Button variant="ghost" size="icon-sm" onClick={saveTitle}><Check className="h-3.5 w-3.5 text-green-500" /></Button>
            <Button variant="ghost" size="icon-sm" onClick={() => { setTitleDraft(module.title); setEditingTitle(false) }}><X className="h-3.5 w-3.5" /></Button>
          </div>
        ) : (
          <span className={cn('flex-1 text-sm font-medium', module.is_complete === 1 && 'line-through text-muted-foreground')}>
            {module.title}
          </span>
        )}

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {topicsTotal > 0 && (
            <span className="text-xs text-muted-foreground">{topicsDone}/{topicsTotal}</span>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <input
              type="number" min={0} step={0.5}
              value={hoursDraft}
              onChange={e => setHoursDraft(e.target.value)}
              onBlur={() => void saveHours()}
              className="w-10 bg-transparent text-right focus:outline-none focus:ring-0 border-b border-transparent focus:border-muted-foreground text-xs"
            />
            <span>h</span>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setEditingTitle(true)}><Edit2 className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon-sm" onClick={() => void deleteModule(module.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
          <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Topics */}
      {expanded && (
        <div className="pb-2 border-t border-border/50 mt-1 pt-2">
          {module.topics.map(topic => (
            <TopicRow
              key={topic.id}
              topic={topic}
              onToggle={() => void updateTopic(module.id, topic.id, { is_complete: topic.is_complete === 1 ? 0 : 1 })}
              onDelete={() => void deleteTopic(module.id, topic.id)}
            />
          ))}

          {addingTopic ? (
            <div className="flex items-center gap-2 pl-6 pr-3 py-1">
              <Input
                value={newTopic} onChange={e => setNewTopic(e.target.value)}
                placeholder="Topic title…" className="h-7 text-sm flex-1" autoFocus
                onKeyDown={e => { if (e.key === 'Enter') void addTopic(); if (e.key === 'Escape') setAddingTopic(false) }}
              />
              <Button size="sm" className="h-7" onClick={() => void addTopic()}>Add</Button>
              <Button variant="ghost" size="sm" className="h-7" onClick={() => setAddingTopic(false)}>Cancel</Button>
            </div>
          ) : (
            <button
              className="flex items-center gap-1.5 pl-6 pr-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setAddingTopic(true)}
            >
              <Plus className="h-3 w-3" /> Add topic
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function RoadmapTab({ skillId, modules, isLoading }: Props) {
  const [addingModule, setAddingModule] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const { createModule } = useSkillHubStore()

  const totalModules = modules.length
  const doneModules = modules.filter(m => m.is_complete === 1).length
  const progressPct = totalModules > 0 ? Math.round((doneModules / totalModules) * 100) : 0

  async function handleAddModule() {
    if (!newModuleTitle.trim()) return
    await createModule({ skill_id: skillId, title: newModuleTitle.trim() })
    setNewModuleTitle('')
    setAddingModule(false)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading roadmap…</div>
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {totalModules > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{doneModules}/{totalModules} modules complete</span>
        </div>
      )}

      {/* Module list */}
      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-border p-4 mb-4">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No modules yet</p>
          <p className="text-xs text-muted-foreground">Build your learning roadmap by adding modules</p>
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map(module => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      )}

      {/* Add module */}
      {addingModule ? (
        <div className="flex items-center gap-2">
          <Input
            value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)}
            placeholder="Module title…" autoFocus
            onKeyDown={e => { if (e.key === 'Enter') void handleAddModule(); if (e.key === 'Escape') setAddingModule(false) }}
          />
          <Button onClick={() => void handleAddModule()}>Add</Button>
          <Button variant="outline" onClick={() => { setAddingModule(false); setNewModuleTitle('') }}>Cancel</Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setAddingModule(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      )}
    </div>
  )
}
