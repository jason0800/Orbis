import React, { useCallback, useRef, useState, useMemo } from 'react';
import { ReactFlow, Background, MiniMap, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useAppStore from '../store/useAppStore';
import FolderNode from './FolderNode';
import ShapeNode from './ShapeNode';
import TextNode from './TextNode';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import FreehandNode from './FreehandNode';
import { getSmoothPath } from '../utils/drawing';
import CustomControls from './CustomControls';

const nodeTypes = {
    folderNode: FolderNode,
    shapeNode: ShapeNode,
    textNode: TextNode,
    freehandNode: FreehandNode,
};

// SVG Cursors
// SVG Cursors
const ERASER_CURSOR_BLACK = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" /></svg>') 0 24, auto`;
const ERASER_CURSOR_RED = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" /><path d="M22 21H7" /><path d="m5 11 9 9" /></svg>') 0 24, auto`;
const FOLDER_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>') 12 12, auto`;

export default function Canvas() {
    useKeyboardShortcuts();

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addFolderNode,
        addShapeNode,
        addTextNode,
        addFreehandNode,
        deleteNode,
        gridMode,
        theme,
        activeTool,
        setActiveTool,
        isInteracting,
        defaultProperties
    } = useAppStore();

    const { screenToFlowPosition, getViewport } = useReactFlow();
    const wrapperRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [points, setPoints] = useState([]);
    const [drawingState, setDrawingState] = useState(null); // { startPos: {x,y}, nodeId: string, type: string }

    // We can use a temporary overlay for drawing
    const drawingPath = useMemo(() => {
        return getSmoothPath(points);
    }, [points]);

    const getCursor = () => {
        switch (activeTool) {
            case 'pan': return 'grab';
            case 'select': return 'default';
            case 'text': return 'text';
            case 'node': return FOLDER_CURSOR;
            case 'eraser': return ERASER_CURSOR_BLACK;
            default: return 'crosshair'; // For creation tools
        }
    };

    const onPaneClick = useCallback((event) => {
        // Prevent click if we were interaction (dragging/resizing)
        if (isDrawing || isInteracting || drawingState) return;

        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

        if (activeTool === 'node') {
            addFolderNode(position);
            setActiveTool('select');
        } else if (activeTool === 'text') {
            addTextNode(position);
            setActiveTool('select');
        }
    }, [activeTool, addFolderNode, addTextNode, screenToFlowPosition, setActiveTool, isDrawing, isInteracting, drawingState]);

    const onNodeClick = useCallback((e, node) => {
        if (activeTool === 'eraser') {
            deleteNode(node.id);
        }
    }, [activeTool, deleteNode]);

    // Explicitly handle edge clicks for eraser
    const onEdgeClick = useCallback((e, edge) => {
        if (activeTool === 'eraser') {
            // We can reuse deleteNode logic if we pass the edge id, 
            // BUT deleteNode expects a NODE id usually. 
            // We need a way to delete an edge.
            // Let's modify deleteNode to handle generic IDs or use deleteSelectedElements logic?
            // Or better, let's add a specific 'deleteElement' or just call deleteNode if it works?
            // Check store: deleteNode filters nodes AND edges connected to it. It doesn't delete edge by ID.
            // We need a 'deleteEdge' action.
            useAppStore.getState().deleteEdge(edge.id);
        }
    }, [activeTool]);

    // --- Interaction Handlers ---

    const onMouseDown = (e) => {
        if (isInteracting) return;
        const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

        // Freehand
        if (activeTool === 'freehand') {
            setIsDrawing(true);
            setPoints([pos]);
            return;
        }

        // Shape Drag-to-Draw
        if (['rectangle', 'circle', 'line', 'arrow'].includes(activeTool)) {
            // Create initial node
            useAppStore.getState().addShapeNode(activeTool, pos);

            // Get the ID of the new node (assuming it's the last one added synchronous)
            const nodes = useAppStore.getState().nodes;
            const newNode = nodes[nodes.length - 1];

            if (newNode) {
                // Initialize small
                useAppStore.getState().updateNode(newNode.id, {
                    style: { width: 1, height: 1 },
                    data: { ...newNode.data, rotation: 0 }
                });

                setDrawingState({
                    startPos: pos,
                    nodeId: newNode.id,
                    type: activeTool
                });
            }
        }
    };

    const onMouseMove = (e) => {
        const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });

        // Freehand Update
        if (isDrawing && activeTool === 'freehand') {
            setPoints(prev => [...prev, pos]);
            return;
        }

        // Shape Update
        if (drawingState) {
            const { startPos, nodeId, type } = drawingState;

            if (type === 'line' || type === 'arrow') {
                // Line Logic: Start -> Current
                const dx = pos.x - startPos.x;
                const dy = pos.y - startPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;

                // Center is midpoint
                const cx = (startPos.x + pos.x) / 2;
                const cy = (startPos.y + pos.y) / 2;

                const h = 20; // Fixed visual height container for line
                useAppStore.getState().updateNode(nodeId, {
                    position: { x: cx - dist / 2, y: cy - h / 2 },
                    style: { width: Math.max(1, dist), height: h },
                    data: { rotation: angle, shapeType: type }
                });

            } else {
                // Rect/Circle Logic: Bounds
                // Determine Top-Left and Dimensions
                const minX = Math.min(startPos.x, pos.x);
                const minY = Math.min(startPos.y, pos.y);
                const width = Math.abs(pos.x - startPos.x);
                const height = Math.abs(pos.y - startPos.y);

                useAppStore.getState().updateNode(nodeId, {
                    position: { x: minX, y: minY },
                    style: { width: Math.max(1, width), height: Math.max(1, height) }
                });
            }
        }

        // Eraser Hover Effect Logic
        if (activeTool === 'eraser') {
            // We need to detect if we are over a node to switch cursor.
            // This is handled by CSS mostly, but we want the RED cursor.
            // See index.css for hover override.
        }
    };

    const onMouseUp = () => {
        // Finalize Freehand
        if (isDrawing && activeTool === 'freehand') {
            if (points.length > 2) {
                const xs = points.map(p => p.x);
                const ys = points.map(p => p.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);

                const width = Math.max(20, maxX - minX);
                const height = Math.max(20, maxY - minY);

                const relativePoints = points.map(p => ({
                    x: p.x - minX,
                    y: p.y - minY
                }));

                addFreehandNode(
                    { x: minX, y: minY },
                    relativePoints,
                    { width, height }
                );
            }
            setPoints([]);
            setIsDrawing(false);
            useAppStore.getState().setActiveTool('select');
        }

        // Finalize Shape
        if (drawingState) {
            setDrawingState(null);
            useAppStore.getState().setActiveTool('select');
        }
    };

    // Render Overlay
    const viewport = getViewport();

    return (
        <div
            className={`tool-${activeTool}`}
            style={{ width: '100%', height: '100%', cursor: getCursor() }}
            ref={wrapperRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                onPaneClick={onPaneClick}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                colorMode={theme}
                selectionOnDrag={activeTool === 'select'}
                panOnScroll={true}
                zoomOnScroll={true}
                preventScrolling={false}
                minZoom={0.1}
                panOnDrag={activeTool === 'pan' ? [0, 1, 2] : [1, 2]}
                elevateNodesOnSelect={false}
            >
                {/* Render Background only if not 'none' */}
                {gridMode !== 'none' && <Background variant={gridMode} gap={16} />}

                <CustomControls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />

                {/* Live Drawing Overlay using React Flow Viewport Transform */}
                {isDrawing && points.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: 2000,
                        pointerEvents: 'none',
                        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                        transformOrigin: '0 0'
                    }}>
                        <svg style={{ width: '100000px', height: '100000px', overflow: 'visible' }}>
                            <path
                                d={drawingPath}
                                stroke={defaultProperties?.stroke || '#000'}
                                strokeWidth={defaultProperties?.strokeWidth || 3}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                )}
            </ReactFlow>
        </div>
    );
}
