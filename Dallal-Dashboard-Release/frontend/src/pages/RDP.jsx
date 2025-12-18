import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { Monitor, Plus, Server, Settings, Download, Power, RefreshCw, Trash2, Edit, Check, X, Loader, Heart, Wifi, WifiOff, MonitorPlay } from 'lucide-react';
import { useRDPStore } from '../store/rdp';
import RDPViewer from '../components/rdp/RDPViewer';

// OS Icon Component
const OSIcon = ({ osType, size = 24 }) => {
    const icons = {
        windows: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
            </svg>
        ),
        linux: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.835-.41 1.719-.287 2.661.089.68.287 1.335.71 1.934 1.105 1.498 2.962 1.72 4.303 1.72.445 0 .908-.143 1.428-.332 2.27-.783 3.088-1.034 3.537-.126.571 1.149.904.633 1.67.705 1.185.111 1.996-.375 2.654-1.035.531-.535 1.107-1.107 1.654-1.647.178-.201.287-.287.287-.287l-.002-.002c-.78-.045-1.065-.45-1.065-.45-.78-.045-1.065-.45-1.065-.45-.045-1.5.105-2.002.406-2.547-.1.024-.203.04-.31.04-.531 0-1.081-.207-1.598-.656-.78-.653-1.153-1.425-1.103-2.231.033-.53.259-1.101.673-1.693.558-.809 1.385-1.58 2.46-2.291.758-.482 1.608-.898 2.507-1.228.805-.297 1.697-.537 2.638-.709z" />
            </svg>
        ),
        macos: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
        )
    };

    return <div style={{ display: 'inline-flex', color: 'var(--accent)' }}>{icons[osType] || icons.windows}</div>;
};

