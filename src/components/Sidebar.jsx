import React, { useRef } from 'react';
import useAppStore from '../store/useAppStore';
import {
    Menu, X, Save, FolderOpen, Download,
    Search, Grid, Sun, Moon, Trash2
} from 'lucide-react';
import { exportToOrbisFile, importOrbisFile, exportToZip } from '../utils/persistence';

const Sidebar = () => {
    const {
        sidebarCollapsed,
        toggleSidebar,
        theme,
        setTheme,
        gridMode,
        setGridMode,
        resetCanvas,
        nodes,
        loadState
    } = useAppStore();

    const fileInputRef = useRef(null);

    const handleSave = () => {
        const state = useAppStore.getState();
        exportToOrbisFile(state);
    };

    const handleOpen = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const content = await importOrbisFile(file);
            loadState(content);
        } catch (err) {
            alert('Failed to load file: ' + err.message);
        }
        e.target.value = null; // reset
    };

    const handleExport = () => {
        const state = useAppStore.getState();
        exportToZip(state);
    };

    const handleThemeToggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    return (
        <>
            <button
                onClick={toggleSidebar}
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 20,
                    background: 'var(--node-bg)',
                    border: '1px solid var(--border-color)',
                    padding: '8px',
                    color: 'var(--text-primary)',
                    borderRadius: '6px'
                }}
            >
                {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
            </button>

            <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                height: '100vh',
                width: 'var(--sidebar-width)',
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                transform: sidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)',
                transition: 'transform 0.3s ease',
                zIndex: 15,
                paddingTop: '60px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: sidebarCollapsed ? 'none' : '4px 0 15px rgba(0,0,0,0.3)'
            }}>

                <div className="sidebar-section" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginTop: 0, fontSize: '0.9em', textTransform: 'uppercase', color: '#666' }}>File</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button className="sidebar-btn" onClick={handleSave}>
                            <Save size={16} /> Save to .orbis
                        </button>
                        <button className="sidebar-btn" onClick={handleOpen}>
                            <FolderOpen size={16} /> Open .orbis
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".orbis"
                            onChange={handleFileChange}
                        />
                        <button className="sidebar-btn" onClick={handleExport}>
                            <Download size={16} /> Export to ZIP
                        </button>
                    </div>
                </div>

                <div className="sidebar-section" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginTop: 0, fontSize: '0.9em', textTransform: 'uppercase', color: '#666' }}>Canvas</h3>

                    <div className="setting-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span>Theme</span>
                        <button onClick={handleThemeToggle} style={{
                            padding: '4px 8px',
                            background: 'var(--node-bg)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)'
                        }}>
                            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                        </button>
                    </div>


                </div>

                <div className="sidebar-section" style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginTop: 0, fontSize: '0.9em', textTransform: 'uppercase', color: '#666' }}>Stats</h3>
                    <div style={{ fontSize: '0.9em', color: '#aaa' }}>
                        Folders: {nodes.length}
                    </div>
                </div>

                <div className="sidebar-section" style={{ padding: '16px', marginTop: 'auto' }}>
                    <button
                        onClick={() => { if (confirm('Clear entire canvas?')) resetCanvas() }}
                        className="sidebar-btn"
                        style={{ color: '#ff4444', borderColor: '#ff4444' }}
                    >
                        <Trash2 size={16} /> Reset Canvas
                    </button>
                </div>

            </div>

            <style>{`
        .sidebar-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          background: transparent;
          width: 100%;
          color: var(--text-primary);
        }
        .sidebar-btn:hover {
          background: rgba(255,255,255,0.05);
        }
      `}</style>
        </>
    );
};

export default Sidebar;
