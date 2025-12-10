import React from 'react';
import Card from './ui/Card';
import { useLocation } from 'wouter';
import { Globe, Server, Activity, Play, Square, RotateCw, Zap, Trash2, Settings, AlertTriangle, GitCommit, Wrench, GripVertical, Terminal, Monitor } from 'lucide-react';
import Restricted from './auth/Restricted';

const ServiceCard = ({ service, onAction, onEdit, onDelete, onWake, statusMap, isSelectionMode, isSelected, onToggleSelection, isDraggable, dragListeners }) => {
    const [, setLocation] = useLocation();
    const isOnline = service.is_active;
    const enabled = service.enabled !== false;
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

    // Check dependency status
    let dependencyWarning = false;
    if (service.parent_id && statusMap) {
        const parentStatus = statusMap[service.parent_id];
        // If parent exists in map and is False (Offline), show warning
        if (parentStatus === false) {
            dependencyWarning = true;
        }
    }

    // Icon based on check type
    const Icon = service.check_type === 'http' ? Globe : Server;

    const handleAction = (action) => {
        if (onAction) onAction(service.id, action);
    };

    const handleWake = () => {
        if (onWake) onWake(service.mac_address);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const confirmDelete = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(false);
        if (onDelete) {
            onDelete(service.id);
        }
    };

    const cancelDelete = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(false);
    };

    const toggleEnabled = (e) => {
        e.stopPropagation();
        // Assume parent handles toggle via onEdit or specialized prop, 
        // for now just visual toggle for UI demo if no handler
        if (onEdit) onEdit({ ...service, enabled: !enabled });
    };

    const handleSSHConnect = (e) => {
        e.stopPropagation();
        // Navigate to SSH page with pre-filled credentials
        setLocation(`/ssh?ip=${service.ip}&username=${service.ssh_username || ''}&password=${service.ssh_password || ''}`);
    };

    const handleRDPConnect = (e) => {
        e.stopPropagation();
        // Navigate to RDP page with pre-filled credentials
        setLocation(`/rdp?ip=${service.ip}&username=${service.rdp_username || ''}&password=${service.rdp_password || ''}&domain=${service.rdp_domain || ''}`);
    };

    // Check if service has SSH or RDP based on tags or credentials
    const hasSSH = service.ssh_username || service.tags?.toLowerCase().includes('ssh') || service.tags?.toLowerCase().includes('linux');
    const hasRDP = service.rdp_username || service.tags?.toLowerCase().includes('rdp') || service.tags?.toLowerCase().includes('windows');

    return (
        <Card
            className={`service-card ${isSelected ? 'selected' : ''} `}
            onClick={(e) => {
                if (isSelectionMode) {
                    e.preventDefault();
                    onToggleSelection(service.id);
                }
            }}
            tabIndex={isSelectionMode ? 0 : -1}
            role={isSelectionMode ? "checkbox" : undefined}
            aria-checked={isSelected}
            onKeyDown={(e) => {
                if (isSelectionMode && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onToggleSelection(service.id);
                }
            }}
        >
            {isSelectionMode && (
                <div className="selection-overlay">
                    <div className={`checkbox ${isSelected ? 'checked' : ''} `}>
                        {isSelected && <div className="check-mark">✔</div>}
                    </div>
                </div>
            )}
            {showDeleteConfirm && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    borderRadius: '12px',
                    padding: '20px',
                    gap: '15px'
                }}>
                    <div style={{ color: 'white', fontSize: '16px', textAlign: 'center', fontWeight: 500 }}>
                        Delete "{service.name}"?
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={confirmDelete}
                            style={{
                                padding: '8px 20px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Delete
                        </button>
                        <button
                            onClick={cancelDelete}
                            style={{
                                padding: '8px 20px',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            <div className="card-header-row">
                {isDraggable && (
                    <div {...dragListeners} className="drag-handle" title="Drag to reorder" style={{ cursor: 'grab', padding: '0 0.5rem', opacity: 0.3 }}>
                        <GripVertical size={20} />
                    </div>
                )}
                <div className="icon-wrapper" style={{ position: 'relative' }}>
                    <Icon size={20} color="var(--text-primary)" />
                    {dependencyWarning && (
                        <div title="Parent Dependency Offline" style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', borderRadius: '50%', padding: '2px' }}>
                            <AlertTriangle size={12} color="white" />
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, marginLeft: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 className="service-name">{service.name}</h3>
                            <div className="service-detail">{service.hostname || service.ip}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {/* Toggle Switch */}
                            <div
                                className="toggle-switch"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleEnabled(e);
                                }}
                                title={enabled ? "Disable Monitoring" : "Enable Monitoring"}
                                aria-label={enabled ? "Disable monitoring" : "Enable monitoring"}
                                role="switch"
                                aria-checked={enabled}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleEnabled(e);
                                    }
                                }}
                            >
                                <div className={`switch-track ${enabled ? 'on' : 'off'}`}>
                                    <div className="switch-thumb" />
                                </div>
                            </div>

                            <button
                                className="icon-btn danger"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(e);
                                }}
                                title="Delete Service"
                                aria-label={`Delete service ${service.name}`}
                            >
                                <Trash2 size={16} />
                            </button>

                            <button
                                className="icon-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(service);
                                }}
                                title="Edit Service"
                                aria-label={`Edit service ${service.name}`}
                            >
                                <Settings size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Secondary Info Line */}
                    <div className="service-sub-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {service.vendor && (
                                <span className="vendor-badge" style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                    {service.vendor}
                                </span>
                            )}
                            {/* Status Indicator */}
                            <div className="status-indicator" title={service.maintenance ? "Maintenance" : (isOnline ? "Online" : "Offline")} role="status">
                                <div className={`dot ${service.maintenance ? 'maintenance' : (isOnline ? 'online' : 'offline')} `} />
                                <span className="ms">{!service.maintenance && service.response_time_ms ? `${service.response_time_ms} ms` : ''}</span>
                            </div>
                        </div>
                        <span className="service-sub" style={{ opacity: 0.5 }}>
                            {service.port ? `:${service.port} ` : service.group}
                        </span>

                        {service.drift_detected && (
                            <div title="Configuration Drift Detected: Response did not match expected output" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'orange', fontSize: '0.75rem', background: 'rgba(255, 165, 0, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                <GitCommit size={12} />
                                <span>Drift</span>
                            </div>
                        )}

                        {service.maintenance && (
                            <div title="Under Maintenance" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#60a5fa', fontSize: '0.75rem', background: 'rgba(96, 165, 250, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                <Wrench size={12} />
                                <span>Maint</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Connect Buttons */}
            {(hasSSH || hasRDP) && (
                <div className="card-quick-connect-row">
                    {hasSSH && (
                        <button
                            className="quick-connect-btn ssh"
                            onClick={handleSSHConnect}
                            title={`SSH to ${service.name}`}
                        >
                            <Terminal size={14} />
                            <span>SSH</span>
                        </button>
                    )}
                    {hasRDP && (
                        <button
                            className="quick-connect-btn rdp"
                            onClick={handleRDPConnect}
                            title={`RDP to ${service.name}`}
                        >
                            <Monitor size={14} />
                            <span>RDP</span>
                        </button>
                    )}
                </div>
            )}

            <div className="card-actions-row">
                <button
                    className={`icon-btn ${service.maintenance ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit({ ...service, maintenance: !service.maintenance });
                    }}
                    title="Toggle Maintenance Mode"
                    aria-label="Toggle Maintenance"
                >
                    <Wrench size={16} />
                </button>

                <button
                    className={`icon-btn ${service.status === 'running' ? 'disabled' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAction('start');
                    }}
                    disabled={service.status === 'running'}
                    title="Start Service"
                    aria-label={`Start service ${service.name}`}
                >
                    <Play size={16} />
                </button>
                <button
                    className={`icon-btn ${service.status === 'stopped' ? 'disabled' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAction('stop');
                    }}
                    disabled={service.status === 'stopped'}
                    title="Stop Service"
                    aria-label={`Stop service ${service.name}`}
                >
                    <Square size={16} />
                </button>
                <button
                    className="icon-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAction('restart');
                    }}
                    title="Restart Service"
                    aria-label={`Restart service ${service.name}`}
                >
                    <RotateCw size={16} />
                </button>
                {/* Wake-on-LAN Button */}
                <button
                    className="icon-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleWake();
                    }}
                    title="Wake Device (WOL)"
                    aria-label={`Wake up ${service.name} (Wake-on-LAN)`}
                >
                    <Zap size={16} />
                </button>
            </div>

            <style>{`
                .glass-panel.service-card,
                div.service-card { 
                    transition: all 0.2s ease; 
                    cursor: pointer; 
                    position: relative;
                    background: linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6)) !important;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .glass-panel.service-card:hover,
                div.service-card:hover { 
                    transform: translateY(-2px); 
                    border-color: var(--accent);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                }
                
                .card-header-row { 
                    display: flex; 
                    align-items: flex-start; 
                    margin-bottom: 1rem;
                    gap: 0.75rem;
                }
                
                .drag-handle {
                    transition: opacity 0.2s;
                }
                .drag-handle:hover {
                    opacity: 0.7 !important;
                }
                .drag-handle:active {
                    cursor: grabbing !important;
                }
                
                .icon-wrapper { 
                    width: 40px; 
                    height: 40px; 
                    border-radius: 10px; 
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                
                .status-indicator { 
                    display: flex; 
                    align-items: center; 
                    gap: 6px; 
                    font-size: 0.75rem; 
                    color: var(--text-secondary); 
                    padding: 4px 8px; 
                    border-radius: 12px;
                    background: rgba(255,255,255,0.03);
                }
                .dot { 
                    width: 8px; 
                    height: 8px; 
                    border-radius: 50%; 
                    animation: pulse 2s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                .dot.online { 
                    background-color: var(--success); 
                    box-shadow: 0 0 10px var(--success); 
                }
                .dot.offline { 
                    background-color: var(--danger);
                    animation: none;
                }
                .dot.maintenance { 
                    background-color: #60a5fa; 
                    box-shadow: 0 0 10px #60a5fa; 
                }
                
                .service-name { 
                    margin: 0 0 0.25rem 0; 
                    font-size: 1.05rem; 
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .service-detail { 
                    font-size: 0.85rem; 
                    color: var(--text-secondary); 
                    font-family: 'Monaco', 'Menlo', monospace;
                }
                .service-sub { 
                    font-size: 0.75rem; 
                    color: var(--text-secondary); 
                    margin-top: 0.25rem; 
                    opacity: 0.7; 
                }
                
                .card-quick-connect-row {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                    padding-top: 0.5rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }

                .quick-connect-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05);
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                .quick-connect-btn:hover {
                    transform: translateY(-1px);
                    border-color: var(--accent);
                    color: var(--accent);
                    background: rgba(59, 130, 246, 0.1);
                }

                .quick-connect-btn.ssh:hover {
                    border-color: #10b981;
                    color: #10b981;
                    background: rgba(16, 185, 129, 0.1);
                }

                .quick-connect-btn.rdp:hover {
                    border-color: #f59e0b;
                    color: #f59e0b;
                    background: rgba(245, 158, 11, 0.1);
                }
                
                .card-actions-row { 
                    display: flex; 
                    justify-content: flex-start;
                    gap: 0.5rem; 
                    flex-wrap: wrap;
                    border-top: 1px solid rgba(255,255,255,0.05); 
                    padding-top: 0.75rem;
                    margin-top: 0.75rem;
                }
                
                .icon-btn { 
                    background: rgba(255,255,255,0.05); 
                    border: 1px solid rgba(255,255,255,0.1); 
                    color: var(--text-secondary); 
                    cursor: pointer; 
                    padding: 8px 10px; 
                    border-radius: 6px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    transition: all 0.2s ease;
                    font-size: 0.85rem;
                }
                .icon-btn:hover:not(.disabled) { 
                    background: rgba(255,255,255,0.1); 
                    color: var(--text-primary);
                    transform: translateY(-1px);
                    border-color: var(--accent);
                }
                .icon-btn:active:not(.disabled) {
                    transform: translateY(0);
                }
                .icon-btn.message:hover { 
                    color: var(--accent); 
                    background: rgba(59, 130, 246, 0.15);
                    border-color: var(--accent);
                }
                .icon-btn.danger:hover { 
                    color: var(--danger); 
                    background: rgba(239, 68, 68, 0.15);
                    border-color: var(--danger);
                }
                .icon-btn.disabled { 
                    opacity: 0.3; 
                    cursor: not-allowed;
                    pointer-events: none;
                }
                .icon-btn.active {
                    background: rgba(96, 165, 250, 0.15);
                    color: #60a5fa;
                    border-color: #60a5fa;
                }
                
                .toggle-switch {
                    cursor: pointer; 
                    display: flex; 
                    align-items: center;
                    transition: transform 0.2s;
                }
                .toggle-switch:hover {
                    transform: scale(1.05);
                }
                .switch-track {
                    width: 36px; 
                    height: 20px; 
                    background: rgba(255,255,255,0.1); 
                    border-radius: 99px;
                    position: relative; 
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .switch-track.on { 
                    background: var(--accent);
                    border-color: var(--accent);
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
                }
                .switch-thumb {
                    width: 16px; 
                    height: 16px; 
                    background: white; 
                    border-radius: 50%;
                    position: absolute; 
                    top: 2px; 
                    left: 2px; 
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .switch-track.on .switch-thumb { 
                    transform: translateX(16px); 
                }
                
                .service-card.selected { 
                    border-color: var(--accent); 
                    background: rgba(59, 130, 246, 0.05);
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
                }
                .selection-overlay {
                    position: absolute; 
                    top: 0; 
                    left: 0; 
                    right: 0; 
                    bottom: 0;
                    background: rgba(0,0,0,0.3); 
                    backdrop-filter: blur(2px);
                    z-index: 10;
                    display: flex; 
                    justify-content: flex-end; 
                    padding: 1rem;
                    border-radius: 12px;
                }
                .checkbox {
                    width: 24px; 
                    height: 24px; 
                    border-radius: 6px;
                    border: 2px solid rgba(255,255,255,0.3); 
                    background: rgba(0,0,0,0.5);
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    color: white; 
                    font-size: 14px; 
                    transition: all 0.2s;
                }
                .checkbox.checked { 
                    background: var(--accent); 
                    border-color: var(--accent);
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                }
            `}</style>
        </Card >
    );
};

export default ServiceCard;
