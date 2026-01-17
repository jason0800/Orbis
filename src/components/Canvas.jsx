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

    // We can use a temporary overlay for drawing
    const drawingPath = useMemo(() => {
        return getSmoothPath(points);
    }, [points]);

    const getCursor = () => {
        switch (activeTool) {
            case 'pan': return 'grab';
            case 'select': return 'default';
            case 'text': return 'text';
            case 'eraser': return 'not-allowed'; // or custom cursor
            default: return 'crosshair'; // For creation tools
        }
    };

    const onPaneClick = useCallback((event) => {
        // Prevent click if we were drawing/dragging or rotating
        if (isDrawing || isInteracting) return;

        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

        if (activeTool === 'node') {
            addFolderNode(position);
            // setActiveTool('select'); // User wants to persist tool
        } else if (['rectangle', 'circle', 'diamond', 'line', 'arrow'].includes(activeTool)) {
            addShapeNode(activeTool, position);
            // setActiveTool('select');
        } else if (activeTool === 'text') {
            addTextNode(position);
            // setActiveTool('select');
        }
    }, [activeTool, addFolderNode, addShapeNode, addTextNode, screenToFlowPosition, setActiveTool, isDrawing, isInteracting]);

    // We use Screen Position for the drawing overlay to avoid transform issues during draw
    // BUT we need the points in Flow Position for the stored node.

    const onNodeClick = useCallback((e, node) => {
        if (activeTool === 'eraser') {
            deleteNode(node.id);
        }
    }, [activeTool, deleteNode]);

    // Freehand Drawing Handlers (on the wrapper, to capture events everywhere)
    const onMouseDown = (e) => {
        if (activeTool !== 'freehand') return;
        setIsDrawing(true);
        // Start a new path
        const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        setPoints([pos]);
    };

    const onMouseMove = (e) => {
        if (!isDrawing || activeTool !== 'freehand') return;
        const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        setPoints(prev => [...prev, pos]);
    };

    const onMouseUp = () => {
        if (isDrawing && activeTool === 'freehand') {
            if (points.length > 2) {
                // Calculate Bounding Box
                const xs = points.map(p => p.x);
                const ys = points.map(p => p.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);

                const width = Math.max(20, maxX - minX);
                const height = Math.max(20, maxY - minY);

                // Normalize points relative to bounding box
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
        }
    };

    // Render Overlay
    // We need to render the current 'points' (which are in Flow coords)
    // inside an SVG that is transformed by the viewport, OR, project them to screen.
    // Easiest: SVG covering the screen, points projected to screen.

    const viewport = getViewport();

    return (
        <div
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
                panOnDrag={activeTool === 'pan' ? [0, 1] : [1]} // Allow panning with Middle Mouse (1) always, Left (0) if pan tool
                selectionOnDrag={activeTool === 'select'} // Rect selection when tool is 'select'
                panOnScroll={true} // Allow scrolling
                zoomOnScroll={true}
                preventScrolling={false} // Allow native scroll? No, usually block
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
