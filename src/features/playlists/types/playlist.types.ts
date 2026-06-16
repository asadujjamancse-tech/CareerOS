export type PlaylistSource = 'youtube' | 'custom'
export type ItemWatchStatus = 'unwatched' | 'watching' | 'completed'

export interface Playlist {
  id: string
  title: string
  description: string | null
  source: PlaylistSource
  source_url: string | null
  thumbnail: string | null
  skill_id: string | null
  created_at: string
  updated_at: string
}

export interface PlaylistItem {
  id: string
  playlist_id: string
  video_id: string | null
  title: string
  url: string | null
  source: string
  duration_seconds: number | null
  position: number
  watch_status: ItemWatchStatus
  progress_seconds: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PlaylistWithProgress extends Playlist {
  item_count: number
  completed_count: number
  total_duration_seconds: number
  skill_name: string | null
}

export interface PlaylistDetail extends PlaylistWithProgress {
  items: PlaylistItem[]
}

export interface PlaylistFilters {
  search: string
  skillId: string
}
