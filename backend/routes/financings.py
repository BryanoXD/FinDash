"""
Financing routes for FinDash
"""
from fastapi import APIRouter, HTTPException, Request
from typing import List
from models import Financing, FinancingCreate, FinancingUpdate

router = APIRouter(prefix="/financings", tags=["financings"])


@router.get("", response_model=List[Financing])
async def get_financings(request: Request, db=None, user_id: str = None):
    """Get all financings for current user"""
    financings = await db.financings.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    # Add banco_nome for each financing
    for fin in financings:
        if fin.get("banco_id"):
            account = await db.accounts.find_one({"id": fin["banco_id"]}, {"_id": 0})
            fin["banco_nome"] = account["nome"] if account else None
    
    return financings


@router.post("", response_model=Financing)
async def create_financing(data: FinancingCreate, request: Request, db=None, user_id: str = None):
    """Create a new financing"""
    financing = Financing(user_id=user_id, **data.model_dump())
    doc = financing.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.financings.insert_one(doc)
    return financing


@router.put("/{financing_id}", response_model=Financing)
async def update_financing(financing_id: str, data: FinancingUpdate, request: Request, db=None, user_id: str = None):
    """Update a financing"""
    existing = await db.financings.find_one({"id": financing_id, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Financing not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.financings.update_one({"id": financing_id, "user_id": user_id}, {"$set": update_data})
    
    updated = await db.financings.find_one({"id": financing_id}, {"_id": 0})
    return updated


@router.delete("/{financing_id}")
async def delete_financing(financing_id: str, request: Request, db=None, user_id: str = None):
    """Delete a financing"""
    result = await db.financings.delete_one({"id": financing_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Financing not found")
    return {"message": "Financing deleted"}


@router.post("/{financing_id}/pay-installment")
async def pay_financing_installment(financing_id: str, request: Request, db=None, user_id: str = None):
    """Pay a financing installment"""
    financing = await db.financings.find_one({"id": financing_id, "user_id": user_id}, {"_id": 0})
    if not financing:
        raise HTTPException(status_code=404, detail="Financing not found")
    
    if financing["parcela_atual"] >= financing["parcelas"]:
        return {"message": "Financing already paid off"}
    
    new_parcela = financing["parcela_atual"] + 1
    new_valor_pago = financing["valor_pago"] + financing["valor_parcela"]
    status = "quitado" if new_parcela >= financing["parcelas"] else "ativo"
    
    await db.financings.update_one(
        {"id": financing_id, "user_id": user_id},
        {"$set": {"parcela_atual": new_parcela, "valor_pago": new_valor_pago, "status": status}}
    )
    
    return {"message": "Installment paid", "parcela_atual": new_parcela, "status": status}


@router.post("/{financing_id}/pay-custom")
async def pay_financing_custom(financing_id: str, request: Request, db=None, user_id: str = None):
    """Pay a custom amount toward a financing"""
    body = await request.json()
    valor = body.get("valor", 0)
    if valor <= 0:
        raise HTTPException(status_code=400, detail="Valor must be positive")
    
    financing = await db.financings.find_one({"id": financing_id, "user_id": user_id}, {"_id": 0})
    if not financing:
        raise HTTPException(status_code=404, detail="Financing not found")
    
    new_valor_pago = financing["valor_pago"] + valor
    new_parcela = financing["parcela_atual"] + 1
    status = "quitado" if new_valor_pago >= financing["valor_total"] else "ativo"
    
    await db.financings.update_one(
        {"id": financing_id, "user_id": user_id},
        {"$set": {"valor_pago": new_valor_pago, "parcela_atual": new_parcela, "status": status}}
    )
    
    return {"message": "Payment applied", "valor_pago": new_valor_pago, "parcela_atual": new_parcela, "status": status}
