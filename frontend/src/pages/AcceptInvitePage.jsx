/**
 * AcceptInvitePage - opens at /dashboard/convite/:token
 * Shows the invite info and lets the (logged-in) user accept it.
 */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { workspacesAPI } from "../services/api";
import { Btn } from "../components/shared/FormComponents";
import { Mail, Check, AlertTriangle } from "lucide-react";

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await workspacesAPI.lookupInvite(token);
        setData(d);
      } catch (e) {
        setError(e.message || "Convite invalido");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    try {
      await workspacesAPI.acceptInvite(token);
      navigate("/dashboard/compartilhamento", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) return <div className="text-white/40 text-sm py-12 text-center">Validando convite...</div>;
  if (error) {
    return (
      <div data-testid="invite-error-state" className="max-w-md mx-auto mt-12 bg-[#111111] border border-red-500/20 rounded-xl p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-2">Convite invalido</p>
        <p className="text-white/50 text-sm">{error}</p>
        <Btn className="mt-4" onClick={() => navigate("/dashboard")}>Voltar ao dashboard</Btn>
      </div>
    );
  }

  return (
    <div data-testid="invite-accept-state" className="max-w-md mx-auto mt-12 bg-[#111111] border border-white/[0.08] rounded-xl p-6">
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center mb-3">
          <Mail className="w-7 h-7 text-emerald-400" />
        </div>
        <h1 className="text-white text-xl font-bold">Voce foi convidado</h1>
        <p className="text-white/50 text-sm mt-1">para participar de</p>
        <p className="text-white text-lg font-semibold mt-1">{data.workspace?.name}</p>
      </div>
      <div className="space-y-2 bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-xs">
        <div className="flex justify-between"><span className="text-white/40">Email convidado:</span><span className="text-white">{data.invite.email}</span></div>
        <div className="flex justify-between"><span className="text-white/40">Papel:</span><span className="text-white">{data.invite.role}</span></div>
        <div className="flex justify-between"><span className="text-white/40">Permissoes:</span><span className="text-white">{data.invite.permissions.length} acoes</span></div>
        <div className="flex justify-between"><span className="text-white/40">Expira em:</span><span className="text-white">{new Date(data.invite.expires_at).toLocaleDateString("pt-BR")}</span></div>
      </div>
      <Btn
        data-testid="invite-accept-btn"
        className="w-full mt-5"
        onClick={accept}
        disabled={accepting}
      >
        <Check className="w-4 h-4 inline mr-1" /> {accepting ? "Aceitando..." : "Aceitar convite"}
      </Btn>
    </div>
  );
}
