import React from 'react';

const RotationHandle = ({ rotateRef, onMouseDown }) => {
    return (
        <div
            ref={rotateRef}
            onMouseDown={onMouseDown}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onMouseUp={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className="nodrag"
            title="Rotate"
            style={{
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '10px',
                height: '10px',
                background: '#646cff',
                borderRadius: '50%',
                cursor: 'grab',
                zIndex: 100
            }}
        >
            <div style={{ position: 'absolute', top: '100%', left: '50%', width: '1px', height: '15px', background: '#646cff', transform: 'translateX(-50%)' }} />
        </div>
    );
};

export default RotationHandle;
