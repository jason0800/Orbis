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

    const handleBlur = (e) => {
        // Prevent closing if we are just switching focus to another element inside this node
        if (wrapperRef.current && wrapperRef.current.contains(e.relatedTarget)) {
            return;
        }
        setIsEditing(false);
        updateNodeData(id, { name, description });
    };

    useEffect(() => {
        if (isEditing) {
            // focus logic is handled by autoFocus on inputs
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
                boxSizing: 'border-box',
                overflow: 'hidden' // Ensure nothing spills out
            }}
        >
            <NodeResizer
                color="#646cff"
                isVisible={selected}
                minWidth={150}
                minHeight={80}
            />

            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: (isEditing || data.description) ? '4px' : '0', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <Folder size={20} color="#646cff" style={{ marginRight: '8px', flexShrink: 0 }} />
                    {isEditing ? (
                        <input
                            className="nodrag"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleBlur}
                            autoFocus
                            placeholder="Folder Name"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--node-text)',
                                padding: '0',
                                width: '100%',
                                fontWeight: 'bold',
                                fontSize: 'inherit',
                                fontFamily: 'inherit',
                                outline: 'none'
                            }}
                        />
                    ) : (
                        <div style={{
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1
                        }} title={data.name}>
                            {data.name}
                        </div>
                    )}
                </div>

            </div>

            {/* Edit Button Removed */}


            {
                isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflow: 'hidden' }}>
                        <textarea
                            className="nodrag"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleBlur}
                            placeholder="Add a description..."
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderTop: 'none', // Removed separate border
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
                    </div>
                ) : (
                    data.description && (
                        <div style={{
                            fontSize: '0.85em',
                            color: 'var(--text-secondary)',
                            borderTop: 'none', // Removed separator
                            marginTop: '4px',
                            paddingTop: '0',
                            whiteSpace: 'pre-wrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {data.description}
                        </div>
                    )
                )
            }

            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </div >
    );
};

export default memo(FolderNode);
