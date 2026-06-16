import { AlignLeft, Map, Lock, Unlock, WrapText, ChevronDown } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import type { CodeFile, EditorSettings, EditorTheme, CodeLanguage } from '../types/code-workspace.types'
import { LANGUAGE_LABELS, THEME_LABELS, CODE_LANGUAGES } from '../types/code-workspace.types'

interface StatusBarProps {
  activeFile: CodeFile | undefined
  cursorLine: number
  cursorColumn: number
  settings: EditorSettings
  isSaving: boolean
  isDirty: boolean
  onSettingsChange: (patch: Partial<EditorSettings>) => void
}

function StatusButton({
  children, title, active, onClick, className,
}: {
  children: React.ReactNode
  title?: string
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 h-full text-[11px] transition-colors',
        active
          ? 'bg-blue-600/30 text-blue-300'
          : 'text-zinc-500 hover:bg-zinc-700/60 hover:text-zinc-300',
        className,
      )}
    >
      {children}
    </button>
  )
}

// Mini inline select
function StatusSelect<T extends string>({
  value,
  options,
  labels,
  onChange,
  title,
  icon,
}: {
  value: T
  options: T[]
  labels: Record<T, string>
  onChange: (v: T) => void
  title?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="relative flex items-center h-full" title={title}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="appearance-none bg-transparent text-zinc-400 hover:text-zinc-200 text-[11px] pl-1 pr-5 h-full cursor-pointer focus:outline-none hover:bg-zinc-700/60 transition-colors"
        style={{ WebkitAppearance: 'none' }}
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-zinc-900 text-zinc-200">
            {labels[opt]}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-1 h-2.5 w-2.5 text-zinc-600 pointer-events-none" />
      {icon && <span className="absolute left-0 pointer-events-none">{icon}</span>}
    </div>
  )
}

export function StatusBar({
  activeFile, cursorLine, cursorColumn, settings, isSaving, isDirty, onSettingsChange,
}: StatusBarProps) {
  const THEME_OPTIONS: EditorTheme[] = ['vs-dark', 'vs', 'hc-black', 'hc-light']

  return (
    <div className="flex items-center h-6 border-t border-zinc-800 bg-[#007acc] text-white shrink-0 text-[11px] select-none overflow-x-auto">
      {/* Save status */}
      <div className="flex items-center px-3 gap-1 border-r border-blue-500/50 h-full shrink-0">
        {isSaving
          ? <span className="text-blue-100">Saving…</span>
          : isDirty
            ? <span className="text-yellow-200">● Modified</span>
            : <span className="text-blue-100">✓ Saved</span>
        }
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Cursor position */}
      {activeFile && (
        <div className="flex items-center px-3 h-full border-l border-blue-500/50 shrink-0">
          <span className="text-blue-100">Ln {cursorLine}, Col {cursorColumn}</span>
        </div>
      )}

      {/* Language selector */}
      {activeFile && (
        <div className="border-l border-blue-500/50 h-full flex items-center shrink-0 bg-blue-700/40 hover:bg-blue-600/40 transition-colors">
          <StatusSelect<CodeLanguage>
            value={activeFile.language}
            options={CODE_LANGUAGES}
            labels={LANGUAGE_LABELS}
            onChange={(lang) => {
              // Update language preference via parent handler
              void lang  // handled by page
            }}
            title="Change language"
          />
        </div>
      )}

      {/* Theme */}
      <div className="border-l border-blue-500/50 h-full flex items-center shrink-0 bg-blue-700/40 hover:bg-blue-600/40 transition-colors">
        <StatusSelect<EditorTheme>
          value={settings.theme}
          options={THEME_OPTIONS}
          labels={THEME_LABELS}
          onChange={(t) => onSettingsChange({ theme: t })}
          title="Color theme"
        />
      </div>

      {/* Line numbers */}
      <div className="border-l border-blue-500/50 h-full flex items-center shrink-0">
        <StatusButton
          title={`Line numbers: ${settings.lineNumbers}`}
          active={settings.lineNumbers !== 'off'}
          onClick={() => onSettingsChange({
            lineNumbers: settings.lineNumbers === 'on' ? 'off' : settings.lineNumbers === 'off' ? 'relative' : 'on'
          })}
        >
          <AlignLeft className="h-3 w-3" />
          <span className="text-blue-100 hidden sm:inline">
            {settings.lineNumbers === 'off' ? 'No Nums' : settings.lineNumbers === 'relative' ? 'Rel Nums' : 'Nums'}
          </span>
        </StatusButton>
      </div>

      {/* Minimap */}
      <div className="border-l border-blue-500/50 h-full flex items-center shrink-0">
        <StatusButton
          title={settings.minimap ? 'Minimap on' : 'Minimap off'}
          active={settings.minimap}
          onClick={() => onSettingsChange({ minimap: !settings.minimap })}
        >
          <Map className="h-3 w-3" />
          <span className="text-blue-100 hidden sm:inline">Minimap</span>
        </StatusButton>
      </div>

      {/* Word wrap */}
      <div className="border-l border-blue-500/50 h-full flex items-center shrink-0">
        <StatusButton
          title={settings.wordWrap === 'on' ? 'Word wrap on' : 'Word wrap off'}
          active={settings.wordWrap === 'on'}
          onClick={() => onSettingsChange({ wordWrap: settings.wordWrap === 'on' ? 'off' : 'on' })}
        >
          <WrapText className="h-3 w-3" />
          <span className="text-blue-100 hidden sm:inline">Wrap</span>
        </StatusButton>
      </div>

      {/* Read-only toggle */}
      <div className="border-l border-blue-500/50 h-full flex items-center shrink-0">
        <StatusButton
          title={settings.readOnly ? 'Read-only mode (click to edit)' : 'Edit mode (click to lock)'}
          active={settings.readOnly}
          onClick={() => onSettingsChange({ readOnly: !settings.readOnly })}
          className={settings.readOnly ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50 hover:text-amber-200' : ''}
        >
          {settings.readOnly
            ? <Lock className="h-3 w-3" />
            : <Unlock className="h-3 w-3" />
          }
          <span className="hidden sm:inline">{settings.readOnly ? 'Read Only' : 'Edit'}</span>
        </StatusButton>
      </div>
    </div>
  )
}
