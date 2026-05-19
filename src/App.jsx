import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import NovaSolicitacao from '@/pages/NovaSolicitacao';
import Solicitacoes from '@/pages/Solicitacoes';
import Atendimento from '@/pages/Atendimento';
import Relatorios from '@/pages/Relatorios';
import Cadastros from '@/pages/Cadastros';
import GerenciarUsuarios from '@/pages/GerenciarUsuarios';
import MinhasSolicitacoes from '@/pages/MinhasSolicitacoes';
import AguardandoAprovacao from '@/pages/AguardandoAprovacao';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Carregando LOGISTICA...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Usuários pendentes ficam na tela de aguardando */}
        <Route path="/aguardando-aprovacao" element={<AguardandoAprovacao />} />

        {/* Rotas com layout - só para usuários com perfil definido */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/nova-solicitacao" element={<NovaSolicitacao />} />
          <Route path="/solicitacoes" element={<Solicitacoes />} />
          <Route path="/minhas-solicitacoes" element={<MinhasSolicitacoes />} />
          <Route path="/atendimento" element={<Atendimento />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/cadastros" element={<Cadastros />} />
          <Route path="/usuarios" element={<GerenciarUsuarios />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <Sonner richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
