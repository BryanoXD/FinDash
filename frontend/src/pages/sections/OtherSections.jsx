import React, { useState, useMemo } from "react";
import { useData } from "../../context/DataContext";
import {
  Plus, Pencil, Trash2, X, Search, Download, Calendar, PieChart,
  BarChart3, Target, ChevronDown, RotateCcw, Check, Info, CheckCircle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0);
const fmtNum = (v) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0);
const Field = ({ label, required, children }) => (<div><label className="text-white/60 text-xs block mb-1.5">{label}{required && " *"}</label>{children}</div>);
const Inp = (props) => (<input {...props} className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 placeholder:text-white/25 ${props.className || ""}`} />);
const MoneyInp = ({ value, onChange, ...rest }) => (
  <div className="relative">
    <input type="number" step="0.01" placeholder="0,00" value={value} onChange={onChange} {...rest} className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 placeholder:text-white/25 pr-2 ${rest.className || ""}`} />
    {value && Number(value) > 0 && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px] pointer-events-none">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(Number(value))}</span>}
  </div>
);
const Sel = ({ children, ...rest }) => (<select {...rest} className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 [color-scheme:dark] [&>option]:bg-[#1a1a1a] [&>option]:text-white ${rest.className || ""}`}>{children}</select>);
const Btn = ({ children, variant = "primary", ...rest }) => (<button {...rest} className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${variant === "primary" ? "bg-white text-black hover:bg-gray-100" : "text-white/40 border border-white/[0.08] hover:bg-white/[0.04]"}`}>{children}</button>);

function TransactionModal({ open, onClose, onSave, item, tipo, categories, tags, cards, onCreateInstallmentBatch, financings, onPayFinancingCustom }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ 
    valor: "", data: today, data_vencimento: "", sem_vencimento: false, categoria_id: "", descricao: "", 
    metodo: "", tags: [], recorrente: false, pago: tipo === "receita", detalhado: false, itens: [],
    parcelas: 1, card_id: "", financing_id: ""
  });
  const [newItem, setNewItem] = useState({ nome: "", valor: "" });
  
  React.useEffect(() => { 
    if (item) {
      setForm({ 
        ...item, 
        categoria_id: item.categoria_id || "", 
        parcelas: 1, card_id: "", financing_id: "",
        sem_vencimento: !item.data_vencimento,
        data_vencimento: item.data_vencimento || "",
      }); 
    } else {
      setForm({ 
        valor: "", data: today, data_vencimento: "", sem_vencimento: tipo === "receita", categoria_id: "", descricao: "", 
        metodo: "", tags: [], recorrente: false, pago: tipo === "receita", detalhado: false, itens: [],
        parcelas: 1, card_id: "", financing_id: ""
      }); 
    }
  }, [item, open, tipo, today]);
  
  const toggleTag = (id) => setForm(f => ({ ...f, tags: f.tags.includes(id) ? f.tags.filter(t => t !== id) : [...f.tags, id] }));
  const addItem = () => { if (newItem.nome && newItem.valor) { setForm(f => ({ ...f, itens: [...f.itens, { nome: newItem.nome, valor: Number(newItem.valor) }] })); setNewItem({ nome: "", valor: "" }); } };
  const removeItem = (i) => setForm(f => ({ ...f, itens: f.itens.filter((_, idx) => idx !== i) }));
  
  const isFinanciamentoCategory = form.categoria_id === "__financing__";
  const hasFinancings = financings && financings.length > 0;
  const isDespesa = tipo === "despesa";
  
  const handleSave = async () => { 
    if (!form.valor || !form.descricao) return;
    if (isFinanciamentoCategory && !form.financing_id) return;
    if (!isFinanciamentoCategory && !form.categoria_id) return;
    
    const valorTotal = Number(form.valor);
    const parcelas = Number(form.parcelas) || 1;
    
    if (form.metodo === "Crédito" && form.card_id && isDespesa && onCreateInstallmentBatch) {
      try {
        await onCreateInstallmentBatch({ card_id: form.card_id, descricao: form.descricao, valor_total: valorTotal, total_parcelas: parcelas, data: form.data });
      } catch (error) { console.error('Error creating installments:', error); }
    }
    
    if (isFinanciamentoCategory && form.financing_id && onPayFinancingCustom) {
      try { await onPayFinancingCustom(form.financing_id, valorTotal); } catch (error) { console.error('Error paying financing:', error); }
    }
    
    let catId = form.categoria_id;
    if (isFinanciamentoCategory) {
      const fallbackCat = categories.find(c => c.tipo === "despesa" || c.tipo === "ambos");
      catId = fallbackCat?.id || "";
    }
    
    if (catId) {
      onSave({ 
        ...form, 
        categoria_id: catId,
        valor: valorTotal, 
        tipo,
        data: form.sem_vencimento ? today : (isDespesa ? (form.data_vencimento || today) : form.data),
        data_vencimento: isDespesa && !form.sem_vencimento ? (form.data_vencimento || null) : null,
        pago: form.metodo === "Crédito" ? false : form.pago
      });
    }
    onClose(); 
  };
  
  const filteredCats = categories.filter(c => c.tipo === tipo || c.tipo === "ambos");
  const valorParcela = form.valor && form.parcelas > 1 ? (Number(form.valor) / Number(form.parcelas)).toFixed(2) : null;
  const isCredito = form.metodo === "Crédito";
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-white text-lg">{item ? "Editar" : tipo === "receita" ? "Nova Receita" : "Nova Despesa"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          {/* Valor + Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Valor Total" required><MoneyInp data-testid="tx-modal-valor" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} /></Field>
            {isDespesa ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-white/60 text-xs">Data de Vencimento</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <button type="button" onClick={() => setForm(f => ({...f, sem_vencimento: !f.sem_vencimento, data_vencimento: ""}))} className={`w-7 h-4 rounded-full transition-colors relative ${form.sem_vencimento ? "bg-white/30" : "bg-white/10"}`}><div className={`w-2.5 h-2.5 bg-white rounded-full absolute top-[3px] transition-transform ${form.sem_vencimento ? "translate-x-[14px]" : "translate-x-[3px]"}`} /></button>
                    <span className="text-white/40 text-[10px]">Sem vencimento</span>
                  </label>
                </div>
                {form.sem_vencimento ? (
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white/40 text-sm">Sem vencimento (registro: {new Date(today).toLocaleDateString("pt-BR")})</div>
                ) : (
                  <Inp data-testid="tx-modal-vencimento" type="date" value={form.data_vencimento} onChange={e => setForm({...form, data_vencimento: e.target.value})} className="[color-scheme:dark]" />
                )}
              </div>
            ) : (
              <Field label="Data" required><Inp data-testid="tx-modal-data" type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} className="[color-scheme:dark]" /></Field>
            )}
          </div>
          <Field label="Categoria" required>
            <Sel data-testid="tx-modal-categoria" value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value, financing_id: e.target.value !== "__financing__" ? "" : form.financing_id})}>
              <option value="">Selecione uma categoria</option>
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              {isDespesa && hasFinancings && <option value="__financing__">Financiamento</option>}
            </Sel>
          </Field>
          {isDespesa && isFinanciamentoCategory && (
            <Field label="Qual financiamento?" required>
              <Sel data-testid="tx-modal-financing" value={form.financing_id} onChange={e => setForm({...form, financing_id: e.target.value})}>
                <option value="">Selecione o financiamento</option>
                {financings.filter(f => f.status === "ativo").map(f => (
                  <option key={f.id} value={f.id}>{f.nome} (Parcela: {fmt(f.valor_parcela)} - {f.parcela_atual}/{f.parcelas})</option>
                ))}
              </Sel>
            </Field>
          )}
          <Field label="Descricao" required><Inp data-testid="tx-modal-descricao" placeholder="Descreva a transacao" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} /></Field>
          <Field label={tipo === "receita" ? "Metodo de Recebimento" : "Metodo de Pagamento"}>
            <Sel data-testid="tx-modal-metodo" value={form.metodo} onChange={e => setForm({...form, metodo: e.target.value, card_id: e.target.value !== "Crédito" ? "" : form.card_id})}>
              <option value="">Selecione (opcional)</option>
              {["Pix","Transferencia","Debito","Credito","Dinheiro","Boleto"].map(m => <option key={m} value={m}>{m}</option>)}
            </Sel>
          </Field>
          
          {isDespesa && isCredito && (
            <div data-testid="tx-modal-installment-section" className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-4">
              <p className="text-purple-400 text-xs font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                Opcoes de Parcelamento
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Parcelas">
                  <Sel data-testid="tx-modal-parcelas" value={form.parcelas} onChange={e => setForm({...form, parcelas: e.target.value})}>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                      <option key={n} value={n}>{n}x {form.valor ? `de R$ ${(Number(form.valor) / n).toFixed(2)}` : ""}</option>
                    ))}
                  </Sel>
                </Field>
                <Field label="Cartao" required>
                  <Sel data-testid="tx-modal-card" value={form.card_id} onChange={e => setForm({...form, card_id: e.target.value})}>
                    <option value="">Selecione o cartao</option>
                    {cards && cards.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} (Disp: R$ {(c.limite - (c.usado || 0)).toFixed(2)})</option>
                    ))}
                  </Sel>
                </Field>
              </div>
              {valorParcela && (
                <div data-testid="tx-modal-parcela-info" className="flex items-center justify-between bg-white/[0.04] rounded-lg px-3 py-2">
                  <span className="text-white/50 text-xs">{form.parcelas}x de</span>
                  <span className="text-white font-semibold">R$ {valorParcela}</span>
                </div>
              )}
            </div>
          )}
          
          <Field label="Tags"><div className="flex flex-wrap gap-2">{tags.map(t => (<button key={t.id} type="button" onClick={() => toggleTag(t.id)} className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors ${form.tags.includes(t.id) ? "border-white/30 text-white" : "border-white/[0.08] text-white/40"}`} style={form.tags.includes(t.id) ? { backgroundColor: t.cor + "20", borderColor: t.cor + "60" } : {}}>{t.nome}</button>))}</div></Field>
          
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            {[{k:"recorrente",l:"Recorrente"},{k:"pago",l:"Ja pago"},{k:"detalhado",l:"Detalhar itens"}].filter(tog => !(isCredito && tog.k === "pago")).map(tog => (
              <label key={tog.k} className="flex items-center gap-2 cursor-pointer"><button type="button" onClick={() => setForm(f => ({...f, [tog.k]: !f[tog.k]}))} className={`w-9 h-5 rounded-full transition-colors relative ${form[tog.k] ? "bg-emerald-500" : "bg-white/10"}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${form[tog.k] ? "translate-x-[18px]" : "translate-x-[3px]"}`} /></button><span className="text-white/50 text-xs">{tog.l}</span></label>
            ))}
          </div>
          
          {form.detalhado && (<div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.06]"><p className="text-white/40 text-xs mb-3">Itens do detalhamento</p>{form.itens.map((it, i) => (<div key={i} className="flex items-center justify-between py-1.5"><span className="text-white/60 text-xs">{it.nome}</span><div className="flex items-center gap-2"><span className="text-white text-xs font-medium">{fmt(it.valor)}</span><button type="button" onClick={() => removeItem(i)} className="text-red-400/50 hover:text-red-400"><X className="w-3 h-3" /></button></div></div>))}<div className="flex gap-2 mt-2"><Inp placeholder="Item" value={newItem.nome} onChange={e => setNewItem({...newItem, nome: e.target.value})} className="!py-1.5 text-xs" /><Inp type="number" placeholder="Valor" value={newItem.valor} onChange={e => setNewItem({...newItem, valor: e.target.value})} className="!py-1.5 text-xs !w-24" /><button type="button" onClick={addItem} className="text-emerald-400 shrink-0 px-2"><Plus className="w-4 h-4" /></button></div></div>)}
        </div>
        <DialogFooter className="gap-2"><Btn variant="secondary" onClick={onClose}>Cancelar</Btn><Btn data-testid="tx-modal-save" onClick={handleSave}>{item ? "Salvar" : "Criar"}</Btn></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TxPage({ tipo }) {
  const { transactions, categories, tags, cards, financings, createTransaction, updateTransaction, deleteTransaction, createInstallmentBatch, payFinancingCustom } = useData();
  const tx = useMemo(() => transactions.filter(t => t.tipo === tipo), [transactions, tipo]);
  const [modalOpen, setMO] = useState(false);
  const [editItem, setEI] = useState(null);
  const [search, setSearch] = useState("");
  const [catF, setCatF] = useState("");
  const [expId, setExpId] = useState(null);
  const [tab, setTab] = useState("pendentes"); // pendentes | finalizadas (only for despesas)
  const [finalizarModal, setFinalizarModal] = useState(null); // transaction to finalize
  const [finalizarQtd, setFinalizarQtd] = useState(1);
  
  const isDespesa = tipo === "despesa";
  
  const filtered = useMemo(() => {
    let list = tx.filter(t => { if (search && !t.descricao.toLowerCase().includes(search.toLowerCase())) return false; if (catF && t.categoria !== catF) return false; return true; });
    if (isDespesa) {
      list = tab === "pendentes" ? list.filter(t => !t.pago) : list.filter(t => t.pago);
    }
    return list;
  }, [tx, search, catF, isDespesa, tab]);
  
  const total = filtered.reduce((a, b) => a + b.valor, 0);
  const pendCount = useMemo(() => isDespesa ? tx.filter(t => !t.pago).length : 0, [tx, isDespesa]);
  const finCount = useMemo(() => isDespesa ? tx.filter(t => t.pago).length : 0, [tx, isDespesa]);
  
  const save = async (item) => { try { if (item.id) await updateTransaction(item.id, item); else await createTransaction(item); setEI(null); } catch (e) { console.error(e); } };
  const handleDelete = async (id) => { try { await deleteTransaction(id); } catch (e) { console.error(e); } };
  
  // Finalizar recorrente: cria N copias como "pago" e marca a original como paga
  const handleFinalizar = async () => {
    if (!finalizarModal) return;
    const t = finalizarModal;
    const qtd = Number(finalizarQtd) || 1;
    try {
      // Criar transacoes adicionais (copias pagas) para cada parcela extra
      for (let i = 0; i < qtd - 1; i++) {
        const nextDate = new Date(t.data_vencimento || t.data);
        nextDate.setMonth(nextDate.getMonth() + i + 1);
        await createTransaction({
          descricao: t.descricao,
          categoria_id: t.categoria_id,
          valor: t.valor,
          tipo: t.tipo,
          data: nextDate.toISOString().split("T")[0],
          data_vencimento: nextDate.toISOString().split("T")[0],
          metodo: t.metodo,
          tags: t.tags || [],
          recorrente: false,
          pago: true,
        });
      }
      // Marcar a original como paga e nao recorrente
      await updateTransaction(t.id, { pago: true, recorrente: false });
      setFinalizarModal(null);
      setFinalizarQtd(1);
    } catch (e) { console.error(e); }
  };
  
  const renderRow = (t) => (
    <div key={t.id}>
      {/* Desktop row */}
      <div className="hidden md:grid grid-cols-[100px_1fr_140px_130px_100px] gap-2 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors border-b border-white/[0.03]">
        <span className="text-white/40 text-xs">
          {t.data_vencimento ? new Date(t.data_vencimento).toLocaleDateString("pt-BR") : new Date(t.data).toLocaleDateString("pt-BR")}
        </span>
        <div>
          <p className="text-white text-sm font-medium">{t.descricao}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {t.metodo && <span className="text-white/25 text-xs">{t.metodo}</span>}
            {t.recorrente && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 flex items-center gap-1"><RotateCcw className="w-2.5 h-2.5" /> Recorrente</span>}
            {t.pago ? <Check className="w-3 h-3 text-emerald-400/50" /> : <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">Pendente</span>}
            {!t.data_vencimento && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">Sem vencimento</span>}
            {t.tags?.map(tid => { const tg = tags.find(x => x.id === tid); return tg ? <span key={tid} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: tg.cor + "20", color: tg.cor }}>{tg.nome}</span> : null; })}
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-md border inline-block w-fit" style={{ borderColor: (categories.find(c => c.nome === t.categoria)?.cor || "#fff") + "40", color: categories.find(c => c.nome === t.categoria)?.cor || "#fff" }}>{t.categoria}</span>
        <span className={`text-sm font-semibold ${tipo === "receita" ? "text-emerald-400" : "text-red-400"}`}>{tipo === "receita" ? "+" : "-"}{fmt(t.valor)}</span>
        <div className="flex gap-2">
          {isDespesa && t.recorrente && !t.pago && <button onClick={() => { setFinalizarModal(t); setFinalizarQtd(1); }} className="text-emerald-400/60 hover:text-emerald-400" title="Finalizar"><CheckCircle className="w-3.5 h-3.5" /></button>}
          {isDespesa && !t.pago && !t.recorrente && <button onClick={async () => { await updateTransaction(t.id, { pago: true }); }} className="text-emerald-400/40 hover:text-emerald-400" title="Marcar como pago"><Check className="w-3.5 h-3.5" /></button>}
          <button onClick={() => { setEI(t); setMO(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => handleDelete(t.id)} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {/* Mobile card */}
      <div className="md:hidden px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02]">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{t.descricao}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-white/30 text-xs">{t.data_vencimento ? new Date(t.data_vencimento).toLocaleDateString("pt-BR") : new Date(t.data).toLocaleDateString("pt-BR")}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md border" style={{ borderColor: (categories.find(c => c.nome === t.categoria)?.cor || "#fff") + "40", color: categories.find(c => c.nome === t.categoria)?.cor || "#fff" }}>{t.categoria}</span>
              {t.recorrente && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400"><RotateCcw className="w-2.5 h-2.5 inline" /> Rec.</span>}
              {!t.pago && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">Pendente</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <span className={`text-sm font-semibold whitespace-nowrap ${tipo === "receita" ? "text-emerald-400" : "text-red-400"}`}>{tipo === "receita" ? "+" : "-"}{fmt(t.valor)}</span>
            <div className="flex gap-1">
              {isDespesa && t.recorrente && !t.pago && <button onClick={() => { setFinalizarModal(t); setFinalizarQtd(1); }} className="text-emerald-400/60 hover:text-emerald-400 p-1"><CheckCircle className="w-3.5 h-3.5" /></button>}
              {isDespesa && !t.pago && !t.recorrente && <button onClick={async () => { await updateTransaction(t.id, { pago: true }); }} className="text-emerald-400/40 hover:text-emerald-400 p-1"><Check className="w-3.5 h-3.5" /></button>}
              <button onClick={() => { setEI(t); setMO(true); }} className="text-white/30 hover:text-white/60 p-1"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(t.id)} className="text-red-400/40 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      </div>
      {expId === t.id && t.itens?.length > 0 && (<div className="px-4 md:px-8 py-3 bg-white/[0.01] border-b border-white/[0.03]">{t.itens.map((it, i) => (<div key={i} className="flex justify-between py-1"><span className="text-white/40 text-xs">{it.nome}</span><span className="text-white/60 text-xs">{fmt(it.valor)}</span></div>))}</div>)}
    </div>
  );
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="text-white text-xl sm:text-2xl font-bold">{tipo === "receita" ? "Receitas" : "Despesas"}</h1><p className="text-white/40 text-sm mt-1">Gerencie suas {tipo === "receita" ? "receitas" : "despesas"}</p></div>
        <Btn onClick={() => { setEI(null); setMO(true); }}><Plus className="w-4 h-4 inline mr-1" />{tipo === "receita" ? "Nova Receita" : "Nova Despesa"}</Btn>
      </div>
      
      {/* Tabs for despesas: Pendentes / Finalizadas */}
      {isDespesa && (
        <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1 w-fit mb-4" data-testid="despesas-tabs">
          <button onClick={() => setTab("pendentes")} className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === "pendentes" ? "bg-amber-500/20 text-amber-400 font-medium" : "text-white/40 hover:text-white/60"}`}>
            Pendentes {pendCount > 0 && <span className="ml-1 text-xs bg-amber-500/20 px-1.5 py-0.5 rounded">{pendCount}</span>}
          </button>
          <button onClick={() => setTab("finalizadas")} className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === "finalizadas" ? "bg-emerald-500/20 text-emerald-400 font-medium" : "text-white/40 hover:text-white/60"}`}>
            Finalizadas {finCount > 0 && <span className="ml-1 text-xs bg-emerald-500/20 px-1.5 py-0.5 rounded">{finCount}</span>}
          </button>
        </div>
      )}
      
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 mb-4"><div className="flex flex-wrap gap-3"><div className="relative flex-1 min-w-[200px]"><Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" /><Inp placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="!pl-10" /></div><Sel value={catF} onChange={e => setCatF(e.target.value)} className="!w-auto min-w-[180px]"><option value="">Todas categorias</option>{categories.filter(c => c.tipo === tipo || c.tipo === "ambos").map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}</Sel></div></div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 mb-4 flex justify-between items-center"><span className="text-white/50 text-sm">{filtered.length} {isDespesa ? (tab === "pendentes" ? "pendentes" : "finalizadas") : "transacoes"}</span><span className={`font-semibold ${tipo === "receita" ? "text-emerald-400" : "text-red-400"}`}>Total: {fmt(total)}</span></div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[100px_1fr_140px_130px_100px] gap-2 px-5 py-3 border-b border-white/[0.04] text-white/30 text-xs font-medium">
          <span>{isDespesa ? "Vencimento" : "Data"}</span><span>Descricao</span><span>Categoria</span><span>Valor</span><span>Acoes</span>
        </div>
        {filtered.length > 0 ? filtered.map(renderRow) : (
          <div className="text-center py-12"><p className="text-white/30 text-sm">{isDespesa ? (tab === "pendentes" ? "Nenhuma despesa pendente" : "Nenhuma despesa finalizada") : "Nenhuma transacao"}</p></div>
        )}
      </div>
      
      {/* Finalizar Pagamento Modal */}
      <Dialog open={!!finalizarModal} onOpenChange={() => setFinalizarModal(null)}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Finalizar Pagamento Recorrente</DialogTitle></DialogHeader>
          {finalizarModal && (
            <div className="space-y-4 py-2">
              <div className="bg-white/[0.03] rounded-lg p-3">
                <p className="text-white text-sm font-medium">{finalizarModal.descricao}</p>
                <p className="text-white/40 text-xs mt-1">Valor por parcela: {fmt(finalizarModal.valor)}</p>
              </div>
              <Field label="Quantas parcelas pagar de uma vez?">
                <Sel data-testid="finalizar-qtd" value={finalizarQtd} onChange={e => setFinalizarQtd(e.target.value)}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>{n}x = {fmt(finalizarModal.valor * n)}</option>
                  ))}
                </Sel>
              </Field>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-emerald-400 text-xs">Total a pagar: <strong>{fmt(finalizarModal.valor * Number(finalizarQtd))}</strong></p>
                <p className="text-white/40 text-[10px] mt-1">Sera registrado como {finalizarQtd} despesa(s) paga(s) e a recorrencia sera encerrada.</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Btn variant="secondary" onClick={() => setFinalizarModal(null)}>Cancelar</Btn>
            <Btn data-testid="finalizar-btn" onClick={handleFinalizar}>Finalizar</Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <TransactionModal open={modalOpen} onClose={() => { setMO(false); setEI(null); }} onSave={save} item={editItem} tipo={tipo} categories={categories} tags={tags} cards={cards} onCreateInstallmentBatch={createInstallmentBatch} financings={financings} onPayFinancingCustom={payFinancingCustom} />
    </div>
  );
}

export function ReceitasSection() { return <TxPage tipo="receita" />; }
export function DespesasSection() { return <TxPage tipo="despesa" />; }
export { TransactionModal };

export function CategoriasSection() {
  const { categories, createCategory, updateCategory, deleteCategory } = useData();
  const [modalOpen, setMO] = useState(false);
  const [editCat, setEC] = useState(null);
  const [form, setForm] = useState({ nome: "", cor: "#6366f1", tipo: "despesa" });
  React.useEffect(() => { if (editCat) setForm({ nome: editCat.nome, cor: editCat.cor, tipo: editCat.tipo }); else setForm({ nome: "", cor: "#6366f1", tipo: "despesa" }); }, [editCat, modalOpen]);
  const save = async () => { if (!form.nome) return; try { if (editCat) await updateCategory(editCat.id, form); else await createCategory(form); setMO(false); setEC(null); } catch (e) { console.error(e); } };
  const handleDelete = async (id) => { try { await deleteCategory(id); } catch (e) { console.error(e); } };
  const colors = ["#6366f1","#8b5cf6","#a78bfa","#22c55e","#ef4444","#f97316","#3b82f6","#ec4899","#14b8a6","#64748b"];
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-white text-2xl font-bold">Categorias</h1><p className="text-white/40 text-sm mt-1">Gerencie suas categorias</p></div><Btn onClick={() => { setEC(null); setMO(true); }}><Plus className="w-4 h-4 inline mr-1" />Nova Categoria</Btn></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{categories.map(cat => (<div key={cat.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.cor + "20" }}><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} /></div><span className="text-white font-medium">{cat.nome}</span></div><div className="flex gap-2"><button onClick={() => { setEC(cat); setMO(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(cat.id)} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div></div><span className={`text-[10px] px-2 py-1 rounded-md ${cat.tipo === "receita" ? "bg-emerald-500/15 text-emerald-400" : cat.tipo === "despesa" ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}>{cat.tipo === "receita" ? "Receita" : cat.tipo === "despesa" ? "Despesa" : "Ambos"}</span></div>))}</div>
      <Dialog open={modalOpen} onOpenChange={() => { setMO(false); setEC(null); }}><DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md"><DialogHeader><DialogTitle className="text-white">{editCat ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader><div className="space-y-4 py-2"><Field label="Nome" required><Inp placeholder="Nome da categoria" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></Field><Field label="Tipo" required><Sel value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}><option value="despesa">Despesa</option><option value="receita">Receita</option><option value="ambos">Ambos</option></Sel></Field><Field label="Cor"><div className="flex gap-2 flex-wrap">{colors.map(c => (<button key={c} onClick={() => setForm({...form, cor: c})} className={`w-8 h-8 rounded-lg transition-all ${form.cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#111111]" : ""}`} style={{ backgroundColor: c }} />))}</div></Field></div><DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setMO(false); setEC(null); }}>Cancelar</Btn><Btn onClick={save}>{editCat ? "Salvar" : "Criar"}</Btn></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

export function BudgetSection() {
  const { budgets, categories, createBudget, updateBudget, deleteBudget } = useData();
  const [modalOpen, setMO] = useState(false);
  const [editB, setEB] = useState(null);
  const [form, setForm] = useState({ categoria_id: "", limite: "" });
  React.useEffect(() => { if (editB) setForm({ categoria_id: editB.categoria_id, limite: editB.limite }); else setForm({ categoria_id: "", limite: "" }); }, [editB, modalOpen]);
  const tL = budgets.reduce((a, b) => a + b.limite, 0); const tG = budgets.reduce((a, b) => a + b.gasto, 0);
  const save = async () => { if (!form.categoria_id || !form.limite) return; try { if (editB) await updateBudget(editB.id, { categoria_id: form.categoria_id, limite: Number(form.limite) }); else await createBudget({ categoria_id: form.categoria_id, limite: Number(form.limite) }); setMO(false); setEB(null); } catch (e) { console.error(e); } };
  const handleDelete = async (id) => { try { await deleteBudget(id); } catch (e) { console.error(e); } };
  const cats = categories;
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-white text-2xl font-bold">Orçamento</h1><p className="text-white/40 text-sm mt-1">Defina limites de gastos por categoria</p></div><Btn onClick={() => { setEB(null); setMO(true); }}><Plus className="w-4 h-4 inline mr-1" />Novo Orçamento</Btn></div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6"><div className="flex items-center justify-between mb-3"><span className="text-white/50 text-sm">Orçamento Total</span><span className="text-white text-sm font-medium">{fmt(tG)} de {fmt(tL)}</span></div><div className="w-full bg-white/[0.06] rounded-full h-2.5"><div className="bg-emerald-400 h-2.5 rounded-full transition-all" style={{ width: `${Math.min((tG / tL) * 100, 100)}%` }} /></div><p className="text-white/30 text-xs mt-2">{((tG / tL) * 100).toFixed(1)}% utilizado</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{budgets.map(b => { const pct = b.limite > 0 ? (b.gasto / b.limite) * 100 : 0; const ov = pct > 90; return (<div key={b.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all"><div className="flex items-center justify-between mb-3"><span className="text-white font-medium text-sm">{b.categoria}</span><div className="flex items-center gap-2"><span className={`text-xs font-medium px-2 py-1 rounded-md ${ov ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>{pct.toFixed(0)}%</span><button onClick={() => { setEB(b); setMO(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(b.id)} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div></div><div className="w-full bg-white/[0.06] rounded-full h-2 mb-2"><div className={`h-2 rounded-full transition-all ${ov ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div><div className="flex justify-between"><span className="text-white/30 text-xs">{fmt(b.gasto)}</span><span className="text-white/30 text-xs">{fmt(b.limite)}</span></div></div>); })}</div>
      <Dialog open={modalOpen} onOpenChange={() => { setMO(false); setEB(null); }}><DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md"><DialogHeader><DialogTitle className="text-white">{editB ? "Editar" : "Novo"} Orçamento</DialogTitle></DialogHeader><div className="space-y-4 py-2"><Field label="Categoria" required><Sel value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})}><option value="">Selecione</option>{cats.filter(c => c.tipo === "despesa" || c.tipo === "ambos").map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Sel></Field><Field label="Limite (R$)" required><Inp type="number" placeholder="1200" value={form.limite} onChange={e => setForm({...form, limite: e.target.value})} /></Field></div><DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setMO(false); setEB(null); }}>Cancelar</Btn><Btn onClick={save}>{editB ? "Salvar" : "Criar"}</Btn></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

export function HeatmapSection() {
  const [mo, setMo] = useState(new Date().getMonth());
  const [yr, setYr] = useState(new Date().getFullYear());
  const mos = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const dim = new Date(yr, mo + 1, 0).getDate();
  const fd = new Date(yr, mo, 1).getDay();
  const days = useMemo(() => Array.from({ length: dim }, (_, i) => ({ day: i + 1, gasto: Math.random() > 0.4 ? Math.round(Math.random() * 3200) : 0 })), [mo, yr, dim]);
  const tot = days.reduce((a, b) => a + b.gasto, 0); const dg = days.filter(d => d.gasto > 0).length; const mx = Math.max(...days.map(d => d.gasto), 1);
  const gc = (v) => { if (v === 0) return "rgba(255,255,255,0.03)"; const r = v / mx; return r > 0.75 ? "rgba(239,68,68,0.8)" : r > 0.5 ? "rgba(239,68,68,0.55)" : r > 0.25 ? "rgba(239,68,68,0.35)" : "rgba(239,68,68,0.18)"; };
  return (
    <div>
      <div className="mb-6"><h1 className="text-white text-xl sm:text-2xl font-bold">Heatmap de Gastos</h1><p className="text-white/40 text-sm mt-1">Visualize gastos diarios no calendario</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4"><p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Total do Mes</p><p className="text-red-400 font-bold text-base sm:text-lg">{fmt(tot)}</p></div>
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4"><p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Media Diaria</p><p className="text-white font-bold text-base sm:text-lg">{fmt(dg > 0 ? tot / dg : 0)}</p></div>
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4"><p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Maior Gasto</p><p className="text-red-400 font-bold text-base sm:text-lg">{fmt(mx)}</p></div>
      </div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-3 sm:p-5 mb-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button onClick={() => { if (mo === 0) { setMo(11); setYr(y => y-1); } else setMo(m => m-1); }} className="text-white/30 hover:text-white/60 p-1">&lt;</button>
          <Sel value={mo} onChange={e => setMo(Number(e.target.value))} className="!w-auto text-xs sm:text-sm">{mos.map((m, i) => <option key={i} value={i}>{m}</option>)}</Sel>
          <Sel value={yr} onChange={e => setYr(Number(e.target.value))} className="!w-auto text-xs sm:text-sm">{[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}</Sel>
          <button onClick={() => { if (mo === 11) { setMo(0); setYr(y => y+1); } else setMo(m => m+1); }} className="text-white/30 hover:text-white/60 p-1">&gt;</button>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">{["D","S","T","Q","Q","S","S"].map((d, i) => <div key={i} className="text-center text-white/30 text-[10px] sm:text-xs font-medium py-1">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">{Array.from({ length: fd }).map((_, i) => <div key={`e-${i}`} />)}{days.map(d => (<div key={d.day} className="aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center cursor-pointer hover:ring-1 hover:ring-white/20 transition-all" style={{ backgroundColor: gc(d.gasto) }} title={`Dia ${d.day}: ${fmt(d.gasto)}`}><span className="text-white/70 text-[10px] sm:text-xs font-medium">{d.day}</span>{d.gasto > 0 && <span className="text-white/50 text-[8px] sm:text-[10px] hidden sm:block">{d.gasto >= 1000 ? `${(d.gasto / 1000).toFixed(1)}k` : d.gasto}</span>}</div>))}</div>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4"><span className="text-white/30 text-[10px] sm:text-xs">Menor</span>{["rgba(239,68,68,0.18)","rgba(239,68,68,0.35)","rgba(239,68,68,0.55)","rgba(239,68,68,0.8)"].map((c, i) => <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 rounded" style={{ backgroundColor: c }} />)}<span className="text-white/30 text-[10px] sm:text-xs">Maior</span></div>
      </div>
    </div>
  );
}

export function ReportsSection() {
  const [sd, setSd] = useState("2025-07-01"); const [ed, setEd] = useState("2025-07-31");
  const setQ = (d) => { const n = new Date(); if (d === "7d") { setSd(new Date(n - 7*864e5).toISOString().split("T")[0]); setEd(n.toISOString().split("T")[0]); } else if (d === "month") { setSd(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-01`); setEd(n.toISOString().split("T")[0]); } else if (d === "quarter") { const m = Math.max(n.getMonth()-2, 0); setSd(`${n.getFullYear()}-${String(m+1).padStart(2,"0")}-01`); setEd(n.toISOString().split("T")[0]); } else { setSd(`${n.getFullYear()}-01-01`); setEd(n.toISOString().split("T")[0]); } };
  return (
    <div>
      <div className="mb-6"><h1 className="text-white text-2xl font-bold">Relatórios</h1><p className="text-white/40 text-sm mt-1">Análises detalhadas</p></div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6"><h3 className="text-white font-medium mb-4">Período do Relatório</h3><div className="flex flex-wrap items-end gap-4"><Field label="Data Início"><Inp type="date" value={sd} onChange={e => setSd(e.target.value)} className="[color-scheme:dark]" /></Field><Field label="Data Fim"><Inp type="date" value={ed} onChange={e => setEd(e.target.value)} className="[color-scheme:dark]" /></Field><div className="flex gap-2 pb-0.5">{[{k:"7d",l:"Últimos 7 dias"},{k:"month",l:"Este mês"},{k:"quarter",l:"Trimestre"},{k:"year",l:"Este ano"}].map(q => (<button key={q.k} onClick={() => setQ(q.k)} className="text-white/40 text-xs px-3 py-2.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] hover:text-white/70 transition-colors">{q.l}</button>))}</div></div></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[{ t: "Relatório Mensal", d: "Resumo completo", i: Calendar },{ t: "Fluxo de Caixa", d: "Entradas e saídas", i: BarChart3 },{ t: "Análise de Gastos", d: "Por categoria", i: PieChart }].map(r => (<div key={r.t} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all cursor-pointer group"><div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/10"><r.i className="w-5 h-5 text-white/50 group-hover:text-white/80" /></div><h3 className="text-white font-medium mb-1">{r.t}</h3><p className="text-white/30 text-sm">{r.d}</p><p className="text-white/20 text-xs mt-2">{sd} até {ed}</p><button className="mt-4 text-white/50 text-sm flex items-center gap-1 group-hover:text-white/80"><Download className="w-4 h-4" /> Baixar PDF</button></div>))}</div>
    </div>
  );
}

