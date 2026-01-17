import React, { useRef, useMemo } from 'react';
import useAppStore from '../store/useAppStore';
import {
    Menu, X, Save, FolderOpen, Download,
    Search, Grid, Sun, Moon, Trash2,
    Palette, Layers, Type, Minus, ArrowRight
} from 'lucide-react';
import { exportToOrbisFile, importOrbisFile, exportToZip } from '../utils/persistence';

const Sidebar = () => {
    const {
        theme,
        setTheme,
        resetCanvas,
        nodes,
        loadState,
        updateNodeData,
        updateNode
    } = useAppStore();

    const fileInputRef = useRef(null);

    // Find selected node
    const selectedNode = useMemo(() => {
        return nodes.find(n => n.selected);
    }, [nodes]);

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

    // -- Property Handlers --
    const updateProp = (key, value) => {
        if (!selectedNode) return;
        updateNode(selectedNode.id, {
            data: { ...selectedNode.data, [key]: value }
        });
    };

    // Properties UI
    const renderProperties = () => {
        if (!selectedNode) return null;

        const { stroke, fill, strokeWidth, strokeStyle, opacity } = selectedNode.data;

        return (
            <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <div style={sectionHeaderStyle}>Appearance</div>

                {/* Stroke Color */}
                <div style={rowStyle}>
                    <label style={labelStyle}>Stroke</label>
                    <input
                        type="color"
                        value={stroke || '#000000'}
                        onChange={(e) => updateProp('stroke', e.target.value)}
                        style={colorInputStyle}
                    />
                </div>

                {/* Fill Color */}
                <div style={rowStyle}>
                    <label style={labelStyle}>Fill</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                            type="checkbox"
                            checked={fill !== 'transparent'}
                            onChange={(e) => updateProp('fill', e.target.checked ? '#ff0000' : 'transparent')}
                        />
                        {fill !== 'transparent' && (
                            <input
                                type="color"
                                value={fill || '#ffffff'}
                                onChange={(e) => updateProp('fill', e.target.value)}
                                style={colorInputStyle}
                            />
                        )}
                    </div>
                </div>

                {/* Opacity */}
                <div style={rowStyle}>
                    <label style={labelStyle}>Opacity</label>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={opacity ?? 1}
                        onChange={(e) => updateProp('opacity', parseFloat(e.target.value))}
                        style={{ width: '60px' }}
                    />
                </div>

                {/* Stroke Width */}
                <div style={rowStyle}>
                    <label style={labelStyle}>Width</label>
                    <div style={{ display: 'flex', gap: '2px' }}>
                        {[2, 4, 8].map(w => (
                            <button
                                key={w}
                                onClick={() => updateProp('strokeWidth', w)}
                                style={{
                                    ...optionBtnStyle,
                                    background: (strokeWidth === w) ? 'var(--selection-color)' : 'transparent',
                                    border: (strokeWidth === w) ? '1px solid #646cff' : '1px solid var(--border-color)'
                                }}
                            >
                                <div style={{ height: w + 'px', width: '12px', background: 'var(--text-primary)' }}></div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stroke Style */}
                <div style={rowStyle}>
                    <label style={labelStyle}>Style</label>
                    <div style={{ display: 'flex', gap: '2px' }}>
                        {['solid', 'dashed', 'dotted'].map(s => (
                            <button
                                key={s}
                                onClick={() => updateProp('strokeStyle', s)}
                                title={s}
                                style={{
                                    ...optionBtnStyle,
                                    background: (strokeStyle === s) ? 'var(--selection-color)' : 'transparent',
                                    border: (strokeStyle === s) ? '1px solid #646cff' : '1px solid var(--border-color)'
                                }}
                            >
                                <div style={{
                                    width: '16px',
                                    height: '2px',
                                    background: 'var(--text-primary)',
                                    borderStyle: s === 'solid' ? 'solid' : s,
                                    borderWidth: '0 0 2px 0',
                                    borderColor: 'var(--text-primary)'
                                }}></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // --- Render Logic ---
    const containerStyle = {
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
        maxWidth: '220px',
        maxHeight: '90vh',
        overflowY: 'auto'
    };

    // Shared Header
    const Header = () => (
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
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
            {selectedNode && <div style={{ fontSize: '0.8em', color: 'var(--text-secondary)' }}>Properties</div>}
        </div>
    );

    // MODE 1: Properties Panel (Selection Active)
    if (selectedNode) {
        return (
            <div style={containerStyle}>
                <Header />
                {renderProperties()}
            </div>
        );
    }

    // MODE 2: Default Panel (No Selection)
    return (
        <div style={containerStyle}>
            <Header />

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

const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    fontSize: '0.8em'
};

const labelStyle = {
    color: 'var(--text-secondary)'
};

const colorInputStyle = {
    width: '24px',
    height: '24px',
    padding: 0,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    background: 'none'
};

const optionBtnStyle = {
    padding: '4px',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '24px'
};

const sectionHeaderStyle = {
    fontSize: '0.8em',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: 'var(--text-primary)'
};

export default Sidebar;
