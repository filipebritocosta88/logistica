import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import DashboardDiretoria from '@/components/DashboardDiretoria';
import { format, startOfMonth, endOfMonth, isToday, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  Package, RefreshCw, Truck, DollarSign, ArrowRight,
  Clock, CheckCircle2, TrendingUp, AlertCircle, BarChart3, ChevronDown
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

export const STATUS_LABELS = {
  solicitacao_criada: 'Criada',
  processando: 'Processando',
  aguardando_postagem: 'Aguard. Postagem',
  postado: 'Postado',
  aguardando_analise: 'Aguard. Análise',
  em_analise: 'Em Análise', aguardando_dados: 'Aguard. Dados',
  aprovado_envio: 'Aprovado', envio_realizado: 'Enviado',
  em_transporte: 'Em Transporte', entregue: 'Entregue',
  recebimento_confirmado: 'Recebido', finalizado: 'Finalizado', cancelado: 'Cancelado',
  endereco_incorreto: 'End. Incorreto', aguardando_pagamento: 'Aguard. Pgto',
  aguardando_coleta: 'Aguard. Coleta', coleta_nao_realizada: 'Coleta não realiz.',
  extraviado: 'Extraviado', atrasado: 'Atrasado', devolvido_remetente: 'Devolvido',
};

export const TIPO_LABELS = {
  envio_comum: 'Envio Comum', logistica_reversa: 'Log. Reversa', coleta: 'Coleta',
  envio_cliente: 'Cliente', envio_influenciador: 'Influenciador',
  envio_interno_pdv: 'PDV', envio_loja_virtual: 'Loja Virtual',
  mercado_livre: 'Mercado Livre', call_center: 'Call Center', adm: 'ADM', estoque: 'Estoque',
};

export function StatusBadge({ status }) {
  const config = {
    solicitacao_criada: 'bg-slate-100 text-slate-700',
    processando: 'bg-blue-100 text-blue-700',
    aguardando_postagem: 'bg-indigo-100 text-indigo-700',
    postado: 'bg-cyan-100 text-cyan-700',
    aguardando_analise: 'bg-amber-100 text-amber-700',
    em_analise: 'bg-blue-100 text-blue-700',
    aguardando_dados: 'bg-orange-100 text-orange-700',
    aprovado_envio: 'bg-indigo-100 text-indigo-700',
    envio_realizado: 'bg-cyan-100 text-cyan-700',
    em_transporte: 'bg-violet-100 text-violet-700',
    entregue: 'bg-green-100 text-green-700',
    recebimento_confirmado: 'bg-emerald-100 text-emerald-700',
    finalizado: 'bg-emerald-200 text-emerald-800',
    cancelado: 'bg-red-100 text-red-700',
    endereco_incorreto: 'bg-red-100 text-red-700',
    aguardando_pagamento: 'bg-amber-100 text-amber-700',
    aguardando_coleta: 'bg-orange-100 text-orange-700',
    extraviado: 'bg-red-200 text-red-800',
    atrasado: 'bg-red-100 text-red-700',
    devolvido_remetente: 'bg-slate-200 text-slate-700',
    coleta_nao_realizada: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config[status] || 'bg-slate-100 text-slate-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

const MODALIDADE_COLORS = { SEDEX: '#3b82f6', PAC: '#10b981' };
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

function ModalidadePieChart({ data }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    return (
      <g>
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#1e293b" className="font-bold" style={{ fontSize: 22, fontWeight: 700 }}>{value}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" style={{ fontSize: 12 }}>{payload.name}</text>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={52} outerRadius={78}
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            paddingAngle={3}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={MODALIDADE_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
              />
            ))}
          </Pie>
          <Tooltip formatter={(v, name) => [`${v} envios`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: MODALIDADE_COLORS[d.name] || PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-xs font-semibold text-foreground">{d.name}</span>
            <span className="text-xs text-muted-foreground">({d.value})</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">Total: {total} envios com modalidade</p>
    </div>
  );
}

function KPICard({ label, value, icon: Icon, gradient, subtitle, delay = 0, onClick, extra }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card
        className={`border-border overflow-hidden relative transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : ''}`}
        onClick={onClick}
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{ background: gradient }} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              <p className="text-2xl font-bold font-grotesk">{value}</p>
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
              {extra}
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: gradient }}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Dashboard para LOGISTICA / ADMIN
function DashboardLogistica({ solicitacoes, loading, load, blocos }) {
  const navigate = useNavigate();
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);

  const [blocoFiltro, setBlocoFiltro] = useState('');
  const solFiltradas = blocoFiltro ? solicitacoes.filter(s => s.bloco_id === blocoFiltro) : solicitacoes;
  const doMes = solFiltradas.filter(s => { const d = new Date(s.created_date); return d >= inicioMes && d <= fimMes; });

  // Período para o gasto
  const [gastoPeriodo, setGastoPeriodo] = useState('mes');
  const [gastoCustomInicio, setGastoCustomInicio] = useState('');
  const [gastoCustomFim, setGastoCustomFim] = useState('');
  const [gastoPopoverOpen, setGastoPopoverOpen] = useState(false);

  const getGastoPeriodoLabel = () => {
    const labels = { dia: 'Gasto do Dia', semana: 'Gasto da Semana', mes: 'Gasto do Mês', ano: 'Gasto do Ano', custom: 'Período Personalizado' };
    return labels[gastoPeriodo] || 'Gasto do Mês';
  };

  const calcularGasto = () => {
    let inicio, fim;
    if (gastoPeriodo === 'dia') { inicio = startOfDay(hoje); fim = endOfDay(hoje); }
    else if (gastoPeriodo === 'semana') { inicio = startOfWeek(hoje, { locale: ptBR }); fim = endOfWeek(hoje, { locale: ptBR }); }
    else if (gastoPeriodo === 'mes') { inicio = inicioMes; fim = fimMes; }
    else if (gastoPeriodo === 'ano') { inicio = startOfYear(hoje); fim = endOfYear(hoje); }
    else if (gastoPeriodo === 'custom' && gastoCustomInicio && gastoCustomFim) {
      inicio = new Date(gastoCustomInicio); fim = new Date(gastoCustomFim + 'T23:59:59');
    } else { inicio = inicioMes; fim = fimMes; }
    return solFiltradas.filter(s => { const d = new Date(s.created_date); return d >= inicio && d <= fim; })
      .reduce((sum, s) => sum + (s.valor_custo || 0), 0);
  };

  const hojeCount = solFiltradas.filter(s => isToday(new Date(s.created_date))).length;
  const reversasPendentes = solFiltradas.filter(s =>
    s.tipo === 'logistica_reversa' && !['finalizado', 'cancelado', 'recebimento_confirmado'].includes(s.status)
  ).length;
  const gastoValor = calcularGasto();
  const aguardando = solFiltradas.filter(s => ['solicitacao_criada', 'aguardando_analise', 'processando'].includes(s.status)).length;

  const modalidadeData = Object.entries(
    doMes.filter(s => s.modalidade_confirmada).reduce((acc, s) => {
      const key = s.modalidade_confirmada.trim().toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const recentes = solFiltradas.slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold font-grotesk">Dashboard Logística</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(hoje, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={blocoFiltro}
            onChange={e => setBlocoFiltro(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos os Blocos</option>
            {blocos.map(b => (
              <option key={b.id} value={b.id}>{b.nome}</option>
            ))}
          </select>
          <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Solicitações Hoje" value={hojeCount} icon={Package}
          gradient="linear-gradient(135deg,#6366f1,#818cf8)" delay={0}
          subtitle="Clique para ver"
          onClick={() => navigate('/solicitacoes?filtro=hoje')} />
        <KPICard label="Reversas Pendentes" value={reversasPendentes} icon={RefreshCw}
          gradient="linear-gradient(135deg,#f59e0b,#fbbf24)" delay={0.05}
          subtitle="Clique para ver"
          onClick={() => navigate('/solicitacoes?filtro=reversas_pendentes')} />
        <KPICard label="Aguardando Atendimento" value={aguardando} icon={Clock}
          gradient="linear-gradient(135deg,#ef4444,#f87171)" delay={0.1}
          subtitle="Clique para ver"
          onClick={() => navigate('/solicitacoes?filtro=aguardando')} />
        <KPICard
          label={getGastoPeriodoLabel()}
          value={`R$ ${gastoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign} gradient="linear-gradient(135deg,#10b981,#34d399)" delay={0.15}
          extra={
            <Popover open={gastoPopoverOpen} onOpenChange={setGastoPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={e => { e.stopPropagation(); setGastoPopoverOpen(true); }}
                >
                  Alterar período <ChevronDown className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" onClick={e => e.stopPropagation()}>
                <div className="space-y-1">
                  {[
                    { value: 'dia', label: 'Hoje' },
                    { value: 'semana', label: 'Esta Semana' },
                    { value: 'mes', label: 'Este Mês' },
                    { value: 'ano', label: 'Este Ano' },
                    { value: 'custom', label: 'Período Personalizado' },
                  ].map(opt => (
                    <button key={opt.value}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${gastoPeriodo === opt.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      onClick={() => { setGastoPeriodo(opt.value); if (opt.value !== 'custom') setGastoPopoverOpen(false); }}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {gastoPeriodo === 'custom' && (
                    <div className="pt-2 space-y-2 px-1">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">De:</p>
                        <Input type="date" value={gastoCustomInicio} onChange={e => setGastoCustomInicio(e.target.value)} className="h-7 text-xs" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Até:</p>
                        <Input type="date" value={gastoCustomFim} onChange={e => setGastoCustomFim(e.target.value)} className="h-7 text-xs" />
                      </div>
                      <Button size="sm" className="w-full h-7 text-xs" onClick={() => setGastoPopoverOpen(false)}>Aplicar</Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart modalidade */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Envios por Modalidade (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            {modalidadeData.length > 0 ? (
              <ModalidadePieChart data={modalidadeData} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados de modalidade
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo rápido */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Resumo do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Total de solicitações', value: doMes.length, color: 'text-indigo-600' },
              { label: 'Logísticas Reversas', value: doMes.filter(s => s.tipo === 'logistica_reversa').length, color: 'text-amber-600' },
              { label: 'Finalizados', value: doMes.filter(s => s.status === 'finalizado').length, color: 'text-emerald-600' },
              { label: 'Cancelados', value: doMes.filter(s => s.status === 'cancelado').length, color: 'text-red-600' },
              { label: 'Em Transporte', value: doMes.filter(s => s.status === 'em_transporte').length, color: 'text-violet-600' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recentes */}
      <Card className="border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Solicitações Recentes</CardTitle>
          <Link to="/solicitacoes">
            <Button variant="ghost" size="sm" className="gap-1 text-primary text-xs">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentes.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma solicitação</p>
            ) : recentes.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold font-mono text-primary">{s.protocolo || s.id?.slice(0, 8)}</span>
                    {s.prioridade !== 'normal' && (
                      <Badge className={s.prioridade === 'urgente' ? 'bg-orange-100 text-orange-700 text-xs' : 'bg-red-100 text-red-700 text-xs'}>
                        {s.prioridade}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {TIPO_LABELS[s.tipo] || s.tipo} • {s.origem_cidade || '—'} → {s.destino_cidade || '—'}
                  </p>
                </div>
                <StatusBadge status={s.status} />
                <span className="text-xs text-muted-foreground hidden md:block whitespace-nowrap">
                  {format(new Date(s.created_date), 'dd/MM HH:mm')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Dashboard para SOLICITANTE (visão do PDV)
function DashboardSolicitante({ solicitacoes, loading, load, user }) {
  const hoje = new Date();
  const inicioMes = startOfMonth(hoje);
  const fimMes = endOfMonth(hoje);
  const inicioSemana = startOfWeek(hoje, { locale: ptBR });
  const fimSemana = endOfWeek(hoje, { locale: ptBR });

  // Filtrar por bloco_id do usuário (ou por email caso não tenha bloco)
  const minhas = solicitacoes.filter(s =>
    user?.bloco_id
      ? s.bloco_id === user.bloco_id
      : s.created_by === user?.email
  );
  const doMes = minhas.filter(s => { const d = new Date(s.created_date); return d >= inicioMes && d <= fimMes; });
  const daSemana = minhas.filter(s => { const d = new Date(s.created_date); return d >= inicioSemana && d <= fimSemana; });
  const deHoje = minhas.filter(s => isToday(new Date(s.created_date)));

  const gastoMes = doMes.reduce((sum, s) => sum + (s.valor_custo || 0), 0);
  const pendentes = minhas.filter(s => !['finalizado', 'cancelado', 'recebimento_confirmado'].includes(s.status));
  const reversasPendentes = pendentes.filter(s => s.tipo === 'logistica_reversa');

  const modalidadeData = Object.entries(
    doMes.filter(s => s.modalidade_confirmada || s.modalidade_sugerida).reduce((acc, s) => {
      const key = (s.modalidade_confirmada || s.modalidade_sugerida || '').trim().toUpperCase();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const recentes = minhas.slice(0, 4);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-grotesk">Meu Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Olá, {user?.full_name?.split(' ')[0] || 'usuário'} — {format(hoje, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Envios Hoje" value={deHoje.length} icon={Package}
          gradient="linear-gradient(135deg,#6366f1,#818cf8)" delay={0} />
        <KPICard label="Esta Semana" value={daSemana.length} icon={TrendingUp}
          gradient="linear-gradient(135deg,#3b82f6,#60a5fa)" delay={0.05} />
        <KPICard label="Log. Reversas Pendentes" value={reversasPendentes.length} icon={AlertCircle}
          gradient="linear-gradient(135deg,#f59e0b,#fbbf24)" delay={0.1} />
        <KPICard label="Gasto do Mês" value={`R$ ${gastoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign} gradient="linear-gradient(135deg,#10b981,#34d399)" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PAC vs SEDEX */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">PAC vs SEDEX (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            {modalidadeData.length > 0 ? (
              <ModalidadePieChart data={modalidadeData} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pendentes */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pendentes ({pendentes.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-[200px] overflow-y-auto">
              {pendentes.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  Tudo em dia!
                </div>
              ) : pendentes.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold font-mono">{s.protocolo || s.id?.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{s.destino_cidade || '—'}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico recente */}
      <Card className="border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Últimas Solicitações</CardTitle>
          <Link to="/minhas-solicitacoes">
            <Button variant="ghost" size="sm" className="gap-1 text-primary text-xs">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentes.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma solicitação ainda</p>
            ) : recentes.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-primary">{s.protocolo || s.id?.slice(0, 8)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {TIPO_LABELS[s.tipo]} • {s.origem_cidade || '—'} → {s.destino_cidade || '—'}
                  </p>
                </div>
                <StatusBadge status={s.status} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(s.created_date), 'dd/MM HH:mm')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// DashboardDiretoria é importado de @/components/DashboardDiretoria

export default function Dashboard() {
  const { user } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [blocos, setBlocos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [data, bl] = await Promise.all([
      base44.entities.Solicitacao.list('-created_date', 500),
      base44.entities.Bloco.list('nome', 100),
    ]);
    setSolicitacoes(data);
    setBlocos(bl);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  const role = user?.role;

  if (role === 'solicitante') {
    return <DashboardSolicitante solicitacoes={solicitacoes} loading={loading} load={load} user={user} />;
  }
  if (role === 'diretoria') {
    return <DashboardDiretoria solicitacoes={solicitacoes} loading={loading} load={load} blocos={blocos} />;
  }
  return <DashboardLogistica solicitacoes={solicitacoes} loading={loading} load={load} blocos={blocos} />;
}
