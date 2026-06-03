import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './window'
import { registerIpcHandlers } from '../ipc'
import { runMigrations } from '../services/database/migrations/runner'
import { closeDatabase } from '../services/database/connection'

function bootstrap(): void {
  runMigrations()
  registerIpcHandlers()
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
