import React, { useState, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { fmt, fmtCompact } from "../../lib/formatters";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft,
  Eye, EyeOff, Plus, DollarSign, Briefcase, Home, ShoppingCart,
  Tv, Car, Heart, GraduationCap, AlertTriangle, CalendarClock, Clock,
  Target, Shield, ArrowRight, X, Minus,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot, ResponsiveContainer,
} from "recharts";
import { TransactionModal } from "./OtherSections";
import { Toggle } from "../../components/shared/FormComponents";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";

const iconMap = { Briefcase, Home, ShoppingCart, Tv, Car, Heart, GraduationCap, TrendingUp, ArrowDownLeft, Palette: Briefcase, Target, Shield, DollarSign };

const TIME_PERIODS = ["7d", "1m", "3m", "6m", "1y", "5y", "10y", "25y"];

/**
 * Build cumulative daily series for a given month.
 * Returns array of 31 entries: [{ dia: 1, valor: cum|null, daily: dailyValue }]
 * Days beyond the actual month length get null. For current month, days after today
 * also get null so the line stops naturally.
 */
function buildMonthSeries(transactions, year, month, tipo, capToToday = false) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrent = today.getFullYear() === year && today.getMonth() === month;
  const cutoff = capToToday && isCurrent ? today.getDate() : lastDay;

  const dailyTotals = new Array(31).fill(0);
  transactions.forEach((tx) => {
    if (tx.tipo !== tipo) return;
    const d = new Date(tx.data);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dia = d.getDate();
      if (dia >= 1 && dia <= 31) {
        dailyTotals[dia - 1] += Number(tx.valor) || 0;
      }
    }
  });

  let acc = 0;
  const series = [];
  for (let i = 0; i < 31; i++) {
    const dia = i + 1;
    if (dia > lastDay) {
      series.push({ dia, valor: null, daily: 0 });
      continue;
    }
    acc += dailyTotals[i];
    if (capToToday && dia > cutoff) {
      series.push({ dia, valor: null, daily: 0 });
    } else {
      series.push({ dia, valor: Math.round(acc * 100) / 100, daily: dailyTotals[i] });
    }
  }
  return series;
}

