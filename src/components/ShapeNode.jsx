import React, { memo, useCallback, useState, useEffect } from 'react';
import { NodeResizer } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';
import useAppStore from '../store/useAppStore';
import { useNodeRotate } from '../hooks/useNodeRotate';
import RotationHandle from './RotationHandle';

const ShapeNode = ({ data, selected, id }) => {
    const { shapeType = 'rectangle', stroke, rotation = 0 } = data;
    const { rotateRef, centerRef, onRotateStart } = useNodeRotate(id, rotation);
    const { screenToFlowPosition, getNode } = useReactFlow();
    const updateNode = useAppStore((state) => state.updateNode);
    const updateNodeData = useAppStore((state) => state.updateNodeData);

    const commonProps = {
        stroke: (!stroke || stroke === '#fff') ? 'var(--shape-stroke)' : stroke,
        strokeWidth: 2,
        fill: 'transparent',
        vectorEffect: "non-scaling-stroke",
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
        const w = node.measured?.width || node.style?.width || 100; // Use measured if available for accuracy
        const h = node.measured?.height || node.style?.height || 100;
        const rotRad = (rotation * Math.PI) / 180;

        // Calculate Center
        const cx = startX + w / 2;
        const cy = startY + h / 2;

        // Calculate Endpoints based entirely on Center + Width + Rotation
        // We assume the line is centered in the box horizontally.
        // Left Point (Start): Center - Rotated(w/2)
        const cos = Math.cos(rotRad);
        const sin = Math.sin(rotRad);

        const halfW = w / 2;

        // Vector from Center to Right
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
                fixedPoint = pRight; // Right stays fixed
                movingPoint = mousePos;
            } else {
                fixedPoint = pLeft; // Left stays fixed
                movingPoint = mousePos;
            }

            // Calculate new Center
            const newCx = (fixedPoint.x + movingPoint.x) / 2;
            const newCy = (fixedPoint.y + movingPoint.y) / 2;

            // Calculate new Width (distance)
            const dx = movingPoint.x - fixedPoint.x;
            const dy = movingPoint.y - fixedPoint.y;
            const newWidth = Math.sqrt(dx * dx + dy * dy);

            // Calculate new Rotation
            // If dragging Right: angle is fixed -> moving
            // If dragging Left: angle is moving -> fixed (Wait, consistent direction Left->Right)
            // Vector ALWAYS Left -> Right
            let newAngleRad;
            if (handleType === 'right') {
                newAngleRad = Math.atan2(dy, dx);
            } else {
                // Vector is Fixed(Right) - Moving(Left) = (Rx-Lx, Ry-Ly)
                // Wait.
                // Vector L->R = (Right.x - Left.x, Right.y - Left.y)
                // If dragging Left: Right is Fixed. Left is Moving.
                // Vector = Fixed - Moving.
                newAngleRad = Math.atan2(fixedPoint.y - movingPoint.y, fixedPoint.x - movingPoint.x);
            }

            const newAngleDeg = (newAngleRad * 180) / Math.PI;

            // Update Node
            // New Position (Top-Left) = NewCenter - HalfDims
            const newX = newCx - newWidth / 2;
            const newY = newCy - h / 2; // Height stays constant? standard 20px minHeight?

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
            }} ref={centerRef}>

                {/* Standard Resizer for 2D shapes (Rectangle, Circle, Diamond) */}
                {!isLine && (
                    <NodeResizer
                        color="#646cff"
                        isVisible={selected}
                        minWidth={20}
                        minHeight={20}
                    />
                )}

                {/* Custom Handles for Lines/Arrows */}
                {selected && isLine && (
                    <>
                        {/* Left Handle */}
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
                                cursor: 'crosshair', // or default
                                zIndex: 10,
                                border: '2px solid white',
                                boxSizing: 'border-box'
                            }}
                        />
                        {/* Right Handle */}
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
                }}>
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{ width: '100%', height: '100%', overflow: 'visible' }}
                    >
                        <defs>
                            <marker id={`arrowhead-${id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={commonProps.stroke} />
                            </marker>
                        </defs>

                        {(shapeType === 'rectangle' || shapeType === 'diamond') && (
                            <rect x="0" y="0" width="100" height="100" rx={5} {...commonProps} />
                        )}
                        {shapeType === 'circle' && (
                            <ellipse cx="50" cy="50" rx="50" ry="50" {...commonProps} />
                        )}
                        {shapeType === 'line' && (
                            <line x1="0" y1="50" x2="100" y2="50" {...commonProps} />
                        )}
                        {shapeType === 'arrow' && (
                            <line x1="0" y1="50" x2="100" y2="50" {...commonProps} markerEnd={`url(#arrowhead-${id})`} />
                        )}
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default memo(ShapeNode);
