import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { api } from '../lib/api';
import { Box, Play, Square, RotateCw, AlertTriangle, Activity, HardDrive, Terminal, Info } from 'lucide-react';

const Docker = () => {
    const { t } = useTranslation();
    const [containers, setContainers] = useState([]);
    const [dockerInfo, setDockerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLogs, setSelectedLogs] = useState(null);
    const [logs, setLogs] = useState('');

    const fetchDockerInfo = async () => {
        try {
            const res = await api.get('/docker/info');
            setDockerInfo(res.data);
        } catch (err) {
            console.error("Failed to fetch Docker info", err);
        }
    };

    const fetchContainers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/docker/containers');
            setContainers(res.data);
            setError(null);
            // Also fetch Docker info
            await fetchDockerInfo();
        } catch (err) {
            if (err.response && err.response.status === 503) {
                setError("Docker Engine is not running or not accessible.");
            } else {
                setError("Failed to fetch containers.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContainers();
        const interval = setInterval(fetchContainers, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const doAction = async (id, action) => {
        try {
            await api.post(`/docker/containers/${id}/${action}`);
            fetchContainers(); // Refresh immediately
        } catch (err) {
            console.error("Action failed", err);
            alert("Action failed: " + action);
        }
    };

    const viewLogs = async (id, name) => {
        try {
            const res = await api.get(`/docker/containers/${id}/logs?tail=200`);
            setLogs(res.data.logs || 'No logs available');
            setSelectedLogs(name);
        } catch (err) {
            setLogs('Failed to fetch logs');
            setSelectedLogs(name);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Box size={28} style={{ color: '#0ea5e9' }} />
                    <h1 style={{ margin: '0 0 0.5rem 0' }}>{t('docker.title')}</h1>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {t('docker.subtitle')}
                </p>
            </div>

            {/* Docker Daemon Status */}
            {dockerInfo && !error && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <Card style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Activity size={18} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                            Running
                        </div>
                    </Card>

                    <Card style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Box size={18} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Containers</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                            {dockerInfo.containers_running} / {dockerInfo.containers_total}
                        </div>
                    </Card>

                    <Card style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Info size={18} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Version</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                            {dockerInfo.server_version}
                        </div>
                    </Card>

                    <Card style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <HardDrive size={18} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>System</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                            {dockerInfo.cpus} CPUs / {formatBytes(dockerInfo.memory_total)}
                        </div>
                    </Card>
                </div>
            )}

            {error ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                        <h3>Docker Not Detected</h3>
                        <p>{error}</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                            Ensure Docker Desktop is running on the host machine.
                        </p>
                        <button className="btn btn-primary" onClick={fetchContainers} style={{ marginTop: '1rem' }}>
                            Retry
                        </button>
                    </div>
                </Card>
            ) : (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {loading && containers.length === 0 ? (
                            <p>Loading containers...</p>
                        ) : (
                            containers.map(c => (
                                <Card key={c.id} style={{ position: 'relative' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                                                {c.name.replace('/', '')}
                                            </h3>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-secondary)',
                                                fontFamily: 'monospace',
                                                wordBreak: 'break-all'
                                            }}>
                                                {c.image}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            background: c.status.startsWith('Up') || c.status === 'running'
                                                ? 'rgba(34, 197, 94, 0.15)'
                                                : 'rgba(239, 68, 68, 0.15)',
                                            color: c.status.startsWith('Up') || c.status === 'running'
                                                ? '#22c55e'
                                                : '#ef4444',
                                            border: `1px solid ${c.status.startsWith('Up') || c.status === 'running' ? '#22c55e' : '#ef4444'}`,
                                            textTransform: 'uppercase'
                                        }}>
                                            {c.status}
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '0.75rem',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '8px',
                                        marginBottom: '1rem',
                                        fontSize: '0.75rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Container ID:</span>
                                            <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{c.short_id}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Full ID:</span>
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontSize: '0.7rem',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '150px'
                                            }}>
                                                {c.id}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        borderTop: '1px solid var(--border)',
                                        paddingTop: '1rem'
                                    }}>
                                        <button
                                            className="btn"
                                            disabled={c.status.startsWith('Up') || c.status === 'running'}
                                            onClick={() => doAction(c.id, 'start')}
                                            title="Start Container"
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.3rem',
                                                background: (c.status.startsWith('Up') || c.status === 'running')
                                                    ? 'var(--bg-secondary)'
                                                    : 'rgba(34, 197, 94, 0.1)',
                                                color: (c.status.startsWith('Up') || c.status === 'running')
                                                    ? 'var(--text-secondary)'
                                                    : '#22c55e',
                                                border: '1px solid var(--border)',
                                                opacity: (c.status.startsWith('Up') || c.status === 'running') ? 0.5 : 1,
                                                cursor: (c.status.startsWith('Up') || c.status === 'running')
                                                    ? 'not-allowed'
                                                    : 'pointer'
                                            }}
                                        >
                                            <Play size={14} />
                                            <span>Start</span>
                                        </button>
                                        <button
                                            className="btn"
                                            disabled={!(c.status.startsWith('Up') || c.status === 'running')}
                                            onClick={() => doAction(c.id, 'stop')}
                                            title="Stop Container"
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.3rem',
                                                background: (c.status.startsWith('Up') || c.status === 'running')
                                                    ? 'rgba(239, 68, 68, 0.1)'
                                                    : 'var(--bg-secondary)',
                                                color: (c.status.startsWith('Up') || c.status === 'running')
                                                    ? '#ef4444'
                                                    : 'var(--text-secondary)',
                                                border: '1px solid var(--border)',
                                                opacity: (c.status.startsWith('Up') || c.status === 'running') ? 1 : 0.5,
                                                cursor: (c.status.startsWith('Up') || c.status === 'running')
                                                    ? 'pointer'
                                                    : 'not-allowed'
                                            }}
                                        >
                                            <Square size={14} />
                                            <span>Stop</span>
                                        </button>
                                        <button
                                            className="btn"
                                            onClick={() => doAction(c.id, 'restart')}
                                            title="Restart Container"
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.3rem',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                color: 'var(--accent)',
                                                border: '1px solid var(--border)'
                                            }}
                                        >
                                            <RotateCw size={14} />
                                            <span>Restart</span>
                                        </button>
                                    </div>

                                    <button
                                        className="btn"
                                        onClick={() => viewLogs(c.id, c.name.replace('/', ''))}
                                        style={{
                                            width: '100%',
                                            marginTop: '0.5rem',
                                            padding: '0.5rem',
                                            fontSize: '0.8rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.3rem',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border)'
                                        }}
                                    >
                                        <Terminal size={14} />
                                        <span>View Logs</span>
                                    </button>
                                </Card>
                            ))
                        )}
                        {!loading && containers.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                                <Box size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem' }} />
                                <p style={{ color: 'var(--text-secondary)' }}>No containers found</p>
                            </div>
                        )}
                    </div>

                    {/* Logs Modal */}
                    {selectedLogs && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '2rem'
                        }}
                            onClick={() => setSelectedLogs(null)}
                        >
                            <div
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    maxWidth: '900px',
                                    width: '100%',
                                    maxHeight: '80vh',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h3 style={{ margin: 0 }}>Container Logs: {selectedLogs}</h3>
                                    <button
                                        onClick={() => setSelectedLogs(null)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text-secondary)',
                                            fontSize: '1.5rem',
                                            cursor: 'pointer',
                                            padding: '0.25rem 0.5rem'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div style={{
                                    padding: '1rem',
                                    overflowY: 'auto',
                                    flex: 1,
                                    background: '#000',
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem',
                                    color: '#10b981',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all'
                                }}>
                                    {logs}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Docker;
