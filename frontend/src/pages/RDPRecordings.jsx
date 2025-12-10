import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/ui/Card';
import { Video, Play, Download, Trash2, Search, Calendar, Server, Clock } from 'lucide-react';

const RDPRecordings = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterService, setFilterService] = useState('all');
    const [selectedRecording, setSelectedRecording] = useState(null);

    // Mock recordings data
    const mockRecordings = [
        {
            id: 'rec-001',
            session: 'Windows Server 2019 - Administrator',
            service: 'Windows Server 2019',
            serviceIp: '192.168.1.50',
            user: 'Administrator',
            startTime: '2024-12-09 14:30:00',
            duration: '1h 23m',
            durationSeconds: 4980,
            fileSize: '245 MB',
            resolution: '1920x1080',
            status: 'available'
        },
        {
            id: 'rec-002',
            session: 'Development Desktop - admin',
            service: 'Development Desktop',
            serviceIp: '192.168.1.55',
            user: 'admin',
            startTime: '2024-12-09 10:15:00',
            duration: '45m',
            durationSeconds: 2700,
            fileSize: '128 MB',
            resolution: '1366x768',
            status: 'available'
        },
        {
            id: 'rec-003',
            session: 'Production Server - sysadmin',
            service: 'Production Server',
            serviceIp: '192.168.1.100',
            user: 'sysadmin',
            startTime: '2024-12-08 16:45:00',
            duration: '2h 10m',
            durationSeconds: 7800,
            fileSize: '380 MB',
            resolution: '1920x1080',
            status: 'available'
        },
        {
            id: 'rec-004',
            session: 'Database Server - dbadmin',
            service: 'Database Server',
            serviceIp: '192.168.1.75',
            user: 'dbadmin',
            startTime: '2024-12-08 09:20:00',
            duration: '30m',
            durationSeconds: 1800,
            fileSize: '85 MB',
            resolution: '1280x720',
            status: 'available'
        },
        {
            id: 'rec-005',
            session: 'Domain Controller - admin',
            service: 'Domain Controller',
            serviceIp: '192.168.1.10',
            user: 'admin',
            startTime: '2024-12-07 13:00:00',
            duration: '1h 05m',
            durationSeconds: 3900,
            fileSize: '195 MB',
            resolution: '1920x1080',
            status: 'available'
        }
    ];

    const uniqueServices = [...new Set(mockRecordings.map(r => r.service))];

    const filteredRecordings = mockRecordings.filter(rec => {
        const matchesSearch = rec.session.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rec.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
            rec.user.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesService = filterService === 'all' || rec.service === filterService;
        return matchesSearch && matchesService;
    });

    const handlePlay = (recording) => {
        console.log('Play recording:', recording.id);
        // In production: Open video player modal
        setSelectedRecording(recording);
    };

    const handleDownload = (recording) => {
        console.log('Download recording:', recording.id);
        // In production: Trigger download
    };

    const handleDelete = (recording) => {
        if (confirm(`Delete recording "${recording.session}"?`)) {
            console.log('Delete recording:', recording.id);
            // In production: Call delete API
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <Video size={28} style={{ color: 'var(--accent)' }} />
                    <h1 style={{ margin: 0 }}>{t('rdp.recordings.title')}</h1>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {t('rdp.recordings.subtitle')}
                </p>
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                    <Search size={18} style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-secondary)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search recordings..."
                        className="input-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>

                <select
                    className="input-field"
                    value={filterService}
                    onChange={(e) => setFilterService(e.target.value)}
                    style={{ minWidth: '200px' }}
                >
                    <option value="all">All Services</option>
                    {uniqueServices.map(service => (
                        <option key={service} value={service}>{service}</option>
                    ))}
                </select>
            </div>

            {/* Summary Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Video size={18} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Recordings</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {mockRecordings.length}
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Clock size={18} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Duration</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {Math.floor(mockRecordings.reduce((sum, r) => sum + r.durationSeconds, 0) / 3600)}h {Math.floor((mockRecordings.reduce((sum, r) => sum + r.durationSeconds, 0) % 3600) / 60)}m
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Server size={18} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Services</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {uniqueServices.length}
                    </div>
                </Card>

                <Card style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Download size={18} style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Storage Used</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        1.03 GB
                    </div>
                </Card>
            </div>

            {/* Recordings Table */}
            <Card>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Session
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Service
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Date & Time
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Duration
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Size
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecordings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <Video size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                        <p>No recordings match your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRecordings.map(recording => (
                                    <tr
                                        key={recording.id}
                                        style={{
                                            borderBottom: '1px solid var(--border)',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                            <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                                {recording.user}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                ID: {recording.id}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                            <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                                {recording.service}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                {recording.serviceIp}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                                                <span>{formatDate(recording.startTime)}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem' }}>
                                                {formatTime(recording.startTime)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                                                <span>{recording.duration}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {recording.fileSize}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn"
                                                    onClick={() => handlePlay(recording)}
                                                    style={{
                                                        padding: '0.4rem 0.75rem',
                                                        fontSize: '0.8rem',
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        color: '#10b981',
                                                        border: '1px solid #10b981'
                                                    }}
                                                    title="Play"
                                                >
                                                    <Play size={14} />
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={() => handleDownload(recording)}
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
                                                <button
                                                    className="btn"
                                                    onClick={() => handleDelete(recording)}
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Playback Modal (Placeholder) */}
            {selectedRecording && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}
                    onClick={() => setSelectedRecording(null)}
                >
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '600px',
                        textAlign: 'center'
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Video size={64} style={{ margin: '0 auto 1rem', color: 'var(--accent)' }} />
                        <h2 style={{ marginTop: 0 }}>Video Playback</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Video player integration coming soon!
                        </p>
                        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Recording: <strong>{selectedRecording.session}</strong><br />
                            Duration: {selectedRecording.duration}
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => setSelectedRecording(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RDPRecordings;
