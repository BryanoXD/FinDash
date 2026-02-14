import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  TrendingUp,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard, path: "/dashboard" },
  { id: "transactions", label: "Transações", icon: ArrowLeftRight, path: "/dashboard/transacoes" },
  { id: "budget", label: "Orçamento", icon: PieChart, path: "/dashboard/orcamento" },
  { id: "investments", label: "Investimentos", icon: TrendingUp, path: "/dashboard/investimentos" },
  { id: "cards", label: "Cartões", icon: CreditCard, path: "/dashboard/cartoes" },
  { id: "reports", label: "Relatórios", icon: FileText, path: "/dashboard/relatorios" },
];

const bottomItems = [
  { id: "settings", label: "Configurações", icon: Settings, path: "/dashboard/configuracoes" },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("findash_auth");
    localStorage.removeItem("findash_user");
    navigate("/");
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-white/[0.06] flex flex-col z-50 transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-5 border-b border-white/[0.06] ${
        collapsed ? "justify-center" : "justify-between"
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-white font-semibold text-base tracking-tight">FinDash</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/40 hover:text-white/80 transition-colors hidden lg:block"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${
                active ? "text-white" : "text-white/50 group-hover:text-white/80"
              }`} />
              {!collapsed && (
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
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Sair</span>
          )}
        </button>
      </div>
    </aside>
  );
}
