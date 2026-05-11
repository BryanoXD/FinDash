"""
Planejamentos routes for FinDash

A planejamento is a Notion-style document with:
- markdown notes (descricao_md)
- orcamentos (each can be auto-linked to a financial goal)
- lista_compras (shopping list with checkable items)
- comparadores (price comparators)
- checklists (task checklists)

Each orcamento may have `criar_meta=True` and a `goal_id` that links it
to a record in the `goals` collection. When the orcamento is updated, the
linked goal's `valor_meta` and `nome` are kept in sync. When the orcamento
is deleted, the caller decides if the linked goal should be deleted too.
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone

from models import generate_id, FinancialGoal

router = APIRouter(prefix="/planejamentos", tags=["planejamentos"])


# ============== Block models (embedded inside a Planejamento doc) ==============
class OrcamentoItem(BaseModel):
    nome: str
    valor: float = 0
    quantidade: int = 1


class Orcamento(BaseModel):
    id: str = Field(default_factory=lambda: generate_id("orc_"))
    titulo: str
    items: List[OrcamentoItem] = []


class ListaCompraItem(BaseModel):
    nome: str
    quantidade: int = 1
    preco: float = 0
    comprado: bool = False


class ListaCompra(BaseModel):
    id: str = Field(default_factory=lambda: generate_id("lst_"))
    titulo: str
    items: List[ListaCompraItem] = []


class ComparadorOpcao(BaseModel):
    loja: str
    preco: float = 0
    link: Optional[str] = ""


class Comparador(BaseModel):
    id: str = Field(default_factory=lambda: generate_id("cmp_"))
    titulo: str
    produto: str = ""
    opcoes: List[ComparadorOpcao] = []


class ChecklistItem(BaseModel):
    texto: str
    feito: bool = False


class Checklist(BaseModel):
    id: str = Field(default_factory=lambda: generate_id("chk_"))
    titulo: str
    items: List[ChecklistItem] = []


# ============== Planejamento (top-level doc) ==============
class Planejamento(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("plan_"))
    user_id: str
    titulo: str
    descricao_md: str = ""
    cor: str = "#6366f1"
    icone: str = "FileText"
    orcamentos: List[Orcamento] = []
    listas: List[ListaCompra] = []
    comparadores: List[Comparador] = []
    checklists: List[Checklist] = []
    # Single goal linked to the entire planejamento (sum of all orcamentos)
    criar_meta: bool = False
    goal_id: Optional[str] = None
    prazo: Optional[str] = None  # ISO date used when (re)creating the linked goal
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PlanejamentoCreate(BaseModel):
    titulo: str
    descricao_md: str = ""
    cor: str = "#6366f1"
    icone: str = "FileText"
    criar_meta: bool = False
    prazo: Optional[str] = None


class PlanejamentoUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao_md: Optional[str] = None
    cor: Optional[str] = None
    icone: Optional[str] = None
    orcamentos: Optional[List[Orcamento]] = None
    listas: Optional[List[ListaCompra]] = None
    comparadores: Optional[List[Comparador]] = None
    checklists: Optional[List[Checklist]] = None
    criar_meta: Optional[bool] = None
    prazo: Optional[str] = None


# ============== Helpers ==============
def _orc_total(orc: dict) -> float:
    total = 0.0
    for it in orc.get("items", []) or []:
        try:
            total += float(it.get("valor", 0)) * int(it.get("quantidade", 1) or 1)
        except (TypeError, ValueError):
            continue
    return round(total, 2)


def _serialize_plan(doc: dict) -> dict:
    """Strip MongoDB internals and normalize datetimes for response."""
    if not doc:
        return doc
    doc = {k: v for k, v in doc.items() if k != "_id"}
    for k in ("created_at", "updated_at"):
        if isinstance(doc.get(k), datetime):
            doc[k] = doc[k].isoformat()
    return doc


def _plan_total(plan: dict) -> float:
    """Sum of every orcamento total."""
    return round(sum(_orc_total(o) for o in (plan.get("orcamentos") or [])), 2)


async def _sync_plan_goal(plan: dict, db) -> dict:
    """
    Ensure the planejamento's linked Meta financeira is in sync.

    - If `criar_meta` is True and no `goal_id`, create a new goal.
    - If `criar_meta` is True and `goal_id` exists, update its nome/valor_meta/prazo.
    - If `criar_meta` is False, leave `goal_id` as-is (caller may detach via separate endpoint).

    The goal's `valor_meta` is always the sum of all orcamento totals.
    """
    user_id = plan["user_id"]
    titulo = plan.get("titulo") or "Planejamento"
    total = _plan_total(plan)
    prazo = plan.get("prazo") or "2030-12-31"

    if not plan.get("criar_meta"):
        return plan

    existing_goal_id = plan.get("goal_id")
    if existing_goal_id:
        existing = await db.goals.find_one(
            {"id": existing_goal_id, "user_id": user_id}, {"_id": 0}
        )
        if existing:
            await db.goals.update_one(
                {"id": existing_goal_id, "user_id": user_id},
                {"$set": {"nome": titulo, "valor_meta": total, "prazo": prazo}},
            )
            return plan
        # Stale reference - fall through to create

    goal = FinancialGoal(
        user_id=user_id,
        nome=titulo,
        valor_meta=total,
        prazo=prazo,
        icone="Target",
    )
    doc = goal.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["planejamento_id"] = plan.get("id")
    await db.goals.insert_one(doc)
    plan["goal_id"] = goal.id
    return plan


# ============== Routes ==============
@router.get("")
async def get_planejamentos(request: Request, db=None, user_id: str = None):
    """List all planejamentos for current user."""
    docs = await db.planejamentos.find({"user_id": user_id}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return [_serialize_plan(d) for d in docs]


@router.post("")
async def create_planejamento(data: PlanejamentoCreate, request: Request, db=None, user_id: str = None):
    """Create a new (empty) planejamento. May immediately create a linked Meta if criar_meta=true."""
    plan = Planejamento(user_id=user_id, **data.model_dump())
    doc = plan.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    if doc.get("criar_meta"):
        doc = await _sync_plan_goal(doc, db)
    await db.planejamentos.insert_one(doc)
    return _serialize_plan(doc)


@router.get("/{plan_id}")
async def get_planejamento(plan_id: str, request: Request, db=None, user_id: str = None):
    doc = await db.planejamentos.find_one({"id": plan_id, "user_id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Planejamento nao encontrado")
    return _serialize_plan(doc)


@router.put("/{plan_id}")
async def update_planejamento(plan_id: str, data: PlanejamentoUpdate, request: Request, db=None, user_id: str = None):
    """
    Update planejamento. If `criar_meta` is True (now or already), the linked Meta
    is kept in sync with the sum of all orcamento totals and the current titulo.
    """
    existing = await db.planejamentos.find_one({"id": plan_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Planejamento nao encontrado")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        return _serialize_plan(existing)

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Merge incoming into existing to determine final state for goal sync
    merged = {**existing, **update_data}

    # Trigger sync when anything that affects the linked goal changes
    if any(k in update_data for k in ("orcamentos", "titulo", "criar_meta", "prazo")):
        merged = await _sync_plan_goal(merged, db)
        update_data["goal_id"] = merged.get("goal_id")

    await db.planejamentos.update_one(
        {"id": plan_id, "user_id": user_id},
        {"$set": update_data},
    )

    final = await db.planejamentos.find_one({"id": plan_id, "user_id": user_id}, {"_id": 0})
    return _serialize_plan(final)


@router.delete("/{plan_id}")
async def delete_planejamento(plan_id: str, request: Request, db=None, user_id: str = None):
    """
    Delete a planejamento.

    Query param `delete_linked_goals=true` will also delete the linked Meta.
    """
    delete_goals = request.query_params.get("delete_linked_goals", "false").lower() == "true"

    existing = await db.planejamentos.find_one({"id": plan_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Planejamento nao encontrado")

    deleted_goals = []
    if delete_goals:
        gid = existing.get("goal_id")
        if gid:
            r = await db.goals.delete_one({"id": gid, "user_id": user_id})
            if r.deleted_count:
                deleted_goals.append(gid)

    await db.planejamentos.delete_one({"id": plan_id, "user_id": user_id})
    return {"message": "Planejamento removido", "deleted_goals": deleted_goals}


@router.delete("/{plan_id}/goal")
async def delete_plan_goal(plan_id: str, request: Request, db=None, user_id: str = None):
    """Detach and delete the Meta linked to this planejamento."""
    plan = await db.planejamentos.find_one({"id": plan_id, "user_id": user_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Planejamento nao encontrado")

    gid = plan.get("goal_id")
    deleted = False
    if gid:
        r = await db.goals.delete_one({"id": gid, "user_id": user_id})
        deleted = r.deleted_count > 0

    await db.planejamentos.update_one(
        {"id": plan_id, "user_id": user_id},
        {"$set": {
            "goal_id": None,
            "criar_meta": False,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
    )
    return {"message": "Meta vinculada removida", "deleted": deleted, "goal_id": gid}
