/**
 * CompartilhamentoSection - manage workspace members & invites.
 * Visible only inside a workspace where the user is owner/has members.invite.
 */
import React, { useEffect, useMemo, useState } from "react";
import { authAPI, workspacesAPI } from "../../services/api";
import { Field, Inp, Sel, Btn } from "../../components/shared/FormComponents";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../../components/ui/dialog";
import {
  Users, Mail, Crown, Edit, Eye, Trash2, Copy, Plus, Link2, ShieldOff,
} from "lucide-react";

const ROLE_LABEL = { owner: "Dono", editor: "Editor", viewer: "Leitor", custom: "Personalizado" };
const ROLE_ICON = { owner: Crown, editor: Edit, viewer: Eye, custom: ShieldOff };
const STATUS_COLOR = {
  active: "text-emerald-400 bg-emerald-500/10",
  pending: "text-amber-400 bg-amber-500/10",
  revoked: "text-white/30 bg-white/[0.04]",
  expired: "text-red-400 bg-red-500/10",
  accepted: "text-emerald-400 bg-emerald-500/10",
};

export default function CompartilhamentoSection() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWs, setActiveWs] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "viewer" });
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [lastInviteLink, setLastInviteLink] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [wsList, flags] = await Promise.all([
          workspacesAPI.me(),
          workspacesAPI.featureFlags(),
        ]);
        setWorkspaces(wsList);
        setFeatures(flags);
        if (wsList.length) setActiveWs(wsList[0]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const reloadMembers = async (wsId) => {
    const data = await workspacesAPI.members(wsId);
    setMembers(data.members || []);
    setInvites(data.pending_invites || []);
  };

  useEffect(() => {
    if (activeWs?.workspace?.id) reloadMembers(activeWs.workspace.id);
  }, [activeWs?.workspace?.id]);

  const isOwner = !!activeWs?.is_owner;
  const canInvite = useMemo(() => {
    if (!activeWs) return false;
    if (activeWs.is_owner) return true;
    return (activeWs.member?.permissions || []).includes("members.invite");
  }, [activeWs]);

  const sharingDisabled = !features?.features?.FAMILY_SHARING_ENABLED;
  const planAllowsSharing = activeWs?.workspace?.features?.sharingEnabled;
  const planLimit = activeWs?.workspace?.features?.maxMembers || 1;

  const sendInvite = async () => {
    setInviteError("");
    if (!inviteForm.email.includes("@")) { setInviteError("Informe um email valido"); return; }
    setInviteSaving(true);
    try {
      const invite = await workspacesAPI.invite(activeWs.workspace.id, {
        email: inviteForm.email.trim(),
        role: inviteForm.role,
      });
      const link = `${window.location.origin}/dashboard/convite/${invite.token}`;
      setLastInviteLink(link);
      setInviteForm({ email: "", role: "viewer" });
      await reloadMembers(activeWs.workspace.id);
    } catch (e) {
      setInviteError(e.message || "Erro ao criar convite");
    } finally {
      setInviteSaving(false);
    }
  };

  const copyLink = async (token) => {
    const link = `${window.location.origin}/dashboard/convite/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      alert("Link copiado!");
    } catch (_) {
      window.prompt("Copie o link:", link);
    }
  };

  const revokeInvite = async (inv) => {
    if (!window.confirm(`Revogar convite para ${inv.email}?`)) return;
    await workspacesAPI.revokeInvite(activeWs.workspace.id, inv.id);
    reloadMembers(activeWs.workspace.id);
  };

  const removeMember = async (m) => {
    if (!window.confirm(`Remover ${m.email} deste workspace?`)) return;
    await workspacesAPI.removeMember(activeWs.workspace.id, m.id);
    reloadMembers(activeWs.workspace.id);
  };

  const changeRole = async (m, newRole) => {
    await workspacesAPI.updateMember(activeWs.workspace.id, m.id, { role: newRole });
    reloadMembers(activeWs.workspace.id);
  };

  const revokeAllSessions = async () => {
    if (!window.confirm("Encerrar todas as outras sessoes? Voce continuara logado neste dispositivo, mas em qualquer outro o login sera exigido.")) return;
    try {
      await authAPI.revokeAllSessions();
      alert("Outras sessoes foram encerradas.");
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div className="text-white/40 text-sm py-12 text-center">Carregando...</div>;

  return (
    <div data-testid="compartilhamento-section" className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-xl sm:text-2xl font-bold">Compartilhamento</h1>
          <p className="text-white/40 text-sm mt-1">
            Convide pessoas para alimentar e visualizar este controle financeiro
          </p>
        </div>
        <button
          data-testid="revoke-all-sessions-btn"
          onClick={revokeAllSessions}
          className="text-xs text-white/50 hover:text-white/80 underline-offset-2 hover:underline"
          title="Encerra sessoes em outros dispositivos"
        >
          Encerrar outras sessoes
        </button>
      </div>

      {/* Workspaces switcher (only if more than 1) */}
      {workspaces.length > 1 && (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4">
          <p className="text-white/50 text-xs mb-2">Workspace ativo</p>
          <Sel value={activeWs?.workspace?.id || ""} onChange={(e) => setActiveWs(workspaces.find(w => w.workspace.id === e.target.value))}>
            {workspaces.map(w => (
              <option key={w.workspace.id} value={w.workspace.id}>{w.workspace.name} {w.is_owner ? "(dono)" : ""}</option>
            ))}
          </Sel>
        </div>
      )}

      {/* Plan banner */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl p-4 flex items-start gap-3">
        <Crown className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-white text-sm font-medium">
            Plano atual: <span className="text-amber-400">{activeWs?.workspace?.plan_type || "free"}</span>
          </p>
          <p className="text-white/40 text-xs mt-0.5">
            {planAllowsSharing
              ? `Voce pode convidar ate ${planLimit} membros neste workspace.`
              : "Compartilhamento familiar e um recurso premium. Em breve voce podera ativar com upgrade do plano."}
          </p>
        </div>
      </div>

      {/* Members list */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-xl">
        <div className="p-4 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white/60" />
            <h3 className="text-white font-semibold text-sm">Membros</h3>
            <span className="text-white/40 text-xs">({members.length}/{planLimit})</span>
          </div>
          {canInvite && (
            <Btn
              data-testid="invite-new-btn"
              onClick={() => { setInviteModal(true); setLastInviteLink(null); setInviteError(""); }}
              disabled={sharingDisabled || !planAllowsSharing || members.length >= planLimit}
            >
              <Plus className="w-4 h-4 inline mr-1" /> Convidar
            </Btn>
          )}
        </div>
        <div className="divide-y divide-white/[0.06]">
          {members.length === 0 ? (
            <div className="p-6 text-center text-white/40 text-sm">Nenhum membro ainda.</div>
          ) : members.map(m => {
            const Icon = ROLE_ICON[m.role] || ShieldOff;
            return (
              <div key={m.id} className="p-4 flex items-center gap-3" data-testid={`member-row-${m.id}`}>
                <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{m.email || m.user_id}</p>
                  <p className="text-white/40 text-xs">{ROLE_LABEL[m.role] || m.role} . {(m.permissions || []).length} permissoes</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_COLOR[m.status] || ""}`}>{m.status}</span>
                {isOwner && m.role !== "owner" && (
                  <>
                    <Sel
                      value={m.role}
                      onChange={(e) => changeRole(m, e.target.value)}
                      className="!w-auto !text-xs"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Leitor</option>
                    </Sel>
                    <button onClick={() => removeMember(m)} className="text-red-400/60 hover:text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl">
          <div className="p-4 border-b border-white/[0.06] flex items-center gap-2">
            <Mail className="w-4 h-4 text-white/60" />
            <h3 className="text-white font-semibold text-sm">Convites pendentes</h3>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {invites.map(inv => (
              <div key={inv.id} className="p-4 flex items-center gap-3" data-testid={`invite-row-${inv.id}`}>
                <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{inv.email}</p>
                  <p className="text-white/40 text-xs">{ROLE_LABEL[inv.role]} . expira em {new Date(inv.expires_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <button onClick={() => copyLink(inv.token)} className="text-white/50 hover:text-white p-1.5" title="Copiar link">
                  <Copy className="w-4 h-4" />
                </button>
                {isOwner && (
                  <button onClick={() => revokeInvite(inv)} className="text-red-400/60 hover:text-red-400 p-1.5" title="Revogar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      <Dialog open={inviteModal} onOpenChange={(o) => !o && setInviteModal(false)}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Convidar membro</DialogTitle>
          </DialogHeader>
          {lastInviteLink ? (
            <div className="space-y-3 py-2">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-emerald-400 text-sm font-medium mb-2">Convite criado!</p>
                <p className="text-white/60 text-xs">Compartilhe este link com a pessoa convidada:</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-white/40 flex-shrink-0" />
                <code className="text-white/80 text-xs truncate flex-1" data-testid="invite-link">{lastInviteLink}</code>
                <button onClick={async () => { await navigator.clipboard.writeText(lastInviteLink); alert("Copiado!"); }} className="text-white/60 hover:text-white">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <DialogFooter className="gap-2">
                <Btn onClick={() => { setLastInviteLink(null); setInviteModal(false); }}>Fechar</Btn>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-2">
                <Field label="Email" required>
                  <Inp data-testid="invite-form-email" type="email" placeholder="amigo@email.com" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
                </Field>
                <Field label="Papel">
                  <Sel data-testid="invite-form-role" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
                    <option value="viewer">Leitor (apenas visualiza)</option>
                    <option value="editor">Editor (cria/edita transacoes, metas, orcamentos)</option>
                  </Sel>
                </Field>
                {inviteError && <p className="text-red-400 text-xs" data-testid="invite-error">{inviteError}</p>}
                <p className="text-white/30 text-[11px]">
                  Apos criar, voce recebera um link que pode enviar para a pessoa por qualquer canal (Whatsapp, email, etc.). O link expira em 7 dias.
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Btn variant="secondary" onClick={() => setInviteModal(false)}>Cancelar</Btn>
                <Btn data-testid="invite-send-btn" onClick={sendInvite} disabled={inviteSaving}>{inviteSaving ? "Criando..." : "Criar convite"}</Btn>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
