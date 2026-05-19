"""Backend tests for Security & Sharing (Workspaces) flow.

Seeds two users with valid session cookies directly into MongoDB,
since Emergent Google OAuth cannot be intercepted in tests.

Run:
    pytest /app/backend/tests/test_workspaces_security.py -v
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests
from pymongo import MongoClient

# Load .env explicitly so BASE_URL/MONGO are correct
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

BASE_URL = os.environ["FRONTEND_URL"].rstrip("/")
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

mongo = MongoClient(MONGO_URL)
db = mongo[DB_NAME]

TEST_TAG = f"TEST_WS_SEC_{uuid.uuid4().hex[:6]}"


def _mk_user(label: str) -> dict:
    """Seed a user + session in Mongo and return ids/token."""
    user_id = f"u_{TEST_TAG}_{label}_{uuid.uuid4().hex[:8]}"
    email = f"TEST_{TEST_TAG}_{label}@example.com".lower()
    token = f"tok_{TEST_TAG}_{label}_{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)
    db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "name": f"Test {label}",
        "picture": "",
        "session_version": 0,
        "created_at": now,
    })
    db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": now + timedelta(days=7),
        "session_version": 0,
        "created_at": now,
    })
    return {"user_id": user_id, "email": email, "token": token}


@pytest.fixture(scope="module")
def users():
    u1 = _mk_user("A")
    u2 = _mk_user("B")
    yield u1, u2
    # Cleanup
    for u in (u1, u2):
        db.user_sessions.delete_many({"user_id": u["user_id"]})
        db.users.delete_many({"user_id": u["user_id"]})
        # Cleanup workspaces created for this user
        ws_ids = [w["id"] for w in db.workspaces.find({"owner_user_id": u["user_id"]}, {"id": 1, "_id": 0})]
        for ws_id in ws_ids:
            db.workspace_members.delete_many({"workspace_id": ws_id})
            db.workspace_invites.delete_many({"workspace_id": ws_id})
            db.workspace_audit.delete_many({"workspace_id": ws_id})
            db.workspaces.delete_many({"id": ws_id})
        # Also remove any membership rows for u2 in any workspace
        db.workspace_members.delete_many({"user_id": u["user_id"]})


def cookies_for(token: str) -> dict:
    return {"session_token": token}


# ===================== HEALTH (regression) =====================
def test_health():
    r = requests.get(f"{BASE_URL}/api/health", timeout=15)
    assert r.status_code == 200
    assert r.json().get("status") == "healthy"


# ===================== AUTH VALIDATE / SESSION =====================
def test_validate_without_cookie_returns_401():
    r = requests.get(f"{BASE_URL}/api/auth/validate", timeout=15)
    assert r.status_code == 401
    assert "Not authenticated" in r.json().get("detail", "")


def test_validate_with_cookie_returns_200(users):
    u1, _ = users
    r = requests.get(f"{BASE_URL}/api/auth/validate", cookies=cookies_for(u1["token"]), timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["valid"] is True
    assert body["user_id"] == u1["user_id"]
    assert body["user"]["email"] == u1["email"]
    assert "_id" not in body["user"]


def test_session_alias_works(users):
    u1, _ = users
    r = requests.get(f"{BASE_URL}/api/auth/session", cookies=cookies_for(u1["token"]), timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["valid"] is True
    assert body["user_id"] == u1["user_id"]


# ===================== WORKSPACES /me & feature flags =====================
def test_workspaces_me_autocreates_personal(users):
    u1, _ = users
    r = requests.get(f"{BASE_URL}/api/workspaces/me", cookies=cookies_for(u1["token"]), timeout=15)
    assert r.status_code == 200, r.text
    arr = r.json()
    assert isinstance(arr, list) and len(arr) >= 1
    entry = arr[0]
    ws = entry["workspace"]
    member = entry["member"]
    assert entry["is_owner"] is True
    assert ws["owner_user_id"] == u1["user_id"]
    assert ws["is_personal"] is True
    assert ws["plan_type"] == "free"
    assert "_id" not in ws and "_id" not in member
    # Check persistence in Mongo
    db_ws = db.workspaces.find_one({"id": ws["id"]})
    assert db_ws is not None
    db_mb = db.workspace_members.find_one({"workspace_id": ws["id"], "user_id": u1["user_id"]})
    assert db_mb is not None and db_mb["role"] == "owner"


def test_feature_flags(users):
    u1, _ = users
    r = requests.get(f"{BASE_URL}/api/workspaces/features/flags", cookies=cookies_for(u1["token"]), timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "features" in body and "plan_limits" in body
    assert "FAMILY_SHARING_ENABLED" in body["features"]
    assert "BILLING_ENABLED" in body["features"]
    for k in ("free", "premium", "family"):
        assert k in body["plan_limits"]


# ===================== INVITES on FREE plan =====================
def _get_ws(token: str) -> str:
    r = requests.get(f"{BASE_URL}/api/workspaces/me", cookies=cookies_for(token), timeout=15)
    return r.json()[0]["workspace"]["id"]


def test_create_invite_free_plan_blocked(users):
    u1, u2 = users
    ws_id = _get_ws(u1["token"])
    r = requests.post(
        f"{BASE_URL}/api/workspaces/{ws_id}/invites",
        json={"email": u2["email"], "role": "viewer"},
        cookies=cookies_for(u1["token"]),
        timeout=15,
    )
    assert r.status_code == 402, r.text
    detail = r.json().get("detail", "").lower()
    assert "upgrade" in detail or "plano" in detail
    # No invite persisted
    assert db.workspace_invites.count_documents({"workspace_id": ws_id, "email": u2["email"]}) == 0


# ===================== INVITES on PREMIUM =====================
def test_create_invite_premium(users):
    u1, u2 = users
    ws_id = _get_ws(u1["token"])
    # Force premium
    db.workspaces.update_one({"id": ws_id}, {"$set": {"plan_type": "premium"}})

    r = requests.post(
        f"{BASE_URL}/api/workspaces/{ws_id}/invites",
        json={"email": u2["email"], "role": "viewer"},
        cookies=cookies_for(u1["token"]),
        timeout=15,
    )
    assert r.status_code == 200, r.text
    inv = r.json()
    assert inv["status"] == "pending"
    assert inv["role"] == "viewer"
    assert inv["token"] and len(inv["token"]) > 10
    assert "expires_at" in inv
    # Members listing should include this pending invite
    r2 = requests.get(
        f"{BASE_URL}/api/workspaces/{ws_id}/members",
        cookies=cookies_for(u1["token"]),
        timeout=15,
    )
    assert r2.status_code == 200, r2.text
    body = r2.json()
    assert any(p["id"] == inv["id"] for p in body["pending_invites"])
    # Stash for next tests
    db.workspaces.update_one({"id": ws_id}, {"$set": {"_test_invite_token": inv["token"], "_test_invite_id": inv["id"]}})


def test_invite_lookup_invalid_token(users):
    u1, _ = users
    r = requests.get(
        f"{BASE_URL}/api/workspaces/invites/lookup/does-not-exist-xyz",
        cookies=cookies_for(u1["token"]),
        timeout=15,
    )
    assert r.status_code == 404, r.text


def test_invite_lookup_valid(users):
    u1, u2 = users
    ws_id = _get_ws(u1["token"])
    inv_doc = db.workspaces.find_one({"id": ws_id})
    token = inv_doc["_test_invite_token"]
    r = requests.get(
        f"{BASE_URL}/api/workspaces/invites/lookup/{token}",
        cookies=cookies_for(u2["token"]),
        timeout=15,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["invite"]["token"] == token
    assert body["workspace"]["id"] == ws_id


def test_accept_invite_as_second_user(users):
    u1, u2 = users
    ws_id = _get_ws(u1["token"])
    inv_doc = db.workspaces.find_one({"id": ws_id})
    token = inv_doc["_test_invite_token"]
    r = requests.post(
        f"{BASE_URL}/api/workspaces/invites/accept/{token}",
        cookies=cookies_for(u2["token"]),
        timeout=15,
    )
    assert r.status_code == 200, r.text
    # u2 is now a member
    mb = db.workspace_members.find_one({"workspace_id": ws_id, "user_id": u2["user_id"]})
    assert mb is not None and mb["status"] == "active" and mb["role"] == "viewer"
    inv = db.workspace_invites.find_one({"token": token})
    assert inv["status"] == "accepted"


def test_invite_lookup_expired_returns_410(users):
    """Create a pending invite then mark it revoked => 410 from lookup."""
    u1, _ = users
    ws_id = _get_ws(u1["token"])
    fake_token = f"tok_revoked_{uuid.uuid4().hex}"
    db.workspace_invites.insert_one({
        "id": f"inv_test_{uuid.uuid4().hex[:8]}",
        "workspace_id": ws_id,
        "email": "revoked@example.com",
        "role": "viewer",
        "permissions": [],
        "token": fake_token,
        "status": "revoked",
        "invited_by": u1["user_id"],
        "invited_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    })
    r = requests.get(
        f"{BASE_URL}/api/workspaces/invites/lookup/{fake_token}",
        cookies=cookies_for(u1["token"]),
        timeout=15,
    )
    assert r.status_code == 410, r.text


# ===================== MEMBER UPDATE / REMOVAL =====================
def test_update_member_role_to_editor(users):
    u1, u2 = users
    ws_id = _get_ws(u1["token"])
    mb = db.workspace_members.find_one({"workspace_id": ws_id, "user_id": u2["user_id"]})
    assert mb is not None
    r = requests.put(
        f"{BASE_URL}/api/workspaces/{ws_id}/members/{mb['id']}",
        json={"role": "editor"},
        cookies=cookies_for(u1["token"]),
        timeout=15,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["role"] == "editor"
    perms = set(body["permissions"])
    # editor preset should include these but exclude members.* / settings.manage
    assert "transactions.edit" in perms
    assert "members.invite" not in perms


def test_owner_cannot_be_updated(users):
    u1, _ = users
    ws_id = _get_ws(u1["token"])
    owner_mb = db.workspace_members.find_one({"workspace_id": ws_id, "user_id": u1["user_id"]})
    r = requests.put(
        f"{BASE_URL}/api/workspaces/{ws_id}/members/{owner_mb['id']}",
        json={"role": "viewer"},
        cookies=cookies_for(u1["token"]),
        timeout=15,
    )
    assert r.status_code == 400, r.text


def test_revoke_invite(users):
    """Create a new invite, then revoke it via DELETE."""
    u1, _ = users
    ws_id = _get_ws(u1["token"])
    r = requests.post(
        f"{BASE_URL}/api/workspaces/{ws_id}/invites",
        json={"email": "TEST_revoke@example.com", "role": "viewer"},
        cookies=cookies_for(u1["token"]),
        timeout=15,
    )
    assert r.status_code == 200, r.text
    inv_id = r.json()["id"]
    r2 = requests.delete(
        f"{BASE_URL}/api/workspaces/{ws_id}/invites/{inv_id}",
        cookies=cookies_for(u1["token"]),
        timeout=15,
    )
    assert r2.status_code == 200, r2.text
    doc = db.workspace_invites.find_one({"id": inv_id})
    assert doc["status"] == "revoked"


def test_remove_member(users):
    u1, u2 = users
    ws_id = _get_ws(u1["token"])
    mb = db.workspace_members.find_one({"workspace_id": ws_id, "user_id": u2["user_id"]})
    r = requests.delete(
        f"{BASE_URL}/api/workspaces/{ws_id}/members/{mb['id']}",
        cookies=cookies_for(u1["token"]),
        timeout=15,
    )
    assert r.status_code == 200, r.text
    after = db.workspace_members.find_one({"id": mb["id"]})
    assert after["status"] == "revoked"


def test_owner_cannot_be_removed(users):
    u1, _ = users
    ws_id = _get_ws(u1["token"])
    owner_mb = db.workspace_members.find_one({"workspace_id": ws_id, "user_id": u1["user_id"]})
    r = requests.delete(
        f"{BASE_URL}/api/workspaces/{ws_id}/members/{owner_mb['id']}",
        cookies=cookies_for(u1["token"]),
        timeout=15,
    )
    assert r.status_code == 400, r.text


# ===================== X-Workspace-Id ACCESS CONTROL =====================
def test_x_workspace_id_from_other_user_blocked_on_transactions(users):
    """User A's workspace shouldn't be reachable by user B via X-Workspace-Id."""
    u1, u2 = users
    ws_id_a = _get_ws(u1["token"])
    # u2 sends ws_id_a as X-Workspace-Id; should be 403
    r = requests.get(
        f"{BASE_URL}/api/transactions",
        cookies=cookies_for(u2["token"]),
        headers={"X-Workspace-Id": ws_id_a},
        timeout=15,
    )
    # NOTE: This validates the SPEC requirement.
    # If transaction routes ignore X-Workspace-Id this will fail (expected gap).
    assert r.status_code == 403, (
        f"Expected 403 for cross-user workspace, got {r.status_code}: {r.text}"
    )


# ===================== REVOKE ALL SESSIONS =====================
def test_revoke_all_sessions_invalidates_current(users):
    """Per spec: bumping session_version + delete sessions -> /me must 401."""
    # Use a *fresh* throwaway user to avoid breaking later tests
    tmp = _mk_user("REV")
    try:
        # sanity: /me works
        pre = requests.get(f"{BASE_URL}/api/auth/me", cookies=cookies_for(tmp["token"]), timeout=15)
        assert pre.status_code == 200, pre.text

        r = requests.post(
            f"{BASE_URL}/api/auth/revoke-all-sessions",
            cookies=cookies_for(tmp["token"]),
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("session_version", 0) >= 1

        # After revocation, /me must be 401 per spec
        post = requests.get(f"{BASE_URL}/api/auth/me", cookies=cookies_for(tmp["token"]), timeout=15)
        assert post.status_code == 401, (
            f"Expected 401 after revoke-all-sessions, got {post.status_code}: {post.text}"
        )
    finally:
        db.user_sessions.delete_many({"user_id": tmp["user_id"]})
        db.users.delete_many({"user_id": tmp["user_id"]})
