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
                top: '-18px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '7px',
                height: '7px',
                background: '#646cff',
                borderRadius: '50%',
                cursor: 'grab',
                zIndex: 100
            }}
        >
            {/* Stick removed as per user request */}
        </div>
    );
};

export default RotationHandle;
