import React, { useState } from "react";
import {
  mockUser, mockTransactions, mockBudgets, mockExpenseCategories,
  mockFinancialGoals,
} from "../../data/mockData";
import {
  Filter, Download, DollarSign, Briefcase, Home, ShoppingCart, Tv, Car,
  Heart, GraduationCap, TrendingUp, ArrowDownLeft, Calendar, PieChart,
  BarChart3, Plus, Pencil, Trash2, Target, Shield, Clock,
} from "lucide-react";

const iconMap = { Briefcase, Home, ShoppingCart, Tv, Car, Heart, GraduationCap, TrendingUp, ArrowDownLeft, Palette: Briefcase };
const goalIconMap = { Shield, Target };
const formatCurrency = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// Transactions (Receitas)
export function ReceitasSection() {
  const receitas = mockTransactions.filter((t) => t.tipo === "receita");
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-white text-2xl font-bold">Receitas</h1><p className="text-white/40 text-sm mt-1">Histórico de receitas</p></div>
        <button className="flex items-center gap-2 bg-white text-black text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"><Plus className="w-4 h-4" /> Nova Receita</button>
      </div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl"><div className="divide-y divide-white/[0.04]">
        {receitas.map((tx) => { const Icon = iconMap[tx.icone] || DollarSign; return (
          <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10"><Icon className="w-4 h-4 text-emerald-400" /></div><div><p className="text-white text-sm font-medium">{tx.descricao}</p><p className="text-white/30 text-xs">{tx.categoria}</p></div></div>
            <div className="text-right"><p className="text-sm font-semibold text-emerald-400">+{formatCurrency(tx.valor)}</p><p className="text-white/30 text-xs">{new Date(tx.data).toLocaleDateString("pt-BR")}</p></div>
          </div>
        ); })}
      </div></div>
    </div>
  );
}

// Despesas
export function DespesasSection() {
  const despesas = mockTransactions.filter((t) => t.tipo === "despesa");
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-white text-2xl font-bold">Despesas</h1><p className="text-white/40 text-sm mt-1">Histórico de despesas</p></div>
        <button className="flex items-center gap-2 bg-white text-black text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"><Plus className="w-4 h-4" /> Nova Despesa</button>
      </div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl"><div className="divide-y divide-white/[0.04]">
        {despesas.map((tx) => { const Icon = iconMap[tx.icone] || DollarSign; return (
          <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/10"><Icon className="w-4 h-4 text-red-400" /></div><div><p className="text-white text-sm font-medium">{tx.descricao}</p><p className="text-white/30 text-xs">{tx.categoria}</p></div></div>
            <div className="text-right"><p className="text-sm font-semibold text-red-400">-{formatCurrency(tx.valor)}</p><p className="text-white/30 text-xs">{new Date(tx.data).toLocaleDateString("pt-BR")}</p></div>
          </div>
        ); })}
      </div></div>
    </div>
  );
}

// Categorias
export function CategoriasSection() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-white text-2xl font-bold">Categorias</h1><p className="text-white/40 text-sm mt-1">Gerencie suas categorias de gastos</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockExpenseCategories.map((cat) => (
          <div key={cat.nome} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300">
            <div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.cor + "20" }}><div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} /></div><span className="text-white font-medium">{cat.nome}</span></div>
            <p className="text-white text-xl font-bold">{formatCurrency(cat.valor)}</p>
            <p className="text-white/30 text-xs mt-1">este mês</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Budget (Orçamento)
