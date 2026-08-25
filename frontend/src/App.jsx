import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/ui/ToastContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Chatbot from './components/Chatbot.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import LogsPage from './pages/LogsPage.jsx';

function ProtectedLayout({ children }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Carregando…</div>;
  }
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell" style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {children}
      </div>
      <Chatbot />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/projetos" element={<ProtectedLayout><ProjectsPage /></ProtectedLayout>} />
        <Route path="/projetos/:id" element={<ProtectedLayout><ProjectDetailPage /></ProtectedLayout>} />
        <Route path="/documentos" element={<ProtectedLayout><DocumentsPage /></ProtectedLayout>} />
        <Route path="/chat" element={<ProtectedLayout><ChatPage /></ProtectedLayout>} />
        <Route path="/usuarios" element={<ProtectedLayout><UsersPage /></ProtectedLayout>} />
        <Route path="/logs" element={<ProtectedLayout><LogsPage /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
