import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import ServiceCard from '../components/ServiceCard';
import ServiceWizard from '../components/ServiceWizard';
import ServiceEditDialog from '../components/ServiceEditDialog';
import ServiceDetails from '../components/ServiceDetails';
import { Plus, CheckSquare, Trash2, Zap, X, Wrench } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

import { useServicesStore } from '../store/services';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableServiceCard = ({ service, ...props }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: service.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        touchAction: 'none' // Important for pointer events
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <ServiceCard
                service={service}
                {...props}
                isDraggable={true}
                dragListeners={listeners}
            />
        </div>
    );
};

const Services = () => {
    // Global Store
    const {
        services, loading, error, fetchServices,
        updateService, removeService, setServices,
        startPolling, stopPolling
    } = useServicesStore();

    // Auth & Token
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const updatePreferences = useAuthStore((state) => state.updatePreferences);

    const [showWizard, setShowWizard] = useState(false);

    // Toolbar State
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = React.useRef(null);

    // Initialize from preferences
    const [statusFilter, setStatusFilter] = useState(user?.preferences?.services?.statusFilter || 'all');
    const [sortBy, setSortBy] = useState(user?.preferences?.services?.sortBy || 'name');
    const [groupBy, setGroupBy] = useState(user?.preferences?.services?.groupBy || 'none');
    const [customOrder, setCustomOrder] = useState(user?.preferences?.services?.customOrder || []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Persist Preferences (Debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) {
                updatePreferences({
                    services: { statusFilter, sortBy, groupBy, customOrder }
                });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [statusFilter, sortBy, groupBy, customOrder]);

    // Shortcuts
    useKeyboardShortcuts({
        'n': () => setShowWizard(true),
        '/': (e) => {
            e.preventDefault();
            searchInputRef.current?.focus();
        }
    });

    // Bulk Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Details Modal State
    const [selectedService, setSelectedService] = useState(null);

    // Handle Drag End
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setCustomOrder((items) => {
                const currentIds = items.length > 0 ? items : services.map(s => s.id);
                // Ensure we have all current service IDs in the list if implementation was partial
                const allServiceIds = services.map(s => s.id);
                const mergedIds = [...new Set([...currentIds, ...allServiceIds])];

                const oldIndex = mergedIds.indexOf(active.id);
                const newIndex = mergedIds.indexOf(over.id);

                if (oldIndex === -1 || newIndex === -1) return mergedIds;

                return arrayMove(mergedIds, oldIndex, newIndex);
            });
        }
    };

    // Filter & Sort Logic
    const filteredServices = services
        .filter(svc => {
            const matchesSearch = (
                svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                svc.ip.includes(searchQuery) ||
                (svc.vendor && svc.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (svc.tags && svc.tags.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            const matchesStatus =
                statusFilter === 'all' ? true :
                    statusFilter === 'online' ? svc.is_active :
                        !svc.is_active;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'custom') {
                const idxA = customOrder.indexOf(a.id);
                const idxB = customOrder.indexOf(b.id);
                // If item not in custom order map, put at end
                if (idxA === -1 && idxB === -1) return 0;
                if (idxA === -1) return 1;
                if (idxB === -1) return -1;
                return idxA - idxB;
            }
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'status') return (b.is_active === a.is_active) ? 0 : b.is_active ? 1 : -1;
            if (sortBy === 'ip') return a.ip.localeCompare(b.ip, undefined, { numeric: true });
            return 0;
        });

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    // Grouping Logic
    const groupedServices = {};
    if (groupBy === 'group') {
        filteredServices.forEach(svc => {
            const grp = svc.group || 'Default';
            if (!groupedServices[grp]) groupedServices[grp] = [];
            groupedServices[grp].push(svc);
        });
    }

    // Initial Fetch & Poll
    useEffect(() => {
        if (token) {
            startPolling();
        }
        return () => stopPolling();
    }, [token]);

    // Status Map
    const serviceStatusMap = services.reduce((acc, svc) => {
        acc[svc.id] = svc.is_active;
        return acc;
    }, {});


    const handleOptimisticAction = async (id, action) => {
        const previousServices = [...services];

        // Optimistic Update
        const updatedServices = services.map(svc => {
            if (svc.id === id) {
                if (action === 'start') return { ...svc, is_active: true, status: 'running' };
                if (action === 'stop') return { ...svc, is_active: false, status: 'stopped' };
                if (action === 'restart') return { ...svc, is_active: false, status: 'restarting' };
            }
            return svc;
        });
        setServices(updatedServices); // Update Store

        try {
            await api.post(`/services/${id}/${action}`);
            fetchServices(true);
        } catch (err) {
            setServices(previousServices); // Revert Store
            alert(err.message || "Action failed");
        }
    };

    const handleOptimisticDelete = async (id) => {
        const previousServices = [...services];
        removeService(id); // Store Action

        setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

        try {
            await api.delete(`/services/${id}`);
            fetchServices(true);
        } catch (err) {
            setServices(previousServices);
            alert(err.message || "Delete failed");
        }
    };

    const handleOptimisticWake = async (mac) => {
        try {
            await api.post('/wol/wake', { mac_address: mac });
            alert(`Sent magic packet to ${mac}`);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleOptimisticEdit = async (serviceToEdit) => {
        // If it's a full service object from Settings button (has name, ip, etc), open edit dialog
        if (serviceToEdit.name && serviceToEdit.ip) {
            setSelectedService(serviceToEdit);
            return;
        }

        // Otherwise it's a partial update from toggle/maintenance button
        const previousServices = [...services];
        updateService(serviceToEdit); // Store Action

        try {
            await api.put(`/services/${serviceToEdit.id}`, serviceToEdit);
            fetchServices(true);
        } catch (err) {
            setServices(previousServices);
            alert(err.message || "Update failed");
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} services?`)) return;

        const previousServices = [...services];
        const ids = Array.from(selectedIds);

        // Optimistic
        const remaining = services.filter(s => !selectedIds.has(s.id));
        setServices(remaining);

        setSelectedIds(new Set());
        setIsSelectionMode(false);

        try {
            await Promise.all(ids.map(id => api.delete(`/services/${id}`)));
            fetchServices(true);
        } catch (err) {
            setServices(previousServices);
            alert("Bulk delete encountered errors. Refreshing...");
            fetchServices();
        }
    };

    return (
        <div>
            {/* ... (Header same) ... */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ margin: 0 }}>Services</h1>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className={`btn ${isSelectionMode ? 'btn-active' : ''}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: isSelectionMode ? 'var(--accent)' : 'var(--bg-secondary)',
                                border: '1px solid var(--border)', color: isSelectionMode ? 'white' : 'var(--text-primary)'
                            }}
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedIds(new Set());
                            }}
                        >
                            <CheckSquare size={18} /> {isSelectionMode ? 'Cancel Selection' : 'Select'}
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            onClick={() => setShowWizard(true)}
                        >
                            <Plus size={18} /> Add Service
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{
                    display: 'flex', gap: '1rem', alignItems: 'center',
                    background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px',
                    border: '1px solid var(--border)', flexWrap: 'wrap'
                }}>
                    {/* ... (Search/Filter inputs same) ... */}
                    {/* Search */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search by Name, IP, Vendor, Tags..."
                            className="input-field"
                            style={{ paddingLeft: '2.5rem' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                    </div>

                    {/* Filter */}
                    <select
                        className="input-field"
                        style={{ width: 'auto', minWidth: '140px' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        aria-label="Filter by Status"
                    >
                        <option value="all">Status: All</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                    </select>

                    {/* Group By */}
                    <select
                        className="input-field"
                        style={{ width: 'auto', minWidth: '140px' }}
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value)}
                        aria-label="Group By"
                    >
                        <option value="none">Group: None</option>
                        <option value="group">Group: Group</option>
                    </select>

                    {/* Sort */}
                    <select
                        className="input-field"
                        style={{ width: 'auto', minWidth: '140px' }}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        aria-label="Sort By"
                    >
                        <option value="name">Sort: Name</option>
                        <option value="ip">Sort: IP</option>
                        <option value="status">Sort: Status</option>
                        <option value="custom">Sort: Custom (Drag)</option>
                    </select>
                </div>
            </div>

            {error && (
                <div style={{ background: '#ef4444', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 'bold' }}>
                    ⚠️ {error}
                </div>
            )}

            {loading && services.length === 0 ? (
                <p>Loading...</p>
            ) : filteredServices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    <p>No services found matching your criteria.</p>
                    <button style={{ marginTop: '1rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                        Clear Filters
                    </button>
                </div>
            ) : groupBy === 'group' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {Object.entries(groupedServices).map(([grp, svcs]) => (
                        <div key={grp}>
                            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                                {grp} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>({svcs.length})</span>
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                {svcs.map((svc) => (
                                    <ServiceCard
                                        key={svc.id}
                                        service={svc}
                                        statusMap={serviceStatusMap}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedIds.has(svc.id)}
                                        onToggleSelection={toggleSelection}
                                        onClick={() => setSelectedService(svc)}
                                        onAction={handleOptimisticAction}
                                        onWake={handleOptimisticWake}
                                        onEdit={handleOptimisticEdit}
                                        onDelete={handleOptimisticDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={filteredServices.map(s => s.id)}
                        strategy={rectSortingStrategy}
                        disabled={sortBy !== 'custom'}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {filteredServices.map((svc) => (
                                sortBy === 'custom' ? (
                                    <SortableServiceCard
                                        key={svc.id}
                                        service={svc}
                                        statusMap={serviceStatusMap}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedIds.has(svc.id)}
                                        onToggleSelection={toggleSelection}
                                        onClick={() => setSelectedService(svc)}
                                        onAction={handleOptimisticAction}
                                        onWake={handleOptimisticWake}
                                        onEdit={handleOptimisticEdit}
                                        onDelete={handleOptimisticDelete}
                                    />
                                ) : (
                                    <ServiceCard
                                        key={svc.id}
                                        service={svc}
                                        statusMap={serviceStatusMap}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedIds.has(svc.id)}
                                        onToggleSelection={toggleSelection}
                                        onClick={() => setSelectedService(svc)}
                                        onAction={handleOptimisticAction}
                                        onWake={handleOptimisticWake}
                                        onEdit={handleOptimisticEdit}
                                        onDelete={handleOptimisticDelete}
                                    />
                                )
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {selectedService && (
                <ServiceDetails
                    service={selectedService}
                    onClose={() => setSelectedService(null)}
                    onAction={handleOptimisticAction}
                />
            )}

            {showWizard && (
                <ServiceWizard
                    onClose={() => setShowWizard(false)}
                    onServiceAdded={() => fetchServices(true)}
                />
            )}

            {selectedService && (
                <ServiceEditDialog
                    service={selectedService}
                    onClose={() => setSelectedService(null)}
                    onSave={() => fetchServices(true)}
                />
            )}

            {/* Floating Action Bar */}
            {selectedIds.size > 0 && (
                <div style={{
                    position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-card)', border: '1px solid var(--accent)',
                    padding: '1rem 2rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', gap: '2rem', zIndex: 100
                }}>
                    <span style={{ fontWeight: 'bold' }}>{selectedIds.size} Selected</span>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }} onClick={handleBulkDelete}>
                            <Trash2 size={18} style={{ marginRight: '0.5rem' }} /> Delete
                        </button>

                        <button className="btn" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid #eab308' }} onClick={() => {
                            // WoL Action
                            Promise.all(Array.from(selectedIds).map(id => api.post(`/services/${id}/wake`)))
                                .then(() => {
                                    alert(`Sent Wake-on-LAN packets.`);
                                    setSelectedIds(new Set());
                                    setIsSelectionMode(false);
                                })
                                .catch(err => alert("Failed to send WoL: " + err));
                        }}>
                            <Zap size={18} style={{ marginRight: '0.5rem' }} /> Wake
                        </button>

                        <button className="btn" style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', border: '1px solid #60a5fa' }} onClick={() => {
                            // Bulk Toggle Maintenance (Set all to True for now, or toggle)
                            if (confirm(`Enable Maintenance Mode for ${selectedIds.size} services?`)) {
                                Promise.all(Array.from(selectedIds).map(id => api.put(`/services/${id}`, { maintenance: true })))
                                    .then(() => {
                                        fetchServices();
                                        setSelectedIds(new Set());
                                        setIsSelectionMode(false);
                                    });
                            }
                        }}>
                            <Wrench size={18} style={{ marginRight: '0.5rem' }} /> Maintenance
                        </button>
                    </div>

                    <button
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        onClick={() => setSelectedIds(new Set())}
                    >
                        <X size={20} />
                    </button>
                </div>
            )
            }
        </div >
    );
};

export default Services;
