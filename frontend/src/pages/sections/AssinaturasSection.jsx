/**
 * AssinaturasSection - manage recurring subscriptions.
 *
 * Reuses Field/Inp/MoneyInp/Sel/Btn/Toggle, Dialog, useData(), fmt/fmtCompact.
 */
import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../../context/DataContext";
import api from "../../services/api";
import { fmt, fmtCompact } from "../../lib/formatters";
import { Field, Inp, MoneyInp, Sel, Btn, Toggle } from "../../components/shared/FormComponents";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import {
  Plus, Pencil, Trash2, Repeat, Search, AlertTriangle, Zap, Crown,
  TrendingUp, Calendar, ArrowRight, Bell, Sparkles, Copy, Activity,
} from "lucide-react";

const RECORRENCIAS = [
  { v: "mensal", label: "Mensal" },
  { v: "anual", label: "Anual" },
  { v: "semanal", label: "Semanal" },
];
const METODOS = ["dinheiro", "cartao", "pix", "debito", "boleto"];
const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#ef4444", "#14b8a6"];

const STATUS_COLORS = {
  ativa: "text-emerald-400 bg-emerald-500/10",
  inativa: "text-white/40 bg-white/[0.04]",
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function StatCard({ title, value, icon: Icon, iconColor, subtitle }) {
  return (
    <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/50 text-xs sm:text-sm font-medium">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-white text-lg sm:text-2xl font-bold mb-1">{value}</div>
      {subtitle && <p className="text-white/40 text-xs">{subtitle}</p>}
    </div>
  );
}

function AlertItem({ alert }) {
  const styles = {
    warning: { bg: "bg-amber-500/5", border: "border-amber-500/20", text: "text-amber-400", icon: AlertTriangle },
    info: { bg: "bg-blue-500/5", border: "border-blue-500/20", text: "text-blue-400", icon: Sparkles },
    error: { bg: "bg-red-500/5", border: "border-red-500/20", text: "text-red-400", icon: AlertTriangle },
  };
  const s = styles[alert.severity] || styles.info;
  const Icon = s.icon;
  return (
    <div className={`flex items-start gap-2 ${s.bg} border ${s.border} rounded-lg p-3`}>
      <Icon className={`w-4 h-4 mt-0.5 ${s.text} flex-shrink-0`} />
      <p className={`text-xs ${s.text}`}>{alert.message}</p>
    </div>
  );
}

function SubscriptionModal({ open, initial, categories, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  useEffect(() => { setForm(initial); }, [initial]);
  if (!form) return null;

  const isEdit = !!form.id;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{isEdit ? "Editar" : "Nova"} Assinatura</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Nome" required>
            <Inp
              data-testid="sub-form-nome"
              placeholder="Netflix, Spotify, Academia..."
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor" required>
              <MoneyInp
                data-testid="sub-form-valor"
                value={form.valor}
                onValueChange={(v) => setForm({ ...form, valor: Number(v) || 0 })}
              />
            </Field>
            <Field label="Recorrencia">
              <Sel value={form.recorrencia} onChange={(e) => setForm({ ...form, recorrencia: e.target.value })}>
                {RECORRENCIAS.map(r => <option key={r.v} value={r.v}>{r.label}</option>)}
              </Sel>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={form.recorrencia === "semanal" ? "Dia da semana" : "Dia da cobranca"}>
              {form.recorrencia === "semanal" ? (
                <Sel value={form.dia_cobranca} onChange={(e) => setForm({ ...form, dia_cobranca: Number(e.target.value) })}>
                  {WEEKDAYS.map((w, i) => <option key={i} value={i}>{w}</option>)}
                </Sel>
              ) : (
                <Inp
                  type="number" min="1" max="28"
                  value={form.dia_cobranca}
                  onChange={(e) => setForm({ ...form, dia_cobranca: Number(e.target.value) || 1 })}
                />
              )}
            </Field>
            {form.recorrencia === "anual" && (
              <Field label="Mes da cobranca">
                <Sel value={form.mes_cobranca || 1} onChange={(e) => setForm({ ...form, mes_cobranca: Number(e.target.value) })}>
                  {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </Sel>
              </Field>
            )}
            {form.recorrencia !== "anual" && (
              <Field label="Forma de pagamento">
                <Sel value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
                  {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                </Sel>
              </Field>
            )}
          </div>

          {form.recorrencia === "anual" && (
            <Field label="Forma de pagamento">
              <Sel value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
                {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
              </Sel>
            </Field>
          )}

          <Field label="Categoria">
            <Sel
              value={form.categoria_id || ""}
              onChange={(e) => {
                const cat = categories.find(c => c.id === e.target.value);
                setForm({
                  ...form,
                  categoria_id: e.target.value || null,
                  categoria: cat?.nome || "Outros",
                  cor: cat?.cor || form.cor,
                });
              }}
            >
              <option value="">Sem categoria</option>
              {categories.filter(c => c.tipo === "despesa" || c.tipo === "ambos").map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Sel>
          </Field>

          <Field label="Cor">
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, cor: c })}
                  className={`w-7 h-7 rounded-lg transition-all ${form.cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#111111]" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>

          <Field label="Observacoes">
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Notas, login da conta, etc."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.16] min-h-[60px]"
            />
          </Field>

          <div className="flex items-center justify-between bg-white/[0.02] rounded-lg p-3">
            <div>
              <p className="text-white text-sm font-medium">Status</p>
              <p className="text-white/40 text-xs">{form.status === "ativa" ? "Ativa - sera contabilizada" : "Inativa - pausada"}</p>
            </div>
            <Toggle on={form.status === "ativa"} onChange={() => setForm({ ...form, status: form.status === "ativa" ? "inativa" : "ativa" })} />
          </div>

          <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
            <div>
              <p className="text-emerald-400 text-sm font-medium">Criar transacao automatica</p>
              <p className="text-white/40 text-xs">Gera uma despesa no app a cada cobranca</p>
            </div>
            <Toggle on={!!form.auto_create_transaction} onChange={() => setForm({ ...form, auto_create_transaction: !form.auto_create_transaction })} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn data-testid="sub-form-save" onClick={() => onSave(form)} disabled={!form.nome?.trim() || !form.valor}>
            {isEdit ? "Salvar" : "Criar"}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionCard({ sub, onEdit, onDelete, onChargeNow, onToggleStatus }) {
  const next = sub.next_billing_date ? new Date(sub.next_billing_date + "T00:00:00") : null;
  const daysUntil = sub.days_until_next;
  const monthly = sub.monthly_cost || 0;
  const yearly = sub.yearly_cost || 0;
  const recLabel = { mensal: "Mensal", anual: "Anual", semanal: "Semanal" }[sub.recorrencia] || sub.recorrencia;

  return (
    <div data-testid={`sub-card-${sub.id}`} className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.16] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (sub.cor || "#6366f1") + "22" }}>
            <Repeat className="w-5 h-5" style={{ color: sub.cor || "#6366f1" }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white font-medium text-sm truncate">{sub.nome}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[sub.status]}`}>{sub.status}</span>
            </div>
            <p className="text-white/40 text-xs mt-0.5">{sub.categoria} . {recLabel}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(sub)} className="text-white/40 hover:text-white/80 p-1" title="Editar">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(sub)} className="text-red-400/60 hover:text-red-400 p-1" title="Excluir">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between mb-3 pb-3 border-b border-white/[0.06]">
        <div>
          <p className="text-white text-lg font-bold leading-none">{fmt(sub.valor)}</p>
          <p className="text-white/30 text-[10px] mt-1">{fmt(monthly)}/mes . {fmt(yearly)}/ano</p>
        </div>
        {sub.status === "ativa" && next && (
          <div className="text-right">
            <p className="text-white/40 text-[10px]">Proxima cobranca</p>
            <p className="text-white text-xs font-medium">
              {next.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </p>
            {daysUntil !== null && daysUntil <= 7 && (
              <p className={`text-[10px] mt-0.5 ${daysUntil <= 3 ? "text-amber-400" : "text-white/40"}`}>
                em {daysUntil} dia{daysUntil === 1 ? "" : "s"}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {sub.status === "ativa" && (
          <button
            data-testid={`sub-charge-${sub.id}`}
            onClick={() => onChargeNow(sub)}
            className="flex-1 text-[11px] bg-white/[0.04] hover:bg-white/[0.08] text-white/70 rounded-md py-1.5 transition-colors flex items-center justify-center gap-1"
            title="Criar transacao agora"
          >
            <Zap className="w-3 h-3" /> Cobrar agora
          </button>
        )}
        <button
          onClick={() => onToggleStatus(sub)}
          className="flex-1 text-[11px] bg-white/[0.04] hover:bg-white/[0.08] text-white/70 rounded-md py-1.5 transition-colors"
        >
          {sub.status === "ativa" ? "Pausar" : "Reativar"}
        </button>
      </div>
    </div>
  );
}

export default function AssinaturasSection() {
  const { subscriptions, categories, createSubscription, updateSubscription, deleteSubscription, chargeSubscriptionNow, reloadSubscriptions } = useData();
  const [stats, setStats] = useState(null);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("next");

  useEffect(() => { api.subscriptions.getStats().then(setStats).catch(() => {}); }, [subscriptions]);

  const filtered = useMemo(() => {
    const t = (search || "").trim().toLowerCase();
    let list = subscriptions.filter(s => {
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (filterCat !== "all" && s.categoria !== filterCat) return false;
      if (t && !(s.nome || "").toLowerCase().includes(t)) return false;
      return true;
    });
    list = [...list];
    if (sortBy === "valor") {
      list.sort((a, b) => (b.monthly_cost || 0) - (a.monthly_cost || 0));
    } else if (sortBy === "next") {
      list.sort((a, b) => {
        const da = a.days_until_next ?? 9999;
        const db = b.days_until_next ?? 9999;
        return da - db;
      });
    } else if (sortBy === "nome") {
      list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    }
    return list;
  }, [subscriptions, search, filterCat, filterStatus, sortBy]);

  const uniqueCats = useMemo(() => {
    const s = new Set();
    subscriptions.forEach(x => x.categoria && s.add(x.categoria));
    return Array.from(s);
  }, [subscriptions]);

  const openNew = () => setModal({
    nome: "", valor: 0, recorrencia: "mensal", dia_cobranca: 1,
    metodo: "cartao", observacoes: "", status: "ativa", cor: "#6366f1",
    categoria: "Outros", categoria_id: null, auto_create_transaction: false,
  });

  const save = async (form) => {
    try {
      const payload = { ...form };
      if (form.id) {
        await updateSubscription(form.id, payload);
      } else {
        await createSubscription(payload);
      }
      setModal(null);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (sub) => {
    if (!window.confirm(`Excluir a assinatura "${sub.nome}"?`)) return;
    try { await deleteSubscription(sub.id); } catch (e) { alert(e.message); }
  };

  const handleCharge = async (sub) => {
    if (!window.confirm(`Criar transacao de R$ ${(sub.valor || 0).toFixed(2)} para "${sub.nome}" agora?`)) return;
    try { await chargeSubscriptionNow(sub.id); }
    catch (e) { alert(e.message); }
  };

  const handleToggleStatus = async (sub) => {
    try {
      await updateSubscription(sub.id, { status: sub.status === "ativa" ? "inativa" : "ativa" });
    } catch (e) { alert(e.message); }
  };

  return (
    <div data-testid="assinaturas-section" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-xl sm:text-2xl font-bold">Assinaturas</h1>
          <p className="text-white/40 text-sm mt-1">Gerencie seus gastos recorrentes mensais e anuais</p>
        </div>
        <Btn data-testid="sub-new-btn" onClick={openNew}>
          <Plus className="w-4 h-4 inline mr-1" /> Nova Assinatura
        </Btn>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total mensal"
          value={fmt(stats?.total_monthly || 0)}
          icon={Repeat}
          iconColor="bg-indigo-500/20 text-indigo-400"
          subtitle={`${stats?.count_active || 0} ativa${(stats?.count_active || 0) === 1 ? "" : "s"}`}
        />
        <StatCard
          title="Total anual"
          value={fmt(stats?.total_yearly || 0)}
          icon={Calendar}
          iconColor="bg-blue-500/20 text-blue-400"
          subtitle={stats?.forecast_next_month ? `Previsto proximo mes: ${fmt(stats.forecast_next_month)}` : ""}
        />
        <StatCard
          title="Top categoria"
          value={stats?.top_categoria?.nome || "-"}
          icon={Crown}
          iconColor="bg-amber-500/20 text-amber-400"
          subtitle={stats?.top_categoria ? `${fmt(stats.top_categoria.valor)}/mes` : ""}
        />
        <StatCard
          title="Impacto pequenas"
          value={fmt(stats?.tiny_annual_impact || 0)}
          icon={TrendingUp}
          iconColor="bg-emerald-500/20 text-emerald-400"
          subtitle={`${stats?.tiny_count || 0} sub${(stats?.tiny_count || 0) === 1 ? "" : "s"} < R$ 30/mes`}
        />
      </div>

      {/* Alerts + Upcoming + Top recurring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Alerts */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-white/60" />
            <h3 className="text-white font-semibold text-sm">Alertas</h3>
          </div>
          {(!stats?.alerts || stats.alerts.length === 0) ? (
            <p className="text-white/40 text-xs py-4 text-center">Sem alertas no momento</p>
          ) : (
            <div className="space-y-2">
              {stats.alerts.slice(0, 6).map((a, i) => <AlertItem key={i} alert={a} />)}
            </div>
          )}
          {stats?.duplicates && stats.duplicates.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 text-amber-400 text-xs mb-2">
                <Copy className="w-3.5 h-3.5" />
                <span className="font-medium">{stats.duplicates.length} possivel duplicada{stats.duplicates.length === 1 ? "" : "s"}</span>
              </div>
              {stats.duplicates.slice(0, 3).map((d, i) => (
                <p key={i} className="text-white/50 text-xs">"{d.nome}" aparece mais de uma vez</p>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-white/60" />
            <h3 className="text-white font-semibold text-sm">Proximas cobrancas</h3>
          </div>
          {(!stats?.upcoming || stats.upcoming.length === 0) ? (
            <p className="text-white/40 text-xs py-4 text-center">Nenhuma cobranca nos proximos 30 dias</p>
          ) : (
            <div className="space-y-2">
              {stats.upcoming.slice(0, 6).map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: u.cor || "#6366f1" }} />
                    <p className="text-white text-xs truncate">{u.nome}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white text-xs font-medium">{fmt(u.valor)}</p>
                    <p className="text-white/40 text-[10px]">
                      {u.days_until === 0 ? "hoje" : u.days_until === 1 ? "amanha" : `em ${u.days_until}d`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top recurring */}
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-white/60" />
            <h3 className="text-white font-semibold text-sm">Top gastos recorrentes</h3>
          </div>
          {(!stats?.top_recurring || stats.top_recurring.length === 0) ? (
            <p className="text-white/40 text-xs py-4 text-center">Sem assinaturas ainda</p>
          ) : (
            <div className="space-y-2">
              {stats.top_recurring.map((t) => {
                const total = stats.total_monthly || 1;
                const pct = ((t.monthly_cost / total) * 100).toFixed(0);
                return (
                  <div key={t.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white truncate flex-1 mr-2">{t.nome}</span>
                      <span className="text-white/50 flex-shrink-0">{fmt(t.monthly_cost)}/mes</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: t.cor || "#6366f1" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-3 sm:p-4">
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              data-testid="sub-search"
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.16]"
            />
          </div>
          <Sel value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="!w-auto min-w-[120px]">
            <option value="all">Todos status</option>
            <option value="ativa">Ativas</option>
            <option value="inativa">Inativas</option>
          </Sel>
          <Sel value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="!w-auto min-w-[140px]">
            <option value="all">Todas categorias</option>
            {uniqueCats.map(c => <option key={c} value={c}>{c}</option>)}
          </Sel>
          <Sel value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="!w-auto min-w-[180px]">
            <option value="next">Ordenar: proxima cobranca</option>
            <option value="valor">Ordenar: maior valor</option>
            <option value="nome">Ordenar: nome</option>
          </Sel>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-12 text-center">
          <Repeat className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">
            {subscriptions.length === 0
              ? "Nenhuma assinatura ainda. Adicione sua primeira para acompanhar gastos recorrentes."
              : "Nenhuma assinatura corresponde aos filtros."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((s) => (
            <SubscriptionCard
              key={s.id}
              sub={s}
              onEdit={(x) => setModal(x)}
              onDelete={handleDelete}
              onChargeNow={handleCharge}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      <SubscriptionModal
        open={!!modal}
        initial={modal}
        categories={categories || []}
        onClose={() => setModal(null)}
        onSave={save}
      />
    </div>
  );
}
