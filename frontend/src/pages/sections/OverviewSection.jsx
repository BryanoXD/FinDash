import React, { useState } from "react";
import {
  mockUser, mockSummary, mockChartDataByPeriod, mockExpenseCategories,
  mockTransactions, mockDueItems, mockFinancialGoals,
} from "../../data/mockData";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft,
  Eye, EyeOff, Plus, DollarSign, Briefcase, Home, ShoppingCart,
  Tv, Car, Heart, GraduationCap, AlertTriangle, CalendarClock, Clock,
  Target, Shield, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
} from "recharts";

const iconMap = { Briefcase, Home, ShoppingCart, Tv, Car, Heart, GraduationCap, TrendingUp, ArrowDownLeft, Palette: Briefcase };
const goalIconMap = { Shield, Target };

const formatCurrency = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const formatCompact = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString());

const TIME_PERIODS = ["7d", "1m", "3m", "6m", "1y", "5y", "10y", "25y"];

function SummaryCard({ title, value, variacao, icon: Icon, iconColor }) {
  const isPositive = variacao >= 0;
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/50 text-sm font-medium">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-white text-2xl font-bold mb-1.5">{formatCurrency(value)}</div>
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        <span>{isPositive ? "+" : ""}{variacao}% este mês</span>
      </div>
    </div>
  );
}

function DueCard({ title, subtitle, icon: Icon, iconBg, receitas, despesas }) {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{title}</p>
          <p className="text-white/30 text-xs">{subtitle}</p>
        </div>
      </div>
      <div className="flex gap-8">
        <div>
          <p className="text-white/40 text-xs mb-1">Receitas</p>
          <p className="text-emerald-400 font-semibold text-sm">{formatCurrency(receitas)}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs mb-1">Despesas</p>
          <p className="text-red-400 font-semibold text-sm">{formatCurrency(despesas)}</p>
        </div>
      </div>
    </div>
  );
}

