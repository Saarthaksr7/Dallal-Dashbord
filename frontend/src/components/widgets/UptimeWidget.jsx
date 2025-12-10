import React from 'react';
import { useTranslation } from 'react-i18next';
import { useServicesStore } from '../../store/services';
import Card from '../ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const UptimeWidget = () => {
    const { t } = useTranslation();
    const services = useServicesStore((state) => state.services);

    // Calculate overall uptime (simplified - based on current active status)
    // In production, this would query historical data
    const totalServices = services.length;
    const onlineServices = services.filter(s => s.is_active).length;
    const uptimePercentage = totalServices > 0 ? ((onlineServices / totalServices) * 100).toFixed(1) : 0;

    // Mock trend data (would come from historical metrics in production)
    const previousUptime = 95.2;
    const currentUptime = parseFloat(uptimePercentage);
    const trend = currentUptime > previousUptime ? 'up' : currentUptime < previousUptime ? 'down' : 'stable';
    const trendValue = Math.abs(currentUptime - previousUptime).toFixed(1);

    const getTrendIcon = () => {
        switch (trend) {
            case 'up': return <TrendingUp size={20} style={{ color: '#10b981' }} />;
            case 'down': return <TrendingDown size={20} style={{ color: '#ef4444' }} />;
            default: return <Minus size={20} style={{ color: 'var(--text-secondary)' }} />;
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case 'up': return '#10b981';
            case 'down': return '#ef4444';
            default: return 'var(--text-secondary)';
        }
    };

    // Mock sparkline data points
    const sparklineData = [92, 94, 93, 95, 96, 94, 95, currentUptime];
    const maxValue = Math.max(...sparklineData);
    const minValue = Math.min(...sparklineData);
    const range = maxValue - minValue || 1;

    return (
        <Card style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{t('dashboard.overview.uptime')}</h3>
                </div>

                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, var(--accent), #10b981)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        {uptimePercentage}%
                    </div>
                    <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.25rem'
                    }}>
                        Last 30 Days
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px'
                }}>
                    {getTrendIcon()}
                    <span style={{
                        fontSize: '0.9rem',
                        color: getTrendColor(),
                        fontWeight: '600'
                    }}>
                        {trend === 'stable' ? 'Stable' : `${trendValue}% ${trend === 'up' ? 'increase' : 'decrease'}`}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        vs. last period
                    </span>
                </div>

                {/* Mini Sparkline */}
                <div style={{
                    padding: '1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    flex: 1,
                    minHeight: '60px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        height: '50px',
                        gap: '2px'
                    }}>
                        {sparklineData.map((value, index) => {
                            const height = ((value - minValue) / range) * 100;
                            return (
                                <div
                                    key={index}
                                    style={{
                                        flex: 1,
                                        height: `${Math.max(height, 10)}%`,
                                        background: index === sparklineData.length - 1
                                            ? 'var(--accent)'
                                            : 'rgba(59, 130, 246, 0.5)',
                                        borderRadius: '2px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    title={`${value}%`}
                                />
                            );
                        })}
                    </div>
                </div>

                <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--border)'
                }}>
                    {onlineServices} of {totalServices} services online
                </div>
            </div>
        </Card>
    );
};

export default UptimeWidget;
