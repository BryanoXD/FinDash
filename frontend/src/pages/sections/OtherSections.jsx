import React, { useState, useMemo } from "react";
import {
  mockUser, mockTransactions as initTx, mockCategories as initCats, mockTags as initTags,
  mockBudgets as initBudgets, mockFinancialGoals as initGoals,
} from "../../data/mockData";
import {
  Plus, Pencil, Trash2, X, Search, Download, Calendar, PieChart,
  BarChart3, Target, ChevronDown, RotateCcw, Check, Info,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const Field = ({ label, required, children }) => (<div><label className="text-white/60 text-xs block mb-1.5">{label}{required && " *"}</label>{children}</div>);
const Inp = (props) => (<input {...props} className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 placeholder:text-white/25 ${props.className || ""}`} />);
const Sel = ({ children, ...rest }) => (<select {...rest} className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 [&>option]:bg-[#1a1a1a] ${rest.className || ""}`}>{children}</select>);
const Btn = ({ children, variant = "primary", ...rest }) => (<button {...rest} className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${variant === "primary" ? "bg-white text-black hover:bg-gray-100" : "text-white/40 border border-white/[0.08] hover:bg-white/[0.04]"}`}>{children}</button>);

function TransactionModal({ open, onClose, onSave, item, tipo, categories, tags }) {
  const [form, setForm] = useState({ valor: "", data: new Date().toISOString().split("T")[0], categoriaId: "", descricao: "", metodo: "", tags: [], recorrente: false, pago: true, detalhado: false, itens: [] });
  const [newItem, setNewItem] = useState({ nome: "", valor: "" });
  React.useEffect(() => { if (item) setForm(item); else setForm({ valor: "", data: new Date().toISOString().split("T")[0], categoriaId: "", descricao: "", metodo: "", tags: [], recorrente: false, pago: true, detalhado: false, itens: [] }); }, [item, open]);
  const toggleTag = (id) => setForm(f => ({ ...f, tags: f.tags.includes(id) ? f.tags.filter(t => t !== id) : [...f.tags, id] }));
  const addItem = () => { if (newItem.nome && newItem.valor) { setForm(f => ({ ...f, itens: [...f.itens, { nome: newItem.nome, valor: Number(newItem.valor) }] })); setNewItem({ nome: "", valor: "" }); } };
  const removeItem = (i) => setForm(f => ({ ...f, itens: f.itens.filter((_, idx) => idx !== i) }));
  const handleSave = () => { if (!form.valor || !form.descricao || !form.categoriaId) return; const cat = categories.find(c => c.id === Number(form.categoriaId)); onSave({ ...form, valor: Number(form.valor), categoriaId: Number(form.categoriaId), categoria: cat?.nome || "", tipo }); onClose(); };
  const filteredCats = categories.filter(c => c.tipo === tipo || c.tipo === "ambos");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-white text-lg">{item ? "Editar" : tipo === "receita" ? "Nova Receita" : "Nova Despesa"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor" required><Inp type="number" step="0.01" placeholder="0,00" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} /></Field>
            <Field label="Data" required><Inp type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} className="[color-scheme:dark]" /></Field>
          </div>
          <Field label="Categoria" required><Sel value={form.categoriaId} onChange={e => setForm({...form, categoriaId: e.target.value})}><option value="">Selecione uma categoria</option>{filteredCats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Sel></Field>
          <Field label="Descri\u00e7\u00e3o" required><Inp placeholder="Descreva a transa\u00e7\u00e3o" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} /></Field>
          <Field label={tipo === "receita" ? "M\u00e9todo de Recebimento" : "M\u00e9todo de Pagamento"}><Sel value={form.metodo} onChange={e => setForm({...form, metodo: e.target.value})}><option value="">Selecione (opcional)</option>{["Pix","Transfer","D\u00e9bito","Cr\u00e9dito","Dinheiro","Boleto"].map(m => <option key={m} value={m}>{m}</option>)}</Sel></Field>
          <Field label="Tags"><div className="flex flex-wrap gap-2">{tags.map(t => (<button key={t.id} type="button" onClick={() => toggleTag(t.id)} className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${form.tags.includes(t.id) ? "border-white/30 text-white" : "border-white/[0.08] text-white/40"}`} style={form.tags.includes(t.id) ? { backgroundColor: t.cor + "20", borderColor: t.cor + "60" } : {}}>{t.nome}</button>))}</div></Field>
          <div className="flex items-center gap-6">
            {[{k:"recorrente",l:"Recorrente"},{k:"pago",l:"J\u00e1 pago"},{k:"detalhado",l:"Detalhar itens"}].map(tog => (
              <label key={tog.k} className="flex items-center gap-2 cursor-pointer"><button type="button" onClick={() => setForm(f => ({...f, [tog.k]: !f[tog.k]}))} className={`w-9 h-5 rounded-full transition-colors relative ${form[tog.k] ? "bg-emerald-500" : "bg-white/10"}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${form[tog.k] ? "translate-x-[18px]" : "translate-x-[3px]"}`} /></button><span className="text-white/50 text-xs">{tog.l}</span></label>
            ))}
          </div>
          {form.detalhado && (<div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.06]"><p className="text-white/40 text-xs mb-3">Itens do detalhamento</p>{form.itens.map((it, i) => (<div key={i} className="flex items-center justify-between py-1.5"><span className="text-white/60 text-xs">{it.nome}</span><div className="flex items-center gap-2"><span className="text-white text-xs font-medium">{fmt(it.valor)}</span><button type="button" onClick={() => removeItem(i)} className="text-red-400/50 hover:text-red-400"><X className="w-3 h-3" /></button></div></div>))}<div className="flex gap-2 mt-2"><Inp placeholder="Item" value={newItem.nome} onChange={e => setNewItem({...newItem, nome: e.target.value})} className="!py-1.5 text-xs" /><Inp type="number" placeholder="Valor" value={newItem.valor} onChange={e => setNewItem({...newItem, valor: e.target.value})} className="!py-1.5 text-xs !w-24" /><button type="button" onClick={addItem} className="text-emerald-400 shrink-0 px-2"><Plus className="w-4 h-4" /></button></div></div>)}
        </div>
        <DialogFooter className="gap-2"><Btn variant="secondary" onClick={onClose}>Cancelar</Btn><Btn onClick={handleSave}>{item ? "Salvar" : "Criar"}</Btn></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TxPage({ initData, tipo }) {
  const [tx, setTx] = useState(initData);
  const [cats] = useState(initCats);
  const [tags] = useState(initTags);
  const [modalOpen, setMO] = useState(false);
  const [editItem, setEI] = useState(null);
  const [search, setSearch] = useState("");
  const [catF, setCatF] = useState("");
  const [expId, setExpId] = useState(null);
  const color = tipo === "receita" ? "emerald" : "red";
  const filtered = useMemo(() => tx.filter(t => { if (search && !t.descricao.toLowerCase().includes(search.toLowerCase())) return false; if (catF && t.categoria !== catF) return false; return true; }), [tx, search, catF]);
  const total = filtered.reduce((a, b) => a + b.valor, 0);
  const save = (item) => { if (item.id) setTx(p => p.map(t => t.id === item.id ? item : t)); else setTx(p => [...p, { ...item, id: Date.now() }]); setEI(null); };
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-white text-2xl font-bold">{tipo === "receita" ? "Receitas" : "Despesas"}</h1><p className="text-white/40 text-sm mt-1">Gerencie suas {tipo === "receita" ? "receitas" : "despesas"}</p></div>
        <Btn onClick={() => { setEI(null); setMO(true); }}><Plus className="w-4 h-4 inline mr-1" />{tipo === "receita" ? "Nova Receita" : "Nova Despesa"}</Btn>
      </div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 mb-4"><div className="flex flex-wrap gap-3"><div className="relative flex-1 min-w-[200px]"><Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" /><Inp placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="!pl-10" /></div><Sel value={catF} onChange={e => setCatF(e.target.value)} className="!w-auto min-w-[180px]"><option value="">Todas categorias</option>{cats.filter(c => c.tipo === tipo || c.tipo === "ambos").map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</Sel></div></div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 mb-4 flex justify-between items-center"><span className="text-white/50 text-sm">{filtered.length} transa\u00e7\u00f5es</span><span className={`font-semibold ${tipo === "receita" ? "text-emerald-400" : "text-red-400"}`}>Total: {fmt(total)}</span></div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[100px_1fr_140px_130px_80px] gap-2 px-5 py-3 border-b border-white/[0.04] text-white/30 text-xs font-medium"><span>Data</span><span>Descri\u00e7\u00e3o</span><span>Categoria</span><span>Valor</span><span>A\u00e7\u00f5es</span></div>
        {filtered.map(t => (<div key={t.id}>
          <div className="grid grid-cols-[100px_1fr_140px_130px_80px] gap-2 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors border-b border-white/[0.03]">
            <span className="text-white/40 text-xs">{new Date(t.data).toLocaleDateString("pt-BR")}</span>
            <div><p className="text-white text-sm font-medium">{t.descricao}</p><div className="flex items-center gap-1.5 mt-1 flex-wrap">{t.metodo && <span className="text-white/25 text-xs">{t.metodo}</span>}{t.recorrente && <RotateCcw className="w-3 h-3 text-blue-400/50" />}{t.pago ? <Check className="w-3 h-3 text-emerald-400/50" /> : <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">Pendente</span>}{t.detalhado && t.itens?.length > 0 && <button onClick={() => setExpId(expId === t.id ? null : t.id)} className="text-white/30 hover:text-white/60"><ChevronDown className={`w-3 h-3 transition-transform ${expId === t.id ? "rotate-180" : ""}`} /></button>}{t.tags?.map(tid => { const tg = tags.find(x => x.id === tid); return tg ? <span key={tid} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: tg.cor + "20", color: tg.cor }}>{tg.nome}</span> : null; })}</div></div>
            <span className="text-xs px-2 py-1 rounded-md border inline-block w-fit" style={{ borderColor: (cats.find(c => c.nome === t.categoria)?.cor || "#fff") + "40", color: cats.find(c => c.nome === t.categoria)?.cor || "#fff" }}>{t.categoria}</span>
            <span className={`text-sm font-semibold ${tipo === "receita" ? "text-emerald-400" : "text-red-400"}`}>{tipo === "receita" ? "+" : "-"}{fmt(t.valor)}</span>
            <div className="flex gap-2"><button onClick={() => { setEI(t); setMO(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => setTx(p => p.filter(x => x.id !== t.id))} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>
          </div>
          {expId === t.id && t.itens?.length > 0 && (<div className="px-8 py-3 bg-white/[0.01] border-b border-white/[0.03]">{t.itens.map((it, i) => (<div key={i} className="flex justify-between py-1"><span className="text-white/40 text-xs">{it.nome}</span><span className="text-white/60 text-xs">{fmt(it.valor)}</span></div>))}</div>)}
        </div>))}
      </div>
      <TransactionModal open={modalOpen} onClose={() => { setMO(false); setEI(null); }} onSave={save} item={editItem} tipo={tipo} categories={cats} tags={tags} />
    </div>
  );
}

export function ReceitasSection() { return <TxPage initData={initTx.filter(t => t.tipo === "receita")} tipo="receita" />; }
export function DespesasSection() { return <TxPage initData={initTx.filter(t => t.tipo === "despesa")} tipo="despesa" />; }

export function CategoriasSection() {
  const [cats, setCats] = useState(initCats);
  const [modalOpen, setMO] = useState(false);
  const [editCat, setEC] = useState(null);
  const [form, setForm] = useState({ nome: "", cor: "#6366f1", tipo: "despesa" });
  React.useEffect(() => { if (editCat) setForm({ nome: editCat.nome, cor: editCat.cor, tipo: editCat.tipo }); else setForm({ nome: "", cor: "#6366f1", tipo: "despesa" }); }, [editCat, modalOpen]);
  const save = () => { if (!form.nome) return; if (editCat) setCats(p => p.map(c => c.id === editCat.id ? { ...c, ...form } : c)); else setCats(p => [...p, { ...form, id: Date.now() }]); setMO(false); setEC(null); };
  const colors = ["#6366f1","#8b5cf6","#a78bfa","#22c55e","#ef4444","#f97316","#3b82f6","#ec4899","#14b8a6","#64748b"];
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-white text-2xl font-bold">Categorias</h1><p className="text-white/40 text-sm mt-1">Gerencie suas categorias</p></div><Btn onClick={() => { setEC(null); setMO(true); }}><Plus className="w-4 h-4 inline mr-1" />Nova Categoria</Btn></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{cats.map(cat => (<div key={cat.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.cor + "20" }}><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} /></div><span className="text-white font-medium">{cat.nome}</span></div><div className="flex gap-2"><button onClick={() => { setEC(cat); setMO(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => setCats(p => p.filter(c => c.id !== cat.id))} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div></div><span className={`text-[10px] px-2 py-1 rounded-md ${cat.tipo === "receita" ? "bg-emerald-500/15 text-emerald-400" : cat.tipo === "despesa" ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}>{cat.tipo === "receita" ? "Receita" : cat.tipo === "despesa" ? "Despesa" : "Ambos"}</span></div>))}</div>
      <Dialog open={modalOpen} onOpenChange={() => { setMO(false); setEC(null); }}><DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md"><DialogHeader><DialogTitle className="text-white">{editCat ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader><div className="space-y-4 py-2"><Field label="Nome" required><Inp placeholder="Nome da categoria" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></Field><Field label="Tipo" required><Sel value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}><option value="despesa">Despesa</option><option value="receita">Receita</option><option value="ambos">Ambos</option></Sel></Field><Field label="Cor"><div className="flex gap-2 flex-wrap">{colors.map(c => (<button key={c} onClick={() => setForm({...form, cor: c})} className={`w-8 h-8 rounded-lg transition-all ${form.cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#111111]" : ""}`} style={{ backgroundColor: c }} />))}</div></Field></div><DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setMO(false); setEC(null); }}>Cancelar</Btn><Btn onClick={save}>{editCat ? "Salvar" : "Criar"}</Btn></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

export function BudgetSection() {
  const [budgets, setB] = useState(initBudgets);
  const [cats] = useState(initCats);
  const [modalOpen, setMO] = useState(false);
  const [editB, setEB] = useState(null);
  const [form, setForm] = useState({ categoriaId: "", limite: "" });
  React.useEffect(() => { if (editB) setForm({ categoriaId: editB.categoriaId, limite: editB.limite }); else setForm({ categoriaId: "", limite: "" }); }, [editB, modalOpen]);
  const tL = budgets.reduce((a, b) => a + b.limite, 0); const tG = budgets.reduce((a, b) => a + b.gasto, 0);
  const save = () => { if (!form.categoriaId || !form.limite) return; const cat = cats.find(c => c.id === Number(form.categoriaId)); if (editB) setB(p => p.map(b => b.id === editB.id ? { ...b, categoriaId: Number(form.categoriaId), categoria: cat?.nome, limite: Number(form.limite) } : b)); else setB(p => [...p, { id: Date.now(), categoriaId: Number(form.categoriaId), categoria: cat?.nome, limite: Number(form.limite), gasto: 0 }]); setMO(false); setEB(null); };
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-white text-2xl font-bold">Orçamento</h1><p className="text-white/40 text-sm mt-1">Defina limites de gastos por categoria</p></div><Btn onClick={() => { setEB(null); setMO(true); }}><Plus className="w-4 h-4 inline mr-1" />Novo Orçamento</Btn></div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6"><div className="flex items-center justify-between mb-3"><span className="text-white/50 text-sm">Orçamento Total</span><span className="text-white text-sm font-medium">{fmt(tG)} de {fmt(tL)}</span></div><div className="w-full bg-white/[0.06] rounded-full h-2.5"><div className="bg-emerald-400 h-2.5 rounded-full transition-all" style={{ width: `${Math.min((tG / tL) * 100, 100)}%` }} /></div><p className="text-white/30 text-xs mt-2">{((tG / tL) * 100).toFixed(1)}% utilizado</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{budgets.map(b => { const pct = (b.gasto / b.limite) * 100; const ov = pct > 90; return (<div key={b.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all"><div className="flex items-center justify-between mb-3"><span className="text-white font-medium text-sm">{b.categoria}</span><div className="flex items-center gap-2"><span className={`text-xs font-medium px-2 py-1 rounded-md ${ov ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>{pct.toFixed(0)}%</span><button onClick={() => { setEB(b); setMO(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => setB(p => p.filter(x => x.id !== b.id))} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div></div><div className="w-full bg-white/[0.06] rounded-full h-2 mb-2"><div className={`h-2 rounded-full transition-all ${ov ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div><div className="flex justify-between"><span className="text-white/30 text-xs">{fmt(b.gasto)}</span><span className="text-white/30 text-xs">{fmt(b.limite)}</span></div></div>); })}</div>
      <Dialog open={modalOpen} onOpenChange={() => { setMO(false); setEB(null); }}><DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md"><DialogHeader><DialogTitle className="text-white">{editB ? "Editar" : "Novo"} Orçamento</DialogTitle></DialogHeader><div className="space-y-4 py-2"><Field label="Categoria" required><Sel value={form.categoriaId} onChange={e => setForm({...form, categoriaId: e.target.value})}><option value="">Selecione</option>{cats.filter(c => c.tipo === "despesa" || c.tipo === "ambos").map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Sel></Field><Field label="Limite (R$)" required><Inp type="number" placeholder="1200" value={form.limite} onChange={e => setForm({...form, limite: e.target.value})} /></Field></div><DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setMO(false); setEB(null); }}>Cancelar</Btn><Btn onClick={save}>{editB ? "Salvar" : "Criar"}</Btn></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

export function HeatmapSection() {
  const [mo, setMo] = useState(new Date().getMonth());
  const [yr, setYr] = useState(new Date().getFullYear());
  const mos = ["Janeiro","Fevereiro","Mar\u00e7o","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const dim = new Date(yr, mo + 1, 0).getDate();
  const fd = new Date(yr, mo, 1).getDay();
  const days = useMemo(() => Array.from({ length: dim }, (_, i) => ({ day: i + 1, gasto: Math.random() > 0.4 ? Math.round(Math.random() * 3200) : 0 })), [mo, yr, dim]);
  const tot = days.reduce((a, b) => a + b.gasto, 0); const dg = days.filter(d => d.gasto > 0).length; const mx = Math.max(...days.map(d => d.gasto), 1);
  const gc = (v) => { if (v === 0) return "rgba(255,255,255,0.03)"; const r = v / mx; return r > 0.75 ? "rgba(239,68,68,0.8)" : r > 0.5 ? "rgba(239,68,68,0.55)" : r > 0.25 ? "rgba(239,68,68,0.35)" : "rgba(239,68,68,0.18)"; };
  return (
    <div>
      <div className="mb-6"><h1 className="text-white text-2xl font-bold">Heatmap de Gastos</h1><p className="text-white/40 text-sm mt-1">Visualize gastos di\u00e1rios no calend\u00e1rio</p></div>
      <div className="grid grid-cols-3 gap-4 mb-6"><div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4"><p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Total do M\u00eas</p><p className="text-red-400 font-bold text-lg">{fmt(tot)}</p></div><div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4"><p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">M\u00e9dia Di\u00e1ria</p><p className="text-white font-bold text-lg">{fmt(dg > 0 ? tot / dg : 0)}</p></div><div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4"><p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Maior Gasto</p><p className="text-red-400 font-bold text-lg">{fmt(mx)}</p></div></div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-6"><button onClick={() => { if (mo === 0) { setMo(11); setYr(y => y-1); } else setMo(m => m-1); }} className="text-white/30 hover:text-white/60">&lt;</button><Sel value={mo} onChange={e => setMo(Number(e.target.value))} className="!w-auto">{mos.map((m, i) => <option key={i} value={i}>{m}</option>)}</Sel><Sel value={yr} onChange={e => setYr(Number(e.target.value))} className="!w-auto">{[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}</Sel><button onClick={() => { if (mo === 11) { setMo(0); setYr(y => y+1); } else setMo(m => m+1); }} className="text-white/30 hover:text-white/60">&gt;</button></div>
        <div className="grid grid-cols-7 gap-2 mb-2">{["Dom","Seg","Ter","Qua","Qui","Sex","S\u00e1b"].map(d => <div key={d} className="text-center text-white/30 text-xs font-medium py-1">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-2">{Array.from({ length: fd }).map((_, i) => <div key={`e-${i}`} />)}{days.map(d => (<div key={d.day} className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer hover:ring-1 hover:ring-white/20 transition-all" style={{ backgroundColor: gc(d.gasto) }} title={`Dia ${d.day}: ${fmt(d.gasto)}`}><span className="text-white/70 text-xs font-medium">{d.day}</span>{d.gasto > 0 && <span className="text-white/50 text-[10px]">{d.gasto >= 1000 ? `${(d.gasto / 1000).toFixed(1)}k` : d.gasto}</span>}</div>))}</div>
        <div className="flex items-center justify-center gap-2 mt-4"><span className="text-white/30 text-xs">Menor</span>{["rgba(239,68,68,0.18)","rgba(239,68,68,0.35)","rgba(239,68,68,0.55)","rgba(239,68,68,0.8)"].map((c, i) => <div key={i} className="w-5 h-5 rounded" style={{ backgroundColor: c }} />)}<span className="text-white/30 text-xs">Maior</span></div>
      </div>
    </div>
  );
}

export function ReportsSection() {
  const [sd, setSd] = useState("2025-07-01"); const [ed, setEd] = useState("2025-07-31");
  const setQ = (d) => { const n = new Date(); if (d === "7d") { setSd(new Date(n - 7*864e5).toISOString().split("T")[0]); setEd(n.toISOString().split("T")[0]); } else if (d === "month") { setSd(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-01`); setEd(n.toISOString().split("T")[0]); } else if (d === "quarter") { const m = Math.max(n.getMonth()-2, 0); setSd(`${n.getFullYear()}-${String(m+1).padStart(2,"0")}-01`); setEd(n.toISOString().split("T")[0]); } else { setSd(`${n.getFullYear()}-01-01`); setEd(n.toISOString().split("T")[0]); } };
  return (
    <div>
      <div className="mb-6"><h1 className="text-white text-2xl font-bold">Relat\u00f3rios</h1><p className="text-white/40 text-sm mt-1">An\u00e1lises detalhadas</p></div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6"><h3 className="text-white font-medium mb-4">Per\u00edodo do Relat\u00f3rio</h3><div className="flex flex-wrap items-end gap-4"><Field label="Data In\u00edcio"><Inp type="date" value={sd} onChange={e => setSd(e.target.value)} className="[color-scheme:dark]" /></Field><Field label="Data Fim"><Inp type="date" value={ed} onChange={e => setEd(e.target.value)} className="[color-scheme:dark]" /></Field><div className="flex gap-2 pb-0.5">{[{k:"7d",l:"\u00daltimos 7 dias"},{k:"month",l:"Este m\u00eas"},{k:"quarter",l:"Trimestre"},{k:"year",l:"Este ano"}].map(q => (<button key={q.k} onClick={() => setQ(q.k)} className="text-white/40 text-xs px-3 py-2.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] hover:text-white/70 transition-colors">{q.l}</button>))}</div></div></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[{ t: "Relat\u00f3rio Mensal", d: "Resumo completo", i: Calendar },{ t: "Fluxo de Caixa", d: "Entradas e sa\u00eddas", i: BarChart3 },{ t: "An\u00e1lise de Gastos", d: "Por categoria", i: PieChart }].map(r => (<div key={r.t} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all cursor-pointer group"><div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/10"><r.i className="w-5 h-5 text-white/50 group-hover:text-white/80" /></div><h3 className="text-white font-medium mb-1">{r.t}</h3><p className="text-white/30 text-sm">{r.d}</p><p className="text-white/20 text-xs mt-2">{sd} at\u00e9 {ed}</p><button className="mt-4 text-white/50 text-sm flex items-center gap-1 group-hover:text-white/80"><Download className="w-4 h-4" /> Baixar PDF</button></div>))}</div>
    </div>
  );
}

export function MetasSection() {
  const [goals, setG] = useState(initGoals); const [modalOpen, setMO] = useState(false); const [eG, sEG] = useState(null); const [form, setForm] = useState({ nome: "", valorMeta: "", prazo: "" }); const [apId, sApId] = useState(null); const [apVal, sApVal] = useState("");
  React.useEffect(() => { if (eG) setForm({ nome: eG.nome, valorMeta: eG.valorMeta, prazo: eG.prazo }); else setForm({ nome: "", valorMeta: "", prazo: "" }); }, [eG, modalOpen]);
  const save = () => { if (!form.nome || !form.valorMeta) return; if (eG) setG(p => p.map(g => g.id === eG.id ? { ...g, ...form, valorMeta: Number(form.valorMeta) } : g)); else setG(p => [...p, { id: Date.now(), nome: form.nome, valorAtual: 0, valorMeta: Number(form.valorMeta), prazo: form.prazo || "2026-12-31", icone: "Target" }]); setMO(false); sEG(null); };
  const aporte = (id) => { const v = Number(apVal); if (!v) return; setG(p => p.map(g => g.id === id ? { ...g, valorAtual: g.valorAtual + v } : g)); sApVal(""); sApId(null); };
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-white text-2xl font-bold">Metas Financeiras</h1><p className="text-white/40 text-sm mt-1">Defina e acompanhe suas metas</p></div><Btn onClick={() => { sEG(null); setMO(true); }}><Plus className="w-4 h-4 inline mr-1" />Nova Meta</Btn></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{goals.map(g => { const pct = Math.min((g.valorAtual / g.valorMeta) * 100, 100); return (<div key={g.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Target className="w-4 h-4 text-white/50" /><span className="text-white font-medium">{g.nome}</span></div><div className="flex gap-2"><button onClick={() => { sEG(g); setMO(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => setG(p => p.filter(x => x.id !== g.id))} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div></div><div className="flex justify-between mb-2"><span className="text-white/40 text-xs">Progresso</span><span className="text-white/60 text-xs font-medium">{pct.toFixed(1)}%</span></div><div className="w-full bg-white/[0.06] rounded-full h-2 mb-3"><div className="bg-white/60 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} /></div><div className="flex justify-between mb-4"><span className="text-white/40 text-xs">{fmt(g.valorAtual)}</span><span className="text-white/40 text-xs">{fmt(g.valorMeta)}</span></div><div className="pt-3 border-t border-white/[0.06] flex items-center justify-between"><div className="flex items-center gap-1.5 text-white/30 text-xs"><Calendar className="w-3.5 h-3.5" />Prazo: {new Date(g.prazo).toLocaleDateString("pt-BR")}</div>{apId === g.id ? (<div className="flex items-center gap-2"><Inp type="number" value={apVal} onChange={e => sApVal(e.target.value)} placeholder="R$" className="!w-24 !py-1.5 text-xs" autoFocus /><button onClick={() => aporte(g.id)} className="text-emerald-400 text-xs font-medium">OK</button><button onClick={() => { sApId(null); sApVal(""); }} className="text-white/30 text-xs">x</button></div>) : (<button onClick={() => sApId(g.id)} className="flex items-center gap-1 text-white/50 text-xs border border-white/[0.08] px-2.5 py-1 rounded-md hover:bg-white/[0.04]"><Plus className="w-3 h-3" /> Aporte</button>)}</div></div>); })}</div>
      <Dialog open={modalOpen} onOpenChange={() => { setMO(false); sEG(null); }}><DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md"><DialogHeader><DialogTitle className="text-white">{eG ? "Editar" : "Nova"} Meta</DialogTitle></DialogHeader><div className="space-y-4 py-2"><Field label="Nome" required><Inp placeholder="Ex: Viagem" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></Field><Field label="Valor Meta (R$)" required><Inp type="number" placeholder="10000" value={form.valorMeta} onChange={e => setForm({...form, valorMeta: e.target.value})} /></Field><Field label="Prazo"><Inp type="date" value={form.prazo} onChange={e => setForm({...form, prazo: e.target.value})} className="[color-scheme:dark]" /></Field></div><DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setMO(false); sEG(null); }}>Cancelar</Btn><Btn onClick={save}>{eG ? "Salvar" : "Criar"}</Btn></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

