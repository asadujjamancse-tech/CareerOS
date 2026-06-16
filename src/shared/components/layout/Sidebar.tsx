import { NavLink } from 'react-router-dom'
import {
  Briefcase, FolderOpen, Award,
  Video, FileText, File, BookOpen, Tag, Settings, Code2, Brain,
  FlaskConical, MessageSquare, LayoutDashboard, GraduationCap,
  Layers, Vault, Zap, Monitor, Search, PanelTop, ListVideo, PenLine,
  PenTool, Network,
} from 'lucide-react'
import { cn } from '@shared/lib/utils'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  highlight?: boolean
  group?: string
}

const NAV_ITEMS: NavItem[] = [
  // ── Learning OS ─────────────────────────────────
  { path: '/workspace',            label: 'Workspace',         icon: PanelTop,        highlight: true, group: 'Learning OS' },
  { path: '/learning-dashboard',   label: 'Dashboard',         icon: LayoutDashboard, highlight: true, group: 'Learning OS' },
  { path: '/learning-coach',       label: 'AI Coach',          icon: GraduationCap,   highlight: true, group: 'Learning OS' },
  { path: '/learning-system',      label: 'SRS & Recall',      icon: Layers,          highlight: true, group: 'Learning OS' },
  { path: '/knowledge-vault',      label: 'Knowledge Vault',   icon: Vault,           group: 'Learning OS' },
  { path: '/challenge-center',     label: 'Challenges',        icon: Zap,             group: 'Learning OS' },
  { path: '/scenario-center',      label: 'Scenarios',         icon: Monitor,         group: 'Learning OS' },
  // ── Career OS ────────────────────────────────────
  { path: '/career-intelligence',  label: 'Intelligence',      icon: Brain,           group: 'Career OS' },
  { path: '/knowledge-graph',      label: 'Knowledge Graph',   icon: Network,         group: 'Career OS' },
  { path: '/skills',               label: 'Skills',            icon: Code2,           group: 'Career OS' },
  { path: '/occupations',          label: 'Occupations',       icon: Briefcase,       group: 'Career OS' },
  { path: '/certifications',       label: 'Certifications',    icon: Award,           group: 'Career OS' },
  { path: '/projects',             label: 'Projects',          icon: FolderOpen,      group: 'Career OS' },
  { path: '/home-lab',             label: 'Home Labs',         icon: FlaskConical,    group: 'Career OS' },
  { path: '/interview-questions',  label: 'Interview Bank',    icon: MessageSquare,   group: 'Career OS' },
  // ── Knowledge ────────────────────────────────────
  { path: '/code-workspace',        label: 'Code Workspace',    icon: Code2,           group: 'Knowledge' },
  { path: '/whiteboard',            label: 'Whiteboard',        icon: PenTool,         group: 'Knowledge' },
  { path: '/markdown-workspace',   label: 'Markdown',          icon: PenLine,         group: 'Knowledge' },
  { path: '/notes',                label: 'Notes',             icon: FileText,        group: 'Knowledge' },
  { path: '/documents',            label: 'Documents',         icon: File,            group: 'Knowledge' },
  { path: '/videos',               label: 'Videos',            icon: Video,           group: 'Knowledge' },
  { path: '/playlists',            label: 'Playlists',         icon: ListVideo,       group: 'Knowledge' },
  { path: '/journal',              label: 'Journal',           icon: BookOpen,        group: 'Knowledge' },
  { path: '/tags',                 label: 'Tags',              icon: Tag,             group: 'Knowledge' },
]

const GROUP_ORDER = ['Learning OS', 'Career OS', 'Knowledge']

function groupItems(items: NavItem[]): Array<{ group: string; items: NavItem[] }> {
  const map = new Map<string, NavItem[]>()
  for (const item of items) {
    const g = item.group ?? 'Other'
    if (!map.has(g)) map.set(g, [])
    map.get(g)!.push(item)
  }
  return GROUP_ORDER
    .filter(g => map.has(g))
    .map(g => ({ group: g, items: map.get(g)! }))
}

const GROUPED = groupItems(NAV_ITEMS)

export function Sidebar(): React.ReactElement {
  return (
    <aside className="w-56 shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border select-none-children">
      {/* Search */}
      <div className="p-2 pb-0">
        <NavLink
          to="/search"
          className={({ isActive }) =>
            cn(
              'no-drag flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors w-full',
              isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-accent-foreground border border-border',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Search className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span>Search</span>
            </>
          )}
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {GROUPED.map(({ group, items }) => (
          <div key={group} className="mb-3">
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors no-drag',
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : item.highlight
                            ? 'text-primary hover:bg-primary/10 hover:text-primary font-medium border border-primary/20 bg-primary/5'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-accent-foreground',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'w-4 h-4 shrink-0',
                            isActive ? 'text-primary' : item.highlight ? 'text-primary' : 'text-sidebar-foreground',
                          )}
                        />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
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
