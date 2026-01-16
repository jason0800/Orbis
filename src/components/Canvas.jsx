import React, { useCallback, useRef, useState, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useAppStore from '../store/useAppStore';
import FolderNode from './FolderNode';
import ShapeNode from './ShapeNode';
import TextNode from './TextNode';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

import FreehandNode from './FreehandNode';

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
        setActiveTool
    } = useAppStore();

    const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
    const wrapperRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [points, setPoints] = useState([]);

    // We can use a temporary overlay for drawing
    const drawingPath = useMemo(() => {
        if (points.length < 2) return '';
        return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
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
        // Prevent click if we were drawing/dragging
        if (isDrawing) return;

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
    }, [activeTool, addFolderNode, addShapeNode, addTextNode, screenToFlowPosition, setActiveTool, isDrawing]);

    const onNodeClick = useCallback((e, node) => {
        if (activeTool === 'eraser') {
            deleteNode(node.id);
        }
    }, [activeTool, deleteNode]);

    // Freehand Drawing Handlers (on the wrapper, to capture events everywhere)
    const onMouseDown = (e) => {
        if (activeTool !== 'freehand') return;
        setIsDrawing(true);
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
                // Calculate bounding box to normalize? Or just save as is. 
                // Saving absolute points is easier for now, but making it a node means it usually has a position.
                // Let's set the node position to the first point, and adjust other points relative to it.
                const startX = points[0].x;
                const startY = points[0].y;
                const relativePoints = points.map(p => ({ x: p.x - startX, y: p.y - startY }));

                addFreehandNode({ x: startX, y: startY }, relativePoints);
            }
            setPoints([]);
            setIsDrawing(false);
            // Optional: Switch back to select? kept active for continuous drawing
        }
    };

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
                panOnDrag={activeTool === 'pan'} // ONLY pan when tool is 'pan'
                selectionOnDrag={activeTool === 'select'} // Rect selection when tool is 'select'
                panOnScroll={true}
                zoomOnScroll={true}
                preventScrolling={false}
            >
                <Background variant={gridMode === 'none' ? undefined : gridMode} gap={16} />
                <Controls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />

                {/* Temporary Drawing Overlay */}
                {isDrawing && points.length > 0 && (
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10000 }}>
                        {/* We need to transform these flow coordinates back to screen/pixel coordinates for the fixed SVG, 
                            OR put this SVG inside the ReactFlow transform pane (custom layer). 
                            Actually, simplest is to use ReactFlow Custom Layer, but that requires more setup.
                            For now, this overlay might be misaligned if we zoom/pan WHILE drawing (which we shouldn't).
                            Wait: points are in Flow coords. SVG is 100% of viewport. We need to project points.
                        */}
                        {/*  Implementation Detail: doing proper projection for the pending line is complex without a custom layer. 
                            So for V1, let's just accept we won't see the line WHILE drawing unless we solve this.
                            Or... we can project them.
                       */}
                    </svg>
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
