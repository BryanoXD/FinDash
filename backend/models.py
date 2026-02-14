"""
Pydantic models for FinDash API
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid


def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with optional prefix"""
    return f"{prefix}{uuid.uuid4().hex[:12]}" if prefix else uuid.uuid4().hex[:12]


# ============== USER MODELS ==============
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============== CATEGORY MODELS ==============
class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("cat_"))
    user_id: str
    nome: str
    cor: str = "#6366f1"
    tipo: str = "despesa"  # receita, despesa, ambos
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CategoryCreate(BaseModel):
    nome: str
    cor: str = "#6366f1"
    tipo: str = "despesa"


class CategoryUpdate(BaseModel):
    nome: Optional[str] = None
    cor: Optional[str] = None
    tipo: Optional[str] = None


# ============== TAG MODELS ==============
class Tag(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("tag_"))
    user_id: str
    nome: str
    cor: str = "#22c55e"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TagCreate(BaseModel):
    nome: str
    cor: str = "#22c55e"


class TagUpdate(BaseModel):
    nome: Optional[str] = None
    cor: Optional[str] = None


# ============== TRANSACTION MODELS ==============
class TransactionItem(BaseModel):
    nome: str
    valor: float


class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("tx_"))
    user_id: str
    descricao: str
    categoria: str
    categoria_id: str
    valor: float
    tipo: str  # receita, despesa
    data: str  # ISO date string YYYY-MM-DD
    metodo: Optional[str] = None
    tags: List[str] = []  # List of tag IDs
    recorrente: bool = False
    pago: bool = True
    detalhado: bool = False
    itens: List[TransactionItem] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TransactionCreate(BaseModel):
    descricao: str
    categoria_id: str
    valor: float
    tipo: str
    data: str
    metodo: Optional[str] = None
    tags: List[str] = []
    recorrente: bool = False
    pago: bool = True
    detalhado: bool = False
    itens: List[TransactionItem] = []


class TransactionUpdate(BaseModel):
    descricao: Optional[str] = None
    categoria_id: Optional[str] = None
    valor: Optional[float] = None
    tipo: Optional[str] = None
    data: Optional[str] = None
    metodo: Optional[str] = None
    tags: Optional[List[str]] = None
    recorrente: Optional[bool] = None
    pago: Optional[bool] = None
    detalhado: Optional[bool] = None
    itens: Optional[List[TransactionItem]] = None


# ============== BANK ACCOUNT MODELS ==============
class BankAccount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("acc_"))
    user_id: str
    nome: str
    tipo: str  # Conta Corrente, Conta Poupança, etc.
    saldo: float = 0
    cor: str = "#6366f1"
    agencia: Optional[str] = None
    conta: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BankAccountCreate(BaseModel):
    nome: str
    tipo: str
    saldo: float = 0
    cor: str = "#6366f1"
    agencia: Optional[str] = None
    conta: Optional[str] = None


class BankAccountUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    saldo: Optional[float] = None
    cor: Optional[str] = None
    agencia: Optional[str] = None
    conta: Optional[str] = None


# ============== CREDIT CARD MODELS ==============
class CreditCard(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("card_"))
    user_id: str
    nome: str
    numero: str  # Last 4 digits masked
    bandeira: str  # Visa, Mastercard, etc.
    limite: float
    usado: float = 0
    vencimento: str  # DD/MM
    cor: str = "from-purple-600 to-purple-800"
    banco_id: Optional[str] = None
    fatura_atual: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CreditCardCreate(BaseModel):
    nome: str
    numero: str
    bandeira: str
    limite: float
    vencimento: str
    cor: str = "from-purple-600 to-purple-800"
    banco_id: Optional[str] = None


class CreditCardUpdate(BaseModel):
    nome: Optional[str] = None
    numero: Optional[str] = None
    bandeira: Optional[str] = None
    limite: Optional[float] = None
    vencimento: Optional[str] = None
    cor: Optional[str] = None
    banco_id: Optional[str] = None
    usado: Optional[float] = None
    fatura_atual: Optional[float] = None


