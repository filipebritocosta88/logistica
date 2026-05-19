import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { format, isPast, parseISO } from 'date-fns';
import { Search, RefreshCw, Upload, ExternalLink, Package, AlertTriangle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, TIPO_LABELS } from './Dashboard';
import SolicitacaoDetalhes from '@/components/SolicitacaoDetalhes';
import { toast } from 'sonner';

export default function MinhasSolicitacoes() {
  const { user } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Solicitacao.list('-created_date', 300);
    setSolicitacoes(data.filter(s => s.created_by === user?.email));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = search
    ? solicitacoes.filter(s =>
        s.protocolo?.toLowerCase().includes(search.toLowerCase()) ||
        s.destino_cidade?.toLowerCase().includes(search.toLowerCase()) ||
        s.destino_nome?.toLowerCase().includes(search.toLowerCase())
      )
    : solicitacoes;

  const handleUploadComprovante = async (solId, file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Solicitacao.update(solId, { comprovante_url: file_url });
    toast.success('Comprovante enviado!');
    load();
  };

  if (selected) {
    return <SolicitacaoDetalhes solicitacao={selected} onBack={() => { setSelected(null); load(); }} />;
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-grotesk">Minhas Solicitações</h2>
          <p className="text-sm text-muted-foreground">{solicitacoes.length} solicitações encontradas</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por protocolo, destino..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma solicitação ainda</p>
            <p className="text-sm mt-1">Crie sua primeira solicitação de envio</p>
          </div>
        ) : filtered.map(s => {
          const isAtrasado = s.previsao_entrega &&
            isPast(parseISO(s.previsao_entrega)) &&
            !['entregue', 'recebimento_confirmado', 'finalizado', 'cancelado', 'postado'].includes(s.status);
          const aguardandoPostagem = s.status === 'aguardando_postagem';

          return (
            <Card key={s.id}
              className={`card-hover cursor-pointer transition-all ${isAtrasado ? 'border-red-300 bg-red-50/30' : aguardandoPostagem ? 'border-cyan-300 bg-cyan-50/30' : 'border-border'}`}
              onClick={() => setSelected(s)}
            >
              <CardContent className="p-4">
                {/* Banner de aviso */}
                {isAtrasado && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-100 rounded-lg text-red-700 text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    Entrega atrasada! Previsão era {format(parseISO(s.previsao_entrega), 'dd/MM/yyyy')}
                  </div>
                )}
                {aguardandoPostagem && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-cyan-100 rounded-lg text-cyan-700 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    Autorização pronta! Clique para registrar a postagem.
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-primary">{s.protocolo}</span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{TIPO_LABELS[s.tipo] || s.tipo}</span>
                      {s.prioridade !== 'normal' && (
                        <Badge className={s.prioridade === 'urgente' ? 'bg-orange-100 text-orange-700 text-xs' : 'bg-red-100 text-red-700 text-xs'}>
                          {s.prioridade}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {s.origem_cidade || '—'} → {s.destino_nome || s.destino_cidade || '—'}
                    </p>
                    {s.codigo_rastreio && (
                      <p className="text-xs font-mono text-indigo-600 mt-1">Rastreio: {s.codigo_rastreio}</p>
                    )}
                    {s.previsao_entrega && !isAtrasado && (
                      <p className="text-xs text-muted-foreground mt-1">Previsão: {format(parseISO(s.previsao_entrega), 'dd/MM/yyyy')}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <StatusBadge status={s.status} />
                    <span className="text-xs text-muted-foreground">{format(new Date(s.created_date), 'dd/MM HH:mm')}</span>
                    {s.comprovante_url && (
                      <a href={s.comprovante_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                        onClick={e => e.stopPropagation()}>
                        <ExternalLink className="w-3 h-3" /> Ver comprovante
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
