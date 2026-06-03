import { cn } from '@shared/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const SIZE_CLASSES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
}

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading…',
}: LoadingSpinnerProps): React.ReactElement {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-label={label}
    >
      <div
        className={cn(
          'rounded-full border-muted border-t-primary animate-spin',
          SIZE_CLASSES[size],
        )}
      />
      {size !== 'sm' && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  )
}

export function PageLoader(): React.ReactElement {
  return (
    <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  )
}
