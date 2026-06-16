import { ipcMain } from 'electron'
import { readFileSync } from 'fs'
import { IPC, ok, fail } from './channels'
import { getDatabase } from '../services/database/connection'
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  resolveComment,
  type CreateCommentParams,
  type UpdateCommentParams,
} from '../services/docx/docx-comments.service'

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const mammoth = require('mammoth') as {
  convertToHtml: (
    input: { buffer: Buffer },
    options?: { styleMap?: string[] },
  ) => Promise<{ value: string; messages: Array<{ type: string; message: string }> }>
}

// Style mappings that preserve heading levels, lists, code, and blockquotes
const STYLE_MAP = [
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Heading 5'] => h5:fresh",
  "p[style-name='Heading 6'] => h6:fresh",
  "p[style-name='Code']      => pre > code:fresh",
  "p[style-name='Quote']     => blockquote > p:fresh",
  "r[style-name='Code Char'] => code",
  "b => strong",
  "i => em",
  "u => u",
  "strike => s",
]

/**
 * Post-process mammoth HTML: wrap each top-level block with a section
 * carrying a `data-para-idx` attribute so comments can be anchored by
 * paragraph position without relying on fragile byte offsets in the source file.
 */
function indexParagraphs(html: string): string {
  // Simple regex-based wrap of block-level elements.
  // We don't pull in jsdom to keep the main-process bundle small.
  let idx = 0
  return html.replace(
    /(<(?:p|h[1-6]|ul|ol|pre|blockquote|table|figure)[\s>])/gi,
    (match) => {
      const tagged = `<section data-para-idx="${idx}">` + match
      idx++
      return tagged
    },
  ).replace(
    /<\/(p|h[1-6]|ul|ol|pre|blockquote|table|figure)>/gi,
    (match) => match + '</section>',
  )
}

export function registerDocxViewerHandlers(): void {
  const db = () => getDatabase()

  // Enhanced DOCX → HTML conversion with style mapping + paragraph indexing
  ipcMain.handle(IPC.DOCX_VIEWER.CONVERT, async (_e, filePath: string) => {
    try {
      const buffer = readFileSync(filePath)
      const result = await mammoth.convertToHtml({ buffer }, { styleMap: STYLE_MAP })
      const indexedHtml = indexParagraphs(result.value)
      return ok({
        html: indexedHtml,
        warnings: result.messages
          .filter((m) => m.type === 'warning')
          .map((m) => m.message)
          .slice(0, 10),
      })
    } catch (e) {
      return fail(e instanceof Error ? e.message : 'Failed to convert DOCX')
    }
  })

  // Comments
  ipcMain.handle(IPC.DOCX_VIEWER.COMMENTS.GET, (_e, documentId: string) => {
    try { return ok(getComments(db(), documentId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get comments') }
  })

  ipcMain.handle(IPC.DOCX_VIEWER.COMMENTS.CREATE, (_e, params: CreateCommentParams) => {
    try { return ok(createComment(db(), params)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to create comment') }
  })

  ipcMain.handle(IPC.DOCX_VIEWER.COMMENTS.UPDATE, (_e, id: string, params: UpdateCommentParams) => {
    try { return ok(updateComment(db(), id, params)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update comment') }
  })

  ipcMain.handle(IPC.DOCX_VIEWER.COMMENTS.DELETE, (_e, id: string) => {
    try { return ok(deleteComment(db(), id)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete comment') }
  })

  ipcMain.handle(IPC.DOCX_VIEWER.COMMENTS.RESOLVE, (_e, id: string) => {
    try { return ok(resolveComment(db(), id)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to resolve comment') }
  })
}
