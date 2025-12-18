import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { saveAs } from 'file-saver';
import Card from '../components/ui/Card';
import { FolderOpen, File, Folder, Download, Trash2, Upload, ChevronRight, Home, Server, Lock, RefreshCw, Loader2, ArrowUp, AlertCircle, X } from 'lucide-react';
import { useServicesStore } from '../store/services';
import { api, BASE_URL } from '../lib/api';
import { useAuthStore } from '../store/auth';

const SFTPBrowser = () => {
    const { t } = useTranslation();
    const services = useServicesStore((state) => state.services);
    const token = useAuthStore((state) => state.token);
    const [selectedService, setSelectedService] = useState(null);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [connected, setConnected] = useState(false);
    const [currentPath, setCurrentPath] = useState('/');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
    const [deleting, setDeleting] = useState(false);
    const fileInputRef = useRef(null);

    // Store credentials for session to avoid re-entering
    const [sessionCredentials, setSessionCredentials] = useState(null);

    const fetchFiles = async (path, creds = sessionCredentials) => {
        if (!selectedService || !creds) return;

        setLoading(true);
        setError(null);

        try {
            const res = await api.post(`/sftp/${selectedService.id}/list`, {
                path: path,
                username: creds.username,
                password: creds.password
            });

            setFiles(res.data);
            setCurrentPath(path);
        } catch (err) {
            console.error('SFTP Error:', err);
            const errorMsg = err.response?.data?.detail || 'Failed to list files';
            setError(errorMsg);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!selectedService || !credentials.username || !credentials.password) return;

        setLoading(true);
        setError(null);

        try {
            // Try to list root directory to verify connection
            const res = await api.post(`/sftp/${selectedService.id}/list`, {
                path: '/',
                username: credentials.username,
                password: credentials.password
            });

            setSessionCredentials(credentials);
            setConnected(true);
            setFiles(res.data);
            setCurrentPath('/');
        } catch (err) {
            console.error('Connection Error:', err);
            const errorMsg = err.response?.data?.detail || 'Failed to connect';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (item) => {
        if (item.is_dir) {
            fetchFiles(item.path);
        }
    };

    const goUp = () => {
        const parts = currentPath.split('/').filter(p => p);
        if (parts.length > 0) {
            parts.pop();
            const newPath = '/' + parts.join('/');
            fetchFiles(newPath || '/');
        }
    };

    const handleDownload = async (item) => {
        if (!sessionCredentials) return;

        setDownloading(item.name);
        setError(null);

        try {
            // Build URL with params
            const params = new URLSearchParams({
                path: item.path,
                username: sessionCredentials.username,
                password: sessionCredentials.password
            });

            // Use native fetch instead of axios
            const response = await fetch(`${BASE_URL}/api/v1/sftp/${selectedService.id}/download?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();

            // Use file-saver with the blob
            saveAs(blob, item.name);
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download file');
        } finally {
            setDownloading(null);
        }
    };

    const openDeleteModal = (item) => {
        setDeleteModal({ open: true, item });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ open: false, item: null });
    };

    const handleDelete = async () => {
        if (!sessionCredentials || !deleteModal.item) return;

        setDeleting(true);

        try {
            await api.post(`/sftp/${selectedService.id}/delete`, {
                path: deleteModal.item.path,
                username: sessionCredentials.username,
                password: sessionCredentials.password
            });
            // Refresh file list
            fetchFiles(currentPath);
            closeDeleteModal();
        } catch (err) {
            console.error('Delete Error:', err);
            setError(err.response?.data?.detail || 'Failed to delete');
        } finally {
            setDeleting(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !sessionCredentials) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', currentPath);
            formData.append('username', sessionCredentials.username);
            formData.append('password', sessionCredentials.password);

            await api.post(`/sftp/${selectedService.id}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Refresh file list
            fetchFiles(currentPath);
        } catch (err) {
            console.error('Upload Error:', err);
            setError(err.response?.data?.detail || 'Failed to upload');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDisconnect = () => {
        setConnected(false);
        setFiles([]);
        setCurrentPath('/');
        setSessionCredentials(null);
        setError(null);
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '-';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        return new Date(timestamp * 1000).toLocaleString();
    };

    const formatPermissions = (mode) => {
        // Convert numeric mode to readable permissions
        if (!mode) return '-';
        const modeNum = parseInt(mode);
        const types = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
        const owner = types[(modeNum >> 6) & 7];
        const group = types[(modeNum >> 3) & 7];
        const others = types[modeNum & 7];
        return owner + group + others;
    };

    const getPathParts = () => {
        return currentPath.split('/').filter(p => p);
    };

    // Delete Confirmation Modal Component
    const DeleteModal = () => {
        if (!deleteModal.open) return null;

        return (
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
                zIndex: 1000
            }}>
                <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    maxWidth: '400px',
                    width: '90%',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                    border: '1px solid var(--border)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Trash2 size={20} />
                            Confirm Delete
                        </h3>
                        <button
                            onClick={closeDeleteModal}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '0.25rem'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
                            Are you sure you want to delete this {deleteModal.item?.is_dir ? 'folder' : 'file'}?
                        </p>
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontFamily: 'monospace'
                        }}>
                            {deleteModal.item?.is_dir ? (
                                <Folder size={18} style={{ color: 'var(--accent)' }} />
                            ) : (
                                <File size={18} style={{ color: 'var(--text-secondary)' }} />
                            )}
                            <span style={{ wordBreak: 'break-all' }}>{deleteModal.item?.name}</span>
                        </div>
                        {deleteModal.item?.is_dir && (
                            <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#f59e0b' }}>
                                ⚠️ This will delete all contents inside the folder
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button
                            className="btn"
                            onClick={closeDeleteModal}
                            disabled={deleting}
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn"
                            onClick={handleDelete}
                            disabled={deleting}
                            style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                border: '1px solid #ef4444'
                            }}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 size={16} className="spinning" style={{ marginRight: '0.5rem' }} />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <DeleteModal />

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

                        {error && (
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid #ef4444',
                                borderRadius: '8px',
                                color: '#ef4444',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

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
                                    setError(null);
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
                            disabled={!selectedService || !credentials.username || !credentials.password || loading}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} style={{ marginRight: '0.5rem', animation: 'spin 1s linear infinite' }} />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Lock size={16} style={{ marginRight: '0.5rem' }} />
                                    Connect
                                </>
                            )}
                        </button>
                    </Card>
                </div>
            ) : (
                <>
                    {/* Connection Info Bar */}
                    <Card style={{ marginBottom: '1rem', padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleUpload}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className="btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    style={{
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        color: 'var(--accent)',
                                        border: '1px solid var(--accent)'
                                    }}
                                >
                                    {uploading ? <Loader2 size={16} className="spinning" /> : <Upload size={16} />}
                                    <span style={{ marginLeft: '0.5rem' }}>Upload</span>
                                </button>
                                <button
                                    className="btn"
                                    onClick={handleDisconnect}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: '1px solid #ef4444'
                                    }}
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Breadcrumb Navigation */}
                    <Card style={{ marginBottom: '1rem', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                                className="btn"
                                onClick={goUp}
                                disabled={currentPath === '/' || loading}
                                style={{ padding: '0.4rem 0.6rem' }}
                                title="Go up"
                            >
                                <ArrowUp size={16} />
                            </button>
                            <button
                                className="btn"
                                onClick={() => fetchFiles(currentPath)}
                                disabled={loading}
                                style={{ padding: '0.4rem 0.6rem' }}
                                title="Refresh"
                            >
                                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, marginLeft: '0.5rem' }}>
                                <Home
                                    size={18}
                                    style={{ color: 'var(--accent)', cursor: 'pointer' }}
                                    onClick={() => fetchFiles('/')}
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
                                                fetchFiles(newPath);
                                            }}
                                        >
                                            {part}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Error Display */}
                    {error && (
                        <Card style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        </Card>
                    )}

                    {/* File List */}
                    <Card>
                        <div style={{ overflowX: 'auto' }}>
                            {loading ? (
                                <div style={{ padding: '3rem', textAlign: 'center' }}>
                                    <Loader2 size={32} className="spinning" style={{ color: 'var(--accent)' }} />
                                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading files...</p>
                                </div>
                            ) : files.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <Folder size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p>This directory is empty</p>
                                </div>
                            ) : (
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
                                                    cursor: file.is_dir ? 'pointer' : 'default',
                                                    transition: 'background 0.2s'
                                                }}
                                                onClick={() => handleNavigate(file)}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                                                }}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        {file.is_dir ? (
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
                                                    {file.is_dir ? '-' : formatSize(file.size)}
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {formatDate(file.modify_time)}
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                                                    {formatPermissions(file.permissions)}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        {!file.is_dir && (
                                                            <button
                                                                className="btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownload(file);
                                                                }}
                                                                disabled={downloading === file.name}
                                                                style={{
                                                                    padding: '0.4rem 0.75rem',
                                                                    fontSize: '0.8rem',
                                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                                    color: 'var(--accent)',
                                                                    border: '1px solid var(--accent)'
                                                                }}
                                                                title="Download"
                                                            >
                                                                {downloading === file.name ? (
                                                                    <Loader2 size={14} className="spinning" />
                                                                ) : (
                                                                    <Download size={14} />
                                                                )}
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDeleteModal(file);
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
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                </>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spinning {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default SFTPBrowser;
