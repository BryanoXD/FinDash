"""
Workspaces, Members, Invites & Permissions.

Conceitos:
- Cada usuario tem um workspace pessoal (auto-criado na primeira chamada).
- O dono (owner) pode convidar pessoas por email com um papel/permissoes.
- Membros aceitam o convite via token; passam a ter acesso ao workspace
  conforme suas permissoes.
- Toda chamada da API deve resolver o workspace ativo do usuario e validar
  permissoes server-side.

Feature flag `FAMILY_SHARING_ENABLED` (em-memoria) controla se convites podem
ser criados (preparacao para o futuro plano pago).
"""
from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/workspaces", tags=["workspaces"])

# ============== FEATURE FLAGS ==============
FEATURES = {
    "FAMILY_SHARING_ENABLED": True,   # convites permitidos (compartilhamento)
    "BILLING_ENABLED": False,         # cobranca/checkout/assinatura
}

# Limites por plano (estrutura ja preparada para o futuro)
PLAN_LIMITS = {
    "free":    {"maxMembers": 1, "sharingEnabled": False},
    "premium": {"maxMembers": 5, "sharingEnabled": True},
    "family":  {"maxMembers": 8, "sharingEnabled": True},
}

# ============== PERMISSIONS ==============
ALL_PERMISSIONS = [
    "dashboard.view",
    "transactions.view", "transactions.create", "transactions.edit", "transactions.delete",
    "categories.manage",
    "accounts.manage", "cards.manage",
    "goals.view", "goals.edit",
    "budgets.view", "budgets.edit",
    "reports.view", "reports.export",
    "imports.use",
    "members.invite", "members.manage",
    "settings.manage",
]

ROLE_PRESETS = {
    "owner":  set(ALL_PERMISSIONS),
    "editor": {
        "dashboard.view",
        "transactions.view", "transactions.create", "transactions.edit",
        "categories.manage", "goals.view", "goals.edit",
        "budgets.view", "budgets.edit", "reports.view", "imports.use",
    },
    "viewer": {
        "dashboard.view", "transactions.view",
        "goals.view", "budgets.view", "reports.view",
    },
    "custom": set(),  # filled by user
}


# ============== MODELS ==============
class InviteCreate(BaseModel):
    email: EmailStr
    role: str = "viewer"
    permissions: Optional[List[str]] = None


class MemberUpdate(BaseModel):
    role: Optional[str] = None
    permissions: Optional[List[str]] = None


# ============== HELPERS ==============
def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _serialize(d: dict) -> dict:
    if not d:
        return d
    return {k: v for k, v in d.items() if k != "_id"}


def _resolve_permissions(role: str, custom: Optional[List[str]]) -> List[str]:
    if role == "custom" and custom:
        return sorted(set(custom) & set(ALL_PERMISSIONS))
    return sorted(ROLE_PRESETS.get(role, set()))


