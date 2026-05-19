import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, RefreshCw, Filter, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TIPO_LABELS = {
  envio_comum: 'Envio Comum', logistica_reversa: 'Log. Reversa', coleta: 'Coleta',
  envio_cliente: 'Cliente', envio_influenciador: 'Influenciador',
  envio_interno_pdv: 'PDV', envio_loja_virtual: 'Loja Virtual',
  mercado_livre: 'Mercado Livre', call_center: 'Call Center', adm: 'ADM', estoque: 'Estoque',
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#6366f1'];

const months = Array.from({ length: 6 }, (_, i) => {
  const d = subMonths(new Date(), i);
  return { value: format(d, 'yyyy-MM'), label: format(d, "MMMM 'de' yyyy", { locale: ptBR }) };
});

export default function Relatorios() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState(months[0].value);

  useEffect(() => {
    base44.entities.Solicitacao.list('-created_date', 1000).then(data => {
      setSolicitacoes(data);
      setLoading(false);
    });
  }, []);

  const doMes = solicitacoes.filter(s => {
    const d = format(new Date(s.created_date), 'yyyy-MM');
    return d === mesSelecionado;
  });

  // KPIs
  const totalEnvios = doMes.length;
  const totalReversas = doMes.filter(s => s.tipo === 'logistica_reversa').length;
  const custoTotal = doMes.reduce((sum, s) => sum + (s.valor_custo || 0), 0);
  const finalizados = doMes.filter(s => s.status === 'finalizado').length;

  // Por modalidade
  const porModalidade = Object.entries(
    doMes.filter(s => s.modalidade_confirmada).reduce((acc, s) => {
      const mod = s.modalidade_confirmada.toUpperCase();
      acc[mod] = (acc[mod] || 0) + (s.valor_custo || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) })).sort((a, b) => b.value - a.value);

  // Por setor
  const porSetor = Object.entries(
    doMes.filter(s => s.setor_solicitante).reduce((acc, s) => {
      acc[s.setor_solicitante] = (acc[s.setor_solicitante] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Por tipo
  const porTipo = Object.entries(
    doMes.reduce((acc, s) => {
      const label = TIPO_LABELS[s.tipo] || s.tipo;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Por cidade destino
  const porCidade = Object.entries(
    doMes.filter(s => s.destino_cidade).reduce((acc, s) => {
      acc[s.destino_cidade] = (acc[s.destino_cidade] || 0) + (s.valor_custo || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) })).sort((a, b) => b.value - a.value).slice(0, 10);

  // Influenciadores
  const influenciadores = doMes.filter(s => s.tipo === 'envio_influenciador');
  const custoInfluenciadores = influenciadores.reduce((sum, s) => sum + (s.valor_custo || 0), 0);

  const exportCSV = () => {
    const headers = ['Protocolo', 'Data', 'Tipo', 'Setor', 'Responsável', 'Origem', 'Destino', 'Modalidade', 'Status', 'Custo', 'Rastreio'];
    const rows = doMes.map(s => [
      s.protocolo || '', format(new Date(s.created_date), 'dd/MM/yyyy HH:mm'),
      TIPO_LABELS[s.tipo] || s.tipo, s.setor_solicitante || '',
      s.responsavel_nome || '', s.origem_cidade || '',
      s.destino_cidade || '', s.modalidade_confirmada || s.modalidade_sugerida || '',
      s.status || '', s.valor_custo ? `R$ ${Number(s.valor_custo).toFixed(2)}` : '',
      s.codigo_rastreio || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logistica_${mesSelecionado}.csv`;
    a.click();
  };

  // Exportação executiva para o Financeiro (apenas reversas, colunas exigidas)
  const exportarFinanceiro = () => {
    const reversas = doMes.filter(s => s.tipo === 'logistica_reversa');
    const headers = ['Data', 'Protocolo', 'Setor', 'Origem', 'Destino', 'Modalidade', 'Custo Real'];
    const rows = reversas.map(s => [
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
    a.href = url;
    a.download = `reversas_financeiro_${mesSelecionado}.csv`;
    a.click();
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Relatórios</h2>
          <p className="text-sm text-muted-foreground">Análise de custos e desempenho logístico</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
            <SelectTrigger className="w-52 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={exportarFinanceiro} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <FileSpreadsheet className="w-4 h-4" /> Exportar Relatório para o Financeiro
          </Button>
          <Button onClick={exportCSV} size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Exportar CSV Completo
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de Envios', value: totalEnvios, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Reversas', value: totalReversas, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Custo Total', value: `R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Finalizados', value: finalizados, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(k => (
          <Card key={k.label} className="border-border">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</p>
              <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Custo por Modalidade</CardTitle>
          </CardHeader>
          <CardContent>
            {porModalidade.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porModalidade} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={v => `R$ ${Number(v).toFixed(2)}`} />
                  <Bar dataKey="value" fill="hsl(220,90%,50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Envios por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {porTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={porTipo} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {porTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Solicitações por Setor</CardTitle>
          </CardHeader>
          <CardContent>
            {porSetor.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porSetor.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Solicitações" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Custo por Cidade de Destino</CardTitle>
          </CardHeader>
          <CardContent>
            {porCidade.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porCidade}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                  <Tooltip formatter={v => `R$ ${Number(v).toFixed(2)}`} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </CardContent>
        </Card>
      </div>

      {/* Influenciadores */}
      {influenciadores.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Envios para Influenciadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Total de envios</p>
                <p className="text-xl font-bold">{influenciadores.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Custo total frete</p>
                <p className="text-xl font-bold text-red-600">R$ {custoInfluenciadores.toFixed(2)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50 border-b">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Influenciador</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Produto</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Destino</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Frete</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Retorno Esperado</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {influenciadores.map(s => (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2 text-xs">{s.influenciador_nome || s.destino_nome || '—'}</td>
                      <td className="px-3 py-2 text-xs">{s.descricao_item || '—'}</td>
                      <td className="px-3 py-2 text-xs">{s.destino_cidade || '—'}</td>
                      <td className="px-3 py-2 text-xs font-medium">{s.valor_custo ? `R$ ${Number(s.valor_custo).toFixed(2)}` : '—'}</td>
                      <td className="px-3 py-2 text-xs">{s.influenciador_retorno_esperado || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyChart() {
  return <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">Sem dados para este período</div>;
}
