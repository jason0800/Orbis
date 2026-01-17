import React, { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import { getSmoothPath } from '../utils/drawing';
import { useNodeRotate } from '../hooks/useNodeRotate';
import RotationHandle from './RotationHandle';

const FreehandNode = ({ data, selected, id }) => {
    const { points = [], color = 'var(--text-primary)', strokeWidth = 3, width = 100, height = 100, rotation = 0 } = data;
    const { rotateRef, centerRef, onRotateStart } = useNodeRotate(id, rotation);

    // Convert points array to SVG path
    const pathData = getSmoothPath(points);

    return (
        <div style={{ width: '100%', height: '100%', minWidth: '20px', minHeight: '20px', position: 'relative' }}>
            {/* Rotated Container */}
            <div
                ref={centerRef}
                style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    position: 'relative'
                }}
            >
                <NodeResizer
                    color="#646cff"
                    isVisible={selected}
                    minWidth={20}
                    minHeight={20}
                />

                {selected && (
                    <RotationHandle rotateRef={rotateRef} onMouseDown={onRotateStart} />
                )}

                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    preserveAspectRatio="none"
                    style={{ width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
                >
                    <path
                        d={pathData}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        // Since we are using viewBox 0 0 w h, and points are normalized to 0..w, 0..h
                        // Scaling happens automatically via SVG scaling.
                        // However, stroke width might scale too? 
                        // vector-effect="non-scaling-stroke" keeps stroke width constant!
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            </div>
        </div>
    );
};

export default memo(FreehandNode);