export function MetasSection() {
  const { goals, createGoal, updateGoal, deleteGoal, contributeToGoal } = useData();
  const [modalOpen, setMO] = useState(false); const [eG, sEG] = useState(null); const [form, setForm] = useState({ nome: "", valor_meta: "", prazo: "" }); const [apId, sApId] = useState(null); const [apVal, sApVal] = useState("");
  React.useEffect(() => { if (eG) setForm({ nome: eG.nome, valor_meta: eG.valor_meta, prazo: eG.prazo }); else setForm({ nome: "", valor_meta: "", prazo: "" }); }, [eG, modalOpen]);
  const save = async () => { if (!form.nome || !form.valor_meta) return; try { if (eG) await updateGoal(eG.id, { nome: form.nome, valor_meta: Number(form.valor_meta), prazo: form.prazo }); else await createGoal({ nome: form.nome, valor_meta: Number(form.valor_meta), prazo: form.prazo || "2026-12-31", icone: "Target" }); setMO(false); sEG(null); } catch(e) { console.error(e); } };
  const aporte = async (id) => { const v = Number(apVal); if (!v) return; try { await contributeToGoal(id, v); sApVal(""); sApId(null); } catch(e) { console.error(e); } };
  const handleDelete = async (id) => { try { await deleteGoal(id); } catch(e) { console.error(e); } };
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-white text-2xl font-bold">Metas Financeiras</h1><p className="text-white/40 text-sm mt-1">Defina e acompanhe suas metas</p></div><Btn onClick={() => { sEG(null); setMO(true); }}><Plus className="w-4 h-4 inline mr-1" />Nova Meta</Btn></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{goals.map(g => { const pct = g.valor_meta > 0 ? Math.min((g.valor_atual / g.valor_meta) * 100, 100) : 0; return (<div key={g.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Target className="w-4 h-4 text-white/50" /><span className="text-white font-medium">{g.nome}</span></div><div className="flex gap-2"><button onClick={() => { sEG(g); setMO(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(g.id)} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div></div><div className="flex justify-between mb-2"><span className="text-white/40 text-xs">Progresso</span><span className="text-white/60 text-xs font-medium">{pct.toFixed(1)}%</span></div><div className="w-full bg-white/[0.06] rounded-full h-2 mb-3"><div className="bg-white/60 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} /></div><div className="flex justify-between mb-4"><span className="text-white/40 text-xs">{fmt(g.valor_atual)}</span><span className="text-white/40 text-xs">{fmt(g.valor_meta)}</span></div><div className="pt-3 border-t border-white/[0.06] flex items-center justify-between"><div className="flex items-center gap-1.5 text-white/30 text-xs"><Calendar className="w-3.5 h-3.5" />Prazo: {new Date(g.prazo).toLocaleDateString("pt-BR")}</div>{apId === g.id ? (<div className="flex items-center gap-2"><Inp type="number" value={apVal} onChange={e => sApVal(e.target.value)} placeholder="R$" className="!w-24 !py-1.5 text-xs" autoFocus /><button onClick={() => aporte(g.id)} className="text-emerald-400 text-xs font-medium">OK</button><button onClick={() => { sApId(null); sApVal(""); }} className="text-white/30 text-xs">x</button></div>) : (<button onClick={() => sApId(g.id)} className="flex items-center gap-1 text-white/50 text-xs border border-white/[0.08] px-2.5 py-1 rounded-md hover:bg-white/[0.04]"><Plus className="w-3 h-3" /> Aporte</button>)}</div></div>); })}</div>
      <Dialog open={modalOpen} onOpenChange={() => { setMO(false); sEG(null); }}><DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md"><DialogHeader><DialogTitle className="text-white">{eG ? "Editar" : "Nova"} Meta</DialogTitle></DialogHeader><div className="space-y-4 py-2"><Field label="Nome" required><Inp placeholder="Ex: Viagem" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></Field><Field label="Valor Meta (R$)" required><Inp type="number" placeholder="10000" value={form.valor_meta} onChange={e => setForm({...form, valor_meta: e.target.value})} /></Field><Field label="Prazo"><Inp type="date" value={form.prazo} onChange={e => setForm({...form, prazo: e.target.value})} className="[color-scheme:dark]" /></Field></div><DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setMO(false); sEG(null); }}>Cancelar</Btn><Btn onClick={save}>{eG ? "Salvar" : "Criar"}</Btn></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

