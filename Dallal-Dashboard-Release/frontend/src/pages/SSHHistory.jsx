import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { History, Search, Filter, Clock, User, Server, CheckCircle, XCircle, Copy, Trash2, Download } from 'lucide-react';

const SSHHistory = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterService, setFilterService] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [history, setHistory] = useState([]);
    const [clearModal, setClearModal] = useState(false);
    const [clearing, setClearing] = useState(false);

    // Load history from localStorage
    useEffect(() => {
        loadHistory();

        // Refresh history when page becomes visible (e.g., navigating back from SSH Console)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadHistory();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', loadHistory);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', loadHistory);
        };
    }, []);

    const loadHistory = () => {
        const saved = localStorage.getItem('commandHistory');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setHistory(parsed);
            } catch (e) {
                console.error('Failed to parse history:', e);
                setHistory([]);
            }
        } else {
            setHistory([]);
        }
    };

    const clearHistory = () => {
        setClearing(true);
        localStorage.setItem('commandHistory', JSON.stringify([]));
        setHistory([]);
        setClearing(false);
        setClearModal(false);
    };

    const copyCommand = (command) => {
        navigator.clipboard.writeText(command);
        alert('Command copied to clipboard!');
    };

    const exportHistory = () => {
        const dataStr = JSON.stringify(history, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `ssh_history_${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const formatTimeAgo = (timestamp) => {
        const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const uniqueServices = [...new Set(history.map(h => h.service).filter(s => s && s.trim()))];

    const filteredHistory = history.filter(item => {
        const command = item.command || '';
        const service = item.service || '';
        const matchesSearch = command.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesService = filterService === 'all' || service === filterService;
        const matchesStatus = filterStatus === 'all' || item.result === filterStatus;
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
                flexWrap: 'wrap',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
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
                            placeholder="Search commands, services..."
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

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={exportHistory}
                        disabled={history.length === 0}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#238636',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: history.length === 0 ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '14px'
                        }}
                    >
                        <Download size={16} />
                        Export
                    </button>
                    <button
                        onClick={() => setClearModal(true)}
                        disabled={history.length === 0}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: history.length === 0 ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '14px'
                        }}
                    >
                        <Trash2 size={16} />
                        Clear
                    </button>
                </div>
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
                        {history.length}
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <CheckCircle size={18} style={{ color: '#10b981' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Successful</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                        {history.filter(h => h.result === 'success').length}
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <XCircle size={18} style={{ color: '#ef4444' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Failed</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                        {history.filter(h => h.result === 'failed').length}
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
                                                background: item.result === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: item.result === 'success' ? '#10b981' : '#ef4444',
                                                border: `1px solid ${item.result === 'success' ? '#10b981' : '#ef4444'}`
                                            }}>
                                                {item.result || 'unknown'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {item.duration ? `${item.duration}s` : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Clear Confirmation Modal */}
            {clearModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'rgba(239, 68, 68, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Trash2 size={20} style={{ color: '#ef4444' }} />
                            </div>
                            <h3 style={{ margin: 0, color: '#ef4444' }}>Clear All History?</h3>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            This will permanently delete <strong style={{ color: 'white' }}>{history.length} command{history.length !== 1 ? 's' : ''}</strong> from your history.
                            This action cannot be undone.
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setClearModal(false)}
                                disabled={clearing}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    background: 'transparent',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={clearHistory}
                                disabled={clearing}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    background: '#ef4444',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: 'white',
                                    cursor: clearing ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {clearing ? (
                                    <>
                                        <span style={{
                                            width: '14px',
                                            height: '14px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTop: '2px solid white',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                        Clearing...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        Clear All
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default SSHHistory;