export default function OverviewSection() {
  const [showBalance, setShowBalance] = useState(true);
  const [chartPeriod, setChartPeriod] = useState("6m");
  const chartData = mockChartDataByPeriod[chartPeriod] || mockChartDataByPeriod["6m"];
  const [aporteGoalId, setAporteGoalId] = useState(null);
  const [aporteValue, setAporteValue] = useState("");
  const [goals, setGoals] = useState(mockFinancialGoals);

  const handleAporte = (goalId) => {
    if (!aporteValue || isNaN(Number(aporteValue))) return;
    setGoals((prev) => prev.map((g) =>
      g.id === goalId ? { ...g, valorAtual: g.valorAtual + Number(aporteValue) } : g
    ));
    setAporteValue("");
    setAporteGoalId(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Olá, {mockUser.name.split(" ")[0]}!</h1>
          <p className="text-white/40 text-sm mt-1">Aqui está o resumo das suas finanças</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBalance(!showBalance)} className="text-white/40 hover:text-white/80 transition-colors p-2 rounded-lg hover:bg-white/[0.04]">
            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button className="flex items-center gap-2 bg-white text-black text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Plus className="w-4 h-4" /> Nova Transação
          </button>
        </div>
      </div>

      {/* Due Items Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DueCard title="Vencidos" subtitle="Últimos 7 dias" icon={AlertTriangle} iconBg="bg-red-500/15 text-red-400" receitas={mockDueItems.vencidos.receitas} despesas={mockDueItems.vencidos.despesas} />
        <DueCard title="Vencendo" subtitle="Hoje" icon={CalendarClock} iconBg="bg-blue-500/15 text-blue-400" receitas={mockDueItems.vencendo.receitas} despesas={mockDueItems.vencendo.despesas} />
        <DueCard title="Futuro" subtitle="Próximos 7 dias" icon={Clock} iconBg="bg-amber-500/15 text-amber-400" receitas={mockDueItems.futuro.receitas} despesas={mockDueItems.futuro.despesas} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard title="Saldo Total" value={showBalance ? mockSummary.saldoTotal : 0} variacao={mockSummary.saldoVariacao} icon={Wallet} iconColor="bg-emerald-500/15 text-emerald-400" />
        <SummaryCard title="Receitas" value={showBalance ? mockSummary.receitas : 0} variacao={mockSummary.receitasVariacao} icon={ArrowDownLeft} iconColor="bg-blue-500/15 text-blue-400" />
        <SummaryCard title="Despesas" value={showBalance ? mockSummary.despesas : 0} variacao={mockSummary.despesasVariacao} icon={ArrowUpRight} iconColor="bg-red-500/15 text-red-400" />
        <SummaryCard title="Investimentos" value={showBalance ? mockSummary.investimentos : 0} variacao={mockSummary.investimentosVariacao} icon={TrendingUp} iconColor="bg-purple-500/15 text-purple-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Receitas vs Despesas</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /><span className="text-white/40 text-xs">Receitas</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-white/40 text-xs">Despesas</span></div>
            </div>
          </div>
          {/* Time Period Selector */}
          <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1 w-fit mb-4">
            {TIME_PERIODS.map((p) => (
              <button key={p} onClick={() => setChartPeriod(p)} className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${chartPeriod === p ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white/70"}`}>
                {p}
              </button>
            ))}
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.2} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.2} /><stop offset="95%" stopColor="#f87171" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickFormatter={formatCompact} />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: 13 }} formatter={(v) => [formatCurrency(v)]} />
                <Area type="monotone" dataKey="receitas" stroke="#34d399" strokeWidth={2} fill="url(#colorReceitas)" />
                <Area type="monotone" dataKey="despesas" stroke="#f87171" strokeWidth={2} fill="url(#colorDespesas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Pie Chart */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Despesas por Categoria</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie><Pie data={mockExpenseCategories} dataKey="valor" nameKey="nome" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                {mockExpenseCategories.map((entry, i) => (<Cell key={`cell-${i}`} fill={entry.cor} />))}
              </Pie><Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: 13 }} formatter={(v) => [formatCurrency(v)]} /></RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {mockExpenseCategories.slice(0, 4).map((cat) => (
              <div key={cat.nome} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.cor }} /><span className="text-white/50 text-xs">{cat.nome}</span></div>
                <span className="text-white/70 text-xs font-medium">{formatCurrency(cat.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metas Financeiras */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-white/50" />
            <h3 className="text-white font-semibold">Metas Financeiras</h3>
          </div>
          <ArrowRight className="w-4 h-4 text-white/30 cursor-pointer hover:text-white/60 transition-colors" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const pct = Math.min((goal.valorAtual / goal.valorMeta) * 100, 100);
            return (
              <div key={goal.id} className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-medium text-sm">{goal.nome}</span>
                  {aporteGoalId === goal.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" value={aporteValue} onChange={(e) => setAporteValue(e.target.value)} placeholder="R$" className="w-24 bg-white/[0.06] border border-white/[0.1] rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:border-white/20" autoFocus />
                      <button onClick={() => handleAporte(goal.id)} className="text-emerald-400 text-xs font-medium hover:text-emerald-300">OK</button>
                      <button onClick={() => { setAporteGoalId(null); setAporteValue(""); }} className="text-white/30 text-xs hover:text-white/60">&times;</button>
                    </div>
                  ) : (
                    <button onClick={() => setAporteGoalId(goal.id)} className="flex items-center gap-1 text-white/50 text-xs hover:text-white/80 border border-white/[0.08] px-2.5 py-1 rounded-md hover:bg-white/[0.04] transition-colors">
                      <Plus className="w-3 h-3" /> Aporte
                    </button>
                  )}
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2 mb-3">
                  <div className="bg-white/60 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs">{formatCurrency(goal.valorAtual)}</span>
                  <span className="text-white/40 text-xs">{formatCurrency(goal.valorMeta)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl">
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="text-white font-semibold">Transações Recentes</h3>
          <button className="text-white/40 text-sm hover:text-white/70 transition-colors">Ver todas</button>
        </div>
        <div className="p-5">
          <div className="space-y-1">
            {mockTransactions.slice(0, 6).map((tx) => {
              const Icon = iconMap[tx.icone] || DollarSign;
              const isReceita = tx.tipo === "receita";
              return (
                <div key={tx.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isReceita ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                      <Icon className={`w-4 h-4 ${isReceita ? "text-emerald-400" : "text-red-400"}`} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{tx.descricao}</p>
                      <p className="text-white/30 text-xs">{tx.categoria} • {new Date(tx.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${isReceita ? "text-emerald-400" : "text-red-400"}`}>
                    {isReceita ? "+" : "-"}{formatCurrency(tx.valor)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
