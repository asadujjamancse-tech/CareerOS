export type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'typescriptreact'
  | 'javascriptreact'
  | 'python'
  | 'java'
  | 'json'
  | 'yaml'
  | 'html'
  | 'css'
  | 'markdown'

export type EditorTheme = 'vs-dark' | 'vs' | 'hc-black' | 'hc-light'
export type LineNumbersOption = 'on' | 'off' | 'relative'

export interface CodeFolder {
  id: string
  parent_id: string | null
  name: string
  sort_order: number
  created_at: string
}

export interface CodeFile {
  id: string
  folder_id: string | null
  title: string
  language: CodeLanguage
  content: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface EditorSettings {
  theme: EditorTheme
  lineNumbers: LineNumbersOption
  minimap: boolean
  readOnly: boolean
  wordWrap: 'on' | 'off'
  fontSize: number
  tabSize: number
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  theme: 'vs-dark',
  lineNumbers: 'on',
  minimap: true,
  readOnly: false,
  wordWrap: 'off',
  fontSize: 14,
  tabSize: 2,
}

export const CODE_LANGUAGES: CodeLanguage[] = [
  'typescript', 'typescriptreact', 'javascript', 'javascriptreact',
  'python', 'java', 'json', 'yaml', 'html', 'css', 'markdown',
]

export const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  typescript:       'TypeScript',
  typescriptreact:  'TypeScript (TSX)',
  javascript:       'JavaScript',
  javascriptreact:  'JavaScript (JSX)',
  python:           'Python',
  java:             'Java',
  json:             'JSON',
  yaml:             'YAML',
  html:             'HTML',
  css:              'CSS',
  markdown:         'Markdown',
}

export const LANGUAGE_ICONS: Record<CodeLanguage, string> = {
  typescript:       'TS',
  typescriptreact:  'TSX',
  javascript:       'JS',
  javascriptreact:  'JSX',
  python:           'PY',
  java:             'JV',
  json:             'JSON',
  yaml:             'YML',
  html:             'HTM',
  css:              'CSS',
  markdown:         'MD',
}

export const LANGUAGE_COLORS: Record<CodeLanguage, string> = {
  typescript:       'text-blue-400',
  typescriptreact:  'text-cyan-400',
  javascript:       'text-yellow-400',
  javascriptreact:  'text-yellow-300',
  python:           'text-green-400',
  java:             'text-orange-400',
  json:             'text-amber-400',
  yaml:             'text-lime-400',
  html:             'text-red-400',
  css:              'text-purple-400',
  markdown:         'text-zinc-400',
}

export const THEME_LABELS: Record<EditorTheme, string> = {
  'vs-dark':  'Dark',
  'vs':       'Light',
  'hc-black': 'High Contrast Dark',
  'hc-light': 'High Contrast Light',
}

// Monaco uses different language IDs for TSX/JSX
export const MONACO_LANGUAGE_ID: Record<CodeLanguage, string> = {
  typescript:       'typescript',
  typescriptreact:  'typescript',
  javascript:       'javascript',
  javascriptreact:  'javascript',
  python:           'python',
  java:             'java',
  json:             'json',
  yaml:             'yaml',
  html:             'html',
  css:              'css',
  markdown:         'markdown',
}

export interface CreateCodeFileInput {
  title: string
  language: CodeLanguage
  content?: string
  folder_id?: string | null
}

export interface UpdateCodeFileInput {
  title?: string
  language?: CodeLanguage
  folder_id?: string | null
}

export interface CreateCodeFolderInput {
  name: string
  parent_id?: string | null
}

export interface UpdateCodeFolderInput {
  name?: string
  parent_id?: string | null
}
