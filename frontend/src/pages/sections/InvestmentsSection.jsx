import React, { useState, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { TrendingUp, Plus, X, Minus, DollarSign, Calendar, Pencil, Trash2, Landmark, Home, Target } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0);
const fmtNum = (v) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0);
const fmtC = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString());
const TP = ["7d", "1m", "3m", "6m", "1y", "5y", "10y", "25y"];
const Field = ({ label, required, children }) => (<div><label className="text-white/60 text-xs block mb-1.5">{label}{required && " *"}</label>{children}</div>);
const Inp = (props) => (<input {...props} className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 placeholder:text-white/25 ${props.className || ""}`} />);
const MoneyInp = ({ value, onValueChange, ...rest }) => {
  const formatFromNum = (num) => {
    if (!num && num !== 0) return "";
    const fixed = Number(num).toFixed(2);
    const [int, dec] = fixed.split(".");
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + dec;
  };
  const [display, setDisplay] = React.useState(() => value ? formatFromNum(value) : "");
  React.useEffect(() => { if (!value && value !== 0) setDisplay(""); }, [value]);
  const handleChange = (e) => {
    let raw = e.target.value.replace(/[^\d]/g, "");
    if (!raw) { setDisplay(""); onValueChange(""); return; }
    raw = raw.replace(/^0+/, "") || "0";
    while (raw.length < 3) raw = "0" + raw;
    const cents = raw.slice(-2);
    let intPart = raw.slice(0, -2).replace(/^0+/, "") || "0";
    setDisplay(intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + cents);
    onValueChange(parseFloat(intPart + "." + cents));
  };
  return <input {...rest} type="text" inputMode="numeric" placeholder="0,00" value={display} onChange={handleChange} className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 placeholder:text-white/25 ${rest.className || ""}`} />;
};
const Sel = ({ children, ...rest }) => (<select {...rest} className={`w-full bg-[#1a1a1a] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 ${rest.className || ""}`} style={{ colorScheme: 'dark' }}>{children}</select>);
const Btn = ({ children, variant = "primary", ...rest }) => (<button {...rest} className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${variant === "primary" ? "bg-white text-black hover:bg-gray-100" : "text-white/40 border border-white/[0.08] hover:bg-white/[0.04]"}`}>{children}</button>);

export default function InvestmentsSection() {
  const {
    investments, contributions, financings, accounts, goals,
    createInvestment, updateInvestment, deleteInvestment, createContribution,
    createFinancing, updateFinancing, deleteFinancing, payFinancingInstallment,
    createGoal, updateGoal, deleteGoal, contributeToGoal,
  } = useData();

  const [chartPeriod, setCP] = useState("1y");
  const [showHistory, setSH] = useState(null);
  const [modalOpen, setMO] = useState(false);
  const [editInv, setEI] = useState(null);
  const [aporteModal, setAM] = useState(null);
  const [aporteVal, setAV] = useState("");
  const [saqueModal, setSaqueModal] = useState(null);
  const [saqueVal, setSaqueVal] = useState("");
  const [finModal, setFM] = useState(false);
  const [editFin, setEF] = useState(null);
  const [form, setForm] = useState({ nome: "", tipo: "", valor: "", rendimento: "", banco_id: "" });
  const [finForm, setFF] = useState({ nome: "", banco_id: "", valor_total: "", parcelas: "", valor_parcela: "", taxa: "" });
  // Goals states
  const [goalModal, setGoalModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({ nome: "", valor_meta: "", prazo: "" });
  const [goalAporteId, setGoalAporteId] = useState(null);
  const [goalAporteVal, setGoalAporteVal] = useState("");
  const [goalSaqueId, setGoalSaqueId] = useState(null);
  const [goalSaqueVal, setGoalSaqueVal] = useState("");

  const totalInv = investments.reduce((a, b) => a + b.valor, 0);

  // Generate chart data from contributions
  const chartData = useMemo(() => {
    const sorted = [...contributions].sort((a, b) => a.data.localeCompare(b.data));
    if (sorted.length === 0) {
      return [{ label: "Atual", valor: totalInv }];
    }
    let cumulative = 0;
    const monthly = {};
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    sorted.forEach(c => {
      const d = new Date(c.data);
      const key = `${months[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
      if (!monthly[key]) monthly[key] = 0;
      monthly[key] += c.valor;
    });
    const entries = Object.entries(monthly);
    return entries.map(([label, val]) => {
      cumulative += val;
      return { label, valor: cumulative };
    });
  }, [contributions, totalInv]);

  React.useEffect(() => {
    if (editInv) setForm({ nome: editInv.nome, tipo: editInv.tipo, valor: editInv.valor, rendimento: editInv.rendimento, banco_id: editInv.banco_id || "" });
    else setForm({ nome: "", tipo: "", valor: "", rendimento: "", banco_id: "" });
  }, [editInv, modalOpen]);

  React.useEffect(() => {
    if (editFin) setFF({ nome: editFin.nome, banco_id: editFin.banco_id || "", valor_total: editFin.valor_total, parcelas: editFin.parcelas, valor_parcela: editFin.valor_parcela, taxa: editFin.taxa });
    else setFF({ nome: "", banco_id: "", valor_total: "", parcelas: "", valor_parcela: "", taxa: "" });
  }, [editFin, finModal]);

  const saveInv = async () => {
    if (!form.nome || !form.tipo) return;
    const data = {
      nome: form.nome,
      tipo: form.tipo,
      valor: Number(form.valor) || 0,
      rendimento: Number(form.rendimento) || 0,
      banco_id: form.banco_id || null,
    };
    try {
      if (editInv) await updateInvestment(editInv.id, data);
      else await createInvestment(data);
      setMO(false); setEI(null);
    } catch (e) { console.error(e); }
  };

  const saveFin = async () => {
    if (!finForm.nome) return;
    const data = {
      nome: finForm.nome,
      banco_id: finForm.banco_id || null,
      valor_total: Number(finForm.valor_total) || 0,
      parcelas: Number(finForm.parcelas) || 0,
      valor_parcela: Number(finForm.valor_parcela) || 0,
      taxa: Number(finForm.taxa) || 0,
    };
    try {
      if (editFin) await updateFinancing(editFin.id, data);
      else await createFinancing(data);
      setFM(false); setEF(null);
    } catch (e) { console.error(e); }
  };

  const handleAporte = async (invId) => {
    const val = Number(aporteVal);
    if (!val || val <= 0) return;
    try {
      await createContribution({
        investimento_id: invId,
        valor: val,
        data: new Date().toISOString().split("T")[0],
        tipo: "aporte",
      });
      setAV(""); setAM(null);
    } catch (e) { console.error(e); }
  };

  const handleResgate = async (invId) => {
    const val = Number(saqueVal);
    if (!val || val <= 0) return;
    try {
      await createContribution({
        investimento_id: invId,
        valor: val,
        data: new Date().toISOString().split("T")[0],
        tipo: "resgate",
      });
      setSaqueVal(""); setSaqueModal(null);
    } catch (e) { console.error(e); }
  };

  // Goals handlers
  React.useEffect(() => {
    if (editGoal) setGoalForm({ nome: editGoal.nome, valor_meta: editGoal.valor_meta, prazo: editGoal.prazo });
    else setGoalForm({ nome: "", valor_meta: "", prazo: "" });
  }, [editGoal, goalModal]);

  const saveGoal = async () => {
    if (!goalForm.nome || !goalForm.valor_meta) return;
    try {
      if (editGoal) await updateGoal(editGoal.id, { nome: goalForm.nome, valor_meta: Number(goalForm.valor_meta), prazo: goalForm.prazo });
      else await createGoal({ nome: goalForm.nome, valor_meta: Number(goalForm.valor_meta), prazo: goalForm.prazo || "2026-12-31", icone: "Target" });
      setGoalModal(false); setEditGoal(null);
    } catch (e) { console.error(e); }
  };

  const handleGoalAporte = async (id) => {
    const v = Number(goalAporteVal);
    if (!v) return;
    try { await contributeToGoal(id, v); setGoalAporteVal(""); setGoalAporteId(null); } catch(e) { console.error(e); }
  };

  const handleGoalSaque = async (id) => {
    const v = Number(goalSaqueVal);
    if (!v) return;
    try { await contributeToGoal(id, -v); setGoalSaqueVal(""); setGoalSaqueId(null); } catch(e) { console.error(e); }
  };

  const handleDeleteInv = async (id) => {
    try { await deleteInvestment(id); } catch (e) { console.error(e); }
  };

  const handleDeleteFin = async (id) => {
    try { await deleteFinancing(id); } catch (e) { console.error(e); }
  };

  const handlePayFinInstallment = async (id) => {
    try { await payFinancingInstallment(id); } catch (e) { console.error(e); }
  };

  // Group investments by bank
  const invByBank = useMemo(() => {
    const map = {};
    investments.forEach(i => {
      const key = i.banco_id || "none";
      if (!map[key]) map[key] = { banco: accounts.find(a => a.id === i.banco_id), items: [] };
      map[key].items.push(i);
    });
    financings.forEach(f => {
      const key = f.banco_id || "none";
      if (!map[key]) map[key] = { banco: accounts.find(a => a.id === f.banco_id), items: [] };
      map[key].financing = f;
    });
    return map;
  }, [investments, financings, accounts]);

  // Variation calc
  const totalVariacao = investments.length > 0 ? investments.reduce((s, i) => s + (i.variacao || 0), 0) / investments.length : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-white text-2xl font-bold">Investimentos e Financiamentos</h1><p className="text-white/40 text-sm mt-1">Acompanhe sua carteira</p></div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => { setEF(null); setFM(true); }} data-testid="new-financing-btn"><Home className="w-4 h-4 inline mr-1" />+ Novo Financiamento</Btn>
          <Btn onClick={() => { setEI(null); setMO(true); }} data-testid="new-investment-btn"><Plus className="w-4 h-4 inline mr-1" />Novo Investimento</Btn>
        </div>
      </div>

      {/* Total */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6" data-testid="total-invested">
        <span className="text-white/50 text-sm">Total Investido</span>
        <p className="text-white text-3xl font-bold mt-1">{fmt(totalInv)}</p>
        <div className="flex items-center gap-1 text-emerald-400 text-sm mt-2"><TrendingUp className="w-4 h-4" /><span>{totalVariacao >= 0 ? "+" : ""}{totalVariacao.toFixed(1)}% rendimento total</span></div>
      </div>

      {/* Chart */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-4">Evolucao da Carteira</h3>
        <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1 w-fit mb-4">
          {TP.map(p => (<button key={p} onClick={() => setCP(p)} className={`px-3 py-1.5 text-xs rounded-md transition-all ${chartPeriod === p ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white/70"}`}>{p}</button>))}
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs><linearGradient id="cInv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} /><stop offset="95%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickFormatter={fmtC} />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: 13 }} formatter={(v) => [fmt(v)]} />
              <Area type="monotone" dataKey="valor" stroke="#a78bfa" strokeWidth={2} fill="url(#cInv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Investments by Bank */}
      {Object.values(invByBank).map(({ banco, items, financing }) => (
        <div key={banco?.id || "none"} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: (banco?.cor || "#666") + "20" }}>
              <Landmark className="w-3.5 h-3.5" style={{ color: banco?.cor || "#666" }} />
            </div>
            <span className="text-white/60 text-sm font-medium">{banco?.nome || "Sem banco"}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(inv => {
              const invC = contributions.filter(c => c.investimento_id === inv.id);
              return (
                <div key={inv.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all" data-testid={`investment-card-${inv.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div><p className="text-white font-medium">{inv.nome}</p><p className="text-white/30 text-xs">{inv.tipo}</p></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${(inv.variacao || 0) >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{(inv.variacao || 0) >= 0 ? "+" : ""}{(inv.variacao || 0).toFixed(1)}%</span>
                      <button onClick={() => { setEI(inv); setMO(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteInv(inv.id)} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-white text-xl font-bold">{fmt(inv.valor)}</p>
                  <p className="text-emerald-400/70 text-xs mt-1">Rendimento: {inv.rendimento}% a.a.</p>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                    {aporteModal === inv.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <MoneyInp value={aporteVal} onValueChange={v => setAV(v)} className="!py-2 text-xs" autoFocus />
                        <button onClick={() => handleAporte(inv.id)} className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-emerald-500/30">OK</button>
                        <button onClick={() => { setAM(null); setAV(""); }} className="text-white/30 p-2"><X className="w-4 h-4" /></button>
                      </div>
                    ) : saqueModal === inv.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <MoneyInp value={saqueVal} onValueChange={v => setSaqueVal(v)} className="!py-2 text-xs" autoFocus />
                        <button onClick={() => handleResgate(inv.id)} className="bg-red-500/20 text-red-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-red-500/30">OK</button>
                        <button onClick={() => { setSaqueModal(null); setSaqueVal(""); }} className="text-white/30 p-2"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setAM(inv.id)} className="flex items-center gap-1.5 text-white/50 text-xs border border-white/[0.08] px-3 py-2 rounded-lg hover:bg-white/[0.04]" data-testid={`aporte-btn-${inv.id}`}><Plus className="w-3.5 h-3.5" /> Aporte</button>
                        {inv.valor > 0 && <button onClick={() => setSaqueModal(inv.id)} className="flex items-center gap-1.5 text-red-400/50 text-xs border border-red-500/10 px-3 py-2 rounded-lg hover:bg-red-500/10" data-testid={`resgate-btn-${inv.id}`}><Minus className="w-3.5 h-3.5" /> Resgate</button>}
                        <button onClick={() => setSH(showHistory === inv.id ? null : inv.id)} className="flex items-center gap-1.5 text-white/50 text-xs border border-white/[0.08] px-3 py-2 rounded-lg hover:bg-white/[0.04]"><Calendar className="w-3.5 h-3.5" /> Historico</button>
                      </>
                    )}
                  </div>
                  {showHistory === inv.id && invC.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                      <p className="text-white/40 text-xs font-medium mb-2">Historico de Aportes</p>
                      {invC.map(c => (<div key={c.id} className="flex justify-between py-1.5"><div className="flex items-center gap-2"><DollarSign className="w-3 h-3 text-emerald-400/60" /><span className="text-white/50 text-xs">{new Date(c.data).toLocaleDateString("pt-BR")}</span></div><span className="text-emerald-400 text-xs font-medium">+{fmt(c.valor)}</span></div>))}
                    </div>
                  )}
                </div>
              );
            })}
            {financing && (
              <div className="bg-[#111111] border border-amber-500/20 rounded-xl p-5" data-testid={`financing-card-${financing.id}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Home className="w-4 h-4 text-amber-400" /><div><p className="text-white font-medium">{financing.nome}</p><p className="text-white/30 text-xs">Financiamento</p></div></div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEF(financing); setFM(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteFin(financing.id)} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-white text-xl font-bold">{fmt(financing.valor_total)}</p>
                <div className="w-full bg-white/[0.06] rounded-full h-2 my-3"><div className="bg-amber-400 h-2 rounded-full" style={{ width: `${financing.parcelas > 0 ? (financing.parcela_atual / financing.parcelas) * 100 : 0}%` }} /></div>
                <div className="flex justify-between text-white/30 text-xs"><span>Parcela {financing.parcela_atual}/{financing.parcelas}</span><span>{fmt(financing.valor_parcela)}/mes</span></div>
                <p className="text-amber-400/60 text-xs mt-2">Taxa: {financing.taxa}% a.a.</p>
                {financing.status === "ativo" && (
                  <button onClick={() => handlePayFinInstallment(financing.id)} className="mt-3 w-full text-center text-amber-400 text-xs font-medium py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors" data-testid={`pay-fin-installment-${financing.id}`}>
                    Pagar Parcela
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {investments.length === 0 && financings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/40 text-sm">Nenhum investimento ou financiamento cadastrado</p>
        </div>
      )}

      {/* Investment Modal */}
      <Dialog open={modalOpen} onOpenChange={() => { setMO(false); setEI(null); }}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editInv ? "Editar" : "Novo"} Investimento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nome" required><Inp data-testid="inv-modal-nome" placeholder="Ex: Tesouro Selic" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></Field>
            <Field label="Tipo" required><Sel data-testid="inv-modal-tipo" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}><option value="">Selecione</option>{["Renda Fixa","Acoes","FIIs","Crypto","ETF","CDB","LCI/LCA"].map(t => <option key={t} value={t}>{t}</option>)}</Sel></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Valor (R$)"><MoneyInp data-testid="inv-modal-valor" value={form.valor} onValueChange={v => setForm({...form, valor: v})} /></Field>
              <Field label="Rendimento (% a.a.)"><Inp type="number" step="0.01" placeholder="12.5" value={form.rendimento} onChange={e => setForm({...form, rendimento: e.target.value})} /></Field>
            </div>
            <Field label="Conta Bancaria"><Sel value={form.banco_id} onChange={e => setForm({...form, banco_id: e.target.value})}><option value="">Selecione (opcional)</option>{accounts.map(b => <option key={b.id} value={b.id}>{b.nome} - {b.tipo}</option>)}</Sel></Field>
          </div>
          <DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setMO(false); setEI(null); }}>Cancelar</Btn><Btn data-testid="inv-modal-save" onClick={saveInv}>{editInv ? "Salvar" : "Criar"}</Btn></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Financing Modal */}
      <Dialog open={finModal} onOpenChange={() => { setFM(false); setEF(null); }}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editFin ? "Editar" : "Novo"} Financiamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nome" required><Inp data-testid="fin-modal-nome" placeholder="Ex: Financiamento Apartamento" value={finForm.nome} onChange={e => setFF({...finForm, nome: e.target.value})} /></Field>
            <Field label="Banco"><Sel value={finForm.banco_id} onChange={e => setFF({...finForm, banco_id: e.target.value})}><option value="">Selecione (opcional)</option>{accounts.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}</Sel></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Valor Total"><MoneyInp value={finForm.valor_total} onValueChange={v => setFF({...finForm, valor_total: v})} /></Field>
              <Field label="Parcelas"><Inp type="number" placeholder="360" value={finForm.parcelas} onChange={e => setFF({...finForm, parcelas: e.target.value})} /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Valor Parcela"><MoneyInp value={finForm.valor_parcela} onValueChange={v => setFF({...finForm, valor_parcela: v})} /></Field>
              <Field label="Taxa (% a.a.)"><Inp type="number" step="0.1" placeholder="8.5" value={finForm.taxa} onChange={e => setFF({...finForm, taxa: e.target.value})} /></Field>
            </div>
          </div>
          <DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setFM(false); setEF(null); }}>Cancelar</Btn><Btn data-testid="fin-modal-save" onClick={saveFin}>{editFin ? "Salvar" : "Criar"}</Btn></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metas Financeiras Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">Metas Financeiras</h2>
          <Btn onClick={() => { setEditGoal(null); setGoalModal(true); }} data-testid="new-goal-btn"><Plus className="w-4 h-4 inline mr-1" />Nova Meta</Btn>
        </div>
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(g => {
              const pct = g.valor_meta > 0 ? Math.min((g.valor_atual / g.valor_meta) * 100, 100) : 0;
              return (
                <div key={g.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all" data-testid={`goal-card-${g.id}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2"><Target className="w-4 h-4 text-indigo-400" /><span className="text-white font-medium">{g.nome}</span></div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditGoal(g); setGoalModal(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { try { await deleteGoal(g.id); } catch(e) { console.error(e); } }} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex justify-between mb-2"><span className="text-white/40 text-xs">Progresso</span><span className="text-white/60 text-xs font-medium">{pct.toFixed(1)}%</span></div>
                  <div className="w-full bg-white/[0.06] rounded-full h-2 mb-3"><div className="bg-indigo-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                  <div className="flex justify-between mb-4"><span className="text-white/40 text-xs">{fmt(g.valor_atual)}</span><span className="text-white/40 text-xs">{fmt(g.valor_meta)}</span></div>
                  <div className="pt-3 border-t border-white/[0.06]">
                    {goalAporteId === g.id ? (
                      <div className="flex items-center gap-2">
                        <MoneyInp value={goalAporteVal} onValueChange={v => setGoalAporteVal(v)} className="!py-2 text-xs" autoFocus />
                        <button onClick={() => handleGoalAporte(g.id)} className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-2 rounded-lg">OK</button>
                        <button onClick={() => { setGoalAporteId(null); setGoalAporteVal(""); }} className="text-white/30 p-2"><X className="w-4 h-4" /></button>
                      </div>
                    ) : goalSaqueId === g.id ? (
                      <div className="flex items-center gap-2">
                        <MoneyInp value={goalSaqueVal} onValueChange={v => setGoalSaqueVal(v)} className="!py-2 text-xs" autoFocus />
                        <button onClick={() => handleGoalSaque(g.id)} className="bg-red-500/20 text-red-400 text-xs font-medium px-3 py-2 rounded-lg">OK</button>
                        <button onClick={() => { setGoalSaqueId(null); setGoalSaqueVal(""); }} className="text-white/30 p-2"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => setGoalAporteId(g.id)} className="flex-1 flex items-center justify-center gap-1 text-indigo-400 text-xs border border-indigo-500/20 px-3 py-2 rounded-lg hover:bg-indigo-500/10"><Plus className="w-3 h-3" /> Aporte</button>
                        {g.valor_atual > 0 && <button onClick={() => setGoalSaqueId(g.id)} className="flex-1 flex items-center justify-center gap-1 text-red-400 text-xs border border-red-500/10 px-3 py-2 rounded-lg hover:bg-red-500/10"><Minus className="w-3 h-3" /> Sacar</button>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-8 text-center">
            <p className="text-white/40 text-sm">Nenhuma meta cadastrada</p>
          </div>
        )}
      </div>

      {/* Goal Modal */}
      <Dialog open={goalModal} onOpenChange={() => { setGoalModal(false); setEditGoal(null); }}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editGoal ? "Editar" : "Nova"} Meta</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nome" required><Inp data-testid="goal-modal-nome" placeholder="Ex: Viagem" value={goalForm.nome} onChange={e => setGoalForm({...goalForm, nome: e.target.value})} /></Field>
            <Field label="Valor Meta (R$)" required><MoneyInp value={goalForm.valor_meta} onValueChange={v => setGoalForm({...goalForm, valor_meta: v})} /></Field>
            <Field label="Prazo"><Inp type="date" value={goalForm.prazo} onChange={e => setGoalForm({...goalForm, prazo: e.target.value})} className="[color-scheme:dark]" /></Field>
          </div>
          <DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setGoalModal(false); setEditGoal(null); }}>Cancelar</Btn><Btn data-testid="goal-modal-save" onClick={saveGoal}>{editGoal ? "Salvar" : "Criar"}</Btn></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== INVESTMENT SIMULATOR ==========
