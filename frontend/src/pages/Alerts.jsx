import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, Search, Filter, X } from 'lucide-react';

const Alerts = () => {
    const { t } = useTranslation();
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAlert, setSelectedAlert] = useState(null);

    // Mock alerts data - will be replaced with API call in future
    const mockAlerts = [
        {
            id: 1,
            severity: 'critical',
            title: 'Database server not responding',
            message: 'MySQL database on 192.168.1.10 has failed health checks for the last 5 minutes',
            service: 'MySQL Server',
            status: 'active',
            timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
            acknowledged: false
        },
        {
            id: 2,
            severity: 'warning',
            title: 'High CPU usage detected',
            message: 'Web server CPU usage has exceeded 85% threshold',
            service: 'Web Server',
            status: 'active',
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            acknowledged: true,
            acknowledgedBy: 'admin'
        },
        {
            id: 3,
            severity: 'info',
            title: 'Backup completed successfully',
            message: 'Daily backup completed for all services',
            service: 'Backup System',
            status: 'resolved',
            timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
            acknowledged: true,
            resolvedAt: new Date(Date.now() - 60 * 60000).toISOString()
        },
        {
            id: 4,
            severity: 'warning',
            title: 'Disk space running low',
            message: 'Storage on /dev/sda1 has exceeded 90% capacity',
            service: 'File Server',
            status: 'active',
            timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
            acknowledged: false
        },
        {
            id: 5,
            severity: 'critical',
            title: 'Service stopped unexpectedly',
            message: 'Docker container web-app has stopped running',
            service: 'Docker Container',
            status: 'resolved',
            timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
            acknowledged: true,
            resolvedAt: new Date(Date.now() - 180 * 60000).toISOString()
        }
    ];

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return '#ef4444';
            case 'warning': return '#f59e0b';
            case 'info': return '#3b82f6';
            default: return 'var(--text-secondary)';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical': return <AlertTriangle size={18} />;
            case 'warning': return <AlertCircle size={18} />;
            case 'info': return <Info size={18} />;
            default: return <Bell size={18} />;
        }
    };

    const formatTimeAgo = (timestamp) => {
        const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const filteredAlerts = mockAlerts.filter(alert => {
        const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
        const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
        const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            alert.service.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSeverity && matchesStatus && matchesSearch;
    });

    const handleAcknowledge = (alertId) => {
        console.log('Acknowledge alert:', alertId);
        // In production: API call to acknowledge
    };

    const handleResolve = (alertId) => {
        console.log('Resolve alert:', alertId);
        // In production: API call to resolve
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Bell size={28} style={{ color: 'var(--accent)' }} />
                    <h1 style={{ margin: '0 0 0.5rem 0' }}>{t('monitoring.alerts.title')}</h1>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {t('monitoring.alerts.subtitle')}
                </p>
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search alerts..."
                        className="input-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>

                <select
                    className="input-field"
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    style={{ minWidth: '150px' }}
                >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                </select>

                <select
                    className="input-field"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ minWidth: '150px' }}
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>

            {/* Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Critical</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                        {mockAlerts.filter(a => a.severity === 'critical' && a.status === 'active').length}
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertCircle size={18} style={{ color: '#f59e0b' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Warnings</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {mockAlerts.filter(a => a.severity === 'warning' && a.status === 'active').length}
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Bell size={18} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Active Alerts</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {mockAlerts.filter(a => a.status === 'active').length}
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <CheckCircle size={18} style={{ color: '#10b981' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Resolved</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                        {mockAlerts.filter(a => a.status === 'resolved').length}
                    </div>
                </Card>
            </div>

            {/* Alerts List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredAlerts.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <Bell size={48} style={{ margin: '0 auto 1rem' }} />
                            <p>No alerts match your filters</p>
                        </div>
                    </Card>
                ) : (
                    filteredAlerts.map(alert => (
                        <Card
                            key={alert.id}
                            style={{
                                borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setSelectedAlert(alert)}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = getSeverityColor(alert.severity)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <div style={{ color: getSeverityColor(alert.severity) }}>
                                            {getSeverityIcon(alert.severity)}
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                                            {alert.title}
                                        </h3>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            background: alert.status === 'active'
                                                ? 'rgba(239, 68, 68, 0.15)'
                                                : 'rgba(16, 185, 129, 0.15)',
                                            color: alert.status === 'active' ? '#ef4444' : '#10b981',
                                            border: `1px solid ${alert.status === 'active' ? '#ef4444' : '#10b981'}`
                                        }}>
                                            {alert.status}
                                        </span>
                                    </div>

                                    <p style={{
                                        margin: '0.5rem 0',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.9rem'
                                    }}>
                                        {alert.message}
                                    </p>

                                    <div style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        marginTop: '0.75rem',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <span>Service: <strong>{alert.service}</strong></span>
                                        <span>•</span>
                                        <span>{formatTimeAgo(alert.timestamp)}</span>
                                        {alert.acknowledged && (
                                            <>
                                                <span>•</span>
                                                <span style={{ color: '#10b981' }}>Acknowledged</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Alert Detail Modal */}
            {selectedAlert && (
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
                    zIndex: 1000,
                    padding: '2rem'
                }}
                    onClick={() => setSelectedAlert(null)}
                >
                    <div
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ color: getSeverityColor(selectedAlert.severity) }}>
                                        {getSeverityIcon(selectedAlert.severity)}
                                    </div>
                                    <h2 style={{ margin: 0 }}>{selectedAlert.title}</h2>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {new Date(selectedAlert.timestamp).toLocaleString()}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAlert(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    padding: '0.25rem 0.5rem'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Message
                                </h4>
                                <p style={{ margin: 0 }}>{selectedAlert.message}</p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Details
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Service:</span>
                                    <span>{selectedAlert.service}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>Severity:</span>
                                    <span style={{
                                        color: getSeverityColor(selectedAlert.severity),
                                        textTransform: 'capitalize'
                                    }}>
                                        {selectedAlert.severity}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                                    <span style={{ textTransform: 'capitalize' }}>{selectedAlert.status}</span>
                                    {selectedAlert.acknowledged && (
                                        <>
                                            <span style={{ color: 'var(--text-secondary)' }}>Acknowledged by:</span>
                                            <span>{selectedAlert.acknowledgedBy || 'System'}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                {!selectedAlert.acknowledged && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            handleAcknowledge(selectedAlert.id);
                                            setSelectedAlert(null);
                                        }}
                                        style={{ flex: 1 }}
                                    >
                                        Acknowledge
                                    </button>
                                )}
                                {selectedAlert.status === 'active' && (
                                    <button
                                        className="btn"
                                        onClick={() => {
                                            handleResolve(selectedAlert.id);
                                            setSelectedAlert(null);
                                        }}
                                        style={{
                                            flex: 1,
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            color: '#10b981',
                                            border: '1px solid #10b981'
                                        }}
                                    >
                                        Resolve
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Alerts;
