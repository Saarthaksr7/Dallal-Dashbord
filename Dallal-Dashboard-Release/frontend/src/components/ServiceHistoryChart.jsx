import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ServiceHistoryChart = ({ history }) => {
    // Transform data: ensure timestamp is formatted and sort ascending
    const data = [...history]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(item => ({
            ...item,
            time: new Date(item.timestamp).toLocaleTimeString(),
            latency: item.latency_ms
        }));

    if (data.length === 0) return <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No history data available yet.</div>;

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="time" hide />
                    <YAxis />
                    <Tooltip
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Area type="monotone" dataKey="latency" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLatency)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ServiceHistoryChart;
