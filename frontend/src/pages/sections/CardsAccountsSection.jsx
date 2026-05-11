import React, { useState, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { fmt } from "../../lib/formatters";
import { Field, Inp, MoneyInp, Sel, Btn } from "../../components/shared/FormComponents";
import { CreditCard, Landmark, ChevronDown, ChevronUp, Check, Eye, EyeOff, Plus, Pencil, Trash2, TrendingUp, Home, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";

export default function CardsAccountsSection() {
  const { 
    cards, installments, accounts, investments, financings,
    payCardInvoice, payInstallment, deleteInstallment, updateCard, createCard, deleteCard,
    createAccount, updateAccount, deleteAccount
  } = useData();
  
  const [activeTab, setActiveTab] = useState("cartoes");
  const [expandedCard, setExpandedCard] = useState(null);
  const [showBalances, setShowBal] = useState(true);
  const [accModal, setAccModal] = useState(false);
  const [editAcc, setEditAcc] = useState(null);
  const [accForm, setAccForm] = useState({ nome: "", tipo: "", saldo: "", agencia: "", conta: "", cor: "#6366f1" });
  const [paying, setPaying] = useState(null);
  // Card edit state
  const [editCardModal, setEditCardModal] = useState(null);
  const [editLimite, setEditLimite] = useState("");
  // Card create state
  const [newCardModal, setNewCardModal] = useState(false);
  const CARD_GRADIENTS = [
    { v: "from-purple-600 to-purple-800", label: "Roxo" },
    { v: "from-indigo-600 to-indigo-900", label: "Indigo" },
    { v: "from-blue-600 to-blue-900", label: "Azul" },
    { v: "from-emerald-600 to-emerald-900", label: "Verde" },
    { v: "from-rose-600 to-rose-900", label: "Rosa" },
    { v: "from-amber-500 to-amber-800", label: "Ambar" },
    { v: "from-slate-700 to-slate-900", label: "Preto" },
  ];
  const BANDEIRAS = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard", "Outros"];
  const emptyCardForm = { nome: "", numero: "", bandeira: "Visa", limite: 0, vencimento: "", banco_id: "", cor: CARD_GRADIENTS[0].v };
  const [cardForm, setCardForm] = useState(emptyCardForm);
  const [savingCard, setSavingCard] = useState(false);
  const [cardError, setCardError] = useState("");

  React.useEffect(() => {
    if (editAcc) setAccForm({ nome: editAcc.nome, tipo: editAcc.tipo, saldo: editAcc.saldo, agencia: editAcc.agencia || "", conta: editAcc.conta || "", cor: editAcc.cor });
    else setAccForm({ nome: "", tipo: "", saldo: "", agencia: "", conta: "", cor: "#6366f1" });
  }, [editAcc, accModal]);

  const handlePayInvoice = async (cardId) => {
    setPaying(cardId);
    try { await payCardInvoice(cardId); } catch (e) { console.error(e); } finally { setPaying(null); }
  };

  const handlePayInstallment = async (id) => {
    setPaying(id);
    try { await payInstallment(id); } catch (e) { console.error(e); } finally { setPaying(null); }
  };

  const handleDeleteInstallment = async (id) => {
    try { await deleteInstallment(id); } catch (e) { console.error(e); }
  };

  const handleSaveLimite = async () => {
    if (!editCardModal || !editLimite) return;
    try { await updateCard(editCardModal.id, { limite: Number(editLimite) }); setEditCardModal(null); } catch (e) { console.error(e); }
  };

  const openNewCard = () => {
    setCardForm(emptyCardForm);
    setCardError("");
    setNewCardModal(true);
  };

  const saveNewCard = async () => {
    setCardError("");
    // Frontend validations
    if (!cardForm.nome.trim()) return setCardError("Informe o apelido do cartao");
    if (!/^\d{4}$/.test(cardForm.numero || "")) return setCardError("Informe os 4 ultimos digitos do cartao");
    if (!cardForm.banco_id) return setCardError("Selecione a conta bancaria vinculada");
    if (!cardForm.vencimento.trim()) return setCardError("Informe o dia de vencimento");
    if (!cardForm.limite || cardForm.limite <= 0) return setCardError("Informe o limite do cartao");
    setSavingCard(true);
    try {
      await createCard({
        nome: cardForm.nome.trim(),
        numero: cardForm.numero,
        bandeira: cardForm.bandeira,
        limite: Number(cardForm.limite),
        vencimento: cardForm.vencimento,
        banco_id: cardForm.banco_id,
        cor: cardForm.cor,
      });
      setNewCardModal(false);
    } catch (e) {
      setCardError(e.message || "Erro ao criar cartao");
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteCard = async (card) => {
    if (!window.confirm(`Excluir o cartao "${card.nome}"? Todas as parcelas vinculadas serao removidas.`)) return;
    try { await deleteCard(card.id); } catch (e) { alert(e.message); }
  };

  const saveAccount = async () => {
    if (!accForm.nome || !accForm.tipo) return;
    try {
      if (editAcc) await updateAccount(editAcc.id, { ...accForm, saldo: Number(accForm.saldo) || 0 });
      else await createAccount({ ...accForm, saldo: Number(accForm.saldo) || 0 });
      setAccModal(false); setEditAcc(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteAccount = async (id) => {
    try { await deleteAccount(id); } catch (e) { console.error(e); }
  };

  const colors = ["#6366f1","#8b5cf6","#22c55e","#ef4444","#f97316","#3b82f6","#ec4899","#14b8a6"];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div><h1 className="text-white text-xl sm:text-2xl font-bold">Contas e Cartoes</h1><p className="text-white/40 text-sm mt-1">Gerencie suas contas bancarias e cartoes</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowBal(!showBalances)} className="text-white/40 hover:text-white/80 transition-colors p-2 rounded-lg hover:bg-white/[0.04]">{showBalances ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}</button>
          {activeTab === "cartoes" && <Btn data-testid="card-new-btn" onClick={openNewCard}><Plus className="w-4 h-4 inline mr-1" />Novo Cartao</Btn>}
          {activeTab === "contas" && <Btn onClick={() => { setEditAcc(null); setAccModal(true); }}><Plus className="w-4 h-4 inline mr-1" />Nova Conta</Btn>}
        </div>
      </div>

      <div className="flex gap-1 bg-[#111111] border border-white/[0.06] rounded-lg p-1 w-fit mb-6">
        {[{ key: "cartoes", label: "Cartoes", icon: CreditCard }, { key: "contas", label: "Contas Bancarias", icon: Landmark }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all ${activeTab === tab.key ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white/70"}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "cartoes" ? (
        <div className="space-y-6">
          {cards.map(card => {
            const cardInst = installments.filter(i => i.card_id === card.id);
            const unpaid = cardInst.filter(i => !i.pago);
            const paid = cardInst.filter(i => i.pago);
            const faturaAtual = unpaid.reduce((a, b) => a + b.valor_parcela, 0);
            const limiteUsado = faturaAtual;
            const limiteDisponivel = card.limite - limiteUsado;
            const usedPct = card.limite > 0 ? (limiteUsado / card.limite) * 100 : 0;
            const isExp = expandedCard === card.id;
            const isPaid = faturaAtual === 0;

            return (
              <div key={card.id} className="space-y-4">
                {/* Card Visual */}
                <div className={`bg-gradient-to-br ${card.cor} rounded-2xl p-5 sm:p-6 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white/70 text-sm">{card.nome}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-xs">{card.banco_nome || 'N/A'}</span>
                        <button onClick={() => { setEditCardModal(card); setEditLimite(card.limite); }} className="text-white/40 hover:text-white/80 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteCard(card)} className="text-red-300/60 hover:text-red-300 p-1" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <p className="text-white text-lg sm:text-xl font-mono tracking-widest mb-4 sm:mb-6">{card.numero}</p>
                    <div className="flex items-center justify-between">
                      <div><p className="text-white/50 text-xs">Vencimento</p><p className="text-white text-sm font-medium">Dia {card.vencimento}</p></div>
                      <p className="text-white font-semibold text-sm">{card.bandeira}</p>
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/50 text-sm">Fatura Atual</span>
                    <div className="flex items-center gap-3">
                      {isPaid ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium"><Check className="w-3.5 h-3.5" /> Paga</span>
                      ) : (
                        <button onClick={() => handlePayInvoice(card.id)} disabled={paying === card.id} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors disabled:opacity-50">
                          {paying === card.id ? "Pagando..." : "Pagar Fatura"}
                        </button>
                      )}
                      <span className="text-white text-sm font-medium">{showBalances ? fmt(faturaAtual) : "------"}</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/[0.06] rounded-full h-2 mb-2">
                    <div className={`h-2 rounded-full transition-all ${usedPct > 80 ? "bg-red-400" : "bg-purple-400"}`} style={{ width: `${Math.min(usedPct, 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/30 text-xs">Limite: {fmt(card.limite)}</span>
                    <span className="text-white/30 text-xs">Disponivel: {showBalances ? fmt(limiteDisponivel) : "------"}</span>
                  </div>

                  {/* Parcelas Toggle */}
                  <button onClick={() => setExpandedCard(isExp ? null : card.id)} className="flex items-center justify-between w-full pt-3 border-t border-white/[0.06] group">
                    <span className="text-white/50 text-sm group-hover:text-white/80 transition-colors">Parcelas ({cardInst.length})</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">Pendentes: {unpaid.length} | Pagas: {paid.length}</span>
                      {isExp ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                    </div>
                  </button>

                  {isExp && (
                    <div className="mt-3 space-y-1">
                      {cardInst.length === 0 ? (
                        <p className="text-white/30 text-sm text-center py-4">Nenhuma parcela</p>
                      ) : (
                        <>
                          {/* Pendentes */}
                          {unpaid.length > 0 && <p className="text-amber-400/60 text-[10px] uppercase tracking-wider font-medium pt-2 pb-1">Pendentes</p>}
                          {unpaid.map(inst => (
                            <div key={inst.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.02]">
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{inst.descricao}</p>
                                <p className="text-white/30 text-xs">{inst.parcela_atual}/{inst.total_parcelas} | {inst.data ? new Date(inst.data).toLocaleDateString("pt-BR") : ""}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <span className="text-white text-sm font-semibold whitespace-nowrap">{fmt(inst.valor_parcela)}</span>
                                <button onClick={() => handlePayInstallment(inst.id)} disabled={paying === inst.id} className="text-xs font-medium px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50">{paying === inst.id ? "..." : "Pagar"}</button>
                                <button onClick={() => handleDeleteInstallment(inst.id)} className="text-red-400/40 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          ))}
                          {/* Pagas */}
                          {paid.length > 0 && <p className="text-emerald-400/60 text-[10px] uppercase tracking-wider font-medium pt-3 pb-1">Pagas</p>}
                          {paid.map(inst => (
                            <div key={inst.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-500/5">
                              <div className="flex-1 min-w-0">
                                <p className="text-white/40 text-sm line-through truncate">{inst.descricao}</p>
                                <p className="text-white/20 text-xs">{inst.parcela_atual}/{inst.total_parcelas} | {inst.data ? new Date(inst.data).toLocaleDateString("pt-BR") : ""}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <span className="text-emerald-400/50 text-sm">{fmt(inst.valor_parcela)}</span>
                                <Check className="w-3.5 h-3.5 text-emerald-400/50" />
                                <button onClick={() => handleDeleteInstallment(inst.id)} className="text-red-400/30 hover:text-red-400 p-1" title="Remover parcela"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {cards.length === 0 && (
            <div className="text-center py-12 text-white/40">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="mb-4">Nenhum cartao cadastrado</p>
              <Btn onClick={openNewCard}><Plus className="w-4 h-4 inline mr-1" />Adicionar primeiro cartao</Btn>
              {accounts.length === 0 && (
                <p className="mt-4 text-amber-400/80 text-xs">Crie uma conta bancaria primeiro para vincular o cartao</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Bank Accounts */
        <div className="space-y-4">
          {accounts.map(account => {
            const linkedCards = cards.filter(c => c.banco_id === account.id);
            const linkedInvs = investments.filter(i => i.banco_id === account.id);
            const linkedFins = financings.filter(f => f.banco_id === account.id);
            return (
              <div key={account.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: account.cor + "20" }}>
                      <Landmark className="w-5 h-5" style={{ color: account.cor }} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{account.nome}</p>
                      <p className="text-white/40 text-xs">{account.tipo} {account.agencia && account.conta ? `| Ag ${account.agencia} Cc ${account.conta}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-white font-semibold text-lg">{showBalances ? fmt(account.saldo) : "------"}</p>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditAcc(account); setAccModal(true); }} className="text-white/30 hover:text-white/60 p-1.5 rounded-lg hover:bg-white/[0.04]"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteAccount(account.id)} className="text-red-400/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                {(linkedCards.length > 0 || linkedInvs.length > 0 || linkedFins.length > 0) && (
                  <div className="pt-4 border-t border-white/[0.06] space-y-3">
                    {linkedCards.length > 0 && (<div><p className="text-white/40 text-xs mb-2 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Cartoes</p><div className="flex flex-wrap gap-2">{linkedCards.map(c => (<span key={c.id} className="text-xs px-2 py-1 rounded-md bg-purple-500/10 text-purple-400">{c.nome}</span>))}</div></div>)}
                    {linkedInvs.length > 0 && (<div><p className="text-white/40 text-xs mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Investimentos</p><div className="flex flex-wrap gap-2">{linkedInvs.map(i => (<span key={i.id} className="text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400">{i.nome} | {fmt(i.valor)}</span>))}</div></div>)}
                    {linkedFins.length > 0 && (<div><p className="text-white/40 text-xs mb-2 flex items-center gap-1"><Home className="w-3 h-3" /> Financiamentos</p><div className="flex flex-wrap gap-2">{linkedFins.map(f => (<span key={f.id} className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-400">{f.nome} | {f.parcela_atual || 0}/{f.parcelas}</span>))}</div></div>)}
                  </div>
                )}
              </div>
            );
          })}
          {accounts.length === 0 && (<div className="text-center py-12 text-white/40"><Landmark className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Nenhuma conta cadastrada</p></div>)}
        </div>
      )}

      {/* New Card Modal */}
      <Dialog open={newCardModal} onOpenChange={(o) => !o && setNewCardModal(false)}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">Novo Cartao</DialogTitle></DialogHeader>
          {accounts.length === 0 ? (
            <div className="py-6 text-center space-y-3">
              <Landmark className="w-10 h-10 mx-auto text-amber-400/60" />
              <p className="text-amber-400 text-sm">Voce precisa ter pelo menos uma conta bancaria para cadastrar um cartao.</p>
              <Btn variant="secondary" onClick={() => { setNewCardModal(false); setActiveTab("contas"); setEditAcc(null); setAccModal(true); }}>
                Criar conta agora
              </Btn>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-2">
                <Field label="Apelido do cartao" required>
                  <Inp data-testid="card-form-nome" placeholder="Ex: Nubank Roxinho" value={cardForm.nome} onChange={e => setCardForm({ ...cardForm, nome: e.target.value })} autoFocus />
                </Field>

                <Field label="Conta bancaria vinculada" required>
                  <Sel data-testid="card-form-banco" value={cardForm.banco_id} onChange={e => setCardForm({ ...cardForm, banco_id: e.target.value })}>
                    <option value="">Selecione...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.nome} . {a.tipo}</option>)}
                  </Sel>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="4 ultimos digitos" required>
                    <Inp
                      data-testid="card-form-numero"
                      inputMode="numeric"
                      placeholder="1234"
                      maxLength={4}
                      value={cardForm.numero}
                      onChange={e => setCardForm({ ...cardForm, numero: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    />
                  </Field>
                  <Field label="Bandeira">
                    <Sel value={cardForm.bandeira} onChange={e => setCardForm({ ...cardForm, bandeira: e.target.value })}>
                      {BANDEIRAS.map(b => <option key={b} value={b}>{b}</option>)}
                    </Sel>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Vencimento (dia)" required>
                    <Inp
                      data-testid="card-form-vencimento"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="10"
                      value={cardForm.vencimento}
                      onChange={e => setCardForm({ ...cardForm, vencimento: e.target.value })}
                    />
                  </Field>
                  <Field label="Limite (R$)" required>
                    <MoneyInp data-testid="card-form-limite" value={cardForm.limite} onValueChange={v => setCardForm({ ...cardForm, limite: Number(v) || 0 })} />
                  </Field>
                </div>

                <Field label="Cor do cartao">
                  <div className="flex gap-2 flex-wrap">
                    {CARD_GRADIENTS.map(g => (
                      <button
                        key={g.v}
                        type="button"
                        onClick={() => setCardForm({ ...cardForm, cor: g.v })}
                        title={g.label}
                        className={`w-12 h-8 rounded-md bg-gradient-to-br ${g.v} transition-all ${cardForm.cor === g.v ? "ring-2 ring-white ring-offset-2 ring-offset-[#111111]" : ""}`}
                      />
                    ))}
                  </div>
                </Field>

                {cardError && <p className="text-red-400 text-xs" data-testid="card-form-error">{cardError}</p>}

                <p className="text-white/30 text-[11px]">
                  Por seguranca, salvamos apenas os 4 ultimos digitos. Numero completo nunca e armazenado.
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Btn variant="secondary" onClick={() => setNewCardModal(false)}>Cancelar</Btn>
                <Btn data-testid="card-form-save" onClick={saveNewCard} disabled={savingCard}>
                  {savingCard ? "Criando..." : "Criar Cartao"}
                </Btn>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Card Limite Modal */}
      <Dialog open={!!editCardModal} onOpenChange={() => setEditCardModal(null)}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Editar Cartao</DialogTitle></DialogHeader>
          {editCardModal && (
            <div className="space-y-4 py-2">
              <p className="text-white/50 text-sm">{editCardModal.nome} - {editCardModal.bandeira}</p>
              <Field label="Limite (R$)" required>
                <MoneyInp value={editLimite} onValueChange={v => setEditLimite(v)} />
              </Field>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Btn variant="secondary" onClick={() => setEditCardModal(null)}>Cancelar</Btn>
            <Btn onClick={handleSaveLimite}>Salvar</Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Modal */}
      <Dialog open={accModal} onOpenChange={() => { setAccModal(false); setEditAcc(null); }}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader><DialogTitle className="text-white">{editAcc ? "Editar" : "Nova"} Conta Bancaria</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nome" required><Inp placeholder="Ex: Nubank, Inter..." value={accForm.nome} onChange={e => setAccForm({...accForm, nome: e.target.value})} /></Field>
            <Field label="Tipo" required>
              <Sel value={accForm.tipo} onChange={e => setAccForm({...accForm, tipo: e.target.value})}>
                <option value="">Selecione...</option>
                <option value="Conta Corrente">Conta Corrente</option>
                <option value="Conta Poupanca">Conta Poupanca</option>
                <option value="Conta Salario">Conta Salario</option>
                <option value="Conta Digital">Conta Digital</option>
              </Sel>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Agencia"><Inp placeholder="0001" value={accForm.agencia} onChange={e => setAccForm({...accForm, agencia: e.target.value})} /></Field>
              <Field label="Conta"><Inp placeholder="12345-6" value={accForm.conta} onChange={e => setAccForm({...accForm, conta: e.target.value})} /></Field>
            </div>
            <Field label="Saldo Atual (R$)"><MoneyInp value={accForm.saldo} onValueChange={v => setAccForm({...accForm, saldo: v})} /></Field>
            <Field label="Cor">
              <div className="flex gap-2 flex-wrap">
                {colors.map(c => (<button key={c} onClick={() => setAccForm({...accForm, cor: c})} className={`w-8 h-8 rounded-lg transition-all ${accForm.cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#111111]" : ""}`} style={{ backgroundColor: c }} />))}
              </div>
            </Field>
          </div>
          <DialogFooter className="gap-2">
            <Btn variant="secondary" onClick={() => { setAccModal(false); setEditAcc(null); }}>Cancelar</Btn>
            <Btn onClick={saveAccount}>{editAcc ? "Salvar" : "Criar"}</Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
