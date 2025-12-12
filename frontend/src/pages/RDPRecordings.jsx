import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { Video, Download, Trash2, RefreshCw, Play, Clock, HardDrive } from 'lucide-react';
import { useRDPStore } from '../store/rdp';

const RDPRecordings = () => {
    const { t } = useTranslation();
    const {
        recordings,
        loading,
        error,
        fetchRecordings,
        deleteRecording,
        clearError
    } = useRDPStore();

    // Fetch recordings on mount
    useEffect(() => {
        fetchRecordings();
    }, [fetchRecordings]);

    const handleDelete = async (recording) => {
        if (!confirm(`Delete recording "${recording.name}"? This cannot be undone.`)) return;

        try {
            await deleteRecording(recording.id);
            alert('Recording deleted');
        } catch (err) {
            // Error already handled in store
        }
    };

    const formatFileSize = (mb) => {
        if (mb < 1) return `${(mb * 1024).toFixed(2)} KB`;
        if (mb < 1024) return `${mb.toFixed(2)} MB`;
        return `${(mb / 1024).toFixed(2)} GB`;
    };

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        }
        if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }
        return `${secs}s`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Video size={28} style={{ color: 'var(--accent)' }} />
                        <h1 style={{ margin: 0 }}>{t('rdp.recordings.title')}</h1>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={fetchRecordings}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                        Refresh
                    </button>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {t('rdp.recordings.subtitle')}
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <Card style={{ marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#ef4444' }}>{error}</span>
                        <button onClick={clearError} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.5rem' }}>
                            ×
                        </button>
                    </div>
                </Card>
            )}

            {/* Recordings Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'var(--accent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Video size={32} style={{ color: 'var(--accent)' }} />
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                                {recordings.length}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Total Recordings
                            </div>
                        </div>
                    </div>
                </Card>

                <Card style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <HardDrive size={32} style={{ color: '#10b981' }} />
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                {formatFileSize(recordings.reduce((sum, r) => sum + r.file_size_mb, 0))}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Total Size
                            </div>
                        </div>
                    </div>
                </Card>

                <Card style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Clock size={32} style={{ color: '#f59e0b' }} />
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                {formatDuration(recordings.reduce((sum, r) => sum + r.duration_seconds, 0))}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Total Duration
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Recordings List */}
            <h2 style={{ marginBottom: '1rem' }}>Recordings</h2>

            {recordings.length === 0 ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <Video size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p>No recordings yet</p>
                        <p style={{ fontSize: '0.85rem' }}>
                            Enable recording when creating an RDP session to save screen recordings
                        </p>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {recordings.map(recording => (
                        <Card key={recording.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                {/* Recording Info */}
                                <div style={{ flex: '1', minWidth: '250px' }}>
                                    <h3 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Video size={20} style={{ color: 'var(--accent)' }} />
                                        {recording.name}
                                    </h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Recorded:</span>
                                        <span>{formatDate(recording.recorded_at)}</span>

                                        <span style={{ color: 'var(--text-secondary)' }}>Duration:</span>
                                        <span>{formatDuration(recording.duration_seconds)}</span>

                                        <span style={{ color: 'var(--text-secondary)' }}>Size:</span>
                                        <span>{formatFileSize(recording.file_size_mb)}</span>

                                        <span style={{ color: 'var(--text-secondary)' }}>Resolution:</span>
                                        <span>{recording.resolution} @ {recording.fps} FPS</span>

                                        <span style={{ color: 'var(--text-secondary)' }}>Format:</span>
                                        <span>{recording.format.toUpperCase()} ({recording.codec})</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                    <button
                                        className="btn btn-primary"
                                        title="Play recording"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        onClick={() => alert('Playback feature coming soon!')}
                                    >
                                        <Play size={16} />
                                        Play
                                    </button>
                                    <button
                                        className="btn"
                                        title="Download recording"
                                        style={{
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            color: 'var(--accent)',
                                            border: '1px solid var(--accent)'
                                        }}
                                        onClick={() => alert('Download feature coming soon!')}
                                    >
                                        <Download size={16} />
                                    </button>
                                    <button
                                        className="btn"
                                        title="Delete recording"
                                        onClick={() => handleDelete(recording)}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid #ef4444'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
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

export default RDPRecordings;
