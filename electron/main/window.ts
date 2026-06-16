import { BrowserWindow, shell, screen } from 'electron'
import { join } from 'path'

const RENDERER_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: file: https://*.ytimg.com https://*.ggpht.com https://i.vimeocdn.com",
  "font-src 'self' data: file:",
  "connect-src 'self' ws://localhost:* wss://localhost:* file:",
  "media-src 'self' blob: file:",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://*.googlevideo.com https://player.vimeo.com https://vimeo.com",
].join('; ')

export function createMainWindow(): BrowserWindow {
  const isMac = process.platform === 'darwin'

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    ...(isMac
      ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 16, y: 16 } }
      : { frame: false }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      webviewTag: true,
    },
  })

  // Inject CSP into response headers for the renderer URLs (dev: localhost, prod: file://).
  // This is authoritative and overrides any headers the dev server might send.
  win.webContents.session.webRequest.onHeadersReceived(
    { urls: ['http://localhost:*/*', 'file://*/*'] },
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [RENDERER_CSP],
        },
      })
    },
  )

  win.on('ready-to-show', () => {
    win.show()
  })

  // Open external links in the system browser, never in the app window
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools()
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

/**
 * Returns metadata for all connected displays so the renderer can offer
 * a multi-monitor picker when opening floating windows.
 */
export function getAllDisplays(): Array<{
  id: number
  label: string
  isPrimary: boolean
  bounds: Electron.Rectangle
}> {
  const primary = screen.getPrimaryDisplay()
  return screen.getAllDisplays().map((d, i) => ({
    id: d.id,
    label: `Display ${i + 1}${d.id === primary.id ? ' (Primary)' : ''}`,
    isPrimary: d.id === primary.id,
    bounds: d.bounds,
  }))
}

/**
 * Opens a small always-on-top floating panel window.
 * The renderer loads the same app bundle and navigates to /workspace/float
 * with query params describing the panel type and content.
 *
 * @param type      WorkspacePanelComponent name (e.g. "NotesPanel")
 * @param params    Panel-specific params forwarded as query string
 * @param displayId Optional Electron display id; defaults to primary display
 */
export function createFloatingWindow(
  type: string,
  params: Record<string, unknown> = {},
  displayId?: number,
): BrowserWindow {
  const targetDisplay = displayId
    ? (screen.getAllDisplays().find(d => d.id === displayId) ?? screen.getPrimaryDisplay())
    : screen.getPrimaryDisplay()

  const { bounds } = targetDisplay

  const win = new BrowserWindow({
    width: 420,
    height: 560,
    x: bounds.x + bounds.width - 440,
    y: bounds.y + 60,
    alwaysOnTop: true,
    frame: false,
    transparent: false,
    skipTaskbar: true,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  const query = new URLSearchParams({
    type,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  }).toString()

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/workspace/float?${query}`)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'), { hash: `/workspace/float?${query}` })
  }

  return win
}
