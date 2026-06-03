/**
 * True when running inside the Electron desktop app.
 * False when running in a plain browser (e.g. localhost:5173 via `npm run dev`).
 *
 * Electron sets window.api via contextBridge before the renderer boots.
 * A plain browser never sets window.api, so it remains undefined.
 */
export const isElectron: boolean =
  typeof window !== 'undefined' && window.api != null
