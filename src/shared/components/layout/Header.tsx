import { Search } from 'lucide-react'
import { cn } from '@shared/lib/utils'

interface HeaderProps {
  title?: string
  actions?: React.ReactNode
  className?: string
}

export function Header({ title, actions, className }: HeaderProps): React.ReactElement {
  return (
    <header
      className={cn(
        'h-12 shrink-0 flex items-center gap-4 px-6 border-b border-border bg-background drag-region',
        className,
      )}
    >
      {title && (
        <h1 className="text-sm font-semibold text-foreground truncate select-none">{title}</h1>
      )}

      <div className="flex-1" />

      {/* no-drag on all interactive controls so they remain fully clickable */}
      <button
        type="button"
        className="no-drag flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-secondary/50 text-muted-foreground text-xs hover:bg-secondary hover:text-foreground transition-colors"
        aria-label="Search"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:block">Search</span>
        <kbd className="hidden sm:block font-mono text-[10px] text-muted-foreground">⌘K</kbd>
      </button>

      {actions && (
        <div className="no-drag flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  )
}
