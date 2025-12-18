import React, { useState } from 'react';
import { useServicesStore } from '../store/services';
import { useDashboardStore } from '../store/dashboard';
import { api } from '../lib/api';
import FavoriteServiceCard from '../components/widgets/FavoriteServiceCard';
import { Star, Plus, Info } from 'lucide-react';
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

const SortableFavoriteCard = ({ service, ...props }) => {
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
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <FavoriteServiceCard service={service} {...props} />
        </div>
    );
};

const DashboardFavorites = () => {
    const services = useServicesStore((state) => state.services);
    const fetchServices = useServicesStore((state) => state.fetchServices);
    const { favorites, removeFavorite, reorderFavorites } = useDashboardStore();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const favoriteServices = favorites
        .map(id => services.find(s => s.id === id))
        .filter(Boolean);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = favorites.indexOf(active.id);
            const newIndex = favorites.indexOf(over.id);
            const newOrder = arrayMove(favorites, oldIndex, newIndex);
            reorderFavorites(newOrder);
        }
    };

    const handleRemoveFavorite = (serviceId) => {
        removeFavorite(serviceId);
    };

    const handleServiceAction = async (id, action) => {
        try {
            await api.post(`/services/${id}/${action}`);
            fetchServices(true);
        } catch (err) {
            console.error(`Failed to ${action} service:`, err);
            alert(err.message || `Failed to ${action} service`);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Star size={28} style={{ color: 'var(--accent)' }} />
                    <h1 style={{ margin: 0 }}>Favorites</h1>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    Quick access to your most important services
                </p>
            </div>

            {favoriteServices.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'var(--bg-card)',
                    border: '2px dashed var(--border)',
                    borderRadius: '12px'
                }}>
                    <Star size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        No Favorites Yet
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto' }}>
                        Add services to your favorites from the Services page for quick access to actions and SSH connections.
                    </p>
                    <a
                        href="/services"
                        className="btn btn-primary"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginTop: '1rem',
                            textDecoration: 'none'
                        }}
                    >
                        <Plus size={18} />
                        Go to Services
                    </a>
                </div>
            ) : (
                <>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        marginBottom: '1.5rem'
                    }}>
                        <Info size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            Drag and drop cards to reorder your favorites
                        </span>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={favorites}
                            strategy={rectSortingStrategy}
                        >
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {favoriteServices.map((service) => (
                                    <SortableFavoriteCard
                                        key={service.id}
                                        service={service}
                                        onRemove={() => handleRemoveFavorite(service.id)}
                                        onAction={handleServiceAction}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <div style={{
                        marginTop: '2rem',
                        textAlign: 'center',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid var(--border)'
                    }}>
                        <a
                            href="/services"
                            style={{
                                color: 'var(--accent)',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Plus size={16} />
                            Add more favorites
                        </a>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardFavorites;
