# FinDash - Product Requirements Document

## Original Problem Statement
Clone do FinPulse (https://parcel-manager-26.preview.emergentagent.com/) - aplicação de gestão financeira pessoal completa em português brasileiro.

## User Persona
- Usuários brasileiros que desejam gerenciar suas finanças pessoais
- Necessitam de controle de receitas, despesas, investimentos, cartões de crédito e metas financeiras

## Core Requirements

### Phase 1 (Completed)
- ✅ Login page com autenticação via Google OAuth (Emergent Auth)
- ✅ Dashboard principal com resumo financeiro
- ✅ Layout responsivo com Sidebar colapsável

### Phase 2 (Completed)
- ✅ Seção de Aportes de Investimentos
- ✅ Faturas de cartão de crédito com parcelas
- ✅ Vinculação de cartões a contas bancárias
- ✅ Gráficos com filtros de período (7d, 1m, 3m, 6m, 1y, 5y, 10y, 25y)
- ✅ Gráfico dedicado para investimentos

### Phase 3 (Completed)
- ✅ CRUD completo via modais para todas as seções
- ✅ Categorias customizáveis (criar/editar/excluir)
- ✅ Sistema de Tags para transações
- ✅ Detalhamento de transações (itemização)
- ✅ Status de recorrente e pago para transações
- ✅ Simulador de Investimentos
- ✅ Orçamentos por categoria com barras de progresso
- ✅ Vinculação de investimentos e financiamentos a contas bancárias

### Phase 4 (Completed - 15/02/2026)
- ✅ **Backend FastAPI completo** com MongoDB
- ✅ **Autenticação real** com Google OAuth (Emergent Auth)
- ✅ **Integração frontend-backend** (substituição de mockData)
- ✅ **Regras de negócio** implementadas:
  - Fatura do cartão = soma das parcelas não pagas
  - Pagamento de parcelas recalcula fatura e limite usado
  - Orçamentos calculados a partir das despesas pagas
  - Aportes em metas incrementam valor_atual
  - Aportes em investimentos atualizam valor total

## Architecture

### Frontend
- React 18 com React Router
- TailwindCSS para estilização
- Shadcn/UI para componentes
- Recharts para gráficos
- Lucide-react para ícones
- DataContext para gerenciamento de estado global

### Backend
- FastAPI com rotas RESTful
- MongoDB (Motor async driver)
- Autenticação via Emergent Google OAuth
- Sessions com cookies httpOnly

## API Endpoints

### Auth
- `POST /api/auth/session` - Criar sessão a partir do Emergent Auth
- `GET /api/auth/me` - Obter usuário atual
- `POST /api/auth/logout` - Logout

### Resources (CRUD completo para cada)
- `/api/categories`
- `/api/tags`
- `/api/transactions`
- `/api/accounts`
- `/api/cards` + `/api/cards/{id}/pay-invoice` + `/api/cards/installments`
- `/api/investments` + `/api/investments/contributions`
- `/api/financings`
- `/api/budgets`
- `/api/goals` + `/api/goals/{id}/contribute`

## File Structure
```
/app
├── backend/
│   ├── server.py (main FastAPI app)
│   ├── models.py (Pydantic schemas)
│   ├── seed.py (dados iniciais para novos usuários)
│   └── routes/ (rotas modulares)
│       ├── auth.py
│       ├── categories.py, tags.py, transactions.py
│       ├── accounts.py, cards.py, investments.py
│       ├── financings.py, budgets.py, goals.py
└── frontend/
    └── src/
        ├── services/api.js (API client)
        ├── context/DataContext.jsx (estado global)
        ├── components/AuthCallback.jsx (OAuth callback)
        └── pages/sections/ (seções do dashboard)
```

## Testing Status
- ✅ Backend: 23 APIs testadas (100%)
- ✅ Frontend: Integração completa com DataContext

## P0 - Critical (Next Steps)
Nenhum - MVP completo

## P1 - High Priority
1. Implementar logout na sidebar (botão "Sair")
2. Atualizar InvestmentsSection e CardsAccountsSection para usar DataContext
3. Heatmap baseado em dados reais de transações

## P2 - Medium Priority
1. Implementar importação real de extratos (CSV, OFX)
2. Exportação de relatórios em PDF
3. Notificações por email

## P3 - Low Priority
1. Multi-idioma
2. Tema claro/escuro
3. PWA para mobile

## Constraints
- Manter layout, cores e estilo visual existentes
- Todas as operações CRUD devem usar modais
- Aplicação em português brasileiro
