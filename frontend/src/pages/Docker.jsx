import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { api } from '../lib/api';
import { useUIStore } from '../store/ui';
import {
    Box, Play, Square, RotateCw, AlertTriangle, Activity,
    HardDrive, Terminal, Info, ExternalLink, Clock, Loader2,
    RefreshCw, Wifi, WifiOff, Trash2, ArrowDownToLine, X,
    Plus, AlertCircle, Package
} from 'lucide-react';

const Docker = () => {
    const { t } = useTranslation();
    const { addToast } = useUIStore();

    const [containers, setContainers] = useState([]);
    const [dockerInfo, setDockerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Logs modal state
    const [selectedContainer, setSelectedContainer] = useState(null);
    const [logs, setLogs] = useState('');
    const [wsStatus, setWsStatus] = useState('disconnected');
    const [autoScroll, setAutoScroll] = useState(true);

    // Quick Run modal state
    const [showRunModal, setShowRunModal] = useState(false);
    const [runForm, setRunForm] = useState({
        image: '',
        name: '',
        ports: [{ container: '', host: '' }]
    });
    const [runLoading, setRunLoading] = useState(false);

    // Prune confirmation state
    const [showPruneConfirm, setShowPruneConfirm] = useState(false);
    const [pruneLoading, setPruneLoading] = useState(false);

    // WebSocket refs
    const wsRef = useRef(null);
    const logsEndRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttempts = useRef(0);

    // Track loading state per container action
    const [actionLoading, setActionLoading] = useState({});

    const fetchDockerInfo = async () => {
        try {
            const res = await api.get('/docker/info');
            setDockerInfo(res.data);
        } catch (err) {
            console.error("Failed to fetch Docker info", err);
        }
    };

    const fetchContainers = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await api.get('/docker/containers');
            setContainers(res.data);
            setError(null);
            await fetchDockerInfo();
        } catch (err) {
            if (err.response && err.response.status === 503) {
                setError("Docker Engine is not running or not accessible.");
            } else {
                setError("Failed to fetch containers.");
            }
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContainers();
        const interval = setInterval(() => fetchContainers(false), 5000);
        return () => clearInterval(interval);
    }, [fetchContainers]);

    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoScroll]);

    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, []);

    // ============= Quick Run Functions =============
    const handleRunFormChange = (field, value) => {
        setRunForm(prev => ({ ...prev, [field]: value }));
    };

    const handlePortChange = (index, field, value) => {
        setRunForm(prev => {
            const newPorts = [...prev.ports];
            newPorts[index] = { ...newPorts[index], [field]: value };
            return { ...prev, ports: newPorts };
        });
    };

    const addPortMapping = () => {
        setRunForm(prev => ({
            ...prev,
            ports: [...prev.ports, { container: '', host: '' }]
        }));
    };

    const removePortMapping = (index) => {
        setRunForm(prev => ({
            ...prev,
            ports: prev.ports.filter((_, i) => i !== index)
        }));
    };

    const handleRunContainer = async () => {
        if (!runForm.image.trim()) {
            addToast('Image name is required', 'error');
            return;
        }

        setRunLoading(true);
        try {
            // Build ports object
            const ports = {};
            runForm.ports.forEach(p => {
                if (p.container && p.host) {
                    const containerPort = p.container.includes('/') ? p.container : `${p.container}/tcp`;
                    ports[containerPort] = p.host;
                }
            });

            const payload = {
                image: runForm.image.trim(),
                name: runForm.name.trim() || undefined,
                ports: Object.keys(ports).length > 0 ? ports : undefined,
                detach: true
            };

            const res = await api.post('/docker/run', payload);
            addToast(res.data.message, 'success');
            setShowRunModal(false);
            setRunForm({ image: '', name: '', ports: [{ container: '', host: '' }] });
            await fetchContainers(false);
        } catch (err) {
            const message = err.response?.data?.detail || 'Failed to run container';
            addToast(message, 'error');
        } finally {
            setRunLoading(false);
        }
    };

    // ============= Prune Functions =============
    const handlePrune = async () => {
        setPruneLoading(true);
        try {
            const res = await api.post('/docker/prune');
            addToast(res.data.message, 'success');
            setShowPruneConfirm(false);
            await fetchContainers(false);
        } catch (err) {
            const message = err.response?.data?.detail || 'System prune failed';
            addToast(message, 'error');
        } finally {
            setPruneLoading(false);
        }
    };

    // ============= WebSocket Functions =============
    const connectWebSocket = useCallback((containerId) => {
        if (wsRef.current) wsRef.current.close();

        setWsStatus('connecting');
        reconnectAttempts.current = 0;

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.hostname;
        const wsPort = '8000';
        const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}/api/v1/docker/ws/logs/${containerId}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setWsStatus('connected');
            reconnectAttempts.current = 0;
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'log') {
                    setLogs(prev => prev + data.data);
                } else if (data.type === 'status' && data.status === 'connected') {
                    setWsStatus('connected');
                } else if (data.type === 'error') {
                    addToast(data.message, 'error');
                } else if (data.type === 'ping') {
                    ws.send(JSON.stringify({ command: 'ping' }));
                }
            } catch (e) {
                setLogs(prev => prev + event.data);
            }
        };

        ws.onerror = () => setWsStatus('error');

        ws.onclose = () => {
            setWsStatus('disconnected');
            if (selectedContainer && reconnectAttempts.current < 3) {
                reconnectAttempts.current++;
                setWsStatus('connecting');
                reconnectTimeoutRef.current = setTimeout(() => {
                    connectWebSocket(containerId);
                }, 2000 * reconnectAttempts.current);
            }
        };
    }, [selectedContainer, addToast]);

    const openLogsModal = (container) => {
        setSelectedContainer(container);
        setLogs('');
        setAutoScroll(true);
        connectWebSocket(container.id);
    };

    const closeLogsModal = () => {
        if (wsRef.current) wsRef.current.close();
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        setSelectedContainer(null);
        setLogs('');
        setWsStatus('disconnected');
    };

    const clearLogs = () => {
        setLogs('');
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ command: 'clear' }));
        }
    };

    // ============= Container Actions =============
    const doAction = async (id, action) => {
        const actionKey = `${id}-${action}`;
        setActionLoading(prev => ({ ...prev, [actionKey]: true }));

        try {
            const res = await api.post(`/docker/containers/${id}/${action}`);
            addToast(res.data.message || `Container ${action} successful`, 'success');
            await fetchContainers(false);
        } catch (err) {
            const message = err.response?.data?.detail || `Failed to ${action} container`;
            addToast(message, 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [actionKey]: false }));
        }
    };

    // ============= Utility Functions =============
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (isoString) => {
        if (!isoString) return 'Unknown';
        try {
            return new Date(isoString).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return isoString;
        }
    };

    const isRunning = (status) => status === 'running' || status.startsWith('Up');

    const renderPorts = (ports) => {
        if (!ports || Object.keys(ports).length === 0) {
            return <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>No ports</span>;
        }
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {Object.entries(ports).map(([containerPort, hostPort]) => {
                    if (!hostPort) return null;
                    return (
                        <a
                            key={containerPort}
                            href={`http://localhost:${hostPort}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                                padding: '0.15rem 0.4rem', background: 'rgba(59, 130, 246, 0.15)',
                                color: 'var(--accent)', borderRadius: '4px', fontSize: '0.7rem',
                                fontFamily: 'monospace', textDecoration: 'none',
                                border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}
                            title={`Open localhost:${hostPort}`}
                        >
                            :{hostPort}
                            <ExternalLink size={10} />
                        </a>
                    );
                })}
            </div>
        );
    };

    const getWsStatusColor = () => {
        switch (wsStatus) {
            case 'connected': return '#10b981';
            case 'connecting': return '#f59e0b';
            case 'error': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getWsStatusIcon = () => {
        switch (wsStatus) {
            case 'connected': return <Wifi size={14} />;
            case 'connecting': return <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />;
            default: return <WifiOff size={14} />;
        }
    };

    // ============= Action Button Component =============
    const ActionButton = ({ onClick, disabled, loading, icon: Icon, label, variant }) => {
        const variants = {
            start: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
            stop: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
            restart: { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)' }
        };
        const style = variants[variant] || variants.restart;
        const isDisabled = disabled || loading;

        return (
            <button
                className="btn"
                disabled={isDisabled}
                onClick={onClick}
                title={`${label} Container`}
                style={{
                    flex: 1, padding: '0.5rem', fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                    background: isDisabled ? 'var(--bg-secondary)' : style.bg,
                    color: isDisabled ? 'var(--text-secondary)' : style.color,
                    border: '1px solid var(--border)',
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon size={14} />}
                <span>{label}</span>
            </button>
        );
    };

    return (
        <div>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Box size={28} style={{ color: '#0ea5e9' }} />
                        <h1 style={{ margin: '0 0 0.5rem 0' }}>{t('docker.title')}</h1>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('docker.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        className="btn"
                        onClick={() => setShowRunModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
                            background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e'
                        }}
                    >
                        <Plus size={16} />
                        New Container
                    </button>
                    <button
                        className="btn"
                        onClick={() => setShowPruneConfirm(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444'
                        }}
                    >
                        <Trash2 size={16} />
                        Prune System
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => fetchContainers()}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                    >
                        <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Docker Status Cards */}
            {dockerInfo && !error && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <Card style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Activity size={18} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>Running</div>
                    </Card>
                    <Card style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Box size={18} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Containers</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                            <span style={{ color: '#10b981' }}>{dockerInfo.containers_running}</span>
                            <span style={{ color: 'var(--text-secondary)' }}> / {dockerInfo.containers_total}</span>
                        </div>
                    </Card>
                    <Card style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Info size={18} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Version</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{dockerInfo.server_version}</div>
                    </Card>
                    <Card style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <HardDrive size={18} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>System</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{dockerInfo.cpus} CPUs / {formatBytes(dockerInfo.memory_total)}</div>
                    </Card>
                </div>
            )}

            {/* Error State */}
            {error ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                        <h3>Docker Not Detected</h3>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={fetchContainers} style={{ marginTop: '1rem' }}>Retry</button>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Container Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
                        {loading && containers.length === 0 ? (
                            [...Array(3)].map((_, i) => (
                                <Card key={i} style={{ padding: '1.5rem' }}>
                                    <div style={{ background: 'var(--bg-secondary)', height: '24px', width: '60%', borderRadius: '4px', marginBottom: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
                                    <div style={{ background: 'var(--bg-secondary)', height: '16px', width: '80%', borderRadius: '4px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                                </Card>
                            ))
                        ) : (
                            containers.map(c => {
                                const running = isRunning(c.status);
                                return (
                                    <Card key={c.id} style={{ position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>{c.name}</h3>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{c.image}</div>
                                            </div>
                                            <div style={{
                                                padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold',
                                                background: running ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: running ? '#22c55e' : '#ef4444',
                                                border: `1px solid ${running ? '#22c55e' : '#ef4444'}`, textTransform: 'uppercase'
                                            }}>{c.status}</div>
                                        </div>
                                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '6px', marginBottom: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ports:</span>
                                                {renderPorts(c.ports)}
                                            </div>
                                        </div>
                                        <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Container ID:</span>
                                                <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{c.short_id}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> Created:</span>
                                                <span style={{ fontSize: '0.7rem' }}>{formatDate(c.created)}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                            <ActionButton variant="start" icon={Play} label="Start" disabled={running} loading={actionLoading[`${c.id}-start`]} onClick={() => doAction(c.id, 'start')} />
                                            <ActionButton variant="stop" icon={Square} label="Stop" disabled={!running} loading={actionLoading[`${c.id}-stop`]} onClick={() => doAction(c.id, 'stop')} />
                                            <ActionButton variant="restart" icon={RotateCw} label="Restart" disabled={false} loading={actionLoading[`${c.id}-restart`]} onClick={() => doAction(c.id, 'restart')} />
                                        </div>
                                        <button className="btn" onClick={() => openLogsModal(c)} style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                            <Terminal size={14} /><span>Live Logs</span>
                                        </button>
                                    </Card>
                                );
                            })
                        )}
                        {!loading && containers.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                                <Box size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem' }} />
                                <p style={{ color: 'var(--text-secondary)' }}>No containers found</p>
                                <button className="btn btn-primary" onClick={() => setShowRunModal(true)} style={{ marginTop: '1rem' }}>
                                    <Plus size={16} style={{ marginRight: '0.5rem' }} />
                                    Create your first container
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Run Modal */}
                    {showRunModal && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }} onClick={() => setShowRunModal(false)}>
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Package size={20} /> New Container</h3>
                                    <button onClick={() => setShowRunModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}><X size={20} /></button>
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Image *</label>
                                        <input type="text" value={runForm.image} onChange={e => handleRunFormChange('image', e.target.value)} placeholder="e.g., nginx:latest" style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
                                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Image will be pulled from Docker Hub if not available locally</small>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Container Name</label>
                                        <input type="text" value={runForm.name} onChange={e => handleRunFormChange('name', e.target.value)} placeholder="my-container (optional)" style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Port Mappings</label>
                                        {runForm.ports.map((port, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                <input type="text" value={port.host} onChange={e => handlePortChange(idx, 'host', e.target.value)} placeholder="Host port" style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                                                <span style={{ color: 'var(--text-secondary)' }}>→</span>
                                                <input type="text" value={port.container} onChange={e => handlePortChange(idx, 'container', e.target.value)} placeholder="Container port" style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                                                {runForm.ports.length > 1 && (
                                                    <button onClick={() => removePortMapping(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}><X size={16} /></button>
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={addPortMapping} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.25rem 0' }}>+ Add port mapping</button>
                                    </div>
                                    <button className="btn btn-primary" onClick={handleRunContainer} disabled={runLoading || !runForm.image.trim()} style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        {runLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={16} />}
                                        {runLoading ? 'Creating...' : 'Pull & Run'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prune Confirmation Modal */}
                    {showPruneConfirm && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }} onClick={() => setShowPruneConfirm(false)}>
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', maxWidth: '450px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <AlertCircle size={24} style={{ color: '#ef4444' }} />
                                    <h3 style={{ margin: 0 }}>Confirm System Prune</h3>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                    This will permanently remove:
                                </p>
                                <ul style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                                    <li>All stopped containers</li>
                                    <li>All unused networks</li>
                                    <li>All dangling images</li>
                                </ul>
                                <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                    ⚠️ This action cannot be undone!
                                </p>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button className="btn" onClick={() => setShowPruneConfirm(false)} style={{ flex: 1, padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>Cancel</button>
                                    <button className="btn" onClick={handlePrune} disabled={pruneLoading} style={{ flex: 1, padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        {pruneLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                                        {pruneLoading ? 'Cleaning...' : 'Prune System'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Live Logs Modal */}
                    {selectedContainer && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }} onClick={closeLogsModal}>
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', maxWidth: '1000px', width: '100%', height: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Terminal size={20} />{selectedContainer.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '500', background: `${getWsStatusColor()}20`, color: getWsStatusColor(), border: `1px solid ${getWsStatusColor()}40` }}>
                                            {getWsStatusIcon()}<span style={{ textTransform: 'capitalize' }}>{wsStatus}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button className="btn" onClick={() => setAutoScroll(!autoScroll)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: autoScroll ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-secondary)', color: autoScroll ? 'var(--accent)' : 'var(--text-secondary)', border: '1px solid var(--border)' }}><ArrowDownToLine size={14} />Auto-scroll</button>
                                        <button className="btn" onClick={clearLogs} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}><Trash2 size={14} />Clear</button>
                                        <button onClick={closeLogsModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}><X size={20} /></button>
                                    </div>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#0a0a0a', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: '1.5', color: '#d4d4d4', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {wsStatus === 'connecting' && !logs && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Connecting to log stream...</div>}
                                    {wsStatus === 'error' && !logs && <div style={{ color: '#ef4444' }}>Failed to connect to log stream.</div>}
                                    {logs || (wsStatus === 'connected' && !logs && <div style={{ color: '#6b7280' }}>Waiting for logs...</div>)}
                                    <div ref={logsEndRef} />
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
