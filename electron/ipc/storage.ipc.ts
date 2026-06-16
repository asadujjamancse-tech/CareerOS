import { ipcMain, dialog, app, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import { IPC, ok, fail } from './channels'

function getAttachmentsDir(category: string): string {
  const dir = path.join(app.getPath('home'), 'CareerOS', 'attachments', category)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function registerStorageHandlers(): void {
  ipcMain.handle(
    IPC.STORAGE.IMPORT_FILE,
    async (_e, options: { category: string; accept?: string[]; title?: string }) => {
      try {
        const result = await dialog.showOpenDialog({
          title: options.title ?? 'Select a file',
          properties: ['openFile'],
          filters: options.accept?.length
            ? [{ name: 'Files', extensions: options.accept }]
            : [{ name: 'All Files', extensions: ['*'] }],
        })

        if (result.canceled || !result.filePaths[0]) {
          return fail('No file selected')
        }

        const srcPath = result.filePaths[0]
        const originalName = path.basename(srcPath)
        const stat = fs.statSync(srcPath)
        const ext = path.extname(originalName)
        const destDir = getAttachmentsDir(options.category)
        const timestamp = Date.now()
        const destName = `${timestamp}_${originalName}`
        const destPath = path.join(destDir, destName)

        fs.copyFileSync(srcPath, destPath)

        const mimeType = getMimeType(ext)

        return ok({
          path: destPath,
          originalName,
          size: stat.size,
          mimeType,
        })
      } catch (err) {
        return fail(err instanceof Error ? err.message : 'Failed to import file')
      }
    },
  )

  ipcMain.handle(
    IPC.STORAGE.IMPORT_FILES,
    async (_e, options: { category: string; accept?: string[]; title?: string }) => {
      try {
        const result = await dialog.showOpenDialog({
          title: options.title ?? 'Select files',
          properties: ['openFile', 'multiSelections'],
          filters: options.accept?.length
            ? [{ name: 'Files', extensions: options.accept }]
            : [{ name: 'All Files', extensions: ['*'] }],
        })

        if (result.canceled || !result.filePaths.length) {
          return fail('No files selected')
        }

        const destDir = getAttachmentsDir(options.category)
        const items = result.filePaths.map((srcPath) => {
          const originalName = path.basename(srcPath)
          const stat = fs.statSync(srcPath)
          const ext = path.extname(originalName)
          const timestamp = Date.now()
          const destName = `${timestamp}_${originalName}`
          const destPath = path.join(destDir, destName)
          fs.copyFileSync(srcPath, destPath)
          return {
            path: destPath,
            originalName,
            size: stat.size,
            mimeType: getMimeType(ext),
          }
        })

        return ok({ items })
      } catch (err) {
        return fail(err instanceof Error ? err.message : 'Failed to import files')
      }
    },
  )

  ipcMain.handle(IPC.STORAGE.OPEN_FILE, async (_e, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) return fail('File not found on disk')
      const errMsg = await shell.openPath(filePath)
      if (errMsg) return fail(`Could not open file: ${errMsg}`)
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to open file') }
  })

  ipcMain.handle(IPC.STORAGE.SHOW_IN_FOLDER, (_e, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to show file') }
  })
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.zip':  'application/zip',
    '.js':   'text/javascript',
    '.ts':   'text/typescript',
    '.jsx':  'text/jsx',
    '.tsx':  'text/tsx',
    '.json': 'application/json',
    '.html': 'text/html',
    '.css':  'text/css',
  }
  return map[ext.toLowerCase()] ?? 'application/octet-stream'
}
