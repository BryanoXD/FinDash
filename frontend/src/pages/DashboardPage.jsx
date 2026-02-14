import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  mockUser,
  mockSummary,
  mockTransactions,
  mockMonthlyData,
  mockExpenseCategories,
  mockInvestments,
  mockBudgets,
  mockCards,
} from "../data/mockData";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  Search,
  Plus,
  MoreHorizontal,
  Calendar,
  Filter,
  Download,
  Briefcase,
  Home,
  ShoppingCart,
  Tv,
  Car,
  Heart,
  GraduationCap,
  CreditCard,
  PieChart,
  BarChart3,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";

const iconMap = {
  Briefcase,
  Home,
  ShoppingCart,
  Tv,
  Car,
  Heart,
  GraduationCap,
  TrendingUp,
  ArrowDownLeft,
  Palette: Briefcase,
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatCompact = (value) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toString();
};

// Summary Card Component
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
      <div className="text-white text-2xl font-bold mb-1.5">
        {formatCurrency(value)}
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium ${
        isPositive ? "text-emerald-400" : "text-red-400"
      }`}>
        {isPositive ? (
          <TrendingUp className="w-3.5 h-3.5" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5" />
        )}
        <span>{isPositive ? "+" : ""}{variacao}% este mês</span>
      </div>
    </div>
  );
}

// Overview Section
function OverviewSection() {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Olá, {mockUser.name.split(" ")[0]}!</h1>
          <p className="text-white/40 text-sm mt-1">Aqui está o resumo das suas finanças</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-white/40 hover:text-white/80 transition-colors p-2 rounded-lg hover:bg-white/[0.04]"
          >
            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button className="flex items-center gap-2 bg-white text-black text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Plus className="w-4 h-4" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Saldo Total"
          value={showBalance ? mockSummary.saldoTotal : 0}
          variacao={mockSummary.saldoVariacao}
          icon={Wallet}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
        <SummaryCard
          title="Receitas"
          value={showBalance ? mockSummary.receitas : 0}
          variacao={mockSummary.receitasVariacao}
          icon={ArrowDownLeft}
          iconColor="bg-blue-500/15 text-blue-400"
        />
        <SummaryCard
          title="Despesas"
          value={showBalance ? mockSummary.despesas : 0}
          variacao={mockSummary.despesasVariacao}
          icon={ArrowUpRight}
          iconColor="bg-red-500/15 text-red-400"
        />
        <SummaryCard
          title="Investimentos"
          value={showBalance ? mockSummary.investimentos : 0}
          variacao={mockSummary.investimentosVariacao}
          icon={TrendingUp}
          iconColor="bg-purple-500/15 text-purple-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold">Receitas vs Despesas</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-white/40 text-xs">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-white/40 text-xs">Despesas</span>
              </div>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMonthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
                  tickFormatter={formatCompact}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: 13,
                  }}
                  formatter={(value) => [formatCurrency(value)]}
                />
                <Area
                  type="monotone"
                  dataKey="receitas"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#colorReceitas)"
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke="#f87171"
                  strokeWidth={2}
                  fill="url(#colorDespesas)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Despesas por Categoria</h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={mockExpenseCategories}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {mockExpenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: 13,
                  }}
                  formatter={(value) => [formatCurrency(value)]}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {mockExpenseCategories.slice(0, 4).map((cat) => (
              <div key={cat.nome} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.cor }} />
                  <span className="text-white/50 text-xs">{cat.nome}</span>
                </div>
                <span className="text-white/70 text-xs font-medium">{formatCurrency(cat.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl">
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="text-white font-semibold">Transações Recentes</h3>
          <button className="text-white/40 text-sm hover:text-white/70 transition-colors">
            Ver todas
          </button>
        </div>
        <div className="p-5">
          <div className="space-y-1">
            {mockTransactions.slice(0, 6).map((tx) => {
              const Icon = iconMap[tx.icone] || DollarSign;
              const isReceita = tx.tipo === "receita";
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isReceita ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        isReceita ? "text-emerald-400" : "text-red-400"
                      }`} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{tx.descricao}</p>
                      <p className="text-white/30 text-xs">{tx.categoria} • {new Date(tx.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    isReceita ? "text-emerald-400" : "text-red-400"
                  }`}>
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

// Transactions Page
function TransactionsSection() {
  const [filter, setFilter] = useState("todos");
  const filtered = filter === "todos"
    ? mockTransactions
    : mockTransactions.filter((t) => t.tipo === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Transações</h1>
          <p className="text-white/40 text-sm mt-1">Histórico completo de movimentações</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-white/50 text-sm px-3 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button className="flex items-center gap-2 text-white/50 text-sm px-3 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-[#111111] border border-white/[0.06] rounded-lg p-1 w-fit mb-6">
        {["todos", "receita", "despesa"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm rounded-md transition-all duration-200 capitalize ${
              filter === f
                ? "bg-white/10 text-white font-medium"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {f === "todos" ? "Todos" : f === "receita" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl">
        <div className="divide-y divide-white/[0.04]">
          {filtered.map((tx) => {
            const Icon = iconMap[tx.icone] || DollarSign;
            const isReceita = tx.tipo === "receita";
            return (
              <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isReceita ? "bg-emerald-500/10" : "bg-red-500/10"
                  }`}>
                    <Icon className={`w-4 h-4 ${isReceita ? "text-emerald-400" : "text-red-400"}`} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{tx.descricao}</p>
                    <p className="text-white/30 text-xs">{tx.categoria}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${isReceita ? "text-emerald-400" : "text-red-400"}`}>
                    {isReceita ? "+" : "-"}{formatCurrency(tx.valor)}
                  </p>
                  <p className="text-white/30 text-xs">
                    {new Date(tx.data).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Budget Section
function BudgetSection() {
  const totalLimite = mockBudgets.reduce((a, b) => a + b.limite, 0);
  const totalGasto = mockBudgets.reduce((a, b) => a + b.gasto, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Orçamento</h1>
          <p className="text-white/40 text-sm mt-1">Controle seus limites de gastos</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/50 text-sm">Orçamento Total</span>
          <span className="text-white text-sm font-medium">
            {formatCurrency(totalGasto)} de {formatCurrency(totalLimite)}
          </span>
        </div>
        <div className="w-full bg-white/[0.06] rounded-full h-2.5">
          <div
            className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${(totalGasto / totalLimite) * 100}%` }}
          />
        </div>
        <p className="text-white/30 text-xs mt-2">
          {((totalGasto / totalLimite) * 100).toFixed(1)}% utilizado
        </p>
      </div>

      {/* Category Budgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockBudgets.map((budget) => {
          const percentage = (budget.gasto / budget.limite) * 100;
          const isOver = percentage > 90;
          return (
            <div
              key={budget.categoria}
              className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium text-sm">{budget.categoria}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                  isOver ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
                }`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isOver ? "bg-red-400" : "bg-emerald-400"
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/30 text-xs">{formatCurrency(budget.gasto)}</span>
                <span className="text-white/30 text-xs">{formatCurrency(budget.limite)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Investments Section
function InvestmentsSection() {
  const totalInvestido = mockInvestments.reduce((a, b) => a + b.valor, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Investimentos</h1>
          <p className="text-white/40 text-sm mt-1">Acompanhe sua carteira de investimentos</p>
        </div>
      </div>

      {/* Total */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
        <span className="text-white/50 text-sm">Total Investido</span>
        <p className="text-white text-3xl font-bold mt-1">{formatCurrency(totalInvestido)}</p>
        <div className="flex items-center gap-1 text-emerald-400 text-sm mt-2">
          <TrendingUp className="w-4 h-4" />
          <span>+15.7% rendimento total</span>
        </div>
      </div>

      {/* Investment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockInvestments.map((inv) => (
          <div
            key={inv.id}
            className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-medium">{inv.nome}</p>
                <p className="text-white/30 text-xs">{inv.tipo}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                inv.variacao >= 0
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}>
                {inv.variacao >= 0 ? "+" : ""}{inv.variacao}%
              </span>
            </div>
            <p className="text-white text-xl font-bold">{formatCurrency(inv.valor)}</p>
            <p className="text-emerald-400/70 text-xs mt-1">
              Rendimento: {inv.rendimento}% a.a.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Cards Section
function CardsSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Cartões</h1>
          <p className="text-white/40 text-sm mt-1">Gerencie seus cartões de crédito</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockCards.map((card) => {
          const usedPercent = (card.usado / card.limite) * 100;
          return (
            <div key={card.id} className="space-y-4">
              {/* Card Visual */}
              <div className={`bg-gradient-to-br ${card.cor} rounded-2xl p-6 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
                <div className="relative z-10">
                  <p className="text-white/70 text-sm mb-6">{card.nome}</p>
                  <p className="text-white text-xl font-mono tracking-widest mb-6">{card.numero}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/50 text-xs">Vencimento</p>
                      <p className="text-white text-sm font-medium">{card.vencimento}</p>
                    </div>
                    <p className="text-white font-semibold text-sm">{card.bandeira}</p>
                  </div>
                </div>
              </div>
              {/* Card Details */}
              <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/50 text-sm">Fatura Atual</span>
                  <span className="text-white text-sm font-medium">{formatCurrency(card.usado)}</span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all ${usedPercent > 80 ? "bg-red-400" : "bg-purple-400"}`}
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/30 text-xs">Limite: {formatCurrency(card.limite)}</span>
                  <span className="text-white/30 text-xs">Disponível: {formatCurrency(card.limite - card.usado)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Reports Section
function ReportsSection() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Relatórios</h1>
          <p className="text-white/40 text-sm mt-1">Análises detalhadas das suas finanças</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Relatório Mensal", desc: "Resumo de julho 2025", icon: Calendar },
          { title: "Fluxo de Caixa", desc: "Entradas e saídas", icon: BarChart3 },
          { title: "Análise de Gastos", desc: "Por categoria", icon: PieChart },
        ].map((report) => (
          <div
            key={report.title}
            className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
              <report.icon className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
            </div>
            <h3 className="text-white font-medium mb-1">{report.title}</h3>
            <p className="text-white/30 text-sm">{report.desc}</p>
            <button className="mt-4 text-white/50 text-sm flex items-center gap-1 group-hover:text-white/80 transition-colors">
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Settings Section
function SettingsSection() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Configurações</h1>
        <p className="text-white/40 text-sm mt-1">Gerencie suas preferências</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">Perfil</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">{mockUser.avatar}</span>
            </div>
            <div>
              <p className="text-white font-medium">{mockUser.name}</p>
              <p className="text-white/40 text-sm">{mockUser.email}</p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">Preferências</h3>
          <div className="space-y-4">
            {[
              { label: "Notificações por email", defaultOn: true },
              { label: "Alertas de orçamento", defaultOn: true },
              { label: "Relatórios semanais", defaultOn: false },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between">
                <span className="text-white/60 text-sm">{pref.label}</span>
                <button
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    pref.defaultOn ? "bg-emerald-500" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      pref.defaultOn ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Dashboard Layout
export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Top Bar */}
      <div
        className={`fixed top-0 right-0 h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 z-40 transition-all duration-300 ${
          sidebarCollapsed ? "left-[72px]" : "left-[260px]"
        }`}
      >
        <div className="relative">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar transações..."
            className="bg-white/[0.04] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.12] w-72 transition-colors"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="relative text-white/40 hover:text-white/80 transition-colors p-2 rounded-lg hover:bg-white/[0.04]">
            <Bell className="w-5 h-5" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
          </button>
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-medium">{mockUser.avatar}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main
        className={`pt-24 pb-8 px-6 transition-all duration-300 ${
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        }`}
      >
        <Routes>
          <Route index element={<OverviewSection />} />
          <Route path="transacoes" element={<TransactionsSection />} />
          <Route path="orcamento" element={<BudgetSection />} />
          <Route path="investimentos" element={<InvestmentsSection />} />
          <Route path="cartoes" element={<CardsSection />} />
          <Route path="relatorios" element={<ReportsSection />} />
          <Route path="configuracoes" element={<SettingsSection />} />
        </Routes>
      </main>
    </div>
  );
}
