import { useEffect, useState } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Search } from 'lucide-react'
import { api } from '@shared/lib/ipc-client'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
  SheetDescription, SheetBody, SheetFooter,
} from '@shared/components/ui/sheet'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { Label } from '@shared/components/ui/label'
import { Badge } from '@shared/components/ui/badge'
import { Separator } from '@shared/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@shared/components/ui/select'
import {
  occupationFormSchema, occupationFormDefaults, type OccupationFormValues,
} from '../schemas/occupation.schema'
import { useOccupationsStore } from '../store/occupations.store'
import type { OccupationSkillImportance, Tag } from '../types/occupation.types'

interface AvailableSkill {
  id: string
  name: string
  category_name: string
  category_color: string
  proficiency_level: string
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

const IMPORTANCE_OPTIONS: Array<{ value: OccupationSkillImportance; label: string; color: string }> = [
  { value: 'critical',     label: 'Critical',     color: 'text-red-400'    },
  { value: 'important',    label: 'Important',    color: 'text-amber-400'  },
  { value: 'nice-to-have', label: 'Nice to have', color: 'text-blue-400'   },
]

export function OccupationForm() {
  const { isFormOpen, editingId, detail, isSubmitting, formError, closeForm, submit } =
    useOccupationsStore()

  const [allSkills, setAllSkills]   = useState<AvailableSkill[]>([])
  const [skillSearch, setSkillSearch] = useState('')
  const [allTags, setAllTags]       = useState<Tag[]>([])
  const [tagSearch, setTagSearch]   = useState('')

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<OccupationFormValues>({
    resolver: zodResolver(occupationFormSchema),
    defaultValues: occupationFormDefaults,
  })

  const { fields: skillFields, append: appendSkill, remove: removeSkill } =
    useFieldArray({ control, name: 'skill_entries' })

  // Reset form on open/close
  useEffect(() => {
    if (!isFormOpen) {
      reset(occupationFormDefaults)
      setSkillSearch('')
      setTagSearch('')
      return
    }
    if (editingId && detail) {
      reset({
        title:           detail.title,
        industry:        detail.industry         ?? '',
        seniority_level: detail.seniority_level  ?? null,
        status:          detail.status as OccupationFormValues['status'],
        target_date:     detail.target_date       ?? '',
        description:     detail.description      ?? '',
        notes:           detail.notes            ?? '',
        skill_entries:   detail.skills.map(s => ({
          skill_id:   s.skill_id,
          importance: s.importance,
        })),
        tag_ids: detail.tags.map(t => t.id),
      })
    }
  }, [isFormOpen, editingId, detail, reset])

  // Load available skills + tags when form opens
  useEffect(() => {
    if (!isFormOpen) return
    void api.skills.getAll({ pageSize: 500 }).then(r => {
      if (r.success) {
        const raw = r.data as unknown as { items: AvailableSkill[] }
        setAllSkills(raw.items)
      }
    })
    void api.tags.getAll().then(r => {
      if (r.success) setAllTags(r.data as Tag[])
    })
  }, [isFormOpen])

  const onSubmit = async (values: OccupationFormValues) => { await submit(values) }

  // Skills not yet added
  const selectedSkillIds = new Set(skillFields.map(f => f.skill_id))
  const filteredSkills = allSkills
    .filter(s => !selectedSkillIds.has(s.id))
    .filter(s =>
      !skillSearch ||
      s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
      s.category_name.toLowerCase().includes(skillSearch.toLowerCase()),
    )

  // Tags
  const filteredTags = tagSearch
    ? allTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
    : allTags

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <SheetContent side="right" className="w-[480px] max-w-full">
        <SheetHeader>
          <SheetTitle>{editingId ? 'Edit Occupation' : 'Add Occupation'}</SheetTitle>
          <SheetDescription>
            {editingId
              ? 'Update this target role and its required skills.'
              : 'Define a target career role and map the skills you need to acquire.'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="occupation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Senior Backend Engineer"
                {...register('title')}
                aria-invalid={!!errors.title}
              />
              <FieldError message={errors.title?.message} />
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g. FinTech, HealthTech, SaaS"
                {...register('industry')}
              />
            </div>

            {/* Status + Seniority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aspirational">Aspirational</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Seniority Level</Label>
                <Controller
                  control={control}
                  name="seniority_level"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? '__none__'}
                      onValueChange={v => field.onChange(v === '__none__' ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Any level</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="mid">Mid-level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="principal">Principal</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="director">Director</SelectItem>
                        <SelectItem value="vp">VP</SelectItem>
                        <SelectItem value="c-level">C-Level</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Target Date */}
            <div className="space-y-1.5">
              <Label htmlFor="target_date">Target Date</Label>
              <Input id="target_date" type="date" {...register('target_date')} />
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this role and its responsibilities…"
                rows={3}
                {...register('description')}
              />
              <FieldError message={errors.description?.message} />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Personal notes, job boards, target companies…"
                rows={2}
                {...register('notes')}
              />
            </div>

            <Separator />

            {/* Required Skills */}
            <div className="space-y-2">
              <Label>Required Skills</Label>

              {/* Selected skills list */}
              {skillFields.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {skillFields.map((field, idx) => {
                    const skill = allSkills.find(s => s.id === field.skill_id)
                    return (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 rounded-md border border-border bg-accent/30 px-3 py-2"
                      >
                        {skill && (
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: skill.category_color }}
                          />
                        )}
                        <span className="flex-1 text-xs font-medium truncate">
                          {skill?.name ?? field.skill_id}
                        </span>

                        {/* Importance selector */}
                        <Controller
                          control={control}
                          name={`skill_entries.${idx}.importance`}
                          render={({ field: f }) => (
                            <Select value={f.value} onValueChange={f.onChange}>
                              <SelectTrigger className="h-6 w-32 text-xs border-0 bg-transparent px-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {IMPORTANCE_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    <span className={opt.color}>{opt.label}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />

                        <button
                          type="button"
                          onClick={() => removeSkill(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove skill"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Skill picker */}
              {allSkills.length > 0 && (
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={e => setSkillSearch(e.target.value)}
                      placeholder="Search skills to add…"
                      className="flex-1 text-xs bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto p-1">
                    {filteredSkills.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-2 py-2">
                        {selectedSkillIds.size === allSkills.length
                          ? 'All skills added'
                          : 'No matching skills'}
                      </p>
                    ) : (
                      filteredSkills.slice(0, 50).map(skill => (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() =>
                            appendSkill({ skill_id: skill.id, importance: 'important' })
                          }
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors text-left"
                        >
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: skill.category_color }}
                          />
                          <span className="flex-1 font-medium">{skill.name}</span>
                          <span className="text-muted-foreground">{skill.category_name}</span>
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

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
                            <button
                              type="button"
                              onClick={() => field.onChange(field.value.filter(id => id !== tagId))}
                              className="hover:opacity-70 transition-opacity"
                            >
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
                      <div className="max-h-32 overflow-y-auto p-1">
                        {filteredTags.length === 0 ? (
                          <p className="text-xs text-muted-foreground px-2 py-2">No tags found</p>
                        ) : (
                          filteredTags.map(tag => {
                            const selected = field.value.includes(tag.id)
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() =>
                                  field.onChange(
                                    selected
                                      ? field.value.filter(id => id !== tag.id)
                                      : [...field.value, tag.id],
                                  )
                                }
                                className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors text-left"
                              >
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: tag.color_hex }} />
                                <span className="flex-1">{tag.name}</span>
                                {selected && (
                                  <Badge variant="secondary" className="text-[10px] py-0 px-1">Selected</Badge>
                                )}
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            />

          </form>
        </SheetBody>

        <SheetFooter>
          {formError && (
            <p className="text-xs text-destructive w-full text-center">{formError}</p>
          )}
          <Button variant="outline" onClick={closeForm} disabled={isSubmitting} type="button">
            Cancel
          </Button>
          <Button form="occupation-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Add occupation'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
