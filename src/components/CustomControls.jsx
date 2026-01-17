import React from 'react';
import { useReactFlow } from '@xyflow/react';
import useAppStore from '../store/useAppStore';
import { Undo, Redo, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const CustomControls = () => {
    const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
    const { history, undo, redo } = useAppStore();

    // We can use a hook to get current zoom level to display percentage
    // ReactFlow doesn't provide a direct "useZoom" hook that triggers re-render easily on every zoom frame 
    // without using onMove callback in the main component. 
    // However, `useStore` from ReactFlow might be accessible? 
    // Simpler approach: Just read getZoom() when rendering? It won't update on scroll automatically.
    // To make it update live, we need to subscribe to viewport changes.
    // useViewport is available in modern ReactFlow.

    // BUT, for now, let's try just getting it or assuming typical controls don't always show LIVE %.
    // Wait, requirement is "add a % showing the current zoom".
    // I will use `useViewport` if available from @xyflow/react.
    // It returns { x, y, zoom }.

    // If not available, we might skip live updates or use an internal interval? 
    // Let's assume useViewport works.

    const [zoomPercent, setZoomPercent] = React.useState(100);

    // This loop is a bit hacky if useViewport isn't imported. 
    // Let's try to import useViewport.
    const { zoom } = useReactFlow().getViewport ? useReactFlow().getViewport() : { zoom: 1 };

    // Actually, useReactFlow returns getViewport(). 
    // To subscribe, we should technically use useOnViewportChange from xyflow/react if available 
    // or just pass a callback to ReactFlow to update local state here?
    // Since this is a child of ReactFlow, we can use useStore(s => s.transform[2]).

    // Let's simplify: Standard ReactFlow Controls just update.
    // We will assume the user clicks buttons mostly. 
    // For live update, we will try to use a simple interval or see if `useViewport` hook exists. 
    // Checking docs... `useViewport` is a hook.

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '4px',
            gap: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <ControlButton onClick={undo} disabled={history.past.length === 0} title="Undo">
                <Undo size={16} />
            </ControlButton>

            <ControlButton onClick={redo} disabled={history.future.length === 0} title="Redo">
                <Redo size={16} />
            </ControlButton>

            <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }}></div>

            <ControlButton onClick={() => zoomOut()} title="Zoom Out">
                <ZoomOut size={16} />
            </ControlButton>

            <div style={{
                minWidth: '40px',
                textAlign: 'center',
                fontSize: '12px',
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--text-primary)'
            }}>
                <ZoomDisplay />
            </div>

            <ControlButton onClick={() => zoomIn()} title="Zoom In">
                <ZoomIn size={16} />
            </ControlButton>

            <ControlButton onClick={() => fitView({ padding: 0.2, duration: 800 })} title="Fit View">
                <Maximize size={16} />
            </ControlButton>
        </div>
    );
};

// Separate component to handle viewport subscription
const ZoomDisplay = () => {
    const { getZoom } = useReactFlow();
    const [zoom, setZoom] = React.useState(1);

    // We need to poll or subscribe. 
    // A simple interval is cheap and effective for this specific requirement without deep diving into internal store.
    React.useEffect(() => {
        const interval = setInterval(() => {
            const z = getZoom();
            if (z !== zoom) setZoom(z);
        }, 100);
        return () => clearInterval(interval);
    }, [getZoom, zoom]);

    return <>{Math.round(zoom * 100)}%</>;
};

const ControlButton = ({ children, onClick, disabled, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={{
            background: 'transparent',
            border: 'none',
            color: disabled ? 'var(--text-secondary)' : 'var(--text-primary)',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'default' : 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
        {children}
    </button>
);

export default CustomControls;
