import React from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card';
import { AlertTriangle, AlertCircle, Bell } from 'lucide-react';

const AlertsWidget = () => {
    const { t } = useTranslation();
    // Mock alerts data for now - will be replaced with API call in Stage 3
    const mockAlerts = [
        { id: 1, severity: 'critical', message: 'Database server not responding', time: '5 min ago' },
        { id: 2, severity: 'warning', message: 'High CPU usage on web server', time: '12 min ago' },
        { id: 3, severity: 'info', message: 'Backup completed successfully', time: '1 hour ago' }
    ];

    const criticalCount = mockAlerts.filter(a => a.severity === 'critical').length;
    const warningCount = mockAlerts.filter(a => a.severity === 'warning').length;
    const totalCount = mockAlerts.length;

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
            case 'critical': return <AlertTriangle size={16} />;
            case 'warning': return <AlertCircle size={16} />;
            default: return <Bell size={16} />;
        }
    };

    return (
        <Card style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Bell size={24} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{t('dashboard.overview.alerts')}</h3>
                    {totalCount > 0 && (
                        <span style={{
                            marginLeft: 'auto',
                            background: 'var(--accent)',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                        }}>
                            {totalCount}
                        </span>
                    )}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '8px'
                    }}>
                        <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                                {criticalCount}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {t('dashboard.overview.critical')}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: '8px'
                    }}>
                        <AlertCircle size={20} style={{ color: '#f59e0b' }} />
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                {warningCount}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {t('dashboard.overview.warnings')}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h4 style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        fontWeight: '500'
                    }}>
                        {t('dashboard.overview.recentAlerts')}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {mockAlerts.slice(0, 3).map(alert => (
                            <div key={alert.id} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.5rem',
                                padding: '0.5rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: '6px',
                                borderLeft: `3px solid ${getSeverityColor(alert.severity)}`
                            }}>
                                <div style={{ color: getSeverityColor(alert.severity), marginTop: '2px' }}>
                                    {getSeverityIcon(alert.severity)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-primary)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {alert.message}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        {alert.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <a
                    href="/monitoring"
                    style={{
                        color: 'var(--accent)',
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        textAlign: 'center',
                        padding: '0.5rem',
                        borderTop: '1px solid var(--border)',
                        marginTop: 'auto'
                    }}
                >
                    {t('dashboard.overview.viewAll')} →
                </a>
            </div>
        </Card>
    );
};

export default AlertsWidget;
