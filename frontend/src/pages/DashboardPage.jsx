import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Bell, Search, Menu } from "lucide-react";
import { DataProvider, useData } from "../context/DataContext";
import OverviewSection from "./sections/OverviewSection";
import InvestmentsSection, { SimuladorSection } from "./sections/InvestmentsSection";
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
import PlanejamentosSection from "./sections/PlanejamentosSection";
import AssinaturasSection from "./sections/AssinaturasSection";

function DashboardContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading, error } = useData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">Erro ao carregar dados: {error}</p>
          <button onClick={() => window.location.reload()} className="text-white/60 text-sm underline hover:text-white/80">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  // Static Tailwind classes for sidebar offset (mobile: 0, desktop: depends on collapsed state)
  const offsetClass = sidebarCollapsed
    ? "left-0 lg:left-[72px]"
    : "left-0 lg:left-[260px]";
  const marginClass = sidebarCollapsed
    ? "ml-0 lg:ml-[72px]"
    : "ml-0 lg:ml-[260px]";

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Top Bar */}
      <header
        className={`fixed top-0 right-0 h-14 sm:h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6 z-40 transition-all duration-300 ${offsetClass}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-white/50 hover:text-white/80 p-1.5 rounded-lg hover:bg-white/[0.04]"
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar transacoes..."
              className="bg-white/[0.04] border border-white/[0.06] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.12] w-48 md:w-72 transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <button className="relative text-white/40 hover:text-white/80 transition-colors p-2 rounded-lg hover:bg-white/[0.04]">
            <Bell className="w-5 h-5" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">{userInitials}</span>
              </div>
            )}
            <span className="text-white/60 text-sm hidden md:block">{user?.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-[70px] sm:pt-24 pb-8 px-3 sm:px-6 transition-all duration-300 ${marginClass}`}>
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
          <Route path="planejamentos" element={<PlanejamentosSection />} />
          <Route path="assinaturas" element={<AssinaturasSection />} />
          <Route path="configuracoes" element={<SettingsSection />} />
        </Routes>
      </main>
    </div>
  );
}

export default function DashboardPage({ user }) {
  return (
    <DataProvider user={user}>
      <DashboardContent />
    </DataProvider>
  );
}
