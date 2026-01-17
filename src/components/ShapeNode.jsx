import React, { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import useAppStore from '../store/useAppStore';
import { useNodeRotate } from '../hooks/useNodeRotate';
import RotationHandle from './RotationHandle';

const ShapeNode = ({ data, selected, id }) => {
    const { shapeType = 'rectangle', stroke, rotation = 0 } = data;
    const { rotateRef, centerRef, onRotateStart } = useNodeRotate(id);

    const style = {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
    };

    const commonProps = {
        stroke: (!stroke || stroke === '#fff') ? 'var(--shape-stroke)' : stroke,
        strokeWidth: 2,
        fill: 'transparent',
        vectorEffect: "non-scaling-stroke",
    };

    return (
        <div style={{ width: '100%', height: '100%', minWidth: '50px', minHeight: '50px', position: 'relative' }}>

            <div style={{
                width: '100%',
                height: '100%',
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
            }} ref={centerRef}>

                <NodeResizer
                    color="#646cff"
                    isVisible={selected}
                    minWidth={20}
                    minHeight={20}
                />

                {selected && (
                    <RotationHandle rotateRef={rotateRef} onMouseDown={onRotateStart} />
                )}

                <div style={style}>
                    <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                            <marker id={`arrowhead-${id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={commonProps.stroke} />
                            </marker>
                        </defs>

                        {(shapeType === 'rectangle' || shapeType === 'diamond') && (
                            <rect x="0" y="0" width="100%" height="100%" rx={5} {...commonProps} />
                        )}
                        {shapeType === 'circle' && (
                            <ellipse cx="50%" cy="50%" rx="50%" ry="50%" {...commonProps} />
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
