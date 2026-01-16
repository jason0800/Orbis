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
                case '1': setActiveTool('pan'); break;
                case '2': setActiveTool('select'); break;
                case '3': setActiveTool('node'); break;
                case 't': setActiveTool('text'); break;
                case 'r': setActiveTool('rectangle'); break;
                case 'c': setActiveTool('circle'); break;
                case 'd': setActiveTool('diamond'); break;
                case 'a': setActiveTool('arrow'); break;
                case 'l': setActiveTool('line'); break;
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
