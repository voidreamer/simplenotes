import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/store';
import { useThemeStore, applyTheme } from './stores/themeStore';
import { configureAuth, checkAuthSession } from './utils/auth';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import DashboardPage from './pages/DashboardPage';
import HouseholdPage from './pages/HouseholdPage';
import ListPage from './pages/ListPage';
import InvitePage from './pages/InvitePage';
import SettingsPage from './pages/SettingsPage';
// import ThemeShowcase from './pages/ThemeShowcase';
import InfraLearn from './pages/InfraLearn';

// Components
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import EncryptionProvider from './components/EncryptionProvider';

// Configure auth on load
configureAuth();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <EncryptionProvider>
      {children}
    </EncryptionProvider>
  );
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  const { isLoading, setLoading } = useAuthStore();
  const { theme } = useThemeStore();

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    // Check for existing auth session
    const initAuth = async () => {
      try {
        await checkAuthSession();
      } catch {
        setLoading(false);
      }
    };
    initAuth();
  }, [setLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - redirect to dashboard if authenticated */}
        <Route path="/" element={<AuthRedirect><LandingPage /></AuthRedirect>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/invite/:inviteId" element={<InvitePage />} />
        {/* <Route path="/themes" element={<ThemeShowcase />} /> */}
        <Route path="/learn" element={<InfraLearn />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/household/:householdId"
          element={
            <ProtectedRoute>
              <Layout>
                <HouseholdPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/list/:listId"
          element={
            <ProtectedRoute>
              <Layout>
                <ListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
