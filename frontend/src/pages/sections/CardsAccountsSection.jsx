import React, { useState } from "react";
import { mockCards, mockCardInstallments, mockBankAccounts } from "../../data/mockData";
import { CreditCard, Landmark, ChevronDown, ChevronUp, Check, Eye, EyeOff, Plus } from "lucide-react";

const formatCurrency = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function CardsAccountsSection() {
  const [activeTab, setActiveTab] = useState("cartoes");
  const [expandedCard, setExpandedCard] = useState(null);
  const [paidInvoices, setPaidInvoices] = useState({});
  const [showBalances, setShowBalances] = useState(true);

  const handlePayInvoice = (cardId) => {
    setPaidInvoices((prev) => ({ ...prev, [cardId]: true }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Contas e Cartões</h1>
          <p className="text-white/40 text-sm mt-1">Gerencie suas contas bancárias e cartões</p>
        </div>
        <button onClick={() => setShowBalances(!showBalances)} className="text-white/40 hover:text-white/80 transition-colors p-2 rounded-lg hover:bg-white/[0.04]">
          {showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-1 bg-[#111111] border border-white/[0.06] rounded-lg p-1 w-fit mb-6">
        {[{ key: "cartoes", label: "Cartões", icon: CreditCard }, { key: "contas", label: "Contas Bancárias", icon: Landmark }].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all duration-200 ${activeTab === tab.key ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white/70"}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "cartoes" ? (
        <div className="space-y-6">
          {mockCards.map((card) => {
            const installments = mockCardInstallments.filter((i) => i.cardId === card.id);
            const isPaid = paidInvoices[card.id];
            const usedPercent = (card.usado / card.limite) * 100;
            const isExpanded = expandedCard === card.id;
            const totalParcelas = installments.reduce((a, b) => a + b.valorParcela, 0);

            return (
              <div key={card.id} className="space-y-4">
                {/* Card Visual */}
                <div className={`bg-gradient-to-br ${card.cor} rounded-2xl p-6 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white/70 text-sm">{card.nome}</p>
                      <span className="text-white/40 text-xs">Vinculado: {card.bancoNome}</span>
                    </div>
                    <p className="text-white text-xl font-mono tracking-widest mb-6">{card.numero}</p>
                    <div className="flex items-center justify-between">
                      <div><p className="text-white/50 text-xs">Vencimento</p><p className="text-white text-sm font-medium">{card.vencimento}</p></div>
                      <p className="text-white font-semibold text-sm">{card.bandeira}</p>
                    </div>
                  </div>
                </div>

                {/* Card Details + Invoice */}
                <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/50 text-sm">Fatura Atual</span>
                    <div className="flex items-center gap-3">
                      {isPaid ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium"><Check className="w-3.5 h-3.5" /> Paga</span>
                      ) : (
                        <button onClick={() => handlePayInvoice(card.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors">Pagar Fatura</button>
                      )}
                      <span className="text-white text-sm font-medium">{showBalances ? formatCurrency(card.faturaAtual) : "••••"}</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-2 mb-2">
                    <div className={`h-2 rounded-full transition-all ${usedPercent > 80 ? "bg-red-400" : "bg-purple-400"}`} style={{ width: `${usedPercent}%` }} />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/30 text-xs">Limite: {formatCurrency(card.limite)}</span>
                    <span className="text-white/30 text-xs">Disponível: {showBalances ? formatCurrency(card.limite - card.usado) : "••••"}</span>
                  </div>

                  {/* Parcelas Toggle */}
                  <button onClick={() => setExpandedCard(isExpanded ? null : card.id)} className="flex items-center justify-between w-full pt-3 border-t border-white/[0.06] group">
                    <span className="text-white/50 text-sm group-hover:text-white/80 transition-colors">Parcelas ({installments.length})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">Total mensal: {formatCurrency(totalParcelas)}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                    </div>
                  </button>

                  {/* Expanded Installments */}
                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {installments.map((inst) => (
                        <div key={inst.id} className="flex items-center justify-between py-2.5 px-3 bg-white/[0.02] rounded-lg">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{inst.descricao}</p>
                            <p className="text-white/30 text-xs">Parcela {inst.parcelaAtual}/{inst.totalParcelas} • Total: {formatCurrency(inst.valorTotal)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white text-sm font-semibold">{formatCurrency(inst.valorParcela)}</p>
                            <p className="text-white/20 text-xs">/mês</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Bank Accounts */
        <div className="space-y-4">
          {mockBankAccounts.map((account) => {
            const linkedCards = mockCards.filter((c) => c.bancoId === account.id);
            return (
              <div key={account.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: account.cor + "20" }}>
                      <Landmark className="w-5 h-5" style={{ color: account.cor }} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{account.nome}</p>
                      <p className="text-white/30 text-xs">{account.tipo} • Ag: {account.agencia} • Cc: {account.conta}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-lg font-bold">{showBalances ? formatCurrency(account.saldo) : "••••••"}</p>
                    <p className="text-white/30 text-xs">Saldo disponível</p>
                  </div>
                </div>
                {linkedCards.length > 0 && (
                  <div className="pt-3 border-t border-white/[0.06]">
                    <p className="text-white/40 text-xs mb-2">Cartões vinculados</p>
                    <div className="flex flex-wrap gap-2">
                      {linkedCards.map((card) => (
                        <div key={card.id} className="flex items-center gap-2 bg-white/[0.04] px-3 py-1.5 rounded-lg">
                          <CreditCard className="w-3.5 h-3.5 text-white/40" />
                          <span className="text-white/60 text-xs">{card.nome}</span>
                          <span className="text-white/30 text-xs">{card.numero.slice(-4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Account */}
          <button className="w-full bg-[#111111] border border-dashed border-white/[0.1] rounded-xl p-5 flex items-center justify-center gap-2 text-white/40 hover:text-white/70 hover:border-white/[0.2] transition-all duration-300">
            <Plus className="w-5 h-5" />
            <span className="text-sm">Adicionar Conta Bancária</span>
          </button>
        </div>
      )}
    </div>
  );
}
