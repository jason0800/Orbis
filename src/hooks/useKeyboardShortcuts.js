import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';

export const useKeyboardShortcuts = () => {
    const { setActiveTool } = useAppStore();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if input is focused
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
            if (e.target.isContentEditable) return;

            const {
                setActiveTool,
                copySelectedNodes,
                pasteNodes,
                undo,
                redo,
                unselectAll
            } = useAppStore.getState();

            // Tools (Reordered 1-9, no Diamond)
            switch (e.key.toLowerCase()) {
                case '1': setActiveTool('select'); break;
                case '2': setActiveTool('pan'); break;
                case '3': setActiveTool('node'); break;
                case '4': setActiveTool('text'); break;
                case '5': setActiveTool('rectangle'); break;
                case '6': setActiveTool('circle'); break;
                case '7': setActiveTool('arrow'); break; // Was Diamond
                case '8': setActiveTool('line'); break; // Was Arrow
                case '9': setActiveTool('freehand'); break; // Was Line
                // case '0': break; // Freehand was 0
                case 'e': setActiveTool('eraser'); break;
                case 'escape': unselectAll(); break;
                default: break;
            }

            // Actions (Ctrl/Cmd + ...)
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'c') {
                    e.preventDefault();
                    copySelectedNodes();
                }
                if (e.key === 'v') {
                    e.preventDefault();
                    pasteNodes();
                }
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                }
                if (e.key === 'y') {
                    e.preventDefault();
                    redo();
                }
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                useAppStore.getState().deleteSelectedElements();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTool]);
};
