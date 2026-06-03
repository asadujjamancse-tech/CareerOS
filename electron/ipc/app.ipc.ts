import { ipcMain, app } from 'electron'
import path from 'path'
import { IPC, ok } from './channels'

export function registerAppHandlers(): void {
  ipcMain.handle(IPC.APP.GET_VERSION, () => ok(app.getVersion()))

  ipcMain.handle(IPC.APP.GET_PATHS, () => {
    const home = app.getPath('home')
    const dataDir = path.join(home, 'CareerOS')
    return ok({
      userData: app.getPath('userData'),
      documents: app.getPath('documents'),
      home,
      data: dataDir,
      database: path.join(dataDir, 'careeros.db'),
      attachments: path.join(dataDir, 'attachments'),
      exports: path.join(dataDir, 'exports'),
      backups: path.join(dataDir, 'backups'),
    })
  })
}
