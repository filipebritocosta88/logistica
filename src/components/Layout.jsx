import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, PackageSearch, Truck, BarChart3,
  Settings, LogOut, Menu, X, ChevronRight, Bell, Users,
  TrendingUp, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_BY_ROLE = {
  admin: [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/usuarios', label: 'Usuários', icon: Users },
    { path: '/solicitacoes', label: 'Solicitações', icon: PackageSearch },
    { path: '/atendimento', label: 'Atendimento', icon: Truck },
    { path: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    { path: '/cadastros', label: 'Cadastros', icon: Settings },
  ],
  logistica: [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/atendimento', label: 'Atendimento', icon: Truck },
    { path: '/solicitacoes', label: 'Solicitações', icon: PackageSearch },
  ],
  solicitante: [
    { path: '/', label: 'Meu Dashboard', icon: LayoutDashboard },
    { path: '/nova-solicitacao', label: 'Nova Solicitação', icon: Package },
    { path: '/minhas-solicitacoes', label: 'Minhas Solicitações', icon: ClipboardList },
  ],
  diretoria: [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  ],
};

const ROLE_LABELS = {
  admin: 'Administrador',
  logistica: 'Logística',
  solicitante: 'Solicitante',
  diretoria: 'Diretoria',
};

const ROLE_COLORS = {
  admin: 'from-violet-500 to-purple-600',
  logistica: 'from-blue-500 to-cyan-600',
  solicitante: 'from-emerald-500 to-teal-600',
  diretoria: 'from-amber-500 to-orange-600',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.role || 'logistica';
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.logistica;
  const gradColor = ROLE_COLORS[role] || ROLE_COLORS.logistica;

  const handleLogout = () => base44.auth.logout('/login');

  return (
    <div className="flex h-screen overflow-hidden bg-background font-inter">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 248 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex flex-col flex-shrink-0 overflow-hidden"
        style={{ background: 'hsl(var(--sidebar-bg))' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b"
          style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Truck className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="text-white font-bold text-base tracking-wider font-grotesk"
              >
                LOGISTICA
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Role badge */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-3"
            >
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${gradColor} bg-opacity-20`}
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradColor}`} />
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {ROLE_LABELS[role] || role}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn('sidebar-nav-item', isActive && 'active')}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon className={cn('w-[18px] h-[18px] flex-shrink-0 nav-icon', isActive ? 'text-indigo-300' : '')} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate text-sm"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {sidebarOpen && isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3" style={{ borderTop: '1px solid hsl(var(--sidebar-border))' }}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradColor} flex items-center justify-center flex-shrink-0 shadow`}>
                <span className="text-xs font-bold text-white">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Usuário'}</p>
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {user?.email || ''}
                </p>
              </div>
              <button onClick={handleLogout} className="text-white/30 hover:text-white/80 transition-colors p-1">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button onClick={handleLogout} className="text-white/30 hover:text-white/80 transition-colors p-1">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-card/80 backdrop-blur-sm border-b border-border px-5 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {navItems.find(n => n.path === location.pathname)?.label || 'LOGISTICA'}
            </p>
          </div>

          {/* Quick action for solicitante / admin / logistica */}
          {(role === 'solicitante' || role === 'admin') && (
            <button
              onClick={() => navigate('/nova-solicitacao')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, hsl(var(--grad-from)), hsl(var(--grad-to)))' }}
            >
              <Package className="w-4 h-4" />
              Nova Solicitação
            </button>
          )}
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