async def _ensure_personal_workspace(user_id: str, db) -> dict:
    """Returns the user's personal workspace. Creates it if missing.
    Also backfills owner membership."""
    ws = await db.workspaces.find_one({"owner_user_id": user_id, "is_personal": True}, {"_id": 0})
    if ws:
        return ws
    # Get user info for nice default name
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    name = (user or {}).get("name") or "Meu Workspace"
    ws = {
        "id": f"ws_{uuid.uuid4().hex[:12]}",
        "name": name,
        "owner_user_id": user_id,
        "is_personal": True,
        "plan_type": "free",
        "features": PLAN_LIMITS["free"],
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    await db.workspaces.insert_one(ws)
    # Owner member
    await db.workspace_members.insert_one({
        "id": f"mbr_{uuid.uuid4().hex[:12]}",
        "workspace_id": ws["id"],
        "user_id": user_id,
        "email": (user or {}).get("email"),
        "role": "owner",
        "permissions": list(ROLE_PRESETS["owner"]),
        "status": "active",
        "invited_by": user_id,
        "invited_at": _now_iso(),
        "joined_at": _now_iso(),
    })
    return _serialize(ws)


async def get_active_workspace_id(request: Request, db, user_id: str) -> str:
    """Returns the active workspace id for the request.
    Frontend passes `X-Workspace-Id` header; otherwise we use the user's
    personal workspace. The user MUST be a member with status='active'."""
    hdr_ws = (request.headers.get("x-workspace-id") or "").strip()
    if hdr_ws:
        member = await db.workspace_members.find_one(
            {"workspace_id": hdr_ws, "user_id": user_id, "status": "active"},
            {"_id": 0},
        )
        if not member:
            raise HTTPException(status_code=403, detail="Acesso negado a este workspace")
        return hdr_ws
    ws = await _ensure_personal_workspace(user_id, db)
    return ws["id"]


async def require_permission(request: Request, db, user_id: str, permission: str) -> str:
    """Validate user has a permission in the active workspace. Returns workspace_id."""
    ws_id = await get_active_workspace_id(request, db, user_id)
    member = await db.workspace_members.find_one(
        {"workspace_id": ws_id, "user_id": user_id, "status": "active"},
        {"_id": 0},
    )
    if not member:
        raise HTTPException(status_code=403, detail="Acesso negado")
    if permission not in (member.get("permissions") or []) and member.get("role") != "owner":
        raise HTTPException(status_code=403, detail=f"Sem permissao: {permission}")
    return ws_id


async def _log_audit(db, *, workspace_id: str, user_id: str, action: str, payload: Optional[dict] = None):
    """Lightweight audit. Best-effort; never raises."""
    try:
        await db.workspace_audit.insert_one({
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "user_id": user_id,
            "action": action,
            "payload": payload or {},
            "created_at": _now_iso(),
        })
    except Exception:
        pass


# ============== ROUTES ==============
@router.get("/me")
async def list_my_workspaces(request: Request, db=None, user_id: str = None):
    """List every workspace the current user belongs to.
    Guarantees the user has their own personal workspace (auto-creates if missing)
    even if their first interaction with the app was accepting an invite."""
    # Defensive: always ensure a personal workspace exists for this user
    await _ensure_personal_workspace(user_id, db)
    members = await db.workspace_members.find(
        {"user_id": user_id, "status": "active"}, {"_id": 0}
    ).to_list(50)
    out = []
    for m in members:
        ws = await db.workspaces.find_one({"id": m["workspace_id"]}, {"_id": 0})
        if ws:
            out.append({
                "workspace": ws,
                "member": m,
                "is_owner": ws.get("owner_user_id") == user_id,
            })
    return out


@router.get("/{workspace_id}/members")
async def list_members(workspace_id: str, request: Request, db=None, user_id: str = None):
    # Must belong to the workspace
    me = await db.workspace_members.find_one(
        {"workspace_id": workspace_id, "user_id": user_id, "status": "active"}, {"_id": 0})
    if not me:
        raise HTTPException(status_code=403, detail="Acesso negado")
    members = await db.workspace_members.find(
        {"workspace_id": workspace_id}, {"_id": 0}).to_list(50)
    invites = await db.workspace_invites.find(
        {"workspace_id": workspace_id, "status": "pending"}, {"_id": 0}).to_list(50)
    return {"members": members, "pending_invites": invites}


@router.post("/{workspace_id}/invites")
async def create_invite(workspace_id: str, data: InviteCreate, request: Request, db=None, user_id: str = None):
    # Permission check
    me = await db.workspace_members.find_one(
        {"workspace_id": workspace_id, "user_id": user_id, "status": "active"}, {"_id": 0})
    if not me:
        raise HTTPException(status_code=403, detail="Acesso negado")
    if "members.invite" not in (me.get("permissions") or []) and me.get("role") != "owner":
        raise HTTPException(status_code=403, detail="Sem permissao para convidar membros")

    if not FEATURES.get("FAMILY_SHARING_ENABLED"):
        raise HTTPException(status_code=403, detail="Compartilhamento familiar nao esta ativo")

    ws = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace nao encontrado")

    plan = ws.get("plan_type", "free")
    limit = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    if not limit["sharingEnabled"]:
        raise HTTPException(status_code=402, detail="Seu plano atual nao permite convidar membros. Faca upgrade.")

    # Count existing seats (active members + pending invites)
    active_count = await db.workspace_members.count_documents({"workspace_id": workspace_id, "status": "active"})
    pending_count = await db.workspace_invites.count_documents({"workspace_id": workspace_id, "status": "pending"})
    if active_count + pending_count >= limit["maxMembers"]:
        raise HTTPException(status_code=402, detail=f"Limite do plano atingido ({limit['maxMembers']} membros).")

    if data.role not in ROLE_PRESETS:
        raise HTTPException(status_code=400, detail="Papel invalido")
    perms = _resolve_permissions(data.role, data.permissions)

    # Idempotency: revoke any pending invite for the same email
    await db.workspace_invites.update_many(
        {"workspace_id": workspace_id, "email": data.email.lower(), "status": "pending"},
        {"$set": {"status": "revoked", "revoked_at": _now_iso()}},
    )

    invite = {
        "id": f"inv_{uuid.uuid4().hex[:12]}",
        "workspace_id": workspace_id,
        "email": data.email.lower(),
        "role": data.role,
        "permissions": perms,
        "token": secrets.token_urlsafe(24),
        "status": "pending",
        "invited_by": user_id,
        "invited_at": _now_iso(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    }
    await db.workspace_invites.insert_one(invite)
    await _log_audit(db, workspace_id=workspace_id, user_id=user_id, action="invite_created", payload={"email": data.email, "role": data.role})

    return _serialize(invite)


@router.get("/invites/lookup/{token}")
async def lookup_invite(token: str, request: Request, db=None, user_id: str = None):
    """Public-ish endpoint (still requires auth) to inspect an invite before accepting."""
    inv = await db.workspace_invites.find_one({"token": token}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Convite nao encontrado")
    if inv["status"] != "pending":
        raise HTTPException(status_code=410, detail=f"Convite {inv['status']}")
    if inv.get("expires_at") and inv["expires_at"] < _now_iso():
        await db.workspace_invites.update_one({"id": inv["id"]}, {"$set": {"status": "expired"}})
        raise HTTPException(status_code=410, detail="Convite expirado")
    ws = await db.workspaces.find_one({"id": inv["workspace_id"]}, {"_id": 0})
    return {"invite": inv, "workspace": ws}


@router.post("/invites/accept/{token}")
async def accept_invite(token: str, request: Request, db=None, user_id: str = None):
    inv = await db.workspace_invites.find_one({"token": token}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Convite nao encontrado")
    if inv["status"] != "pending":
        raise HTTPException(status_code=410, detail=f"Convite {inv['status']}")
    if inv.get("expires_at") and inv["expires_at"] < _now_iso():
        await db.workspace_invites.update_one({"id": inv["id"]}, {"$set": {"status": "expired"}})
        raise HTTPException(status_code=410, detail="Convite expirado")

    # Always make sure the accepting user has their OWN personal workspace,
    # even if they never opened the app before accepting the invite.
    await _ensure_personal_workspace(user_id, db)

    # Block if user already member
    existing = await db.workspace_members.find_one(
        {"workspace_id": inv["workspace_id"], "user_id": user_id}, {"_id": 0})
    if existing and existing["status"] == "active":
        raise HTTPException(status_code=400, detail="Voce ja e membro deste workspace")

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    user_email = (user or {}).get("email")

    # Add or revive membership
    if existing:
        await db.workspace_members.update_one(
            {"id": existing["id"]},
            {"$set": {
                "status": "active", "role": inv["role"], "permissions": inv["permissions"],
                "joined_at": _now_iso(), "email": user_email,
            }},
        )
    else:
        await db.workspace_members.insert_one({
            "id": f"mbr_{uuid.uuid4().hex[:12]}",
            "workspace_id": inv["workspace_id"],
            "user_id": user_id,
            "email": user_email,
            "role": inv["role"],
            "permissions": inv["permissions"],
            "status": "active",
            "invited_by": inv["invited_by"],
            "invited_at": inv["invited_at"],
            "joined_at": _now_iso(),
        })

    await db.workspace_invites.update_one(
        {"id": inv["id"]},
        {"$set": {"status": "accepted", "accepted_at": _now_iso(), "accepted_by": user_id}},
    )
    await _log_audit(db, workspace_id=inv["workspace_id"], user_id=user_id, action="invite_accepted")
    ws = await db.workspaces.find_one({"id": inv["workspace_id"]}, {"_id": 0})
    return {"message": "Convite aceito", "workspace": ws}


@router.delete("/{workspace_id}/invites/{invite_id}")
async def revoke_invite(workspace_id: str, invite_id: str, request: Request, db=None, user_id: str = None):
    me = await db.workspace_members.find_one(
        {"workspace_id": workspace_id, "user_id": user_id, "status": "active"}, {"_id": 0})
    if not me or ("members.invite" not in (me.get("permissions") or []) and me.get("role") != "owner"):
        raise HTTPException(status_code=403, detail="Sem permissao")
    await db.workspace_invites.update_one(
        {"id": invite_id, "workspace_id": workspace_id},
        {"$set": {"status": "revoked", "revoked_at": _now_iso()}},
    )
    await _log_audit(db, workspace_id=workspace_id, user_id=user_id, action="invite_revoked", payload={"invite_id": invite_id})
    return {"message": "Convite revogado"}


@router.put("/{workspace_id}/members/{member_id}")
async def update_member(workspace_id: str, member_id: str, data: MemberUpdate, request: Request, db=None, user_id: str = None):
    me = await db.workspace_members.find_one(
        {"workspace_id": workspace_id, "user_id": user_id, "status": "active"}, {"_id": 0})
    if not me or ("members.manage" not in (me.get("permissions") or []) and me.get("role") != "owner"):
        raise HTTPException(status_code=403, detail="Sem permissao")

    target = await db.workspace_members.find_one({"id": member_id, "workspace_id": workspace_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Membro nao encontrado")
    if target.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Owner nao pode ser alterado")

    update = {}
    if data.role is not None:
        if data.role not in ROLE_PRESETS:
            raise HTTPException(status_code=400, detail="Papel invalido")
        update["role"] = data.role
        update["permissions"] = _resolve_permissions(data.role, data.permissions)
    elif data.permissions is not None:
        update["permissions"] = _resolve_permissions(target.get("role", "custom"), data.permissions)

    if update:
        await db.workspace_members.update_one({"id": member_id}, {"$set": update})
    await _log_audit(db, workspace_id=workspace_id, user_id=user_id, action="member_updated", payload={"member_id": member_id, **update})
    return await db.workspace_members.find_one({"id": member_id}, {"_id": 0})


@router.delete("/{workspace_id}/members/{member_id}")
async def remove_member(workspace_id: str, member_id: str, request: Request, db=None, user_id: str = None):
    me = await db.workspace_members.find_one(
        {"workspace_id": workspace_id, "user_id": user_id, "status": "active"}, {"_id": 0})
    if not me or ("members.manage" not in (me.get("permissions") or []) and me.get("role") != "owner"):
        raise HTTPException(status_code=403, detail="Sem permissao")
    target = await db.workspace_members.find_one({"id": member_id, "workspace_id": workspace_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Membro nao encontrado")
    if target.get("role") == "owner":
        raise HTTPException(status_code=400, detail="Owner nao pode ser removido")
    await db.workspace_members.update_one({"id": member_id}, {"$set": {"status": "revoked", "revoked_at": _now_iso()}})
    await _log_audit(db, workspace_id=workspace_id, user_id=user_id, action="member_removed", payload={"member_id": member_id})
    return {"message": "Membro removido"}


@router.get("/features/flags")
async def get_feature_flags(request: Request, db=None, user_id: str = None):
    return {"features": FEATURES, "plan_limits": PLAN_LIMITS}
