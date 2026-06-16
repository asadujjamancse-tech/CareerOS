import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllNodes,
  createNode,
  updateNode,
  deleteNode,
  getAllLinks,
  createLink,
  deleteLink,
  getGraph,
  searchEntities,
  type CreateNodeParams,
  type UpdateNodeParams,
  type CreateLinkParams,
  type KgEntityType,
} from '../services/knowledge-graph/knowledge-graph.service'

export function registerKnowledgeGraphHandlers(): void {
  const KG = IPC.KNOWLEDGE_GRAPH

  // ── Graph ─────────────────────────────────────────────────────────────────

  ipcMain.handle(KG.GET_GRAPH, () => {
    try {
      return ok(getGraph(getDatabase()))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to load knowledge graph')
    }
  })

  ipcMain.handle(KG.SEARCH_ENTITIES, (_event, query: string, entityType?: KgEntityType) => {
    try {
      return ok(searchEntities(getDatabase(), query ?? '', entityType))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to search entities')
    }
  })

  // ── Nodes ─────────────────────────────────────────────────────────────────

  ipcMain.handle(KG.NODES.GET_ALL, () => {
    try {
      return ok(getAllNodes(getDatabase()))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch nodes')
    }
  })

  ipcMain.handle(KG.NODES.CREATE, (_event, params: CreateNodeParams) => {
    try {
      if (!params?.label?.trim()) return fail('Label is required', 'VALIDATION')
      if (!params?.entity_type) return fail('Entity type is required', 'VALIDATION')
      return ok(createNode(getDatabase(), params))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to create node')
    }
  })

  ipcMain.handle(KG.NODES.UPDATE, (_event, id: string, params: UpdateNodeParams) => {
    try {
      if (!id) return fail('ID is required', 'VALIDATION')
      const node = updateNode(getDatabase(), id, params)
      if (!node) return fail('Node not found', 'NOT_FOUND')
      return ok(node)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to update node')
    }
  })

  ipcMain.handle(KG.NODES.DELETE, (_event, id: string) => {
    try {
      const deleted = deleteNode(getDatabase(), id)
      if (!deleted) return fail('Node not found', 'NOT_FOUND')
      return ok(true)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to delete node')
    }
  })

  // ── Links ─────────────────────────────────────────────────────────────────

  ipcMain.handle(KG.LINKS.GET_ALL, () => {
    try {
      return ok(getAllLinks(getDatabase()))
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to fetch links')
    }
  })

  ipcMain.handle(KG.LINKS.CREATE, (_event, params: CreateLinkParams) => {
    try {
      if (!params?.source_id || !params?.target_id) return fail('Source and target are required', 'VALIDATION')
      if (params.source_id === params.target_id) return fail('Cannot link a node to itself', 'VALIDATION')
      const link = createLink(getDatabase(), params)
      if (!link) return fail('Link already exists or nodes not found', 'CONFLICT')
      return ok(link)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to create link')
    }
  })

  ipcMain.handle(KG.LINKS.DELETE, (_event, id: string) => {
    try {
      const deleted = deleteLink(getDatabase(), id)
      if (!deleted) return fail('Link not found', 'NOT_FOUND')
      return ok(true)
    } catch (err) {
      return fail(err instanceof Error ? err.message : 'Failed to delete link')
    }
  })
}
