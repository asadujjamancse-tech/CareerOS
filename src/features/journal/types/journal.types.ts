import type { BaseEntity } from '@shared/types/common.types'

export type JournalMood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
export type JournalCategory = 'achievement' | 'challenge' | 'reflection' | 'learning' | 'goal' | 'feedback' | 'general'

export interface JournalEntry extends BaseEntity {
  title: string
  content: string
  entry_date: string
  mood: JournalMood | null
  energy_level: number | null
  category: JournalCategory
  is_private: 0 | 1
}

export interface JournalWithTags extends JournalEntry { tag_count: number }
export interface Tag { id: string; name: string; slug: string; color_hex: string; created_at: string; updated_at: string }
export interface JournalDetail extends JournalWithTags { tags: Tag[] }

export interface JournalFilters {
  search: string; category: JournalCategory | ''; mood: JournalMood | ''
  from_date: string; to_date: string
}

export interface PaginatedJournal {
  items: JournalWithTags[]; total: number; page: number; pageSize: number; totalPages: number
}
