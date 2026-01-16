import { openDB } from 'idb';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'OrbisDB';
const STORE_NAME = 'plans';
const CURRENT_PLAN_KEY = 'currentPlan';

const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
};

export const saveStateToDB = async (state) => {
    const db = await initDB();
    const serializableState = {
        nodes: state.nodes,
        edges: state.edges,
        annotations: state.annotations,
        version: 1,
        savedAt: new Date().toISOString(),
    };
    await db.put(STORE_NAME, serializableState, CURRENT_PLAN_KEY);
};

export const loadStateFromDB = async () => {
    const db = await initDB();
    return await db.get(STORE_NAME, CURRENT_PLAN_KEY);
};

export const exportToOrbisFile = (state) => {
    const data = {
        metadata: {
            appName: 'Orbis',
            version: 1,
            createdAt: new Date().toISOString(),
        },
        content: {
            nodes: state.nodes,
            edges: state.edges,
            annotations: state.annotations,
        }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-${new Date().toISOString().slice(0, 10)}.orbis`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importOrbisFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Basic validation
                if (!data.content || !Array.isArray(data.content.nodes)) {
                    throw new Error('Invalid file format');
                }
                resolve(data.content);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

export const exportToZip = async (state) => {
    const zip = new JSZip();
    const nodeMap = new Map();
    const rootNodes = [];
    const childNodeIds = new Set();

    // 1. Map all nodes and initialize children array
    state.nodes.forEach(node => {
        // Only include folder nodes in the tree structure
        if (node.type === 'folderNode') {
            nodeMap.set(node.id, { ...node, children: [] });
        }
    });

    // 2. Build hierarchy using edges
    state.edges.forEach(edge => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);

        // Only process if both nodes are valid folder nodes
        if (sourceNode && targetNode) {
            sourceNode.children.push(targetNode);
            childNodeIds.add(edge.target);
        }
    });

    // 3. Identify root nodes (nodes that are not targets of any edge)
    nodeMap.forEach((node, id) => {
        if (!childNodeIds.has(id)) {
            rootNodes.push(node);
        }
    });

    console.log('Roots found:', rootNodes.length);

    // 4. Recursive function to add to zip
    const addToZip = (folder, nodes) => {
        nodes.forEach(node => {
            const folderName = node.data.name || 'Untitled';
            const safeName = folderName.replace(/[<>:"/\\|?*]/g, '_'); // Sanitize

            const currentFolder = folder.folder(safeName);

            // Add readme if description exists
            if (node.data.description && node.data.description.trim() !== '') {
                currentFolder.file('readme.txt', node.data.description);
            }

            if (node.children && node.children.length > 0) {
                addToZip(currentFolder, node.children);
            }
        });
    };

    addToZip(zip, rootNodes);

    // 5. Add structure.json (full state backup)
    zip.file('structure.json', JSON.stringify(state, null, 2));

    // 6. Download
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbis-export-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
};
