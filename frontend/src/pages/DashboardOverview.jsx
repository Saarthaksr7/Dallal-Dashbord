import React from 'react';
import { useTranslation } from 'react-i18next';
import ServiceStatusWidget from '../components/widgets/ServiceStatusWidget';
import AlertsWidget from '../components/widgets/AlertsWidget';
import UptimeWidget from '../components/widgets/UptimeWidget';

const DashboardOverview = () => {
    const { t } = useTranslation();

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ margin: '0 0 0.5rem 0' }}>{t('dashboard.overview.title')}</h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {t('dashboard.overview.subtitle')}
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem'
            }}>
                <ServiceStatusWidget />
                <AlertsWidget />
                <UptimeWidget />
            </div>
        </div>
    );
};

export default DashboardOverview;
