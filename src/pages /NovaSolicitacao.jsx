import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { Check, ChevronDown, Search, ArrowLeft, Save, AlertCircle, MapPin, User, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TIPOS = [
  { value: 'envio_comum', label: 'Envio Comum' },
  { value: 'logistica_reversa', label: 'Logística Reversa' },
  { value: 'coleta', label: 'Coleta' },
  { value: 'envio_cliente', label: 'Envio para Cliente' },
  { value: 'envio_influenciador', label: 'Envio para Influenciador' },
  { value: 'envio_interno_pdv', label: 'Envio Interno entre PDVs' },
  { value: 'envio_loja_virtual', label: 'Envio Loja Virtual' },
  { value: 'mercado_livre', label: 'Mercado Livre' },
  { value: 'call_center', label: 'Call Center' },
  { value: 'adm', label: 'ADM' },
  { value: 'estoque', label: 'Estoque' },
];

const CATEGORIAS = [
  { value: 'peca', label: 'Peça' },
  { value: 'produto', label: 'Produto' },
  { value: 'documento', label: 'Documento' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'brinde', label: 'Brinde' },
  { value: 'material_marketing', label: 'Material de Marketing' },
  { value: 'influenciador', label: 'Influenciador' },
  { value: 'garantia', label: 'Garantia' },
  { value: 'devolucao', label: 'Devolução' },
  { value: 'outros', label: 'Outros' },
];

const MODALIDADES = [
  { value: 'SEDEX', label: 'SEDEX' },
  { value: 'PAC', label: 'PAC' },
];

function generateProtocolo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `LOG-${year}${month}${day}-${rand}`;
}

