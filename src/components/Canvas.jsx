import React, { useCallback, useRef, useState, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useAppStore from '../store/useAppStore';
import FolderNode from './FolderNode';
import ShapeNode from './ShapeNode';
import TextNode from './TextNode';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

import FreehandNode from './FreehandNode';
import { getSmoothPath } from '../utils/drawing';

const nodeTypes = {
    folderNode: FolderNode,
    shapeNode: ShapeNode,
    textNode: TextNode,
    freehandNode: FreehandNode,
};

function CanvasContent() {
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
        isInteracting
    } = useAppStore();

    const { screenToFlowPosition, flowToScreenPosition, getViewport } = useReactFlow();
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
            case 'eraser': return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewport="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M18 10l-6-6L2 14l6 6 10-10z" /></svg>') 0 24, auto`;
            default: return 'crosshair'; // For creation tools
        }
    };

    const onPaneClick = useCallback((event) => {
        // Prevent click if we were interaction (dragging/resizing)
        // Note: Drag-to-draw (drawingState) handled by Up, not Click.
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

    // Used for selecting eraser target eraser
    const onNodeClick = useCallback((e, node) => {
        if (activeTool === 'eraser') {
            deleteNode(node.id);
        }
    }, [activeTool, deleteNode]);

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
        if (['rectangle', 'circle', 'diamond', 'line', 'arrow'].includes(activeTool)) {
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
                colorMode={theme}
                selectionOnDrag={activeTool === 'select'}
                panOnScroll={true}
                zoomOnScroll={true}
                preventScrolling={false}
                // Disable default pane drag if we are drawing
                panOnDrag={(!isDrawing && !drawingState && activeTool === 'select') || activeTool === 'pan' ? [0, 1] : [1]} // Allow MM pan always. Left pan only if select/pan
            >
                <Background variant={gridMode === 'none' ? undefined : gridMode} gap={16} />
                <Controls />
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
                                stroke={theme === 'dark' ? '#fff' : '#000'}
                                strokeWidth={3}
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

export default function Canvas() {
    return (
        <ReactFlowProvider>
            <CanvasContent />
        </ReactFlowProvider>
    )
}
