import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft, MapPin, Package, Truck, Clock,
  CheckCircle2, Upload, Save, ExternalLink, Copy, ClipboardPaste
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { StatusBadge, STATUS_LABELS } from '@/pages/Dashboard';

const STATUS_OPTIONS = [
  { value: 'solicitacao_criada', label: 'Solicitação Criada' },
  { value: 'processando', label: 'Processando' },
  { value: 'aguardando_postagem', label: 'Aguardando Postagem' },
  { value: 'postado', label: 'Postado' },
  { value: 'aguardando_analise', label: 'Aguardando Análise' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'aguardando_dados', label: 'Aguardando Dados' },
  { value: 'aprovado_envio', label: 'Aprovado para Envio' },
  { value: 'envio_realizado', label: 'Envio Realizado' },
  { value: 'em_transporte', label: 'Em Transporte' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'recebimento_confirmado', label: 'Recebimento Confirmado' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'endereco_incorreto', label: 'Endereço Incorreto' },
  { value: 'aguardando_pagamento', label: 'Aguardando Pagamento' },
  { value: 'aguardando_coleta', label: 'Aguardando Coleta' },
  { value: 'coleta_nao_realizada', label: 'Coleta Não Realizada' },
  { value: 'extraviado', label: 'Extraviado' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'devolvido_remetente', label: 'Devolvido ao Remetente' },
];

