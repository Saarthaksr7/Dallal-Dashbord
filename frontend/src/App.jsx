import React, { useEffect, Suspense, lazy } from 'react';
import { Route, Switch, Redirect } from 'wouter';
import { useAuthStore } from './store/auth';
import { useUIStore } from './store/ui';
import Card from './components/ui/Card';
import Layout from './components/layout/Layout';
import ThemeManager from './components/ThemeManager';
import ToastContainer from './components/ui/ToastContainer';
import ShortcutsHelp from './components/ShortcutsHelp';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Lazy Load Pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Services = lazy(() => import('./pages/Services'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Settings = lazy(() => import('./pages/Settings'));
const SSH = lazy(() => import('./pages/SSH'));
const RDP = lazy(() => import('./pages/RDP'));
const Topology = lazy(() => import('./pages/Topology'));
const AppStore = lazy(() => import('./pages/AppStore'));
const Docker = lazy(() => import('./pages/Docker'));
const Reports = lazy(() => import('./pages/Reports'));

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

  useKeyboardShortcuts({
    '?': () => setShowHelp(prev => !prev),
    '/': (e) => {
      // Global search focus logic...
    },
    'Escape': () => setShowHelp(false)
  });

  return (
    <>
      <ThemeManager />
      <ToastContainer />
      <ShortcutsHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />

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
          <Route path="/topology" component={() => <ProtectedRoute component={Topology} />} />
          <Route path="/app-store" component={() => <ProtectedRoute component={AppStore} />} />
          <Route path="/docker" component={() => <ProtectedRoute component={Docker} />} />
          <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
          <Route path="/settings">
            {/* Only Admin can access Settings */}
            {(params) => {
              const user = useAuthStore.getState().user;
              if (user?.role !== 'admin') return <Redirect to="/" />;
              return <ProtectedRoute component={Settings} />;
            }}
          </Route>
          {/* Catch all else */}
          <Route>404: No such page!</Route>
        </Switch>
      </Suspense>
    </>
  );
}

export default App;
