"""
Credit Card and Installment routes for FinDash
With proper business rules for data consistency
"""
from fastapi import APIRouter, HTTPException, Request
from typing import List
from models import (
    CreditCard, CreditCardCreate, CreditCardUpdate,
    CardInstallment, CardInstallmentCreate, CardInstallmentUpdate,
    CardInstallmentBatchCreate
)
from dateutil.relativedelta import relativedelta
from datetime import datetime

router = APIRouter(prefix="/cards", tags=["cards"])


async def recalculate_card_totals(card_id: str, user_id: str, db):
    """
    Recalcula fatura_atual e usado baseado nas parcelas não pagas
    REGRA: fatura_atual = soma das parcelas não pagas
    REGRA: usado = soma de todas parcelas pendentes
    """
    installments = await db.installments.find(
        {"card_id": card_id, "user_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Soma das parcelas não pagas
    fatura_atual = sum(inst["valor_parcela"] for inst in installments if not inst.get("pago", False))
    usado = fatura_atual  # usado = parcelas pendentes
    
    await db.cards.update_one(
        {"id": card_id, "user_id": user_id},
        {"$set": {"fatura_atual": fatura_atual, "usado": usado}}
    )
    
    return {"fatura_atual": fatura_atual, "usado": usado}


# ============== CREDIT CARDS ==============
@router.get("", response_model=List[CreditCard])
async def get_cards(request: Request, db=None, user_id: str = None):
    """Get all credit cards for current user with recalculated totals"""
    cards = await db.cards.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    if not cards:
        return cards
    
    card_ids = [c["id"] for c in cards]
    
    # Batch: buscar todas parcelas de todos os cartoes de uma vez
    all_installments = await db.installments.find(
        {"card_id": {"$in": card_ids}, "user_id": user_id},
        {"_id": 0, "card_id": 1, "valor_parcela": 1, "pago": 1}
    ).to_list(10000)
    
    # Batch: buscar todos os bancos de uma vez
    banco_ids = [c["banco_id"] for c in cards if c.get("banco_id")]
    account_map = {}
    if banco_ids:
        accounts_list = await db.accounts.find({"id": {"$in": banco_ids}}, {"_id": 0}).to_list(1000)
        account_map = {a["id"]: a for a in accounts_list}
    
    # Calcular totais por cartao em memoria
    for card in cards:
        card_installments = [i for i in all_installments if i["card_id"] == card["id"]]
        unpaid = [i for i in card_installments if not i.get("pago")]
        fatura_atual = sum(i["valor_parcela"] for i in unpaid)
        usado = sum(i["valor_parcela"] for i in card_installments)
        card["fatura_atual"] = fatura_atual
        card["usado"] = usado
        card["banco_nome"] = account_map.get(card.get("banco_id"), {}).get("nome") if card.get("banco_id") else None
        
        # Atualizar no DB
        await db.cards.update_one(
            {"id": card["id"], "user_id": user_id},
            {"$set": {"fatura_atual": fatura_atual, "usado": usado}}
        )
    
    return cards


@router.post("", response_model=CreditCard)
async def create_card(data: CreditCardCreate, request: Request, db=None, user_id: str = None):
    """Create a new credit card. Requires linked bank account and exactly 4 digits."""
    # Require bank account
    if not data.banco_id:
        raise HTTPException(status_code=400, detail="Cartao deve estar vinculado a uma conta bancaria")
    bank = await db.accounts.find_one({"id": data.banco_id, "user_id": user_id}, {"_id": 0})
    if not bank:
        raise HTTPException(status_code=400, detail="Conta bancaria informada nao encontrada")

    # Validate last 4 digits
    numero = (data.numero or "").strip()
    if not (numero.isdigit() and len(numero) == 4):
        raise HTTPException(status_code=400, detail="Informe exatamente os 4 ultimos digitos do cartao")

    card = CreditCard(user_id=user_id, **data.model_dump())
    card.numero = numero
    doc = card.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.cards.insert_one(doc)
    return card


@router.put("/{card_id}", response_model=CreditCard)
async def update_card(card_id: str, data: CreditCardUpdate, request: Request, db=None, user_id: str = None):
    """Update a credit card"""
    existing = await db.cards.find_one({"id": card_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Card not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if "banco_id" in update_data:
        if not update_data["banco_id"]:
            raise HTTPException(status_code=400, detail="Cartao deve estar vinculado a uma conta bancaria")
        bank = await db.accounts.find_one({"id": update_data["banco_id"], "user_id": user_id}, {"_id": 0})
        if not bank:
            raise HTTPException(status_code=400, detail="Conta bancaria informada nao encontrada")

    if "numero" in update_data:
        numero = (update_data["numero"] or "").strip()
        if not (numero.isdigit() and len(numero) == 4):
            raise HTTPException(status_code=400, detail="Informe exatamente os 4 ultimos digitos do cartao")
        update_data["numero"] = numero

    if update_data:
        await db.cards.update_one({"id": card_id, "user_id": user_id}, {"$set": update_data})
    
    updated = await db.cards.find_one({"id": card_id}, {"_id": 0})
    return updated


@router.delete("/{card_id}")
async def delete_card(card_id: str, request: Request, db=None, user_id: str = None):
    """Delete a credit card and all its installments"""
    result = await db.cards.delete_one({"id": card_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Card not found")
    # Also delete related installments
    await db.installments.delete_many({"card_id": card_id, "user_id": user_id})
    return {"message": "Card deleted"}


@router.post("/{card_id}/pay-invoice")
async def pay_invoice(card_id: str, request: Request, db=None, user_id: str = None):
    """
    Pay the full invoice of a card
    REGRA: Marca todas as parcelas como pagas
    REGRA: Zera fatura_atual e usado
    """
    card = await db.cards.find_one({"id": card_id, "user_id": user_id}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Marca todas as parcelas não pagas como pagas
    result = await db.installments.update_many(
        {"card_id": card_id, "user_id": user_id, "pago": False},
        {"$set": {"pago": True}}
    )
    
    # Recalcula totais (deve ser zero após pagar tudo)
    totals = await recalculate_card_totals(card_id, user_id, db)
    
    return {
        "message": "Invoice paid",
        "parcelas_pagas": result.modified_count,
        "fatura_atual": totals["fatura_atual"],
        "usado": totals["usado"]
    }


# ============== INSTALLMENTS ==============
@router.get("/{card_id}/installments", response_model=List[CardInstallment])
async def get_installments(card_id: str, request: Request, db=None, user_id: str = None):
    """Get all installments for a card"""
    installments = await db.installments.find(
        {"card_id": card_id, "user_id": user_id},
        {"_id": 0}
    ).to_list(1000)
    return installments


@router.get("/installments/all", response_model=List[CardInstallment])
async def get_all_installments(request: Request, db=None, user_id: str = None):
    """Get all installments for current user"""
    installments = await db.installments.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    return installments


@router.post("/installments", response_model=CardInstallment)
async def create_installment(data: CardInstallmentCreate, request: Request, db=None, user_id: str = None):
    """
    Create a new installment
    REGRA: Adiciona valor_parcela à fatura_atual e usado do cartão
    """
    # Verify card exists
    card = await db.cards.find_one({"id": data.card_id, "user_id": user_id}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=400, detail="Card not found")
    
    installment = CardInstallment(user_id=user_id, **data.model_dump())
    doc = installment.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.installments.insert_one(doc)
    
    # Recalcula totais do cartão
    await recalculate_card_totals(data.card_id, user_id, db)
    
    return installment


@router.put("/installments/{installment_id}", response_model=CardInstallment)
async def update_installment(installment_id: str, data: CardInstallmentUpdate, request: Request, db=None, user_id: str = None):
    """Update an installment"""
    existing = await db.installments.find_one({"id": installment_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Installment not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.installments.update_one({"id": installment_id, "user_id": user_id}, {"$set": update_data})
    
    # Recalcula totais do cartão
    await recalculate_card_totals(existing["card_id"], user_id, db)
    
    updated = await db.installments.find_one({"id": installment_id}, {"_id": 0})
    return updated


@router.post("/installments/{installment_id}/pay")
async def pay_installment(installment_id: str, request: Request, db=None, user_id: str = None):
    """
    Pay a single installment
    REGRA: Marca a parcela como paga
    REGRA: Recalcula fatura_atual e usado do cartão
    """
    installment = await db.installments.find_one({"id": installment_id, "user_id": user_id}, {"_id": 0})
    if not installment:
        raise HTTPException(status_code=404, detail="Installment not found")
    
    if installment["pago"]:
        return {"message": "Installment already paid", "already_paid": True}
    
    # Marca como paga
    await db.installments.update_one(
        {"id": installment_id, "user_id": user_id},
        {"$set": {"pago": True}}
    )
    
    # Recalcula totais do cartão
    totals = await recalculate_card_totals(installment["card_id"], user_id, db)
    
    return {
        "message": "Installment paid",
        "valor_pago": installment["valor_parcela"],
        "fatura_atual": totals["fatura_atual"],
        "usado": totals["usado"]
    }


@router.delete("/installments/{installment_id}")
async def delete_installment(installment_id: str, request: Request, db=None, user_id: str = None):
    """Delete an installment and recalculate card totals"""
    existing = await db.installments.find_one({"id": installment_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Installment not found")
    
    card_id = existing["card_id"]
    
    result = await db.installments.delete_one({"id": installment_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Installment not found")
    
    # Recalcula totais do cartão
    await recalculate_card_totals(card_id, user_id, db)
    
    return {"message": "Installment deleted"}


@router.post("/installments/batch")
async def create_installment_batch(data: CardInstallmentBatchCreate, request: Request, db=None, user_id: str = None):
    """
    Create multiple installments for a credit card purchase
    REGRA: Gera N parcelas mensais, deduz valor_total do limite do cartão
    """
    card = await db.cards.find_one({"id": data.card_id, "user_id": user_id}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=400, detail="Card not found")
    
    valor_parcela = round(data.valor_total / data.total_parcelas, 2)
    created = []
    
    base_date = datetime.strptime(data.data, "%Y-%m-%d")
    
    for i in range(data.total_parcelas):
        install_date = (base_date + relativedelta(months=i)).strftime("%Y-%m-%d")
        
        installment = CardInstallment(
            user_id=user_id,
            card_id=data.card_id,
            descricao=data.descricao,
            valor_parcela=valor_parcela,
            parcela_atual=i + 1,
            total_parcelas=data.total_parcelas,
            valor_total=data.valor_total,
            data=install_date,
            pago=False
        )
        doc = installment.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.installments.insert_one(doc)
        created.append(installment)
    
    # Recalcula totais do cartão uma vez no final
    totals = await recalculate_card_totals(data.card_id, user_id, db)
    
    return {
        "message": f"{data.total_parcelas} parcelas criadas",
        "count": data.total_parcelas,
        "valor_parcela": valor_parcela,
        "fatura_atual": totals["fatura_atual"],
        "usado": totals["usado"]
    }
