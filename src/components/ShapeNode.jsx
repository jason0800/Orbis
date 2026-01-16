import React, { memo } from 'react';
import { NodeResizer } from '@xyflow/react';

const ShapeNode = ({ data, selected, id, type }) => {
    const { shapeType = 'rectangle', color = '#fff', stroke } = data;

    const style = {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)', // Inherit theme color
    };

    const commonProps = {
        width: '100%',
        height: '100%',
        stroke: stroke || 'var(--shape-stroke)', // Use theme variable
        strokeWidth: 2,
        fill: 'transparent', // or semi-transparent
    };

    return (
        <div style={{ width: '100%', height: '100%', minWidth: '50px', minHeight: '50px' }}>
            <NodeResizer
                color="#646cff"
                isVisible={selected}
                minWidth={20}
                minHeight={20}
            />

            <svg style={style}>
                {shapeType === 'rectangle' && (
                    <rect {...commonProps} rx={5} />
                )}
                {shapeType === 'circle' && (
                    <ellipse cx="50%" cy="50%" rx="48%" ry="48%" {...commonProps} />
                )}
                {shapeType === 'diamond' && (
                    <polygon points="50,0 100,50 50,100 0,50" transform="scale(0.01 0.01) scale(100 100)" vectorEffect="non-scaling-stroke" {...commonProps} />
                )}
                {shapeType === 'line' && (
                    <line x1="0" y1="50%" x2="100%" y2="50%" {...commonProps} />
                )}
            </svg>
        </div>
    );
};

export default memo(ShapeNode);
