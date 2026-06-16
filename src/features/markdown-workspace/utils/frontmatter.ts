export function parseFrontmatter(content: string): {
  frontmatter: Record<string, string | number | null>
  body: string
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(content)
  if (!match) return { frontmatter: {}, body: content }
  try {
    const yaml = match[1] ?? ''
    const fm: Record<string, string | number | null> = {}
    for (const line of yaml.split('\n')) {
      const sep = line.indexOf(':')
      if (sep === -1) continue
      const key = line.slice(0, sep).trim()
      const val = line.slice(sep + 1).trim()
      if (val === '') {
        fm[key] = null
      } else if (/^\d+$/.test(val)) {
        fm[key] = parseInt(val, 10)
      } else {
        fm[key] = val.replace(/^["']|["']$/g, '')
      }
    }
    return { frontmatter: fm, body: (match[2] ?? '').trimStart() }
  } catch {
    return { frontmatter: {}, body: content }
  }
}