export function ImportSection() {
  return (<div><div className="mb-6"><h1 className="text-white text-2xl font-bold">Importar Extratos</h1><p className="text-white/40 text-sm mt-1">Importe extratos bancários</p></div><div className="bg-[#111111] border border-dashed border-white/[0.1] rounded-xl p-12 flex flex-col items-center justify-center"><div className="w-16 h-16 bg-white/[0.04] rounded-xl flex items-center justify-center mb-4"><Download className="w-8 h-8 text-white/30" /></div><p className="text-white/60 text-sm font-medium mb-1">Arraste seu extrato aqui</p><p className="text-white/30 text-xs mb-4">Formatos: CSV, OFX, PDF</p><Btn>Selecionar Arquivo</Btn></div></div>);
}

export function SettingsSection() {
  const { user } = useData();
  const [prefs, setP] = useState([{ label: "Notificações por email", on: true },{ label: "Alertas de orçamento", on: true },{ label: "Relatórios semanais", on: false }]);
  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  return (<div><div className="mb-6"><h1 className="text-white text-2xl font-bold">Configurações</h1><p className="text-white/40 text-sm mt-1">Gerencie suas preferências</p></div><div className="space-y-4"><div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5"><h3 className="text-white font-medium mb-4">Perfil</h3><div className="flex items-center gap-4">{user?.picture ? <img src={user.picture} alt={user.name} className="w-14 h-14 rounded-full" /> : <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center"><span className="text-white font-semibold text-lg">{userInitials}</span></div>}<div><p className="text-white font-medium">{user?.name || 'Usuário'}</p><p className="text-white/40 text-sm">{user?.email || ''}</p></div></div></div><div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5"><h3 className="text-white font-medium mb-4">Preferências</h3><div className="space-y-4">{prefs.map((p, i) => (<div key={p.label} className="flex items-center justify-between"><span className="text-white/60 text-sm">{p.label}</span><button onClick={() => setP(pr => pr.map((x, j) => j === i ? {...x, on: !x.on} : x))} className={`w-10 h-6 rounded-full transition-colors relative ${p.on ? "bg-emerald-500" : "bg-white/10"}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${p.on ? "translate-x-5" : "translate-x-1"}`} /></button></div>))}</div></div></div></div>);
}
