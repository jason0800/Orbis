import React, { useRef } from 'react';
import useAppStore from '../store/useAppStore';
import {
    Menu, X, Save, FolderOpen, Download,
    Search, Grid, Sun, Moon, Trash2
} from 'lucide-react';
import { exportToOrbisFile, importOrbisFile, exportToZip } from '../utils/persistence';

const Sidebar = () => {
    const {
        theme,
        setTheme,
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
        <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'var(--node-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '200px'
        }}>
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <button
                    onClick={handleThemeToggle}
                    title="Toggle Theme"
                    style={buttonStyle}
                >
                    {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                <button
                    onClick={() => { if (confirm('Clear entire canvas?')) resetCanvas() }}
                    title="Reset (Clear All)"
                    style={{ ...buttonStyle, color: '#ff4444' }}
                >
                    <Trash2 size={18} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button style={listButtonStyle} onClick={handleSave}>
                    <Save size={16} /> Save
                </button>
                <button style={listButtonStyle} onClick={handleOpen}>
                    <FolderOpen size={16} /> Open
                </button>
                <button style={listButtonStyle} onClick={handleExport}>
                    <Download size={16} /> Export ZIP
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".orbis"
                onChange={handleFileChange}
            />

            <div style={{ fontSize: '0.7em', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4px' }}>
                {nodes.length} Items
            </div>
        </div>
    );
};

const buttonStyle = {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const listButtonStyle = {
    ...buttonStyle,
    justifyContent: 'flex-start',
    gap: '8px',
    fontSize: '0.9em',
    width: '100%',
    padding: '6px 8px'
};

export default Sidebar;
