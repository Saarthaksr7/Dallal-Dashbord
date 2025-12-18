import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Card from '../components/ui/Card';
import { BookmarkIcon, Trash2, Play, Search, Clock, Server } from 'lucide-react';
import ConfirmDeleteModal from '../components/ssh/ConfirmDeleteModal';

const SavedSSH = () => {
    const [, setLocation] = useLocation();
    const [sessions, setSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('recent'); // recent, name, service
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState(null);

    useEffect(() => {
        loadSessions();
    }, []);

    // Filter and sort when dependencies change
    useEffect(() => {
        let filtered = [...sessions];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(session =>
                session.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                session.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                session.connectionDetails?.host?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.timestamp) - new Date(a.timestamp);
            } else if (sortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            } else if (sortBy === 'service') {
                const aService = a.service?.name || a.connectionDetails?.host || '';
                const bService = b.service?.name || b.connectionDetails?.host || '';
                return aService.localeCompare(bService);
            }
            return 0;
        });

        setFilteredSessions(filtered);
    }, [sessions, searchTerm, sortBy]);

    const loadSessions = () => {
        const saved = JSON.parse(localStorage.getItem('sshSessions') || '[]');
        setSessions(saved);
    };

    const openDeleteModal = (session) => {
        setSessionToDelete(session);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (sessionToDelete) {
            const updated = sessions.filter(s => s.id !== sessionToDelete.id);
            localStorage.setItem('sshSessions', JSON.stringify(updated));
            setSessions(updated);
        }
        setDeleteModalOpen(false);
        setSessionToDelete(null);
    };

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setSessionToDelete(null);
    };

    const restoreSession = (session) => {
        // Navigate to appropriate SSH page and pass session data
        if (session.service) {
            // From SSH Console
            setLocation(`/ssh/console?restore=${session.id}`);
        } else if (session.connectionDetails) {
            // From Custom SSH
            setLocation(`/ssh/custom?restore=${session.id}`);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    return (
        <div style={{ padding: '1rem', height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookmarkIcon size={32} />
                    Saved SSH Sessions
                </h1>

                {/* Controls */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '2rem',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#8b949e'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search sessions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                background: '#0d1117',
                                border: '1px solid #30363d',
                                borderRadius: '6px',
                                color: '#c9d1d9',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '0.75rem',
                            background: '#0d1117',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            color: '#c9d1d9',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="recent">Most Recent</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="service">Service</option>
                    </select>

                    {/* Count */}
                    <div style={{ color: '#8b949e', fontSize: '14px' }}>
                        {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Sessions Grid */}
                {filteredSessions.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        color: '#8b949e'
                    }}>
                        <BookmarkIcon size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#c9d1d9' }}>
                            {searchTerm ? 'No sessions found' : 'No saved sessions yet'}
                        </h3>
                        <p style={{ margin: 0 }}>
                            {searchTerm
                                ? 'Try a different search term'
                                : 'Save sessions from the SSH console to see them here'}
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '1rem'
                    }}>
                        {filteredSessions.map(session => (
                            <div
                                key={session.id}
                                style={{
                                    background: '#161b22',
                                    border: '1px solid #30363d',
                                    borderRadius: '8px',
                                    padding: '1.5rem',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#30363d'}
                            >
                                {/* Session Name */}
                                <h3 style={{
                                    margin: '0 0 1rem 0',
                                    color: '#c9d1d9',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Server size={20} color="#3b82f6" />
                                    {session.name}
                                </h3>

                                {/* Connection Info */}
                                <div style={{ marginBottom: '1rem' }}>
                                    {session.service && (
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#8b949e',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <strong style={{ color: '#c9d1d9' }}>Service:</strong> {session.service.name}
                                        </div>
                                    )}
                                    {session.connectionDetails && (
                                        <>
                                            <div style={{ fontSize: '14px', color: '#8b949e', marginBottom: '0.5rem' }}>
                                                <strong style={{ color: '#c9d1d9' }}>Host:</strong> {session.connectionDetails.host}:{session.connectionDetails.port}
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#8b949e' }}>
                                                <strong style={{ color: '#c9d1d9' }}>User:</strong> {session.connectionDetails.username}
                                            </div>
                                        </>
                                    )}
                                    {session.credentials && (
                                        <div style={{ fontSize: '14px', color: '#8b949e' }}>
                                            <strong style={{ color: '#c9d1d9' }}>User:</strong> {session.credentials.username}
                                        </div>
                                    )}
                                </div>

                                {/* Timestamp */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '13px',
                                    color: '#8b949e',
                                    marginBottom: '1rem'
                                }}>
                                    <Clock size={14} />
                                    Saved {formatTimestamp(session.timestamp)}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            restoreSession(session);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '0.75rem',
                                            background: '#238636',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <Play size={16} />
                                        Restore
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModal(session);
                                        }}
                                        style={{
                                            padding: '0.75rem',
                                            background: '#21262d',
                                            color: '#ef4444',
                                            border: '1px solid #30363d',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                        title="Delete session"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                sessionName={sessionToDelete?.name || ''}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

export default SavedSSH;
