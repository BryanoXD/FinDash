"""
Subscriptions routes - recurring subscriptions (Netflix, Spotify, gym, etc.)

Each subscription tracks: name, value, category, recurrence (weekly/monthly/yearly),
billing day, payment method, status, optional auto-generation of transactions when
billing date arrives, price change history.
"""
from datetime import datetime, date, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, ConfigDict

from models import generate_id, Transaction

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


# ============== MODELS ==============
class PriceChange(BaseModel):
    valor: float
    data: str  # ISO date


class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("sub_"))
    user_id: str
    nome: str
    valor: float
    categoria_id: Optional[str] = None
    categoria: str = "Outros"  # display name fallback
    recorrencia: str = "mensal"  # mensal, anual, semanal
    dia_cobranca: int = 1  # 1-31 (mensal) or day-of-week 0-6 (semanal) or day-of-month (anual)
    mes_cobranca: Optional[int] = None  # 1-12, only for anual
    metodo: str = "dinheiro"  # cartao, pix, dinheiro, debito, boleto
    observacoes: str = ""
    status: str = "ativa"  # ativa, inativa
    icone: str = "Repeat"
    cor: str = "#6366f1"
    auto_create_transaction: bool = False
    last_charged_date: Optional[str] = None  # ISO date when last auto-created
    last_used_date: Optional[str] = None  # user-updated "I used it" check
    valor_history: List[PriceChange] = []
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SubscriptionCreate(BaseModel):
    nome: str
    valor: float
    categoria_id: Optional[str] = None
    categoria: str = "Outros"
    recorrencia: str = "mensal"
    dia_cobranca: int = 1
    mes_cobranca: Optional[int] = None
    metodo: str = "dinheiro"
    observacoes: str = ""
    status: str = "ativa"
    icone: str = "Repeat"
    cor: str = "#6366f1"
    auto_create_transaction: bool = False
    tags: List[str] = []


class SubscriptionUpdate(BaseModel):
    nome: Optional[str] = None
    valor: Optional[float] = None
    categoria_id: Optional[str] = None
    categoria: Optional[str] = None
    recorrencia: Optional[str] = None
    dia_cobranca: Optional[int] = None
    mes_cobranca: Optional[int] = None
    metodo: Optional[str] = None
    observacoes: Optional[str] = None
    status: Optional[str] = None
    icone: Optional[str] = None
    cor: Optional[str] = None
    auto_create_transaction: Optional[bool] = None
    last_used_date: Optional[str] = None
    tags: Optional[List[str]] = None


# ============== HELPERS ==============
def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc = {k: v for k, v in doc.items() if k != "_id"}
    for k in ("created_at", "updated_at"):
        if isinstance(doc.get(k), datetime):
            doc[k] = doc[k].isoformat()
    return doc


def _monthly_cost(sub: dict) -> float:
    """Convert any recurrence into equivalent monthly cost."""
    v = float(sub.get("valor") or 0)
    rec = sub.get("recorrencia")
    if rec == "mensal":
        return v
    if rec == "anual":
        return round(v / 12, 2)
    if rec == "semanal":
        return round(v * 52 / 12, 2)
    return v


def _yearly_cost(sub: dict) -> float:
    v = float(sub.get("valor") or 0)
    rec = sub.get("recorrencia")
    if rec == "mensal":
        return round(v * 12, 2)
    if rec == "anual":
        return v
    if rec == "semanal":
        return round(v * 52, 2)
    return v


def _next_billing_date(sub: dict, today: date) -> Optional[date]:
    """Compute the next billing date for an active subscription."""
    if sub.get("status") != "ativa":
        return None
    rec = sub.get("recorrencia")
    dia = int(sub.get("dia_cobranca") or 1)
    if rec == "mensal":
        # next occurrence of dia in this or next month
        try:
            candidate = date(today.year, today.month, min(dia, 28))
        except ValueError:
            candidate = today
        if candidate < today:
            year = today.year + (1 if today.month == 12 else 0)
            month = 1 if today.month == 12 else today.month + 1
            candidate = date(year, month, min(dia, 28))
        return candidate
    if rec == "anual":
        mes = int(sub.get("mes_cobranca") or today.month)
        try:
            candidate = date(today.year, mes, min(dia, 28))
        except ValueError:
            candidate = today
        if candidate < today:
            candidate = date(today.year + 1, mes, min(dia, 28))
        return candidate
    if rec == "semanal":
        # dia_cobranca = 0-6 (Mon=0)
        weekday = dia % 7
        delta = (weekday - today.weekday()) % 7
        if delta == 0:
            delta = 7  # next occurrence (not today)
        return today + timedelta(days=delta)
    return None


def _days_until_next(sub: dict, today: date) -> Optional[int]:
    nb = _next_billing_date(sub, today)
    if nb is None:
        return None
    return (nb - today).days


