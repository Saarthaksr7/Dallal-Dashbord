import React, { useState } from 'react';
import Card from '../ui/Card';
import { Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const BackupRestore = () => {
    const { token } = useAuthStore();
    const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: '' }
    const [isRestoring, setIsRestoring] = useState(false);

    const handleDownload = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/v1/backup/export', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dallal_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', msg: 'Backup download failed.' });
        }
    };

    const handleRestore = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm("WARNING: This will overwrite current configuration (Services, Keys, Webhooks). Continue?")) {
            event.target.value = null;
            return;
        }

        setIsRestoring(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/api/v1/backup/import', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                setStatus({ type: 'success', msg: 'Configuration restored successfully!' });
                // Ideally reload page after short delay to reflect changes
                setTimeout(() => window.location.reload(), 2000);
            } else {
                const err = await res.json();
                setStatus({ type: 'error', msg: err.detail || 'Restore failed.' });
            }
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', msg: 'Restore failed: Network error' });
        } finally {
            setIsRestoring(false);
            event.target.value = null;
        }
    };

    return (
        <div style={{ display: 'grid', gap: '2rem' }}>
            <Card title="Backup & Restore">
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Export your configuration to a JSON file or restore from an existing backup.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    {/* Export */}
                    <div style={{
                        background: 'var(--bg-primary)',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--glass-border)',
                        textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '1rem', color: 'var(--accent)' }}>
                            <Download size={48} strokeWidth={1.5} />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Export Configuration</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Download a snapshot of services, keys, webhooks, and settings.
                        </p>
                        <button className="btn-primary" onClick={handleDownload} style={{ width: '100%' }}>
                            Download Backup
                        </button>
                    </div>

                    {/* Import */}
                    <div style={{
                        background: 'var(--bg-primary)',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--glass-border)',
                        textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '1rem', color: '#ef4444' }}>
                            <Upload size={48} strokeWidth={1.5} />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>Restore Configuration</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Restore from a JSON file. This will overwrite existing data.
                        </p>
                        <label className="btn-secondary" style={{ display: 'block', width: '100%', cursor: 'pointer', textAlign: 'center' }}>
                            {isRestoring ? 'Restoring...' : 'Select File to Restore'}
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleRestore}
                                style={{ display: 'none' }}
                                disabled={isRestoring}
                            />
                        </label>
                    </div>
                </div>

                {status && (
                    <div style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${status.type === 'success' ? '#10b981' : '#ef4444'}`,
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        color: status.type === 'success' ? '#10b981' : '#ef4444'
                    }}>
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                        <span>{status.msg}</span>
                    </div>
                )}
            </Card>

            <style>{`
                .btn-primary {
                    background: var(--accent); color: white; border: none; padding: 0.75rem 1rem;
                    border-radius: 0.375rem; cursor: pointer; font-weight: 500; font-size: 0.95rem;
                }
                .btn-secondary {
                    background: transparent; color: var(--text-primary); border: 1px solid var(--glass-border);
                    padding: 0.75rem 1rem; border-radius: 0.375rem; cursor: pointer; font-size: 0.95rem;
                }
            `}</style>
        </div>
    );
};

export default BackupRestore;
