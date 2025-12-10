import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { FolderOpen, File, Folder, Download, Trash2, Edit, ChevronRight, Home, Server, Lock } from 'lucide-react';
import { useServicesStore } from '../store/services';

const SFTPBrowser = () => {
    const { t } = useTranslation();
    const services = useServicesStore((state) => state.services);
    const [selectedService, setSelectedService] = useState(null);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [connected, setConnected] = useState(false);
    const [currentPath, setCurrentPath] = useState('/home');
    const [files, setFiles] = useState([]);

    // Mock file data for demonstration
    const mockFiles = [
        { name: '..', type: 'directory', size: '-', modified: '-', permissions: 'drwxr-xr-x' },
        { name: 'documents', type: 'directory', size: '-', modified: '2024-12-01 14:30', permissions: 'drwxr-xr-x' },
        { name: 'projects', type: 'directory', size: '-', modified: '2024-12-05 09:15', permissions: 'drwxr-xr-x' },
        { name: 'backups', type: 'directory', size: '-', modified: '2024-11-28 18:45', permissions: 'drwxr-xr-x' },
        { name: 'config.json', type: 'file', size: '2.4 KB', modified: '2024-12-09 11:20', permissions: '-rw-r--r--' },
        { name: 'server.log', type: 'file', size: '145 MB', modified: '2024-12-10 04:00', permissions: '-rw-r--r--' },
        { name: 'deploy.sh', type: 'file', size: '1.2 KB', modified: '2024-12-08 16:30', permissions: '-rwxr-xr-x' },
        { name: 'README.md', type: 'file', size: '3.8 KB', modified: '2024-12-07 10:15', permissions: '-rw-r--r--' },
        { name: '.env', type: 'file', size: '512 B', modified: '2024-12-06 13:45', permissions: '-rw-------' }
    ];

    const handleConnect = () => {
        if (!selectedService || !credentials.username || !credentials.password) return;

        // In production: Call SFTP API
        setConnected(true);
        setFiles(mockFiles);
    };

    const handleNavigate = (folderName) => {
        if (folderName === '..') {
            const parts = currentPath.split('/').filter(p => p);
            parts.pop();
            setCurrentPath('/' + parts.join('/'));
        } else {
            setCurrentPath(currentPath.endsWith('/') ? currentPath + folderName : currentPath + '/' + folderName);
        }
        // In production: Fetch new directory contents
    };

    const handleDownload = (filename) => {
        console.log('Download:', filename);
        // In production: Call download API
    };

    const handleDelete = (filename) => {
        if (confirm(`Delete ${filename}?`)) {
            console.log('Delete:', filename);
            // In production: Call delete API
        }
    };

    const getPathParts = () => {
        return currentPath.split('/').filter(p => p);
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <FolderOpen size={28} style={{ color: 'var(--accent)' }} />
                    <h1 style={{ margin: 0 }}>{t('ssh.sftp.title')}</h1>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {t('ssh.sftp.subtitle')}
                </p>
            </div>

            {!connected ? (
                <div style={{ maxWidth: '500px', margin: 'auto' }}>
                    <Card>
                        <h3 style={{ marginTop: 0 }}>Connect to Server</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Server
                            </label>
                            <select
                                className="input-field"
                                value={selectedService?.id || ''}
                                onChange={(e) => {
                                    const service = services.find(s => s.id === parseInt(e.target.value));
                                    setSelectedService(service);
                                }}
                            >
                                <option value="">Select a service...</option>
                                {services.map(service => (
                                    <option key={service.id} value={service.id}>
                                        {service.name} ({service.ip})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Username
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                value={credentials.username}
                                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                placeholder="Enter username"
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                className="input-field"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                placeholder="Enter password"
                                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                            />
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleConnect}
                            disabled={!selectedService || !credentials.username || !credentials.password}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            <Lock size={16} style={{ marginRight: '0.5rem' }} />
                            Connect
                        </button>
                    </Card>
                </div>
            ) : (
                <>
                    {/* Connection Info Bar */}
                    <Card style={{ marginBottom: '1rem', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Server size={18} style={{ color: 'var(--accent)' }} />
                                    <span style={{ fontWeight: '500' }}>{selectedService?.name}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                    {selectedService?.ip}
                                </div>
                                <div style={{
                                    padding: '0.25rem 0.75rem',
                                    background: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    border: '1px solid #10b981'
                                }}>
                                    CONNECTED
                                </div>
                            </div>
                            <button
                                className="btn"
                                onClick={() => {
                                    setConnected(false);
                                    setFiles([]);
                                    setCurrentPath('/home');
                                }}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid #ef4444'
                                }}
                            >
                                Disconnect
                            </button>
                        </div>
                    </Card>

                    {/* Breadcrumb Navigation */}
                    <Card style={{ marginBottom: '1rem', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Home
                                size={18}
                                style={{ color: 'var(--accent)', cursor: 'pointer' }}
                                onClick={() => setCurrentPath('/home')}
                            />
                            {getPathParts().map((part, index) => (
                                <React.Fragment key={index}>
                                    <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
                                    <span
                                        style={{
                                            cursor: 'pointer',
                                            color: index === getPathParts().length - 1 ? 'var(--text-primary)' : 'var(--accent)',
                                            fontWeight: index === getPathParts().length - 1 ? '600' : '400'
                                        }}
                                        onClick={() => {
                                            const newPath = '/' + getPathParts().slice(0, index + 1).join('/');
                                            setCurrentPath(newPath);
                                        }}
                                    >
                                        {part}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>

                    {/* File List */}
                    <Card>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                            Name
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                            Size
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                            Modified
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                            Permissions
                                        </th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {files.map((file, index) => (
                                        <tr
                                            key={index}
                                            style={{
                                                borderBottom: '1px solid var(--border)',
                                                cursor: file.type === 'directory' ? 'pointer' : 'default',
                                                transition: 'background 0.2s'
                                            }}
                                            onClick={() => file.type === 'directory' && handleNavigate(file.name)}
                                            onMouseEnter={(e) => {
                                                if (file.type === 'directory') {
                                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                                                }
                                            }}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {file.type === 'directory' ? (
                                                        <Folder size={20} style={{ color: 'var(--accent)' }} />
                                                    ) : (
                                                        <File size={20} style={{ color: 'var(--text-secondary)' }} />
                                                    )}
                                                    <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                                        {file.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {file.size}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {file.modified}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                                {file.permissions}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                {file.name !== '..' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        {file.type === 'file' && (
                                                            <button
                                                                className="btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownload(file.name);
                                                                }}
                                                                style={{
                                                                    padding: '0.4rem 0.75rem',
                                                                    fontSize: '0.8rem',
                                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                                    color: 'var(--accent)',
                                                                    border: '1px solid var(--accent)'
                                                                }}
                                                                title="Download"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(file.name);
                                                            }}
                                                            style={{
                                                                padding: '0.4rem 0.75rem',
                                                                fontSize: '0.8rem',
                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                color: '#ef4444',
                                                                border: '1px solid #ef4444'
                                                            }}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div >
    );
};

export default SFTPBrowser;
