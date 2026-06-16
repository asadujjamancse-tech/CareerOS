import {
  useState, useEffect, useRef, useCallback, useMemo,
  type ChangeEvent, type KeyboardEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Code2, FolderOpen, Award, FlaskConical, MessageSquare,
  FileText, File, Loader2, ArrowRight, X, Clock, ChevronDown,
  ChevronUp, Trash2,
} from 'lucide-react'
import { api } from '@shared/lib/ipc-client'
import { cn } from '@shared/lib/utils'
import type { SearchResult } from '@shared/types/entities'
import type { SearchHistoryItem } from '@shared/types/ipc.types'

// ── Module configuration ──────────────────────────────────────────────────────

interface ModuleMeta {
  label: string
  icon: React.ElementType
  color: string
  route: string
}

const MODULES: Record<string, ModuleMeta> = {
  skill:              { label: 'Skills',           icon: Code2,         color: 'text-blue-400',   route: '/skills'               },
  project:            { label: 'Projects',         icon: FolderOpen,    color: 'text-green-400',  route: '/projects'             },
  certification:      { label: 'Certifications',   icon: Award,         color: 'text-amber-400',  route: '/certifications'       },
  home_lab:           { label: 'Home Labs',        icon: FlaskConical,  color: 'text-purple-400', route: '/home-lab'             },
  interview_question: { label: 'Interview Bank',   icon: MessageSquare, color: 'text-pink-400',   route: '/interview-questions'  },
  note:               { label: 'Notes',            icon: FileText,      color: 'text-yellow-400', route: '/notes'                },
  document:           { label: 'Documents',        icon: File,          color: 'text-sky-400',    route: '/documents'            },
}

const MODULE_ORDER = [
  'skill', 'project', 'certification', 'home_lab',
  'interview_question', 'note', 'document',
] as const

const ALL_TYPES = new Set(MODULE_ORDER as unknown as string[])

// ── Highlight helper ──────────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <span>{text}</span>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <span>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-primary/25 text-foreground rounded-sm px-0.5 not-italic">{p}</mark>
          : <span key={i}>{p}</span>,
      )}
    </span>
  )
}

// ── Result item ───────────────────────────────────────────────────────────────

function ResultItem({
  result, query, isLast, onClick,
}: {
  result: SearchResult
  query: string
  isLast: boolean
  onClick: () => void
}) {
  const m = MODULES[result.entity_type]
  const Icon = m?.icon ?? Search

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors group',
        !isLast && 'border-b border-border',
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', m?.color ?? 'text-muted-foreground')} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-sm font-medium">
            <Highlight text={result.title} query={query} />
          </p>
          {result.subtitle && (
            <span className="text-xs text-muted-foreground capitalize shrink-0">
              {result.subtitle}
            </span>
          )}
        </div>
        {result.excerpt && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            <Highlight text={result.excerpt} query={query} />
          </p>
        )}
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 transition-opacity" />
    </button>
  )
}

// ── Result group ──────────────────────────────────────────────────────────────

const INITIAL_VISIBLE = 4

