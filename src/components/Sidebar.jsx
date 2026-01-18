import React, { useRef, useMemo, useState } from 'react';
import useAppStore from '../store/useAppStore';
import { useReactFlow } from '@xyflow/react';
import {
    Save, FolderOpen, Download,
    Sun, Moon, Trash2,
    Copy, Search,
    ChevronsUp, ChevronsDown, ChevronUp, ChevronDown
} from 'lucide-react';
import { exportToOrbisFile, importOrbisFile, exportToZip } from '../utils/persistence';

// --- Constants ---
// --- Constants ---
// --- Constants ---
const STROKE_COLORS = [
    '#000000', // Black
    '#FF9AA2', // Pastel Red
    '#74b9ff', // Pastel Blue
    '#55efc4', // Pastel Green
    '#ffeaa7', // Pastel Yellow
];

const FILL_COLORS = [
    '#FF9AA2', // Pastel Red
    '#74b9ff', // Pastel Blue
    '#55efc4', // Pastel Green
    '#ffeaa7', // Pastel Yellow
];

const Sidebar = () => {
    const {
        theme,
        setTheme,
        resetCanvas,
        nodes,
        loadState,
        updateNode,
        activeTool,
        defaultProperties,
        setDefaultProperties,
        copySelectedNodes,
        changeNodeOrder
    } = useAppStore();

    const { fitView } = useReactFlow();
    const fileInputRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState(null); // For toast
    // Ref for hidden color input removed

    // --- Selection Logic ---
    const selectedNode = useMemo(() => nodes.find(n => n.selected), [nodes]);

    // Check if we should show Tool Defaults instead of Node Properties
    // We show properties if a node is selected OR if a drawing tool is active (and no node selected)
    const isDrawingTool = ['rectangle', 'circle', 'diamond', 'line', 'arrow', 'freehand', 'text'].includes(activeTool);
    const showProperties = selectedNode || isDrawingTool;
    const isToolDefaults = !selectedNode && isDrawingTool;

    // --- Handlers ---
    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 2000);
    };

    const handleSave = () => {
        const state = useAppStore.getState();
        exportToOrbisFile(state);
    };

    const handleOpen = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const content = await importOrbisFile(file);
            loadState(content);
        } catch (err) {
            alert('Failed to load file: ' + err.message);
        }
        e.target.value = null;
    };

    const handleExport = () => {
        const state = useAppStore.getState();
        exportToZip(state);
    };

    const handleThemeToggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    const handleReset = () => {
        if (confirm('Are you sure you want to reset the canvas?')) {
            resetCanvas();
            showNotification('Canvas Reset');
        }
    };

    // --- Property Updates ---
    const currentData = selectedNode ? selectedNode.data : defaultProperties;

    const updateProp = (key, value) => {
        // Sticky: properties applied to selection also become new defaults
        setDefaultProperties({ [key]: value });

        if (selectedNode) {
            useAppStore.getState().updateNodeData(selectedNode.id, { [key]: value });
        }
    };

    // --- Search Logic ---
    const filteredNodes = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const lower = searchQuery.toLowerCase();
        return nodes.filter(n => {
            const name = n.data?.name || '';
            const text = n.data?.text || '';
            const label = n.data?.label || '';
            return name.toLowerCase().includes(lower) ||
                text.toLowerCase().includes(lower) ||
                label.toLowerCase().includes(lower);
        });
    }, [nodes, searchQuery]);

    const handleSearchResultClick = (nodeId) => {
        // Zoom to node
        fitView({ nodes: [{ id: nodeId }], padding: 1, duration: 800 });
        // Select it?
        useAppStore.getState().setSelectedNodes([nodeId]);
    };


    // --- Renderers ---

    const renderProperties = () => {
        const { stroke, fill, strokeWidth, strokeStyle, opacity, shapeType } = currentData;

        // Shape support check
        const type = selectedNode ? shapeType : (activeTool === 'freehand' ? 'freehand' : activeTool);
        const isLine = type === 'line' || type === 'arrow';
        const isFreehand = selectedNode ? selectedNode.type === 'freehandNode' : activeTool === 'freehand';
        const isText = selectedNode ? selectedNode.type === 'textNode' : activeTool === 'text';
        const supportsFill = !isLine && !isFreehand && !isText;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '2px' }}>
                <div style={sectionHeaderStyle}>
                    {selectedNode ? 'Properties' : 'Tool Defaults'}
                </div>

                {/* Color (Stroke) */}
                <div style={controlGroupStyle}>
                    <label style={labelStyle}>Stroke</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                        {STROKE_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => updateProp('stroke', c)}
                                style={{
                                    width: '20px', height: '20px',
                                    borderRadius: '3px',
                                    background: c,
                                    border: stroke === c ? '2px solid var(--accent-color)' : '1px solid rgba(0,0,0,0.2)',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                                title={c}
                            />
                        ))}

                        {/* Hex Input Group */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'var(--bg-secondary)',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            border: '1px solid var(--border-color)',
                            flex: 1,
                            marginLeft: '4px'
                        }}>
                            <span style={{ fontSize: '0.8em', color: 'var(--text-secondary)', marginRight: '4px', userSelect: 'none' }}>#</span>
                            <input
                                value={(stroke || '').replace('#', '')}
                                onChange={(e) => updateProp('stroke', '#' + e.target.value)}
                                style={{
                                    width: '100%',
                                    fontSize: '0.85em',
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    fontFamily: 'monospace'
                                }}
                                maxLength={6}
                            />
                        </div>
                    </div>
                </div>

                {/* Fill Color */}
                {supportsFill && (
                    <div style={controlGroupStyle}>
                        <label style={labelStyle}>Fill</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                            {/* Transparent Option */}
                            <button
                                onClick={() => updateProp('fill', 'transparent')}
                                style={{
                                    width: '20px', height: '20px',
                                    borderRadius: '3px',
                                    background: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'><path d='M0 0h4v4H0zm4 4h4v4H4z' fill='%23e0e0e0'/></svg>")`,
                                    backgroundColor: '#fff',
                                    border: fill === 'transparent' ? '2px solid var(--accent-color)' : '1px solid rgba(0,0,0,0.2)',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                                title="Transparent"
                            />

                            {FILL_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => updateProp('fill', c)}
                                    style={{
                                        width: '20px', height: '20px',
                                        borderRadius: '3px',
                                        background: c,
                                        border: fill === c ? '2px solid var(--accent-color)' : '1px solid rgba(0,0,0,0.2)',
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                />
                            ))}

                            {/* Fill Hex Input Group */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'var(--bg-secondary)',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                border: '1px solid var(--border-color)',
                                flex: 1,
                                height: '24px' // Match button height approx
                            }}>
                                <span style={{ fontSize: '0.8em', color: 'var(--text-secondary)', marginRight: '4px', userSelect: 'none' }}>#</span>
                                <input
                                    value={(fill === 'transparent' ? '' : (fill || '')).replace('#', '')}
                                    onChange={(e) => updateProp('fill', '#' + e.target.value)}
                                    placeholder="None"
                                    style={{
                                        width: '100%',
                                        fontSize: '0.85em',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        fontFamily: 'monospace'
                                    }}
                                    maxLength={6}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Width */}
                {
                    !isText && (
                        <div style={controlGroupStyle}>
                            <label style={labelStyle}>Stroke Width</label>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '6px' }}>
                                {[2, 3, 4].map(w => (
                                    <button
                                        key={w}
                                        onClick={() => updateProp('strokeWidth', w)}
                                        title={`${w}px`}
                                        style={{
                                            flex: 1,
                                            height: '28px',
                                            minWidth: 0,
                                            padding: 0,
                                            background: (strokeWidth === w) ? 'rgba(180, 230, 160, 0.3)' : 'rgba(0,0,0,0.05)', // Accent vs Grey
                                            border: (strokeWidth === w) ? '1px solid #b4e6a0' : '1px solid transparent',
                                            color: (strokeWidth === w) ? '#3a6b24' : 'var(--text-primary)',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            boxShadow: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <div style={{
                                            height: `${w}px`,
                                            width: '24px',
                                            background: (strokeWidth === w) ? '#3a6b24' : 'var(--text-primary)',
                                            borderRadius: '2px'
                                        }}></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Style (Solid/Dashed/Dotted) */}
                {
                    !isText && !isFreehand && (
                        <div style={controlGroupStyle}>
                            <label style={labelStyle}>Stroke Style</label>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '6px' }}>
                                {['solid', 'dashed', 'dotted'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => updateProp('strokeStyle', s)}
                                        title={s}
                                        style={{
                                            flex: 1,
                                            height: '28px',
                                            minWidth: 0,
                                            padding: 0,
                                            background: (strokeStyle === s) ? 'rgba(180, 230, 160, 0.3)' : 'rgba(0,0,0,0.05)', // Accent vs Grey
                                            border: (strokeStyle === s) ? '1px solid #b4e6a0' : '1px solid transparent',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            boxShadow: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <svg width="24px" height="4" style={{ overflow: 'hidden' }}>
                                            <line
                                                x1="0" y1="2" x2="100%" y2="2"
                                                stroke={strokeStyle === s ? '#3a6b24' : 'var(--text-primary)'}
                                                strokeWidth="2"
                                                strokeDasharray={
                                                    s === 'solid' ? 'none' :
                                                        s === 'dashed' ? '4,4' :
                                                            '1,3' // Dotted: small dot, gap
                                                }
                                                strokeLinecap={s === 'dotted' ? 'round' : 'butt'}
                                            />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Opacity */}
                <div style={controlGroupStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={labelStyle}>Opacity</label>
                        <span style={{ fontSize: '0.8em' }}>{Math.round((opacity ?? 1) * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={opacity ?? 1}
                        onChange={(e) => updateProp('opacity', parseFloat(e.target.value))}
                        style={{
                            width: '100%',
                            height: '4px',
                            accentColor: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Draw Order */}
                {selectedNode && (
                    <div style={controlGroupStyle}>
                        <label style={labelStyle}>Draw Order</label>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '6px' }}>
                            <button
                                onClick={() => changeNodeOrder(selectedNode.id, 'back')}
                                title="Send to Back"
                                style={drawOrderBtnStyle}
                            >
                                <ChevronsDown size={16} />
                            </button>
                            <button
                                onClick={() => changeNodeOrder(selectedNode.id, 'backward')}
                                title="Send Backward"
                                style={drawOrderBtnStyle}
                            >
                                <ChevronDown size={16} />
                            </button>
                            <button
                                onClick={() => changeNodeOrder(selectedNode.id, 'forward')}
                                title="Bring Forward"
                                style={drawOrderBtnStyle}
                            >
                                <ChevronUp size={16} />
                            </button>
                            <button
                                onClick={() => changeNodeOrder(selectedNode.id, 'front')}
                                title="Bring to Front"
                                style={drawOrderBtnStyle}
                            >
                                <ChevronsUp size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {
                    selectedNode && (
                        <button style={{ ...listButtonStyle, justifyContent: 'center', marginTop: '8px' }} onClick={() => {
                            copySelectedNodes();
                            showNotification('Copied node');
                        }}>
                            <Copy size={16} /> Copy
                        </button>
                    )
                }
            </div >
        );
    };

    const containerStyle = {
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'var(--node-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 1000,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '220px', // Reduced width
        maxHeight: 'calc(100vh - 40px)', // Fit in screen
        overflowY: 'auto'
    };

    const notificationStyle = {
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--text-primary)',
        color: 'var(--bg-color)',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '0.85em',
        pointerEvents: 'none',
        opacity: notification ? 1 : 0,
        transition: 'opacity 0.3s',
        zIndex: 2000
    };

    // --- RENDER ---

    return (
        <>
            {/* View 1 or 2 */}
            <div style={containerStyle}>
                {showProperties ? (
                    renderProperties()
                ) : (
                    <>
                        {/* File Actions */}
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
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".orbis"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div style={{ width: '100%', height: '1px', background: 'var(--border-color)' }}></div>

                        {/* Search */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                <Search size={14} color="var(--text-secondary)" />
                                <input
                                    placeholder="Find text..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.9em', outline: 'none', color: 'var(--text-primary)' }}
                                />
                            </div>
                            {searchQuery && (
                                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                    {filteredNodes.length === 0 ? (
                                        <div style={{ padding: '8px', fontSize: '0.8em', color: 'var(--text-secondary)' }}>No results</div>
                                    ) : (
                                        filteredNodes.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => handleSearchResultClick(n.id)}
                                                style={{
                                                    padding: '6px',
                                                    fontSize: '0.85em',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    background: 'var(--bg-secondary)'
                                                }}
                                                className="search-result-item"
                                            >
                                                {n.data.name || n.data.text || n.type}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ width: '100%', height: '1px', background: 'var(--border-color)' }}></div>

                        {/* Bottom Controls (Theme / Reset) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
                            <button style={listButtonStyle} onClick={handleThemeToggle}>
                                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                                <span>Theme</span>
                            </button>
                            <button
                                style={listButtonStyle}
                                onClick={handleReset}
                            >
                                <Trash2 size={16} /> Reset Canvas
                            </button>
                        </div>

                        <div style={{ fontSize: '0.7em', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            {nodes.length} Items
                        </div>
                    </>
                )}
            </div>

            {/* Notification Toast */}
            <div style={notificationStyle}>
                {notification}
            </div>
        </>
    );
};

// --- Styles ---
const buttonStyle = {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85em' // Reduced font size
};

const listButtonStyle = {
    ...buttonStyle,
    justifyContent: 'flex-start', // Ensure left alignment
    gap: '8px',
    width: '100%',
    padding: '6px 8px',
    border: '1px solid transparent',
    background: 'var(--bg-secondary)',
    transition: 'background 0.2s',
    ':hover': {
        background: 'rgba(0,0,0,0.05)'
    }
};

const labelStyle = {
    fontSize: '0.75em', // Reduced label size
    color: 'var(--text-secondary)',
    fontWeight: '500'
};

const controlGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
};

const optionBtnStyle = {
    padding: '4px 8px',
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75em', // Reduced option font
    color: 'var(--text-primary)'
};

const sectionHeaderStyle = {
    fontSize: '0.85em', // Reduced header size
    fontWeight: 'bold',
    color: 'var(--text-primary)',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--border-color)'
};

const drawOrderBtnStyle = {
    flex: 1,
    height: '28px',
    padding: '0', // Override global padding
    minWidth: '0', // Allow shrink
    background: 'rgba(0,0,0,0.05)', // Grey background
    border: '1px solid transparent', // Default border
    color: 'var(--text-primary)',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
};

export default Sidebar;
