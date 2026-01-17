import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Folder, Pencil, Check } from 'lucide-react';
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
                width: '100%',
                height: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--node-bg)',
                border: selected ? '2px solid var(--accent-color)' : '1px solid var(--node-border)',
                minWidth: '150px',
                color: 'var(--node-text)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box'
            }}
        >
            <NodeResizer
                color="#646cff"
                isVisible={selected}
                minWidth={150}
                minHeight={80}
            />

            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Folder size={20} color="#646cff" style={{ marginRight: '8px' }} />
                    {isEditing ? (
                        <input
                            className="nodrag"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            placeholder="Folder Name"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid var(--accent-color)', // Subtle indicator of focus
                                color: 'var(--node-text)',
                                padding: '0',
                                width: '100%',
                                fontWeight: 'bold',
                                fontSize: 'inherit', // Inherit from parent
                                fontFamily: 'inherit',
                                outline: 'none'
                            }}
                        />
                    ) : (
                        <div style={{ fontWeight: 'bold' }}>{data.name}</div>
                    )}
                </div>

                {/* Edit Button (visible on hover or select could be better, but always visible is safer for discovery) */}
                {!isEditing && (selected || data.hovered) && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="nodrag"
                        title="Edit Node"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '2px'
                        }}
                    >
                        <Pencil size={14} />
                    </button>
                )}
            </div>

            {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    <textarea
                        className="nodrag"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a description..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderTop: '1px solid var(--node-border)', // Match the non-edit separator
                            color: 'var(--node-text)',
                            padding: '4px 0',
                            width: '100%',
                            height: '100%',
                            flex: 1,
                            fontSize: '0.85em',
                            resize: 'none',
                            fontFamily: 'inherit',
                            outline: 'none',
                            opacity: 0.8
                        }}
                    />
                    <button
                        onClick={handleBlur}
                        className="nodrag"
                        style={{
                            alignSelf: 'flex-end',
                            background: 'var(--accent-color)', // Use theme variable
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '0.75em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: 0.9,
                            fontWeight: 'bold',
                            marginTop: '2px'
                        }}
                    >
                        <Check size={12} /> Done
                    </button>
                </div>
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
