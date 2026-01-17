import React, { memo, useCallback, useState, useEffect } from 'react';
import { NodeResizer, NodeResizeControl } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';
import useAppStore from '../store/useAppStore';
import { useNodeRotate } from '../hooks/useNodeRotate';
import RotationHandle from './RotationHandle';

const ShapeNode = ({ data, selected, id }) => {
    const {
        shapeType = 'rectangle',
        stroke,
        fill = 'transparent',
        strokeWidth = 2,
        strokeStyle = 'solid',
        opacity = 1,
        rotation = 0
    } = data;

    const { rotateRef, centerRef, onRotateStart } = useNodeRotate(id, rotation);
    const { screenToFlowPosition, getNode } = useReactFlow();
    const updateNode = useAppStore((state) => state.updateNode);

    // Map strokeStyle to dasharray
    const getStrokeDasharray = (style) => {
        switch (style) {
            case 'dashed': return '5,5';
            case 'dotted': return '1,1';
            default: return 'none';
        }
    };

    const commonProps = {
        stroke: (!stroke || stroke === '#fff') ? 'var(--shape-stroke)' : stroke,
        strokeWidth: strokeWidth,
        fill: fill,
        fillOpacity: fill === 'transparent' ? 0 : 1, // Ensure transparency is handled
        strokeDasharray: getStrokeDasharray(strokeStyle),
        opacity: opacity,
        vectorEffect: "non-scaling-stroke", // Keeps stroke width constant when scaling SVG? 
        // Note: For Line/Arrow we are now NOT scaling the SVG viewBox, so non-scaling-stroke is less critical there, but good for Rect/Circle.
    };

    // --- Line / Arrow Handling Logic ---
    const isLine = ['line', 'arrow'].includes(shapeType);

    const onHandleDragStart = (e, handleType) => {
        e.stopPropagation();
        e.preventDefault();

        const node = getNode(id);
        if (!node) return;

        const startX = node.position.x;
        const startY = node.position.y;

        // Prioritize Style Width
        let w = parseFloat(node.style?.width);
        if (isNaN(w)) w = node.measured?.width ?? 100;

        let h = parseFloat(node.style?.height);
        if (isNaN(h)) h = node.measured?.height ?? 100;

        const currentRot = node.data?.rotation ?? rotation ?? 0;
        const rotRad = (currentRot * Math.PI) / 180;

        const cx = startX + w / 2;
        const cy = startY + h / 2;

        const cos = Math.cos(rotRad);
        const sin = Math.sin(rotRad);
        const halfW = w / 2;

        // Handles are always at ends of widthVector (centered vertically)
        const vecX = halfW * cos;
        const vecY = halfW * sin;

        const pLeft = { x: cx - vecX, y: cy - vecY };
        const pRight = { x: cx + vecX, y: cy + vecY };

        const onPointerMove = (moveEvent) => {
            moveEvent.stopPropagation();
            moveEvent.preventDefault();

            const mousePos = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });

            let fixedPoint, movingPoint;

            if (handleType === 'left') {
                fixedPoint = pRight;
                movingPoint = mousePos;
            } else {
                fixedPoint = pLeft;
                movingPoint = mousePos;
            }

            const dx = movingPoint.x - fixedPoint.x;
            const dy = movingPoint.y - fixedPoint.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const newWidth = Math.max(20, dist);

            let angleRad;
            if (handleType === 'right') {
                angleRad = Math.atan2(dy, dx);
            } else {
                angleRad = Math.atan2(fixedPoint.y - movingPoint.y, fixedPoint.x - movingPoint.x);
            }
            const newAngleDeg = (angleRad * 180) / Math.PI;

            // Recenter
            const newCos = Math.cos(angleRad);
            const newSin = Math.sin(angleRad);

            let newCx, newCy;

            if (handleType === 'right') {
                // Left is Fixed
                const newRightX = fixedPoint.x + newWidth * newCos;
                const newRightY = fixedPoint.y + newWidth * newSin;
                newCx = (fixedPoint.x + newRightX) / 2;
                newCy = (fixedPoint.y + newRightY) / 2;
            } else {
                // Right is Fixed
                const newLeftX = fixedPoint.x - newWidth * newCos;
                const newLeftY = fixedPoint.y - newWidth * newSin;
                newCx = (newLeftX + fixedPoint.x) / 2;
                newCy = (newLeftY + fixedPoint.y) / 2;
            }

            const newX = newCx - newWidth / 2;
            const newY = newCy - h / 2;

            updateNode(id, {
                position: { x: newX, y: newY },
                style: { ...node.style, width: newWidth },
                data: { ...node.data, rotation: newAngleDeg }
            });
        };

        const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };


    return (
        <div style={{ width: '100%', height: '100%', minWidth: '20px', minHeight: '20px', position: 'relative' }}>

            <div style={{
                width: '100%',
                height: '100%',
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                opacity: opacity
            }} ref={centerRef}>

                {!isLine && (
                    <NodeResizer
                        color="#646cff"
                        isVisible={selected}
                        minWidth={1}
                        minHeight={1}
                    />
                )}

                {selected && isLine && (
                    <>
                        <div
                            onPointerDown={(e) => onHandleDragStart(e, 'left')}
                            className="nodrag"
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '12px',
                                height: '12px',
                                background: '#646cff',
                                borderRadius: '50%',
                                cursor: 'crosshair',
                                zIndex: 10,
                                border: '2px solid white',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div
                            onPointerDown={(e) => onHandleDragStart(e, 'right')}
                            className="nodrag"
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: '50%',
                                transform: 'translate(50%, -50%)',
                                width: '12px',
                                height: '12px',
                                background: '#646cff',
                                borderRadius: '50%',
                                cursor: 'crosshair',
                                zIndex: 10,
                                border: '2px solid white',
                                boxSizing: 'border-box'
                            }}
                        />
                    </>
                )}

                {selected && !isLine && (
                    <RotationHandle rotateRef={rotateRef} onMouseDown={onRotateStart} />
                )}

                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)',
                    // Ensure marker is colored correctly if inherited? No, usage defines fill.
                }}>
                    <svg
                        // Visual Fix: 
                        // For Rect/Circle: Use fixed 100x100 coord system (scaling)
                        // For Line/Arrow: Use 100% size (Pixels)
                        viewBox={!isLine ? "0 0 100 100" : undefined}
                        width="100%"
                        height="100%"
                        preserveAspectRatio="none"
                        style={{ overflow: 'visible' }}
                    >
                        <defs>
                            {/* Marker is now fixed size since we aren't scaling viewBox for Lines */}
                            <marker id={`arrowhead-${id}`} markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                                <polygon points="0 0, 6 2, 0 4" fill={commonProps.stroke} />
                            </marker>
                        </defs>

                        {(shapeType === 'rectangle' || shapeType === 'diamond') && (
                            <rect x="0" y="0" width="100" height="100" rx={5} {...commonProps} />
                        )}
                        {shapeType === 'circle' && (
                            <ellipse cx="50" cy="50" rx="50" ry="50" {...commonProps} />
                        )}
                        {shapeType === 'line' && (
                            // Use percents for responsive layout in 1:1 mode
                            <line x1="0" y1="50%" x2="100%" y2="50%" {...commonProps} />
                        )}
                        {shapeType === 'arrow' && (
                            <line x1="0" y1="50%" x2="100%" y2="50%" {...commonProps} markerEnd={`url(#arrowhead-${id})`} />
                        )}
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default memo(ShapeNode);
