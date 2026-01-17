import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeResizer } from '@xyflow/react';
import useAppStore from '../store/useAppStore';

const TextNode = ({ data, selected, id }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(data.text || 'Text');
    const textareaRef = useRef(null);
    const wrapperRef = useRef(null);
    const updateNode = useAppStore((state) => state.updateNode);

    const {
        stroke = 'var(--text-primary)', // Text Color 
        opacity = 1
    } = data;

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
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
        <div
            ref={wrapperRef}
            style={{
                height: '100%',
                width: '100%',
                // Remove dashed border
                border: 'none',
                opacity: opacity,
                // Center text vertically/horizontally usually? Excalidraw aligns left/center?
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}
            onDoubleClick={handleDoubleClick}
        >
            <NodeResizer
                color="#646cff"
                isVisible={selected}
                minWidth={20}
                minHeight={10}
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
                        background: 'transparent',
                        color: stroke,
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        textAlign: 'center',
                        fontFamily: 'inherit',
                        // Fixed font size while editing? Or scaled?
                        // Scaled editing is weird. Let's maximize it.
                        fontSize: '24px',
                        lineHeight: '1.2'
                    }}
                />
            ) : (
                <div style={{
                    whiteSpace: 'pre-wrap',
                    color: stroke,
                    textAlign: 'center',
                    lineHeight: 1.2,
                    fontSize: '16px', // Base size
                    width: '100%',
                    height: '100%',
                    // Magical Scaling:
                    // We want text to fill the box.
                    // viewbox-like behavior.
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transformOrigin: 'center center'
                }}>
                    {/* 
                        To truly scale text with the box:
                        We need to know the ratio of current size to "content size".
                        But content size is dynamic.
                        
                        Compromise:
                        We set the font-size of this container to be proportional to height.
                        e.g. fontSize = 50% of container height.
                        This works via container queries or JS.
                        JS ResizeObserver is best.
                     */}
                    <AutoScaledText text={text} />
                </div>
            )}
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
