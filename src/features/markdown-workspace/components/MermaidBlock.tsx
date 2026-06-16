import { useEffect, useRef, useState } from 'react'

let mermaidInitialized = false

async function initMermaid() {
  if (mermaidInitialized) return
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  })
  mermaidInitialized = true
}

let diagramCounter = 0

interface MermaidBlockProps {
  code: string
}

export function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const idRef = useRef(`mermaid-${++diagramCounter}`)

  useEffect(() => {
    let cancelled = false

    const render = async () => {
      try {
        await initMermaid()
        const { default: mermaid } = await import('mermaid')
        const { svg } = await mermaid.render(idRef.current, code)
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Diagram error')
        }
      }
    }

    void render()
    return () => { cancelled = true }
  }, [code])

  if (error) {
    return (
      <div className="rounded border border-red-800/40 bg-red-950/20 px-4 py-3 text-xs text-red-400 font-mono">
        <span className="font-semibold">Mermaid error: </span>{error}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex justify-center py-4 overflow-x-auto [&_svg]:max-w-full"
    />
  )
}
