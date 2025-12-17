import React from 'react';
import { Route, Switch, Redirect, useRoute } from 'wouter';
import { Terminal, History, FolderOpen, ServerCog, Bookmark, Settings } from 'lucide-react';
import { Suspense, lazy } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Lazy load sub-pages
const SSHConsole = lazy(() => import('./SSHConsole'));
const SSHHistory = lazy(() => import('./SSHHistory'));
const SFTPBrowser = lazy(() => import('./SFTPBrowser'));
const SavedSSH = lazy(() => import('./SavedSSH'));
const SSHSettings = lazy(() => import('./SSHSettings'));
const CustomSSH = lazy(() => import('./CustomSSH'));

const SSH = () => {
    const [isConsole] = useRoute('/ssh/console');
    const [isCustom] = useRoute('/ssh/custom');
    const [isSFTP] = useRoute('/ssh/sftp');
    const [isSaved] = useRoute('/ssh/saved');
    const [isHistory] = useRoute('/ssh/history');
    const [isSettings] = useRoute('/ssh/settings');

    const activeTab = isConsole ? 'console' : isCustom ? 'custom' : isSFTP ? 'sftp' : isSaved ? 'saved' : isHistory ? 'history' : isSettings ? 'settings' : 'console';

    return (
        <div>
            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                borderBottom: '2px solid var(--border)',
                paddingBottom: '0'
            }}>
                <a
                    href="/ssh/console"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: activeTab === 'console' ? 'var(--accent)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'console' ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontWeight: activeTab === 'console' ? '600' : '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'console') {
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'console') {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                    }}
                >
                    <Terminal size={18} />
                    <span>SSH Console</span>
                </a>

                <a
                    href="/ssh/custom"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: activeTab === 'custom' ? 'var(--accent)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'custom' ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontWeight: activeTab === 'custom' ? '600' : '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'custom') {
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'custom') {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                    }}
                >
                    <ServerCog size={18} />
                    <span>Custom SSH</span>
                </a>

                <a
                    href="/ssh/sftp"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: activeTab === 'sftp' ? 'var(--accent)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'sftp' ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontWeight: activeTab === 'sftp' ? '600' : '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'sftp') {
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'sftp') {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                    }}
                >
                    <FolderOpen size={18} />
                    <span>SFTP Browser</span>
                </a>

                <a
                    href="/ssh/saved"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: activeTab === 'saved' ? 'var(--accent)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'saved' ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontWeight: activeTab === 'saved' ? '600' : '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'saved') {
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'saved') {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                    }}
                >
                    <Bookmark size={18} />
                    <span>Saved SSH</span>
                </a>

                <a
                    href="/ssh/history"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: activeTab === 'history' ? 'var(--accent)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'history' ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontWeight: activeTab === 'history' ? '600' : '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'history') {
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'history') {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                    }}
                >
                    <History size={18} />
                    <span>Command History</span>
                </a>

                <a
                    href="/ssh/settings"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: activeTab === 'settings' ? 'var(--accent)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'settings' ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontWeight: activeTab === 'settings' ? '600' : '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'settings') {
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'settings') {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                    }}
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </a>
            </div>

            {/* Content */}
            <Suspense fallback={<LoadingSpinner />}>
                <Switch>
                    <Route path="/ssh/console" component={SSHConsole} />
                    <Route path="/ssh/custom" component={CustomSSH} />
                    <Route path="/ssh/sftp" component={SFTPBrowser} />
                    <Route path="/ssh/saved" component={SavedSSH} />
                    <Route path="/ssh/history" component={SSHHistory} />
                    <Route path="/ssh/settings" component={SSHSettings} />
                    <Route path="/ssh">
                        <Redirect to="/ssh/console" />
                    </Route>
                </Switch>
            </Suspense>
        </div>
    );
};

export default SSH;
