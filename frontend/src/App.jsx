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
const Services = lazy(() => import('./pages/Services'));
const Settings = lazy(() => import('./pages/Settings'));
const SSH = lazy(() => import('./pages/SSH'));
const RDP = lazy(() => import('./pages/RDP'));
const Topology = lazy(() => import('./pages/Topology'));
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

// Dashboard Placeholder
const Dashboard = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '1rem' }}>Dashboard</h1>
      <p>Welcome to Dallal Dashboard v2.0</p>
    </div>
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
          {/* Protect the root route */}
          <Route path="/">
            <ProtectedRoute component={Dashboard} />
          </Route>
          <Route path="/services">
            <ProtectedRoute component={Services} />
          </Route>
          <Route path="/monitoring">
            <ProtectedRoute component={Services} />
          </Route>
          <Route path="/ssh">
            <ProtectedRoute component={SSH} />
          </Route>
          <Route path="/rdp">
            <ProtectedRoute component={RDP} />
          </Route>
          <Route path="/topology">
            <ProtectedRoute component={Topology} />
          </Route>
          <Route path="/docker">
            <ProtectedRoute component={Docker} />
          </Route>
          <Route path="/reports">
            {/* Only Admin/Superuser? For now just protected */}
            <ProtectedRoute component={Reports} />
          </Route>
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
