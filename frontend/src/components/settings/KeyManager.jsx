import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { Key, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import { api } from '../../lib/api';

const KeyManager = () => {
    const [keys, setKeys] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'ssh_password',
        value: '',
        description: ''
    });

    const fetchKeys = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/keys/');
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
        if (!window.confirm('Are you sure you want to delete this key?')) return;
        try {
            await api.delete(`/keys/${id}`);
            fetchKeys();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/keys/', formData);
            setShowForm(false);
            setFormData({ name: '', type: 'ssh_password', value: '', description: '' });
            fetchKeys();
        } catch (error) {
            console.error(error);
        }
    };

    const [masterKey, setMasterKey] = useState(null);
    const [showMasterKey, setShowMasterKey] = useState(false);

    const toggleMasterKey = async () => {
        if (showMasterKey) {
            setShowMasterKey(false);
            return;
        }

        if (masterKey) {
            setShowMasterKey(true);
            return;
        }

        try {
            const res = await api.get('/auth/master-key');
            setMasterKey(res.data.key);
            setShowMasterKey(true);
        } catch (error) {
            console.error(error);
            alert("Failed to retrieve master key. " + (error.response?.data?.detail || "Ensure you are a superuser."));
        }
    };

    return (
        <div style={{ display: 'grid', gap: '2rem' }}>
            <Card title="Encryption Master Key">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            This key is used to encrypt all sensitive data (passwords, API keys) in the database.
                        </p>
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '0.75rem',
                            borderRadius: '0.375rem',
                            fontFamily: 'monospace',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            minWidth: '300px'
                        }}>
                            <Key size={16} style={{ color: 'var(--accent)' }} />
                            <span style={{ flex: 1 }}>
                                {showMasterKey ? masterKey : '••••••••••••••••••••••••••••••••'}
                            </span>
                            <button
                                onClick={toggleMasterKey}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                                {showMasterKey ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Secure Keys">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage SSH keys, API tokens, and passwords securely.</p>
                    <button
                        className="btn-primary"
                        onClick={() => setShowForm(!showForm)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={18} />
                        Add Key
                    </button>
                </div>

                {showForm && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>New Key</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: '500px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Prod Server Key"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Type</label>
                                <select
                                    className="input-field"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="ssh_password">SSH Password</option>
                                    <option value="ssh_key">SSH Private Key</option>
                                    <option value="api_token">API Token</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Value</label>
                                <textarea
                                    required
                                    className="input-field"
                                    rows={4}
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    placeholder="Paste private key or password here..."
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="submit" className="btn-primary">Save Key</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {keys.map(key => (
                        <div key={key.id} style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', color: '#3b82f6' }}>
                                        <Key size={20} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{key.name}</h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                                            {key.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(key.id)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace' }}>
                                {key.fingerprint || '********'}
                            </div>

                            {key.description && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    {key.description}
                                </p>
                            )}
                        </div>
                    ))}

                    {!isLoading && keys.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', border: '2px dashed var(--glass-border)', borderRadius: '0.5rem' }}>
                            <Key size={32} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No keys found. Add one to get started.</p>
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
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};

export default KeyManager;
