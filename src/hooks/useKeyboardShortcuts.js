import { useEffect } from 'react';
import useAppStore from '../store/useAppStore';

export const useKeyboardShortcuts = () => {
    const { setActiveTool } = useAppStore();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if input is focused
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
            if (e.target.isContentEditable) return;

            // Tools
            switch (e.key.toLowerCase()) {
                case '1': setActiveTool('select'); break;
                case '2': setActiveTool('pan'); break;
                case '3': setActiveTool('node'); break;
                case '4': setActiveTool('text'); break;
                case '5': setActiveTool('rectangle'); break;
                case '6': setActiveTool('circle'); break;
                case '7': setActiveTool('diamond'); break;
                case '8': setActiveTool('arrow'); break;
                case '9': setActiveTool('line'); break;
                case '0': setActiveTool('freehand'); break;
                case 'e': setActiveTool('eraser'); break;
                default: break;
            }

            // Actions (Ctrl/Cmd + ...)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                console.log('Save shortcut triggered');
                // trigger save logic
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                useAppStore.getState().deleteSelectedElements();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setActiveTool]);
};
