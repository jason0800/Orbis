import React, { memo } from 'react';
import { NodeResizer } from '@xyflow/react';

const FreehandNode = ({ data, selected }) => {
    const { points = [], color = 'var(--text-primary)', strokeWidth = 3 } = data;

    // Convert points array to SVG path
    const pathData = points.length > 0
        ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
        : '';

    // Calculate bounding box for the SVG viewbox if needed, or just let it overflow with standard CSS
    // For simplicity, we assume the node position is the top-left of the bounding box, 
    // and points are relative to it, OR points are global and we need to normalize.
    // Let's assume points are relative to the node's position (0,0).

    return (
        <div style={{ width: '100%', height: '100%', minWidth: '50px', minHeight: '50px', position: 'relative' }}>
            <NodeResizer
                color="#646cff"
                isVisible={selected}
                minWidth={30}
                minHeight={30}
            />
            <svg style={{ width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
                <path
                    d={pathData}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

export default memo(FreehandNode);
