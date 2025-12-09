import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Folder, File, ArrowUp, Download, RefreshCw } from 'lucide-react';

const SFTPBrowser = ({ service }) => {
    const [path, setPath] = useState('/');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (service.id) fetchFiles(path);
    }, [service.id, path]);

    const fetchFiles = async (currentPath) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post(`/sftp/${service.id}/list`, {
                path: currentPath,
                # Optional: prompt for creds if not saved
                # username: service.ssh_username,
                # password: service.ssh_password
            });
            setFiles(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to list files. Check SSH credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (item) => {
        if (item.is_dir) {
            setPath(item.path);
        } else {
            // Download
            window.location.href = `http://localhost:8000/api/v1/sftp/${service.id}/download?path=${encodeURIComponent(item.path)}&username=${service.ssh_username || ''}&password=${service.ssh_password || ''}`;
        }
    };

    const goUp = () => {
        const parts = path.split('/').filter(p => p);
        parts.pop();
        setPath('/' + parts.join('/'));
    };

    return (
        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', minHeight: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <button className="btn small" onClick={goUp} disabled={path === '/'}><ArrowUp size={14} /></button>
                <div style={{ flex: 1, fontFamily: 'monospace', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '4px' }}>
                    {path}
                </div>
                <button className="btn small" onClick={() => fetchFiles(path)}><RefreshCw size={14} /></button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : error ? (
                <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {files.map(f => (
                        <li
                            key={f.name}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem',
                                cursor: 'pointer', borderBottom: '1px solid var(--border)',
                                ':hover': { background: 'rgba(255,255,255,0.05)' }
                            }}
                            onClick={() => handleNavigate(f)}
                        >
                            {f.is_dir ? <Folder size={16} color="#f59e0b" /> : <File size={16} color="#94a3b8" />}
                            <span style={{ flex: 1 }}>{f.name}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {f.is_dir ? '-' : (f.size / 1024).toFixed(1) + ' KB'}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SFTPBrowser;
