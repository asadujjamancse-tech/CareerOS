import { Code2 } from 'lucide-react'
import { isElectron } from '@shared/lib/platform'
import { cn } from '@shared/lib/utils'

const isMac =
  typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac')

export function TitleBar(): React.ReactElement {
  return (
    <div
      className={cn(
        'h-11 w-full shrink-0 flex items-center select-none',
        'bg-sidebar border-b border-sidebar-border',
        isElectron && 'drag-region',
      )}
    >
      {/* Reserve space for macOS traffic-light buttons (close / minimise / maximise).
          trafficLightPosition is { x: 16, y: 16 } so 80 px clears all three. */}
      {isMac && isElectron && <div className="w-[80px] shrink-0" />}

      {/* App branding — marked no-drag so it doesn't swallow pointer events */}
      <div className="no-drag flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center shrink-0">
          <Code2 className="w-3 h-3 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm text-foreground tracking-tight">
          CareerOS
        </span>
      </div>

      {/* Remainder of the bar is an empty draggable surface */}
    </div>
  )
}
