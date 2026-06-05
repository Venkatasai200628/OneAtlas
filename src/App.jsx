import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { setLoginRedirect } from '@/lib/appInvitePayload';
import { AuthProvider } from '@/contexts/AuthContext';
import { useStore } from '@/lib/store';
import Layout from '@/components/layout/Layout';
import LandingPage    from '@/views/LandingPage';
import LoginPage      from '@/views/LoginPage';
import GeneratePage   from '@/views/GeneratePage';
import ProjectsPage   from '@/views/ProjectsPage';
import TemplatesPage  from '@/views/TemplatesPage';
import DeploymentsPage from '@/views/DeploymentsPage';
import IntegrationsPage from '@/views/IntegrationsPage';
import InstructionsPage from '@/views/InstructionsPage';
import SettingsPage   from '@/views/SettingsPage';
import AppPreviewPage from '@/views/AppPreviewPage';

function Guard({ children }) {
  const user = useStore(s => s.user);
  const loading = useStore(s => s.authLoading);
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F5EE' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FF6600' }}>
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
        </div>
        <span className="text-sm font-medium" style={{ color: '#9CA3AF' }}>Loading OneAtlas…</span>
      </div>
    </div>
  );

  if (!user) {
    setLoginRedirect(`${location.pathname}${location.search}`);
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/"      element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app"   element={<Guard><Layout /></Guard>}>
            <Route index element={<Navigate to="/app/generate" replace />} />
            <Route path="generate"    element={<GeneratePage />} />
            <Route path="projects"    element={<ProjectsPage />} />
            <Route path="templates"   element={<TemplatesPage />} />
            <Route path="deployments" element={<DeploymentsPage />} />
            <Route path="integrations"element={<IntegrationsPage />} />
            <Route path="instructions"element={<InstructionsPage />} />
            <Route path="settings"    element={<SettingsPage />} />
            <Route path="preview/:projectId" element={<AppPreviewPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
