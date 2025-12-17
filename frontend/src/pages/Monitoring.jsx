import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useServicesStore } from '../store/services';
import { api } from '../lib/api';
import Card from '../components/ui/Card';
import { Activity, TrendingUp, TrendingDown, Calendar, RefreshCw, Bell } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Monitoring = () => {
    const { t } = useTranslation();
    const services = useServicesStore((state) => state.services);
    const [selectedService, setSelectedService] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('24h');
    const [metricType, setMetricType] = useState('response_time');
    const [isLiveMode, setIsLiveMode] = useState(false);

    useEffect(() => {
        if (services.length > 0 && !selectedService) {
            setSelectedService(services[0]);
        }
    }, [services]);

    useEffect(() => {
        if (selectedService) {
            fetchHistory();
        }
    }, [selectedService, dateRange]);

    // Live mode auto-refresh
    useEffect(() => {
        if (!isLiveMode || !selectedService) return;

        const interval = setInterval(() => {
            fetchHistory();
        }, 10000); // Refresh every 10 seconds

        return () => clearInterval(interval);
    }, [isLiveMode, selectedService]);

    const fetchHistory = async () => {
        if (!selectedService) return;

        setLoading(true);
        try {
            // Calculate limit based on time range
            const limits = {
                'live': 60,      // Last 60 data points (5min if 5sec intervals)
                '5m': 60,        // 5 minutes
                '10m': 120,      // 10 minutes
                '15m': 180,      // 15 minutes
                '30m': 360,      // 30 minutes
                '1h': 720,       // 1 hour
                '3h': 2160,      // 3 hours
                '6h': 4320,      // 6 hours
                '12h': 8640,     // 12 hours
                '24h': 288,      // 24 hours (5min intervals)
                '7d': 168,       // 7 days (hourly)
                '30d': 720       // 30 days (hourly)
            };
            const limit = limits[dateRange] || 288;
            const res = await api.get(`/services/${selectedService.id}/history?limit=${limit}`);
            setHistoryData(res.data.reverse());
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setLoading(false);
        }
    };

    const formatChartData = () => {
        return historyData.map(item => ({
            time: new Date(item.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            response_time: item.latency_ms || 0,
            is_active: item.is_active ? 100 : 0,
            timestamp: item.timestamp
        }));
    };

    const calculateStats = () => {
        if (historyData.length === 0) return { avg: 0, min: 0, max: 0, uptime: 0 };

        const responseTimes = historyData.map(h => h.latency_ms || 0).filter(t => t > 0);
        const avg = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : 0;
        const min = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
        const max = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

        const activeCount = historyData.filter(h => h.is_active).length;
        const uptime = historyData.length > 0
            ? ((activeCount / historyData.length) * 100).toFixed(2)
            : 0;

        return { avg, min, max, uptime };
    };

    const stats = calculateStats();
    const chartData = formatChartData();

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Activity size={28} style={{ color: 'var(--accent)' }} aria-hidden="true" />
                        <div>
                            <h1 style={{ margin: '0 0 0.5rem 0' }}>{t('monitoring.metrics.title')}</h1>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                {t('monitoring.metrics.subtitle')}
                            </p>
                        </div>
                    </div>
                    <a
                        href="/monitoring/alerts"
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
                    >
                        <Bell size={18} />
                        Manage Alert Rules
                    </a>
                </div>
            </div>

            {/* Controls */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem'
                    }}>
                        Service
                    </label>
                    <select
                        className="input-field"
                        value={selectedService?.id || ''}
                        onChange={(e) => {
                            const service = services.find(s => s.id === parseInt(e.target.value));
                            setSelectedService(service);
                        }}
                        style={{ width: '100%' }}
                        aria-label="Select service to monitor"
                    >
                        {services.map(service => (
                            <option key={service.id} value={service.id}>
                                {service.name} ({service.ip})
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ minWidth: '150px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.5rem'
                    }}>
                        Time Range
                    </label>
                    <select
                        className="input-field"
                        value={isLiveMode ? 'live' : dateRange}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'live') {
                                setIsLiveMode(true);
                                setDateRange('5m');
                            } else {
                                setIsLiveMode(false);
                                setDateRange(val);
                            }
                        }}
                        style={{ width: '100%' }}
                        aria-label="Select time range for metrics"
                    >
                        <option value="live">🔴 Live (Auto-refresh)</option>
                        <option disabled>─────────────────</option>
                        <option value="5m">Last 5 Minutes</option>
                        <option value="10m">Last 10 Minutes</option>
                        <option value="15m">Last 15 Minutes</option>
                        <option value="30m">Last 30 Minutes</option>
                        <option value="1h">Last 1 Hour</option>
                        <option value="3h">Last 3 Hours</option>
                        <option value="6h">Last 6 Hours</option>
                        <option value="12h">Last 12 Hours</option>
                        <option disabled>─────────────────</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={fetchHistory}
                    disabled={loading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '1.3rem',
                        position: 'relative'
                    }}
                >
                    <RefreshCw size={16} className={loading || isLiveMode ? 'spin' : ''} aria-hidden="true" />
                    {isLiveMode ? 'Live' : 'Refresh'}
                    {isLiveMode && (
                        <span style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '8px',
                            height: '8px',
                            background: '#ef4444',
                            borderRadius: '50%',
                            animation: 'pulse 2s infinite'
                        }} />
                    )}
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <Card style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }} aria-hidden="true">
                        Avg Response Time
                    </div>
                    <div
                        aria-label={`Average response time: ${stats.avg} milliseconds`}
                        style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                        {stats.avg} ms
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }} aria-hidden="true">
                        Min / Max
                    </div>
                    <div
                        aria-label={`Minimum response time ${stats.min} milliseconds, maximum ${stats.max} milliseconds`}
                        style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {stats.min} / {stats.max} ms
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }} aria-hidden="true">
                        Uptime
                    </div>
                    <div
                        role="status"
                        aria-label={`Uptime: ${stats.uptime} percent`}
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: stats.uptime >= 99 ? '#10b981' : stats.uptime >= 95 ? '#f59e0b' : '#ef4444'
                        }}>
                        {stats.uptime}%
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        Data Points
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {historyData.length}
                    </div>
                </Card>
            </div>

            {/* Response Time Chart */}
            <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0' }} id="response-chart-title">Response Time Trend</h3>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }} role="status" aria-live="polite">
                        Loading metrics...
                    </div>
                ) : chartData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No data available for the selected period
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                                dataKey="time"
                                stroke="var(--text-secondary)"
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                stroke="var(--text-secondary)"
                                tick={{ fontSize: 12 }}
                                label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="response_time"
                                stroke="var(--accent)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorResponse)"
                                name="Response Time (ms)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </Card>

            {/* Uptime Chart */}
            <Card style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Availability Status</h3>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        Loading metrics...
                    </div>
                ) : chartData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No data available for the selected period
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis
                                dataKey="time"
                                stroke="var(--text-secondary)"
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                stroke="var(--text-secondary)"
                                tick={{ fontSize: 12 }}
                                domain={[0, 100]}
                                ticks={[0, 100]}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px'
                                }}
                                formatter={(value) => [value === 100 ? 'Online' : 'Offline', 'Status']}
                            />
                            <Line
                                type="stepAfter"
                                dataKey="is_active"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                name="Status"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </Card>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
            `}</style>
        </div>
    );
};

export default Monitoring;
