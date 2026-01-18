import React from 'react';

const RotationHandle = ({ rotateRef, onMouseDown }) => {
    return (
        <div
            ref={rotateRef}
            onMouseDown={onMouseDown}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            // Removed explicit onMouseUp stopPropagation
            className="nodrag"
            title="Rotate"
            style={{
                position: 'absolute',
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '8px',
                height: '8px',
                background: '#b4e6a0',
                border: '1px solid #3a6b24',
                borderRadius: '50%',
                cursor: 'grab',
                zIndex: 100,
                pointerEvents: 'auto'
            }}
        >
            {/* Stick removed as per user request */}
        </div>
    );
};

export default RotationHandle;
