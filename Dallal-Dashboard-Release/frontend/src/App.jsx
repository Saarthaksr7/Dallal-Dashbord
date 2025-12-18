import React, { useEffect, Suspense, lazy } from 'react';
import { Route, Switch, Redirect, useLocation } from 'wouter';
import { useAuthStore } from './store/auth';
import { useUIStore } from './store/ui';
import Card from './components/ui/Card';
import Layout from './components/layout/Layout';
import ThemeManager from './components/ThemeManager';
import ToastContainer from './components/ui/ToastContainer';
import ShortcutsHelp from './components/ShortcutsHelp';
import KeyboardShortcutsHelper from './components/KeyboardShortcutsHelper';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import ErrorBoundary from './components/ErrorBoundary';
import SkipLinks from './components/ui/SkipLinks';
import { GlobalLiveRegion } from './components/ui/LiveRegion';
import OnboardingTour, { shouldShowOnboarding } from './components/OnboardingTour';

// Lazy Load Pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Services = lazy(() => import('./pages/Services'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Settings = lazy(() => import('./pages/Settings'));
const SSH = lazy(() => import('./pages/SSH'));
const RDP = lazy(() => import('./pages/RDP'));
const OpsCenter = lazy(() => import('./pages/OpsCenter'));
const AppStore = lazy(() => import('./pages/AppStore'));
const Docker = lazy(() => import('./pages/Docker'));
const Reports = lazy(() => import('./pages/Reports'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ComponentDemo = lazy(() => import('./pages/ComponentDemo'));

// Protected Route Component
const ProtectedRoute = ({ component: Component, ...rest }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
};

function App() {
  const [showHelp, setShowHelp] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [location] = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Check if onboarding should be shown on first authenticated visit
  React.useEffect(() => {
    if (isAuthenticated && shouldShowOnboarding()) {
      // Add a small delay to let the app fully load
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  useKeyboardShortcuts({
    '?': () => setShowHelp(prev => !prev),
    '/': (e) => {
      // Global search focus logic...
    },
    'Escape': () => setShowHelp(false)
  });

  // Update document title and announce route changes for screen readers
  useEffect(() => {
    const pageTitles = {
      '/login': 'Login',
      '/dashboard': 'Dashboard',
      '/services': 'Services',
      '/monitoring': 'Monitoring',
      '/alerts': 'Alerts',
      '/settings': 'Settings',
      '/ssh/custom': 'Custom SSH',
      '/ssh': 'SSH Terminal',
      '/rdp': 'Remote Desktop',
      '/ops-center': 'Ops Center',
      '/topology': 'Network Topology',
      '/app-store': 'App Store',
      '/docker': 'Docker Management',
      '/reports': 'Reports'
    };

    const currentPath = location.split('?')[0];
    let title = 'Dallal Dashboard';

    for (const [path, pageTitle] of Object.entries(pageTitles)) {
      if (currentPath.startsWith(path)) {
        title = `${pageTitle} - Dallal Dashboard`;
        break;
      }
    }

    document.title = title;

    // Announce page change to screen readers
    if (window.announceToScreenReader) {
      const pageName = title.replace(' - Dallal Dashboard', '');
      window.announceToScreenReader(`Navigated to ${pageName}`, 'polite');
    }
  }, [location]);

  return (
    <ErrorBoundary>
      <SkipLinks />
      <GlobalLiveRegion />
      <ThemeManager />
      <ToastContainer />
      <KeyboardShortcutsHelper />
      <ShortcutsHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <OnboardingTour
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        userRole={user?.role || 'user'}
      />

      <Suspense fallback={<LoadingSpinner />}>
        <Switch>
          <Route path="/login" component={Login} />

          {/* Dashboard Routes */}
          <Route path="/dashboard">
            <ProtectedRoute component={Dashboard} />
          </Route>
          <Route path="/dashboard/:rest*">
            <ProtectedRoute component={Dashboard} />
          </Route>
          <Route path="/">
            {() => {
              const isAuthenticated = useAuthStore.getState().isAuthenticated;
              return isAuthenticated ? <Redirect to="/dashboard/overview" /> : <Redirect to="/login" />;
            }}
          </Route>

          <Route path="/services">
            <ProtectedRoute component={Services} />
          </Route>
          <Route path="/monitoring/metrics" component={() => <ProtectedRoute component={Monitoring} />} />
          <Route path="/monitoring/alerts" component={() => <ProtectedRoute component={Alerts} />} />
          <Route path="/monitoring" component={() => <ProtectedRoute component={Monitoring} />} />
          <Route path="/ssh" component={() => <ProtectedRoute component={SSH} />} />
          <Route path="/ssh/:rest*">
            <ProtectedRoute component={SSH} />
          </Route>
          <Route path="/rdp" component={() => <ProtectedRoute component={RDP} />} />
          <Route path="/rdp/:rest*">
            <ProtectedRoute component={RDP} />
          </Route>
          <Route path="/ops-center" component={() => <ProtectedRoute component={OpsCenter} />} />
          {/* Backward compatibility redirect */}
          <Route path="/topology">
            <Redirect to="/ops-center" />
          </Route>
          <Route path="/app-store" component={() => <ProtectedRoute component={AppStore} />} />
          <Route path="/docker" component={() => <ProtectedRoute component={Docker} />} />
          <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
          <Route path="/demo" component={() => <ProtectedRoute component={ComponentDemo} />} />
          <Route path="/settings">
            {/* Only Admin can access Settings */}
            {(params) => {
              const user = useAuthStore.getState().user;
              if (user?.role !== 'admin') return <Redirect to="/" />;
              return <ProtectedRoute component={Settings} />;
            }}
          </Route>
          {/* Catch all else */}
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;

import './responsive.css';
