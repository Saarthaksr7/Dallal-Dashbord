import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { Key, Trash2, Plus, Copy, Check, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { api } from '../../lib/api';

const ApiKeyManager = () => {
    const [keys, setKeys] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [newKeyData, setNewKeyData] = useState(null); // { key: '...', ... }

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        scopes: '',
        expires_in_days: ''
    });

    const fetchKeys = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/api-keys/');
            setKeys(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to revoke this API key? Applications using it will lose access immediately.')) return;
        try {
            await api.delete(`/api-keys/${id}`);
            fetchKeys();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                scopes: formData.scopes,
                expires_in_days: formData.expires_in_days ? parseInt(formData.expires_in_days) : null
            };
            const res = await api.post('/api-keys/', null, { params: payload });

            // Show the New Key Modal
            setNewKeyData(res.data);

            setShowForm(false);
            setFormData({ name: '', scopes: '', expires_in_days: '' });
            fetchKeys();
        } catch (error) {
            console.error(error);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Could show toast
    };

    return (
        <div style={{ display: 'grid', gap: '2rem' }}>
            <Card title="API Access Keys">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage API Keys for external scripts and automation.</p>
                    <button
                        className="btn-primary"
                        onClick={() => setShowForm(!showForm)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={18} />
                        Generate Key
                    </button>
                </div>

                {showForm && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Generate New API Key</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. CI/CD Pipeline"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Expiration (Days) - Optional</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={formData.expires_in_days}
                                    onChange={e => setFormData({ ...formData, expires_in_days: e.target.value })}
                                    placeholder="Leave empty for no expiry"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="submit" className="btn-primary">Generate</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* New Key Modal / Alert */}
                {newKeyData && (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid #10b981',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        marginBottom: '2rem',
                        position: 'relative'
                    }}>
                        <h3 style={{ color: '#10b981', marginTop: 0 }}>API Key Generated</h3>
                        <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Please copy your API key now. <strong>You will not be able to see it again.</strong>
                        </p>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                readOnly
                                value={newKeyData.key}
                                style={{ flex: 1, fontFamily: 'monospace', padding: '0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '0.375rem', color: 'var(--text-primary)' }}
                            />
                            <button
                                onClick={() => copyToClipboard(newKeyData.key)}
                                className="btn-secondary"
                                title="Copy"
                            >
                                <Copy size={18} />
                            </button>
                        </div>
                        <button
                            onClick={() => setNewKeyData(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                            x
                        </button>
                    </div>
                )}

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {keys.map(key => (
                        <div key={key.id} style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.5rem', color: '#8b5cf6' }}>
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h4 style={{ margin: 0 }}>{key.name}</h4>
                                        <span style={{ fontSize: '0.75rem', background: 'var(--bg-secondary)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                                            {key.key_prefix}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                        Created: {new Date(key.created_at).toLocaleDateString()}
                                        {key.last_used && ` • Last Used: ${new Date(key.last_used).toLocaleDateString()}`}
                                        {key.expires_at && ` • Expires: ${new Date(key.expires_at).toLocaleDateString()}`}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(key.id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                                title="Revoke"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    {!isLoading && keys.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No API keys found.
                        </div>
                    )}
                </div>
            </Card>

            <style>{`
                .input-field {
                    width: 100%;
                    padding: 0.75rem;
                    background: var(--bg-primary);
                    border: 1px solid var(--glass-border);
                    border-radius: 0.375rem;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                }
                .input-field:focus {
                    outline: none;
                    border-color: var(--accent);
                }
                .btn-primary {
                    background: var(--accent);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    font-weight: 500;
                }
                 .btn-secondary {
                    background: transparent;
                    color: var(--text-primary);
                    border: 1px solid var(--glass-border);
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default ApiKeyManager;