export function ImportSection() {
  return (<div><div className="mb-6"><h1 className="text-white text-2xl font-bold">Importar Extratos</h1><p className="text-white/40 text-sm mt-1">Importe extratos banc\u00e1rios</p></div><div className="bg-[#111111] border border-dashed border-white/[0.1] rounded-xl p-12 flex flex-col items-center justify-center"><div className="w-16 h-16 bg-white/[0.04] rounded-xl flex items-center justify-center mb-4"><Download className="w-8 h-8 text-white/30" /></div><p className="text-white/60 text-sm font-medium mb-1">Arraste seu extrato aqui</p><p className="text-white/30 text-xs mb-4">Formatos: CSV, OFX, PDF</p><Btn>Selecionar Arquivo</Btn></div></div>);
}

export function SettingsSection() {
  const [prefs, setP] = useState([{ label: "Notifica\u00e7\u00f5es por email", on: true },{ label: "Alertas de or\u00e7amento", on: true },{ label: "Relat\u00f3rios semanais", on: false }]);
  return (<div><div className="mb-6"><h1 className="text-white text-2xl font-bold">Configura\u00e7\u00f5es</h1><p className="text-white/40 text-sm mt-1">Gerencie suas prefer\u00eancias</p></div><div className="space-y-4"><div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5"><h3 className="text-white font-medium mb-4">Perfil</h3><div className="flex items-center gap-4"><div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center"><span className="text-white font-semibold text-lg">{mockUser.avatar}</span></div><div><p className="text-white font-medium">{mockUser.name}</p><p className="text-white/40 text-sm">{mockUser.email}</p></div></div></div><div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5"><h3 className="text-white font-medium mb-4">Prefer\u00eancias</h3><div className="space-y-4">{prefs.map((p, i) => (<div key={p.label} className="flex items-center justify-between"><span className="text-white/60 text-sm">{p.label}</span><button onClick={() => setP(pr => pr.map((x, j) => j === i ? {...x, on: !x.on} : x))} className={`w-10 h-6 rounded-full transition-colors relative ${p.on ? "bg-emerald-500" : "bg-white/10"}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${p.on ? "translate-x-5" : "translate-x-1"}`} /></button></div>))}</div></div></div></div>);
}