function ResultGroup({
  type, results, query, onNavigate,
}: {
  type: string
  results: SearchResult[]
  query: string
  onNavigate: (route: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const m = MODULES[type]
  if (!m) return null
  const Icon = m.icon
  const visible = collapsed ? results.slice(0, INITIAL_VISIBLE) : results
  const canToggle = results.length > INITIAL_VISIBLE

  return (
    <div className="mb-5">
      {/* Group header */}
      <button
        type="button"
        onClick={() => canToggle && setCollapsed((c) => !c)}
        className={cn(
          'flex items-center gap-2 w-full text-left mb-2',
          canToggle && 'cursor-pointer group',
          !canToggle && 'cursor-default',
        )}
      >
        <Icon className={cn('h-4 w-4 shrink-0', m.color)} />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
          {m.label}
        </span>
        <span className="text-xs text-muted-foreground">({results.length})</span>
        <div className="flex-1" />
        {canToggle && (
          <>
            <span className="text-xs text-muted-foreground mr-1">
              {collapsed ? `+${results.length - INITIAL_VISIBLE} more` : 'Collapse'}
            </span>
            {collapsed
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </>
        )}
      </button>

      {/* Results card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {visible.map((r, i) => (
          <ResultItem
            key={r.entity_id}
            result={r}
            query={query}
            isLast={i === visible.length - 1}
            onClick={() => onNavigate(m.route)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  history, onSelectHistory, onClearHistory, onNavigate,
}: {
  history: SearchHistoryItem[]
  onSelectHistory: (q: string) => void
  onClearHistory: () => void
  onNavigate: (route: string) => void
}) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      {/* Recent searches */}
      {history.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Recent Searches</h3>
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          </div>
          <div className="space-y-0.5 rounded-xl border border-border bg-card overflow-hidden">
            {history.slice(0, 10).map((h, i, arr) => (
              <button
                key={h.id}
                type="button"
                onClick={() => onSelectHistory(h.query)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-accent transition-colors group',
                  i < arr.length - 1 && 'border-b border-border',
                )}
              >
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{h.query}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {h.result_count > 0 ? `${h.result_count} results` : 'No results'}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Module quick-access grid */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Browse Modules</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {MODULE_ORDER.map((type) => {
            const m = MODULES[type]
            if (!m) return null
            return (
              <button
                key={type}
                type="button"
                onClick={() => onNavigate(m.route)}
                className="flex items-center gap-2.5 p-3.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-left"
              >
                <m.icon className={cn('h-4 w-4 shrink-0', m.color)} />
                <span className="text-sm">{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function GlobalSearchPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [rawResults, setRawResults] = useState<SearchResult[]>([])
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(ALL_TYPES))

  // Load history on mount
  useEffect(() => {
    void (async () => {
      const res = await api.search.history.get(20)
      if (res.success) setHistory(res.data as SearchHistoryItem[])
    })()
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  // Filtered + grouped results (client-side filter by selected types)
  const filteredResults = useMemo(
    () => rawResults.filter((r) => selectedTypes.has(r.entity_type)),
    [rawResults, selectedTypes],
  )

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    for (const r of filteredResults) {
      groups[r.entity_type] ??= []
      groups[r.entity_type]!.push(r)
    }
    return groups
  }, [filteredResults])

  const activeModuleOrder = useMemo(
    () => MODULE_ORDER.filter((t) => (groupedResults[t]?.length ?? 0) > 0),
    [groupedResults],
  )

  const totalCount = filteredResults.length
  const hasSearched = submittedQuery.length > 0

  // Suggestions from history matching current query
  const suggestions = useMemo(() => {
    if (!query.trim()) return history.slice(0, 8)
    const lower = query.toLowerCase()
    return history.filter((h) => h.query.toLowerCase().includes(lower)).slice(0, 6)
  }, [query, history])

  // Perform search
  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setRawResults([])
      setSubmittedQuery('')
      return
    }
    setIsLoading(true)
    try {
      const res = await api.search.global(q)
      if (res.success) {
        setRawResults(res.data as SearchResult[])
        setSubmittedQuery(q)
        // Refresh history after search (IPC auto-upserts)
        const hist = await api.search.history.get(20)
        if (hist.success) setHistory(hist.data as SearchHistoryItem[])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    setFocusedIdx(-1)
    setShowDropdown(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void runSearch(v), 200)
  }

  const handleSelectSuggestion = (q: string) => {
    setQuery(q)
    setShowDropdown(false)
    setFocusedIdx(-1)
    void runSearch(q)
  }

  const handleClear = () => {
    setQuery('')
    setRawResults([])
    setSubmittedQuery('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const handleClearHistory = async () => {
    await api.search.history.clear()
    setHistory([])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (showDropdown) { setShowDropdown(false); return }
      handleClear()
      return
    }
    if (!showDropdown || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      e.preventDefault()
      const sug = suggestions[focusedIdx]
      if (sug) handleSelectSuggestion(sug.query)
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !inputRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Filter chip toggles
  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type) // always keep at least one
      } else {
        next.add(type)
      }
      return next
    })
  }

  const isAllSelected = selectedTypes.size === ALL_TYPES.size

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedTypes(new Set([MODULE_ORDER[0]]))
    } else {
      setSelectedTypes(new Set(ALL_TYPES))
    }
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border bg-background z-10">
        <div className="max-w-3xl mx-auto">

          {/* Search input */}
          <div className="relative">
            <div className="relative">
              {isLoading
                ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              }
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search skills, notes, labs, projects, documents, certifications, interview questions…"
                className="w-full h-11 rounded-xl border border-border bg-card pl-10 pr-10 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60
                           placeholder:text-muted-foreground transition-shadow"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Suggestions dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground">
                    {query.trim() ? 'Matching recent searches' : 'Recent searches'}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleClearHistory()}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {suggestions.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(s.query)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:bg-accent',
                      i === focusedIdx && 'bg-accent',
                      i < suggestions.length - 1 && 'border-b border-border/50',
                    )}
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{s.query}</span>
                    {s.result_count > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {s.result_count} results
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <button
              type="button"
              onClick={toggleAll}
              className={cn(
                'px-2.5 py-1 text-xs rounded-full border transition-colors',
                isAllSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-accent',
              )}
            >
              All
            </button>
            {MODULE_ORDER.map((type) => {
              const m = MODULES[type]
              if (!m) return null
              const active = selectedTypes.has(type)
              const count = groupedResults[type]?.length ?? 0
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-colors',
                    active
                      ? 'bg-accent border-border/80 text-foreground'
                      : 'border-border text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/50',
                  )}
                >
                  <m.icon className={cn('h-3 w-3', m.color)} />
                  {m.label}
                  {hasSearched && count > 0 && (
                    <span className="font-semibold tabular-nums">{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Stats line */}
          {hasSearched && !isLoading && (
            <p className="text-xs text-muted-foreground mt-2">
              {totalCount === 0
                ? `No results for "${submittedQuery}"`
                : `${totalCount} result${totalCount !== 1 ? 's' : ''} for "${submittedQuery}"`}
              {selectedTypes.size < ALL_TYPES.size && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="ml-2 underline hover:text-foreground"
                >
                  search all modules
                </button>
              )}
            </p>
          )}
        </div>
      </div>

      {/* ── Results / empty state ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Empty (no search submitted) */}
        {!hasSearched && !isLoading && (
          <EmptyState
            history={history}
            onSelectHistory={handleSelectSuggestion}
            onClearHistory={() => void handleClearHistory()}
            onNavigate={(r) => navigate(r)}
          />
        )}

        {/* No results */}
        {hasSearched && !isLoading && totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <Search className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="text-base font-semibold text-muted-foreground">No results found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Try a different search term, or remove filters to search across all modules.
            </p>
            {!isAllSelected && (
              <button
                type="button"
                onClick={toggleAll}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Search all modules
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {hasSearched && totalCount > 0 && (
          <div className="max-w-3xl mx-auto px-6 py-4">
            {activeModuleOrder.map((type) => {
              const group = groupedResults[type]
              if (!group?.length) return null
              return (
                <ResultGroup
                  key={type}
                  type={type}
                  results={group}
                  query={submittedQuery}
                  onNavigate={(route) => navigate(route)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
