"""Seed two users (A=owner, B=guest) + sessions for iteration 11 frontend tests."""
import os, uuid, json
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("/app/backend/.env")
mongo = MongoClient(os.environ["MONGO_URL"])
db = mongo[os.environ["DB_NAME"]]

TAG = f"WS_FE_{uuid.uuid4().hex[:6]}"
now = datetime.now(timezone.utc)

def mk(label):
    uid = f"u_{TAG}_{label}"
    email = f"test_{TAG}_{label}@findash.test".lower()
    token = f"tok_{TAG}_{label}_{uuid.uuid4().hex}"
    db.users.insert_one({
        "user_id": uid, "email": email, "name": f"Test {label}",
        "picture": "", "session_version": 0, "created_at": now,
    })
    db.user_sessions.insert_one({
        "user_id": uid, "session_token": token,
        "expires_at": now + timedelta(days=7),
        "session_version": 0, "created_at": now,
    })
    return {"user_id": uid, "email": email, "token": token}

A = mk("A")
B = mk("B")
print(json.dumps({"tag": TAG, "A": A, "B": B}, default=str))