# ============== CARD INSTALLMENT MODELS ==============
class CardInstallment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("inst_"))
    user_id: str
    card_id: str
    descricao: str
    valor_parcela: float
    parcela_atual: int
    total_parcelas: int
    valor_total: float
    data: str  # ISO date string
    pago: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CardInstallmentCreate(BaseModel):
    card_id: str
    descricao: str
    valor_parcela: float
    parcela_atual: int
    total_parcelas: int
    valor_total: float
    data: str


class CardInstallmentUpdate(BaseModel):
    descricao: Optional[str] = None
    valor_parcela: Optional[float] = None
    parcela_atual: Optional[int] = None
    total_parcelas: Optional[int] = None
    pago: Optional[bool] = None


# ============== INVESTMENT MODELS ==============
class Investment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("inv_"))
    user_id: str
    nome: str
    tipo: str  # Renda Fixa, Ações, FIIs, Crypto, etc.
    valor: float
    rendimento: float = 0  # % anual
    variacao: float = 0  # % atual
    banco_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InvestmentCreate(BaseModel):
    nome: str
    tipo: str
    valor: float
    rendimento: float = 0
    banco_id: Optional[str] = None


class InvestmentUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    valor: Optional[float] = None
    rendimento: Optional[float] = None
    variacao: Optional[float] = None
    banco_id: Optional[str] = None


# ============== INVESTMENT CONTRIBUTION MODELS ==============
class InvestmentContribution(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("contrib_"))
    user_id: str
    investimento_id: str
    valor: float
    data: str  # ISO date string
    tipo: str = "aporte"  # aporte, resgate
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InvestmentContributionCreate(BaseModel):
    investimento_id: str
    valor: float
    data: str
    tipo: str = "aporte"


# ============== FINANCING MODELS ==============
class Financing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("fin_"))
    user_id: str
    nome: str
    banco_id: Optional[str] = None
    valor_total: float
    valor_pago: float = 0
    parcelas: int
    parcela_atual: int = 0
    valor_parcela: float
    taxa: float = 0  # % anual
    status: str = "ativo"  # ativo, quitado
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FinancingCreate(BaseModel):
    nome: str
    banco_id: Optional[str] = None
    valor_total: float
    parcelas: int
    valor_parcela: float
    taxa: float = 0


class FinancingUpdate(BaseModel):
    nome: Optional[str] = None
    banco_id: Optional[str] = None
    valor_total: Optional[float] = None
    valor_pago: Optional[float] = None
    parcelas: Optional[int] = None
    parcela_atual: Optional[int] = None
    valor_parcela: Optional[float] = None
    taxa: Optional[float] = None
    status: Optional[str] = None


# ============== BUDGET MODELS ==============
class Budget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("budget_"))
    user_id: str
    categoria_id: str
    categoria: str  # Category name for display
    limite: float
    gasto: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BudgetCreate(BaseModel):
    categoria_id: str
    limite: float


class BudgetUpdate(BaseModel):
    categoria_id: Optional[str] = None
    limite: Optional[float] = None
    gasto: Optional[float] = None


# ============== FINANCIAL GOAL MODELS ==============
class FinancialGoal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: generate_id("goal_"))
    user_id: str
    nome: str
    valor_atual: float = 0
    valor_meta: float
    prazo: str  # ISO date string
    icone: str = "Target"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FinancialGoalCreate(BaseModel):
    nome: str
    valor_meta: float
    prazo: str
    icone: str = "Target"


class FinancialGoalUpdate(BaseModel):
    nome: Optional[str] = None
    valor_atual: Optional[float] = None
    valor_meta: Optional[float] = None
    prazo: Optional[str] = None
    icone: Optional[str] = None


# ============== GOAL CONTRIBUTION ==============
class GoalContributionCreate(BaseModel):
    valor: float
