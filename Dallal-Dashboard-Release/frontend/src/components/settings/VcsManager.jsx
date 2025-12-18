import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { GitBranch, GitCommit, GitPullRequest, UploadCloud, RefreshCw, Settings, Check, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

const VcsManager = () => {
    const [status, setStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [remoteUrl, setRemoteUrl] = useState('');
    const [commitMsg, setCommitMsg] = useState('');
    const [isPushing, setIsPushing] = useState(false);
    const [logs, setLogs] = useState([]);

    const fetchStatus = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/vcs/status');
            setStatus(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSync = async () => {
        if (!commitMsg) {
            alert("Please enter a commit message");
            return;
        }
        setIsLoading(true);
        try {
            const res = await api.post('/vcs/sync', { message: commitMsg, push: isPushing });
            setLogs(prev => [`Sync: ${res.data.status} - ${res.data.detail}`, ...prev]);
            setCommitMsg('');
            fetchStatus();
        } catch (error) {
            console.error(error);
            setLogs(prev => [`Error: ${error.response?.data?.detail || error.message}`, ...prev]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfig = async () => {
        if (!remoteUrl) return;
        try {
            await api.post('/vcs/config', { remote_url: remoteUrl });
            setLogs(prev => [`Remote Configured: ${remoteUrl}`, ...prev]);
            alert("Remote URL updated");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ display: 'grid', gap: '2rem' }}>
            <Card title="Version Control (Git)">
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    {/* ID / Status Card */}
                    <div style={{ flex: 1, minWidth: '300px', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <GitBranch size={24} color="var(--accent)" />
                            <h3 style={{ margin: 0 }}>Repository Status</h3>
                        </div>

                        {status ? (
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Branch:</span>
                                    <span style={{ fontFamily: 'monospace' }}>{status.branch}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>State:</span>
                                    <span style={{ color: status.is_clean ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        {status.is_clean ? 'Clean' : 'Unsaved Changes'}
                                        {status.is_clean ? <Check size={14} /> : <AlertCircle size={14} />}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Last Commit:</span>
                                    <span style={{ fontSize: '0.8rem', textAlign: 'right', maxWidth: '150px' }}>{status.last_commit}</span>
                                </div>
                                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '0.25rem' }}>
                                    Path: {status.repo_path}
                                </div>
                            </div>
                        ) : (
                            <div>Loading status...</div>
                        )}

                        <button
                            onClick={fetchStatus}
                            style={{ width: '100%', marginTop: '1rem' }}
                            className="btn-secondary"
                        >
                            <RefreshCw size={16} style={{ marginRight: '0.5rem' }} /> Refresh
                        </button>
                    </div>

                    {/* Actions Card */}
                    <div style={{ flex: 2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Remote Config */}
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Settings size={18} /> Configuration
                            </h4>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    className="input-field"
                                    placeholder="Remote Git URL (e.g. https://github.com/user/repo.git)"
                                    value={remoteUrl}
                                    onChange={e => setRemoteUrl(e.target.value)}
                                />
                                <button className="btn-secondary" onClick={handleConfig}>Set Remote</button>
                            </div>
                        </div>

                        {/* Commit & Sync */}
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <UploadCloud size={18} /> Sync Changes
                            </h4>
                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                                <textarea
                                    className="input-field"
                                    rows={2}
                                    placeholder="Commit Message (required)"
                                    value={commitMsg}
                                    onChange={e => setCommitMsg(e.target.value)}
                                    style={{ marginBottom: '0.5rem', resize: 'vertical' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={isPushing}
                                            onChange={e => setIsPushing(e.target.checked)}
                                        />
                                        Push to Remote
                                    </label>
                                    <button
                                        className="btn-primary"
                                        disabled={isLoading || !commitMsg}
                                        onClick={handleSync}
                                    >
                                        {isLoading ? 'Syncing...' : 'Commit & Sync'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Logs Area */}
            <Card title="Activity Log">
                <div style={{ height: '150px', overflowY: 'auto', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {logs.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>No activity yet.</span>}
                    {logs.map((log, i) => (
                        <div key={i} style={{ borderBottom: '1px solid var(--glass-border)', padding: '0.25rem 0', color: log.startsWith('Error') ? '#ef4444' : 'var(--text-primary)' }}>
                            {log}
                        </div>
                    ))}
                </div>
            </Card>

            <style>{`
                .input-field {
                    flex: 1;
                    padding: 0.75rem;
                    background: var(--bg-primary);
                    border: 1px solid var(--glass-border);
                    border-radius: 0.375rem;
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    width: 100%;
                }
                .input-field:focus { outline: none; border-color: var(--accent); }
                .btn-primary {
                    background: var(--accent);
                    color: white; border: none; padding: 0.5rem 1rem;
                    border-radius: 0.375rem; cursor: pointer; font-weight: 500;
                }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-secondary {
                    background: transparent; color: var(--text-primary);
                    border: 1px solid var(--glass-border); padding: 0.5rem 1rem;
                    border-radius: 0.375rem; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                }
                .btn-secondary:hover { background: var(--bg-secondary); }
            `}</style>
        </div>
    );
};

export default VcsManager;
