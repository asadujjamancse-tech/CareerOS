import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllColors, createColor, updateColor, deleteColor, reorderColors,
} from '../services/knowledge-colors/knowledge-colors.service'

export function registerKnowledgeColorsHandlers(): void {
  ipcMain.handle(IPC.KNOWLEDGE_COLORS.GET_ALL, () => {
    try { return ok(getAllColors(getDatabase())) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to get colors') }
  })

  ipcMain.handle(IPC.KNOWLEDGE_COLORS.CREATE, (_e, params: unknown) => {
    try {
      const p = params as Parameters<typeof createColor>[1]
      if (!p.color_hex || !p.name || !p.meaning) return fail('color_hex, name, and meaning are required')
      return ok(createColor(getDatabase(), p))
    }
    catch (e) {
      if (e instanceof Error && e.message.includes('UNIQUE')) return fail('A color with that hex already exists', 'DUPLICATE')
      return fail(e instanceof Error ? e.message : 'Failed to create color')
    }
  })

  ipcMain.handle(IPC.KNOWLEDGE_COLORS.UPDATE, (_e, id: string, params: unknown) => {
    try { return ok(updateColor(getDatabase(), id, params as Parameters<typeof updateColor>[2])) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to update color') }
  })

  ipcMain.handle(IPC.KNOWLEDGE_COLORS.DELETE, (_e, id: string) => {
    try { deleteColor(getDatabase(), id); return ok(null) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to delete color') }
  })

  ipcMain.handle(IPC.KNOWLEDGE_COLORS.REORDER, (_e, orderedIds: string[]) => {
    try { reorderColors(getDatabase(), orderedIds); return ok(null) }
    catch (e) { return fail(e instanceof Error ? e.message : 'Failed to reorder colors') }
  })
}
