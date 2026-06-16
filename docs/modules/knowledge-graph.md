# Knowledge Graph Module

## Purpose

The Knowledge Graph module provides a user-curated, interactive visual graph of knowledge entities. Unlike the auto-generated graph embedded in Career Intelligence (which derives connections from relational joins), this module lets users manually create **nodes** representing any entity type and draw **directed links** between them with custom labels and types. It enables visual exploration of how concepts, skills, documents, videos, and other artifacts relate to one another.

---

## Features

- Create named nodes of nine entity types: skill, project, lab, document, video, interview_question, certification, note, concept
- Optionally link a node to an existing database entity via `entity_id` for live data binding
- Draw directed links between nodes with custom labels and link types
- Full-graph view: renders all nodes and links together
- Entity search — search across all entity types (skills, projects, labs, documents, videos, interview questions, certifications, notes) to quickly find entities when adding nodes
- Nodes display a link count badge showing how many connections they have
- Property panel for editing node label, description, and color
- Link panel for viewing and managing outbound/inbound connections
- Shape library for adding new nodes from a palette

---

## Database Tables

| Table | Key Columns | Notes |
|---|---|---|
| `knowledge_nodes` | `id`, `entity_type`, `entity_id` (nullable), `label`, `description`, `color` | `entity_type` CHECK constraint enforces 9 valid types |
| `knowledge_links` | `id`, `source_id` → `knowledge_nodes`, `target_id` → `knowledge_nodes`, `label`, `link_type` | UNIQUE(source_id, target_id) prevents duplicate edges; ON DELETE CASCADE removes links when node is deleted |

**Indexes:** `idx_knowledge_nodes_entity` on `(entity_type, entity_id)`; `idx_knowledge_links_source` and `idx_knowledge_links_target`.

**Migration:** `018_knowledge_graph`

---

## IPC Channels

```
KNOWLEDGE_GRAPH
  knowledge-graph:get-graph         — full graph (all nodes + all links)
  knowledge-graph:search-entities   — search existing entities to pin as nodes

KNOWLEDGE_GRAPH.NODES
  knowledge-graph:nodes:get-all     — all nodes with link_count
  knowledge-graph:nodes:create      — create node
  knowledge-graph:nodes:update      — update label / description / color
  knowledge-graph:nodes:delete      — delete node (cascades links)

KNOWLEDGE_GRAPH.LINKS
  knowledge-graph:links:get-all     — all links with source/target labels
  knowledge-graph:links:create      — create directed link
  knowledge-graph:links:delete      — remove link
```

---

## Service Functions

Located at `electron/services/knowledge-graph/knowledge-graph.service.ts`.

| Function | Purpose |
|---|---|
| `getAllNodes` | SELECT all nodes + computed `link_count` subquery |
| `getNodeById` | Single node with link count |
| `createNode` | INSERT node; `entity_id` is optional for standalone concepts |
| `updateNode` | UPDATE `label`, `description`, `color`; preserves unset fields |
| `deleteNode` | Hard DELETE; cascade removes associated links |
| `getAllLinks` | SELECT all links JOINed to source/target node labels |
| `createLink` | INSERT link; returns `null` on UNIQUE constraint violation (prevents duplicates) |
| `deleteLink` | Hard DELETE by link id |
| `getGraph` | Returns `{ nodes: getAllNodes(), links: getAllLinks() }` |
| `searchEntities` | Queries skills, projects, labs, documents, videos, interview_questions, certifications, notes using LIKE; returns up to 60 results across all types |

---

## State Management

Store location: `src/features/knowledge-graph/store/`

State shape (inferred from component usage):

