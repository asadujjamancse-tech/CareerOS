/**
 * MarkdownPreview — renders markdown with:
 *  - GitHub Flavored Markdown (tables, strikethrough, task lists)
 *  - Frontmatter display (parsed YAML shown as metadata bar)
 *  - Syntax-highlighted code blocks via highlight.js
 *  - Mermaid diagram blocks
 */

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { MermaidBlock } from './MermaidBlock'
import { parseFrontmatter } from '../utils/frontmatter'
import type { Components } from 'react-markdown'

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const { frontmatter, body } = parseFrontmatter(content)
  const hasFrontmatter = Object.keys(frontmatter).length > 0

  const components: Components = {
    // Custom code block handler: route ```mermaid to MermaidBlock
    code({ className, children, ...props }) {
      const lang = /language-(\w+)/.exec(className ?? '')?.[1] ?? ''
      const isBlock = !props.ref && String(children).includes('\n')

      if (lang === 'mermaid' && isBlock) {
        return <MermaidBlock code={String(children).trim()} />
      }

      if (isBlock) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        )
      }

      return (
        <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[0.85em] font-mono" {...props}>
          {children}
        </code>
      )
    },

    // Tables with scroll wrapper
    table({ children }) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="w-full border-collapse text-sm">{children}</table>
        </div>
      )
    },
    th({ children }) {
      return (
        <th className="border border-zinc-700 bg-zinc-800 px-3 py-2 text-left font-semibold text-zinc-200">
          {children}
        </th>
      )
    },
    td({ children }) {
      return (
        <td className="border border-zinc-700 px-3 py-2 text-zinc-300">{children}</td>
      )
    },

    // Blockquote
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-blue-500 pl-4 my-4 text-zinc-400 italic">
          {children}
        </blockquote>
      )
    },

    // Links open externally
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 underline hover:text-blue-300"
        >
          {children}
        </a>
      )
    },

    // Task list items
    li({ children, className }) {
      if (className === 'task-list-item') {
        return <li className="flex items-start gap-2 list-none">{children}</li>
      }
      return <li className="ml-4 mb-1">{children}</li>
    },

    // Headings
    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-zinc-100 border-b border-zinc-700 pb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-2 text-zinc-100">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-zinc-200">{children}</h3>,
    h4: ({ children }) => <h4 className="text-base font-semibold mt-3 mb-1 text-zinc-200">{children}</h4>,

    // Horizontal rule
    hr: () => <hr className="my-6 border-zinc-700" />,

    // Pre (wraps code blocks)
    pre({ children }) {
      return (
        <pre className="overflow-x-auto rounded-lg border border-zinc-700 bg-zinc-900 p-4 my-4 text-sm leading-relaxed">
          {children}
        </pre>
      )
    },

    // Paragraph
    p: ({ children }) => <p className="mb-3 leading-relaxed text-zinc-300">{children}</p>,

    // Lists
    ul: ({ children }) => <ul className="mb-3 space-y-1 list-disc pl-5 text-zinc-300">{children}</ul>,
    ol: ({ children }) => <ol className="mb-3 space-y-1 list-decimal pl-5 text-zinc-300">{children}</ol>,

    // Strong / em
    strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
    em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
  }

  return (
    <div className="h-full overflow-y-auto">
      {hasFrontmatter && (
        <div className="mx-4 mt-4 mb-2 rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
          <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">Frontmatter</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(frontmatter).map(([k, v]) => (
              <span key={k} className="text-xs text-zinc-400">
                <span className="text-zinc-500">{k}:</span>{' '}
                <span className="text-zinc-300">{v === null ? 'null' : String(v)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="px-6 py-4 max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkFrontmatter]}
          rehypePlugins={[rehypeHighlight]}
          components={components}
        >
          {body}
        </ReactMarkdown>
      </div>
    </div>
  )
}
