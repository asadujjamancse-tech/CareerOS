import { NavLink } from 'react-router-dom'
import {
  Code2, Briefcase, FolderOpen, Award,
  Video, FileText, File, BookOpen, Tag, Settings,
} from 'lucide-react'
import { cn } from '@shared/lib/utils'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { path: '/skills',         label: 'Skills',        icon: Code2      },
  { path: '/occupations',    label: 'Occupations',   icon: Briefcase  },
  { path: '/projects',       label: 'Projects',      icon: FolderOpen },
  { path: '/certifications', label: 'Certifications',icon: Award      },
  { path: '/videos',         label: 'Videos',        icon: Video      },
  { path: '/notes',          label: 'Notes',         icon: FileText   },
  { path: '/documents',      label: 'Documents',     icon: File       },
  { path: '/journal',        label: 'Journal',       icon: BookOpen   },
  { path: '/tags',           label: 'Tags',          icon: Tag        },
]

export function Sidebar(): React.ReactElement {
  const isMac = navigator.userAgent.includes('Mac')

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border select-none-children">
      {/* Logo / App name — drag region on macOS */}
      <div
        className={cn(
          'flex items-center px-4 h-12 border-b border-sidebar-border',
          isMac ? 'drag-region pt-1' : '',
        )}
      >
        <div className="no-drag flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
            <Code2 className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">CareerOS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors no-drag',
                    isActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-accent-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'w-4 h-4 shrink-0',
                        isActive ? 'text-primary' : 'text-sidebar-foreground',
                      )}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          type="button"
          className="no-drag flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-accent-foreground transition-colors w-full"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  )
}
