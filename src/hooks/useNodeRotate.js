import { useRef, useCallback } from 'react';
import useAppStore from '../store/useAppStore';

export const useNodeRotate = (id, initialRotation = 0) => {
    const { updateNodeData, setIsInteracting } = useAppStore();
    const rotateRef = useRef(null);
    const centerRef = useRef(null);

    const onRotateStart = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsInteracting(true); // Flag interaction start

        // Ensure we have the center ref
        if (!centerRef.current) return;

        const rect = centerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate initial angle of mouse relative to center
        const startX = e.clientX - centerX;
        const startY = e.clientY - centerY;
        const startMouseAngle = Math.atan2(startY, startX) * (180 / Math.PI);

        // Store the node's starting rotation
        const startRotation = initialRotation;

        const onRotate = (moveEvent) => {
            const currentX = moveEvent.clientX;
            const currentY = moveEvent.clientY;

            // Calculate current angle
            const dx = currentX - centerX;
            const dy = currentY - centerY;
            const currentMouseAngle = Math.atan2(dy, dx) * (180 / Math.PI);

            // Calculate delta
            const diff = currentMouseAngle - startMouseAngle;

            // New rotation = start + diff
            const newRotation = startRotation + diff;

            updateNodeData(id, { rotation: newRotation });
        };

        const onRotateEnd = () => {
            document.removeEventListener('mousemove', onRotate);
            document.removeEventListener('mouseup', onRotateEnd);
            // Delay clearing interaction flag to prevent click event race
            setTimeout(() => {
                setIsInteracting(false);
            }, 100);
        };

        document.addEventListener('mousemove', onRotate);
        document.addEventListener('mouseup', onRotateEnd);
    }, [id, initialRotation, updateNodeData, setIsInteracting]);

    return { rotateRef, centerRef, onRotateStart };
};
