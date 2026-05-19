import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Shield, Truck, BarChart3, User, Clock, Check, ChevronDown, RefreshCw, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ROLES = [
  { value: 'pendente', label: 'Pendente', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock },
  { value: 'logistica', label: 'Logística', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Truck },
  { value: 'solicitante', label: 'Solicitante', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: User },
  { value: 'diretoria', label: 'Diretoria', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: BarChart3 },
  { value: 'admin', label: 'Admin', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: Shield },
];

function RoleBadge({ role }) {
  const r = ROLES.find(r => r.value === role) || ROLES[0];
  const Icon = r.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${r.color}`}>
      <Icon className="w-3 h-3" />
      {r.label}
    </span>
  );
}

function RoleDropdown({ userId, currentRole, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (role) => {
    setSaving(true);
    setOpen(false);
    await base44.entities.User.update(userId, { role });
    onUpdate(userId, { role });
    toast.success(`Perfil atualizado para ${ROLES.find(r => r.value === role)?.label}`);
    setSaving(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-medium hover:border-primary/50 transition-colors disabled:opacity-50 min-w-[110px]"
      >
        {saving ? (
          <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground mx-auto" />
        ) : (
          <>
            <span className="flex-1 text-left">{ROLES.find(r => r.value === currentRole)?.label || 'Definir'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          </>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden"
          >
            {ROLES.map(r => {
              const Icon = r.icon;
              return (
                <button
                  key={r.value}
                  onClick={() => handleSelect(r.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors ${currentRole === r.value ? 'bg-muted/60' : ''}`}
                >
                  <Icon className={`w-3.5 h-3.5 ${r.color.split(' ')[0]}`} />
                  <span className="flex-1 text-left">{r.label}</span>
                  {currentRole === r.value && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BlocoDropdown({ userId, currentBlocoId, blocos, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = 260;
    const viewportWidth = window.innerWidth;
    let left = rect.right - dropdownWidth;
    if (left < 8) left = 8;
    if (left + dropdownWidth > viewportWidth - 8) left = viewportWidth - dropdownWidth - 8;
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left,
      width: dropdownWidth,
    });
  }, []);

  useEffect(() => {
    if (open) updatePos();
  }, [open, updatePos]);

  useEffect(() => {
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = blocos.find(b => b.id === currentBlocoId);

  const handleSelect = async (blocoId) => {
    setSaving(true);
    setOpen(false);
    await base44.entities.User.update(userId, { bloco_id: blocoId || null });
    onUpdate(userId, { bloco_id: blocoId || null });
    const nome = blocoId ? (blocos.find(b => b.id === blocoId)?.nome || 'bloco') : 'nenhum';
    toast.success(blocoId ? `Bloco definido: ${nome}` : 'Bloco removido');
    setSaving(false);
  };

  const dropdown = open && createPortal(
    <div
      ref={dropdownRef}
      style={{ position: 'absolute', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
      className="bg-card border border-border rounded-xl shadow-2xl py-1 overflow-hidden"
    >
      <div className="max-h-72 overflow-y-auto">
        <button
          onClick={() => handleSelect(null)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors ${!currentBlocoId ? 'bg-muted/60' : ''}`}
        >
          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-left text-muted-foreground italic">Sem bloco</span>
          {!currentBlocoId && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
        </button>
        <div className="border-t border-border mx-2 my-1" />
        {blocos.map(b => (
          <button
            key={b.id}
            onClick={() => handleSelect(b.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors ${currentBlocoId === b.id ? 'bg-emerald-50 text-emerald-700' : ''}`}
          >
            <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${currentBlocoId === b.id ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
            <span className="flex-1 text-left font-medium">{b.nome}</span>
            {b.estado && <span className="text-xs text-muted-foreground mr-1">{b.estado}</span>}
            {currentBlocoId === b.id && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(v => !v)}
        disabled={saving}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-50 w-full max-w-[200px] ${
          current
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:shadow-sm'
            : 'border-dashed border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        {saving ? (
          <RefreshCw className="w-3 h-3 animate-spin mx-auto" />
        ) : (
          <>
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="flex-1 text-left truncate text-xs">{current?.nome || 'Sem bloco'}</span>
            <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      {dropdown}
    </>
  );
}

export default function GerenciarUsuarios() {
  const [users, setUsers] = useState([]);
  const [blocos, setBlocos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const load = async () => {
    setLoading(true);
    const [data, bl] = await Promise.all([
      base44.entities.User.list('-created_date', 200),
      base44.entities.Bloco.filter({ ativo: true }, 'nome', 100),
    ]);
    setUsers(data);
    setBlocos(bl);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = (userId, changes) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...changes } : u));
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || (u.role || 'pendente') === filterRole;
    return matchSearch && matchRole;
  });

  const pendentes = users.filter(u => !u.role || u.role === 'pendente').length;

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold font-grotesk">Gerenciar Usuários</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Defina o perfil de acesso e o bloco de cada usuário</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alert pendentes */}
      {pendentes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200"
        >
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {pendentes} usuário{pendentes > 1 ? 's' : ''} aguardando aprovação
            </p>
            <p className="text-xs text-amber-600">Defina o perfil e o bloco para liberar o acesso</p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ROLES.map(r => {
          const count = users.filter(u => (u.role || 'pendente') === r.value).length;
          const Icon = r.icon;
          return (
            <button
              key={r.value}
              onClick={() => setFilterRole(filterRole === r.value ? 'all' : r.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                filterRole === r.value
                  ? 'border-primary bg-accent shadow-sm'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${r.color.split(' ')[0]}`} />
                <span className="text-xs font-medium text-muted-foreground">{r.label}</span>
              </div>
              <p className="text-xl font-bold">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-visible">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] bg-muted/40 px-5 py-3 gap-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Usuário</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28 text-center">Perfil Atual</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28 text-center">Alterar Perfil</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-52 text-center">Selecionar Bloco</span>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Nenhum usuário encontrado
            </div>
          ) : filtered.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors overflow-visible"
            >
              {/* User info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white shadow ${
                  u.role === 'admin' ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
                  u.role === 'logistica' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                  u.role === 'solicitante' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                  u.role === 'diretoria' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                  'bg-gradient-to-br from-slate-400 to-slate-500'
                }`}>
                  {u.full_name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{u.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    Cadastro: {u.created_date ? format(new Date(u.created_date), "dd MMM yyyy", { locale: ptBR }) : '—'}
                  </p>
                </div>
              </div>

              {/* Role badge */}
              <div className="w-28 flex justify-center">
                <RoleBadge role={u.role || 'pendente'} />
              </div>

              {/* Role dropdown */}
              <div className="w-28 flex justify-center">
                <RoleDropdown userId={u.id} currentRole={u.role || 'pendente'} onUpdate={handleUpdate} />
              </div>

              {/* Bloco dropdown */}
              <div className="w-52 flex justify-end">
                <BlocoDropdown
                  userId={u.id}
                  currentBlocoId={u.bloco_id}
                  blocos={blocos}
                  onUpdate={handleUpdate}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
