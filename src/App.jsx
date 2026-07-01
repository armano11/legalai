import { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ThemeProvider } from './components/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { ResearchProvider } from './components/ResearchContext';
import { CommandPalette } from './components/ui/command-palette';

// Lazy loading pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const LegalResearch = lazy(() => import('./pages/LegalResearch'));
const CaseDashboard = lazy(() => import('./pages/CaseDashboard'));
const CaseInsights = lazy(() => import('./pages/CaseInsights'));
const ResearchReport = lazy(() => import('./pages/ResearchReport'));
const LawyerDirectory = lazy(() => import('./pages/LawyerDirectory'));
const Analytics = lazy(() => import('./pages/Analytics'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const DraftGenerator = lazy(() => import('./pages/DraftGenerator'));
const ClientPortal = lazy(() => import('./pages/ClientPortal'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/dashboard" replace />;
  return children;
};

// Global Loading Fallback
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const location = useLocation();
  const isClientTrackingPage = location.pathname === '/track';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {!isClientTrackingPage && <Navbar />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
            <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
            <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
            <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
            <Route path="/track" element={<ClientPortal />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/lawyers" element={<ProtectedRoute><LawyerDirectory /></ProtectedRoute>} />
            <Route path="/research" element={<ProtectedRoute><LegalResearch /></ProtectedRoute>} />
            <Route path="/research/report" element={<ProtectedRoute><ResearchReport /></ProtectedRoute>} />
            <Route path="/cases" element={<ProtectedRoute><CaseDashboard /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute><CaseInsights /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/draft" element={<ProtectedRoute><DraftGenerator /></ProtectedRoute>} />
            <Route path="/contract-analyzer" element={<ProtectedRoute><Navigate to="/research" replace /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
      </Suspense>
      {!isClientTrackingPage && (
        <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ResearchProvider>
            <AppRoutes />
          </ResearchProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
