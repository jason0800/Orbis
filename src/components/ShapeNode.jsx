import React, { memo, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import useAppStore from '../store/useAppStore';
import { useNodeRotate } from '../hooks/useNodeRotate';
import RotationHandle from './RotationHandle';

const CustomHandle = ({ cursor, onPointerDown, style }) => (
    <div
        onPointerDown={onPointerDown}
        className="nodrag"
        style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: '#646cff',
            borderRadius: '50%',
            cursor: cursor,
            zIndex: 10,
            border: '2px solid white',
            boxSizing: 'border-box',
            touchAction: 'none',
            ...style
        }}
    />
);

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

    const getStrokeDasharray = (style) => {
        switch (style) {
            case 'dashed': return '10, 5';
            case 'dotted': return '1, 8'; // Sparse dots with round caps
            default: return 'none';
        }
    };

    const commonProps = {
        stroke: (!stroke || stroke === '#fff') ? 'var(--shape-stroke)' : stroke,
        strokeWidth: strokeWidth,
        fill: fill,
        fillOpacity: fill === 'transparent' ? 0 : 1,
        strokeDasharray: getStrokeDasharray(strokeStyle),
        strokeLinecap: 'round', // Essential for 'dotted' to look like dots (with length 1)
        opacity: opacity,
        vectorEffect: "non-scaling-stroke",
    };

    const isLine = ['line', 'arrow'].includes(shapeType);

    // --- 2D Resize Logic (Flipping Support) ---
    const onResizeStart = (e, dir) => {
        e.stopPropagation();
        e.preventDefault();

        const node = getNode(id);
        if (!node) return;

        const startMouse = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const startX = node.position.x;
        const startY = node.position.y;

        let w = parseFloat(node.style?.width) || 100;
        let h = parseFloat(node.style?.height) || 100;

        const rotDeg = rotation; // Visual rotation
        const rotRad = (rotDeg * Math.PI) / 180;
        const cos = Math.cos(-rotRad);
        const sin = Math.sin(-rotRad);

        const onPointerMove = (moveEvent) => {
            moveEvent.stopPropagation();
            moveEvent.preventDefault();

            const currentMouse = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
            const globalDx = currentMouse.x - startMouse.x;
            const globalDy = currentMouse.y - startMouse.y;

            // Project delta to local unrotated space
            const localDx = globalDx * cos - globalDy * sin;
            const localDy = globalDx * sin + globalDy * cos;

            // Calculate new local bounds
            // Initial bounds: L=0, T=0, R=w, B=h
            let newL = 0, newT = 0, newR = w, newB = h;

            // Apply delta based on direction
            if (dir.includes('n')) newT += localDy;
            if (dir.includes('s')) newB += localDy;
            if (dir.includes('w')) newL += localDx;
            if (dir.includes('e')) newR += localDx;

            // Normalize (Flip Logic)
            const finalL = Math.min(newL, newR);
            const finalR = Math.max(newL, newR);
            const finalT = Math.min(newT, newB);
            const finalB = Math.max(newT, newB);

            // Calculate final geometry
            const finalW = Math.max(1, finalR - finalL);
            const finalH = Math.max(1, finalB - finalT);

            // New Unrotated Top-Left is StartX + Shift
            const finalX = startX + finalL;
            const finalY = startY + finalT;

            updateNode(id, {
                position: { x: finalX, y: finalY },
                style: { ...node.style, width: finalW, height: finalH }
            });
        };

        const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    // --- Line / Arrow Resize Logic (Existing) ---
    const onLineDragStart = (e, handleType) => {
        // ... (Keep existing logic exactly as is)
        e.stopPropagation(); e.preventDefault();
        const node = getNode(id); if (!node) return;
        const startX = node.position.x; const startY = node.position.y;
        let w = parseFloat(node.style?.width) || 100;
        let h = parseFloat(node.style?.height) || 100;
        const currentRot = node.data?.rotation ?? rotation ?? 0;
        const rotRad = (currentRot * Math.PI) / 180;
        const cx = startX + w / 2; const cy = startY + h / 2;
        const cos = Math.cos(rotRad); const sin = Math.sin(rotRad);
        const halfW = w / 2;
        const vecX = halfW * cos; const vecY = halfW * sin;
        const pLeft = { x: cx - vecX, y: cy - vecY };
        const pRight = { x: cx + vecX, y: cy + vecY };

        const onPointerMove = (moveEvent) => {
            moveEvent.stopPropagation(); moveEvent.preventDefault();
            const mousePos = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
            let fixedPoint, movingPoint;
            if (handleType === 'left') { fixedPoint = pRight; movingPoint = mousePos; }
            else { fixedPoint = pLeft; movingPoint = mousePos; }
            const dx = movingPoint.x - fixedPoint.x; const dy = movingPoint.y - fixedPoint.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const newWidth = Math.max(1, dist);
            let angleRad;
            if (handleType === 'right') angleRad = Math.atan2(dy, dx);
            else angleRad = Math.atan2(fixedPoint.y - movingPoint.y, fixedPoint.x - movingPoint.x);
            const newAngleDeg = (angleRad * 180) / Math.PI;
            const newCos = Math.cos(angleRad); const newSin = Math.sin(angleRad);
            let newCx, newCy;
            if (handleType === 'right') {
                newCx = (fixedPoint.x + fixedPoint.x + newWidth * newCos) / 2;
                newCy = (fixedPoint.y + fixedPoint.y + newWidth * newSin) / 2;
            } else {
                newCx = (fixedPoint.x - newWidth * newCos + fixedPoint.x) / 2;
                newCy = (fixedPoint.y - newWidth * newSin + fixedPoint.y) / 2;
            }
            updateNode(id, {
                position: { x: newCx - newWidth / 2, y: newCy - h / 2 },
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
        <div style={{ width: '100%', height: '100%', minWidth: '1px', minHeight: '1px', position: 'relative' }}>
            <div style={{
                width: '100%', height: '100%',
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                opacity: opacity
            }} ref={centerRef}>

                {/* --- Handles for 2D Shapes --- */}
                {!isLine && selected && (
                    <>
                        <CustomHandle cursor="nw-resize" style={{ top: -6, left: -6 }} onPointerDown={(e) => onResizeStart(e, 'nw')} />
                        <CustomHandle cursor="ne-resize" style={{ top: -6, right: -6 }} onPointerDown={(e) => onResizeStart(e, 'ne')} />
                        <CustomHandle cursor="sw-resize" style={{ bottom: -6, left: -6 }} onPointerDown={(e) => onResizeStart(e, 'sw')} />
                        <CustomHandle cursor="se-resize" style={{ bottom: -6, right: -6 }} onPointerDown={(e) => onResizeStart(e, 'se')} />
                        <RotationHandle rotateRef={rotateRef} onMouseDown={onRotateStart} />
                    </>
                )}

                {/* --- Handles for Line/Arrow --- */}
                {isLine && selected && (
                    <>
                        <CustomHandle cursor="crosshair" style={{ top: '50%', left: 0, transform: 'translate(-50%, -50%)' }} onPointerDown={(e) => onLineDragStart(e, 'left')} />
                        <CustomHandle cursor="crosshair" style={{ top: '50%', right: 0, transform: 'translate(50%, -50%)' }} onPointerDown={(e) => onLineDragStart(e, 'right')} />
                    </>
                )}

                <div style={{
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'
                }}>
                    <svg
                        viewBox={!isLine ? "0 0 100 100" : undefined}
                        width="100%" height="100%"
                        preserveAspectRatio="none"
                        style={{ overflow: 'visible' }}
                    >
                        <defs>
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
