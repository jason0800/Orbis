import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeResizer } from '@xyflow/react';

const TextNode = ({ data, selected, id }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(data.text || 'Text');
    const textareaRef = useRef(null);

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        data.onChange?.(id, { text }); // Callback to update store
    };

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    return (
        <div
            style={{
                minWidth: '50px',
                minHeight: '20px',
                height: '100%',
                width: '100%',
                border: selected && !isEditing ? '1px dashed #646cff' : '1px solid transparent',
                padding: '5px'
            }}
            onDoubleClick={handleDoubleClick}
        >
            <NodeResizer
                color="#646cff"
                isVisible={selected}
                minWidth={50}
                minHeight={20}
            />
            {isEditing ? (
                <textarea
                    className="nodrag"
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={handleBlur}
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'transparent', // Ensure transparent
                        color: 'var(--node-text)', // Use consistent text color var
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        overflow: 'hidden', // Hide scrollbars
                        lineHeight: '1.5'
                    }}
                />
            ) : (
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                    {text}
                </div>
            )}
        </div>
    );
};

export default memo(TextNode);
