import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultLayout = {
    widgets: [
        { id: 'service-status', visible: true, order: 1, size: 'medium' },
        { id: 'alerts', visible: true, order: 2, size: 'medium' },
        { id: 'uptime', visible: true, order: 3, size: 'medium' },
    ]
};

export const useDashboardLayoutStore = create(
    persist(
        (set) => ({
            layout: defaultLayout,

            setWidgetVisibility: (widgetId, visible) => set((state) => ({
                layout: {
                    ...state.layout,
                    widgets: state.layout.widgets.map(w =>
                        w.id === widgetId ? { ...w, visible } : w
                    )
                }
            })),

            setWidgetOrder: (widgetId, newOrder) => set((state) => ({
                layout: {
                    ...state.layout,
                    widgets: state.layout.widgets.map(w =>
                        w.id === widgetId ? { ...w, order: newOrder } : w
                    )
                }
            })),

            setWidgetSize: (widgetId, size) => set((state) => ({
                layout: {
                    ...state.layout,
                    widgets: state.layout.widgets.map(w =>
                        w.id === widgetId ? { ...w, size } : w
                    )
                }
            })),

            reorderWidgets: (draggedId, targetId) => set((state) => {
                const widgets = [...state.layout.widgets];
                const draggedIndex = widgets.findIndex(w => w.id === draggedId);
                const targetIndex = widgets.findIndex(w => w.id === targetId);

                if (draggedIndex === -1 || targetIndex === -1) return state;

                // Remove dragged widget
                const [draggedWidget] = widgets.splice(draggedIndex, 1);

                // Insert at new position
                widgets.splice(targetIndex, 0, draggedWidget);

                // Update order values
                const reorderedWidgets = widgets.map((w, index) => ({
                    ...w,
                    order: index + 1
                }));

                return {
                    layout: {
                        ...state.layout,
                        widgets: reorderedWidgets
                    }
                };
            }),

            resetLayout: () => {
                console.log('Resetting dashboard layout to default');
                // Clear persisted state
                try {
                    localStorage.removeItem('dashboard-layout');
                } catch (e) {
                    console.error('Failed to clear localStorage:', e);
                }
                // Set to default
                return set({
                    layout: {
                        widgets: [
                            { id: 'service-status', visible: true, order: 1, size: 'medium' },
                            { id: 'alerts', visible: true, order: 2, size: 'medium' },
                            { id: 'uptime', visible: true, order: 3, size: 'medium' },
                        ]
                    }
                });
            },
        }),
        {
            name: 'dashboard-layout',
        }
    )
);
