import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ServiceStatusWidget from '../components/widgets/ServiceStatusWidget';
import AlertsWidget from '../components/widgets/AlertsWidget';
import UptimeWidget from '../components/widgets/UptimeWidget';
import DraggableWidget from '../components/dashboard/DraggableWidget';
import DashboardControls from '../components/dashboard/DashboardControls';
import { useDashboardLayoutStore } from '../store/dashboardLayout';

const DashboardOverview = () => {
    const { t } = useTranslation();
    const [editMode, setEditMode] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const {
        layout,
        setWidgetVisibility,
        setWidgetSize,
        reorderWidgets,
        resetLayout
    } = useDashboardLayoutStore();

    const widgetComponents = {
        'service-status': { component: ServiceStatusWidget, title: 'Service Status' },
        'alerts': { component: AlertsWidget, title: 'Alerts' },
        'uptime': { component: UptimeWidget, title: 'Uptime' },
    };

    useEffect(() => {
        const handleReorder = (e) => {
            const { draggedId, targetId } = e.detail;
            reorderWidgets(draggedId, targetId);
        };

        window.addEventListener('widget-reorder', handleReorder);
        return () => window.removeEventListener('widget-reorder', handleReorder);
    }, [reorderWidgets]);

    const visibleWidgets = layout.widgets
        .filter(w => w.visible)
        .sort((a, b) => a.order - b.order);

    const hiddenWidgets = layout.widgets.filter(w => !w.visible);

    const handleResetLayout = () => {
        console.log('Reset button clicked - showing confirmation modal');
        setShowResetConfirm(true);
    };

    const confirmReset = () => {
        console.log('User confirmed reset');
        resetLayout();
        setShowResetConfirm(false);
        // Force page reload to ensure clean state
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    const cancelReset = () => {
        console.log('User cancelled reset');
        setShowResetConfirm(false);
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.5rem 0' }}>{t('dashboard.overview.title')}</h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                            {editMode
                                ? 'Drag widgets to reorder, click size button to resize, or hide widgets'
                                : t('dashboard.overview.subtitle')
                            }
                        </p>
                    </div>
                    <DashboardControls
                        editMode={editMode}
                        onToggleEditMode={() => setEditMode(!editMode)}
                        onResetLayout={handleResetLayout}
                        onToggleWidget={(id, visible) => setWidgetVisibility(id, visible)}
                        hiddenWidgets={hiddenWidgets}
                    />
                </div>
            </div>

            <div
                className={`dashboard-grid-customizable ${editMode ? 'edit-mode' : ''}`}
                data-edit-mode={editMode}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.5rem'
                }}
            >
                {visibleWidgets.map(widget => {
                    const widgetConfig = widgetComponents[widget.id];
                    if (!widgetConfig) return null;

                    const WidgetComponent = widgetConfig.component;
                    return (
                        <DraggableWidget
                            key={widget.id}
                            id={widget.id}
                            editMode={editMode}
                            size={widget.size}
                            onRemove={(id) => setWidgetVisibility(id, false)}
                            onSizeChange={(id, size) => setWidgetSize(id, size)}
                        >
                            <WidgetComponent />
                        </DraggableWidget>
                    );
                })}
            </div>

            {editMode && visibleWidgets.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '2px dashed var(--border)'
                }}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>All widgets are hidden</p>
                    <p style={{ fontSize: '0.9rem' }}>Click "Show" button above to restore widgets</p>
                </div>
            )}

            {/* Custom Reset Confirmation Modal */}
            {showResetConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>
                            Reset Dashboard Layout?
                        </h3>
                        <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            This will restore all widgets to their default positions and sizes. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn"
                                onClick={cancelReset}
                                style={{ minWidth: '100px' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={confirmReset}
                                style={{ minWidth: '100px', background: '#ef4444', borderColor: '#ef4444' }}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardOverview;