export function SimuladorSection() {
  const [capital, setCapital] = useState(10000);
  const [aporte, setAporte] = useState(500);
  const [taxa, setTaxa] = useState(12);
  const [inflacao, setInflacao] = useState(5);
  const [prazo, setPrazo] = useState(10);

  const simData = useMemo(() => {
    const data = [];
    const monthlyRate = taxa / 100 / 12;
    const monthlyInf = inflacao / 100 / 12;
    let nominal = capital;
    let real = capital;
    for (let y = 0; y <= prazo; y++) {
      data.push({ ano: `Ano ${y}`, nominal: Math.round(nominal), real: Math.round(real), aportado: capital + aporte * 12 * y });
      for (let m = 0; m < 12; m++) {
        nominal = (nominal + aporte) * (1 + monthlyRate);
        real = (real + aporte) * (1 + monthlyRate - monthlyInf);
      }
    }
    return data;
  }, [capital, aporte, taxa, inflacao, prazo]);

  const final = simData[simData.length - 1];
  const totalAportado = final?.aportado || 0;
  const totalNominal = final?.nominal || 0;
  const totalReal = final?.real || 0;
  const rendimento = totalNominal - totalAportado;

  return (
    <div>
      <div className="mb-6"><h1 className="text-white text-2xl font-bold">Simulador de Investimento</h1><p className="text-white/40 text-sm mt-1">Simule o crescimento do seu patrimonio</p></div>

      {/* Controls */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Capital Inicial (R$)">
            <Inp type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} data-testid="sim-capital" />
          </Field>
          <Field label="Aporte Mensal (R$)">
            <Inp type="number" value={aporte} onChange={e => setAporte(Number(e.target.value))} data-testid="sim-aporte" />
          </Field>
          <div>
            <div className="flex justify-between mb-1.5"><label className="text-white/60 text-xs">Taxa de Retorno Anual</label><span className="text-white font-medium text-sm">{taxa}%</span></div>
            <input type="range" min="1" max="50" step="0.5" value={taxa} onChange={e => setTaxa(Number(e.target.value))} className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5"><label className="text-white/60 text-xs">Inflacao Anual</label><span className="text-white font-medium text-sm">{inflacao}%</span></div>
            <input type="range" min="0" max="20" step="0.5" value={inflacao} onChange={e => setInflacao(Number(e.target.value))} className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
          </div>
        </div>
        <div className="mt-6">
          <label className="text-white/60 text-xs block mb-3">Prazo (anos)</label>
          <div className="flex gap-2">
            {[1, 5, 10, 25].map(y => (
              <button key={y} onClick={() => setPrazo(y)} className={`px-4 py-2 text-sm rounded-lg transition-all ${prazo === y ? "bg-white/10 text-white font-medium" : "text-white/40 border border-white/[0.08] hover:bg-white/[0.04]"}`}>{y} {y === 1 ? "ano" : "anos"}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <p className="text-white/40 text-xs mb-1">Total Aportado</p>
          <p className="text-white text-lg font-bold" data-testid="sim-total-aportado">{fmt(totalAportado)}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <p className="text-white/40 text-xs mb-1">Valor Nominal</p>
          <p className="text-emerald-400 text-lg font-bold" data-testid="sim-valor-nominal">{fmt(totalNominal)}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <p className="text-white/40 text-xs mb-1">Valor Real (- inflacao)</p>
          <p className="text-blue-400 text-lg font-bold">{fmt(totalReal)}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <p className="text-white/40 text-xs mb-1">Rendimento</p>
          <p className="text-purple-400 text-lg font-bold">{fmt(rendimento)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-6 mb-4">
          <h3 className="text-white font-semibold">Projecao</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /><span className="text-white/40 text-xs">Nominal</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /><span className="text-white/40 text-xs">Real</span></div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-white/30" /><span className="text-white/40 text-xs">Aportado</span></div>
          </div>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={simData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gNom" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.15} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} /><stop offset="95%" stopColor="#60a5fa" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="ano" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickFormatter={fmtC} />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: 13 }} formatter={(v) => [fmt(v)]} />
              <Area type="monotone" dataKey="nominal" stroke="#34d399" strokeWidth={2} fill="url(#gNom)" />
              <Area type="monotone" dataKey="real" stroke="#60a5fa" strokeWidth={2} fill="url(#gReal)" />
              <Area type="monotone" dataKey="aportado" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="5 5" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
