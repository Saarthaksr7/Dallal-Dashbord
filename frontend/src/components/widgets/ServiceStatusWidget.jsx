import React from 'react';
import { useTranslation } from 'react-i18next';
import { useServicesStore } from '../../store/services';
import Card from '../ui/Card';
import { Activity, CheckCircle, XCircle } from 'lucide-react';

const ServiceStatusWidget = () => {
    const { t } = useTranslation();
    const services = useServicesStore((state) => state.services);

    const totalServices = services.length;
    const onlineServices = services.filter(s => s.is_active).length;
    const offlineServices = totalServices - onlineServices;
    const onlinePercentage = totalServices > 0 ? Math.round((onlineServices / totalServices) * 100) : 0;

    return (
        <Card style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Activity size={24} style={{ color: 'var(--accent)' }} aria-hidden="true" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{t('dashboard.overview.serviceStatus')}</h3>
                </div>

                <div
                    role="region"
                    aria-label="Service statistics"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1.5rem 0'
                    }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                        <div
                            aria-label={`Total services: ${totalServices}`}
                            style={{
                                fontSize: '2.5rem',
                                fontWeight: 'bold',
                                color: 'var(--accent)'
                            }}>
                            {totalServices}
                        </div>
                        <div style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.25rem'
                        }} aria-hidden="true">
                            {t('dashboard.overview.totalServices')}
                        </div>
                    </div>

                    <div style={{
                        width: '1px',
                        height: '60px',
                        background: 'var(--border)'
                    }} />

                    <div style={{ textAlign: 'center', flex: 1 }}>
                        <div
                            aria-label={`${onlinePercentage} percent of services online`}
                            style={{
                                fontSize: '2.5rem',
                                fontWeight: 'bold',
                                color: '#10b981'
                            }}>
                            {onlinePercentage}%
                        </div>
                        <div style={{
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.25rem'
                        }} aria-hidden="true">
                            {t('dashboard.overview.online')}
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)'
                }}>
                    <div
                        role="status"
                        aria-label={`${onlineServices} services online`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '8px'
                        }}>
                        <CheckCircle size={20} style={{ color: '#10b981' }} aria-hidden="true" />
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                                {onlineServices}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {t('dashboard.overview.online')}
                            </div>
                        </div>
                    </div>

                    <div
                        role="status"
                        aria-label={`${offlineServices} services offline`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '8px'
                        }}>
                        <XCircle size={20} style={{ color: '#ef4444' }} aria-hidden="true" />
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>
                                {offlineServices}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {t('dashboard.overview.offline')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ServiceStatusWidget;
