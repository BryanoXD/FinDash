# FinDash - Product Requirements Document

## Original Problem Statement
Clone do FinPulse - aplicacao de gestao financeira pessoal completa em portugues brasileiro.

## Core Requirements

### Phase 1-4 (Completed)
- Login via Google OAuth, Dashboard, Sidebar, CRUD completo via modais
- Backend FastAPI + MongoDB, DataContext global, regras de negocio

### Phase 5 (Completed - 13/04/2026)
- Parcelas de cartao de credito via batch endpoint
- Modal unificado Dashboard, Logout funcional, InvestmentsSection refatorada

### Phase 6 (Completed - 13/04/2026)
- Dashboard cards (Vencidos/Vencendo/Futuro) clicaveis com modais detalhados
- Saldo Total clicavel com composicao (contas, receitas, despesas, investimentos)
- Metas Financeiras com opcao de Sacar (saque/withdraw)
- Tela Investimentos com Metas Financeiras + Resgate de investimentos
- TransactionModal com categoria Financiamento e seletor de qual financiamento pagar
- Sidebar renomeada: "Invest. e Financ."
- Backend: POST /api/financings/{id}/pay-custom + goal contribute com valores negativos

## Architecture
- Frontend: React 18 + TailwindCSS + Shadcn/UI + Recharts + DataContext
- Backend: FastAPI + MongoDB (Motor) + Emergent Google OAuth

## API Endpoints
### Auth
- POST /api/auth/session, GET /api/auth/me, POST /api/auth/logout

### Resources
- /api/categories, /api/tags, /api/transactions (+ /summary, /toggle-paid)
- /api/accounts
- /api/cards (+ /pay-invoice, /installments, /installments/batch)
- /api/investments (+ /contributions, /total)
- /api/financings (+ /pay-installment, /pay-custom)
- /api/budgets (+ /summary)
- /api/goals (+ /contribute)

## P0 - Critical
Nenhum

## P1 - High Priority
Nenhum - Todos concluidos

## P2 - Medium Priority
1. Importacao real de extratos (CSV, OFX)
2. Exportacao de relatorios em PDF
3. Heatmap baseado em dados reais de transacoes

## P3 - Low Priority
1. Multi-idioma
2. Tema claro/escuro
3. PWA para mobile

## Constraints
- Manter layout e estilo visual existentes
- CRUD via modais, app em portugues brasileiro