function SearchableSelect({ options, value, onChange, placeholder, displayKey = 'label', valueKey = 'value' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter(o => {
    const text = typeof o === 'string' ? o : o[displayKey] || '';
    return text.toLowerCase().includes(search.toLowerCase());
  });
  const selectedLabel = value
    ? (typeof options[0] === 'string' ? value : options.find(o => o[valueKey] === value)?.[displayKey] || value)
    : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-input rounded-lg bg-card text-sm hover:border-primary/50 transition-colors"
      >
        <span className={selectedLabel ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                className="flex-1 bg-transparent text-sm outline-none"
                placeholder="Pesquisar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-center py-3 text-muted-foreground text-sm">Nenhum resultado</p>
            ) : filtered.map((o, i) => {
              const label = typeof o === 'string' ? o : o[displayKey];
              const val = typeof o === 'string' ? o : o[valueKey];
              return (
                <button
                  key={i}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center justify-between"
                  onClick={() => { onChange(val); setOpen(false); setSearch(''); }}
                >
                  {label}
                  {value === val && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AddressSection({ prefix, title, icon: Icon, data, onChange, responsaveis, pdvs, showAutoFill = true }) {
  const [mode, setMode] = useState('manual');
  const [respSearch, setRespSearch] = useState('');

  const handleResponsavel = (id) => {
    const r = responsaveis.find(r => r.id === id);
    if (r) {
      onChange({
        [`${prefix}_nome`]: r.nome,
        [`${prefix}_cidade`]: r.cidade,
        [`${prefix}_estado`]: r.estado,
        [`${prefix}_endereco`]: r.endereco,
        [`${prefix}_numero`]: r.numero,
        [`${prefix}_complemento`]: r.complemento,
        [`${prefix}_bairro`]: r.bairro,
        [`${prefix}_cep`]: r.cep,
        [`${prefix}_cpf`]: r.cpf_cnpj,
        [`${prefix}_telefone`]: r.telefone,
        [`${prefix}_email`]: r.email,
      });
    }
  };

  const handlePDV = (id) => {
    const p = pdvs.find(p => p.id === id);
    if (p) {
      onChange({
        [`${prefix}_nome`]: p.responsavel_principal || p.nome,
        [`${prefix}_cidade`]: p.cidade,
        [`${prefix}_estado`]: p.estado,
        [`${prefix}_endereco`]: p.endereco,
        [`${prefix}_numero`]: p.numero,
        [`${prefix}_complemento`]: p.complemento,
        [`${prefix}_bairro`]: p.bairro,
        [`${prefix}_cep`]: p.cep,
        [`${prefix}_telefone`]: p.telefone,
        [`${prefix}_email`]: p.email,
      });
    }
  };

  const field = (key) => `${prefix}_${key}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </div>
      {showAutoFill && (
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setMode('responsavel')}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              mode === 'responsavel' ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50")}
          >
            Por Responsável
          </button>
          <button
            type="button"
            onClick={() => setMode('pdv')}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              mode === 'pdv' ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50")}
          >
            Por PDV/Cidade
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              mode === 'manual' ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/50")}
          >
            Manual
          </button>
        </div>
      )}

      {mode === 'responsavel' && (
        <div className="mb-3">
          <Label className="text-xs mb-1 block">Selecionar Responsável</Label>
          <SearchableSelect
            options={responsaveis.map(r => ({ value: r.id, label: `${r.nome} (${r.cidade || 'sem cidade'})` }))}
            onChange={handleResponsavel}
            placeholder="Pesquisar responsável..."
          />
        </div>
      )}
      {mode === 'pdv' && (
        <div className="mb-3">
          <Label className="text-xs mb-1 block">Selecionar PDV/Cidade</Label>
          <SearchableSelect
            options={pdvs.map(p => ({ value: p.id, label: `${p.nome} — ${p.cidade}/${p.estado}` }))}
            onChange={handlePDV}
            placeholder="Pesquisar PDV..."
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs">Nome do {prefix === 'origem' ? 'Remetente' : 'Destinatário'}</Label>
          <Input value={data[field('nome')] || ''} onChange={e => onChange({ [field('nome')]: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Cidade</Label>
          <Input value={data[field('cidade')] || ''} onChange={e => onChange({ [field('cidade')]: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Estado (UF)</Label>
          <Input value={data[field('estado')] || ''} onChange={e => onChange({ [field('estado')]: e.target.value })} maxLength={2} className="mt-1 h-8 text-sm" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Endereço</Label>
          <Input value={data[field('endereco')] || ''} onChange={e => onChange({ [field('endereco')]: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Número</Label>
          <Input value={data[field('numero')] || ''} onChange={e => onChange({ [field('numero')]: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Complemento</Label>
          <Input value={data[field('complemento')] || ''} onChange={e => onChange({ [field('complemento')]: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Bairro</Label>
          <Input value={data[field('bairro')] || ''} onChange={e => onChange({ [field('bairro')]: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">CEP</Label>
          <Input value={data[field('cep')] || ''} onChange={e => onChange({ [field('cep')]: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Telefone</Label>
          <Input value={data[field('telefone')] || ''} onChange={e => onChange({ [field('telefone')]: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">CPF/CNPJ</Label>
          <Input value={data[field('cpf')] || ''} onChange={e => onChange({ [field('cpf')]: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">E-mail</Label>
          <Input value={data[field('email')] || ''} onChange={e => onChange({ [field('email')]: e.target.value })} className="mt-1 h-8 text-sm" />
        </div>
      </div>
    </div>
  );
}

export default function NovaSolicitacao() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [responsaveis, setResponsaveis] = useState([]);
  const [pdvs, setPdvs] = useState([]);
  const [setores, setSetores] = useState([]);

  const [form, setForm] = useState({
    protocolo: generateProtocolo(),
    tipo: '',
    prioridade: 'normal',
    setor_solicitante: '',
    responsavel_nome: '',
    responsavel_email: '',
    responsavel_telefone: '',
    responsavel_cpf: '',
    responsavel_id: '',
    origem_nome: '', origem_cidade: '', origem_estado: '', origem_endereco: '',
    origem_numero: '', origem_complemento: '', origem_bairro: '', origem_cep: '',
    origem_cpf: '', origem_telefone: '', origem_email: '',
    destino_nome: '', destino_cidade: '', destino_estado: '', destino_endereco: '',
    destino_numero: '', destino_complemento: '', destino_bairro: '', destino_cep: '',
    destino_cpf: '', destino_telefone: '', destino_email: '',
    descricao_item: '',
    categoria_envio: '',
    quantidade_volumes: 1,
    peso_estimado: '',
    valor_declarado: '',
    necessita_nota_fiscal: false,
    possui_bateria: false,
    possui_item_fragil: false,
    precisa_coleta: false,
    observacoes_solicitante: '',
    modalidade_sugerida: '',
    influenciador_nome: '',
    influenciador_retorno_esperado: '',
    valor_produto: '',
  });

  useEffect(() => {
    Promise.all([
      base44.entities.Responsavel.list(),
      base44.entities.PDV.list(),
      base44.entities.Setor.list(),
    ]).then(([r, p, s]) => {
      setResponsaveis(r);
      setPdvs(p);
      setSetores(s);
    });
  }, []);

  const updateForm = (updates) => setForm(prev => ({ ...prev, ...updates }));

  const handleResponsavelSolicitante = (id) => {
    const r = responsaveis.find(r => r.id === id);
    if (r) {
      updateForm({
        responsavel_id: id,
        responsavel_nome: r.nome,
        responsavel_email: r.email,
        responsavel_telefone: r.telefone,
        responsavel_cpf: r.cpf_cnpj,
        origem_nome: r.nome,
        origem_cidade: r.cidade,
        origem_estado: r.estado,
        origem_endereco: r.endereco,
        origem_numero: r.numero,
        origem_complemento: r.complemento,
        origem_bairro: r.bairro,
        origem_cep: r.cep,
        origem_cpf: r.cpf_cnpj,
        origem_telefone: r.telefone,
        origem_email: r.email,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tipo) { toast.error('Selecione o tipo de solicitação'); return; }
    if (!form.modalidade_sugerida) { toast.error('Selecione a modalidade (SEDEX ou PAC)'); return; }
    if (!form.origem_cidade) { toast.error('Informe a cidade de origem'); return; }
    if (!form.destino_cidade) { toast.error('Informe a cidade de destino'); return; }

    setSaving(true);
    const historico = [{
      data: new Date().toISOString(),
      usuario: currentUser?.full_name || currentUser?.email || 'Usuário',
      acao: 'Solicitação criada',
    }];

    await base44.entities.Solicitacao.create({
      ...form,
      status: 'solicitacao_criada',
      historico,
      bloco_id: currentUser?.bloco_id || form.bloco_id || undefined,
      quantidade_volumes: Number(form.quantidade_volumes) || 1,
      peso_estimado: form.peso_estimado ? Number(form.peso_estimado) : undefined,
      valor_declarado: form.valor_declarado ? Number(form.valor_declarado) : undefined,
      valor_produto: form.valor_produto ? Number(form.valor_produto) : undefined,
    });

    toast.success(`Solicitação ${form.protocolo} criada com sucesso!`);
    navigate('/solicitacoes');
  };

  const isInfluenciador = form.tipo === 'envio_influenciador';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Nova Solicitação</h2>
          <p className="text-xs text-muted-foreground">Protocolo: <span className="font-mono font-semibold text-primary">{form.protocolo}</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo e Prioridade */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Dados da Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Tipo de Solicitação *</Label>
                <div className="mt-1">
                  <SearchableSelect
                    options={TIPOS}
                    value={form.tipo}
                    onChange={v => updateForm({ tipo: v })}
                    placeholder="Selecione o tipo..."
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Prioridade *</Label>
                <div className="flex gap-2 mt-1">
                  {['normal', 'urgente', 'emergencial'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateForm({ prioridade: p })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors capitalize",
                        form.prioridade === p
                          ? p === 'normal' ? 'bg-slate-700 text-white border-slate-700'
                            : p === 'urgente' ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-red-600 text-white border-red-600'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Setor Solicitante (opcional)</Label>
                <div className="mt-1">
                  <SearchableSelect
                    options={setores.map(s => ({ value: s.nome, label: s.nome }))}
                    value={form.setor_solicitante}
                    onChange={v => updateForm({ setor_solicitante: v })}
                    placeholder="Selecionar setor..."
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Responsável Solicitante (opcional)</Label>
                <div className="mt-1">
                  <SearchableSelect
                    options={responsaveis.map(r => ({ value: r.id, label: `${r.nome} (${r.cidade || 'sem cidade'})` }))}
                    onChange={handleResponsavelSolicitante}
                    placeholder="Pesquisar responsável..."
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Origem e Destino */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardContent className="p-5">
              <AddressSection
                prefix="origem"
                title="Origem (Remetente)"
                icon={MapPin}
                data={form}
                onChange={updateForm}
                responsaveis={responsaveis}
                pdvs={pdvs}
              />
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-5">
              <AddressSection
                prefix="destino"
                title="Destino (Destinatário)"
                icon={MapPin}
                data={form}
                onChange={updateForm}
                responsaveis={responsaveis}
                pdvs={pdvs}
              />
            </CardContent>
          </Card>
        </div>

        {/* Informações do Envio */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Informações do Envio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-xs">Descrição do Item</Label>
                <Input value={form.descricao_item} onChange={e => updateForm({ descricao_item: e.target.value })} className="mt-1 h-8 text-sm" placeholder="Descreva o item a ser enviado..." />
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <div className="mt-1">
                  <SearchableSelect
                    options={CATEGORIAS}
                    value={form.categoria_envio}
                    onChange={v => updateForm({ categoria_envio: v })}
                    placeholder="Selecionar categoria..."
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Modalidade *</Label>
                <div className="flex gap-2 mt-1">
                  {MODALIDADES.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => updateForm({ modalidade_sugerida: m.value })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors",
                        form.modalidade_sugerida === m.value
                          ? m.value === 'SEDEX'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-emerald-600 text-white border-emerald-600'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {!form.modalidade_sugerida && (
                  <p className="text-xs text-red-500 mt-1">Obrigatório selecionar a modalidade</p>
                )}
              </div>
              <div>
                <Label className="text-xs">Qtd. Volumes</Label>
                <Input type="number" min="1" value={form.quantidade_volumes} onChange={e => updateForm({ quantidade_volumes: e.target.value })} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Peso Estimado (kg)</Label>
                <Input type="number" step="0.1" value={form.peso_estimado} onChange={e => updateForm({ peso_estimado: e.target.value })} className="mt-1 h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Valor Declarado (R$)</Label>
                <Input type="number" step="0.01" value={form.valor_declarado} onChange={e => updateForm({ valor_declarado: e.target.value })} className="mt-1 h-8 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[
                { key: 'necessita_nota_fiscal', label: 'Nota Fiscal' },
                { key: 'possui_bateria', label: 'Possui Bateria' },
                { key: 'possui_item_fragil', label: 'Item Frágil' },
                { key: 'precisa_coleta', label: 'Precisa Coleta' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
                  <Switch checked={form[key]} onCheckedChange={v => updateForm({ [key]: v })} />
                  <span className="text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>

            {isInfluenciador && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="md:col-span-3 text-xs font-semibold text-purple-700 mb-1">Dados do Influenciador</div>
                <div>
                  <Label className="text-xs">Nome do Influenciador</Label>
                  <Input value={form.influenciador_nome} onChange={e => updateForm({ influenciador_nome: e.target.value })} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Valor do Produto (R$)</Label>
                  <Input type="number" step="0.01" value={form.valor_produto} onChange={e => updateForm({ valor_produto: e.target.value })} className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Retorno Esperado</Label>
                  <Input value={form.influenciador_retorno_esperado} onChange={e => updateForm({ influenciador_retorno_esperado: e.target.value })} className="mt-1 h-8 text-sm" placeholder="Post, stories, vídeo..." />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs">Observações do Solicitante</Label>
              <Textarea value={form.observacoes_solicitante} onChange={e => updateForm({ observacoes_solicitante: e.target.value })} className="mt-1 text-sm resize-none" rows={3} placeholder="Informações adicionais importantes..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" disabled={saving} className="gap-2 bg-primary text-white">
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Criar Solicitação'}
          </Button>
        </div>
      </form>
    </div>
  );
}
