import React, { memo } from 'react';
import { useReactFlow, NodeResizer } from '@xyflow/react';
import { getSmoothPath } from '../utils/drawing';
import useAppStore from '../store/useAppStore';
import { useNodeRotate } from '../hooks/useNodeRotate';
import RotationHandle from './RotationHandle';

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
        fill: 'none' // Freehand is always line-only
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>

            <div style={{
                width: '100%',
                height: '100%',
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                opacity: opacity
            }} ref={centerRef}>

                <NodeResizer
                    color="#646cff"
                    isVisible={selected}
                    minWidth={10}
                    minHeight={10}
                />

                {selected && (
                    <RotationHandle rotateRef={rotateRef} onMouseDown={onRotateStart} />
                )}

                <svg
                    style={{ overflow: 'visible', width: '100%', height: '100%', display: 'block' }}
                    // Freehand points are already normalized to 0,0 and scaled to width/height by parent container?
                    // Actually, points are relative to x,y. 
                    // If we use viewBox="0 0 100 100" and preserveAspectRatio="none", we distort the drawing to fit the box.
                    // If we want it to scale, we should use viewBox="0 0 initialWidth initialHeight".
                    // However, we don't store initialWidth clearly.
                    // The safest way for freehand to scale is:
                    // 1. Render points in a 0..1 coordinate space? Expensive to recalc.
                    // 2. Use vector-effect non-scaling-stroke?
                    // Let's assume standard behavior: SVG scales to container.
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${data.width || 100} ${data.height || 100}`}
                    preserveAspectRatio="none"
                >
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
