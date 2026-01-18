import React, { memo } from 'react';
import { useReactFlow, NodeResizer } from '@xyflow/react';
import { getSmoothPath } from '../utils/drawing';
import useAppStore from '../store/useAppStore';
import { useNodeRotate } from '../hooks/useNodeRotate';
import RotationHandle from './RotationHandle';

const CustomHandle = ({ cursor, onPointerDown, style }) => (
    <div
        onPointerDown={onPointerDown}
        className="nodrag"
        style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: '#6cb056',
            borderRadius: '0',
            cursor: cursor,
            zIndex: 10,
            border: '1px solid #3a6b24',
            boxSizing: 'border-box',
            touchAction: 'none',
            pointerEvents: 'auto',
            ...style
        }}
    />
);

const FreehandNode = ({ id, data, selected }) => {
    // Destructure props just like ShapeNode usually does
    const {
        points = [],
        stroke = '#000000',
        strokeWidth = 2,
        strokeStyle = 'solid',
        opacity = 1,
        rotation = 0
    } = data;

    // We already have rotation logic hook
    const { rotateRef, centerRef, onRotateStart } = useNodeRotate(id, rotation);
    const { screenToFlowPosition, getNode } = useReactFlow();
    const updateNode = useAppStore((state) => state.updateNode);

    // --- Resize Logic (Flipping Support) ---
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

        const rotDeg = rotation;
        const rotRad = (rotDeg * Math.PI) / 180;
        const cos = Math.cos(-rotRad);
        const sin = Math.sin(-rotRad);

        const onPointerMove = (moveEvent) => {
            moveEvent.stopPropagation();
            moveEvent.preventDefault();

            const currentMouse = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
            const globalDx = currentMouse.x - startMouse.x;
            const globalDy = currentMouse.y - startMouse.y;

            const localDx = globalDx * cos - globalDy * sin;
            const localDy = globalDx * sin + globalDy * cos;

            let newL = 0, newT = 0, newR = w, newB = h;

            if (dir.includes('n')) newT += localDy;
            if (dir.includes('s')) newB += localDy;
            if (dir.includes('w')) newL += localDx;
            if (dir.includes('e')) newR += localDx;

            const finalL = Math.min(newL, newR);
            const finalR = Math.max(newL, newR);
            const finalT = Math.min(newT, newB);
            const finalB = Math.max(newT, newB);

            const finalW = Math.max(1, finalR - finalL);
            const finalH = Math.max(1, finalB - finalT);

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

    const pathD = React.useMemo(() => getSmoothPath(points), [points]);

    const getStrokeDasharray = (style) => {
        switch (style) {
            case 'dashed': return '5,5';
            case 'dotted': return '1,1';
            default: return 'none';
        }
    };

    const styleProps = {
        stroke: stroke,
        strokeWidth: strokeWidth,
        strokeDasharray: getStrokeDasharray(strokeStyle),
        opacity: opacity,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        fill: 'none', // Freehand is always line-only
        pointerEvents: 'auto'
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>

            <div style={{
                width: '100%',
                height: '100%',
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                opacity: opacity
            }} ref={centerRef}>

                {selected && (
                    <div style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, border: '1px solid #6cb056', pointerEvents: 'none' }} />
                )}

                {selected && (
                    <>
                        <CustomHandle cursor="nw-resize" style={{ top: -10, left: -10 }} onPointerDown={(e) => onResizeStart(e, 'nw')} />
                        <CustomHandle cursor="ne-resize" style={{ top: -10, right: -10 }} onPointerDown={(e) => onResizeStart(e, 'ne')} />
                        <CustomHandle cursor="sw-resize" style={{ bottom: -10, left: -10 }} onPointerDown={(e) => onResizeStart(e, 'sw')} />
                        <CustomHandle cursor="se-resize" style={{ bottom: -10, right: -10 }} onPointerDown={(e) => onResizeStart(e, 'se')} />
                    </>
                )}

                {selected && (
                    <RotationHandle rotateRef={rotateRef} onMouseDown={onRotateStart} />
                )}

                <svg
                    style={{ overflow: 'visible', width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${data.width || 100} ${data.height || 100}`}
                    preserveAspectRatio="none"
                >
                    {/* Invisible Hit Area */}
                    <path
                        d={pathD}
                        stroke="transparent"
                        strokeWidth={Math.max(strokeWidth, 12)}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        style={{ pointerEvents: 'auto', cursor: 'move' }}
                    />
                    <path
                        d={pathD}
                        {...styleProps}
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            </div>
        </div>
    );
};

export default memo(FreehandNode);