```typescript
interface KnowledgeGraphState {
  nodes: KgNodeRow[]
  links: KgLinkRow[]
  isLoading: boolean
  error: string | null
  selectedNodeId: string | null
  selectedLinkId: string | null

  // Actions
  fetchGraph: () => Promise<void>
  createNode: (params: CreateNodeParams) => Promise<void>
  updateNode: (id: string, params: UpdateNodeParams) => Promise<void>
  deleteNode: (id: string) => Promise<void>
  createLink: (params: CreateLinkParams) => Promise<void>
  deleteLink: (id: string) => Promise<void>
  searchEntities: (query: string, entityType?: KgEntityType) => Promise<EntitySearchResult[]>
  selectNode: (id: string | null) => void
  selectLink: (id: string | null) => void
}
```

---

## Data Flow

```mermaid
sequenceDiagram
    participant UI as KnowledgeGraphPage
    participant Store as Zustand Store
    participant Preload as contextBridge
    participant IPC as ipcMain
    participant Svc as KnowledgeGraph Service
    participant DB as SQLite

    UI->>Store: fetchGraph()
    Store->>Preload: api.knowledgeGraph.getGraph()
    Preload->>IPC: invoke('knowledge-graph:get-graph')
    IPC->>Svc: getGraph(db)
    Svc->>DB: SELECT knowledge_nodes; SELECT knowledge_links
    DB-->>Svc: { nodes, links }
    IPC-->>Store: { success: true, data: { nodes, links } }
    Store-->>UI: nodes[], links[]

    UI->>Store: createNode(params)
    Store->>Preload: api.knowledgeGraph.nodes.create(params)
    Preload->>IPC: invoke('knowledge-graph:nodes:create', params)
    IPC->>Svc: createNode(db, params)
    Svc->>DB: INSERT INTO knowledge_nodes
    DB-->>Svc: KgNodeRow
    IPC-->>Store: { success: true, data: node }
    Store->>Store: fetchGraph() — refresh full graph
    Store-->>UI: updated nodes[]
```

---

## UI Components

Located at `src/features/knowledge-graph/components/`:

| Component | Role |
|---|---|
| `KnowledgeGraphPage.tsx` | Root page; renders the canvas and side panels |
| `ShapeLibrary.tsx` | Palette for selecting entity type when adding a new node |
| `ToolBar.tsx` | Canvas tool controls (pan, zoom, select, add node, add link) |
| `WhiteboardCanvas.tsx` | SVG/Canvas rendering of the graph; handles pan/zoom and node dragging (note: shared name with whiteboard but distinct context) |
| `PropertyPanel.tsx` | Right panel for editing selected node properties |
| `LinkPanel.tsx` | Panel listing all links for the selected node; allows adding/removing connections |

---

## Dependencies

- **Skills, Projects, Certifications, Notes, Documents, Videos, Home Labs, Interview Questions** — `searchEntities` queries all of these tables so nodes can be bound to real entities
- No other module depends on the Knowledge Graph module

---

## User Workflow

1. Navigate to **Knowledge Graph** (`/knowledge-graph`)
2. The graph canvas loads all existing nodes and links
3. Click **Add Node** from the Shape Library; choose an entity type
4. Optionally search for an existing entity (e.g., a skill) to bind the node
5. Set a label and optional color; save to create the node
6. Select a source node, then click **Add Link** to draw a connection to a target node
7. Label the link (e.g., "requires", "teaches", "tested by") and set a link type
8. Use the Property Panel to update node color or description for visual organization
9. Navigate the graph by panning and zooming the canvas

---

## Known Limitations

- No layout algorithm is applied automatically — nodes are placed at default positions and must be repositioned manually
- The graph does not auto-populate from relational data (use the Career Intelligence Knowledge Graph tab for that); all nodes are user-created
- No import/export of the graph structure
- No grouping or clustering of node sets
- Duplicate links between the same pair of nodes are prevented by UNIQUE constraint, but no UI warning is shown on the attempt
- Not determined from source: whether node positions are persisted to the database or reset on each load

---

## Future Roadmap

- Persist node positions (x, y coordinates) to the database
- Auto-layout algorithms (force-directed, hierarchical)
- Cluster/group nodes by entity type or tag
- Export graph as SVG or PNG
- Import nodes from CSV
- Highlight paths between two selected nodes
- Filter view by entity type or link type
