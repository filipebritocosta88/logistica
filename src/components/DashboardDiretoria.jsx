import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import {
  RefreshCw, DollarSign, TrendingUp, TrendingDown, Package,
  Truck, BarChart3, X, Download, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { TIPO_LABELS } from '@/pages/Dashboard';

const CIDADES = ['todos', 'Maceió', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador'];
const SETORES = ['todos', 'Loja Virtual', 'Call Center', 'DT', 'ADM'];

const PERIOD_TABS = [
  { label: 'Esta Semana', value: 'semana' },
  { label: 'Mês Atual', value: 'mes' },
  { label: 'Últimos 3 Meses', value: '3meses' },
];

// Gera array dos últimos 12 meses para o seletor
const MESES = Array.from({ length: 12 }, (_, i) => {
  const d = subMonths(new Date(), i);
  return { value: format(d, 'yyyy-MM'), label: format(d, "MMMM/yyyy", { locale: ptBR }) };
});

function getInterval(period, mesSelecionado) {
  const hoje = new Date();
  if (period === 'semana') return { start: startOfWeek(hoje, { locale: ptBR }), end: endOfWeek(hoje, { locale: ptBR }) };
  if (period === 'mes') return { start: startOfMonth(hoje), end: endOfMonth(hoje) };
  if (period === '3meses') return { start: startOfMonth(subMonths(hoje, 2)), end: endOfMonth(hoje) };
  if (period === 'mes_especifico' && mesSelecionado) {
    const d = parseISO(mesSelecionado + '-01');
    return { start: startOfMonth(d), end: endOfMonth(d) };
  }
  return { start: startOfMonth(hoje), end: endOfMonth(hoje) };
}

function TrendBadge({ current, previous }) {
  if (!previous || previous === 0) return null;
  const diff = ((current - previous) / previous) * 100;
  const isUp = diff > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${isUp ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? '+' : ''}{diff.toFixed(1)}% vs mês anterior
    </span>
  );
}

function PDVModal({ pdv, data, onClose }) {
  if (!pdv) return null;
  const custoAtual = data.atual.filter(s => (s.origem_cidade || s.setor_solicitante) === pdv).reduce((sum, s) => sum + (s.valor_custo || 0), 0);
  const custoAnterior = data.anterior.filter(s => (s.origem_cidade || s.setor_solicitante) === pdv).reduce((sum, s) => sum + (s.valor_custo || 0), 0);
  const diff = custoAtual - custoAnterior;

  // Setor mais gastador neste PDV
  const porSetor = data.atual.filter(s => (s.origem_cidade || s.setor_solicitante) === pdv && s.valor_custo)
    .reduce((acc, s) => { const k = s.setor_solicitante || 'Sem setor'; acc[k] = (acc[k] || 0) + s.valor_custo; return acc; }, {});
  const setorTop = Object.entries(porSetor).sort((a, b) => b[1] - a[1])[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute right-0 top-0 w-80 bg-white border border-border rounded-2xl shadow-2xl p-5 z-50"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">PDV: {pdv}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Custo no período</p>
            <p className="text-xl font-bold text-foreground">R$ {custoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            {custoAnterior > 0 && (
              <p className={`text-xs font-medium mt-1 ${diff > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {diff > 0 ? '+' : ''}R$ {Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vs mês anterior
              </p>
            )}
          </div>
          {setorTop && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-800">📊 Análise Automática</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Comparado ao mês anterior, o PDV <strong>{pdv}</strong> gastou{' '}
                <strong>R$ {Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>{' '}
                {diff > 0 ? 'a mais' : 'a menos'} com logística reversa
                {setorTop ? ` — maior concentração no setor "${setorTop[0]}".` : '.'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function DashboardDiretoria({ solicitacoes, loading, load }) {
  const hoje = new Date();

  // Filtros
  const [period, setPeriod] = useState('mes');
  const [mesSelecionado, setMesSelecionado] = useState(MESES[0].value);
  const [filtroCidade, setFiltroCidade] = useState('todos');
  const [filtroSetor, setFiltroSetor] = useState('todos');
  const [pdvSelecionado, setPdvSelecionado] = useState(null);

  const interval = useMemo(() => getInterval(period, mesSelecionado), [period, mesSelecionado]);
  const intervalAnterior = useMemo(() => {
    const mesAnterior = subMonths(interval.start, 1);
    return { start: startOfMonth(mesAnterior), end: endOfMonth(mesAnterior) };
  }, [interval]);

  const reversos = useMemo(() => solicitacoes.filter(s => s.tipo === 'logistica_reversa'), [solicitacoes]);

  const filtrar = (arr) => arr.filter(s => {
    const d = new Date(s.created_date);
    if (!isWithinInterval(d, interval)) return false;
    if (filtroCidade !== 'todos' && s.origem_cidade !== filtroCidade) return false;
    if (filtroSetor !== 'todos' && s.setor_solicitante !== filtroSetor) return false;
    return true;
  });

  const dosPeriodo = useMemo(() => filtrar(reversos), [reversos, interval, filtroCidade, filtroSetor]);
  const doAnterior = useMemo(() => reversos.filter(s => {
    const d = new Date(s.created_date);
    return isWithinInterval(d, intervalAnterior);
  }), [reversos, intervalAnterior]);

  // KPIs
  const custoTotal = dosPeriodo.reduce((sum, s) => sum + (s.valor_custo || 0), 0);
  const custoAnterior = doAnterior.reduce((sum, s) => sum + (s.valor_custo || 0), 0);
  const volume = dosPeriodo.length;
  const ticketMedio = volume > 0 ? custoTotal / volume : 0;

  // Ranking PDV por custo
  const rankingPDV = useMemo(() => {
    const acc = {};
    dosPeriodo.filter(s => s.valor_custo).forEach(s => {
      const key = s.origem_cidade || s.setor_solicitante || 'Não informado';
      acc[key] = (acc[key] || 0) + s.valor_custo;
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value).slice(0, 6);
  }, [dosPeriodo]);

  // Linha do tempo: ano atual vs ano anterior — últimos 12 meses
  const timelineData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const mesAtual = subMonths(hoje, 11 - i);
      const mesAnteriorAno = subMonths(mesAtual, 12);
      const label = format(mesAtual, 'MMM', { locale: ptBR });
      const anoAtual = reversos.filter(s => {
        const d = new Date(s.created_date);
        return isWithinInterval(d, { start: startOfMonth(mesAtual), end: endOfMonth(mesAtual) });
      }).reduce((sum, s) => sum + (s.valor_custo || 0), 0);
      const anoPassado = reversos.filter(s => {
        const d = new Date(s.created_date);
        return isWithinInterval(d, { start: startOfMonth(mesAnteriorAno), end: endOfMonth(mesAnteriorAno) });
      }).reduce((sum, s) => sum + (s.valor_custo || 0), 0);
      return { label, anoAtual: Number(anoAtual.toFixed(2)), anoPassado: Number(anoPassado.toFixed(2)) };
    });
  }, [reversos]);

  // Exportar CSV executivo
  const exportarRelatorio = () => {
    const headers = ['Data', 'Protocolo', 'Setor', 'Origem', 'Destino', 'Modalidade', 'Custo Real'];
    const rows = dosPeriodo.map(s => [
      format(new Date(s.created_date), 'dd/MM/yyyy'),
      s.protocolo || '',
      s.setor_solicitante || '',
      s.origem_cidade || '',
      s.destino_cidade || '',
      s.modalidade_confirmada || s.modalidade_sugerida || '',
      s.valor_custo ? Number(s.valor_custo).toFixed(2).replace('.', ',') : '0,00',
    ]);
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reversas_financeiro_${format(hoje, 'yyyy-MM-dd')}.csv`; a.click();
  };

  const kpis = [
    {
      label: 'Custo Total em Reversas',
      value: `R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      gradient: 'linear-gradient(135deg,#6366f1,#818cf8)',
      extra: <TrendBadge current={custoTotal} previous={custoAnterior} />,
    },
    {
      label: 'Volume de Reversas',
      value: volume,
      icon: Package,
      gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    },
    {
      label: 'Ticket Médio por Reversa',
      value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg,#10b981,#34d399)',
    },
    {
      label: 'PDVs Ativos no Período',
      value: new Set(dosPeriodo.map(s => s.origem_cidade).filter(Boolean)).size,
      icon: Truck,
      gradient: 'linear-gradient(135deg,#3b82f6,#60a5fa)',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-grotesk">Dashboard Diretoria</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Fiscalização e auditoria de Logística Reversa</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={exportarRelatorio} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Download className="w-4 h-4" /> Exportar Relatório para o Financeiro
          </Button>
          <Link to="/relatorios">
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Relatórios
            </Button>
          </Link>
          <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Painel de Filtros Combinados */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros Combinados</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Abas rápidas de período */}
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
              {PERIOD_TABS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setPeriod(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === t.value ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t.label}
                </button>
              ))}
              <button
                onClick={() => setPeriod('mes_especifico')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === 'mes_especifico' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Mês Específico
              </button>
            </div>

            {/* Seletor de mês específico */}
            {period === 'mes_especifico' && (
              <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                <SelectTrigger className="w-44 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MESES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {/* Filtro cidade / PDV */}
            <Select value={filtroCidade} onValueChange={setFiltroCidade}>
              <SelectTrigger className="w-44 h-8 text-sm"><SelectValue placeholder="PDV / Cidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os PDVs</SelectItem>
                {CIDADES.slice(1).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Filtro setor */}
            <Select value={filtroSetor} onValueChange={setFiltroSetor}>
              <SelectTrigger className="w-44 h-8 text-sm"><SelectValue placeholder="Setor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Setores</SelectItem>
                {SETORES.slice(1).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Badges de filtros ativos */}
            {(filtroCidade !== 'todos' || filtroSetor !== 'todos') && (
              <div className="flex items-center gap-2">
                {filtroCidade !== 'todos' && (
                  <Badge className="bg-primary/10 text-primary text-xs gap-1 cursor-pointer" onClick={() => setFiltroCidade('todos')}>
                    {filtroCidade} <X className="w-3 h-3" />
                  </Badge>
                )}
                {filtroSetor !== 'todos' && (
                  <Badge className="bg-amber-100 text-amber-700 text-xs gap-1 cursor-pointer" onClick={() => setFiltroSetor('todos')}>
                    {filtroSetor} <X className="w-3 h-3" />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border overflow-hidden relative">
              <div className="absolute inset-0 opacity-[0.03]" style={{ background: k.gradient }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{k.label}</p>
                    <p className="text-2xl font-bold font-grotesk leading-tight">{k.value}</p>
                    {k.extra}
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: k.gradient }}>
                    <k.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking PDV - barras horizontais com clique */}
        <Card className="border-border relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ranking de Desperdício por PDV</CardTitle>
            <p className="text-xs text-muted-foreground">Clique em uma barra para ver análise detalhada</p>
          </CardHeader>
          <CardContent className="relative">
            {rankingPDV.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados para o período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={rankingPDV} layout="vertical" onClick={(e) => {
                  if (e && e.activePayload) setPdvSelecionado(e.activePayload[0]?.payload?.name);
                }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip formatter={v => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Custo']} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} className="cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
            )}
            {/* Modal lateral de detalhe */}
            {pdvSelecionado && (
              <PDVModal
                pdv={pdvSelecionado}
                data={{ atual: dosPeriodo, anterior: doAnterior }}
                onClose={() => setPdvSelecionado(null)}
              />
            )}
          </CardContent>
        </Card>

        {/* Linha do tempo comparativa */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Custos de Reversa: 2026 vs 2025</CardTitle>
            <p className="text-xs text-muted-foreground">Evolução mês a mês dos últimos 12 meses</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Legend iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="anoAtual" name="2026" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="anoPassado" name="2025" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela auditoria rápida */}
      <Card className="border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Reversas do Período</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{dosPeriodo.length} registros • {filtroCidade !== 'todos' ? filtroCidade : 'Todos os PDVs'}</p>
          </div>
          <Button onClick={exportarRelatorio} size="sm" variant="outline" className="gap-2 text-xs">
            <Download className="w-3.5 h-3.5" /> Exportar para Financeiro
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {['Data', 'Protocolo', 'Setor', 'Origem', 'Destino', 'Modalidade', 'Custo Real'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dosPeriodo.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-sm text-muted-foreground">Sem reversas no período selecionado</td></tr>
                ) : dosPeriodo.slice(0, 15).map(s => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(s.created_date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-2.5 text-xs font-mono font-semibold text-primary">{s.protocolo || s.id?.slice(0, 10)}</td>
                    <td className="px-4 py-2.5 text-xs">{s.setor_solicitante || '—'}</td>
                    <td className="px-4 py-2.5 text-xs">{s.origem_cidade || '—'}</td>
                    <td className="px-4 py-2.5 text-xs">{s.destino_cidade || '—'}</td>
                    <td className="px-4 py-2.5 text-xs">{s.modalidade_confirmada || s.modalidade_sugerida || '—'}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-emerald-700">
                      {s.valor_custo ? `R$ ${Number(s.valor_custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>
                ))}
                {dosPeriodo.length > 15 && (
                  <tr><td colSpan={7} className="text-center py-3 text-xs text-muted-foreground">+ {dosPeriodo.length - 15} registros. Use "Exportar" para ver todos.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
