import React, { useCallback, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useAppStore from '../store/useAppStore';
import FolderNode from './FolderNode';
import ShapeNode from './ShapeNode';
import TextNode from './TextNode';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const nodeTypes = {
    folderNode: FolderNode,
    shapeNode: ShapeNode,
    textNode: TextNode,
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
        gridMode,
        theme,
        activeTool,
        setActiveTool
    } = useAppStore();

    const { screenToFlowPosition } = useReactFlow();
    const wrapperRef = useRef(null);

    const onPaneClick = useCallback((event) => {
        console.log('Pane clicked. Active Tool:', activeTool);
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        console.log('Flow Position:', position);

        if (activeTool === 'node') {
            console.log('Adding folder node');
            addFolderNode(position);
            setActiveTool('select');
        } else if (['rectangle', 'circle', 'diamond', 'line'].includes(activeTool)) {
            console.log('Adding shape node:', activeTool);
            addShapeNode(activeTool, position);
            setActiveTool('select');
        } else if (activeTool === 'text') {
            console.log('Adding text node');
            addTextNode(position);
            setActiveTool('select');
        }
    }, [activeTool, addFolderNode, addShapeNode, addTextNode, screenToFlowPosition, setActiveTool]);

    return (
        <div style={{ width: '100%', height: '100%' }} ref={wrapperRef}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                onPaneClick={onPaneClick}
                colorMode={theme}
                panOnDrag={activeTool === 'pan' || activeTool === 'select'}
                selectionOnDrag={activeTool === 'select'}
            >
                <Background variant={gridMode === 'none' ? undefined : gridMode} gap={16} />
                <Controls />
                <MiniMap nodeStrokeWidth={3} zoomable pannable />
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
