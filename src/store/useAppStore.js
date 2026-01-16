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
    theme: 'dark',
    gridMode: 'dots',

    // --- Actions ---
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
        set({
            edges: addEdge(connection, get().edges),
        });
    },

    addFolderNode: (position, parentId = null) => {
        const newNode = {
            id: uuidv4(),
            type: 'folderNode',
            position,
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
        const newNode = {
            id: uuidv4(),
            type: 'shapeNode',
            position,
            data: { shapeType: type, stroke: '#fff' },
            style: { width: 100, height: 100 },
        };
        set((state) => ({ nodes: [...state.nodes, newNode] }));
    },

    addTextNode: (position) => {
        const newNode = {
            id: uuidv4(),
            type: 'textNode',
            position,
            data: { text: 'Text' },
        };
        set((state) => ({ nodes: [...state.nodes, newNode] }));
    },

    updateNodeData: (id, data) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, ...data } } : node
            ),
        }));
    },

    setActiveTool: (tool) => {
        console.log('Switching tool to:', tool);
        set({ activeTool: tool });
    },
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setTheme: (theme) => set({ theme }),
    setGridMode: (mode) => set({ gridMode: mode }),
    setSelectedNodes: (nodeIds) => set({ selectedNodes: nodeIds }),

    loadState: (state) => set({
        nodes: state.nodes || [],
        edges: state.edges || [],
        theme: state.theme || 'dark',
        gridMode: state.gridMode || 'dots',
    }),

    resetCanvas: () => set({ nodes: [], edges: [] }),

    deleteSelectedElements: () => {
        const { nodes, edges, selectedNodes } = get();
        // Create a set for O(1) lookups
        const selectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id));

        // Also add edges that are selected? ReactFlow handles edge selection separately usually,
        // but for now we focus on nodes.

        if (selectedIds.size === 0) return;

        const newNodes = nodes.filter(node => !selectedIds.has(node.id));
        const newEdges = edges.filter(edge => !selectedIds.has(edge.source) && !selectedIds.has(edge.target));

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
    }
});

export default useAppStore;
