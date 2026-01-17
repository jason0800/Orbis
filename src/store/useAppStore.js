import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { saveStateToDB, loadStateFromDB } from '../utils/persistence';

const useAppStore = create((set, get) => ({
    // --- Folder Structure State ---
    nodes: [],
    edges: [],

    // --- UI State ---
    activeTool: 'select',
    sidebarCollapsed: false,
    selectedNodes: [],
    theme: 'light',
    gridMode: 'none', // Default changed from 'dots' to 'none'
    isInteracting: false,

    // --- Interaction State ---
    clipboard: null, // For Copy/Paste
    history: { past: [], future: [] }, // For Undo/Redo
    defaultProperties: {
        stroke: '#000000',
        fill: 'transparent',
        strokeWidth: 2,
        strokeStyle: 'solid',
        opacity: 1
    },

    // --- History Actions ---
    pushToHistory: () => {
        const { nodes, edges, history } = get();
        // Limit history size to 50
        const newPast = [...history.past, { nodes, edges }].slice(-50);
        set({ history: { past: newPast, future: [] } });
    },

    undo: () => {
        const { history, nodes, edges } = get();
        if (history.past.length === 0) return;

        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);

        set({
            nodes: previous.nodes,
            edges: previous.edges,
            history: {
                past: newPast,
                future: [{ nodes, edges }, ...history.future]
            }
        });
    },

    redo: () => {
        const { history, nodes, edges } = get();
        if (history.future.length === 0) return;

        const next = history.future[0];
        const newFuture = history.future.slice(1);

        set({
            nodes: next.nodes,
            edges: next.edges,
            history: {
                past: [...history.past, { nodes, edges }],
                future: newFuture
            }
        });
    },

    // --- Property Actions ---
    setDefaultProperties: (props) => {
        set((state) => ({
            defaultProperties: { ...state.defaultProperties, ...props }
        }));
    },

    // --- Clipboard Actions ---
    copySelectedNodes: () => {
        const { nodes, selectedNodes } = get();
        // Get full node objects for selected IDs
        const selectedIds = new Set(selectedNodes); // selectedNodes is array of IDs? Or we rely on node.selected property? 
        // "selectedNodes" state might just be IDs from onSelectionChange or we trust internal state?
        // ReactFlow manages selection. We sync it sometimes.
        // Let's filter nodes by .selected property which is more reliable if synced.
        const nodesToCopy = nodes.filter(n => n.selected);
        if (nodesToCopy.length > 0) {
            set({ clipboard: nodesToCopy });
            console.log('Copied nodes:', nodesToCopy.length);
        }
    },

    pasteNodes: () => {
        const { clipboard, nodes } = get();
        if (!clipboard || clipboard.length === 0) return;

        get().pushToHistory(); // Save state before paste

        const newNodes = clipboard.map(node => {
            const id = uuidv4();
            return {
                ...node,
                id: id,
                selected: true, // Select new nodes
                position: {
                    x: node.position.x + 20, // Offset
                    y: node.position.y + 20
                },
                // If we want to reset some data?
                data: { ...node.data }
            };
        });

        // Deselect current nodes
        const updatedCurrentNodes = nodes.map(n => ({ ...n, selected: false }));

        set({ nodes: [...updatedCurrentNodes, ...newNodes] });
    },

    // --- Standard Actions ---
    onNodesChange: (changes) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },

    onEdgesChange: (changes) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },

    onConnect: (connection) => {
        get().pushToHistory();
        set({
            edges: addEdge(connection, get().edges),
        });
    },

    addFolderNode: (position, parentId = null) => {
        get().pushToHistory();
        const newNode = {
            id: uuidv4(),
            type: 'folderNode',
            position: { x: position.x - 75, y: position.y - 20 }, // Centered (approx 150x40 default)
            data: {
                name: 'New Folder',
                description: '',
                parentId
            },
        };

        set((state) => ({
            nodes: [...state.nodes, newNode],
            edges: parentId
                ? [...state.edges, { id: `e${parentId}-${newNode.id}`, source: parentId, target: newNode.id }]
                : state.edges
        }));

        return newNode.id;
    },

    addShapeNode: (type, position) => {
        if (type === 'diamond') return; // Removed Diamond
        get().pushToHistory();

        const { defaultProperties } = get();
        const initialRotation = 0;

        const newNode = {
            id: uuidv4(),
            type: 'shapeNode',
            position,
            data: {
                shapeType: type,
                rotation: initialRotation,
                ...defaultProperties // Apply defaults
            },
            style: { width: 100, height: 100 },
        };
        set((state) => ({ nodes: [...state.nodes, newNode] }));
    },

    addFreehandNode: (position, points, size = { width: 100, height: 100 }) => {
        get().pushToHistory();
        const { defaultProperties } = get();

        const newNode = {
            id: uuidv4(),
            type: 'freehandNode',
            position,
            data: {
                points,
                width: size.width,
                height: size.height,
                ...defaultProperties // Apply defaults (color, width, etc.)
            },
            style: { width: size.width, height: size.height },
        };
        set((state) => ({ nodes: [...state.nodes, newNode] }));
    },

    deleteNode: (id) => {
        get().pushToHistory();
        set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== id),
            edges: state.edges.filter((e) => e.source !== id && e.target !== id)
        }));
    },

    deleteEdge: (id) => {
        get().pushToHistory();
        set((state) => ({
            edges: state.edges.filter((e) => e.id !== id)
        }));
    },

    addTextNode: (position) => {
        get().pushToHistory();
        const { defaultProperties } = get();

        const newNode = {
            id: uuidv4(),
            type: 'textNode',
            position: { x: position.x - 100, y: position.y - 25 }, // Centered (200x50 default)
            style: { width: 200, height: 50 }, // Fix: Set initial dimensions
            data: {
                text: 'Text',
                stroke: defaultProperties.stroke, // Apply color
            },
        };
        set((state) => ({ nodes: [...state.nodes, newNode] }));
    },

    updateNodeData: (id, data) => {
        // Debounce history? Or push on start?
        // Ideally we assume this is called atomically or we manage it carefully.
        // For properties panel, maybe push history on 'focus' or manually?
        // For now, let's NOT push history on every keystroke. 
        // User might need to rely on 'blur' or explicit save.
        // BUT, for simple property toggles (color), we SHOULD push history.
        // Let's assume the caller handles history if it's a complex drag, 
        // but for simple data updates we might want to push.
        // To avoid spam, let's rely on the caller or just push.
        // For safely, let's push. If it's too much, we can optimize.

        // Optimisation: Don't push if value hasn't changed? Hard to know.
        // NOTE: ReactFlow handles dragging updates via onNodesChange. Use 'isInteracting' to suspend history?

        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, ...data } } : node
            ),
        }));
    },

    updateNode: (id, fields) => {
        // Similar to above.
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id ? { ...node, ...fields } : node
            ),
        }));
    },

    setActiveTool: (tool) => {
        console.log('Switching tool to:', tool);
        set({ activeTool: tool });
    },
    setIsInteracting: (isInteracting) => set({ isInteracting }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setTheme: (theme) => set({ theme }),
    setGridMode: (mode) => set({ gridMode: mode }),
    setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),

    loadState: (state) => set({
        nodes: state.nodes || [],
        edges: state.edges || [],
        theme: state.theme || 'light',
        gridMode: state.gridMode || 'none', // Default none on load if missing
    }),

    resetCanvas: () => {
        get().pushToHistory();
        set({ nodes: [], edges: [] });
    },

    deleteSelectedElements: () => {
        const { nodes, edges } = get();
        const selectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id));

        if (selectedIds.size === 0 && (!edges.some(e => e.selected))) return; // Also check edges

        get().pushToHistory();

        // Filter nodes
        const newNodes = nodes.filter(node => !selectedIds.has(node.id));

        // Filter edges: Delete if source/target is deleted OR if edge itself is selected
        const newEdges = edges.filter(edge => {
            const sourceDeleted = selectedIds.has(edge.source);
            const targetDeleted = selectedIds.has(edge.target);
            const edgeSelected = edge.selected;
            return !sourceDeleted && !targetDeleted && !edgeSelected;
        });

        set({ nodes: newNodes, edges: newEdges });
    }

}));

// Subscribe to changes for autosave
useAppStore.subscribe((state) => {
    saveStateToDB(state);
});

// Initial Load
loadStateFromDB().then((savedState) => {
    if (savedState) {
        useAppStore.getState().loadState(savedState);
        // FORCE LIGHT THEME MIGRATION (Requested by user)
        // If the saved state has 'dark', we want to override it to 'light' just this once or permanently?
        // Let's just set it to light if it's currently dark?
        // No, let's just make sure the user starts with light if they haven't explicitly set it?
        // We can't know.
        // I will force set it to 'light' after loading state to ensure they see the change.
        useAppStore.getState().setTheme('light');
    }
});

export default useAppStore;
