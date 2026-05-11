/**
 * PlanejamentosSection - Notion-style markdown documents with embedded blocks:
 * - Orcamentos (with optional auto-linked Meta financeira)
 * - Lista de compras
 * - Comparador de precos
 * - Checklist
 *
 * Reuses: Field, Inp, MoneyInp, Sel, Btn, Toggle from shared/FormComponents,
 * Dialog from shadcn, useData() for state, fmt from formatters.
 */
import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useData } from "../../context/DataContext";
import { fmt } from "../../lib/formatters";
import { Field, Inp, MoneyInp, Sel, Btn, Toggle } from "../../components/shared/FormComponents";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import {
  Plus, Pencil, Trash2, NotebookPen, Target, ShoppingCart,
  Scale, CheckSquare, ArrowLeft, X,
} from "lucide-react";

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#ef4444"];

const newId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

const orcTotal = (orc) =>
  (orc.items || []).reduce(
    (s, it) => s + (Number(it.valor) || 0) * (Number(it.quantidade) || 1),
    0
  );

// ============== LIST VIEW ==============
function PlanList({ onOpen }) {
  const { planejamentos, createPlanejamento } = useData();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ titulo: "", cor: COLORS[0] });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      const novo = await createPlanejamento({ titulo: form.titulo.trim(), cor: form.cor });
      setModal(false);
      setForm({ titulo: "", cor: COLORS[0] });
      onOpen(novo.id);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="planejamentos-list" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-xl sm:text-2xl font-bold">Planejamentos</h1>
          <p className="text-white/40 text-sm mt-1">
            Documentos em Markdown com orcamentos, listas de compras e checklists vinculados as suas metas
          </p>
        </div>
        <Btn data-testid="plan-new-btn" onClick={() => setModal(true)}>
          <Plus className="w-4 h-4 inline mr-1" />Novo Planejamento
        </Btn>
      </div>

      {planejamentos.length === 0 ? (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-12 text-center">
          <NotebookPen className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">
            Nenhum planejamento ainda. Crie seu primeiro para organizar projetos com orcamentos e metas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {planejamentos.map((p) => {
            const totalOrc = (p.orcamentos || []).reduce((s, o) => s + orcTotal(o), 0);
            const hasGoal = !!p.goal_id;
            return (
              <button
                key={p.id}
                data-testid={`plan-card-${p.id}`}
                onClick={() => onOpen(p.id)}
                className="text-left bg-[#111111] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.16] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (p.cor || COLORS[0]) + "22" }}
                  >
                    <NotebookPen className="w-4 h-4" style={{ color: p.cor || COLORS[0] }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{p.titulo}</p>
                    <p className="text-white/30 text-xs">
                      {(p.orcamentos || []).length} orcamentos . {(p.checklists || []).length} listas
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <span className="text-white/40 text-xs">Total orcado</span>
                  <span className="text-white text-sm font-semibold">{fmt(totalOrc)}</span>
                </div>
                {hasGoal && (
                  <div className="mt-2 flex items-center gap-1.5 text-emerald-400 text-[10px]">
                    <Target className="w-3 h-3" /> Meta vinculada
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={modal} onOpenChange={(o) => !o && setModal(false)}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Novo Planejamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Titulo" required>
              <Inp
                data-testid="plan-form-title"
                placeholder="Ex: Casamento, Viagem para Italia, Reforma da casa"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                autoFocus
              />
            </Field>
            <Field label="Cor">
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, cor: c })}
                    className={`w-8 h-8 rounded-lg transition-all ${form.cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#111111]" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </Field>
          </div>
          <DialogFooter className="gap-2">
            <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn data-testid="plan-form-save" onClick={save} disabled={saving || !form.titulo.trim()}>
              {saving ? "Criando..." : "Criar"}
            </Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== ORCAMENTO MODAL ==============
function OrcamentoModal({ open, initial, categories, gastoRealizado, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  React.useEffect(() => { setForm(initial); }, [initial]);

  if (!form) return null;

  const updateItem = (idx, patch) => {
    const items = [...(form.items || [])];
    items[idx] = { ...items[idx], ...patch };
    setForm({ ...form, items });
  };
  const removeItem = (idx) => {
    const items = [...(form.items || [])];
    items.splice(idx, 1);
    setForm({ ...form, items });
  };
  const addItem = () => setForm({ ...form, items: [...(form.items || []), { nome: "", valor: 0, quantidade: 1 }] });

  const total = orcTotal(form);
  const realizado = gastoRealizado || 0;
  const pct = total > 0 ? Math.min((realizado / total) * 100, 999) : 0;
  const pctOver100 = pct > 100;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{form.id ? "Editar" : "Novo"} Orcamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Field label="Titulo do orcamento" required>
            <Inp
              data-testid="orc-form-titulo"
              placeholder="Ex: Festa, Buffet, Decoracao"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            />
          </Field>

          <Field label="Categoria vinculada (opcional)">
            <Sel
              data-testid="orc-form-categoria"
              value={form.categoria_id || ""}
              onChange={(e) => setForm({ ...form, categoria_id: e.target.value || null })}
            >
              <option value="">Sem categoria - nao acompanha gastos reais</option>
              {(categories || []).filter(c => c.tipo === "despesa" || c.tipo === "ambos").map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Sel>
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/60 text-xs">Itens do orcamento</label>
              <button onClick={addItem} className="text-white/50 hover:text-white text-xs flex items-center gap-1">
                <Plus className="w-3 h-3" /> Adicionar item
              </button>
            </div>
            <div className="space-y-2">
              {(form.items || []).length === 0 && (
                <p className="text-white/30 text-xs">Nenhum item ainda. Adicione itens para compor o orcamento.</p>
              )}
              {(form.items || []).map((it, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_120px_30px] gap-2 items-center">
                  <Inp
                    placeholder="Nome do item"
                    value={it.nome}
                    onChange={(e) => updateItem(idx, { nome: e.target.value })}
                  />
                  <Inp
                    type="number"
                    min="1"
                    placeholder="Qtd"
                    value={it.quantidade}
                    onChange={(e) => updateItem(idx, { quantidade: Number(e.target.value) || 1 })}
                  />
                  <MoneyInp
                    value={it.valor}
                    onValueChange={(v) => updateItem(idx, { valor: Number(v) || 0 })}
                  />
                  <button onClick={() => removeItem(idx)} className="text-red-400/60 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.04] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Total planejado</span>
              <span className="text-white text-base font-semibold">{fmt(total)}</span>
            </div>
            {form.categoria_id && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Realizado (mes atual)</span>
                  <span className={pctOver100 ? "text-red-400" : "text-emerald-400"}>
                    {fmt(realizado)} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pctOver100 ? "bg-red-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn
            data-testid="orc-form-save"
            onClick={() => onSave(form)}
            disabled={!form.titulo?.trim()}
          >
            Salvar
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============== DETAIL VIEW (tabs) ==============
function PlanDetail({ planId, onBack }) {
  const {
    planejamentos, categories, transactions,
    updatePlanejamento, deletePlanejamento, deletePlanGoal,
  } = useData();
  const plan = useMemo(() => planejamentos.find((p) => p.id === planId), [planejamentos, planId]);
  const [tab, setTab] = useState("notas");
  const [mdMode, setMdMode] = useState("edit"); // edit | preview | split
  const [draft, setDraft] = useState("");
  const [draftTitulo, setDraftTitulo] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [orcModal, setOrcModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteWithGoals, setDeleteWithGoals] = useState(false);

  // Compute realized spend per category for the CURRENT month
  const gastoPorCategoria = useMemo(() => {
    const map = {};
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    (transactions || []).forEach((tx) => {
      if (tx.tipo !== "despesa" || !tx.categoria_id) return;
      const d = new Date(tx.data);
      if (d.getFullYear() === y && d.getMonth() === m) {
        map[tx.categoria_id] = (map[tx.categoria_id] || 0) + (Number(tx.valor) || 0);
      }
    });
    return map;
  }, [transactions]);

  const catNameById = useMemo(() => {
    const m = {};
    (categories || []).forEach((c) => { m[c.id] = c.nome; });
    return m;
  }, [categories]);

  React.useEffect(() => {
    if (plan) {
      setDraft(plan.descricao_md || "");
      setDraftTitulo(plan.titulo || "");
    }
  }, [plan?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!plan) {
    return (
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-8 text-center">
        <p className="text-white/50 text-sm">Planejamento nao encontrado.</p>
        <Btn variant="secondary" onClick={onBack} className="mt-4">Voltar</Btn>
      </div>
    );
  }

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await updatePlanejamento(plan.id, { descricao_md: draft, titulo: draftTitulo });
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const saveOrcamento = async (orcForm) => {
    const orcs = [...(plan.orcamentos || [])];
    if (orcForm.id) {
      const idx = orcs.findIndex((o) => o.id === orcForm.id);
      if (idx >= 0) orcs[idx] = orcForm;
    } else {
      orcs.push({ ...orcForm, id: newId("orc") });
    }
    try {
      await updatePlanejamento(plan.id, { orcamentos: orcs });
      setOrcModal(null);
    } catch (e) {
      alert(e.message);
    }
  };

  const removeOrcamento = async (orc) => {
    if (!window.confirm(`Remover orcamento "${orc.titulo}"?`)) return;
    const orcs = (plan.orcamentos || []).filter((o) => o.id !== orc.id);
    try {
      await updatePlanejamento(plan.id, { orcamentos: orcs });
    } catch (e) {
      alert(e.message);
    }
  };

  const togglePlanMeta = async () => {
    if (plan.criar_meta) {
      // Turning OFF - ask if linked goal should be deleted too
      if (plan.goal_id) {
        const remove = window.confirm(
          "Desativar a meta vinculada. Tambem remover a meta de \"Metas\"?"
        );
        try {
          if (remove) {
            await deletePlanGoal(plan.id);
          } else {
            await updatePlanejamento(plan.id, { criar_meta: false });
          }
        } catch (e) {
          alert(e.message);
        }
      } else {
        try {
          await updatePlanejamento(plan.id, { criar_meta: false });
        } catch (e) {
          alert(e.message);
        }
      }
      return;
    }
    // Turning ON
    try {
      await updatePlanejamento(plan.id, { criar_meta: true });
    } catch (e) {
      alert(e.message);
    }
  };

  const updatePlanPrazo = async (prazo) => {
    try {
      await updatePlanejamento(plan.id, { prazo });
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeletePlan = async () => {
    try {
      await deletePlanejamento(plan.id, { deleteLinkedGoals: deleteWithGoals });
      setDeleteModal(false);
      onBack();
    } catch (e) {
      alert(e.message);
    }
  };

  // ---- LISTAS DE COMPRAS ----
  const addLista = () => {
    const listas = [...(plan.listas || []), { id: newId("lst"), titulo: "Nova lista", items: [] }];
    updatePlanejamento(plan.id, { listas });
  };
  const updateLista = (lstId, patch) => {
    const listas = (plan.listas || []).map((l) => (l.id === lstId ? { ...l, ...patch } : l));
    updatePlanejamento(plan.id, { listas });
  };
  const removeLista = (lstId) => {
    if (!window.confirm("Remover esta lista?")) return;
    updatePlanejamento(plan.id, { listas: (plan.listas || []).filter((l) => l.id !== lstId) });
  };

  // ---- COMPARADORES ----
  const addComparador = () => {
    const comparadores = [
      ...(plan.comparadores || []),
      { id: newId("cmp"), titulo: "Novo comparador", produto: "", opcoes: [] },
    ];
    updatePlanejamento(plan.id, { comparadores });
  };
  const updateComparador = (cmpId, patch) => {
    const comparadores = (plan.comparadores || []).map((c) => (c.id === cmpId ? { ...c, ...patch } : c));
    updatePlanejamento(plan.id, { comparadores });
  };
  const removeComparador = (cmpId) => {
    if (!window.confirm("Remover este comparador?")) return;
    updatePlanejamento(plan.id, { comparadores: (plan.comparadores || []).filter((c) => c.id !== cmpId) });
  };

  // ---- CHECKLISTS ----
  const addChecklist = () => {
    const checklists = [
      ...(plan.checklists || []),
      { id: newId("chk"), titulo: "Nova checklist", items: [] },
    ];
    updatePlanejamento(plan.id, { checklists });
  };
  const updateChecklist = (chkId, patch) => {
    const checklists = (plan.checklists || []).map((c) => (c.id === chkId ? { ...c, ...patch } : c));
    updatePlanejamento(plan.id, { checklists });
  };
  const removeChecklist = (chkId) => {
    if (!window.confirm("Remover esta checklist?")) return;
    updatePlanejamento(plan.id, { checklists: (plan.checklists || []).filter((c) => c.id !== chkId) });
  };

  const tabs = [
    { id: "notas", label: "Notas", icon: NotebookPen },
    { id: "orcamentos", label: "Orcamentos", icon: Target },
    { id: "compras", label: "Compras", icon: ShoppingCart },
    { id: "precos", label: "Precos", icon: Scale },
    { id: "tarefas", label: "Tarefas", icon: CheckSquare },
  ];

  return (
    <div data-testid="plan-detail" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          data-testid="plan-back-btn"
          className="text-white/50 hover:text-white/80 text-sm flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          data-testid="plan-delete-btn"
          onClick={() => setDeleteModal(true)}
          className="text-red-400/60 hover:text-red-400 text-sm flex items-center gap-1.5"
        >
          <Trash2 className="w-4 h-4" /> Excluir planejamento
        </button>
      </div>

      <div>
        <input
          data-testid="plan-titulo-input"
          value={draftTitulo}
          onChange={(e) => setDraftTitulo(e.target.value)}
          onBlur={saveNotes}
          className="w-full bg-transparent text-white text-2xl sm:text-3xl font-bold focus:outline-none focus:bg-white/[0.04] rounded px-2 -ml-2 py-1"
        />
      </div>

      {/* Plan-level Meta card */}
      <div className="bg-[#111111] border border-emerald-500/20 rounded-xl p-4 sm:p-5">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Meta deste planejamento</p>
              <p className="text-white/40 text-xs">
                Soma de {(plan.orcamentos || []).length} orcamento{(plan.orcamentos || []).length === 1 ? "" : "s"}:
                {" "}<span className="text-white/70 font-medium">{fmt((plan.orcamentos || []).reduce((s, o) => s + orcTotal(o), 0))}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {plan.criar_meta && (
              <input
                type="date"
                data-testid="plan-meta-prazo"
                value={plan.prazo || ""}
                onChange={(e) => updatePlanPrazo(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-white/80 text-xs [color-scheme:dark]"
                placeholder="Prazo"
              />
            )}
            <Toggle on={!!plan.criar_meta} onChange={togglePlanMeta} />
          </div>
        </div>
        <p className="text-white/40 text-xs mt-3">
          {plan.criar_meta
            ? plan.goal_id
              ? "Esta meta esta vinculada e aparece em \"Metas\". Alteracoes em qualquer orcamento sao sincronizadas automaticamente."
              : "Ativando... a meta sera criada em \"Metas\" no proximo save."
            : "Ative para criar 1 meta em \"Metas\" com o valor total deste planejamento."}
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap bg-[#0f0f0f] border border-white/[0.06] rounded-lg p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            data-testid={`plan-tab-${id}`}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
              tab === id ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ===== TAB: NOTAS ===== */}
      {tab === "notas" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-white/40 text-xs">
              Markdown: titulos com #, listas com -, negrito com **texto**. Salva automaticamente ao sair do campo.
            </p>
            <div className="flex gap-1 bg-[#0f0f0f] border border-white/[0.06] rounded-md p-0.5">
              {[
                { id: "edit", label: "Editar" },
                { id: "split", label: "Lado a lado" },
                { id: "preview", label: "Visualizar" },
              ].map((m) => (
                <button
                  key={m.id}
                  data-testid={`md-mode-${m.id}`}
                  onClick={() => setMdMode(m.id)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    mdMode === m.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`grid gap-3 ${mdMode === "split" ? "md:grid-cols-2" : "grid-cols-1"}`}>
            {mdMode !== "preview" && (
              <textarea
                data-testid="plan-md-editor"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={saveNotes}
                placeholder={`# ${plan.titulo}\n\n## Visao geral\n- Item 1\n- Item 2\n\n## Detalhes\nDescreva aqui...`}
                className="w-full min-h-[400px] bg-[#0f0f0f] border border-white/[0.06] rounded-lg p-4 text-white text-sm font-mono focus:outline-none focus:border-white/20 leading-relaxed"
              />
            )}
            {mdMode !== "edit" && (
              <div
                data-testid="plan-md-preview"
                className="min-h-[400px] bg-[#0f0f0f] border border-white/[0.06] rounded-lg p-4 overflow-auto text-sm text-white/80 leading-relaxed markdown-preview"
              >
                {draft.trim() ? (
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...p }) => <h1 className="text-white text-xl font-bold mt-3 mb-2" {...p} />,
                      h2: ({ node, ...p }) => <h2 className="text-white text-lg font-semibold mt-3 mb-2" {...p} />,
                      h3: ({ node, ...p }) => <h3 className="text-white text-base font-semibold mt-2 mb-1.5" {...p} />,
                      p: ({ node, ...p }) => <p className="my-2" {...p} />,
                      ul: ({ node, ...p }) => <ul className="list-disc pl-5 my-2 space-y-1" {...p} />,
                      ol: ({ node, ...p }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...p} />,
                      li: ({ node, ...p }) => <li className="text-white/80" {...p} />,
                      strong: ({ node, ...p }) => <strong className="text-white font-semibold" {...p} />,
                      em: ({ node, ...p }) => <em className="text-white/90 italic" {...p} />,
                      a: ({ node, ...p }) => <a className="text-indigo-400 hover:text-indigo-300 underline" target="_blank" rel="noopener noreferrer" {...p} />,
                      code: ({ node, inline, ...p }) =>
                        inline ? (
                          <code className="text-emerald-300 bg-white/[0.06] px-1 py-0.5 rounded text-xs" {...p} />
                        ) : (
                          <code className="block text-emerald-300 bg-white/[0.04] p-3 rounded my-2 overflow-x-auto text-xs font-mono" {...p} />
                        ),
                      blockquote: ({ node, ...p }) => (
                        <blockquote className="border-l-2 border-white/20 pl-3 text-white/60 italic my-2" {...p} />
                      ),
                      hr: () => <hr className="border-white/10 my-3" />,
                      table: ({ node, ...p }) => <table className="border border-white/10 my-2 text-xs" {...p} />,
                      th: ({ node, ...p }) => <th className="border border-white/10 px-2 py-1 bg-white/[0.04] text-white" {...p} />,
                      td: ({ node, ...p }) => <td className="border border-white/10 px-2 py-1 text-white/70" {...p} />,
                    }}
                  >
                    {draft}
                  </ReactMarkdown>
                ) : (
                  <p className="text-white/30 text-sm italic">Nada para visualizar ainda</p>
                )}
              </div>
            )}
          </div>
          {savingNotes && <p className="text-white/40 text-xs">Salvando...</p>}
        </div>
      )}

      {/* ===== TAB: ORCAMENTOS ===== */}
      {tab === "orcamentos" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Btn data-testid="orc-new-btn" onClick={() => setOrcModal({ titulo: "", items: [] })}>
              <Plus className="w-4 h-4 inline mr-1" /> Novo orcamento
            </Btn>
          </div>
          {(plan.orcamentos || []).length === 0 ? (
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-8 text-center">
              <Target className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/50 text-sm">Nenhum orcamento ainda. Crie um para somar itens e gerar uma meta automatica.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(plan.orcamentos || []).map((orc) => {
                const total = orcTotal(orc);
                const realizado = orc.categoria_id ? (gastoPorCategoria[orc.categoria_id] || 0) : null;
                const pct = realizado !== null && total > 0 ? (realizado / total) * 100 : 0;
                const pctOver = pct > 100;
                return (
                  <div key={orc.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-medium text-sm">{orc.titulo}</p>
                        <p className="text-white/40 text-xs">
                          {(orc.items || []).length} itens
                          {orc.categoria_id && catNameById[orc.categoria_id] && (
                            <> . <span className="text-white/60">{catNameById[orc.categoria_id]}</span></>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setOrcModal(orc)} className="text-white/40 hover:text-white/80">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeOrcamento(orc)} className="text-red-400/60 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-white/40 text-xs">Planejado</span>
                      <span className="text-white font-semibold">{fmt(total)}</span>
                    </div>
                    {realizado !== null && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/40">Realizado (mes atual)</span>
                          <span className={pctOver ? "text-red-400" : "text-emerald-400"}>
                            {fmt(realizado)} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pctOver ? "bg-red-400" : "bg-emerald-400"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <OrcamentoModal
            open={!!orcModal}
            initial={orcModal}
            categories={categories || []}
            gastoRealizado={orcModal?.categoria_id ? (gastoPorCategoria[orcModal.categoria_id] || 0) : 0}
            onClose={() => setOrcModal(null)}
            onSave={saveOrcamento}
          />
        </div>
      )}

      {/* ===== TAB: COMPRAS ===== */}
      {tab === "compras" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Btn data-testid="lst-new-btn" onClick={addLista}><Plus className="w-4 h-4 inline mr-1" /> Nova lista</Btn>
          </div>
          {(plan.listas || []).length === 0 && (
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-8 text-center">
              <ShoppingCart className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/50 text-sm">Nenhuma lista. Crie uma para anotar o que precisa comprar.</p>
            </div>
          )}
          {(plan.listas || []).map((lst) => (
            <div key={lst.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <input
                  value={lst.titulo}
                  onChange={(e) => updateLista(lst.id, { titulo: e.target.value })}
                  className="bg-transparent text-white font-medium text-sm flex-1 focus:outline-none focus:bg-white/[0.04] rounded px-2 py-1 -ml-2"
                />
                <button onClick={() => removeLista(lst.id)} className="text-red-400/60 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {(lst.items || []).map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!it.comprado}
                      onChange={(e) => {
                        const items = [...lst.items];
                        items[idx] = { ...it, comprado: e.target.checked };
                        updateLista(lst.id, { items });
                      }}
                      className="accent-emerald-500"
                    />
                    <input
                      value={it.nome}
                      onChange={(e) => {
                        const items = [...lst.items];
                        items[idx] = { ...it, nome: e.target.value };
                        updateLista(lst.id, { items });
                      }}
                      placeholder="Item"
                      className={`flex-1 bg-transparent text-sm focus:outline-none ${it.comprado ? "text-white/30 line-through" : "text-white/80"}`}
                    />
                    <Inp
                      type="number"
                      placeholder="Qtd"
                      value={it.quantidade || 1}
                      onChange={(e) => {
                        const items = [...lst.items];
                        items[idx] = { ...it, quantidade: Number(e.target.value) || 1 };
                        updateLista(lst.id, { items });
                      }}
                      className="!w-20"
                    />
                    <MoneyInp
                      value={it.preco || 0}
                      onValueChange={(v) => {
                        const items = [...lst.items];
                        items[idx] = { ...it, preco: Number(v) || 0 };
                        updateLista(lst.id, { items });
                      }}
                      className="!w-28"
                    />
                    <button
                      onClick={() => {
                        const items = [...lst.items];
                        items.splice(idx, 1);
                        updateLista(lst.id, { items });
                      }}
                      className="text-red-400/60 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateLista(lst.id, { items: [...(lst.items || []), { nome: "", quantidade: 1, preco: 0, comprado: false }] })}
                  className="text-white/50 hover:text-white text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Adicionar item
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== TAB: PRECOS (COMPARADOR) ===== */}
      {tab === "precos" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Btn data-testid="cmp-new-btn" onClick={addComparador}><Plus className="w-4 h-4 inline mr-1" /> Novo comparador</Btn>
          </div>
          {(plan.comparadores || []).length === 0 && (
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-8 text-center">
              <Scale className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/50 text-sm">Nenhum comparador. Compare precos do mesmo item em lojas diferentes.</p>
            </div>
          )}
          {(plan.comparadores || []).map((cmp) => {
            const minPreco = (cmp.opcoes || []).filter(o => o.preco > 0).reduce((m, o) => Math.min(m, o.preco), Infinity);
            return (
              <div key={cmp.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <input
                    value={cmp.titulo}
                    onChange={(e) => updateComparador(cmp.id, { titulo: e.target.value })}
                    className="bg-transparent text-white font-medium text-sm flex-1 focus:outline-none focus:bg-white/[0.04] rounded px-2 py-1 -ml-2"
                  />
                  <button onClick={() => removeComparador(cmp.id)} className="text-red-400/60 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Inp
                  placeholder="Produto comparado"
                  value={cmp.produto}
                  onChange={(e) => updateComparador(cmp.id, { produto: e.target.value })}
                  className="mb-3"
                />
                <div className="space-y-2">
                  {(cmp.opcoes || []).map((op, idx) => {
                    const isBest = op.preco > 0 && op.preco === minPreco;
                    return (
                      <div key={idx} className={`grid grid-cols-[1fr_120px_1fr_30px] gap-2 items-center p-2 rounded-md ${isBest ? "bg-emerald-500/10 border border-emerald-500/30" : ""}`}>
                        <Inp
                          placeholder="Loja"
                          value={op.loja}
                          onChange={(e) => {
                            const opcoes = [...cmp.opcoes];
                            opcoes[idx] = { ...op, loja: e.target.value };
                            updateComparador(cmp.id, { opcoes });
                          }}
                        />
                        <MoneyInp
                          value={op.preco}
                          onValueChange={(v) => {
                            const opcoes = [...cmp.opcoes];
                            opcoes[idx] = { ...op, preco: Number(v) || 0 };
                            updateComparador(cmp.id, { opcoes });
                          }}
                        />
                        <Inp
                          placeholder="Link (opcional)"
                          value={op.link || ""}
                          onChange={(e) => {
                            const opcoes = [...cmp.opcoes];
                            opcoes[idx] = { ...op, link: e.target.value };
                            updateComparador(cmp.id, { opcoes });
                          }}
                        />
                        <button
                          onClick={() => {
                            const opcoes = [...cmp.opcoes];
                            opcoes.splice(idx, 1);
                            updateComparador(cmp.id, { opcoes });
                          }}
                          className="text-red-400/60 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => updateComparador(cmp.id, { opcoes: [...(cmp.opcoes || []), { loja: "", preco: 0, link: "" }] })}
                    className="text-white/50 hover:text-white text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar loja
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== TAB: TAREFAS (CHECKLIST) ===== */}
      {tab === "tarefas" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Btn data-testid="chk-new-btn" onClick={addChecklist}><Plus className="w-4 h-4 inline mr-1" /> Nova checklist</Btn>
          </div>
          {(plan.checklists || []).length === 0 && (
            <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-8 text-center">
              <CheckSquare className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/50 text-sm">Nenhuma checklist. Crie uma para organizar tarefas.</p>
            </div>
          )}
          {(plan.checklists || []).map((chk) => {
            const done = (chk.items || []).filter((i) => i.feito).length;
            const total = (chk.items || []).length;
            return (
              <div key={chk.id} className="bg-[#111111] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <input
                    value={chk.titulo}
                    onChange={(e) => updateChecklist(chk.id, { titulo: e.target.value })}
                    className="bg-transparent text-white font-medium text-sm flex-1 focus:outline-none focus:bg-white/[0.04] rounded px-2 py-1 -ml-2"
                  />
                  <span className="text-white/40 text-xs">{done}/{total}</span>
                  <button onClick={() => removeChecklist(chk.id)} className="text-red-400/60 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {(chk.items || []).map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!it.feito}
                        onChange={(e) => {
                          const items = [...chk.items];
                          items[idx] = { ...it, feito: e.target.checked };
                          updateChecklist(chk.id, { items });
                        }}
                        className="accent-emerald-500"
                      />
                      <input
                        value={it.texto}
                        onChange={(e) => {
                          const items = [...chk.items];
                          items[idx] = { ...it, texto: e.target.value };
                          updateChecklist(chk.id, { items });
                        }}
                        placeholder="Tarefa"
                        className={`flex-1 bg-transparent text-sm focus:outline-none ${it.feito ? "text-white/30 line-through" : "text-white/80"}`}
                      />
                      <button
                        onClick={() => {
                          const items = [...chk.items];
                          items.splice(idx, 1);
                          updateChecklist(chk.id, { items });
                        }}
                        className="text-red-400/60 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateChecklist(chk.id, { items: [...(chk.items || []), { texto: "", feito: false }] })}
                    className="text-white/50 hover:text-white text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar tarefa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DELETE PLAN DIALOG */}
      <Dialog open={deleteModal} onOpenChange={(o) => !o && setDeleteModal(false)}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Excluir planejamento?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-white/60 text-sm">
              Esta acao remove o planejamento "{plan.titulo}" e todos os seus orcamentos, listas e tarefas.
            </p>
            {plan.goal_id && (
              <label className="flex items-start gap-2 cursor-pointer bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <input
                  type="checkbox"
                  data-testid="plan-delete-with-goals"
                  checked={deleteWithGoals}
                  onChange={(e) => setDeleteWithGoals(e.target.checked)}
                  className="mt-0.5 accent-amber-500"
                />
                <span className="text-amber-400/90 text-xs">
                  Tambem remover a meta vinculada de "Metas"
                </span>
              </label>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Btn variant="secondary" onClick={() => setDeleteModal(false)}>Cancelar</Btn>
            <Btn data-testid="plan-delete-confirm" onClick={handleDeletePlan} className="!bg-red-500 hover:!bg-red-600 text-white">
              Excluir
            </Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== MAIN EXPORT ==============
export default function PlanejamentosSection() {
  const [openId, setOpenId] = useState(null);
  return openId ? (
    <PlanDetail planId={openId} onBack={() => setOpenId(null)} />
  ) : (
    <PlanList onOpen={setOpenId} />
  );
}
