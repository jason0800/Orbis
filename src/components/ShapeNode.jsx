import React, { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import useAppStore from '../store/useAppStore';
import { useNodeRotate } from '../hooks/useNodeRotate';
import RotationHandle from './RotationHandle';

const ShapeNode = ({ data, selected, id }) => {
    const { shapeType = 'rectangle', stroke, rotation = 0 } = data;
    const { rotateRef, centerRef, onRotateStart } = useNodeRotate(id, rotation);

    const commonProps = {
        stroke: (!stroke || stroke === '#fff') ? 'var(--shape-stroke)' : stroke,
        strokeWidth: 2,
        fill: 'transparent',
        vectorEffect: "non-scaling-stroke",
    };

    // Use a fixed viewBox coordinate system (0 0 100 100) to ensure consistent scaling
    // mirroring the FreehandNode behavior.

    return (
        <div style={{ width: '100%', height: '100%', minWidth: '50px', minHeight: '50px', position: 'relative' }}>

            <div style={{
                width: '100%',
                height: '100%',
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center center',
            }} ref={centerRef}>

                {/* Standard Resizer for 2D shapes */}
                {!['line', 'arrow'].includes(shapeType) && (
                    <NodeResizer
                        color="#646cff"
                        isVisible={selected}
                        minWidth={20}
                        minHeight={20}
                    />
                )}

                {/* Custom Resizer for 1D shapes (Line/Arrow) - Only Left/Right handles? 
                    Actually NodeResizer doesn't support restriction easily. 
                    Let's just use NodeResizer for now but maybe try to hide top/bottom via CSS? 
                    Or just keep 4 handles but hide rotation.
                    User explicitly said "We only need 2 handles".
                    For now, I will render NodeResizer for ALL, but Hide Rotation for Line/Arrow.
                */}
                {['line', 'arrow'].includes(shapeType) && (
                    <NodeResizer
                        color="#646cff"
                        isVisible={selected}
                        minWidth={20}
                        minHeight={20}
                    // We might want to custom style to hide top/bottom handles later
                    />
                )}

                {selected && !['line', 'arrow'].includes(shapeType) && (
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
                            {/* Marker needs to account for scaling? 
                                With viewBox scaling, the marker size in user units (100x100 space) is huge.
                                But with non-scaling-stroke, the stroke is thin.
                                Often markers need adjustments or orient="auto" handle it.
                                Let's define marker in the same unit space.
                             */}
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
