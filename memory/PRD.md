# FinDash - Product Requirements Document

## Original Problem Statement
Clone do FinPulse (https://parcel-manager-26.preview.emergentagent.com/) - aplicacao de gestao financeira pessoal completa em portugues brasileiro.

## User Persona
- Usuarios brasileiros que desejam gerenciar suas financas pessoais
- Necessitam de controle de receitas, despesas, investimentos, cartoes de credito e metas financeiras

## Core Requirements

### Phase 1 (Completed)
- Login page com autenticacao via Google OAuth (Emergent Auth)
- Dashboard principal com resumo financeiro
- Layout responsivo com Sidebar colapsavel

### Phase 2 (Completed)
- Secao de Aportes de Investimentos
- Faturas de cartao de credito com parcelas
- Vinculacao de cartoes a contas bancarias
- Graficos com filtros de periodo (7d, 1m, 3m, 6m, 1y, 5y, 10y, 25y)
- Grafico dedicado para investimentos

### Phase 3 (Completed)
- CRUD completo via modais para todas as secoes
- Categorias customizaveis (criar/editar/excluir)
- Sistema de Tags para transacoes
- Detalhamento de transacoes (itemizacao)
- Status de recorrente e pago para transacoes
- Simulador de Investimentos
- Orcamentos por categoria com barras de progresso
- Vinculacao de investimentos e financiamentos a contas bancarias

### Phase 4 (Completed - 15/02/2026)
- Backend FastAPI completo com MongoDB
- Autenticacao real com Google OAuth (Emergent Auth)
- Integracao frontend-backend (substituicao de mockData)
- Regras de negocio implementadas:
  - Fatura do cartao = soma das parcelas nao pagas
  - Pagamento de parcelas recalcula fatura e limite usado
  - Orcamentos calculados a partir das despesas pagas
  - Aportes em metas incrementam valor_atual
  - Aportes em investimentos atualizam valor total

### Phase 5 (Completed - 13/04/2026)
- Parcelas de cartao de credito via transacao (batch endpoint)
  - TransactionModal exibe opcoes de parcelamento ao selecionar "Credito"
  - Backend cria N parcelas com datas mensais e recalcula totais do cartao
  - POST /api/cards/installments/batch endpoint
- Modal unificado "+ Nova Transacao" no Dashboard com seletor Receita/Despesa
- Logout funcional na sidebar (chama backend, limpa cookie, redireciona)
- InvestmentsSection refatorada para usar DataContext (dados reais, sem mock)

## Architecture

### Frontend
- React 18 com React Router
- TailwindCSS para estilizacao
- Shadcn/UI para componentes
- Recharts para graficos
- Lucide-react para icones
- DataContext para gerenciamento de estado global

### Backend
- FastAPI com rotas RESTful
- MongoDB (Motor async driver)
- Autenticacao via Emergent Google OAuth
- Sessions com cookies httpOnly

## API Endpoints

### Auth
- `POST /api/auth/session` - Criar sessao a partir do Emergent Auth
- `GET /api/auth/me` - Obter usuario atual
- `POST /api/auth/logout` - Logout (limpa cookie e sessao)

### Resources (CRUD completo para cada)
- `/api/categories`
- `/api/tags`
- `/api/transactions` + `/api/transactions/summary` + `/api/transactions/{id}/toggle-paid`
- `/api/accounts`
- `/api/cards` + `/api/cards/{id}/pay-invoice` + `/api/cards/installments` + `/api/cards/installments/batch`
- `/api/investments` + `/api/investments/contributions` + `/api/investments/total`
- `/api/financings` + `/api/financings/{id}/pay-installment`
- `/api/budgets` + `/api/budgets/summary`
- `/api/goals` + `/api/goals/{id}/contribute`

## File Structure
```
/app
├── backend/
│   ├── server.py (main FastAPI app)
│   ├── models.py (Pydantic schemas)
│   ├── seed.py (dados iniciais para novos usuarios)
│   └── routes/ (rotas modulares)
│       ├── auth.py
│       ├── categories.py, tags.py, transactions.py
│       ├── accounts.py, cards.py, investments.py
│       ├── financings.py, budgets.py, goals.py
└── frontend/
    └── src/
        ├── services/api.js (API client)
        ├── context/DataContext.jsx (estado global)
        ├── components/AuthCallback.jsx, Sidebar.jsx
        └── pages/sections/ (secoes do dashboard)
```

## Testing Status
- Backend: 35 APIs testadas (100%) - iteration_4
- Frontend: Integracao completa com DataContext, todos os modais testados
- All P0 and P1 items verified

## P0 - Critical
Nenhum - Todos os itens criticos concluidos

## P1 - High Priority (Completed)
- ~~Implementar logout na sidebar~~ DONE
- ~~Refatorar InvestmentsSection para usar DataContext~~ DONE
- ~~Parcelas de cartao de credito no TransactionModal~~ DONE

## P2 - Medium Priority
1. Implementar importacao real de extratos (CSV, OFX)
2. Exportacao de relatorios em PDF
3. Heatmap baseado em dados reais de transacoes

## P3 - Low Priority
1. Multi-idioma
2. Tema claro/escuro
3. PWA para mobile

## Constraints
- Manter layout, cores e estilo visual existentes
- Todas as operacoes CRUD devem usar modais
- Aplicacao em portugues brasileiro