async def _auto_create_pending_transactions(user_id: str, db) -> int:
    """For each active subscription with auto_create_transaction=True, create
    a transaction every time the billing date passes since last_charged_date."""
    today = date.today()
    subs = await db.subscriptions.find(
        {"user_id": user_id, "status": "ativa", "auto_create_transaction": True},
        {"_id": 0},
    ).to_list(1000)
    created = 0
    for sub in subs:
        last = sub.get("last_charged_date")
        last_dt = date.fromisoformat(last) if last else None
        nb = _next_billing_date(sub, today - timedelta(days=1))  # check if past one fired
        if not nb:
            continue
        # If last_charged < today and a billing date is today or earlier, charge once.
        if (not last_dt or last_dt < nb) and nb <= today:
            tx = Transaction(
                user_id=user_id,
                descricao=f"Assinatura: {sub.get('nome')}",
                categoria=sub.get("categoria") or "Outros",
                categoria_id=sub.get("categoria_id") or "uncategorized",
                valor=float(sub.get("valor") or 0),
                tipo="despesa",
                data=nb.isoformat(),
                data_vencimento=nb.isoformat(),
                metodo=sub.get("metodo"),
                tags=sub.get("tags") or [],
                recorrente=True,
                pago=False,
            )
            doc = tx.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            doc["subscription_id"] = sub.get("id")
            await db.transactions.insert_one(doc)
            await db.subscriptions.update_one(
                {"id": sub["id"], "user_id": user_id},
                {"$set": {"last_charged_date": today.isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}},
            )
            created += 1
    return created


# ============== ROUTES ==============
@router.get("")
async def list_subscriptions(request: Request, db=None, user_id: str = None):
    # Lazy auto-create pending charges
    await _auto_create_pending_transactions(user_id, db)
    docs = await db.subscriptions.find({"user_id": user_id}, {"_id": 0}).sort("nome", 1).to_list(1000)
    today = date.today()
    for d in docs:
        nb = _next_billing_date(d, today)
        d["next_billing_date"] = nb.isoformat() if nb else None
        d["days_until_next"] = _days_until_next(d, today)
        d["monthly_cost"] = _monthly_cost(d)
        d["yearly_cost"] = _yearly_cost(d)
    return [_serialize(d) for d in docs]


@router.post("")
async def create_subscription(data: SubscriptionCreate, request: Request, db=None, user_id: str = None):
    sub = Subscription(user_id=user_id, **data.model_dump())
    today_iso = date.today().isoformat()
    sub.valor_history = [PriceChange(valor=sub.valor, data=today_iso)]
    doc = sub.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db.subscriptions.insert_one(doc)
    return _serialize(doc)


