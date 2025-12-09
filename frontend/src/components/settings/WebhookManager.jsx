import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { Webhook, Trash2, Plus, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const WebhookManager = () => {
    const { token } = useAuthStore();
    const [webhooks, setWebhooks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        secret: '',
        events: ['status_change'],
        active: true
    });

    const fetchWebhooks = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/v1/webhooks/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWebhooks(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWebhooks();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this webhook?')) return;
        try {
            await fetch(`http://localhost:8000/api/v1/webhooks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchWebhooks();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8000/api/v1/webhooks/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowForm(false);
                setFormData({ name: '', url: '', secret: '', events: ['status_change'], active: true });
                fetchWebhooks();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ display: 'grid', gap: '2rem' }}>
            <Card title="Webhooks">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Configure URLs to receive event notifications.</p>
                    <button
                        className="btn-primary"
                        onClick={() => setShowForm(!showForm)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={18} />
                        Add Webhook
                    </button>
                </div>

                {showForm && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>New Webhook</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '600px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Discord Alerts"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Payload URL</label>
                                <input
                                    type="url"
                                    required
                                    className="input-field"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Secret (Optional)</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.secret}
                                    onChange={e => setFormData({ ...formData, secret: e.target.value })}
                                    placeholder="Signing secret"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="submit" className="btn-primary">Save Webhook</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {webhooks.map(wh => (
                        <div key={wh.id} style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem', color: '#10b981' }}>
                                    <Webhook size={20} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h4 style={{ margin: 0 }}>{wh.name}</h4>
                                        {wh.active ?
                                            <span style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '2px 6px', borderRadius: '4px' }}>ACTIVE</span>
                                            :
                                            <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>INACTIVE</span>
                                        }
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        {wh.url}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(wh.id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}

                    {!isLoading && webhooks.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', border: '2px dashed var(--glass-border)', borderRadius: '0.5rem' }}>
                            <Webhook size={32} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No webhooks configured.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default WebhookManager;
