import React, { useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import { api } from '../lib/api';
import { Box, Play, Square, RotateCw, AlertTriangle } from 'lucide-react';

const Docker = () => {
    const [containers, setContainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchContainers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/docker/containers');
            setContainers(res.data);
            setError(null);
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

    return (
        <div className="fade-in" style={{ padding: '1rem' }}>
            <h1 className="page-title">
                <Box style={{ marginRight: '0.75rem', color: '#0ea5e9' }} />
                Local Docker Containers
            </h1>

            {error ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
                        <h3>Docker Not Detected</h3>
                        <p>{error}</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
                            Ensure Docker Desktop is running on the host machine.
                        </p>
                        <button className="btn secondary" onClick={fetchContainers} style={{ marginTop: '1rem' }}>Retry</button>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {loading && containers.length === 0 ? (
                        <p>Loading containers...</p>
                    ) : (
                        containers.map(c => (
                            <Card key={c.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{c.name.replace('/', '')}</h3>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{c.image}</div>
                                    </div>
                                    <div style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                        background: c.status.startsWith('Up') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: c.status.startsWith('Up') ? '#22c55e' : '#ef4444'
                                    }}>
                                        {c.status}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                                    <button
                                        className="btn small" disabled={c.status.startsWith('Up')}
                                        onClick={() => doAction(c.id, 'start')}
                                        title="Start"
                                    >
                                        <Play size={14} />
                                    </button>
                                    <button
                                        className="btn small" disabled={!c.status.startsWith('Up')}
                                        onClick={() => doAction(c.id, 'stop')}
                                        title="Stop"
                                    >
                                        <Square size={14} />
                                    </button>
                                    <button
                                        className="btn small"
                                        onClick={() => doAction(c.id, 'restart')}
                                        title="Restart"
                                    >
                                        <RotateCw size={14} />
                                    </button>
                                </div>
                            </Card>
                        ))
                    )}
                    {!loading && containers.length === 0 && (
                        <p>No containers found.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Docker;
