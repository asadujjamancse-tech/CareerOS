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
import { skillFormSchema, skillFormDefaults, type SkillFormValues } from '../schemas/skill.schema'
import { useSkillsStore } from '../store/skills.store'
import { useCategoriesStore } from '../store/categories.store'
import type { Tag } from '../types/skill.types'

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

export function SkillForm() {
  const { isFormOpen, editingId, detail, isSubmitting, formError, closeForm, submit } =
    useSkillsStore()
  const { categories } = useCategoriesStore()
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [tagSearch, setTagSearch] = useState('')

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: skillFormDefaults,
  })

  // Populate form when editing
  useEffect(() => {
    if (!isFormOpen) {
      reset(skillFormDefaults)
      setTagSearch('')
      return
    }
    if (editingId && detail) {
      reset({
        name: detail.name,
        category_id: detail.category_id,
        description: detail.description ?? '',
        proficiency_level: detail.proficiency_level as SkillFormValues['proficiency_level'],
        status: detail.status as SkillFormValues['status'],
        years_experience: detail.years_experience,
        notes: detail.notes ?? '',
        is_public: detail.is_public === 1,
        tag_ids: detail.tags.map(t => t.id),
      })
    }
  }, [isFormOpen, editingId, detail, reset])

  // Fetch available tags when form opens
  useEffect(() => {
    if (!isFormOpen) return
    api.tags.getAll().then(result => {
      if (result.success) setAllTags(result.data as Tag[])
    }).catch(() => {/* tags are optional */})
  }, [isFormOpen])

  const onSubmit = async (values: SkillFormValues) => {
    await submit(values)
  }

  const filteredTags = tagSearch
    ? allTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
    : allTags

  return (
    <Sheet open={isFormOpen} onOpenChange={open => { if (!open) closeForm() }}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{editingId ? 'Edit Skill' : 'Add Skill'}</SheetTitle>
          <SheetDescription>
            {editingId
              ? 'Update the skill details below.'
              : 'Fill in the details to add a new skill to your library.'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form id="skill-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. TypeScript"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              <FieldError message={errors.name?.message} />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.category_id}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.category_id?.message} />
            </div>

            {/* Level + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Proficiency Level</Label>
                <Controller
                  control={control}
                  name="proficiency_level"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

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
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="practicing">Practicing</SelectItem>
                        <SelectItem value="proficient">Proficient</SelectItem>
                        <SelectItem value="mastered">Mastered</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Years of experience */}
            <div className="space-y-1.5">
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                min={0}
                max={50}
                step={0.5}
                {...register('years_experience')}
              />
              <FieldError message={errors.years_experience?.message} />
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this skill used for?"
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
                placeholder="Personal notes, resources, learning path…"
                rows={3}
                {...register('notes')}
              />
              <FieldError message={errors.notes?.message} />
            </div>

            <Separator />

            {/* Tags */}
            <Controller
              control={control}
              name="tag_ids"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tags</Label>

                  {/* Selected tag chips */}
                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {field.value.map(tagId => {
                        const tag = allTags.find(t => t.id === tagId)
                        if (!tag) return null
                        return (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border border-border"
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

                  {/* Tag search + list */}
                  {allTags.length > 0 && (
                    <div className="border border-border rounded-md overflow-hidden">
                      <input
                        type="text"
                        value={tagSearch}
                        onChange={e => setTagSearch(e.target.value)}
                        placeholder="Search tags…"
                        className="w-full px-3 py-2 text-xs bg-transparent border-b border-border focus:outline-none"
                      />
                      <div className="max-h-36 overflow-y-auto p-1">
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
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: tag.color_hex }}
                                />
                                <span className="flex-1">{tag.name}</span>
                                {selected && (
                                  <Badge variant="secondary" className="text-[10px] py-0 px-1">
                                    Selected
                                  </Badge>
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

            <Separator />

            {/* Public toggle */}
            <Controller
              control={control}
              name="is_public"
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_public" className="cursor-pointer">
                      Public skill
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Include in exported résumé and portfolio
                    </p>
                  </div>
                  <Switch
                    id="is_public"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            {/* Related data (read-only) shown when editing */}
            {editingId && detail && (
              <>
                <Separator />
                {detail.related_occupations.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Related Occupations</Label>
                    <div className="space-y-1">
                      {detail.related_occupations.map(occ => (
                        <div key={occ.id} className="flex items-center justify-between text-xs py-1">
                          <span>{occ.title}</span>
                          <Badge variant="outline" className="text-[10px]">{occ.importance}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detail.related_videos.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Related Videos</Label>
                    <div className="space-y-1">
                      {detail.related_videos.map(vid => (
                        <div key={vid.id} className="text-xs py-1 truncate text-muted-foreground">
                          {vid.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </form>
        </SheetBody>

        <SheetFooter>
          {formError && (
            <p className="text-xs text-destructive w-full text-center">{formError}</p>
          )}
          <Button variant="outline" onClick={closeForm} disabled={isSubmitting} type="button">
            Cancel
          </Button>
          <Button form="skill-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Add skill'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
