import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { History, Search, Filter, Clock, User, Server, CheckCircle, XCircle } from 'lucide-react';

const SSHHistory = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterService, setFilterService] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // Mock command history data
    const mockHistory = [
        {
            id: 1,
            timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
            service: 'Web Server',
            serviceIp: '192.168.1.10',
            user: 'admin',
            command: 'systemctl restart nginx',
            status: 'success',
            duration: 2.3,
            output: 'Service restarted successfully'
        },
        {
            id: 2,
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            service: 'Database Server',
            serviceIp: '192.168.1.20',
            user: 'root',
            command: 'docker-compose up -d',
            status: 'success',
            duration: 5.7,
            output: 'Containers started'
        },
        {
            id: 3,
            timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
            service: 'Web Server',
            serviceIp: '192.168.1.10',
            user: 'admin',
            command: 'tail -f /var/log/nginx/error.log',
            status: 'success',
            duration: 0.1,
            output: 'Log viewing session'
        },
        {
            id: 4,
            timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
            service: 'Application Server',
            serviceIp: '192.168.1.30',
            user: 'deploy',
            command: 'npm install',
            status: 'failed',
            duration: 12.4,
            output: 'Permission denied'
        },
        {
            id: 5,
            timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
            service: 'Database Server',
            serviceIp: '192.168.1.20',
            user: 'root',
            command: 'pg_dump mydb > backup.sql',
            status: 'success',
            duration: 45.2,
            output: 'Database backup completed'
        },
        {
            id: 6,
            timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
            service: 'Web Server',
            serviceIp: '192.168.1.10',
            user: 'admin',
            command: 'df -h',
            status: 'success',
            duration: 0.2,
            output: 'Disk usage check'
        },
        {
            id: 7,
            timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
            service: 'Application Server',
            serviceIp: '192.168.1.30',
            user: 'deploy',
            command: 'git pull origin main',
            status: 'success',
            duration: 3.1,
            output: 'Updated to latest version'
        },
        {
            id: 8,
            timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
            service: 'Database Server',
            serviceIp: '192.168.1.20',
            user: 'postgres',
            command: 'psql -c "SELECT * FROM users LIMIT 10;"',
            status: 'success',
            duration: 1.2,
            output: 'Query executed'
        }
    ];

    const formatTimeAgo = (timestamp) => {
        const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const uniqueServices = [...new Set(mockHistory.map(h => h.service))];

    const filteredHistory = mockHistory.filter(item => {
        const matchesSearch = item.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.user.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesService = filterService === 'all' || item.service === filterService;
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        return matchesSearch && matchesService && matchesStatus;
    });

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <History size={28} style={{ color: 'var(--accent)' }} />
                    <h1 style={{ margin: 0 }}>{t('ssh.history.title')}</h1>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {t('ssh.history.subtitle')}
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
                        placeholder="Search commands, services, users..."
                        className="input-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>

                <select
                    className="input-field"
                    value={filterService}
                    onChange={(e) => setFilterService(e.target.value)}
                    style={{ minWidth: '200px' }}
                >
                    <option value="all">All Services</option>
                    {uniqueServices.map(service => (
                        <option key={service} value={service}>{service}</option>
                    ))}
                </select>

                <select
                    className="input-field"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ minWidth: '150px' }}
                >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
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
                        <History size={18} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Commands</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {mockHistory.length}
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <CheckCircle size={18} style={{ color: '#10b981' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Successful</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                        {mockHistory.filter(h => h.status === 'success').length}
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <XCircle size={18} style={{ color: '#ef4444' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Failed</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                        {mockHistory.filter(h => h.status === 'failed').length}
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Server size={18} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Services</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {uniqueServices.length}
                    </div>
                </Card>
            </div>

            {/* History Table */}
            <Card>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Time
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Service
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    User
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Command
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Status
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Duration
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <History size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                        <p>No commands match your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        style={{
                                            borderBottom: '1px solid var(--border)',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                                                <span title={new Date(item.timestamp).toLocaleString()}>
                                                    {formatTimeAgo(item.timestamp)}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                            <div style={{ fontWeight: '500' }}>{item.service}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                {item.serviceIp}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <User size={14} style={{ color: 'var(--text-secondary)' }} />
                                                <span style={{ fontFamily: 'monospace' }}>{item.user}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', fontFamily: 'monospace', maxWidth: '400px' }}>
                                            <div style={{
                                                background: 'rgba(0, 0, 0, 0.3)',
                                                padding: '0.5rem',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                                title={item.command}
                                            >
                                                {item.command}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                background: item.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: item.status === 'success' ? '#10b981' : '#ef4444',
                                                border: `1px solid ${item.status === 'success' ? '#10b981' : '#ef4444'}`
                                            }}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {item.duration}s
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default SSHHistory;
