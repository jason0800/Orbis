import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Folder } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const FolderNode = ({ data, selected, id }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(data.name);
    const [description, setDescription] = useState(data.description || '');
    const { updateNodeData } = useAppStore();
    const wrapperRef = useRef(null);

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        updateNodeData(id, { name, description });
    };

    useEffect(() => {
        if (isEditing) {
            // focus first input
        }
    }, [isEditing]);

    return (
        <div
            ref={wrapperRef}
            onDoubleClick={handleDoubleClick}
            style={{
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--node-bg)',
                border: selected ? '2px solid var(--accent-color)' : '1px solid var(--node-border)',
                minWidth: '150px',
                color: 'var(--node-text)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
        >
            <NodeResizer
                color="#646cff"
                isVisible={selected}
                minWidth={150}
                minHeight={80}
            />

            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <Folder size={20} color="#646cff" style={{ marginRight: '8px' }} />

                {isEditing ? (
                    <input
                        className="nodrag"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleBlur}
                        autoFocus
                        style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--accent-color)',
                            color: 'var(--text-primary)',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            width: '100%',
                            fontWeight: 'bold'
                        }}
                    />
                ) : (
                    <div style={{ fontWeight: 'bold' }}>{data.name}</div>
                )}
            </div>

            {isEditing ? (
                <textarea
                    className="nodrag"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Description..."
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--accent-color)',
                        color: 'var(--text-primary)',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        width: '100%',
                        fontSize: '0.85em',
                        minHeight: '40px',
                        resize: 'none',
                        fontFamily: 'inherit'
                    }}
                />
            ) : (
                data.description && (
                    <div style={{
                        fontSize: '0.85em',
                        color: '#aaa',
                        borderTop: '1px solid #444',
                        marginTop: '4px',
                        paddingTop: '4px',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {data.description}
                    </div>
                )
            )}

            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </div>
    );
};

export default memo(FolderNode);
