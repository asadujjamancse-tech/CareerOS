import { Video, ExternalLink, Clock } from 'lucide-react'
import { Button } from '@shared/components/ui/button'
import { cn } from '@shared/lib/utils'
import type { LinkedVideo } from '@shared/types/ipc.types'
import { formatDuration } from '../../types/skill-hub.types'

interface Props {
  videos: LinkedVideo[]
  isLoading: boolean
}

const WATCH_STATUS_STYLES: Record<string, string> = {
  completed:  'bg-green-500/10 text-green-400',
  watching:   'bg-blue-500/10 text-blue-400',
  unwatched:  'bg-zinc-500/10 text-zinc-400',
  revisit:    'bg-amber-500/10 text-amber-400',
}

const SOURCE_LABELS: Record<string, string> = {
  youtube:    'YouTube',
  vimeo:      'Vimeo',
  udemy:      'Udemy',
  coursera:   'Coursera',
  pluralsight:'Pluralsight',
  local:      'Local',
  other:      'Other',
}

function VideoCard({ video }: { video: LinkedVideo }) {
  const statusCls = WATCH_STATUS_STYLES[video.watch_status] ?? 'bg-zinc-500/10 text-zinc-400'
  const statusLabel = video.watch_status.charAt(0).toUpperCase() + video.watch_status.slice(1)

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-zinc-600 transition-colors group">
      {video.thumbnail_path ? (
        <img src={`file://${video.thumbnail_path}`} alt="" className="h-12 w-20 object-cover rounded shrink-0" />
      ) : (
        <div className="h-12 w-20 rounded bg-border flex items-center justify-center shrink-0">
          <Video className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground line-clamp-2">{video.title}</p>
          {video.url && (
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={cn('text-xs px-1.5 py-0.5 rounded-sm font-medium', statusCls)}>{statusLabel}</span>
          <span className="text-xs text-muted-foreground">{SOURCE_LABELS[video.source] ?? video.source}</span>
          {video.duration_seconds != null && video.duration_seconds > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(Math.round(video.duration_seconds / 60))}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function VideosTab({ videos, isLoading }: Props) {
  if (isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading videos…</div>

  const completed = videos.filter(v => v.watch_status === 'completed').length

  return (
    <div className="space-y-4">
      {videos.length > 0 && (
        <p className="text-xs text-muted-foreground">{completed}/{videos.length} completed</p>
      )}

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-border p-4 mb-4">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No videos linked</p>
          <p className="text-xs text-muted-foreground mb-4">
            Tag videos with this skill from the Videos page to see them here.
          </p>
          <Button variant="outline" size="sm" onClick={() => { window.location.hash = '#/videos' }}>
            <ExternalLink className="h-3.5 w-3.5 mr-2" /> Go to Videos
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {videos.map(v => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </div>
  )
}