@router.put("/{sub_id}")
async def update_subscription(sub_id: str, data: SubscriptionUpdate, request: Request, db=None, user_id: str = None):
    existing = await db.subscriptions.find_one({"id": sub_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Assinatura nao encontrada")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        return _serialize(existing)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    # If price changed, push to history
    if "valor" in update_data and float(update_data["valor"]) != float(existing.get("valor") or 0):
        history = list(existing.get("valor_history") or [])
        history.append({"valor": float(update_data["valor"]), "data": date.today().isoformat()})
        update_data["valor_history"] = history
    await db.subscriptions.update_one({"id": sub_id, "user_id": user_id}, {"$set": update_data})
    updated = await db.subscriptions.find_one({"id": sub_id, "user_id": user_id}, {"_id": 0})
    return _serialize(updated)


@router.delete("/{sub_id}")
async def delete_subscription(sub_id: str, request: Request, db=None, user_id: str = None):
    r = await db.subscriptions.delete_one({"id": sub_id, "user_id": user_id})
    if not r.deleted_count:
        raise HTTPException(status_code=404, detail="Assinatura nao encontrada")
    return {"message": "Assinatura removida"}


@router.post("/{sub_id}/charge-now")
async def charge_now(sub_id: str, request: Request, db=None, user_id: str = None):
    """Manually trigger a transaction creation for this subscription right now."""
    sub = await db.subscriptions.find_one({"id": sub_id, "user_id": user_id}, {"_id": 0})
    if not sub:
        raise HTTPException(status_code=404, detail="Assinatura nao encontrada")
    today = date.today()
    tx = Transaction(
        user_id=user_id,
        descricao=f"Assinatura: {sub.get('nome')}",
        categoria=sub.get("categoria") or "Outros",
        categoria_id=sub.get("categoria_id") or "uncategorized",
        valor=float(sub.get("valor") or 0),
        tipo="despesa",
        data=today.isoformat(),
        data_vencimento=today.isoformat(),
        metodo=sub.get("metodo"),
        tags=sub.get("tags") or [],
        recorrente=True,
        pago=False,
    )
    doc = tx.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["subscription_id"] = sub_id
    await db.transactions.insert_one(doc)
    await db.subscriptions.update_one(
        {"id": sub_id, "user_id": user_id},
        {"$set": {"last_charged_date": today.isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"message": "Transacao criada", "transaction_id": doc["id"]}


@router.get("/stats")
async def get_stats(request: Request, db=None, user_id: str = None):
    """Return aggregated subscription stats + alerts + insights."""
    today = date.today()
    docs = await db.subscriptions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    actives = [d for d in docs if d.get("status") == "ativa"]

    total_monthly = round(sum(_monthly_cost(d) for d in actives), 2)
    total_yearly = round(sum(_yearly_cost(d) for d in actives), 2)
    count_active = len(actives)
    count_inactive = len(docs) - count_active

    # Top categoria
    cat_totals = {}
    for d in actives:
        cat = d.get("categoria") or "Outros"
        cat_totals[cat] = cat_totals.get(cat, 0) + _monthly_cost(d)
    top_categoria = max(cat_totals.items(), key=lambda kv: kv[1]) if cat_totals else None

    # Upcoming charges (next 30 days)
    upcoming = []
    for d in actives:
        nb = _next_billing_date(d, today)
        if nb and (nb - today).days <= 30:
            upcoming.append({
                "id": d.get("id"),
                "nome": d.get("nome"),
                "valor": d.get("valor"),
                "next_billing_date": nb.isoformat(),
                "days_until": (nb - today).days,
                "cor": d.get("cor"),
                "icone": d.get("icone"),
            })
    upcoming.sort(key=lambda u: u["days_until"])

    # Top recurring spend
    top_recurring = sorted(
        actives, key=lambda d: _monthly_cost(d), reverse=True
    )[:5]
    top_recurring_out = [
        {"id": d.get("id"), "nome": d.get("nome"), "valor": d.get("valor"),
         "monthly_cost": _monthly_cost(d), "cor": d.get("cor"), "icone": d.get("icone")}
        for d in top_recurring
    ]

    # Alerts
    alerts = []
    # 1) Cobranca proxima (within 3 days)
    for u in upcoming:
        if u["days_until"] <= 3:
            alerts.append({
                "type": "billing_soon",
                "severity": "warning",
                "message": f"{u['nome']} sera cobrada em {u['days_until']} dia{'s' if u['days_until'] != 1 else ''}",
                "subscription_id": u["id"],
            })
    # 2) Aumento de preco detectado (last 90 days)
    for d in actives:
        history = d.get("valor_history") or []
        if len(history) >= 2:
            last = history[-1]
            prev = history[-2]
            if float(last.get("valor", 0)) > float(prev.get("valor", 0)):
                diff = float(last["valor"]) - float(prev["valor"])
                pct = (diff / float(prev["valor"])) * 100 if prev["valor"] else 0
                alerts.append({
                    "type": "price_increase",
                    "severity": "warning",
                    "message": f"{d.get('nome')} aumentou {pct:.1f}% (de R$ {prev['valor']:.2f} para R$ {last['valor']:.2f})",
                    "subscription_id": d.get("id"),
                })
    # 3) Sem uso recente (last_used_date > 60 days atras)
    for d in actives:
        lu = d.get("last_used_date")
        if lu:
            try:
                lu_dt = date.fromisoformat(lu)
                days = (today - lu_dt).days
                if days >= 60:
                    alerts.append({
                        "type": "unused",
                        "severity": "info",
                        "message": f"{d.get('nome')} nao foi marcada como usada ha {days} dias",
                        "subscription_id": d.get("id"),
                    })
            except (TypeError, ValueError):
                pass
    # 4) Gasto recorrente alto (uma assinatura > 30% do total mensal)
    if total_monthly > 0:
        for d in actives:
            mc = _monthly_cost(d)
            if mc / total_monthly > 0.3 and mc > 50:
                alerts.append({
                    "type": "high_cost",
                    "severity": "info",
                    "message": f"{d.get('nome')} representa {(mc/total_monthly*100):.0f}% do seu gasto recorrente mensal",
                    "subscription_id": d.get("id"),
                })

    # Detect duplicates (same nome lowercase or similar value+categoria)
    duplicates = []
    seen = {}
    for d in actives:
        key = (d.get("nome") or "").strip().lower()
        if key and key in seen:
            duplicates.append({
                "subscription_id": d.get("id"),
                "duplicate_of": seen[key],
                "nome": d.get("nome"),
            })
        elif key:
            seen[key] = d.get("id")

    # Forecast next month (sum of monthly costs of active subs - same as total_monthly)
    forecast_next_month = total_monthly

    # Tiny subscriptions annual impact
    tiny_subs = [d for d in actives if _monthly_cost(d) < 30]
    tiny_annual_impact = round(sum(_yearly_cost(d) for d in tiny_subs), 2)

    return {
        "total_monthly": total_monthly,
        "total_yearly": total_yearly,
        "count_active": count_active,
        "count_inactive": count_inactive,
        "top_categoria": {"nome": top_categoria[0], "valor": round(top_categoria[1], 2)} if top_categoria else None,
        "upcoming": upcoming,
        "top_recurring": top_recurring_out,
        "alerts": alerts,
        "duplicates": duplicates,
        "forecast_next_month": forecast_next_month,
        "tiny_annual_impact": tiny_annual_impact,
        "tiny_count": len(tiny_subs),
    }
