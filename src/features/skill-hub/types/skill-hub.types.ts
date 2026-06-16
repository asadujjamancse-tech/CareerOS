export type {
  SkillHubOverview,
  SkillModule,
  SkillModuleTopic,
  SkillResource,
  SkillExperienceEntry,
  SkillQuizQuestion,
  QuizAttemptStats,
  LinkedLab,
  LinkedProject,
  LinkedCertification,
  LinkedInterviewQuestion,
  LinkedVideo,
  RelatedSkill,
  CreateSkillModuleInput,
  UpdateSkillModuleInput,
  CreateSkillModuleTopicInput,
  UpdateSkillModuleTopicInput,
  CreateSkillResourceInput,
  UpdateSkillResourceInput,
  CreateSkillExperienceEntryInput,
  UpdateSkillExperienceEntryInput,
  CreateSkillQuizQuestionInput,
  UpdateSkillQuizQuestionInput,
  LogQuizAttemptInput,
} from '@shared/types/ipc.types'

export type SkillHubTab =
  | 'overview'
  | 'roadmap'
  | 'resources'
  | 'labs'
  | 'projects'
  | 'interview'
  | 'experience'
  | 'study'
  | 'certifications'
  | 'videos'
  | 'quiz'
  | 'related'

export interface XpLevel {
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  xp: number
  nextLevelXp: number
  color: string
}

export function computeXp(overview: {
  modules_complete: number
  resources_complete: number
  labs_complete: number
  projects_complete: number
  hours_studied: number
  interview_avg_mastery: number
  interview_total: number
}): XpLevel {
  const xp = Math.round(
    overview.modules_complete * 50 +
    overview.resources_complete * 20 +
    overview.labs_complete * 100 +
    overview.projects_complete * 200 +
    overview.hours_studied * 10 +
    (overview.interview_avg_mastery / 5) * overview.interview_total * 25,
  )

  if (xp < 500) return { level: 'Beginner', xp, nextLevelXp: 500, color: '#6B7280' }
  if (xp < 1500) return { level: 'Intermediate', xp, nextLevelXp: 1500, color: '#3B82F6' }
  if (xp < 3000) return { level: 'Advanced', xp, nextLevelXp: 3000, color: '#8B5CF6' }
  return { level: 'Expert', xp, nextLevelXp: xp, color: '#F59E0B' }
}

export function computeMastery(overview: {
  modules_total: number
  modules_complete: number
  resources_total: number
  resources_complete: number
  labs_total: number
  labs_complete: number
  projects_total: number
  projects_complete: number
  interview_total: number
  interview_avg_mastery: number
}): number {
  const weights = [
    { weight: 0.30, score: overview.modules_total ? overview.modules_complete / overview.modules_total : 0 },
    { weight: 0.20, score: overview.labs_total ? overview.labs_complete / overview.labs_total : 0 },
    { weight: 0.20, score: overview.interview_total ? overview.interview_avg_mastery / 5 : 0 },
    { weight: 0.15, score: overview.resources_total ? overview.resources_complete / overview.resources_total : 0 },
    { weight: 0.15, score: overview.projects_total ? overview.projects_complete / overview.projects_total : 0 },
  ]
  return Math.round(weights.reduce((acc, w) => acc + w.weight * w.score * 100, 0))
}

export function computeInterviewReadiness(avgMastery: number): number {
  return Math.round((avgMastery / 5) * 100)
}

export function computeCertReadiness(certsEarned: number, certsTotal: number): number {
  if (certsTotal === 0) return 0
  return Math.round((certsEarned / certsTotal) * 100)
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatHours(hours: number): string {
  if (hours === 0) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
