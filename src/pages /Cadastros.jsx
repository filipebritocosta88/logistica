import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Search, Save, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const TABS = [
  { key: 'responsaveis', label: 'Responsáveis' },
  { key: 'pdvs', label: 'PDVs / Cidades' },
  { key: 'setores', label: 'Setores' },
  { key: 'transportadoras', label: 'Transportadoras' },
];

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function Cadastros() {
  const [activeTab, setActiveTab] = useState('responsaveis');
  const [data, setData] = useState({ responsaveis: [], pdvs: [], setores: [], transportadoras: [] });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    const [r, p, s, t] = await Promise.all([
      base44.entities.Responsavel.list(),
      base44.entities.PDV.list(),
      base44.entities.Setor.list(),
      base44.entities.Transportadora.list(),
    ]);
    setData({ responsaveis: r, pdvs: p, setores: s, transportadoras: t });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const items = data[activeTab] || [];
  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    return JSON.stringify(item).toLowerCase().includes(q);
  });

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(activeTab === 'responsaveis' ? { ativo: true }
      : activeTab === 'pdvs' ? { ativo: true }
        : activeTab === 'setores' ? { ativo: true }
          : { ativo: true });
  };

  const startEdit = (item) => {
    setCreating(false);
    setEditing(item.id);
    setForm({ ...item });
  };

  const cancel = () => { setEditing(null); setCreating(false); setForm({}); };

  const save = async () => {
    const entityMap = { responsaveis: 'Responsavel', pdvs: 'PDV', setores: 'Setor', transportadoras: 'Transportadora' };
    const entity = entityMap[activeTab];
    if (creating) {
      await base44.entities[entity].create(form);
      toast.success('Cadastro criado!');
    } else {
      await base44.entities[entity].update(editing, form);
      toast.success('Cadastro atualizado!');
    }
    cancel();
    load();
  };

  const remove = async (id) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    const entityMap = { responsaveis: 'Responsavel', pdvs: 'PDV', setores: 'Setor', transportadoras: 'Transportadora' };
    await base44.entities[entityMap[activeTab]].delete(id);
    toast.success('Excluído com sucesso!');
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Cadastros</h2>
          <p className="text-sm text-muted-foreground">Gerencie os dados base do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={startCreate} className="gap-2 bg-primary text-white">
            <Plus className="w-4 h-4" /> Novo
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); cancel(); setSearch(''); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
          </div>

          <Card className="border-border overflow-hidden">
            <div className="divide-y divide-border">
              {filtered.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Nenhum cadastro</p>
              ) : filtered.map(item => (
                <div key={item.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${editing === item.id ? 'bg-primary/5' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activeTab === 'responsaveis' && `${item.cidade || ''} ${item.estado || ''} • ${item.setor || ''}`}
                      {activeTab === 'pdvs' && `${item.cidade || ''} / ${item.estado || ''}`}
                      {activeTab === 'setores' && (item.descricao || '')}
                      {activeTab === 'transportadoras' && (item.tipo || '')}
                    </p>
                  </div>
                  {item.ativo === false && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inativo</span>}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(item)}>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => remove(item.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Form */}
        {(creating || editing) && (
          <Card className="border-border h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{creating ? 'Novo Cadastro' : 'Editar'}</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={cancel}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeTab === 'responsaveis' && <ResponsavelForm form={form} setForm={setForm} estados={ESTADOS_BR} />}
              {activeTab === 'pdvs' && <PDVForm form={form} setForm={setForm} estados={ESTADOS_BR} />}
              {activeTab === 'setores' && <SetorForm form={form} setForm={setForm} />}
              {activeTab === 'transportadoras' && <TransportadoraForm form={form} setForm={setForm} />}

              <div className="flex items-center gap-2 pt-2">
                <Switch checked={form.ativo !== false} onCheckedChange={v => setForm(f => ({ ...f, ativo: v }))} />
                <Label className="text-xs">Ativo</Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={cancel} className="flex-1">Cancelar</Button>
                <Button size="sm" onClick={save} className="flex-1 gap-1 bg-primary text-white">
                  <Save className="w-3.5 h-3.5" /> Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function F({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="mt-1 h-8 text-sm" placeholder={placeholder} />
    </div>
  );
}

function ResponsavelForm({ form, setForm, estados }) {
  const u = (k) => v => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-2">
      <F label="Nome *" value={form.nome} onChange={u('nome')} />
      <div className="grid grid-cols-2 gap-2">
        <F label="Cidade" value={form.cidade} onChange={u('cidade')} />
        <div>
          <Label className="text-xs">Estado</Label>
          <Select value={form.estado || ''} onValueChange={u('estado')}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>{estados.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <F label="Setor" value={form.setor} onChange={u('setor')} />
      <F label="E-mail" value={form.email} onChange={u('email')} type="email" />
      <F label="Telefone" value={form.telefone} onChange={u('telefone')} />
      <F label="CPF/CNPJ" value={form.cpf_cnpj} onChange={u('cpf_cnpj')} />
      <F label="Endereço" value={form.endereco} onChange={u('endereco')} />
      <div className="grid grid-cols-2 gap-2">
        <F label="Número" value={form.numero} onChange={u('numero')} />
        <F label="CEP" value={form.cep} onChange={u('cep')} />
      </div>
      <F label="Bairro" value={form.bairro} onChange={u('bairro')} />
    </div>
  );
}

function PDVForm({ form, setForm, estados }) {
  const u = (k) => v => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-2">
      <F label="Nome do PDV *" value={form.nome} onChange={u('nome')} />
      <div className="grid grid-cols-2 gap-2">
        <F label="Cidade" value={form.cidade} onChange={u('cidade')} />
        <div>
          <Label className="text-xs">Estado</Label>
          <Select value={form.estado || ''} onValueChange={u('estado')}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>{estados.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <F label="Endereço" value={form.endereco} onChange={u('endereco')} />
      <div className="grid grid-cols-2 gap-2">
        <F label="Número" value={form.numero} onChange={u('numero')} />
        <F label="CEP" value={form.cep} onChange={u('cep')} />
      </div>
      <F label="Responsável Principal" value={form.responsavel_principal} onChange={u('responsavel_principal')} />
      <F label="E-mail" value={form.email} onChange={u('email')} type="email" />
      <F label="Telefone" value={form.telefone} onChange={u('telefone')} />
    </div>
  );
}

function SetorForm({ form, setForm }) {
  const u = (k) => v => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-2">
      <F label="Nome do Setor *" value={form.nome} onChange={u('nome')} />
      <F label="Descrição" value={form.descricao} onChange={u('descricao')} placeholder="Descrição opcional..." />
    </div>
  );
}

function TransportadoraForm({ form, setForm }) {
  const u = (k) => v => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-2">
      <F label="Nome *" value={form.nome} onChange={u('nome')} />
      <div>
        <Label className="text-xs">Tipo</Label>
        <Select value={form.tipo || ''} onValueChange={u('tipo')}>
          <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Selecionar tipo..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sedex">Sedex</SelectItem>
            <SelectItem value="pac">PAC</SelectItem>
            <SelectItem value="uber_corporativo">Uber Corporativo</SelectItem>
            <SelectItem value="motoboy_interno">Motoboy Interno</SelectItem>
            <SelectItem value="easy_courier">Easy Courier</SelectItem>
            <SelectItem value="transportadora">Transportadora</SelectItem>
            <SelectItem value="mercado_livre">Mercado Livre</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <F label="Observações" value={form.observacoes} onChange={u('observacoes')} />
    </div>
  );
}
