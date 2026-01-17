import React, { memo } from 'react';
import { NodeResizer } from '@xyflow/react';
import useAppStore from '../store/useAppStore';

const ShapeNode = ({ data, selected, id }) => {
    const { shapeType = 'rectangle', stroke, rotation = 0 } = data;

    const rotateRef = React.useRef(null);
    const centerRef = React.useRef(null);
    const { updateNodeData } = useAppStore();

    const onRotateStart = (e) => {
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const rect = centerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const onRotate = (moveEvent) => {
            const currentX = moveEvent.clientX;
            const currentY = moveEvent.clientY;

            // Calculate angle using atan2
            const dx = currentX - centerX;
            const dy = currentY - centerY;
            let deg = Math.atan2(dy, dx) * (180 / Math.PI);

            // Adjust to make the top handle 0 degrees (atan2 0 is right 3 o'clock)
            deg += 90;

            updateNodeData(id, { rotation: deg });
        };

        const onRotateEnd = () => {
            document.removeEventListener('mousemove', onRotate);
            document.removeEventListener('mouseup', onRotateEnd);
        };

        document.addEventListener('mousemove', onRotate);
        document.addEventListener('mouseup', onRotateEnd);
    };

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
        width: '100%',
        height: '100%',
        stroke: (!stroke || stroke === '#fff') ? 'var(--shape-stroke)' : stroke,
        strokeWidth: 2,
        fill: 'transparent',
        vectorEffect: "non-scaling-stroke", // Helps line width stay consistent? Maybe not with scale transform on polygon
    };

    return (
        <div style={{ width: '100%', height: '100%', minWidth: '50px', minHeight: '50px', position: 'relative' }}>

            {/* 
                Structure: 
                Outer: Positioned by ReactFlow (x, y)
                InnerRotator: Rotated by transform
                Content: SVG
            */}

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

                {/* Rotation Handle inside the rotated container so it stays at the "top" */}
                {selected && (
                    <div
                        ref={rotateRef}
                        onMouseDown={onRotateStart}
                        className="nodrag"
                        title="Rotate"
                        style={{
                            position: 'absolute',
                            top: '-30px',
                            left: '50%',
                            transform: 'translateX(-50%)', // Keeps it centered horizontally relative to the node
                            // We don't need to rotate this handle itself, as it inherits parent rotation
                            width: '12px',
                            height: '12px',
                            background: '#646cff',
                            borderRadius: '50%',
                            cursor: 'grab',
                            zIndex: 100
                        }}
                    >
                        <div style={{ position: 'absolute', top: '100%', left: '50%', width: '1px', height: '20px', background: '#646cff', transform: 'translateX(-50%)' }} />
                    </div>
                )}

                <svg style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-primary)',
                    overflow: 'visible'
                }}>
                    <defs>
                        <marker id={`arrowhead-${id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill={commonProps.stroke} />
                        </marker>
                    </defs>

                    {shapeType === 'rectangle' && (
                        <rect x="2" y="2" width="96%" height="96%" rx={5} {...commonProps} />
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
                    {shapeType === 'arrow' && (
                        <line x1="0" y1="50%" x2="100%" y2="50%" {...commonProps} markerEnd={`url(#arrowhead-${id})`} />
                    )}
                </svg>
            </div>
        </div>
    );
};

export default memo(ShapeNode);
