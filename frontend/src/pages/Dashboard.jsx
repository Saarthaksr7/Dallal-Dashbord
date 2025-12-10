import React, { Suspense, lazy } from 'react';
import { Route, Switch, Redirect, useRoute } from 'wouter';
import { LayoutDashboard, Star } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Lazy load sub-pages
const DashboardOverview = lazy(() => import('./DashboardOverview'));
const DashboardFavorites = lazy(() => import('./DashboardFavorites'));

const Dashboard = () => {
    const [isOverview] = useRoute('/dashboard/overview');
    const [isFavorites] = useRoute('/dashboard/favorites');
    const [isRoot] = useRoute('/dashboard');

    const activeTab = isOverview ? 'overview' : isFavorites ? 'favorites' : 'overview';

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
                    href="/dashboard/overview"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'overview' ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontWeight: activeTab === 'overview' ? '600' : '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'overview') {
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'overview') {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                    }}
                >
                    <LayoutDashboard size={18} />
                    <span>Overview</span>
                </a>

                <a
                    href="/dashboard/favorites"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: activeTab === 'favorites' ? 'var(--accent)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'favorites' ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontWeight: activeTab === 'favorites' ? '600' : '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        if (activeTab !== 'favorites') {
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== 'favorites') {
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                    }}
                >
                    <Star size={18} />
                    <span>Favorites</span>
                </a>
            </div>

            {/* Content */}
            <Suspense fallback={<LoadingSpinner />}>
                <Switch>
                    <Route path="/dashboard/overview" component={DashboardOverview} />
                    <Route path="/dashboard/favorites" component={DashboardFavorites} />
                    <Route path="/dashboard">
                        <Redirect to="/dashboard/overview" />
                    </Route>
                </Switch>
            </Suspense>
        </div>
    );
};

export default Dashboard;
