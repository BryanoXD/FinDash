import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { mockUser } from "../data/mockData";
import { Bell, Search } from "lucide-react";
import OverviewSection from "./sections/OverviewSection";
import InvestmentsSection from "./sections/InvestmentsSection";
import CardsAccountsSection from "./sections/CardsAccountsSection";
import {
  ReceitasSection,
  DespesasSection,
  CategoriasSection,
  BudgetSection,
  ReportsSection,
  MetasSection,
  HeatmapSection,
  ImportSection,
  SettingsSection,
} from "./sections/OtherSections";
import { SimuladorSection } from "./sections/InvestmentsSection";

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
          <Route path="receitas" element={<ReceitasSection />} />
          <Route path="despesas" element={<DespesasSection />} />
          <Route path="categorias" element={<CategoriasSection />} />
          <Route path="investimentos" element={<InvestmentsSection />} />
          <Route path="contas-cartoes" element={<CardsAccountsSection />} />
          <Route path="heatmap" element={<HeatmapSection />} />
          <Route path="importar" element={<ImportSection />} />
          <Route path="orcamento" element={<BudgetSection />} />
          <Route path="simulador" element={<SimuladorSection />} />
          <Route path="relatorios" element={<ReportsSection />} />
          <Route path="metas" element={<MetasSection />} />
          <Route path="configuracoes" element={<SettingsSection />} />
        </Routes>
      </main>
    </div>
  );
}
