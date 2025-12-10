import React from 'react';
import { Route, Switch, Redirect, useRoute } from 'wouter';
import { Terminal, History, FolderOpen } from 'lucide-react';
import { Suspense, lazy } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Lazy load sub-pages
const SSHConsole = lazy(() => import('./SSHConsole'));
const SSHHistory = lazy(() => import('./SSHHistory'));
const SFTPBrowser = lazy(() => import('./SFTPBrowser'));

const SSH = () => {
    const [isConsole] = useRoute('/ssh/console');
    const [isHistory] = useRoute('/ssh/history');
    const [isSFTP] = useRoute('/ssh/sftp');

    const activeTab = isConsole ? 'console' : isHistory ? 'history' : isSFTP ? 'sftp' : 'console';

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
            </div>

            {/* Content */}
            <Suspense fallback={<LoadingSpinner />}>
                <Switch>
                    <Route path="/ssh/console" component={SSHConsole} />
                    <Route path="/ssh/history" component={SSHHistory} />
                    <Route path="/ssh/sftp" component={SFTPBrowser} />
                    <Route path="/ssh">
                        <Redirect to="/ssh/console" />
                    </Route>
                </Switch>
            </Suspense>
        </div>
    );
};

export default SSH;
