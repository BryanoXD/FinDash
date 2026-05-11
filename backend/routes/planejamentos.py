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
    criar_meta: bool = False
    goal_id: Optional[str] = None
    prazo: Optional[str] = None  # ISO date, optional; used when creating linked goal


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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PlanejamentoCreate(BaseModel):
    titulo: str
    descricao_md: str = ""
    cor: str = "#6366f1"
    icone: str = "FileText"


class PlanejamentoUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao_md: Optional[str] = None
    cor: Optional[str] = None
    icone: Optional[str] = None
    orcamentos: Optional[List[Orcamento]] = None
    listas: Optional[List[ListaCompra]] = None
    comparadores: Optional[List[Comparador]] = None
    checklists: Optional[List[Checklist]] = None


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


async def _create_or_update_linked_goal(orc: dict, plan_titulo: str, user_id: str, db) -> Optional[str]:
    """
    If `criar_meta` is True, ensure a goal exists and is in sync with the orcamento.
    Returns the goal_id (existing or newly created), or None if no goal should exist.
    """
    if not orc.get("criar_meta"):
        return orc.get("goal_id")  # leave as-is

    total = _orc_total(orc)
    goal_nome = f"{plan_titulo} - {orc.get('titulo') or 'Orcamento'}"
    prazo = orc.get("prazo") or "2030-12-31"

    existing_goal_id = orc.get("goal_id")
    if existing_goal_id:
        existing = await db.goals.find_one({"id": existing_goal_id, "user_id": user_id}, {"_id": 0})
        if existing:
            await db.goals.update_one(
                {"id": existing_goal_id, "user_id": user_id},
                {"$set": {"nome": goal_nome, "valor_meta": total, "prazo": prazo}},
            )
            return existing_goal_id

    # Create new goal
    goal = FinancialGoal(
        user_id=user_id,
        nome=goal_nome,
        valor_meta=total,
        prazo=prazo,
        icone="Target",
    )
    doc = goal.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["planejamento_orcamento_id"] = orc.get("id")
    await db.goals.insert_one(doc)
    return goal.id


async def _sync_goals_for_plan(plan_doc: dict, db) -> dict:
    """Walk through orcamentos and sync each linked goal. Returns updated plan_doc."""
    user_id = plan_doc["user_id"]
    titulo = plan_doc.get("titulo") or "Planejamento"
    orcamentos = plan_doc.get("orcamentos") or []
    for orc in orcamentos:
        if orc.get("criar_meta"):
            goal_id = await _create_or_update_linked_goal(orc, titulo, user_id, db)
            orc["goal_id"] = goal_id
        else:
            # Toggle was turned OFF — keep goal_id but do not auto-update goal.
            # If user wants to delete the linked goal, they do it via the dedicated endpoint.
            pass
    plan_doc["orcamentos"] = orcamentos
    return plan_doc


# ============== Routes ==============
@router.get("")
async def get_planejamentos(request: Request, db=None, user_id: str = None):
    """List all planejamentos for current user."""
    docs = await db.planejamentos.find({"user_id": user_id}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return [_serialize_plan(d) for d in docs]


@router.post("")
async def create_planejamento(data: PlanejamentoCreate, request: Request, db=None, user_id: str = None):
    """Create a new (empty) planejamento."""
    plan = Planejamento(user_id=user_id, **data.model_dump())
    doc = plan.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
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
    Update planejamento. If `orcamentos` are passed, each orcamento with
    `criar_meta=True` will be synced with its linked goal (create or update).
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

    if "orcamentos" in update_data or "titulo" in update_data:
        merged = await _sync_goals_for_plan(merged, db)
        update_data["orcamentos"] = merged.get("orcamentos", [])

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

    Query param `delete_linked_goals=true` will also delete every linked goal.
    """
    delete_goals = request.query_params.get("delete_linked_goals", "false").lower() == "true"

    existing = await db.planejamentos.find_one({"id": plan_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Planejamento nao encontrado")

    deleted_goals = []
    if delete_goals:
        for orc in existing.get("orcamentos", []) or []:
            gid = orc.get("goal_id")
            if gid:
                r = await db.goals.delete_one({"id": gid, "user_id": user_id})
                if r.deleted_count:
                    deleted_goals.append(gid)

    await db.planejamentos.delete_one({"id": plan_id, "user_id": user_id})
    return {"message": "Planejamento removido", "deleted_goals": deleted_goals}


@router.delete("/{plan_id}/orcamentos/{orc_id}/goal")
async def delete_orcamento_goal(plan_id: str, orc_id: str, request: Request, db=None, user_id: str = None):
    """Detach a goal from an orcamento and delete it."""
    plan = await db.planejamentos.find_one({"id": plan_id, "user_id": user_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Planejamento nao encontrado")

    orcs = plan.get("orcamentos", []) or []
    target = next((o for o in orcs if o.get("id") == orc_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Orcamento nao encontrado")

    gid = target.get("goal_id")
    deleted = False
    if gid:
        r = await db.goals.delete_one({"id": gid, "user_id": user_id})
        deleted = r.deleted_count > 0
    target["goal_id"] = None
    target["criar_meta"] = False

    await db.planejamentos.update_one(
        {"id": plan_id, "user_id": user_id},
        {"$set": {"orcamentos": orcs, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"message": "Meta vinculada removida", "deleted": deleted, "goal_id": gid}
