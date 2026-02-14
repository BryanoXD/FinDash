"""
Credit Card and Installment routes for FinDash
"""
from fastapi import APIRouter, HTTPException, Request
from typing import List
from models import (
    CreditCard, CreditCardCreate, CreditCardUpdate,
    CardInstallment, CardInstallmentCreate, CardInstallmentUpdate
)

router = APIRouter(prefix="/cards", tags=["cards"])


# ============== CREDIT CARDS ==============
@router.get("", response_model=List[CreditCard])
async def get_cards(request: Request, db=None, user_id: str = None):
    """Get all credit cards for current user"""
    cards = await db.cards.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    # Add banco_nome for each card
    for card in cards:
        if card.get("banco_id"):
            account = await db.accounts.find_one({"id": card["banco_id"]}, {"_id": 0})
            card["banco_nome"] = account["nome"] if account else None
    
    return cards


@router.post("", response_model=CreditCard)
async def create_card(data: CreditCardCreate, request: Request, db=None, user_id: str = None):
    """Create a new credit card"""
    card = CreditCard(user_id=user_id, **data.model_dump())
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
    if update_data:
        await db.cards.update_one({"id": card_id, "user_id": user_id}, {"$set": update_data})
    
    updated = await db.cards.find_one({"id": card_id}, {"_id": 0})
    return updated


@router.delete("/{card_id}")
async def delete_card(card_id: str, request: Request, db=None, user_id: str = None):
    """Delete a credit card"""
    result = await db.cards.delete_one({"id": card_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Card not found")
    # Also delete related installments
    await db.installments.delete_many({"card_id": card_id, "user_id": user_id})
    return {"message": "Card deleted"}


@router.post("/{card_id}/pay-invoice")
async def pay_invoice(card_id: str, request: Request, db=None, user_id: str = None):
    """Pay the full invoice of a card"""
    card = await db.cards.find_one({"id": card_id, "user_id": user_id}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Mark all unpaid installments as paid
    await db.installments.update_many(
        {"card_id": card_id, "user_id": user_id, "pago": False},
        {"$set": {"pago": True}}
    )
    
    # Reset card fatura
    await db.cards.update_one(
        {"id": card_id, "user_id": user_id},
        {"$set": {"fatura_atual": 0}}
    )
    
    return {"message": "Invoice paid"}


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
    """Create a new installment"""
    # Verify card exists
    card = await db.cards.find_one({"id": data.card_id, "user_id": user_id}, {"_id": 0})
    if not card:
        raise HTTPException(status_code=400, detail="Card not found")
    
    installment = CardInstallment(user_id=user_id, **data.model_dump())
    doc = installment.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.installments.insert_one(doc)
    
    # Update card fatura
    await db.cards.update_one(
        {"id": data.card_id, "user_id": user_id},
        {"$inc": {"fatura_atual": data.valor_parcela, "usado": data.valor_parcela}}
    )
    
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
    
    updated = await db.installments.find_one({"id": installment_id}, {"_id": 0})
    return updated


@router.post("/installments/{installment_id}/pay")
async def pay_installment(installment_id: str, request: Request, db=None, user_id: str = None):
    """Pay a single installment"""
    installment = await db.installments.find_one({"id": installment_id, "user_id": user_id}, {"_id": 0})
    if not installment:
        raise HTTPException(status_code=404, detail="Installment not found")
    
    if installment["pago"]:
        return {"message": "Installment already paid"}
    
    # Mark as paid
    await db.installments.update_one(
        {"id": installment_id, "user_id": user_id},
        {"$set": {"pago": True}}
    )
    
    # Update card fatura
    await db.cards.update_one(
        {"id": installment["card_id"], "user_id": user_id},
        {"$inc": {"fatura_atual": -installment["valor_parcela"]}}
    )
    
    return {"message": "Installment paid"}


@router.delete("/installments/{installment_id}")
async def delete_installment(installment_id: str, request: Request, db=None, user_id: str = None):
    """Delete an installment"""
    result = await db.installments.delete_one({"id": installment_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Installment not found")
    return {"message": "Installment deleted"}
