import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { Activity, User, Clock, Terminal } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const AuditLogViewer = () => {
    const { token } = useAuthStore();
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/v1/audit/?limit=50', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleString();
    };

    return (
        <Card title="Activity Logs">
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Timestamp</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>User</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Action</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    {formatDate(log.timestamp)}
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={14} style={{ opacity: 0.7 }} />
                                        {log.username}
                                    </div>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span style={{
                                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                                        background: 'var(--bg-secondary)', fontWeight: 500
                                    }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {!isLoading && logs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No activity found.
                    </div>
                )}
            </div>
        </Card>
    );
};

export default AuditLogViewer;
