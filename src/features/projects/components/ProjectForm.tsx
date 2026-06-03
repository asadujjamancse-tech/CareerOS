import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@shared/lib/ipc-client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@shared/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { Label } from '@shared/components/ui/label'
import { Switch } from '@shared/components/ui/switch'
import { Badge } from '@shared/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select'
import { Separator } from '@shared/components/ui/separator'
import { X } from 'lucide-react'
import { projectFormSchema, projectFormDefaults, type ProjectFormValues } from '../schemas/project.schema'
import { useProjectsStore } from '../store/projects.store'
import type { Tag } from '../types/project.types'
import type { SkillWithCategory } from '@features/skills/types/skill.types'

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

export function ProjectForm() {
  const { isFormOpen, editingId, detail, isSubmitting, formError, closeForm, submit } =
    useProjectsStore()

  const [allSkills, setAllSkills] = useState<SkillWithCategory[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [skillSearch, setSkillSearch] = useState('')
  const [tagSearch, setTagSearch] = useState('')

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: projectFormDefaults,
  })

  useEffect(() => {
    if (!isFormOpen) {
      reset(projectFormDefaults)
      setSkillSearch('')
      setTagSearch('')
      return
    }
    if (editingId && detail) {
      reset({
        title: detail.title,
        summary: detail.summary ?? '',
        description: detail.description ?? '',
        status: detail.status,
        type: detail.type,
        repo_url: detail.repo_url ?? '',
        live_url: detail.live_url ?? '',
        is_featured: detail.is_featured === 1,
        started_at: detail.started_at ?? '',
        completed_at: detail.completed_at ?? '',
        skill_ids: detail.skills.map(s => s.id),
        tag_ids: detail.tags.map(t => t.id),
        lessons_learned: '',
      })
    }
  }, [isFormOpen, editingId, detail, reset])

  useEffect(() => {
    if (!isFormOpen) return
    Promise.all([
      api.skills.getAll({ pageSize: 500 }),
      api.tags.getAll(),
    ]).then(([sr, tr]) => {
      if (sr.success) {
        const p = sr.data as unknown as { items: SkillWithCategory[] }
        setAllSkills(p.items)
      }
      if (tr.success) setAllTags(tr.data as Tag[])
    }).catch(() => {/* non-critical */})
  }, [isFormOpen])

  const filteredSkills = skillSearch
    ? allSkills.filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase()))
    : allSkills

  const filteredTags = tagSearch
    ? allTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
    : allTags

  const onSubmit = async (values: ProjectFormValues) => {
    await submit(values)
  }

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{editingId ? 'Edit Project' : 'Add Project'}</SheetTitle>
          <SheetDescription>
            {editingId ? 'Update project details.' : 'Add a project to your portfolio.'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="project-form" onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="info" className="flex-1 text-xs">Info</TabsTrigger>
                <TabsTrigger value="details" className="flex-1 text-xs">Details</TabsTrigger>
                <TabsTrigger value="links" className="flex-1 text-xs">Links & Skills</TabsTrigger>
              </TabsList>

              {/* ── Tab: Info ─────────────────────────── */}
              <TabsContent value="info" className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input id="title" placeholder="e.g. CareerOS" {...register('title')} />
                  <FieldError message={errors.title?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="summary">Short Summary</Label>
                  <Input id="summary" placeholder="One-line description" {...register('summary')} />
                  <FieldError message={errors.summary?.message} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="abandoned">Abandoned</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Controller
                      control={control}
                      name="type"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="open-source">Open Source</SelectItem>
                            <SelectItem value="freelance">Freelance</SelectItem>
                            <SelectItem value="academic">Academic</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="started_at">Start Date</Label>
                    <Input id="started_at" type="date" {...register('started_at')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="completed_at">End Date</Label>
                    <Input id="completed_at" type="date" {...register('completed_at')} />
                  </div>
                </div>

                <Controller
                  control={control}
                  name="is_featured"
                  render={({ field }) => (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_featured" className="cursor-pointer">Feature this project</Label>
                      <Switch id="is_featured" checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                  )}
                />
              </TabsContent>

              {/* ── Tab: Details ──────────────────────── */}
              <TabsContent value="details" className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this project do? What problem does it solve?"
                    rows={5}
                    {...register('description')}
                  />
                  <FieldError message={errors.description?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lessons_learned">Lessons Learned</Label>
                  <Textarea
                    id="lessons_learned"
                    placeholder="What did you learn? What would you do differently?"
                    rows={4}
                    {...register('lessons_learned')}
                  />
                  <FieldError message={errors.lessons_learned?.message} />
                </div>

                {/* Tags */}
                <Controller
                  control={control}
                  name="tag_ids"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      {field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {field.value.map(tagId => {
                            const tag = allTags.find(t => t.id === tagId)
                            if (!tag) return null
                            return (
                              <span
                                key={tag.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border"
                                style={{ borderColor: tag.color_hex + '60', color: tag.color_hex }}
                              >
                                {tag.name}
                                <button type="button" onClick={() => field.onChange(field.value.filter(id => id !== tagId))}>
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      )}
                      {allTags.length > 0 && (
                        <div className="border border-border rounded-md overflow-hidden">
                          <input
                            type="text"
                            value={tagSearch}
                            onChange={e => setTagSearch(e.target.value)}
                            placeholder="Search tags…"
                            className="w-full px-3 py-2 text-xs bg-transparent border-b border-border focus:outline-none"
                          />
                          <div className="max-h-28 overflow-y-auto p-1">
                            {filteredTags.map(tag => {
                              const selected = field.value.includes(tag.id)
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() =>
                                    field.onChange(
                                      selected ? field.value.filter(id => id !== tag.id) : [...field.value, tag.id],
                                    )
                                  }
                                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors text-left"
                                >
                                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: tag.color_hex }} />
                                  <span className="flex-1">{tag.name}</span>
                                  {selected && <Badge variant="secondary" className="text-[10px] py-0 px-1">Selected</Badge>}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                />
              </TabsContent>

              {/* ── Tab: Links & Skills ───────────────── */}
              <TabsContent value="links" className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="repo_url">Repository URL</Label>
                  <Input id="repo_url" type="url" placeholder="https://github.com/…" {...register('repo_url')} />
                  <FieldError message={errors.repo_url?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="live_url">Live URL</Label>
                  <Input id="live_url" type="url" placeholder="https://…" {...register('live_url')} />
                  <FieldError message={errors.live_url?.message} />
                </div>

                <Separator />

                {/* Skills multi-select */}
                <Controller
                  control={control}
                  name="skill_ids"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Skills Used</Label>
                      {field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {field.value.map(skillId => {
                            const skill = allSkills.find(s => s.id === skillId)
                            if (!skill) return null
                            return (
                              <span
                                key={skill.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-secondary text-secondary-foreground"
                              >
                                {skill.name}
                                <button type="button" onClick={() => field.onChange(field.value.filter(id => id !== skillId))}>
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      )}
                      <div className="border border-border rounded-md overflow-hidden">
                        <input
                          type="text"
                          value={skillSearch}
                          onChange={e => setSkillSearch(e.target.value)}
                          placeholder="Search skills…"
                          className="w-full px-3 py-2 text-xs bg-transparent border-b border-border focus:outline-none"
                        />
                        <div className="max-h-44 overflow-y-auto p-1">
                          {filteredSkills.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-2 py-2">No skills found</p>
                          ) : (
                            filteredSkills.map(skill => {
                              const selected = field.value.includes(skill.id)
                              return (
                                <button
                                  key={skill.id}
                                  type="button"
                                  onClick={() =>
                                    field.onChange(
                                      selected ? field.value.filter(id => id !== skill.id) : [...field.value, skill.id],
                                    )
                                  }
                                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors text-left"
                                >
                                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: skill.category_color }} />
                                  <span className="flex-1">{skill.name}</span>
                                  <span className="text-muted-foreground">{skill.category_name}</span>
                                  {selected && <Badge variant="secondary" className="text-[10px] py-0 px-1">Added</Badge>}
                                </button>
                              )
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>
            </Tabs>
          </form>
        </SheetBody>

        <SheetFooter>
          {formError && <p className="text-xs text-destructive w-full text-center">{formError}</p>}
          <Button variant="outline" onClick={closeForm} disabled={isSubmitting} type="button">
            Cancel
          </Button>
          <Button form="project-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Add project'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
