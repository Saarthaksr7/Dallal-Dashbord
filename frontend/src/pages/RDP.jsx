import React from 'react';
import { Route, Switch, Redirect, useRoute } from 'wouter';
import { Monitor, Video } from 'lucide-react';
import { Suspense, lazy } from 'react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Lazy load sub-pages
const RDPSessions = lazy(() => import('./RDPSessions'));
const RDPRecordings = lazy(() => import('./RDPRecordings'));

const RDP = () => {
    const [isSessions] = useRoute('/rdp/sessions');
    const [isRecordings] = useRoute('/rdp/recordings');

    const activeTab = isSessions ? 'sessions' : isRecordings ? 'recordings' : 'sessions';

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
                    href="/rdp/sessions"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: activeTab === 'sessions' ? 'var(--accent)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'sessions' ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontWeight: activeTab === 'sessions' ? '600' : '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'sessions') {
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'sessions') {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                    }}
                >
                    <Monitor size={18} />
                    <span>RDP Sessions</span>
                </a>

                <a
                    href="/rdp/recordings"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: activeTab === 'recordings' ? 'var(--accent)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'recordings' ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontWeight: activeTab === 'recordings' ? '600' : '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'recordings') {
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'recordings') {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                    }}
                >
                    <Video size={18} />
                    <span>Screen Recordings</span>
                </a>
            </div>

            {/* Content */}
            <Suspense fallback={<LoadingSpinner />}>
                <Switch>
                    <Route path="/rdp/sessions" component={RDPSessions} />
                    <Route path="/rdp/recordings" component={RDPRecordings} />
                    <Route path="/rdp">
                        <Redirect to="/rdp/sessions" />
                    </Route>
                </Switch>
            </Suspense>
        </div>
    );
};

export default RDP;
