import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './window'
import { ipcRegistry } from '../ipc/registry'
import { registerIpcHandlers } from '../ipc'
import { runMigrations } from '../services/database/migrations/runner'
import { closeDatabase } from '../services/database/connection'

function bootstrap(): void {
  // Install the IPC registry patch FIRST — before any handler is registered.
  // This enables duplicate detection and prevents startup crashes.
  ipcRegistry.install()

  // Initialize database schema
  runMigrations()

  // Register all IPC handlers (registry intercepts every ipcMain.handle call)
  registerIpcHandlers()

  // Print startup manifest to console in development
  if (process.env['NODE_ENV'] !== 'production') {
    const report = ipcRegistry.report()
    if (!report.healthy) {
      console.error(
        `[Startup] ⛔ ${report.duplicates.length} duplicate IPC channel(s) detected and blocked. ` +
        `Search *.ipc.ts files for: ${report.duplicates.join(', ')}`,
      )
    }
  }
}

app.whenReady().then(() => {
  bootstrap()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
}).catch((err: unknown) => {
  console.error('App failed to start:', err)
  app.quit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase()
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
