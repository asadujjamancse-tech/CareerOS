import { Header } from './Header'
import { cn } from '@shared/lib/utils'

interface PageLayoutProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function PageLayout({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: PageLayoutProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col h-full page-enter', className)}>
      <Header title={title} actions={actions} />

      {description && (
        <div className="px-6 py-3 border-b border-border bg-background/50">
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}

      <div className={cn('flex-1 overflow-y-auto p-6', contentClassName)}>
        {children}
      </div>
    </div>
  )
}
