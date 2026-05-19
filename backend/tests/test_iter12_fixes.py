"""
Iteration 12 - Targeted regression for:
- FIX 1 (HIGH): Personal workspace must be auto-created for an invited user even when
  they accept the invite BEFORE ever calling /api/workspaces/me.
- Smoke regression: FLOW 4 (create invite with valid email) + FLOW 5 (accept invite as B).
Direct-Mongo seeding (TEST_WS_FE_* prefix), full cleanup at end.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("/app/backend/.env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
# fallback to frontend/.env
if not BASE_URL:
    load_dotenv("/app/frontend/.env")
    BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

MONGO = MongoClient(os.environ["MONGO_URL"])
DB = MONGO[os.environ["DB_NAME"]]

TAG = f"WS_FE_{uuid.uuid4().hex[:6]}"
NOW = datetime.now(timezone.utc)


def _mk_user(label: str) -> dict:
    uid = f"u_{TAG}_{label}"
    email = f"test_{TAG}_{label}@findash.test".lower()
    token = f"tok_{TAG}_{label}_{uuid.uuid4().hex}"
    DB.users.insert_one({
        "user_id": uid, "email": email, "name": f"Test {label}",
        "picture": "", "session_version": 0, "created_at": NOW,
    })
    DB.user_sessions.insert_one({
        "user_id": uid, "session_token": token,
        "expires_at": NOW + timedelta(days=7),
        "session_version": 0, "created_at": NOW,
    })
    return {"user_id": uid, "email": email, "token": token}


def _cookies(u):
    return {"session_token": u["token"]}


@pytest.fixture(scope="module")
def users():
    A = _mk_user("A")
    B = _mk_user("B")
    yield {"A": A, "B": B}
    # Cleanup all artifacts produced by TAG
    uids = [A["user_id"], B["user_id"]]
    emails = [A["email"], B["email"]]
    DB.users.delete_many({"user_id": {"$in": uids}})
    DB.user_sessions.delete_many({"user_id": {"$in": uids}})
    ws_ids = [w["id"] for w in DB.workspaces.find({"owner_user_id": {"$in": uids}}, {"id": 1})]
    DB.workspaces.delete_many({"owner_user_id": {"$in": uids}})
    DB.workspace_members.delete_many({"$or": [
        {"user_id": {"$in": uids}}, {"workspace_id": {"$in": ws_ids}}]})
    DB.workspace_invites.delete_many({"$or": [
        {"email": {"$in": emails}}, {"workspace_id": {"$in": ws_ids}}]})
    DB.workspace_audit.delete_many({"workspace_id": {"$in": ws_ids}})


@pytest.fixture(scope="module")
def workspace_a(users):
    """Trigger personal-workspace creation for A and upgrade it to premium."""
    r = requests.get(f"{BASE_URL}/api/workspaces/me", cookies=_cookies(users["A"]), timeout=10)
    assert r.status_code == 200, r.text
    ws = r.json()[0]["workspace"]
    DB.workspaces.update_one(
        {"id": ws["id"]},
        {"$set": {"plan_type": "premium",
                  "features": {"maxMembers": 5, "sharingEnabled": True}}},
    )
    ws["plan_type"] = "premium"
    ws["features"] = {"maxMembers": 5, "sharingEnabled": True}
    return ws


# --------------- SMOKE REGRESSION (FLOW 4 + FLOW 5) ---------------
def test_flow4_create_invite_valid_email(users, workspace_a):
    payload = {"email": f"flow4_{TAG}@example.com", "role": "editor"}
    r = requests.post(
        f"{BASE_URL}/api/workspaces/{workspace_a['id']}/invites",
        json=payload, cookies=_cookies(users["A"]), timeout=10,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "pending"
    assert body["email"] == payload["email"].lower()
    assert body["role"] == "editor"
    assert "token" in body and len(body["token"]) > 10
    assert "_id" not in body


def test_flow5_accept_invite_as_B_persistence(users, workspace_a):
    """FIX 1 - main scenario.
    B has never called /api/workspaces/me. B accepts an invite.
    After accept, /api/workspaces/me must return 2 workspaces (B's personal + A's)."""
    # Pre-check: B has no workspaces/memberships
    assert DB.workspaces.count_documents({"owner_user_id": users["B"]["user_id"]}) == 0
    assert DB.workspace_members.count_documents({"user_id": users["B"]["user_id"]}) == 0

    # A creates an invite specifically for B's email
    inv_resp = requests.post(
        f"{BASE_URL}/api/workspaces/{workspace_a['id']}/invites",
        json={"email": users["B"]["email"].replace("@findash.test", "@example.com"),
              "role": "editor"},
        cookies=_cookies(users["A"]), timeout=10,
    )
    assert inv_resp.status_code == 200, inv_resp.text
    token = inv_resp.json()["token"]

    # B accepts directly (no prior /workspaces/me call)
    acc = requests.post(
        f"{BASE_URL}/api/workspaces/invites/accept/{token}",
        cookies=_cookies(users["B"]), timeout=10,
    )
    assert acc.status_code == 200, acc.text
    assert acc.json().get("message") == "Convite aceito"

    # NOW: GET /api/workspaces/me as B - expect 2 entries
    me = requests.get(f"{BASE_URL}/api/workspaces/me", cookies=_cookies(users["B"]), timeout=10)
    assert me.status_code == 200, me.text
    ws_list = me.json()
    assert isinstance(ws_list, list)
    assert len(ws_list) == 2, f"Expected 2 workspaces for B (personal + A's), got {len(ws_list)}: {ws_list}"

    # Personal workspace check
    personal = [w for w in ws_list if w["is_owner"]]
    assert len(personal) == 1, "B should own exactly 1 personal workspace"
    assert personal[0]["workspace"]["owner_user_id"] == users["B"]["user_id"]
    assert personal[0]["workspace"]["is_personal"] is True
    assert personal[0]["member"]["role"] == "owner"

    # A's workspace where B is editor
    foreign = [w for w in ws_list if not w["is_owner"]]
    assert len(foreign) == 1
    assert foreign[0]["workspace"]["id"] == workspace_a["id"]
    assert foreign[0]["member"]["role"] == "editor"
    assert foreign[0]["member"]["status"] == "active"

    # Mongo persistence verification
    b_ws_rows = list(DB.workspaces.find({"owner_user_id": users["B"]["user_id"]}, {"_id": 0}))
    assert len(b_ws_rows) == 1
    assert b_ws_rows[0]["is_personal"] is True
    assert b_ws_rows[0]["plan_type"] == "free"

    b_member_rows = list(DB.workspace_members.find({"user_id": users["B"]["user_id"]}, {"_id": 0}))
    # 2 rows: owner of own + editor of A's
    assert len(b_member_rows) == 2, f"Expected 2 membership rows for B, got {len(b_member_rows)}"
    roles = sorted([m["role"] for m in b_member_rows])
    assert roles == ["editor", "owner"]


def test_invite_invalid_email_returns_422(users, workspace_a):
    """FIX 2 backend signal: ensure server still returns 422 with a parseable detail
    so frontend can surface a friendly message."""
    r = requests.post(
        f"{BASE_URL}/api/workspaces/{workspace_a['id']}/invites",
        json={"email": "userb@findash.test", "role": "editor"},
        cookies=_cookies(users["A"]), timeout=10,
    )
    assert r.status_code == 422
    body = r.json()
    # FastAPI shape: {"detail":[{"type":"value_error","loc":[...],"msg":"...","input":...}]}
    assert "detail" in body
    assert isinstance(body["detail"], list)
    assert body["detail"][0].get("msg")
    assert "email" in body["detail"][0].get("loc", [])