export function BudgetSection() {
  const totalLimite = mockBudgets.reduce((a, b) => a + b.limite, 0);
  const totalGasto = mockBudgets.reduce((a, b) => a + b.gasto, 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-white text-2xl font-bold">Orçamento</h1><p className="text-white/40 text-sm mt-1">Controle seus limites de gastos</p></div></div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3"><span className="text-white/50 text-sm">Orçamento Total</span><span className="text-white text-sm font-medium">{formatCurrency(totalGasto)} de {formatCurrency(totalLimite)}</span></div>
        <div className="w-full bg-white/[0.06] rounded-full h-2.5"><div className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(totalGasto / totalLimite) * 100}%` }} /></div>
        <p className="text-white/30 text-xs mt-2">{((totalGasto / totalLimite) * 100).toFixed(1)}% utilizado</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockBudgets.map((budget) => { const pct = (budget.gasto / budget.limite) * 100; const isOver = pct > 90; return (
          <div key={budget.categoria} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300">
            <div className="flex items-center justify-between mb-3"><span className="text-white font-medium text-sm">{budget.categoria}</span><span className={`text-xs font-medium px-2 py-1 rounded-md ${isOver ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>{pct.toFixed(0)}%</span></div>
            <div className="w-full bg-white/[0.06] rounded-full h-2 mb-2"><div className={`h-2 rounded-full transition-all duration-500 ${isOver ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
            <div className="flex items-center justify-between"><span className="text-white/30 text-xs">{formatCurrency(budget.gasto)}</span><span className="text-white/30 text-xs">{formatCurrency(budget.limite)}</span></div>
          </div>
        ); })}
      </div>
    </div>
  );
}

// Reports with Period Selector
export function ReportsSection() {
  const [startDate, setStartDate] = useState("2025-07-01");
  const [endDate, setEndDate] = useState("2025-07-31");
  const reportTypes = [
    { title: "Relatório Mensal", desc: "Resumo completo do período", icon: Calendar },
    { title: "Fluxo de Caixa", desc: "Entradas e saídas", icon: BarChart3 },
    { title: "Análise de Gastos", desc: "Por categoria", icon: PieChart },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-white text-2xl font-bold">Relatórios</h1><p className="text-white/40 text-sm mt-1">Análises detalhadas das suas finanças</p></div></div>
      {/* Period Selector */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
        <h3 className="text-white font-medium mb-4">Período do Relatório</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div><label className="text-white/40 text-xs block mb-1.5">Data Início</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20 [color-scheme:dark]" /></div>
          <div><label className="text-white/40 text-xs block mb-1.5">Data Fim</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20 [color-scheme:dark]" /></div>
          <div className="flex gap-2 mt-5">
            {["Últimos 7 dias", "Este mês", "Último trimestre", "Este ano"].map((q) => (
              <button key={q} className="text-white/40 text-xs px-3 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] hover:text-white/70 transition-colors">{q}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <div key={report.title} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300 cursor-pointer group">
            <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors"><report.icon className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" /></div>
            <h3 className="text-white font-medium mb-1">{report.title}</h3>
            <p className="text-white/30 text-sm">{report.desc}</p>
            <p className="text-white/20 text-xs mt-2">{startDate} até {endDate}</p>
            <button className="mt-4 text-white/50 text-sm flex items-center gap-1 group-hover:text-white/80 transition-colors"><Download className="w-4 h-4" /> Baixar PDF</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Metas (Financial Goals)
export function MetasSection() {
  const [goals, setGoals] = useState(mockFinancialGoals);
  const [aporteId, setAporteId] = useState(null);
  const [aporteValue, setAporteValue] = useState("");
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ nome: "", valorMeta: "", prazo: "" });

  const handleAporte = (id) => {
    const val = Number(aporteValue);
    if (!val || val <= 0) return;
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, valorAtual: g.valorAtual + val } : g));
    setAporteValue(""); setAporteId(null);
  };

  const handleAddGoal = () => {
    if (!newGoal.nome || !newGoal.valorMeta) return;
    setGoals((prev) => [...prev, { id: Date.now(), nome: newGoal.nome, valorAtual: 0, valorMeta: Number(newGoal.valorMeta), prazo: newGoal.prazo || "2026-12-31", icone: "Target" }]);
    setNewGoal({ nome: "", valorMeta: "", prazo: "" }); setShowNewGoal(false);
  };

  const handleDeleteGoal = (id) => setGoals((prev) => prev.filter((g) => g.id !== id));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-white text-2xl font-bold">Metas Financeiras</h1><p className="text-white/40 text-sm mt-1">Defina e acompanhe suas metas de economia</p></div>
        <button onClick={() => setShowNewGoal(true)} className="flex items-center gap-2 bg-white text-black text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"><Plus className="w-4 h-4" /> Nova Meta</button>
      </div>

      {/* New Goal Form */}
      {showNewGoal && (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
          <h3 className="text-white font-medium mb-4">Nova Meta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div><label className="text-white/40 text-xs block mb-1.5">Nome</label><input value={newGoal.nome} onChange={(e) => setNewGoal({ ...newGoal, nome: e.target.value })} placeholder="Ex: Viagem" className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20" /></div>
            <div><label className="text-white/40 text-xs block mb-1.5">Valor Meta (R$)</label><input type="number" value={newGoal.valorMeta} onChange={(e) => setNewGoal({ ...newGoal, valorMeta: e.target.value })} placeholder="10000" className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20" /></div>
            <div><label className="text-white/40 text-xs block mb-1.5">Prazo</label><input type="date" value={newGoal.prazo} onChange={(e) => setNewGoal({ ...newGoal, prazo: e.target.value })} className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20 [color-scheme:dark]" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddGoal} className="bg-white text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">Criar Meta</button>
            <button onClick={() => setShowNewGoal(false)} className="text-white/40 text-sm px-4 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const pct = Math.min((goal.valorAtual / goal.valorMeta) * 100, 100);
          const GoalIcon = goalIconMap[goal.icone] || Target;
          return (
            <div key={goal.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><GoalIcon className="w-4 h-4 text-white/50" /><span className="text-white font-medium">{goal.nome}</span></div>
                <div className="flex items-center gap-2">
                  <button className="text-white/30 hover:text-white/60 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteGoal(goal.id)} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2"><span className="text-white/40 text-xs">Progresso</span><span className="text-white/60 text-xs font-medium">{pct.toFixed(1)}%</span></div>
              <div className="w-full bg-white/[0.06] rounded-full h-2 mb-3"><div className="bg-white/60 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} /></div>
              <div className="flex items-center justify-between mb-4"><span className="text-white/40 text-xs">{formatCurrency(goal.valorAtual)}</span><span className="text-white/40 text-xs">{formatCurrency(goal.valorMeta)}</span></div>
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-white/30 text-xs"><Calendar className="w-3.5 h-3.5" /><span>Prazo: {new Date(goal.prazo).toLocaleDateString("pt-BR")}</span></div>
                {aporteId === goal.id ? (
                  <div className="flex items-center gap-2">
                    <input type="number" value={aporteValue} onChange={(e) => setAporteValue(e.target.value)} placeholder="R$" className="w-24 bg-white/[0.06] border border-white/[0.1] rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:border-white/20" autoFocus />
                    <button onClick={() => handleAporte(goal.id)} className="text-emerald-400 text-xs font-medium">OK</button>
                    <button onClick={() => { setAporteId(null); setAporteValue(""); }} className="text-white/30 text-xs">&times;</button>
                  </div>
                ) : (
                  <button onClick={() => setAporteId(goal.id)} className="flex items-center gap-1 text-white/50 text-xs hover:text-white/80 border border-white/[0.08] px-2.5 py-1 rounded-md hover:bg-white/[0.04] transition-colors"><Plus className="w-3 h-3" /> Aporte</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Heatmap placeholder
export function HeatmapSection() {
  const days = Array.from({ length: 365 }, (_, i) => ({ day: i, intensity: Math.random() }));
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return (
    <div>
      <div className="mb-6"><h1 className="text-white text-2xl font-bold">Heatmap de Gastos</h1><p className="text-white/40 text-sm mt-1">Visualize seus gastos ao longo do ano</p></div>
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
        <div className="flex gap-1 mb-2">{months.map((m) => (<span key={m} className="text-white/30 text-[10px] flex-1 text-center">{m}</span>))}</div>
        <div className="flex flex-wrap gap-[3px]">
          {days.map((d) => (
            <div key={d.day} className="w-3 h-3 rounded-sm transition-colors" style={{ backgroundColor: d.intensity > 0.7 ? "#ef4444" : d.intensity > 0.4 ? "#f97316" : d.intensity > 0.15 ? "#22c55e" : "rgba(255,255,255,0.04)" }} title={`Dia ${d.day + 1}: Intensidade ${(d.intensity * 100).toFixed(0)}%`} />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-4">
          <span className="text-white/30 text-xs">Menos</span>
          {["rgba(255,255,255,0.04)", "#22c55e", "#f97316", "#ef4444"].map((c, i) => (<div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />))}
          <span className="text-white/30 text-xs">Mais</span>
        </div>
      </div>
    </div>
  );
}

// Import placeholder
export function ImportSection() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-white text-2xl font-bold">Importar Extratos</h1><p className="text-white/40 text-sm mt-1">Importe extratos bancários para categorizar automaticamente</p></div>
      <div className="bg-[#111111] border border-dashed border-white/[0.1] rounded-xl p-12 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-white/[0.04] rounded-xl flex items-center justify-center mb-4"><Download className="w-8 h-8 text-white/30" /></div>
        <p className="text-white/60 text-sm font-medium mb-1">Arraste seu extrato aqui</p>
        <p className="text-white/30 text-xs mb-4">Formatos aceitos: CSV, OFX, PDF</p>
        <button className="bg-white text-black text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-100 transition-colors">Selecionar Arquivo</button>
      </div>
    </div>
  );
}

// Settings
export function SettingsSection() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-white text-2xl font-bold">Configurações</h1><p className="text-white/40 text-sm mt-1">Gerencie suas preferências</p></div>
      <div className="space-y-4">
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">Perfil</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center"><span className="text-white font-semibold text-lg">{mockUser.avatar}</span></div>
            <div><p className="text-white font-medium">{mockUser.name}</p><p className="text-white/40 text-sm">{mockUser.email}</p></div>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">Preferências</h3>
          <div className="space-y-4">
            {[{ label: "Notificações por email", on: true }, { label: "Alertas de orçamento", on: true }, { label: "Relatórios semanais", on: false }].map((p) => (
              <div key={p.label} className="flex items-center justify-between">
                <span className="text-white/60 text-sm">{p.label}</span>
                <button className={`w-10 h-6 rounded-full transition-colors relative ${p.on ? "bg-emerald-500" : "bg-white/10"}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${p.on ? "translate-x-5" : "translate-x-1"}`} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
