import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Folder, Pencil, Check } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const CustomHandle = ({ cursor, onPointerDown, style }) => (
    <div
        onPointerDown={onPointerDown}
        className="nodrag"
        style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            background: '#b4e6a0',
            borderRadius: '0',
            cursor: cursor,
            zIndex: 10,
            border: '1px solid #3a6b24',
            boxSizing: 'border-box',
            touchAction: 'none',
            pointerEvents: 'auto',
            ...style
        }}
    />
);

const FolderNode = ({ data, selected, id }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(data.name);
    const [description, setDescription] = useState(data.description || '');
    const [hasError, setHasError] = useState(false);
    const updateNodeData = useAppStore((state) => state.updateNodeData);
    const updateNode = useAppStore((state) => state.updateNode);
    const wrapperRef = useRef(null);
    const { screenToFlowPosition, getNode } = useReactFlow();

    // --- Resize Logic ---
    const onResizeStart = (e, dir) => {
        e.stopPropagation();
        e.preventDefault();

        const node = getNode(id);
        if (!node) return;

        const startMouse = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const startX = node.position.x;
        const startY = node.position.y;

        let w = parseFloat(node.style?.width) || 150;
        let h = parseFloat(node.style?.height) || 80;

        // No rotation for Folders usually, but logic supports it if 0
        const rotDeg = data.rotation || 0;
        const rotRad = (rotDeg * Math.PI) / 180;
        const cos = Math.cos(-rotRad);
        const sin = Math.sin(-rotRad);

        const onPointerMove = (moveEvent) => {
            moveEvent.stopPropagation();
            moveEvent.preventDefault();

            const currentMouse = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
            const globalDx = currentMouse.x - startMouse.x;
            const globalDy = currentMouse.y - startMouse.y;

            const localDx = globalDx * cos - globalDy * sin;
            const localDy = globalDx * sin + globalDy * cos;

            let newL = 0, newT = 0, newR = w, newB = h;

            if (dir.includes('n')) newT += localDy;
            if (dir.includes('s')) newB += localDy;
            if (dir.includes('w')) newL += localDx;
            if (dir.includes('e')) newR += localDx;

            const finalL = Math.min(newL, newR);
            const finalR = Math.max(newL, newR);
            const finalT = Math.min(newT, newB);
            const finalB = Math.max(newT, newB);

            // Min dimensions for Folder
            const finalW = Math.max(150, finalR - finalL);
            const finalH = Math.max(50, finalB - finalT); // Allow smaller height if needed? Standard was minHeight 80. keeping 50 for flexibility or 80.

            const finalX = startX + finalL;
            const finalY = startY + finalT;

            updateNode(id, {
                position: { x: finalX, y: finalY },
                style: { ...node.style, width: finalW, height: finalH }
            });
        };

        const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    };

    const handleDoubleClick = () => {
        setIsEditing(true);
        setHasError(false); // Reset error on open
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
                border: '1px solid var(--node-border)',
                minWidth: '150px',
                color: 'var(--node-text)',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                overflow: 'hidden' // Ensure nothing spills out
            }}
        >
            {selected && (
                <div style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, border: '1px solid #b4e6a0', borderRadius: '8px', pointerEvents: 'none', zIndex: 5 }} />
            )}
            {selected && (
                <>
                    <CustomHandle cursor="nw-resize" style={{ top: -10, left: -10 }} onPointerDown={(e) => onResizeStart(e, 'nw')} />
                    <CustomHandle cursor="ne-resize" style={{ top: -10, right: -10 }} onPointerDown={(e) => onResizeStart(e, 'ne')} />
                    <CustomHandle cursor="sw-resize" style={{ bottom: -10, left: -10 }} onPointerDown={(e) => onResizeStart(e, 'sw')} />
                    <CustomHandle cursor="se-resize" style={{ bottom: -10, right: -10 }} onPointerDown={(e) => onResizeStart(e, 'se')} />
                </>
            )}

            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: (isEditing || data.description) ? '4px' : '0', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <Folder size={20} color="#6cb056" style={{ marginRight: '8px', flexShrink: 0 }} />
                    {isEditing ? (
                        <input
                            className="nodrag"
                            value={name}
                            onChange={(e) => {
                                const newName = e.target.value;
                                setName(newName);

                                // Live Validation
                                const trimmed = newName.trim();
                                const siblings = useAppStore.getState().nodes.filter(n =>
                                    n.id !== id &&
                                    n.type === 'folderNode' &&
                                    n.data.parentId === data.parentId
                                );
                                const isDup = siblings.some(n => n.data.name.trim().toLowerCase() === trimmed.toLowerCase());
                                setHasError(isDup);
                            }}
                            onBlur={(e) => {
                                // Prevent closing if we are just switching focus to another element inside this node
                                if (wrapperRef.current && wrapperRef.current.contains(e.relatedTarget)) {
                                    return;
                                }

                                const trimmedName = name.trim();
                                // Duplicate check again for safety (and getting siblings fresh)
                                const siblings = useAppStore.getState().nodes.filter(n =>
                                    n.id !== id &&
                                    n.type === 'folderNode' &&
                                    n.data.parentId === data.parentId
                                );
                                const isDuplicate = siblings.some(n => n.data.name.trim().toLowerCase() === trimmedName.toLowerCase());

                                if (isDuplicate || !trimmedName) {
                                    if (isDuplicate) alert(`A folder named "${trimmedName}" already exists.`);
                                    setName(data.name); // Revert
                                    setHasError(false);
                                    setIsEditing(false);
                                    return;
                                }

                                setIsEditing(false);
                                setHasError(false);
                                updateNodeData(id, { name: trimmedName, description });
                            }}
                            autoFocus
                            placeholder="Folder Name"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: hasError ? '2px solid red' : '1px solid var(--accent-color)',
                                color: hasError ? 'red' : 'var(--node-text)',
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
