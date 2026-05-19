import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "./ui/dialog";
import {
  LayoutDashboard,
  TrendingUp as TrendingUpIcon,
  TrendingDown,
  Tag,
  LineChart,
  Landmark,
  Grid3X3,
  Upload,
  FileText,
  Target,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Calculator,
  NotebookPen,
  Repeat,
  Users2,
  X,
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "receitas", label: "Receitas", icon: TrendingUpIcon, path: "/dashboard/receitas" },
  { id: "despesas", label: "Despesas", icon: TrendingDown, path: "/dashboard/despesas" },
  { id: "categorias", label: "Categorias", icon: Tag, path: "/dashboard/categorias" },
  { id: "orcamento", label: "Orcamento", icon: PiggyBank, path: "/dashboard/orcamento" },
  { id: "investments", label: "Invest. e Financ.", icon: LineChart, path: "/dashboard/investimentos" },
  { id: "simulador", label: "Simulador", icon: Calculator, path: "/dashboard/simulador" },
  { id: "accounts", label: "Contas e Cartoes", icon: Landmark, path: "/dashboard/contas-cartoes" },
  { id: "heatmap", label: "Heatmap de Gastos", icon: Grid3X3, path: "/dashboard/heatmap" },
  { id: "import", label: "Importar Extratos", icon: Upload, path: "/dashboard/importar" },
  { id: "reports", label: "Relatorios", icon: FileText, path: "/dashboard/relatorios" },
  { id: "goals", label: "Metas", icon: Target, path: "/dashboard/metas" },
  { id: "subscriptions", label: "Assinaturas", icon: Repeat, path: "/dashboard/assinaturas" },
  { id: "planejamentos", label: "Planejamentos", icon: NotebookPen, path: "/dashboard/planejamentos" },
  { id: "compartilhamento", label: "Compartilhamento", icon: Users2, path: "/dashboard/compartilhamento" },
];

const bottomItems = [
  { id: "settings", label: "Configuracoes", icon: Settings, path: "/dashboard/configuracoes" },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutModal, setLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const openLogoutConfirm = () => setLogoutModal(true);

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await authAPI.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    try {
      localStorage.removeItem("findash_auth");
      localStorage.removeItem("findash_user");
      localStorage.removeItem("findash_workspace");
      sessionStorage.clear();
    } catch (_) { /* ignore */ }
    setLoggingOut(false);
    setLogoutModal(false);
    navigate("/", { replace: true });
  };

  const handleNav = (path) => {
    navigate(path);
    if (mobileOpen) setMobileOpen(false);
  };

  const sidebarContent = (isMobile) => (
    <>
      {/* Logo */}
      <div className={`flex items-center h-16 px-5 border-b border-white/[0.06] ${
        collapsed && !isMobile ? "justify-center" : "justify-between"
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <span className="text-white font-semibold text-base tracking-tight">FinDash</span>
          )}
        </div>
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/40 hover:text-white/80 transition-colors hidden lg:block"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              } ${collapsed && !isMobile ? "justify-center" : ""}`}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${
                active ? "text-white" : "text-white/50 group-hover:text-white/80"
              }`} />
              {(!collapsed || isMobile) && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="py-4 px-3 border-t border-white/[0.06] space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              } ${collapsed && !isMobile ? "justify-center" : ""}`}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {(!collapsed || isMobile) && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
        <button
          data-testid="sidebar-logout-btn"
          onClick={openLogoutConfirm}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 ${
            collapsed && !isMobile ? "justify-center" : ""
          }`}
          title={collapsed && !isMobile ? "Sair" : undefined}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {(!collapsed || isMobile) && (
            <span className="text-sm font-medium">Sair</span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Logout Confirmation Modal */}
      <Dialog open={logoutModal} onOpenChange={(o) => !o && setLogoutModal(false)}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md" data-testid="logout-modal">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <LogOut className="w-4 h-4 text-red-400" /> Sair da conta?
            </DialogTitle>
          </DialogHeader>
          <p className="text-white/60 text-sm py-2">
            Tem certeza que deseja sair da sua conta? Voce precisara fazer login novamente para acessar seus dados.
          </p>
          <DialogFooter className="gap-2">
            <button
              data-testid="logout-cancel-btn"
              onClick={() => setLogoutModal(false)}
              className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-medium border border-white/[0.06]"
            >
              Cancelar
            </button>
            <button
              data-testid="logout-confirm-btn"
              onClick={confirmLogout}
              disabled={loggingOut}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {loggingOut ? "Saindo..." : "Sair da conta"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-white/[0.06] flex-col z-50 transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[280px] h-full bg-[#0a0a0a] border-r border-white/[0.06] flex flex-col">
            {sidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
