import React, { useState, useMemo } from "react";
import {
  mockInvestments as initInv, mockInvestmentContributions as initContribs,
  mockInvestmentChartData, mockBankAccounts, mockFinancings as initFin,
} from "../../data/mockData";
import { TrendingUp, Plus, X, DollarSign, Calendar, Pencil, Trash2, Landmark, Home } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtC = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString());
const TP = ["7d", "1m", "3m", "6m", "1y", "5y", "10y", "25y"];
const Field = ({ label, required, children }) => (<div><label className="text-white/60 text-xs block mb-1.5">{label}{required && " *"}</label>{children}</div>);
const Inp = (props) => (<input {...props} className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 placeholder:text-white/25 ${props.className || ""}`} />);
const Sel = ({ children, ...rest }) => (<select {...rest} className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 [&>option]:bg-[#1a1a1a] ${rest.className || ""}`}>{children}</select>);
const Btn = ({ children, variant = "primary", ...rest }) => (<button {...rest} className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${variant === "primary" ? "bg-white text-black hover:bg-gray-100" : "text-white/40 border border-white/[0.08] hover:bg-white/[0.04]"}`}>{children}</button>);

export default function InvestmentsSection() {
  const [investments, setInv] = useState(initInv);
  const [contribs, setContribs] = useState(initContribs);
  const [financings, setFin] = useState(initFin);
  const [chartPeriod, setCP] = useState("1y");
  const [showHistory, setSH] = useState(null);
  const [modalOpen, setMO] = useState(false);
  const [editInv, setEI] = useState(null);
  const [aporteModal, setAM] = useState(null);
  const [aporteVal, setAV] = useState("");
  const [finModal, setFM] = useState(false);
  const [editFin, setEF] = useState(null);
  const [form, setForm] = useState({ nome: "", tipo: "", valor: "", rendimento: "", bancoId: "" });
  const [finForm, setFF] = useState({ nome: "", bancoId: "", valorTotal: "", parcelas: "", valorParcela: "", taxa: "" });

  const totalInv = investments.reduce((a, b) => a + b.valor, 0);
  const chartData = mockInvestmentChartData[chartPeriod] || mockInvestmentChartData["1y"];

  React.useEffect(() => {
    if (editInv) setForm({ nome: editInv.nome, tipo: editInv.tipo, valor: editInv.valor, rendimento: editInv.rendimento, bancoId: editInv.bancoId });
    else setForm({ nome: "", tipo: "", valor: "", rendimento: "", bancoId: "" });
  }, [editInv, modalOpen]);

  React.useEffect(() => {
    if (editFin) setFF({ nome: editFin.nome, bancoId: editFin.bancoId, valorTotal: editFin.valorTotal, parcelas: editFin.parcelas, valorParcela: editFin.valorParcela, taxa: editFin.taxa });
    else setFF({ nome: "", bancoId: "", valorTotal: "", parcelas: "", valorParcela: "", taxa: "" });
  }, [editFin, finModal]);

  const saveInv = () => {
    if (!form.nome || !form.tipo) return;
    const banco = mockBankAccounts.find(b => b.id === Number(form.bancoId));
    if (editInv) setInv(p => p.map(i => i.id === editInv.id ? { ...i, ...form, valor: Number(form.valor), rendimento: Number(form.rendimento), bancoId: Number(form.bancoId), bancoNome: banco?.nome || "", variacao: i.variacao } : i));
    else setInv(p => [...p, { id: Date.now(), ...form, valor: Number(form.valor), rendimento: Number(form.rendimento), bancoId: Number(form.bancoId), bancoNome: banco?.nome || "", variacao: 0 }]);
    setMO(false); setEI(null);
  };

  const saveFin = () => {
    if (!finForm.nome || !finForm.bancoId) return;
    const banco = mockBankAccounts.find(b => b.id === Number(finForm.bancoId));
    if (editFin) setFin(p => p.map(f => f.id === editFin.id ? { ...f, ...finForm, bancoId: Number(finForm.bancoId), bancoNome: banco?.nome || "", valorTotal: Number(finForm.valorTotal), parcelas: Number(finForm.parcelas), valorParcela: Number(finForm.valorParcela), taxa: Number(finForm.taxa) } : f));
    else setFin(p => [...p, { id: Date.now(), ...finForm, bancoId: Number(finForm.bancoId), bancoNome: banco?.nome || "", valorTotal: Number(finForm.valorTotal), valorPago: 0, parcelas: Number(finForm.parcelas), parcelaAtual: 0, valorParcela: Number(finForm.valorParcela), taxa: Number(finForm.taxa), status: "ativo" }]);
    setFM(false); setEF(null);
  };

  const handleAporte = (invId) => {
    const val = Number(aporteVal);
    if (!val || val <= 0) return;
    setInv(p => p.map(i => i.id === invId ? { ...i, valor: i.valor + val } : i));
    setContribs(p => [{ id: Date.now(), investimentoId: invId, valor: val, data: new Date().toISOString().split("T")[0], tipo: "aporte" }, ...p]);
    setAV(""); setAM(null);
  };

  // Group investments by bank
  const invByBank = useMemo(() => {
    const map = {};
    investments.forEach(i => { if (!map[i.bancoId]) map[i.bancoId] = { banco: mockBankAccounts.find(b => b.id === i.bancoId), items: [] }; map[i.bancoId].items.push(i); });
    financings.forEach(f => { if (!map[f.bancoId]) map[f.bancoId] = { banco: mockBankAccounts.find(b => b.id === f.bancoId), items: [] }; map[f.bancoId].financing = f; });
    return map;
  }, [investments, financings]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-white text-2xl font-bold">Investimentos</h1><p className="text-white/40 text-sm mt-1">Acompanhe sua carteira</p></div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={() => { setEF(null); setFM(true); }}><Home className="w-4 h-4 inline mr-1" />Financiamento</Btn>
          <Btn onClick={() => { setEI(null); setMO(true); }}><Plus className="w-4 h-4 inline mr-1" />Novo Investimento</Btn>
        </div>
      </div>

      {/* Total */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
        <span className="text-white/50 text-sm">Total Investido</span>
        <p className="text-white text-3xl font-bold mt-1">{fmt(totalInv)}</p>
        <div className="flex items-center gap-1 text-emerald-400 text-sm mt-2"><TrendingUp className="w-4 h-4" /><span>+15.7% rendimento total</span></div>
      </div>

      {/* Chart */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
        <h3 className="text-white font-semibold mb-4">Evolução da Carteira</h3>
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
        <div key={banco?.id || "unknown"} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: (banco?.cor || "#666") + "20" }}>
              <Landmark className="w-3.5 h-3.5" style={{ color: banco?.cor }} />
            </div>
            <span className="text-white/60 text-sm font-medium">{banco?.nome || "Sem banco"}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(inv => {
              const invC = contribs.filter(c => c.investimentoId === inv.id);
              return (
                <div key={inv.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div><p className="text-white font-medium">{inv.nome}</p><p className="text-white/30 text-xs">{inv.tipo}</p></div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${inv.variacao >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{inv.variacao >= 0 ? "+" : ""}{inv.variacao}%</span>
                      <button onClick={() => { setEI(inv); setMO(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setInv(p => p.filter(x => x.id !== inv.id))} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-white text-xl font-bold">{fmt(inv.valor)}</p>
                  <p className="text-emerald-400/70 text-xs mt-1">Rendimento: {inv.rendimento}% a.a.</p>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                    {aporteModal === inv.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Inp type="number" value={aporteVal} onChange={e => setAV(e.target.value)} placeholder="Valor" className="!py-2 text-xs" autoFocus />
                        <button onClick={() => handleAporte(inv.id)} className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-2 rounded-lg hover:bg-emerald-500/30">OK</button>
                        <button onClick={() => { setAM(null); setAV(""); }} className="text-white/30 p-2"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setAM(inv.id)} className="flex items-center gap-1.5 text-white/50 text-xs border border-white/[0.08] px-3 py-2 rounded-lg hover:bg-white/[0.04]"><Plus className="w-3.5 h-3.5" /> Aporte</button>
                        <button onClick={() => setSH(showHistory === inv.id ? null : inv.id)} className="flex items-center gap-1.5 text-white/50 text-xs border border-white/[0.08] px-3 py-2 rounded-lg hover:bg-white/[0.04]"><Calendar className="w-3.5 h-3.5" /> Histórico</button>
                      </>
                    )}
                  </div>
                  {showHistory === inv.id && invC.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                      <p className="text-white/40 text-xs font-medium mb-2">Histórico de Aportes</p>
                      {invC.map(c => (<div key={c.id} className="flex justify-between py-1.5"><div className="flex items-center gap-2"><DollarSign className="w-3 h-3 text-emerald-400/60" /><span className="text-white/50 text-xs">{new Date(c.data).toLocaleDateString("pt-BR")}</span></div><span className="text-emerald-400 text-xs font-medium">+{fmt(c.valor)}</span></div>))}
                    </div>
                  )}
                </div>
              );
            })}
            {financing && (
              <div className="bg-[#111111] border border-amber-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><Home className="w-4 h-4 text-amber-400" /><div><p className="text-white font-medium">{financing.nome}</p><p className="text-white/30 text-xs">Financiamento</p></div></div>
                  <div className="flex gap-2"><button onClick={() => { setEF(financing); setFM(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => setFin(p => p.filter(f => f.id !== financing.id))} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>
                </div>
                <p className="text-white text-xl font-bold">{fmt(financing.valorTotal)}</p>
                <div className="w-full bg-white/[0.06] rounded-full h-2 my-3"><div className="bg-amber-400 h-2 rounded-full" style={{ width: `${(financing.parcelaAtual / financing.parcelas) * 100}%` }} /></div>
                <div className="flex justify-between text-white/30 text-xs"><span>Parcela {financing.parcelaAtual}/{financing.parcelas}</span><span>{fmt(financing.valorParcela)}/mês</span></div>
                <p className="text-amber-400/60 text-xs mt-2">Taxa: {financing.taxa}% a.a.</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Investment Modal */}
      <Dialog open={modalOpen} onOpenChange={() => { setMO(false); setEI(null); }}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editInv ? "Editar" : "Novo"} Investimento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nome" required><Inp placeholder="Ex: Tesouro Selic" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></Field>
            <Field label="Tipo" required><Sel value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}><option value="">Selecione</option>{["Renda Fixa","Ações","FIIs","Crypto","ETF","CDB","LCI/LCA"].map(t => <option key={t} value={t}>{t}</option>)}</Sel></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Valor (R$)"><Inp type="number" placeholder="1000" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} /></Field>
              <Field label="Rendimento (% a.a.)"><Inp type="number" step="0.01" placeholder="12.5" value={form.rendimento} onChange={e => setForm({...form, rendimento: e.target.value})} /></Field>
            </div>
            <Field label="Conta Bancária"><Sel value={form.bancoId} onChange={e => setForm({...form, bancoId: e.target.value})}><option value="">Selecione (opcional)</option>{mockBankAccounts.map(b => <option key={b.id} value={b.id}>{b.nome} - {b.tipo}</option>)}</Sel></Field>
          </div>
          <DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setMO(false); setEI(null); }}>Cancelar</Btn><Btn onClick={saveInv}>{editInv ? "Salvar" : "Criar"}</Btn></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Financing Modal */}
      <Dialog open={finModal} onOpenChange={() => { setFM(false); setEF(null); }}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editFin ? "Editar" : "Novo"} Financiamento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nome" required><Inp placeholder="Ex: Financiamento Apartamento" value={finForm.nome} onChange={e => setFF({...finForm, nome: e.target.value})} /></Field>
            <Field label="Banco" required><Sel value={finForm.bancoId} onChange={e => setFF({...finForm, bancoId: e.target.value})}><option value="">Selecione</option>{mockBankAccounts.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}</Sel></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Valor Total"><Inp type="number" placeholder="320000" value={finForm.valorTotal} onChange={e => setFF({...finForm, valorTotal: e.target.value})} /></Field>
              <Field label="Parcelas"><Inp type="number" placeholder="360" value={finForm.parcelas} onChange={e => setFF({...finForm, parcelas: e.target.value})} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Valor Parcela"><Inp type="number" placeholder="1850" value={finForm.valorParcela} onChange={e => setFF({...finForm, valorParcela: e.target.value})} /></Field>
              <Field label="Taxa (% a.a.)"><Inp type="number" step="0.1" placeholder="8.5" value={finForm.taxa} onChange={e => setFF({...finForm, taxa: e.target.value})} /></Field>
            </div>
          </div>
          <DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setFM(false); setEF(null); }}>Cancelar</Btn><Btn onClick={saveFin}>{editFin ? "Salvar" : "Criar"}</Btn></DialogFooter>
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
      <div className="mb-6"><h1 className="text-white text-2xl font-bold">Simulador de Investimento</h1><p className="text-white/40 text-sm mt-1">Simule o crescimento do seu patrimônio</p></div>

      {/* Controls */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Capital Inicial (R$)">
            <Inp type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} />
          </Field>
          <Field label="Aporte Mensal (R$)">
            <Inp type="number" value={aporte} onChange={e => setAporte(Number(e.target.value))} />
          </Field>
          <div>
            <div className="flex justify-between mb-1.5"><label className="text-white/60 text-xs">Taxa de Retorno Anual</label><span className="text-white font-medium text-sm">{taxa}%</span></div>
            <input type="range" min="1" max="50" step="0.5" value={taxa} onChange={e => setTaxa(Number(e.target.value))} className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5"><label className="text-white/60 text-xs">Inflação Anual</label><span className="text-white font-medium text-sm">{inflacao}%</span></div>
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
          <p className="text-white text-lg font-bold">{fmt(totalAportado)}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <p className="text-white/40 text-xs mb-1">Valor Nominal</p>
          <p className="text-emerald-400 text-lg font-bold">{fmt(totalNominal)}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <p className="text-white/40 text-xs mb-1">Valor Real (- inflação)</p>
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
          <h3 className="text-white font-semibold">Projeção</h3>
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
