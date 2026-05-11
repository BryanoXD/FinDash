"""
FinDash Backend API Server
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import httpx
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Load env FIRST
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import routes
from routes import auth, categories, tags, transactions, accounts, cards, investments, financings, budgets, goals
from routes import imports as imports_route
from routes import planejamentos as planejamentos_route
from routes import subscriptions as subscriptions_route
from routes.auth import get_current_user_id
from models import User, UserSession
from seed import seed_user_data

# Auth service URL from env
EMERGENT_AUTH_URL = os.environ['EMERGENT_AUTH_URL']

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="FinDash API", version="1.0.0")

# CORS - must be added BEFORE routes; restrict to frontend origin in production
frontend_url = os.environ.get('FRONTEND_URL', '')
allowed_origins = [frontend_url] if frontend_url else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Middleware to inject db and user_id into routes
@app.middleware("http")
async def inject_db_middleware(request: Request, call_next):
    request.state.db = db
    response = await call_next(request)
    return response


# Dependency injection for routes
def setup_route_dependencies():
    """Setup db injection for all route modules"""
    # Auth routes need db
    original_create_session = auth.create_session
    async def create_session_with_db(request: Request, response):
        return await original_create_session(request, response, db=db)
    auth.router.routes = [r for r in auth.router.routes if r.path != "/session" or r.methods != {"POST"}]
    auth.router.post("/session")(create_session_with_db)
    
    original_get_me = auth.get_current_user
    async def get_me_with_db(request: Request):
        return await original_get_me(request, db=db)
    auth.router.routes = [r for r in auth.router.routes if r.path != "/me" or r.methods != {"GET"}]
    auth.router.get("/me")(get_me_with_db)
    
    original_logout = auth.logout
    async def logout_with_db(request: Request, response):
        return await original_logout(request, response, db=db)
    auth.router.routes = [r for r in auth.router.routes if r.path != "/logout" or r.methods != {"POST"}]
    auth.router.post("/logout")(logout_with_db)


# Create wrapper functions for protected routes
def create_protected_wrapper(original_func, needs_user_id=True):
    """Create a wrapper that injects db and optionally user_id"""
    async def wrapper(request: Request, *args, **kwargs):
        if needs_user_id:
            user_id = await get_current_user_id(request, db)
            return await original_func(*args, request=request, db=db, user_id=user_id, **kwargs)
        return await original_func(*args, request=request, db=db, **kwargs)
    return wrapper


# Override route handlers with db/user_id injection
@app.on_event("startup")
async def startup_event():
    """Setup route dependencies on startup"""
    logger.info("FinDash API starting up...")
    
    # Create indexes for better query performance
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.categories.create_index([("user_id", 1), ("id", 1)])
    await db.tags.create_index([("user_id", 1), ("id", 1)])
    await db.transactions.create_index([("user_id", 1), ("data", -1)])
    await db.accounts.create_index([("user_id", 1), ("id", 1)])
    await db.cards.create_index([("user_id", 1), ("id", 1)])
    await db.installments.create_index([("user_id", 1), ("card_id", 1)])
    await db.investments.create_index([("user_id", 1), ("id", 1)])
    await db.contributions.create_index([("user_id", 1), ("investimento_id", 1)])
    await db.financings.create_index([("user_id", 1), ("id", 1)])
    await db.budgets.create_index([("user_id", 1), ("categoria_id", 1)])
    await db.goals.create_index([("user_id", 1), ("id", 1)])
    
    logger.info("Database indexes created")


# Root endpoint
@app.get("/api")
async def root():
    return {"message": "FinDash API v1.0.0", "status": "running"}


# Health check
@app.get("/api/health")
async def health_check():
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}


# ============== AUTH ROUTES (special handling) ==============
@app.post("/api/auth/session")
async def auth_session(request: Request):
    from routes.auth import get_session_token_from_request
    
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    
    # Get user data from Emergent Auth (URL from env)
    async with httpx.AsyncClient() as http_client:
        try:
            auth_response = await http_client.get(
                EMERGENT_AUTH_URL,
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            user_data = auth_response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Auth service error: {str(e)}")
    
    email = user_data.get("email")
    name = user_data.get("name")
    picture = user_data.get("picture")
    session_token = user_data.get("session_token")
    
    if not email or not session_token:
        raise HTTPException(status_code=400, detail="Invalid auth response")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = User(user_id=user_id, email=email, name=name, picture=picture)
        user_doc = user.model_dump()
        user_doc["created_at"] = user_doc["created_at"].isoformat()
        await db.users.insert_one(user_doc)
        await seed_user_data(user_id, db)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session = UserSession(user_id=user_id, session_token=session_token, expires_at=expires_at)
    session_doc = session.model_dump()
    session_doc["expires_at"] = session_doc["expires_at"].isoformat()
    session_doc["created_at"] = session_doc["created_at"].isoformat()
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Get user data
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    # Create response with cookie
    response = JSONResponse(content={"user": user_doc, "message": "Session created successfully"})
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    return response


@app.get("/api/auth/me")
async def auth_me(request: Request):
    from routes.auth import get_current_user
    return await get_current_user(request, db=db)


@app.post("/api/auth/logout")
async def auth_logout(request: Request):
    from routes.auth import get_session_token_from_request
    
    session_token = get_session_token_from_request(request)
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    return response


# ============== CATEGORIES ROUTES ==============
@app.get("/api/categories")
async def get_categories(request: Request):
    user_id = await get_current_user_id(request, db)
    return await categories.get_categories(request, db=db, user_id=user_id)


@app.post("/api/categories")
async def create_category(data: categories.CategoryCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await categories.create_category(data, request, db=db, user_id=user_id)


@app.put("/api/categories/{category_id}")
async def update_category(category_id: str, data: categories.CategoryUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await categories.update_category(category_id, data, request, db=db, user_id=user_id)


@app.delete("/api/categories/{category_id}")
async def delete_category(category_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await categories.delete_category(category_id, request, db=db, user_id=user_id)


# ============== TAGS ROUTES ==============
@app.get("/api/tags")
async def get_tags(request: Request):
    user_id = await get_current_user_id(request, db)
    return await tags.get_tags(request, db=db, user_id=user_id)


@app.post("/api/tags")
async def create_tag(data: tags.TagCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await tags.create_tag(data, request, db=db, user_id=user_id)


@app.put("/api/tags/{tag_id}")
async def update_tag(tag_id: str, data: tags.TagUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await tags.update_tag(tag_id, data, request, db=db, user_id=user_id)


@app.delete("/api/tags/{tag_id}")
async def delete_tag(tag_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await tags.delete_tag(tag_id, request, db=db, user_id=user_id)


# ============== TRANSACTIONS ROUTES ==============
@app.get("/api/transactions")
async def get_transactions(request: Request, tipo: str = None, categoria_id: str = None):
    user_id = await get_current_user_id(request, db)
    return await transactions.get_transactions(request, tipo=tipo, categoria_id=categoria_id, db=db, user_id=user_id)


@app.post("/api/transactions")
async def create_transaction(data: transactions.TransactionCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await transactions.create_transaction(data, request, db=db, user_id=user_id)


@app.put("/api/transactions/{transaction_id}")
async def update_transaction(transaction_id: str, data: transactions.TransactionUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await transactions.update_transaction(transaction_id, data, request, db=db, user_id=user_id)


@app.delete("/api/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await transactions.delete_transaction(transaction_id, request, db=db, user_id=user_id)


@app.get("/api/transactions/summary")
async def get_transaction_summary(request: Request):
    user_id = await get_current_user_id(request, db)
    return await transactions.get_transaction_summary(request, db=db, user_id=user_id)


@app.patch("/api/transactions/{transaction_id}/toggle-paid")
async def toggle_transaction_paid(transaction_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await transactions.toggle_transaction_paid(transaction_id, request, db=db, user_id=user_id)


# ============== ACCOUNTS ROUTES ==============
@app.get("/api/accounts")
async def get_accounts(request: Request):
    user_id = await get_current_user_id(request, db)
    return await accounts.get_accounts(request, db=db, user_id=user_id)


@app.post("/api/accounts")
async def create_account(data: accounts.BankAccountCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await accounts.create_account(data, request, db=db, user_id=user_id)


@app.put("/api/accounts/{account_id}")
async def update_account(account_id: str, data: accounts.BankAccountUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await accounts.update_account(account_id, data, request, db=db, user_id=user_id)


@app.delete("/api/accounts/{account_id}")
async def delete_account(account_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await accounts.delete_account(account_id, request, db=db, user_id=user_id)


# ============== CARDS ROUTES ==============
@app.get("/api/cards")
async def get_cards(request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.get_cards(request, db=db, user_id=user_id)


@app.post("/api/cards")
async def create_card(data: cards.CreditCardCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.create_card(data, request, db=db, user_id=user_id)


@app.put("/api/cards/{card_id}")
async def update_card(card_id: str, data: cards.CreditCardUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.update_card(card_id, data, request, db=db, user_id=user_id)


@app.delete("/api/cards/{card_id}")
async def delete_card(card_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.delete_card(card_id, request, db=db, user_id=user_id)


@app.post("/api/cards/{card_id}/pay-invoice")
async def pay_invoice(card_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.pay_invoice(card_id, request, db=db, user_id=user_id)


@app.get("/api/cards/{card_id}/installments")
async def get_installments(card_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.get_installments(card_id, request, db=db, user_id=user_id)


@app.get("/api/cards/installments/all")
async def get_all_installments(request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.get_all_installments(request, db=db, user_id=user_id)


@app.post("/api/cards/installments")
async def create_installment(data: cards.CardInstallmentCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.create_installment(data, request, db=db, user_id=user_id)


@app.put("/api/cards/installments/{installment_id}")
async def update_installment(installment_id: str, data: cards.CardInstallmentUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.update_installment(installment_id, data, request, db=db, user_id=user_id)


@app.post("/api/cards/installments/{installment_id}/pay")
async def pay_installment(installment_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.pay_installment(installment_id, request, db=db, user_id=user_id)


@app.delete("/api/cards/installments/{installment_id}")
async def delete_installment(installment_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.delete_installment(installment_id, request, db=db, user_id=user_id)


@app.post("/api/cards/installments/batch")
async def create_installment_batch(data: cards.CardInstallmentBatchCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await cards.create_installment_batch(data, request, db=db, user_id=user_id)


# ============== INVESTMENTS ROUTES ==============
@app.get("/api/investments")
async def get_investments(request: Request):
    user_id = await get_current_user_id(request, db)
    return await investments.get_investments(request, db=db, user_id=user_id)


@app.post("/api/investments")
async def create_investment(data: investments.InvestmentCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await investments.create_investment(data, request, db=db, user_id=user_id)


@app.put("/api/investments/{investment_id}")
async def update_investment(investment_id: str, data: investments.InvestmentUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await investments.update_investment(investment_id, data, request, db=db, user_id=user_id)


@app.delete("/api/investments/{investment_id}")
async def delete_investment(investment_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await investments.delete_investment(investment_id, request, db=db, user_id=user_id)


@app.get("/api/investments/total")
async def get_total_invested(request: Request):
    user_id = await get_current_user_id(request, db)
    return await investments.get_total_invested(request, db=db, user_id=user_id)


@app.get("/api/investments/{investment_id}/contributions")
async def get_contributions(investment_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await investments.get_contributions(investment_id, request, db=db, user_id=user_id)


@app.post("/api/investments/contributions")
async def create_contribution(data: investments.InvestmentContributionCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await investments.create_contribution(data, request, db=db, user_id=user_id)


@app.get("/api/investments/contributions/all")
async def get_all_contributions(request: Request):
    user_id = await get_current_user_id(request, db)
    return await investments.get_all_contributions(request, db=db, user_id=user_id)


# ============== FINANCINGS ROUTES ==============
@app.get("/api/financings")
async def get_financings(request: Request):
    user_id = await get_current_user_id(request, db)
    return await financings.get_financings(request, db=db, user_id=user_id)


@app.post("/api/financings")
async def create_financing(data: financings.FinancingCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await financings.create_financing(data, request, db=db, user_id=user_id)


@app.put("/api/financings/{financing_id}")
async def update_financing(financing_id: str, data: financings.FinancingUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await financings.update_financing(financing_id, data, request, db=db, user_id=user_id)


@app.delete("/api/financings/{financing_id}")
async def delete_financing(financing_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await financings.delete_financing(financing_id, request, db=db, user_id=user_id)


@app.post("/api/financings/{financing_id}/pay-installment")
async def pay_financing_installment(financing_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await financings.pay_financing_installment(financing_id, request, db=db, user_id=user_id)


@app.post("/api/financings/{financing_id}/pay-custom")
async def pay_financing_custom(financing_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await financings.pay_financing_custom(financing_id, request, db=db, user_id=user_id)


# ============== BUDGETS ROUTES ==============
@app.get("/api/budgets")
async def get_budgets(request: Request):
    user_id = await get_current_user_id(request, db)
    return await budgets.get_budgets(request, db=db, user_id=user_id)


@app.post("/api/budgets")
async def create_budget(data: budgets.BudgetCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await budgets.create_budget(data, request, db=db, user_id=user_id)


@app.put("/api/budgets/{budget_id}")
async def update_budget(budget_id: str, data: budgets.BudgetUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await budgets.update_budget(budget_id, data, request, db=db, user_id=user_id)


@app.delete("/api/budgets/{budget_id}")
async def delete_budget(budget_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await budgets.delete_budget(budget_id, request, db=db, user_id=user_id)


@app.get("/api/budgets/summary")
async def get_budget_summary(request: Request):
    user_id = await get_current_user_id(request, db)
    return await budgets.get_budget_summary(request, db=db, user_id=user_id)


# ============== GOALS ROUTES ==============
@app.get("/api/goals")
async def get_goals(request: Request):
    user_id = await get_current_user_id(request, db)
    return await goals.get_goals(request, db=db, user_id=user_id)


@app.post("/api/goals")
async def create_goal(data: goals.FinancialGoalCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await goals.create_goal(data, request, db=db, user_id=user_id)


@app.put("/api/goals/{goal_id}")
async def update_goal(goal_id: str, data: goals.FinancialGoalUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await goals.update_goal(goal_id, data, request, db=db, user_id=user_id)


@app.delete("/api/goals/{goal_id}")
async def delete_goal(goal_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await goals.delete_goal(goal_id, request, db=db, user_id=user_id)


@app.post("/api/goals/{goal_id}/contribute")
async def contribute_to_goal(goal_id: str, data: goals.GoalContributionCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await goals.contribute_to_goal(goal_id, data, request, db=db, user_id=user_id)


# ============== PLANEJAMENTOS ROUTES ==============
@app.get("/api/planejamentos")
async def get_planejamentos(request: Request):
    user_id = await get_current_user_id(request, db)
    return await planejamentos_route.get_planejamentos(request, db=db, user_id=user_id)


@app.post("/api/planejamentos")
async def create_planejamento(data: planejamentos_route.PlanejamentoCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await planejamentos_route.create_planejamento(data, request, db=db, user_id=user_id)


@app.get("/api/planejamentos/{plan_id}")
async def get_planejamento(plan_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await planejamentos_route.get_planejamento(plan_id, request, db=db, user_id=user_id)


@app.put("/api/planejamentos/{plan_id}")
async def update_planejamento(plan_id: str, data: planejamentos_route.PlanejamentoUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await planejamentos_route.update_planejamento(plan_id, data, request, db=db, user_id=user_id)


@app.delete("/api/planejamentos/{plan_id}")
async def delete_planejamento(plan_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await planejamentos_route.delete_planejamento(plan_id, request, db=db, user_id=user_id)


@app.delete("/api/planejamentos/{plan_id}/goal")
async def delete_plan_goal(plan_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await planejamentos_route.delete_plan_goal(plan_id, request, db=db, user_id=user_id)


# ============== SUBSCRIPTIONS ROUTES ==============
@app.get("/api/subscriptions/stats")
async def get_subscriptions_stats(request: Request):
    user_id = await get_current_user_id(request, db)
    return await subscriptions_route.get_stats(request, db=db, user_id=user_id)


@app.get("/api/subscriptions")
async def list_subscriptions(request: Request):
    user_id = await get_current_user_id(request, db)
    return await subscriptions_route.list_subscriptions(request, db=db, user_id=user_id)


@app.post("/api/subscriptions")
async def create_subscription(data: subscriptions_route.SubscriptionCreate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await subscriptions_route.create_subscription(data, request, db=db, user_id=user_id)


@app.put("/api/subscriptions/{sub_id}")
async def update_subscription(sub_id: str, data: subscriptions_route.SubscriptionUpdate, request: Request):
    user_id = await get_current_user_id(request, db)
    return await subscriptions_route.update_subscription(sub_id, data, request, db=db, user_id=user_id)


@app.delete("/api/subscriptions/{sub_id}")
async def delete_subscription(sub_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await subscriptions_route.delete_subscription(sub_id, request, db=db, user_id=user_id)


@app.post("/api/subscriptions/{sub_id}/charge-now")
async def charge_subscription_now(sub_id: str, request: Request):
    user_id = await get_current_user_id(request, db)
    return await subscriptions_route.charge_now(sub_id, request, db=db, user_id=user_id)


# ========== IMPORT ROUTES ==========
from fastapi import UploadFile, File

@app.post("/api/import/upload")
async def import_upload(request: Request):
    """Upload file as base64 JSON or multipart FormData."""
    user_id = await get_current_user_id(request, db)
    
    content_type = request.headers.get("content-type", "")
    logger.info(f"Import upload - content-type: {content_type}, user: {user_id}")
    
    if "application/json" in content_type:
        try:
            body = await request.json()
        except Exception as e:
            logger.error(f"Import: JSON parse error: {e}")
            raise HTTPException(status_code=400, detail="JSON invalido no body da requisicao")
        
        import base64
        file_b64 = body.get("file_base64")
        filename = body.get("filename", "upload.csv")
        
        if not file_b64:
            raise HTTPException(status_code=400, detail="Campo 'file_base64' nao encontrado")
        
        try:
            file_content = base64.b64decode(file_b64)
        except Exception as e:
            logger.error(f"Import: base64 decode error: {e}")
            raise HTTPException(status_code=400, detail="Erro ao decodificar base64 do arquivo")
        
        logger.info(f"Import: file={filename}, size={len(file_content)} bytes")
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Arquivo vazio")
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Arquivo muito grande. Maximo 10MB.")
        
        class FakeFile:
            def __init__(self, fn, ct):
                self.filename = fn
                self._content = ct
            async def read(self):
                return self._content
        
        return await imports_route.upload_and_parse(FakeFile(filename, file_content), request, db=db, user_id=user_id)
    
    else:
        # Multipart fallback
        try:
            form = await request.form()
            file = form.get("file")
            if not file:
                raise HTTPException(status_code=400, detail="Campo 'file' nao encontrado. Envie como JSON {file_base64, filename} ou FormData com campo 'file'.")
            content = await file.read()
            logger.info(f"Import multipart: file={file.filename}, size={len(content)} bytes")
            if len(content) == 0:
                raise HTTPException(status_code=400, detail="Arquivo vazio")
            
            class FormFile:
                def __init__(self, fn, ct):
                    self.filename = fn
                    self._content = ct
                async def read(self):
                    return self._content
            
            return await imports_route.upload_and_parse(FormFile(file.filename, content), request, db=db, user_id=user_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Import multipart error: {e}")
            raise HTTPException(status_code=400, detail=f"Erro ao processar upload: {str(e)}")

@app.post("/api/import/confirm")
async def import_confirm(request: Request):
    user_id = await get_current_user_id(request, db)
    return await imports_route.confirm_import(request, db=db, user_id=user_id)

@app.get("/api/import/history")
async def import_history(request: Request):
    user_id = await get_current_user_id(request, db)
    return await imports_route.get_import_history(request, db=db, user_id=user_id)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
