import React, { useState } from "react";
import { mockCards, mockCardInstallments as initInstallments, mockBankAccounts as initAccounts, mockInvestments, mockFinancings } from "../../data/mockData";
import { CreditCard, Landmark, ChevronDown, ChevronUp, Check, Eye, EyeOff, Plus, Pencil, Trash2, TrendingUp, Home } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const Field = ({ label, required, children }) => (<div><label className="text-white/60 text-xs block mb-1.5">{label}{required && " *"}</label>{children}</div>);
const Inp = (props) => (<input {...props} className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 placeholder:text-white/25 ${props.className || ""}`} />);
const Sel = ({ children, ...rest }) => (<select {...rest} className={`w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/20 [&>option]:bg-[#1a1a1a] ${rest.className || ""}`}>{children}</select>);
const Btn = ({ children, variant = "primary", ...rest }) => (<button {...rest} className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${variant === "primary" ? "bg-white text-black hover:bg-gray-100" : "text-white/40 border border-white/[0.08] hover:bg-white/[0.04]"}`}>{children}</button>);

export default function CardsAccountsSection() {
  const [activeTab, setActiveTab] = useState("cartoes");
  const [expandedCard, setExpandedCard] = useState(null);
  const [installments, setInst] = useState(initInstallments);
  const [paidInvoices, setPaidInv] = useState({});
  const [showBalances, setShowBal] = useState(true);
  const [accounts, setAccounts] = useState(initAccounts);
  const [accModal, setAccModal] = useState(false);
  const [editAcc, setEditAcc] = useState(null);
  const [accForm, setAccForm] = useState({ nome: "", tipo: "", saldo: "", agencia: "", conta: "", cor: "#6366f1" });

  React.useEffect(() => {
    if (editAcc) setAccForm({ nome: editAcc.nome, tipo: editAcc.tipo, saldo: editAcc.saldo, agencia: editAcc.agencia, conta: editAcc.conta, cor: editAcc.cor });
    else setAccForm({ nome: "", tipo: "", saldo: "", agencia: "", conta: "", cor: "#6366f1" });
  }, [editAcc, accModal]);

  const handlePayInvoice = (cardId) => setPaidInv(p => ({ ...p, [cardId]: true }));
  const handlePayInstallment = (id) => setInst(p => p.map(i => i.id === id ? { ...i, pago: true } : i));

  const saveAccount = () => {
    if (!accForm.nome || !accForm.tipo) return;
    if (editAcc) setAccounts(p => p.map(a => a.id === editAcc.id ? { ...a, ...accForm, saldo: Number(accForm.saldo) } : a));
    else setAccounts(p => [...p, { ...accForm, id: Date.now(), saldo: Number(accForm.saldo) }]);
    setAccModal(false); setEditAcc(null);
  };

  const colors = ["#6366f1","#8b5cf6","#22c55e","#ef4444","#f97316","#3b82f6","#ec4899","#14b8a6"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-white text-2xl font-bold">Contas e Cartões</h1><p className="text-white/40 text-sm mt-1">Gerencie suas contas bancárias e cartões</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowBal(!showBalances)} className="text-white/40 hover:text-white/80 transition-colors p-2 rounded-lg hover:bg-white/[0.04]">{showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}</button>
          {activeTab === "contas" && <Btn onClick={() => { setEditAcc(null); setAccModal(true); }}><Plus className="w-4 h-4 inline mr-1" />Nova Conta</Btn>}
        </div>
      </div>

      <div className="flex gap-1 bg-[#111111] border border-white/[0.06] rounded-lg p-1 w-fit mb-6">
        {[{ key: "cartoes", label: "Cartões", icon: CreditCard }, { key: "contas", label: "Contas Bancárias", icon: Landmark }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all ${activeTab === tab.key ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white/70"}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "cartoes" ? (
        <div className="space-y-6">
          {mockCards.map(card => {
            const cardInst = installments.filter(i => i.cardId === card.id);
            const isPaid = paidInvoices[card.id];
            const usedPct = (card.usado / card.limite) * 100;
            const isExp = expandedCard === card.id;
            const totalParc = cardInst.filter(i => !i.pago).reduce((a, b) => a + b.valorParcela, 0);
            const paidParc = cardInst.filter(i => i.pago).reduce((a, b) => a + b.valorParcela, 0);
            const faturaRestante = card.faturaAtual - paidParc;

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

                {/* Card Details */}
                <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/50 text-sm">Fatura Atual</span>
                    <div className="flex items-center gap-3">
                      {isPaid ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium"><Check className="w-3.5 h-3.5" /> Paga</span>
                      ) : (
                        <button onClick={() => handlePayInvoice(card.id)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors">Pagar Fatura Completa</button>
                      )}
                      <span className="text-white text-sm font-medium">{showBalances ? fmt(faturaRestante > 0 ? faturaRestante : card.faturaAtual) : "••••"}</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-2 mb-2">
                    <div className={`h-2 rounded-full transition-all ${usedPct > 80 ? "bg-red-400" : "bg-purple-400"}`} style={{ width: `${usedPct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/30 text-xs">Limite: {fmt(card.limite)}</span>
                    <span className="text-white/30 text-xs">Disponível: {showBalances ? fmt(card.limite - card.usado) : "••••"}</span>
                  </div>

                  {/* Parcelas Toggle */}
                  <button onClick={() => setExpandedCard(isExp ? null : card.id)} className="flex items-center justify-between w-full pt-3 border-t border-white/[0.06] group">
                    <span className="text-white/50 text-sm group-hover:text-white/80 transition-colors">Parcelas ({cardInst.length})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">Mensal: {fmt(totalParc)}</span>
                      {isExp ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                    </div>
                  </button>

                  {isExp && (
                    <div className="mt-3 space-y-2">
                      {cardInst.map(inst => (
                        <div key={inst.id} className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${inst.pago ? "bg-emerald-500/5" : "bg-white/[0.02]"}`}>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${inst.pago ? "text-white/40 line-through" : "text-white"}`}>{inst.descricao}</p>
                            <p className="text-white/30 text-xs">Parcela {inst.parcelaAtual}/{inst.totalParcelas} • Total: {fmt(inst.valorTotal)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={`text-sm font-semibold ${inst.pago ? "text-emerald-400/50" : "text-white"}`}>{fmt(inst.valorParcela)}</p>
                              <p className="text-white/20 text-xs">/mês</p>
                            </div>
                            {inst.pago ? (
                              <span className="flex items-center gap-1 text-emerald-400/60 text-xs"><Check className="w-3.5 h-3.5" />Pago</span>
                            ) : (
                              <button onClick={() => handlePayInstallment(inst.id)} className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white transition-colors">Pagar</button>
                            )}
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
          {accounts.map(account => {
            const linkedCards = mockCards.filter(c => c.bancoId === account.id);
            const linkedInvs = mockInvestments.filter(i => i.bancoId === account.id);
            const linkedFins = mockFinancings.filter(f => f.bancoId === account.id);
            return (
              <div key={account.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all">
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
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-white text-lg font-bold">{showBalances ? fmt(account.saldo) : "••••••"}</p>
                      <p className="text-white/30 text-xs">Saldo disponível</p>
                    </div>
                    <button onClick={() => { setEditAcc(account); setAccModal(true); }} className="text-white/30 hover:text-white/60"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setAccounts(p => p.filter(a => a.id !== account.id))} className="text-red-400/40 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Linked Items */}
                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  {linkedCards.length > 0 && (
                    <div>
                      <p className="text-white/40 text-xs mb-2">Cartões vinculados</p>
                      <div className="flex flex-wrap gap-2">
                        {linkedCards.map(card => (
                          <div key={card.id} className="flex items-center gap-2 bg-white/[0.04] px-3 py-1.5 rounded-lg">
                            <CreditCard className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-white/60 text-xs">{card.nome}</span>
                            <span className="text-white/30 text-xs">{card.numero.slice(-4)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {linkedInvs.length > 0 && (
                    <div>
                      <p className="text-white/40 text-xs mb-2">Investimentos</p>
                      <div className="flex flex-wrap gap-2">
                        {linkedInvs.map(inv => (
                          <div key={inv.id} className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-lg">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400/60" />
                            <span className="text-emerald-400/80 text-xs">{inv.nome}</span>
                            <span className="text-emerald-400/40 text-xs">{showBalances ? fmt(inv.valor) : "••••"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {linkedFins.length > 0 && (
                    <div>
                      <p className="text-white/40 text-xs mb-2">Financiamentos</p>
                      <div className="flex flex-wrap gap-2">
                        {linkedFins.map(fin => (
                          <div key={fin.id} className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-lg">
                            <Home className="w-3.5 h-3.5 text-amber-400/60" />
                            <span className="text-amber-400/80 text-xs">{fin.nome}</span>
                            <span className="text-amber-400/40 text-xs">{fmt(fin.valorParcela)}/mês</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <button onClick={() => { setEditAcc(null); setAccModal(true); }} className="w-full bg-[#111111] border border-dashed border-white/[0.1] rounded-xl p-5 flex items-center justify-center gap-2 text-white/40 hover:text-white/70 hover:border-white/[0.2] transition-all">
            <Plus className="w-5 h-5" /><span className="text-sm">Adicionar Conta Bancária</span>
          </button>
        </div>
      )}

      {/* Account Modal */}
      <Dialog open={accModal} onOpenChange={() => { setAccModal(false); setEditAcc(null); }}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editAcc ? "Editar" : "Nova"} Conta Bancária</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nome do Banco" required><Inp placeholder="Ex: Nubank" value={accForm.nome} onChange={e => setAccForm({...accForm, nome: e.target.value})} /></Field>
            <Field label="Tipo" required><Sel value={accForm.tipo} onChange={e => setAccForm({...accForm, tipo: e.target.value})}><option value="">Selecione</option>{["Conta Corrente","Conta Poupança","Conta Digital","Conta Investimento"].map(t => <option key={t} value={t}>{t}</option>)}</Sel></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Agência"><Inp placeholder="0001" value={accForm.agencia} onChange={e => setAccForm({...accForm, agencia: e.target.value})} /></Field>
              <Field label="Conta"><Inp placeholder="12345-6" value={accForm.conta} onChange={e => setAccForm({...accForm, conta: e.target.value})} /></Field>
            </div>
            <Field label="Saldo (R$)"><Inp type="number" placeholder="0" value={accForm.saldo} onChange={e => setAccForm({...accForm, saldo: e.target.value})} /></Field>
            <Field label="Cor"><div className="flex gap-2 flex-wrap">{colors.map(c => (<button key={c} onClick={() => setAccForm({...accForm, cor: c})} className={`w-8 h-8 rounded-lg transition-all ${accForm.cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#111111]" : ""}`} style={{ backgroundColor: c }} />))}</div></Field>
          </div>
          <DialogFooter className="gap-2"><Btn variant="secondary" onClick={() => { setAccModal(false); setEditAcc(null); }}>Cancelar</Btn><Btn onClick={saveAccount}>{editAcc ? "Salvar" : "Criar"}</Btn></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
