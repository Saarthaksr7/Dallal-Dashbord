import React from 'react';
import { useServicesStore } from '../../store/services';
import { useDashboardStore } from '../../store/dashboard';
import { Star, Terminal, Play, Square, RotateCw, Trash2 } from 'lucide-react';

const FavoriteServiceCard = ({ service, onRemove, onAction }) => {
    const getStatusColor = (isActive) => {
        return isActive ? '#10b981' : '#ef4444';
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            position: 'relative',
            transition: 'all 0.2s ease',
            cursor: 'default'
        }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: getStatusColor(service.is_active),
                            boxShadow: `0 0 8px ${getStatusColor(service.is_active)}`
                        }} />
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                            {service.name}
                        </h4>
                    </div>
                    <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.25rem'
                    }}>
                        {service.ip}
                    </div>
                </div>

                <button
                    onClick={onRemove}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    title="Remove from favorites"
                >
                    <Star size={16} fill="currentColor" />
                </button>
            </div>

            {/* Quick Actions */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem'
            }}>
                <button
                    onClick={() => onAction(service.id, 'start')}
                    disabled={service.is_active}
                    className="btn"
                    style={{
                        padding: '0.5rem',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        background: service.is_active ? 'var(--bg-secondary)' : 'rgba(16, 185, 129, 0.1)',
                        color: service.is_active ? 'var(--text-secondary)' : '#10b981',
                        border: '1px solid var(--border)',
                        opacity: service.is_active ? 0.5 : 1,
                        cursor: service.is_active ? 'not-allowed' : 'pointer'
                    }}
                    title="Start service"
                >
                    <Play size={14} />
                    <span>Start</span>
                </button>

                <button
                    onClick={() => onAction(service.id, 'stop')}
                    disabled={!service.is_active}
                    className="btn"
                    style={{
                        padding: '0.5rem',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        background: !service.is_active ? 'var(--bg-secondary)' : 'rgba(239, 68, 68, 0.1)',
                        color: !service.is_active ? 'var(--text-secondary)' : '#ef4444',
                        border: '1px solid var(--border)',
                        opacity: !service.is_active ? 0.5 : 1,
                        cursor: !service.is_active ? 'not-allowed' : 'pointer'
                    }}
                    title="Stop service"
                >
                    <Square size={14} />
                    <span>Stop</span>
                </button>

                <button
                    onClick={() => onAction(service.id, 'restart')}
                    className="btn"
                    style={{
                        padding: '0.5rem',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--accent)',
                        border: '1px solid var(--border)'
                    }}
                    title="Restart service"
                >
                    <RotateCw size={14} />
                    <span>Restart</span>
                </button>
            </div>

            {/* SSH Quick Connect */}
            {service.ssh_username && (
                <a
                    href={`/ssh?host=${service.ip}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--accent)';
                        e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                >
                    <Terminal size={14} />
                    <span>SSH Connect</span>
                </a>
            )}

            {/* Service Info */}
            <div style={{
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <span>{service.vendor || 'Unknown Vendor'}</span>
                <span>{service.status || (service.is_active ? 'Running' : 'Stopped')}</span>
            </div>
        </div>
    );
};

export default FavoriteServiceCard;
