import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  addDocumentToCollection,
  removeDocumentFromCollection,
  getCollectionDocumentIds,
  getFavoriteDocumentIds,
  toggleFavorite,
  trackRecentFile,
  getRecentDocumentIds,
  clearRecentFiles,
  renameDocument,
} from '../services/vault/vault-collections.service'

export function registerKnowledgeVaultHandlers(): void {
  const db = () => getDatabase()

  // ── Collections ────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.VAULT_COLLECTIONS.GET_ALL, () => {
    try { return ok(getAllCollections(db())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get collections') }
  })

  ipcMain.handle(IPC.VAULT_COLLECTIONS.CREATE, (_e, params: unknown) => {
    try { return ok(createCollection(db(), params as Parameters<typeof createCollection>[1])) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to create collection') }
  })

  ipcMain.handle(IPC.VAULT_COLLECTIONS.UPDATE, (_e, id: string, params: unknown) => {
    try {
      const result = updateCollection(db(), id, params as Parameters<typeof updateCollection>[2])
      return result ? ok(result) : fail('Collection not found', 'NOT_FOUND')
    } catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update collection') }
  })

  ipcMain.handle(IPC.VAULT_COLLECTIONS.DELETE, (_e, id: string) => {
    try { return ok(deleteCollection(db(), id)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete collection') }
  })

  ipcMain.handle(IPC.VAULT_COLLECTIONS.ADD_DOCUMENT, (_e, collectionId: string, documentId: string) => {
    try { addDocumentToCollection(db(), collectionId, documentId); return ok(undefined) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to add document to collection') }
  })

  ipcMain.handle(IPC.VAULT_COLLECTIONS.REMOVE_DOCUMENT, (_e, collectionId: string, documentId: string) => {
    try { removeDocumentFromCollection(db(), collectionId, documentId); return ok(undefined) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to remove document from collection') }
  })

  ipcMain.handle(IPC.VAULT_COLLECTIONS.GET_DOCUMENT_IDS, (_e, collectionId: string) => {
    try { return ok(getCollectionDocumentIds(db(), collectionId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get collection document IDs') }
  })

  // ── Favorites ──────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.VAULT_FAVORITES.GET_ALL, () => {
    try { return ok(getFavoriteDocumentIds(db())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get favorites') }
  })

  ipcMain.handle(IPC.VAULT_FAVORITES.TOGGLE, (_e, documentId: string) => {
    try { return ok(toggleFavorite(db(), documentId)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to toggle favorite') }
  })

  // ── Recent Files ───────────────────────────────────────────────────────────

  ipcMain.handle(IPC.VAULT_RECENT.GET_ALL, (_e, limit?: number) => {
    try { return ok(getRecentDocumentIds(db(), limit)) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get recent files') }
  })

  ipcMain.handle(IPC.VAULT_RECENT.TRACK, (_e, documentId: string) => {
    try { trackRecentFile(db(), documentId); return ok(undefined) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to track recent file') }
  })

  ipcMain.handle(IPC.VAULT_RECENT.CLEAR, () => {
    try { clearRecentFiles(db()); return ok(undefined) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to clear recent files') }
  })

  // ── Rename ─────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.DOCUMENTS.RENAME, (_e, id: string, newTitle: string, newFilename?: string) => {
    try {
      const result = renameDocument(db(), id, newTitle, newFilename)
      return result ? ok(result) : fail('Document not found', 'NOT_FOUND')
    } catch (e) { return fail(e instanceof Error ? e.message : 'Failed to rename document') }
  })
}
