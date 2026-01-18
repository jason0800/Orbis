import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeResizer, useReactFlow } from '@xyflow/react';
import useAppStore from '../store/useAppStore';
import { useNodeRotate } from '../hooks/useNodeRotate';
import RotationHandle from './RotationHandle';

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

const TextNode = ({ data, selected, id }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(data.text || 'Text');
    const textareaRef = useRef(null);
    const wrapperRef = useRef(null);
    const updateNode = useAppStore((state) => state.updateNode);

    const {
        stroke = 'var(--text-primary)', // Text Color 
        opacity = 1,
        rotation = 0
    } = data;

    const { rotateRef, centerRef, onRotateStart } = useNodeRotate(id, rotation);
    // Actually I should just use useReactFlow from line 2 import?
    // Line 2 imports NodeResizer. I need useReactFlow.
    // I will add useReactFlow to imports.
    // Wait, replace_file_content of imports is messy if I don't see them all.
    // Line 2: import { NodeResizer } from '@xyflow/react';
    // I can change line 2.

    const rf = useReactFlow(); // Call hook
    // updateNode already exists from line 12

    // --- Reuse Resize Logic ---
    const onResizeStart = (e, dir) => {
        e.stopPropagation();
        e.preventDefault();

        const node = rf.getNode(id);
        if (!node) return;

        const startMouse = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const startX = node.position.x;
        const startY = node.position.y;

        let w = parseFloat(node.style?.width) || 100;
        let h = parseFloat(node.style?.height) || 100;

        // Visual rotation
        const rotDeg = rotation;
        const rotRad = (rotDeg * Math.PI) / 180;
        const cos = Math.cos(-rotRad);
        const sin = Math.sin(-rotRad);

        const onPointerMove = (moveEvent) => {
            moveEvent.stopPropagation();
            moveEvent.preventDefault();

            const currentMouse = rf.screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
            const globalDx = currentMouse.x - startMouse.x;
            const globalDy = currentMouse.y - startMouse.y;

            // Project to local unrotated space
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

            const finalW = Math.max(1, finalR - finalL);
            const finalH = Math.max(1, finalB - finalT);

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
    };

    const handleBlur = (e) => {
        // Prevent closing if we are just switching focus to another element inside this node
        if (centerRef.current && centerRef.current.contains(e.relatedTarget)) {
            return;
        }
        setIsEditing(false);
        // Persist text
        updateNode(id, { data: { ...data, text } });
    };

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    // Dynamic Font Scaling Logic
    // We bind local font size to the actual LOCAL height of the node div.
    // However, React Flow nodes have style.height coming from the store.
    // We can just use percentages or flex logic?
    // "Text should scale when I drag resize handles".
    // If I drag resize, the node's style.width/height change.
    // I can just set fontSize = '50%' of height? No, percentage font size is relative to parent font size.
    // I need visual scaling.
    // CSS `container-type` is new.
    // Simpler: Use `transform` or use a ResizeObserver to set fontSize.
    // Actually, let's look at the node's style prop directly if available? No, props are data.
    // Let's use a ResizeObserver on the wrapper to update a local scale factor.

    // OR simpler:
    // Just render the text in a viewBox SVG? No, text wrapping is hard.

    // Simplest:
    // When NOT editing, render a scaled div.
    // `transform: scale(...)` based on some base size.
    // E.g. Base size 100x20. Current size 200x40 -> Scale 2.

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div
                ref={centerRef}
                style={{
                    height: '100%',
                    width: '100%',
                    position: 'relative', // Ensure handles position relative to this rotated element
                    // Remove dashed border
                    border: 'none',
                    opacity: opacity,
                    // Center text vertically/horizontally usually? Excalidraw aligns left/center?
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'visible', // Changed to visible so Box/Handles aren't clipped?
                    // Wait, text overflow? 
                    // User said "text is causing vertical lines".
                    // If I use overflow: hidden, handles at -4px might be clipped?
                    // Handles are usually outside.
                    // If overflow is hidden, handles are GONE.
                    // Current code had overflow: 'hidden'.
                    // Handles appeared?
                    // If handles are pos: absolute and outside, they are clipped.
                    // THIS might be why "handles don't look right".
                    // I MUST use overflow: 'visible'.
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center'
                }}
                onDoubleClick={handleDoubleClick}
            >
                {selected && (
                    <div style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, border: '1px solid #b4e6a0', pointerEvents: 'none' }} />
                )}
                {selected && (
                    <>
                        <CustomHandle cursor="nw-resize" style={{ top: -10, left: -10 }} onPointerDown={(e) => onResizeStart(e, 'nw')} />
                        <CustomHandle cursor="ne-resize" style={{ top: -10, right: -10 }} onPointerDown={(e) => onResizeStart(e, 'ne')} />
                        <CustomHandle cursor="sw-resize" style={{ bottom: -10, left: -10 }} onPointerDown={(e) => onResizeStart(e, 'sw')} />
                        <CustomHandle cursor="se-resize" style={{ bottom: -10, right: -10 }} onPointerDown={(e) => onResizeStart(e, 'se')} />
                    </>
                )}
                {selected && (
                    <RotationHandle rotateRef={rotateRef} onMouseDown={onRotateStart} />
                )}
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
                            background: 'transparent',
                            color: stroke,
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            textAlign: 'center',
                            fontFamily: 'inherit',
                            fontSize: '24px',
                            lineHeight: '1.2',
                            overflow: 'hidden' // Textarea can clip itself
                        }}
                    />
                ) : (
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        color: stroke,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        fontSize: '16px',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transformOrigin: 'center center',
                        overflow: 'hidden' // Text display clips itself
                    }}>
                        <AutoScaledText text={text} />
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper for scaling text
const AutoScaledText = ({ text }) => {
    // Actually, CSS `container-type: size` + `font-size: 50cqh`?
    // Support is good in modern browsers.
    return (
        <div style={{
            width: '100%',
            height: '100%',
            containerType: 'size',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <span style={{
                fontSize: '40cqh', // 40% of container height
                lineHeight: 1,
                whiteSpace: 'nowrap' // Single line scaling? 
                // User requirement: "text should also scale".
                // Usually means bigger box = bigger text.
            }}>
                {text}
            </span>
        </div>
    );
}

export default memo(TextNode);
