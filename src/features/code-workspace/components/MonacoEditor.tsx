import { useRef, useEffect } from 'react'
import Editor, { type OnMount, type Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import './monacoSetup'
import type { EditorSettings } from '../types/code-workspace.types'
import { MONACO_LANGUAGE_ID, type CodeLanguage } from '../types/code-workspace.types'

interface MonacoEditorProps {
  fileId: string
  value: string
  language: CodeLanguage
  settings: EditorSettings
  onChange: (value: string) => void
  onCursorChange: (line: number, col: number) => void
}

let tsConfigured = false

function configureTypeScript(monaco: Monaco) {
  if (tsConfigured) return
  tsConfigured = true

  const tsDefaults = monaco.languages.typescript.typescriptDefaults
  const jsDefaults = monaco.languages.typescript.javascriptDefaults

  const sharedOptions = {
    target: monaco.languages.typescript.ScriptTarget.Latest,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    allowJs: true,
  }

  tsDefaults.setCompilerOptions(sharedOptions)
  jsDefaults.setCompilerOptions({ ...sharedOptions, checkJs: false })

  // Suppress "cannot find module" errors common in standalone code editors
  tsDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    diagnosticCodesToIgnore: [2307, 2304, 2580],
  })
}

export function MonacoEditor({
  fileId,
  value,
  language,
  settings,
  onChange,
  onCursorChange,
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  // Sync value when it changes externally (e.g. loading persisted content)
  useEffect(() => {
    const ed = editorRef.current
    if (!ed) return
    const model = ed.getModel()
    if (model && model.getValue() !== value) {
      model.setValue(value)
    }
  }, [value, fileId])

  const handleMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance
    configureTypeScript(monaco)
    editorInstance.onDidChangeCursorPosition((e) => {
      onCursorChange(e.position.lineNumber, e.position.column)
    })
    editorInstance.focus()
  }

  const monacoOptions: editor.IStandaloneEditorConstructionOptions = {
    readOnly:                   settings.readOnly,
    lineNumbers:                settings.lineNumbers,
    minimap:                    { enabled: settings.minimap },
    wordWrap:                   settings.wordWrap,
    fontSize:                   settings.fontSize,
    tabSize:                    settings.tabSize,
    insertSpaces:               true,
    scrollBeyondLastLine:       false,
    renderWhitespace:           'selection',
    automaticLayout:            true,
    cursorBlinking:             'smooth',
    cursorSmoothCaretAnimation: 'on',
    bracketPairColorization:    { enabled: true },
    guides:                     { bracketPairs: true, indentation: true },
    smoothScrolling:            true,
    renderLineHighlight:        'all',
    padding:                    { top: 8, bottom: 8 },
    suggest:                    { preview: true },
    quickSuggestions:           { other: true, comments: false, strings: true },
    formatOnPaste:              true,
    formatOnType:               false,
    folding:                    true,
    foldingHighlight:           true,
    showFoldingControls:        'mouseover',
    glyphMargin:                true,
    fixedOverflowWidgets:       true,
  }

  return (
    <Editor
      key={fileId}
      defaultValue={value}
      language={MONACO_LANGUAGE_ID[language]}
      theme={settings.theme}
      options={monacoOptions}
      onChange={(val) => onChange(val ?? '')}
      onMount={handleMount}
      loading={
        <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-zinc-500 text-sm">
          Loading editor…
        </div>
      }
    />
  )
}
