import React, { useEffect } from 'react';
import Canvas from './components/Canvas';
import TopToolbar from './components/TopToolbar';
import Sidebar from './components/Sidebar';
import useAppStore from './store/useAppStore';
import { ReactFlowProvider } from '@xyflow/react';

function App() {
    const { theme } = useAppStore();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.style.backgroundColor = theme === 'dark' ? '#121212' : '#ffffff';
        document.body.style.color = theme === 'dark' ? '#ffffff' : '#000000';
    }, [theme]);

    // Update CSS variables based on theme
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.style.setProperty('--bg-color', '#121212');
            root.style.setProperty('--bg-secondary', '#1e1e1e');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#a0a0a0');
            root.style.setProperty('--node-bg', '#2a2a2a');
            root.style.setProperty('--node-border', '#333333');
            root.style.setProperty('--node-text', '#ffffff');
            root.style.setProperty('--shape-stroke', '#ffffff');
            root.style.setProperty('--border-color', '#333333');
        } else {
            root.style.setProperty('--bg-color', '#f8f9fa');
            root.style.setProperty('--bg-secondary', '#ffffff');
            root.style.setProperty('--text-primary', '#212529');
            root.style.setProperty('--text-secondary', '#6c757d');
            root.style.setProperty('--node-bg', '#ffffff');
            root.style.setProperty('--node-border', '#dee2e6');
            root.style.setProperty('--node-text', '#212529');
            root.style.setProperty('--shape-stroke', '#000000');
            root.style.setProperty('--border-color', '#dee2e6');
            // Ensure accent matches CSS if needed, but CSS handles it globally. 
        }
    }, [theme]);

    return (
        <ReactFlowProvider>
            <div className="app-container" style={{ width: '100%', height: '100%' }}>
                <Canvas />
                <TopToolbar />
                <Sidebar />
            </div>
        </ReactFlowProvider>
    );
}

export default App;