// Connection Profile Modal
const ConnectionProfileModal = ({ isOpen, onClose, onSave, editProfile = null }) => {
    const { testConnection } = useRDPStore();
    const [formData, setFormData] = useState({
        name: '',
        hostname: '',
        port: 3389,
        username: '',
        password: '',
        domain: '',
        os_icon: 'windows',
        resolution: '1920x1080',
        color_depth: 24,
        description: '',
        favorite: false
    });

    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        if (editProfile) {
            setFormData({
                name: editProfile.name || '',
                hostname: editProfile.hostname || '',
                port: editProfile.port || 3389,
                username: editProfile.username || '',
                password: '', // Don't populate password for security
                domain: editProfile.domain || '',
                os_icon: editProfile.os_icon || 'windows',
                resolution: editProfile.resolution || '1920x1080',
                color_depth: editProfile.color_depth || 24,
                description: editProfile.description || '',
                favorite: editProfile.favorite || false
            });
        } else {
            // Reset form for new profile
            setFormData({
                name: '',
                hostname: '',
                port: 3389,
                username: '',
                password: '',
                domain: '',
                os_icon: 'windows',
                resolution: '1920x1080',
                color_depth: 24,
                description: '',
                favorite: false
            });
        }
        setTestResult(null);
    }, [editProfile, isOpen]);

    const handleTestConnection = async () => {
        if (!formData.hostname) {
            setTestResult({ is_reachable: false, message: 'Please enter a hostname' });
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const result = await testConnection(formData.hostname, formData.port);
            setTestResult(result);
        } catch (error) {
            setTestResult({ is_reachable: false, message: 'Connection test failed' });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = () => {
        if (!formData.name || !formData.hostname || !formData.username) {
            alert('Please fill in required fields');
            return;
        }

        // Only include password if it was actually entered (for edit mode)
        const saveData = { ...formData };
        if (editProfile && !formData.password) {
            delete saveData.password; // Don't update password if not changed
        }

        onSave(saveData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }} onClick={onClose}>
            <Card style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>{editProfile ? 'Edit Connection' : 'New RDP Connection'}</h2>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Connection Name *
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Production Server"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Hostname / IP Address *
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.hostname}
                                onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                                placeholder="192.168.1.100 or server.local"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Port
                            </label>
                            <input
                                type="number"
                                className="input-field"
                                value={formData.port}
                                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Test Connection Button */}
                    <div>
                        <button
                            className="btn"
                            onClick={handleTestConnection}
                            disabled={testing || !formData.hostname}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: testResult?.is_reachable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: testResult?.is_reachable ? '#10b981' : 'var(--accent)',
                                border: `1px solid ${testResult?.is_reachable ? '#10b981' : 'var(--accent)'}`
                            }}
                        >
                            {testing ? <Loader size={16} className="spin" /> : testResult?.is_reachable ? <Check size={16} /> : <Wifi size={16} />}
                            {testing ? 'Testing...' : testResult ? (testResult.is_reachable ? 'Connection Successful!' : 'Connection Failed') : 'Test Connection'}
                        </button>
                        {testResult && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: testResult.is_reachable ? '#10b981' : '#ef4444' }}>
                                {testResult.message}
                                {testResult.response_time_ms && ` (${testResult.response_time_ms.toFixed(0)}ms)`}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Username *
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="Administrator"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Domain (optional)
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.domain}
                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                placeholder="CORP"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Password * {editProfile && <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>(leave blank to keep current)</span>}
                        </label>
                        <input
                            type="password"
                            className="input-field"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={editProfile ? "Enter new password to change" : "Enter password"}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Operating System
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['windows', 'linux', 'macos'].map(os => (
                                <label key={os} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1rem',
                                    border: `2px solid ${formData.os_icon === os ? 'var(--accent)' : 'var(--border)'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: formData.os_icon === os ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                }}>
                                    <input
                                        type="radio"
                                        name="os"
                                        value={os}
                                        checked={formData.os_icon === os}
                                        onChange={(e) => setFormData({ ...formData, os_icon: e.target.value })}
                                        style={{ display: 'none' }}
                                    />
                                    <OSIcon osType={os} size={20} />
                                    <span style={{ textTransform: 'capitalize' }}>{os}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Resolution
                            </label>
                            <select
                                className="input-field"
                                value={formData.resolution}
                                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                            >
                                <option value="1920x1080">1920 × 1080 (Full HD)</option>
                                <option value="2560x1440">2560 × 1440 (QHD)</option>
                                <option value="1366x768">1366 × 768</option>
                                <option value="1280x720">1280 × 720 (HD)</option>
                                <option value="1024x768">1024 × 768</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Color Depth
                            </label>
                            <select
                                className="input-field"
                                value={formData.color_depth}
                                onChange={(e) => setFormData({ ...formData, color_depth: parseInt(e.target.value) })}
                            >
                                <option value="32">32-bit (True Color)</option>
                                <option value="24">24-bit</option>
                                <option value="16">16-bit (High Color)</option>
                                <option value="8">8-bit (256 Colors)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Description (optional)
                        </label>
                        <textarea
                            className="input-field"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Notes about this connection..."
                            rows={2}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.favorite}
                                onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
                            />
                            <Heart size={16} fill={formData.favorite ? 'currentColor' : 'none'} />
                            <span>Mark as Favorite</span>
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        {editProfile ? 'Update' : 'Create'} Connection
                    </button>
                </div>
            </Card>
        </div>
    );
};

const RDP = () => {
    const { t } = useTranslation();
    const {
        profiles,
        loading,
        error,
        fetchProfiles,
        createProfile,
        updateProfile,
        deleteProfile,
        checkProfileStatus,
        downloadRDPFile,
        clearError
    } = useRDPStore();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [checkingStatus, setCheckingStatus] = useState({});
    const [viewerProfile, setViewerProfile] = useState(null); // For web-based RDP viewer

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    // Auto-refresh status every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            profiles.forEach(profile => {
                checkProfileStatus(profile.id);
            });
        }, 30000);

        return () => clearInterval(interval);
    }, [profiles, checkProfileStatus]);

    const handleCreateProfile = async (profileData) => {
        try {
            await createProfile(profileData);
        } catch (error) {
            // Error already handled in store
        }
    };

    const handleUpdateProfile = async (profileData) => {
        try {
            await updateProfile(editingProfile.id, profileData);
            setEditingProfile(null);
        } catch (error) {
            // Error already handled in store
        }
    };

    const handleDeleteProfile = async (profile) => {
        if (!confirm(`Delete connection "${profile.name}"? This cannot be undone.`)) return;

        try {
            await deleteProfile(profile.id);
        } catch (error) {
            // Error already handled in store
        }
    };

    const handleDownloadRDP = async (profile) => {
        try {
            await downloadRDPFile(profile.id, false); // Don't include password by default
        } catch (error) {
            // Error already handled in store
        }
    };

    const handleWebConnect = (profile) => {
        setViewerProfile(profile);
    };

    const handleRefreshStatus = async (profileId) => {
        setCheckingStatus(prev => ({ ...prev, [profileId]: true }));
        try {
            await checkProfileStatus(profileId);
        } finally {
            setCheckingStatus(prev => ({ ...prev, [profileId]: false }));
        }
    };

    const getStatusIcon = (profile) => {
        if (checkingStatus[profile.id]) {
            return <Loader size={16} className="spin" style={{ color: 'var(--accent)' }} />;
        }

        if (profile.is_online === null) {
            return <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6b7280' }} />;
        }

        return profile.is_online ?
            <Wifi size={16} style={{ color: '#10b981' }} /> :
            <WifiOff size={16} style={{ color: '#ef4444' }} />;
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Monitor size={28} style={{ color: 'var(--accent)' }} />
                        <h1 style={{ margin: 0 }}>RDP Connections</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={fetchProfiles}
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <RefreshCw size={16} className={loading ? 'spin' : ''} />
                            Refresh
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => setModalOpen(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={16} />
                            Add Connection
                        </button>
                    </div>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    Manage your Remote Desktop connections
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <Card style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ef4444' }}>{error}</span>
                        <X size={20} style={{ cursor: 'pointer', color: '#ef4444' }} onClick={clearError} />
                    </div>
                </Card>
            )}

            {/* Profiles Grid */}
            {profiles.length === 0 ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <Monitor size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p>No RDP connections yet. Click "Add Connection" to get started!</p>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                    {profiles.map(profile => (
                        <Card key={profile.id} style={{ position: 'relative' }}>
                            {profile.favorite && (
                                <Heart
                                    size={16}
                                    fill="#ef4444"
                                    style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#ef4444' }}
                                />
                            )}

                            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1rem', gap: '0.75rem' }}>
                                <OSIcon osType={profile.os_icon} size={32} />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 0.25rem 0' }}>{profile.name}</h3>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                        {profile.hostname}:{profile.port}
                                    </div>
                                    {profile.description && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                            {profile.description}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>User:</span>
                                    <span style={{ fontFamily: 'monospace' }}>{profile.domain ? `${profile.domain}\\` : ''}{profile.username}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Resolution:</span>
                                    <span>{profile.resolution}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                        onClick={() => handleRefreshStatus(profile.id)}
                                        title="Click to refresh status"
                                    >
                                        {getStatusIcon(profile)}
                                        <span style={{ fontSize: '0.8rem' }}>
                                            {profile.is_online === null ? 'Unknown' : profile.is_online ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleDownloadRDP(profile)}
                                    style={{ flex: '1 1 45%', justifyContent: 'center', fontSize: '0.85rem' }}
                                    title="Download .rdp file for native RDP client"
                                >
                                    <Download size={14} style={{ marginRight: '0.25rem' }} />
                                    RDP File
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => handleWebConnect(profile)}
                                    style={{
                                        flex: '1 1 45%',
                                        justifyContent: 'center',
                                        fontSize: '0.85rem',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981',
                                        border: '1px solid #10b981'
                                    }}
                                    title="Connect via web browser (experimental)"
                                >
                                    <MonitorPlay size={14} style={{ marginRight: '0.25rem' }} />
                                    Web
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setEditingProfile(profile);
                                        setModalOpen(true);
                                    }}
                                    style={{
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        color: 'var(--accent)',
                                        border: '1px solid var(--accent)',
                                        fontSize: '0.85rem',
                                        padding: '0.5rem'
                                    }}
                                    title="Edit connection"
                                >
                                    <Edit size={14} />
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => handleDeleteProfile(profile)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: '1px solid #ef4444',
                                        fontSize: '0.85rem',
                                        padding: '0.5rem'
                                    }}
                                    title="Delete connection"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Connection Profile Modal */}
            <ConnectionProfileModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingProfile(null);
                }}
                onSave={editingProfile ? handleUpdateProfile : handleCreateProfile}
                editProfile={editingProfile}
            />

            {/* Web-Based RDP Viewer */}
            {viewerProfile && (
                <RDPViewer
                    profile={viewerProfile}
                    onClose={() => setViewerProfile(null)}
                />
            )}

            <style>{`
@keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
}
                .spin {
    animation: spin 1s linear infinite;
}
`}</style>
        </div>
    );
};

export default RDP;
