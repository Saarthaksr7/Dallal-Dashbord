import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ResourceHistoryChart = ({ history }) => {
    // History array contains { timestamp, cpu_usage, ram_usage, disk_usage }
    // We need to reverse it usually if fetching desc? assuming passed in correct order or sort it.
    // Usually API returns latest first. We should reverse for chart (old -> new).

    const data = [...history].reverse().map(item => ({
        time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cpu: item.cpu_usage,
        ram: item.ram_usage,
        disk: item.disk_usage
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <XAxis dataKey="time" stroke="#6b7280" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '0.75rem' }} domain={[0, 100]} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
                <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} name="CPU %" />
                <Line type="monotone" dataKey="ram" stroke="#10b981" strokeWidth={2} dot={false} name="RAM %" />
                <Line type="monotone" dataKey="disk" stroke="#f59e0b" strokeWidth={2} dot={false} name="Disk %" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default ResourceHistoryChart;
