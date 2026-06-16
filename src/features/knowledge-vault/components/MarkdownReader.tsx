import { useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import { useVaultStore } from '../store/vault.store'
import { PageLoader } from '@shared/components/common/LoadingSpinner'

export function MarkdownReader() {
  const { docContent, docContentLoading, activeDocument, updateReadingProgress } = useVaultStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Track scroll position for reading progress
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const pct = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)
      void updateReadingProgress(1, 1, pct)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [updateReadingProgress])

  if (docContentLoading) return <PageLoader />

  const isCode = activeDocument && !activeDocument.original_filename.toLowerCase().endsWith('.md')

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        {isCode ? (
          <pre className="text-sm whitespace-pre-wrap leading-relaxed font-mono text-zinc-200 bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            {docContent ?? ''}
          </pre>
        ) : (
          <article className="prose prose-invert prose-zinc max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
            prose-p:leading-7 prose-p:text-zinc-300
            prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline
            prose-code:text-amber-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
            prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800
            prose-blockquote:border-l-sky-500 prose-blockquote:text-zinc-400
            prose-strong:text-zinc-100
            prose-th:text-zinc-100 prose-td:text-zinc-300
            prose-hr:border-zinc-800
          ">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkFrontmatter]}
            >
              {docContent ?? ''}
            </ReactMarkdown>
          </article>
        )}
      </div>
    </div>
  )
}
