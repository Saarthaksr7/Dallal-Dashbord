import React from 'react';
import { Settings, RotateCcw, Save, Eye, EyeOff } from 'lucide-react';

const DashboardControls = ({
    editMode,
    onToggleEditMode,
    onResetLayout,
    onToggleWidget,
    hiddenWidgets = []
}) => {
    const handleToggleEditMode = () => {
        console.log('Toggle Edit Mode clicked, current:', editMode);
        onToggleEditMode();
    };

    const handleResetLayout = () => {
        console.log('DashboardControls: Reset button clicked');
        if (onResetLayout) {
            onResetLayout();
        } else {
            console.error('onResetLayout prop is not defined!');
        }
    };

    const handleShowMenu = (e) => {
        console.log('Show menu clicked');
        const menu = e.currentTarget.parentElement.querySelector('.widget-menu');
        if (menu) {
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        }
    };

    return (
        <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            alignItems: 'center'
        }}>
            <button
                className={`btn ${editMode ? 'btn-primary' : ''}`}
                onClick={handleToggleEditMode}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                aria-label={editMode ? "Save layout" : "Enter edit mode"}
                title={editMode ? "Save and exit edit mode" : "Customize dashboard layout"}
            >
                {editMode ? <Save size={18} /> : <Settings size={18} />}
                {editMode ? 'Done' : 'Customize'}
            </button>

            {editMode && (
                <>
                    {hiddenWidgets.length > 0 && (
                        <div style={{ position: 'relative' }}>
                            <button
                                className="btn"
                                onClick={handleShowMenu}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                aria-label="Show hidden widgets menu"
                                title="Show hidden widgets"
                            >
                                <Eye size={18} />
                                Show ({hiddenWidgets.length})
                            </button>

                            <div
                                className="widget-menu"
                                style={{
                                    display: 'none',
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '0.5rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    minWidth: '200px',
                                    zIndex: 100
                                }}
                            >
                                <div style={{ padding: '0.5rem' }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        padding: '0.5rem',
                                        borderBottom: '1px solid var(--border)',
                                        marginBottom: '0.25rem'
                                    }}>
                                        Hidden Widgets
                                    </div>
                                    {hiddenWidgets.map(widget => (
                                        <button
                                            key={widget.id}
                                            onClick={() => {
                                                console.log('Restoring widget:', widget.id);
                                                onToggleWidget(widget.id, true);
                                                // Close menu
                                                const menu = document.querySelector('.widget-menu');
                                                if (menu) menu.style.display = 'none';
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                width: '100%',
                                                padding: '0.5rem',
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                borderRadius: '4px',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <EyeOff size={16} />
                                            {widget.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        className="btn"
                        onClick={handleResetLayout}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        aria-label="Reset to default layout"
                        title="Reset dashboard to default layout"
                    >
                        <RotateCcw size={18} />
                        Reset
                    </button>
                </>
            )}
        </div>
    );
};

export default DashboardControls;
