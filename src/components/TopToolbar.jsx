import React from 'react';
import useAppStore from '../store/useAppStore';
import {
    MousePointer2,
    Hand,
    FolderPlus,
    Type,
    Square,
    Circle,
    ArrowRight,
    Minus,
    Image as ImageIcon,
    Eraser
} from 'lucide-react';

const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select (1)', shortcut: '1' },
    { id: 'pan', icon: Hand, label: 'Pan (2)', shortcut: '2' },
    { id: 'node', icon: FolderPlus, label: 'Add Folder (3)', shortcut: '3' },
    { divider: true },
    { id: 'text', icon: Type, label: 'Text (4)', shortcut: '4' },
    { id: 'rectangle', icon: Square, label: 'Rectangle (5)', shortcut: '5' },
    { id: 'circle', icon: Circle, label: 'Circle (6)', shortcut: '6' },

    { id: 'arrow', icon: ArrowRight, label: 'Arrow (7)', shortcut: '7' },
    { id: 'line', icon: Minus, label: 'Line (8)', shortcut: '8' },
    { id: 'freehand', icon: React.lazy(() => import('lucide-react').then(mod => ({ default: mod.Pencil }))), label: 'Freehand (9)', shortcut: '9' },
    // { id: 'image', icon: ImageIcon, label: 'Image (I)', shortcut: 'I' }, // Future impl
    { id: 'eraser', icon: Eraser, label: 'Eraser (E)', shortcut: 'E' },
];

const TopToolbar = () => {
    const { activeTool, setActiveTool } = useAppStore();

    return (
        <div className="top-toolbar" style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
            padding: '8px',
            background: 'var(--node-bg)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            border: '1px solid var(--border-color)',
            zIndex: 1000
        }}>
            {tools.map((tool, index) => {
                if (tool.divider) {
                    return <div key={`divider-${index}`} style={{ width: '1px', background: '#444', margin: '0 4px' }} />;
                }

                const Icon = tool.icon;
                const isActive = activeTool === tool.id;

                return (
                    <button
                        key={tool.id}
                        onClick={() => {
                            console.log('Toolbar button clicked:', tool.id);
                            setActiveTool(tool.id);
                        }}
                        title={`${tool.label}`}
                        style={{
                            background: isActive ? 'rgba(100, 108, 255, 0.2)' : 'transparent',
                            color: isActive ? '#646cff' : 'var(--text-secondary)',
                            border: isActive ? '1px solid #646cff' : '1px solid transparent',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            position: 'relative', // For absolute positioning of shortcut
                            minWidth: '36px',
                            minHeight: '36px'
                        }}
                    >
                        <Icon size={20} />
                        <span style={{
                            position: 'absolute',
                            bottom: '1px',
                            right: '2px',
                            fontSize: '9px',
                            opacity: 0.5,
                            fontFamily: 'monospace',
                            pointerEvents: 'none'
                        }}>
                            {tool.shortcut}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default TopToolbar;
