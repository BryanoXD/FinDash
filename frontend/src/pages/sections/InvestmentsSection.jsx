import React, { useState } from "react";
import {
  mockInvestments, mockInvestmentContributions, mockInvestmentChartData,
} from "../../data/mockData";
import { TrendingUp, Plus, X, DollarSign, Calendar } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const formatCurrency = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const formatCompact = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString());
const TIME_PERIODS = ["7d", "1m", "3m", "6m", "1y", "5y", "10y", "25y"];

export default function InvestmentsSection() {
  const [investments, setInvestments] = useState(mockInvestments);
  const [contributions, setContributions] = useState(mockInvestmentContributions);
  const [chartPeriod, setChartPeriod] = useState("1y");
  const [aporteModal, setAporteModal] = useState(null);
  const [aporteValue, setAporteValue] = useState("");
  const [showHistory, setShowHistory] = useState(null);

  const totalInvestido = investments.reduce((a, b) => a + b.valor, 0);
  const chartData = mockInvestmentChartData[chartPeriod] || mockInvestmentChartData["1y"];

  const handleAporte = (invId) => {
    const val = Number(aporteValue);
    if (!val || val <= 0) return;
    setInvestments((prev) => prev.map((inv) => inv.id === invId ? { ...inv, valor: inv.valor + val } : inv));
    const newContrib = { id: Date.now(), investimentoId: invId, valor: val, data: new Date().toISOString().split("T")[0], tipo: "aporte" };
    setContributions((prev) => [newContrib, ...prev]);
    setAporteValue("");
    setAporteModal(null);
  };

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
          <TrendingUp className="w-4 h-4" /><span>+15.7% rendimento total</span>
        </div>
      </div>

      {/* Investment Performance Chart */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Evolução da Carteira</h3>
        </div>
        <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1 w-fit mb-4">
          {TIME_PERIODS.map((p) => (
            <button key={p} onClick={() => setChartPeriod(p)} className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${chartPeriod === p ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white/70"}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickFormatter={formatCompact} />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: 13 }} formatter={(v) => [formatCurrency(v)]} />
              <Area type="monotone" dataKey="valor" stroke="#a78bfa" strokeWidth={2} fill="url(#colorInvest)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Investment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {investments.map((inv) => {
          const invContribs = contributions.filter((c) => c.investimentoId === inv.id);
          return (
            <div key={inv.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium">{inv.nome}</p>
                  <p className="text-white/30 text-xs">{inv.tipo}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${inv.variacao >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                  {inv.variacao >= 0 ? "+" : ""}{inv.variacao}%
                </span>
              </div>
              <p className="text-white text-xl font-bold">{formatCurrency(inv.valor)}</p>
              <p className="text-emerald-400/70 text-xs mt-1">Rendimento: {inv.rendimento}% a.a.</p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                {aporteModal === inv.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="number" value={aporteValue} onChange={(e) => setAporteValue(e.target.value)} placeholder="Valor do aporte" className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-white/20" autoFocus />
                    <button onClick={() => handleAporte(inv.id)} className="bg-emerald-500/20 text-emerald-400 text-sm font-medium px-3 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors">Confirmar</button>
                    <button onClick={() => { setAporteModal(null); setAporteValue(""); }} className="text-white/30 hover:text-white/60 p-2"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setAporteModal(inv.id)} className="flex items-center gap-1.5 text-white/50 text-xs hover:text-white/80 border border-white/[0.08] px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Novo Aporte
                    </button>
                    <button onClick={() => setShowHistory(showHistory === inv.id ? null : inv.id)} className="flex items-center gap-1.5 text-white/50 text-xs hover:text-white/80 border border-white/[0.08] px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                      <Calendar className="w-3.5 h-3.5" /> Histórico
                    </button>
                  </>
                )}
              </div>

              {/* Contribution History */}
              {showHistory === inv.id && invContribs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                  <p className="text-white/40 text-xs font-medium mb-2">Histórico de Aportes</p>
                  {invContribs.map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-emerald-400/60" />
                        <span className="text-white/50 text-xs">{new Date(c.data).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <span className="text-emerald-400 text-xs font-medium">+{formatCurrency(c.valor)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
