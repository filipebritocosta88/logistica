import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Truck, Search, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SolicitacaoDetalhes from '@/components/SolicitacaoDetalhes';
import { StatusBadge, TIPO_LABELS } from './Dashboard';

const PENDENTES_STATUS = [
  'solicitacao_criada', 'aguardando_analise', 'em_analise',
  'aguardando_dados', 'aprovado_envio', 'aguardando_coleta'
];



export default function Atendimento() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('pendentes');

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Solicitacao.list('-created_date', 300);
    setSolicitacoes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = solicitacoes.filter(s => {
    const matchView = view === 'pendentes'
      ? PENDENTES_STATUS.includes(s.status)
      : view === 'em_transporte'
        ? ['envio_realizado', 'em_transporte', 'entregue'].includes(s.status)
        : true;
    if (!matchView) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.protocolo?.toLowerCase().includes(q) ||
        s.responsavel_nome?.toLowerCase().includes(q) ||
        s.origem_cidade?.toLowerCase().includes(q) ||
        s.destino_cidade?.toLowerCase().includes(q);
    }
    return true;
  });

  if (selected) {
    return <SolicitacaoDetalhes solicitacao={selected} onBack={() => { setSelected(null); load(); }} />;
  }

  const urgentes = filtered.filter(s => s.prioridade !== 'normal');

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-grotesk">Atendimento Logístico</h2>
          <p className="text-sm text-muted-foreground">Gerencie e atualize as solicitações em tempo real</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {urgentes.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800">{urgentes.length} solicitação(ões) urgente(s) ou emergencial(is)</p>
            <p className="text-xs text-orange-600 mt-0.5">Atenção prioritária necessária</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'pendentes', label: `Pendentes (${solicitacoes.filter(s => PENDENTES_STATUS.includes(s.status)).length})` },
          { key: 'em_transporte', label: `Em Transporte (${solicitacoes.filter(s => ['envio_realizado', 'em_transporte', 'entregue'].includes(s.status)).length})` },
          { key: 'todos', label: 'Todos' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === tab.key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar solicitações..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-8 text-sm max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma solicitação</div>
        ) : filtered.map(s => (
          <Card
            key={s.id}
            className={`border-border cursor-pointer hover:shadow-md transition-all ${s.prioridade === 'urgente' ? 'border-l-4 border-l-orange-400' : ''} ${s.prioridade === 'emergencial' ? 'border-l-4 border-l-red-500' : ''}`}
            onClick={() => setSelected(s)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-primary">{s.protocolo}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{TIPO_LABELS[s.tipo] || s.tipo}</span>
                    {s.prioridade !== 'normal' && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.prioridade === 'urgente' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        {s.prioridade.toUpperCase()}
                      </span>
                    )}
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      {s.origem_cidade || '—'} → {s.destino_cidade || '—'}
                    </span>
                    {s.responsavel_nome && <span>{s.responsavel_nome}</span>}
                    {s.setor_solicitante && <span className="bg-muted px-2 py-0.5 rounded text-xs">{s.setor_solicitante}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {s.valor_custo ? (
                    <span className="text-sm font-bold text-green-700">R$ {Number(s.valor_custo).toFixed(2)}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem custo</span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(s.created_date), 'dd/MM HH:mm')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