const TIPO_LABELS = {
  envio_comum: 'Envio Comum', logistica_reversa: 'Logística Reversa', coleta: 'Coleta',
  envio_cliente: 'Envio para Cliente', envio_influenciador: 'Envio para Influenciador',
  envio_interno_pdv: 'Envio Interno PDV', envio_loja_virtual: 'Loja Virtual',
  mercado_livre: 'Mercado Livre', call_center: 'Call Center', adm: 'ADM', estoque: 'Estoque',
};

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function SolicitacaoDetalhes({ solicitacao: initialData, onBack }) {
  const { user } = useAuth();
  const [s, setS] = useState(initialData);
  const [logistica, setLogistica] = useState({
    status: s.status,
    responsavel_atendimento: s.responsavel_atendimento || '',
    modalidade_confirmada: s.modalidade_confirmada || '',
    transportadora_utilizada: s.transportadora_utilizada || '',
    codigo_rastreio: s.codigo_rastreio || '',
    valor_custo: s.valor_custo || '',
    previsao_entrega: s.previsao_entrega || '',
    data_envio: s.data_envio || '',
    observacao_interna: s.observacao_interna || '',
    autorizacao_postagem: s.autorizacao_postagem || '',
  });
  const [postagem, setPostagem] = useState({
    codigo_rastreio: s.codigo_rastreio || '',
    valor_custo: s.valor_custo || '',
    data_envio: s.data_envio || '',
  });
  const [recebimento, setRecebimento] = useState({
    data_recebimento: s.data_recebimento || '',
    recebido_por: s.recebido_por || '',
    status_recebimento: s.status_recebimento || '',
    observacao_recebimento: s.observacao_recebimento || '',
  });
  const [saving, setSaving] = useState(false);
  const [savingPostagem, setSavingPostagem] = useState(false);
  const [uploadingComp, setUploadingComp] = useState(false);

  const role = user?.role;
  const isLogistica = role === 'admin' || role === 'logistica';

  // Auto-muda status para "processando" quando logística abre uma solicitação criada
  useEffect(() => {
    if (isLogistica && s.status === 'solicitacao_criada') {
      const historico = [...(s.historico || []), {
        data: new Date().toISOString(),
        usuario: user?.full_name || user?.email || 'Sistema',
        acao: 'Solicitação em processamento'
      }];
      base44.entities.Solicitacao.update(s.id, { status: 'processando', historico });
      setS(prev => ({ ...prev, status: 'processando', historico }));
      setLogistica(prev => ({ ...prev, status: 'processando' }));
    }
  }, []);

  const addHistorico = (acao) => {
    const entry = { data: new Date().toISOString(), usuario: user?.full_name || user?.email || 'Sistema', acao };
    return [...(s.historico || []), entry];
  };

  const handleSaveLogistica = async () => {
    setSaving(true);
    const historico = addHistorico(`Status: ${STATUS_LABELS[logistica.status] || logistica.status}`);
    // Se preencheu autorização de postagem e status ainda é processando, muda para aguardando_postagem
    let statusFinal = logistica.status;
    if (logistica.autorizacao_postagem && logistica.status === 'processando') {
      statusFinal = 'aguardando_postagem';
      historico.push({ data: new Date().toISOString(), usuario: user?.full_name || user?.email, acao: 'Dados de emissão enviados - aguardando postagem pelo solicitante' });
    }
    await base44.entities.Solicitacao.update(s.id, { ...logistica, status: statusFinal, historico, valor_custo: logistica.valor_custo ? Number(logistica.valor_custo) : undefined });
    setS(prev => ({ ...prev, ...logistica, status: statusFinal, historico }));
    setLogistica(prev => ({ ...prev, status: statusFinal }));
    toast.success('Atendimento salvo!');
    setSaving(false);
  };

  const handleSavePostagem = async () => {
    setSavingPostagem(true);
    const historico = addHistorico(`Postagem realizada - Rastreio: ${postagem.codigo_rastreio}`);
    await base44.entities.Solicitacao.update(s.id, {
      codigo_rastreio: postagem.codigo_rastreio,
      valor_custo: postagem.valor_custo ? Number(postagem.valor_custo) : undefined,
      data_envio: postagem.data_envio,
      status: 'postado',
      historico
    });
    setS(prev => ({ ...prev, ...postagem, valor_custo: postagem.valor_custo ? Number(postagem.valor_custo) : prev.valor_custo, status: 'postado', historico }));
    toast.success('Postagem registrada com sucesso!');
    setSavingPostagem(false);
  };

  const handleSaveRecebimento = async () => {
    setSaving(true);
    const historico = addHistorico(`Recebimento: ${recebimento.status_recebimento}`);
    await base44.entities.Solicitacao.update(s.id, { ...recebimento, historico });
    setS(prev => ({ ...prev, ...recebimento, historico }));
    toast.success('Recebimento registrado!');
    setSaving(false);
  };

  const handleUploadComprovante = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingComp(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const historico = addHistorico('Comprovante de envio anexado');
    await base44.entities.Solicitacao.update(s.id, { comprovante_url: file_url, historico });
    setS(prev => ({ ...prev, comprovante_url: file_url, historico }));
    toast.success('Comprovante anexado!');
    setUploadingComp(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold font-mono">{s.protocolo}</h2>
            <StatusBadge status={s.status} />
            {s.prioridade !== 'normal' && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${s.prioridade === 'urgente' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                {s.prioridade}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {TIPO_LABELS[s.tipo] || s.tipo} • {format(new Date(s.created_date), "dd/MM/yyyy 'às' HH:mm")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Col principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Origem / Destino */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Origem', prefix: 'origem' },
              { title: 'Destino', prefix: 'destino' },
            ].map(({ title, prefix }) => (
              <Card key={prefix} className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <InfoRow label={prefix === 'origem' ? 'Remetente' : 'Destinatário'} value={s[`${prefix}_nome`]} />
                  <InfoRow label="Cidade/Estado" value={s[`${prefix}_cidade`] && s[`${prefix}_estado`] ? `${s[`${prefix}_cidade`]}/${s[`${prefix}_estado`]}` : s[`${prefix}_cidade`]} />
                  <InfoRow label="Endereço" value={[s[`${prefix}_endereco`], s[`${prefix}_numero`], s[`${prefix}_bairro`]].filter(Boolean).join(', ')} />
                  <InfoRow label="CEP" value={s[`${prefix}_cep`]} />
                  <InfoRow label="Telefone" value={s[`${prefix}_telefone`]} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Item */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Informações do Envio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <InfoRow label="Descrição" value={s.descricao_item} />
                <InfoRow label="Categoria" value={s.categoria_envio} />
                <InfoRow label="Volumes" value={s.quantidade_volumes} />
                <InfoRow label="Peso" value={s.peso_estimado ? `${s.peso_estimado} kg` : null} />
                <InfoRow label="Valor Declarado" value={s.valor_declarado ? `R$ ${Number(s.valor_declarado).toFixed(2)}` : null} />
                <InfoRow label="Modalidade Sugerida" value={s.modalidade_sugerida} />
                <InfoRow label="Setor" value={s.setor_solicitante} />
                <InfoRow label="Responsável" value={s.responsavel_nome} />
              </div>
              {s.observacoes_solicitante && (
                <div className="mt-3 p-3 bg-muted/40 rounded-xl text-sm">
                  <p className="text-xs text-muted-foreground mb-1 font-semibold">Observações:</p>
                  {s.observacoes_solicitante}
                </div>
              )}
              <div className="flex gap-2 flex-wrap mt-3">
                {s.necessita_nota_fiscal && <Badge variant="secondary" className="text-xs">Nota Fiscal</Badge>}
                {s.possui_bateria && <Badge variant="secondary" className="text-xs">Possui Bateria</Badge>}
                {s.possui_item_fragil && <Badge variant="secondary" className="text-xs">Item Frágil</Badge>}
                {s.precisa_coleta && <Badge variant="secondary" className="text-xs">Precisa Coleta</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Autorização de Postagem (visível para todos) */}
          {s.autorizacao_postagem && (
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-indigo-700 uppercase flex items-center gap-1.5">
                    <ClipboardPaste className="w-3.5 h-3.5" /> Autorização de Postagem
                  </CardTitle>
                  <button
                    onClick={() => { navigator.clipboard.writeText(s.autorizacao_postagem); toast.success('Copiado!'); }}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-indigo-900 whitespace-pre-wrap font-mono leading-relaxed bg-white/60 p-3 rounded-lg border border-indigo-100">
                  {s.autorizacao_postagem}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Seção de Postagem - visível para o SOLICITANTE quando aguardando postagem */}
          {!isLogistica && s.status === 'aguardando_postagem' && (
            <Card className="border-cyan-200 bg-cyan-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-cyan-700 uppercase flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Registrar Postagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-cyan-700 bg-cyan-100 p-2 rounded-lg">
                  A logística já preparou a autorização de postagem. Por favor, realize a postagem e preencha os dados abaixo.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">Código de Rastreio *</Label>
                    <Input value={postagem.codigo_rastreio} onChange={e => setPostagem(p => ({ ...p, codigo_rastreio: e.target.value }))} className="mt-1 h-8 text-sm font-mono" placeholder="Ex: AB123456789BR" />
                  </div>
                  <div>
                    <Label className="text-xs">Valor do Custo (R$)</Label>
                    <Input type="number" step="0.01" value={postagem.valor_custo} onChange={e => setPostagem(p => ({ ...p, valor_custo: e.target.value }))} className="mt-1 h-8 text-sm" placeholder="0,00" />
                  </div>
                  <div>
                    <Label className="text-xs">Data da Postagem</Label>
                    <Input type="date" value={postagem.data_envio} onChange={e => setPostagem(p => ({ ...p, data_envio: e.target.value }))} className="mt-1 h-8 text-sm" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSavePostagem} disabled={savingPostagem || !postagem.codigo_rastreio} size="sm" className="gap-2 bg-cyan-600 hover:bg-cyan-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {savingPostagem ? 'Salvando...' : 'Confirmar Postagem'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Atendimento Logístico - só logistica/admin */}
          {isLogistica && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Atendimento Logístico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Autorização de Postagem - campo para colar */}
                <div>
                  <Label className="text-xs font-semibold text-indigo-700">
                    Cole aqui a Autorização de Postagem (Easy Courier / Correios)
                  </Label>
                  <Textarea
                    value={logistica.autorizacao_postagem}
                    onChange={e => setLogistica(l => ({ ...l, autorizacao_postagem: e.target.value }))}
                    placeholder="Cole aqui o texto completo da autorização de postagem gerada..."
                    className="mt-1 text-xs font-mono resize-none bg-indigo-50/50 border-indigo-200 focus:border-indigo-400"
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">Status</Label>
                    <Select value={logistica.status} onValueChange={v => setLogistica(l => ({ ...l, status: v }))}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Responsável Atendimento</Label>
                    <Input value={logistica.responsavel_atendimento} onChange={e => setLogistica(l => ({ ...l, responsavel_atendimento: e.target.value }))} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Modalidade Confirmada</Label>
                    <Select value={logistica.modalidade_confirmada} onValueChange={v => setLogistica(l => ({ ...l, modalidade_confirmada: v }))}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SEDEX">SEDEX</SelectItem>
                        <SelectItem value="PAC">PAC</SelectItem>
                        <SelectItem value="OUTROS">OUTROS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Transportadora</Label>
                    <Input value={logistica.transportadora_utilizada} onChange={e => setLogistica(l => ({ ...l, transportadora_utilizada: e.target.value }))} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Código de Rastreio</Label>
                    <Input value={logistica.codigo_rastreio} onChange={e => setLogistica(l => ({ ...l, codigo_rastreio: e.target.value }))} className="mt-1 h-8 text-sm font-mono" />
                  </div>
                  <div>
                    <Label className="text-xs">Valor do Custo (R$)</Label>
                    <Input type="number" step="0.01" value={logistica.valor_custo} onChange={e => setLogistica(l => ({ ...l, valor_custo: e.target.value }))} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Previsão de Entrega</Label>
                    <Input type="date" value={logistica.previsao_entrega} onChange={e => setLogistica(l => ({ ...l, previsao_entrega: e.target.value }))} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Data do Envio</Label>
                    <Input type="date" value={logistica.data_envio} onChange={e => setLogistica(l => ({ ...l, data_envio: e.target.value }))} className="mt-1 h-8 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Observação Interna</Label>
                    <Textarea value={logistica.observacao_interna} onChange={e => setLogistica(l => ({ ...l, observacao_interna: e.target.value }))} className="mt-1 text-sm resize-none" rows={2} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Comprovante de Envio</Label>
                    <div className="mt-1 flex items-center gap-3">
                      <label className="cursor-pointer">
                        <input type="file" className="hidden" onChange={handleUploadComprovante} accept="image/*,application/pdf" />
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                          <Upload className="w-3.5 h-3.5" /> {uploadingComp ? 'Enviando...' : 'Anexar Comprovante'}
                        </span>
                      </label>
                      {s.comprovante_url && (
                        <a href={s.comprovante_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" /> Ver comprovante
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveLogistica} disabled={saving} size="sm" className="gap-2">
                    <Save className="w-3.5 h-3.5" /> {saving ? 'Salvando...' : 'Salvar Atendimento'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recebimento - só logistica/admin */}
          {isLogistica && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmação de Recebimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Data de Recebimento</Label>
                    <Input type="date" value={recebimento.data_recebimento} onChange={e => setRecebimento(r => ({ ...r, data_recebimento: e.target.value }))} className="mt-1 h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Recebido Por</Label>
                    <Input value={recebimento.recebido_por} onChange={e => setRecebimento(r => ({ ...r, recebido_por: e.target.value }))} className="mt-1 h-8 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Status do Recebimento</Label>
                    <Select value={recebimento.status_recebimento} onValueChange={v => setRecebimento(r => ({ ...r, status_recebimento: v }))}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recebido_corretamente">Recebido Corretamente</SelectItem>
                        <SelectItem value="recebido_com_avaria">Recebido com Avaria</SelectItem>
                        <SelectItem value="recebido_parcialmente">Recebido Parcialmente</SelectItem>
                        <SelectItem value="nao_recebido">Não Recebido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Observação</Label>
                    <Textarea value={recebimento.observacao_recebimento} onChange={e => setRecebimento(r => ({ ...r, observacao_recebimento: e.target.value }))} className="mt-1 text-sm resize-none" rows={2} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveRecebimento} disabled={saving} size="sm" variant="outline" className="gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Recebimento
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Histórico */}
        <div className="space-y-4">
          {s.codigo_rastreio && (
            <Card className="border-indigo-200 bg-indigo-50/60">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-indigo-700 mb-1">Código de Rastreio</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-bold text-indigo-900 flex-1">{s.codigo_rastreio}</p>
                  <button onClick={() => { navigator.clipboard.writeText(s.codigo_rastreio); toast.success('Copiado!'); }}>
                    <Copy className="w-3.5 h-3.5 text-indigo-500 hover:text-indigo-700" />
                  </button>
                </div>
                {s.previsao_entrega && (
                  <p className="text-xs text-indigo-600 mt-1">Previsão: {format(new Date(s.previsao_entrega), 'dd/MM/yyyy')}</p>
                )}
              </CardContent>
            </Card>
          )}

          {s.valor_custo > 0 && (
            <Card className="border-emerald-200 bg-emerald-50/60">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-1">Custo do Envio</p>
                <p className="text-2xl font-bold text-emerald-800">R$ {Number(s.valor_custo).toFixed(2)}</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-4 py-3 space-y-0">
                {(!s.historico || s.historico.length === 0) ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Nenhum histórico</p>
                ) : [...s.historico].reverse().map((h, i) => (
                  <div key={i} className="flex gap-3 pb-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                      {i < s.historico.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{h.acao}</p>
                      <p className="text-xs text-muted-foreground">{h.usuario}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(h.data), "dd/MM/yy 'às' HH:mm")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
