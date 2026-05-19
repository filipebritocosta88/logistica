import { StatusBadge, TIPO_LABELS, STATUS_LABELS as DASH_STATUS_LABELS } from './Dashboard';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, isToday } from 'date-fns';
import { Search, Filter, Eye, ChevronDown, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SolicitacaoDetalhes from '@/components/SolicitacaoDetalhes';

const STATUS_LABELS = DASH_STATUS_LABELS;

export default function Solicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: 'todos', tipo: 'todos', prioridade: 'todos' });

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Solicitacao.list('-created_date', 200);
    setSolicitacoes(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Ler filtro da URL (vindo do dashboard)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filtro = params.get('filtro');
    if (filtro === 'hoje') setFilters(f => ({ ...f, _urlFiltro: 'hoje' }));
    else if (filtro === 'reversas_pendentes') setFilters(f => ({ ...f, _urlFiltro: 'reversas_pendentes' }));
    else if (filtro === 'aguardando') setFilters(f => ({ ...f, _urlFiltro: 'aguardando' }));
  }, []);

  const filtered = solicitacoes.filter(s => {
    // Filtros vindos do dashboard via URL
    if (filters._urlFiltro === 'hoje' && !isToday(new Date(s.created_date))) return false;
    if (filters._urlFiltro === 'reversas_pendentes' && !(s.tipo === 'logistica_reversa' && !['finalizado', 'cancelado', 'recebimento_confirmado'].includes(s.status))) return false;
    if (filters._urlFiltro === 'aguardando' && !['solicitacao_criada', 'aguardando_analise', 'processando'].includes(s.status)) return false;

    if (filters.status !== 'todos' && s.status !== filters.status) return false;
    if (filters.tipo !== 'todos' && s.tipo !== filters.tipo) return false;
    if (filters.prioridade !== 'todos' && s.prioridade !== filters.prioridade) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (
        s.protocolo?.toLowerCase().includes(q) ||
        s.responsavel_nome?.toLowerCase().includes(q) ||
        s.origem_cidade?.toLowerCase().includes(q) ||
        s.destino_cidade?.toLowerCase().includes(q) ||
        s.setor_solicitante?.toLowerCase().includes(q) ||
        s.codigo_rastreio?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const urlFiltroLabel = filters._urlFiltro === 'hoje' ? '🔵 Filtrando: Solicitações de Hoje' :
    filters._urlFiltro === 'reversas_pendentes' ? '🟡 Filtrando: Reversas Pendentes' :
    filters._urlFiltro === 'aguardando' ? '🔴 Filtrando: Aguardando Atendimento' : null;

  if (selected) {
    return <SolicitacaoDetalhes solicitacao={selected} onBack={() => { setSelected(null); load(); }} />;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-grotesk">Solicitações</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} solicitações encontradas</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Banner de filtro ativo */}
      {urlFiltroLabel && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 text-sm font-medium text-primary">
          <span>{urlFiltroLabel}</span>
          <button className="text-xs underline hover:no-underline" onClick={() => setFilters(f => ({ ...f, _urlFiltro: null }))}>
            Limpar filtro
          </button>
        </div>
      )}

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por protocolo, responsável, cidade..."
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>
            <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
              <SelectTrigger className="w-44 h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.tipo} onValueChange={v => setFilters(f => ({ ...f, tipo: v }))}>
              <SelectTrigger className="w-44 h-8 text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {Object.entries(TIPO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.prioridade} onValueChange={v => setFilters(f => ({ ...f, prioridade: v }))}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="emergencial">Emergencial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Protocolo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Origem → Destino</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Responsável</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Modalidade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Nenhuma solicitação encontrada</td></tr>
              ) : filtered.map(s => (
                <tr
                  key={s.id}
                  className={`hover:bg-muted/30 transition-colors cursor-pointer ${s.prioridade === 'urgente' ? 'bg-orange-50/50' : ''} ${s.prioridade === 'emergencial' ? 'bg-red-50/50' : ''}`}
                  onClick={() => setSelected(s)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">{s.protocolo || s.id?.slice(0, 10)}</span>
                      {s.prioridade === 'urgente' && <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></span>}
                      {s.prioridade === 'emergencial' && <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0"></span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      {TIPO_LABELS[s.tipo] || s.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">
                      {s.origem_cidade || '—'} <span className="text-foreground font-medium">→</span> {s.destino_cidade || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.responsavel_nome || s.setor_solicitante || '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.modalidade_confirmada || s.modalidade_sugerida || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-xs font-medium">
                    {s.valor_custo ? `R$ ${Number(s.valor_custo).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {format(new Date(s.created_date), 'dd/MM/yy HH:mm')}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
