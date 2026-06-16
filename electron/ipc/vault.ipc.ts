import { ipcMain } from 'electron'
import { readFileSync } from 'fs'
import { IPC, ok, fail } from './channels'

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const mammoth = require('mammoth') as {
  convertToHtml: (input: { buffer: Buffer }) => Promise<{ value: string; messages: unknown[] }>
}

export function registerVaultHandlers(): void {
  ipcMain.handle(IPC.VAULT.CONVERT_DOCX, async (_e, filePath: string) => {
    try {
      const buffer = readFileSync(filePath)
      const result = await mammoth.convertToHtml({ buffer })
      return ok({ html: result.value })
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to convert DOCX') }
  })

  ipcMain.handle(IPC.VAULT.READ_TEXT, (_e, filePath: string) => {
    try {
      const content = readFileSync(filePath, 'utf-8')
      return ok({ content })
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to read file') }
  })

  ipcMain.handle(IPC.VAULT.READ_PDF_BUFFER, (_e, filePath: string) => {
    try {
      const buffer = readFileSync(filePath)
      return ok({ data: buffer.toString('base64') })
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to read PDF') }
  })

  ipcMain.handle(IPC.VAULT.GET_PDF_PATH, (_e, filePath: string) => {
    // Returns the absolute file:// path for Electron to load in a WebView
    try {
      readFileSync(filePath) // verify file exists and is readable
      return ok({ path: filePath })
    }
    catch (e) { return fail(e instanceof Error ? e.message : 'File not accessible') }
  })
}