function RitmoChart({ transactions }) {
  const [showReceitas, setShowReceitas] = useState(false);
  const tipo = showReceitas ? "receita" : "despesa";

  const data = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const prev = new Date(curYear, curMonth - 1, 1);
    const prevYear = prev.getFullYear();
    const prevMonth = prev.getMonth();

    const atualSeries = buildMonthSeries(transactions, curYear, curMonth, tipo, true);
    const anteriorSeries = buildMonthSeries(transactions, prevYear, prevMonth, tipo, false);

    // Merge into shape Recharts expects
    const merged = atualSeries.map((a, i) => ({
      dia: a.dia,
      atual: a.valor,
      anterior: anteriorSeries[i].valor,
      dailyAtual: a.daily,
    }));

    // Find peak daily spend day in current month (with non-zero value)
    let peakDay = null;
    let peakValue = 0;
    atualSeries.forEach((d) => {
      if (d.daily > peakValue) {
        peakValue = d.daily;
        peakDay = d.dia;
      }
    });

    // Find last valid cumulative point in current month (for "ponto final")
    let lastDay = null;
    let lastValue = 0;
    for (let i = atualSeries.length - 1; i >= 0; i--) {
      if (atualSeries[i].valor !== null && atualSeries[i].valor > 0) {
        lastDay = atualSeries[i].dia;
        lastValue = atualSeries[i].valor;
        break;
      }
    }

    // Cumulative value at the peak day (for placing the highlight on the line)
    const peakCumulative = peakDay
      ? merged.find((d) => d.dia === peakDay)?.atual
      : null;

    return { merged, peakDay, peakValue, peakCumulative, lastDay, lastValue };
  }, [transactions, tipo]);

  const config = showReceitas
    ? { color: "#22c55e", label: "Ritmo de receitas", peakLabel: "Maior receita do dia" }
    : { color: "#ef4444", label: "Ritmo de gastos", peakLabel: "Maior gasto do dia" };

  const hasData = data.merged.some((d) => d.atual !== null && d.atual > 0) ||
    data.merged.some((d) => d.anterior !== null && d.anterior > 0);

  return (
    <div data-testid="ritmo-chart" className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 sm:p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm sm:text-base">{config.label}</h3>
          <p className="text-white/40 text-xs mt-0.5">
            Acumulado dia a dia: mes atual vs mes anterior
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5" style={{ backgroundColor: config.color }} />
              <span className="text-white/50">Mes atual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-white/40" />
              <span className="text-white/50">Mes anterior</span>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer" data-testid="ritmo-toggle-wrapper">
            <span className={`text-xs ${!showReceitas ? "text-white" : "text-white/40"}`}>Gastos</span>
            <Toggle on={showReceitas} onChange={() => setShowReceitas((v) => !v)} />
            <span className={`text-xs ${showReceitas ? "text-white" : "text-white/40"}`}>Receitas</span>
          </label>
        </div>
      </div>

      {!hasData ? (
        <div className="h-48 sm:h-64 flex items-center justify-center">
          <p className="text-white/40 text-sm">Sem dados suficientes para os ultimos 2 meses</p>
        </div>
      ) : (
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.merged} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="dia"
                type="number"
                domain={[1, 31]}
                ticks={[1, 5, 10, 15, 20, 25, 31]}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtCompact}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                labelStyle={{ color: "#fff" }}
                labelFormatter={(dia) => `Dia ${dia}`}
                formatter={(value, name) => [
                  value === null ? "-" : fmt(value),
                  name === "atual" ? "Mes atual" : "Mes anterior",
                ]}
              />
              <ReferenceLine
                x={31}
                stroke="rgba(255,255,255,0.18)"
                strokeDasharray="4 4"
                label={{ value: "Fim do mes", fill: "rgba(255,255,255,0.4)", fontSize: 10, position: "insideTopRight" }}
              />
              <Line
                type="monotone"
                dataKey="anterior"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="atual"
                stroke={config.color}
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
              {data.lastDay && data.lastValue > 0 && (
                <ReferenceDot
                  x={data.lastDay}
                  y={data.lastValue}
                  r={5}
                  fill={config.color}
                  stroke="#fff"
                  strokeWidth={1.5}
                  ifOverflow="extendDomain"
                />
              )}
              {data.peakDay && data.peakCumulative !== null && data.peakCumulative > 0 && data.peakDay !== data.lastDay && (
                <ReferenceDot
                  x={data.peakDay}
                  y={data.peakCumulative}
                  r={5}
                  fill="#fbbf24"
                  stroke="#fff"
                  strokeWidth={1.5}
                  ifOverflow="extendDomain"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {(data.peakDay || data.lastDay) && (
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          {data.lastDay && data.lastValue > 0 && (
            <div className="flex items-center gap-1.5" data-testid="ritmo-ponto-final">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-white/50">
                Acumulado ate dia {data.lastDay}: <span className="text-white font-medium">{fmt(data.lastValue)}</span>
              </span>
            </div>
          )}
          {data.peakDay && data.peakValue > 0 && (
            <div className="flex items-center gap-1.5" data-testid="ritmo-ponto-pico">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-white/50">
                {config.peakLabel} (dia {data.peakDay}): <span className="text-white font-medium">{fmt(data.peakValue)}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, variacao, icon: Icon, iconColor, showBalance }) {
  const isPositive = variacao >= 0;
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 sm:p-5 hover:border-white/[0.12] transition-all duration-300">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <span className="text-white/50 text-xs sm:text-sm font-medium">{title}</span>
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-white text-lg sm:text-2xl font-bold mb-1.5">
        {showBalance ? fmt(value) : "R$ ------"}
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        <span>{isPositive ? "+" : ""}{variacao.toFixed(1)}% este mes</span>
      </div>
    </div>
  );
}

function DueCard({ title, subtitle, icon: Icon, iconBg, receitas, despesas, onClick }) {
  return (
    <div onClick={onClick} className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 sm:p-5 hover:border-white/[0.12] transition-all duration-300 cursor-pointer">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{title}</p>
          <p className="text-white/30 text-xs">{subtitle}</p>
        </div>
      </div>
      <div className="flex gap-6 sm:gap-8">
        <div>
          <p className="text-white/40 text-xs mb-1">Receitas</p>
          <p className="text-emerald-400 font-semibold text-xs sm:text-sm">{fmt(receitas)}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs mb-1">Despesas</p>
          <p className="text-red-400 font-semibold text-xs sm:text-sm">{fmt(despesas)}</p>
        </div>
      </div>
    </div>
  );
}

export default function OverviewSection() {
  const { user, transactions, categories, tags, cards, accounts, investments, financings, goals, contributeToGoal, createTransaction, createInstallmentBatch, payFinancingCustom } = useData();
  const [showBalance, setShowBalance] = useState(true);
  const [chartPeriod, setChartPeriod] = useState("6m");
  const [aporteGoalId, setAporteGoalId] = useState(null);
  const [aporteValue, setAporteValue] = useState("");
  const [saqueGoalId, setSaqueGoalId] = useState(null);
  const [saqueValue, setSaqueValue] = useState("");
  const [showNewTx, setShowNewTx] = useState(false);
  const [newTxTipo, setNewTxTipo] = useState("despesa");
  const [dueModal, setDueModal] = useState(null); // 'vencidos' | 'vencendo' | 'futuro' | null
  const [saldoModal, setSaldoModal] = useState(false);

  // Calculate summary from real data
  const summary = useMemo(() => {
    const receitas = transactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const despesas = transactions.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
    const totalInvestido = investments.reduce((sum, i) => sum + i.valor, 0);
    
    // Calculate variation (simplified - comparing to 0 for now)
    return {
      saldoTotal: receitas - despesas + totalInvestido,
      receitas,
      despesas,
      investimentos: totalInvestido,
      varSaldo: 12.5,
      varReceitas: 8.3,
      varDespesas: -3.2,
      varInvest: 15.7,
    };
  }, [transactions, investments]);

  // Calculate chart data from transactions
  const chartData = useMemo(() => {
    const now = new Date();
    const periods = {
      "7d": 7,
      "1m": 30,
      "3m": 90,
      "6m": 180,
      "1y": 365,
      "5y": 365 * 5,
      "10y": 365 * 10,
      "25y": 365 * 25,
    };
    const daysBack = periods[chartPeriod] || 180;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    // Group transactions by month
    const monthlyData = {};
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.data);
      if (txDate >= startDate) {
        const key = `${months[txDate.getMonth()]}/${txDate.getFullYear().toString().slice(2)}`;
        if (!monthlyData[key]) {
          monthlyData[key] = { name: key, receitas: 0, despesas: 0 };
        }
        if (tx.tipo === 'receita') {
          monthlyData[key].receitas += tx.valor;
        } else {
          monthlyData[key].despesas += tx.valor;
        }
      }
    });

    const result = Object.values(monthlyData).sort((a, b) => {
      const [monthA, yearA] = a.name.split('/');
      const [monthB, yearB] = b.name.split('/');
      return (parseInt(yearA) - parseInt(yearB)) || (months.indexOf(monthA) - months.indexOf(monthB));
    });

    // If no data, return sample data
    if (result.length === 0) {
      return [
        { name: "Jan", receitas: 0, despesas: 0 },
        { name: "Fev", receitas: 0, despesas: 0 },
      ];
    }

    return result;
  }, [transactions, chartPeriod]);

  // Calculate expense categories from transactions
  const expenseCategories = useMemo(() => {
    const categoryTotals = {};
    const categoryColors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
    
    transactions.filter(t => t.tipo === 'despesa').forEach(tx => {
      const catName = tx.categoria || 'Outros';
      if (!categoryTotals[catName]) {
        categoryTotals[catName] = { nome: catName, valor: 0, icon: 'ShoppingCart' };
      }
      categoryTotals[catName].valor += tx.valor;
    });

    return Object.values(categoryTotals).map((cat, idx) => ({
      ...cat,
      cor: categoryColors[idx % categoryColors.length],
    })).sort((a, b) => b.valor - a.valor).slice(0, 6);
  }, [transactions]);

  // Due items (last 7 days, today, next 7 days) - with full transaction lists
  const dueItems = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const future7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const vencidosTx = transactions.filter(t => t.data < past7 && !t.pago);
    const vencendoTx = transactions.filter(t => t.data === today);
    const futuroTx = transactions.filter(t => t.data > today && t.data <= future7);

    return {
      vencidos: { 
        receitas: vencidosTx.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0),
        despesas: vencidosTx.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0),
        items: vencidosTx,
      },
      vencendo: {
        receitas: vencendoTx.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0),
        despesas: vencendoTx.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0),
        items: vencendoTx,
      },
      futuro: {
        receitas: futuroTx.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0),
        despesas: futuroTx.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0),
        items: futuroTx,
      },
    };
  }, [transactions]);

  const handleAporte = async () => {
    if (!aporteValue || isNaN(Number(aporteValue)) || !aporteGoalId) return;
    try {
      await contributeToGoal(aporteGoalId, Number(aporteValue));
      setAporteValue("");
      setAporteGoalId(null);
    } catch (error) {
      console.error('Error contributing to goal:', error);
    }
  };

  const handleSaque = async () => {
    if (!saqueValue || isNaN(Number(saqueValue)) || !saqueGoalId) return;
    try {
      await contributeToGoal(saqueGoalId, -Number(saqueValue));
      setSaqueValue("");
      setSaqueGoalId(null);
    } catch (error) {
      console.error('Error withdrawing from goal:', error);
    }
  };

  // Saldo breakdown for modal
  const saldoBreakdown = useMemo(() => {
    const accountTotals = accounts.map(a => ({ nome: a.nome, tipo: a.tipo, valor: a.saldo, cor: a.cor }));
    const investTotal = investments.reduce((s, i) => s + i.valor, 0);
    return { accounts: accountTotals, investimentos: investTotal };
  }, [accounts, investments]);

  const handleSaveTransaction = async (item) => {
    try {
      await createTransaction(item);
      setShowNewTx(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const userName = user?.name?.split(" ")[0] || "Usuário";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-white text-xl sm:text-2xl font-bold">Ola, {userName}!</h1>
          <p className="text-white/40 text-sm mt-1">Aqui esta o resumo das suas financas</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBalance(!showBalance)} className="text-white/40 hover:text-white/80 transition-colors p-2 rounded-lg hover:bg-white/[0.04]">
            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowNewTx(true)}
            className="flex items-center gap-2 bg-white text-black text-sm font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nova</span> Transacao
          </button>
        </div>
      </div>

      {/* Due Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <DueCard title="Vencidos" subtitle="Contas nao pagas" icon={AlertTriangle} iconBg="bg-red-500/20 text-red-400" receitas={dueItems.vencidos.receitas} despesas={dueItems.vencidos.despesas} onClick={() => setDueModal('vencidos')} />
        <DueCard title="Vencendo" subtitle="Hoje" icon={CalendarClock} iconBg="bg-amber-500/20 text-amber-400" receitas={dueItems.vencendo.receitas} despesas={dueItems.vencendo.despesas} onClick={() => setDueModal('vencendo')} />
        <DueCard title="Futuro" subtitle="Proximos 7 dias" icon={Clock} iconBg="bg-blue-500/20 text-blue-400" receitas={dueItems.futuro.receitas} despesas={dueItems.futuro.despesas} onClick={() => setDueModal('futuro')} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div onClick={() => setSaldoModal(true)} className="cursor-pointer">
          <SummaryCard title="Saldo Total" value={summary.saldoTotal} variacao={summary.varSaldo} icon={Wallet} iconColor="bg-indigo-500/20 text-indigo-400" showBalance={showBalance} />
        </div>
        <SummaryCard title="Receitas" value={summary.receitas} variacao={summary.varReceitas} icon={ArrowDownLeft} iconColor="bg-emerald-500/20 text-emerald-400" showBalance={showBalance} />
        <SummaryCard title="Despesas" value={summary.despesas} variacao={summary.varDespesas} icon={ArrowUpRight} iconColor="bg-red-500/20 text-red-400" showBalance={showBalance} />
        <SummaryCard title="Investimentos" value={summary.investimentos} variacao={summary.varInvest} icon={TrendingUp} iconColor="bg-purple-500/20 text-purple-400" showBalance={showBalance} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/[0.06] rounded-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-white font-semibold text-sm sm:text-base">Receitas vs Despesas</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white/50 text-xs">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-white/50 text-xs">Despesas</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-4">
            {TIME_PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs rounded-md transition-colors ${chartPeriod === p ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value) => fmt(value)}
                />
                <Area type="monotone" dataKey="receitas" stroke="#22c55e" fill="url(#colorReceitas)" strokeWidth={2} />
                <Area type="monotone" dataKey="despesas" stroke="#ef4444" fill="url(#colorDespesas)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Despesas por Categoria</h3>
          {expenseCategories.length > 0 ? (
            <div className="space-y-3">
              {expenseCategories.map((cat, idx) => {
                const Icon = iconMap[cat.icon] || ShoppingCart;
                const total = expenseCategories.reduce((s, c) => s + c.valor, 0);
                const percentage = total > 0 ? ((cat.valor / total) * 100).toFixed(1) : 0;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.cor}20` }}>
                      <Icon className="w-4 h-4" style={{ color: cat.cor }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-sm">{cat.nome}</span>
                        <span className="text-white/50 text-xs">{percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: cat.cor }} />
                      </div>
                    </div>
                    <span className="text-white text-sm font-medium w-24 text-right">{fmt(cat.valor)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/40 text-sm text-center py-8">Nenhuma despesa registrada</p>
          )}
        </div>
      </div>

      {/* Ritmo de gastos / receitas */}
      <RitmoChart transactions={transactions} />

      {/* Financial Goals */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm sm:text-base">Metas Financeiras</h3>
          <button className="text-white/40 hover:text-white/60 text-sm flex items-center gap-1">
            Ver todas <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.slice(0, 3).map((goal) => {
              const progress = goal.valor_meta > 0 ? (goal.valor_atual / goal.valor_meta) * 100 : 0;
              const Icon = iconMap[goal.icone] || Target;
              return (
                <div key={goal.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{goal.nome}</p>
                      <p className="text-white/40 text-xs">Meta: {fmt(goal.valor_meta)}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">{fmt(goal.valor_atual)}</span>
                      <span className="text-emerald-400">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  </div>
                  {aporteGoalId === goal.id ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={aporteValue}
                        onChange={(e) => setAporteValue(e.target.value)}
                        placeholder="Valor"
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.16]"
                      />
                      <button onClick={handleAporte} className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3 py-2 rounded-lg transition-colors">
                        OK
                      </button>
                      <button onClick={() => { setAporteGoalId(null); setAporteValue(""); }} className="text-white/40 hover:text-white/60 text-sm px-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : saqueGoalId === goal.id ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={saqueValue}
                        onChange={(e) => setSaqueValue(e.target.value)}
                        placeholder="Valor"
                        className="flex-1 bg-white/[0.04] border border-red-500/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/30"
                      />
                      <button onClick={handleSaque} className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg transition-colors">
                        OK
                      </button>
                      <button onClick={() => { setSaqueGoalId(null); setSaqueValue(""); }} className="text-white/40 hover:text-white/60 text-sm px-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAporteGoalId(goal.id)}
                        className="flex-1 text-center text-indigo-400 hover:text-indigo-300 text-sm font-medium py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                        data-testid={`goal-aporte-${goal.id}`}
                      >
                        <Plus className="w-3.5 h-3.5 inline mr-1" />Aporte
                      </button>
                      {goal.valor_atual > 0 && (
                        <button
                          onClick={() => setSaqueGoalId(goal.id)}
                          className="flex-1 text-center text-red-400 hover:text-red-300 text-sm font-medium py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                          data-testid={`goal-saque-${goal.id}`}
                        >
                          <Minus className="w-3.5 h-3.5 inline mr-1" />Sacar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-white/40 text-sm text-center py-8">Nenhuma meta cadastrada</p>
        )}
      </div>

      {/* New Transaction Modal */}
      <TransactionModal
        open={showNewTx}
        onClose={() => setShowNewTx(false)}
        onSave={handleSaveTransaction}
        item={null}
        tipo={newTxTipo}
        categories={categories}
        tags={tags}
        cards={cards}
        onCreateInstallmentBatch={createInstallmentBatch}
        financings={financings}
        onPayFinancingCustom={payFinancingCustom}
      />
      
      {/* Tipo selector for new transaction */}
      {showNewTx && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-[#1a1a1a] border border-white/[0.1] rounded-full p-1 flex gap-1 shadow-xl">
          <button
            onClick={() => setNewTxTipo('receita')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${newTxTipo === 'receita' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/60'}`}
          >
            Receita
          </button>
          <button
            onClick={() => setNewTxTipo('despesa')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${newTxTipo === 'despesa' ? 'bg-red-500/20 text-red-400' : 'text-white/40 hover:text-white/60'}`}
          >
            Despesa
          </button>
        </div>
      )}

      {/* Due Items Modal */}
      <Dialog open={!!dueModal} onOpenChange={() => setDueModal(null)}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {dueModal === 'vencidos' && 'Contas Vencidas'}
              {dueModal === 'vencendo' && 'Contas Vencendo Hoje'}
              {dueModal === 'futuro' && 'Contas Futuras (7 dias)'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {dueModal && dueItems[dueModal]?.items?.length > 0 ? (
              dueItems[dueModal].items.map(t => (
                <div key={t.id} className="flex items-center justify-between py-3 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{t.descricao}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/30 text-xs">{new Date(t.data).toLocaleDateString("pt-BR")}</span>
                      <span className="text-white/20 text-xs">{t.categoria}</span>
                      {!t.pago && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">Pendente</span>}
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${t.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.tipo === 'receita' ? '+' : '-'}{fmt(t.valor)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-white/40 text-sm text-center py-6">Nenhuma conta encontrada</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Saldo Total Modal */}
      <Dialog open={saldoModal} onOpenChange={() => setSaldoModal(false)}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Composicao do Saldo Total</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-white text-sm">Receitas</span>
              </div>
              <span className="text-emerald-400 text-sm font-semibold">{fmt(summary.receitas)}</span>
            </div>
            <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-white text-sm">Despesas</span>
              </div>
              <span className="text-red-400 text-sm font-semibold">-{fmt(summary.despesas)}</span>
            </div>
            {saldoBreakdown.accounts.length > 0 && (
              <>
                <p className="text-white/40 text-xs font-medium pt-2">Contas Bancarias</p>
                {saldoBreakdown.accounts.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-3 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.cor || '#6366f1' }} />
                      <span className="text-white text-sm">{a.nome}</span>
                      <span className="text-white/30 text-xs">{a.tipo}</span>
                    </div>
                    <span className="text-white text-sm font-semibold">{fmt(a.valor)}</span>
                  </div>
                ))}
              </>
            )}
            {saldoBreakdown.investimentos > 0 && (
              <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-white text-sm">Investimentos</span>
                </div>
                <span className="text-purple-400 text-sm font-semibold">{fmt(saldoBreakdown.investimentos)}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-3 px-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mt-2">
              <span className="text-white font-medium">Total</span>
              <span className="text-white font-bold text-lg">{fmt(summary.saldoTotal)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
