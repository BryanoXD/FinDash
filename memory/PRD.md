# FinDash - Product Requirements Document

## Original Problem Statement
Clone do FinPulse - aplicacao de gestao financeira pessoal completa em portugues brasileiro.

## Architecture
- Frontend: React 18 + TailwindCSS + Shadcn/UI + Recharts + DataContext
- Backend: FastAPI + MongoDB (Motor) + Emergent Google OAuth
- Auth: httpOnly cookies, EMERGENT_AUTH_URL from .env, CORS restricted

## Phases Completed

### Phase 1-4 (Completed)
- Login via Google OAuth, Dashboard, Sidebar, CRUD completo via modais
- Backend FastAPI + MongoDB, DataContext global, regras de negocio

### Phase 5 (Completed - 13/04/2026)
- Parcelas de cartao de credito via batch endpoint
- Modal unificado Dashboard, Logout funcional, InvestmentsSection refatorada

### Phase 6 (Completed - 13/04/2026)
- Dashboard cards clicaveis com modais, Saldo Total com composicao
- Metas com saque, Investimentos com resgate, Financiamento no TransactionModal
- Sidebar renomeada "Invest. e Financ."

### Phase 7 (Completed - 13/04/2026)
- **Responsividade completa**: mobile/tablet/desktop
  - Sidebar drawer no mobile com hamburger menu
  - Cards 2-col mobile, 4-col desktop
  - Tabela de transacoes: card layout mobile, grid desktop
  - Charts responsivos, sem overflow horizontal
- **Auth segura para deploy**:
  - EMERGENT_AUTH_URL em .env (sem fallback hardcoded)
  - CORS restrito ao frontend URL
  - Cookies httpOnly + secure + samesite
  - Endpoints protegidos retornam 401 sem auth

## P0/P1 - Nenhum pendente

## P2 - Medium Priority
1. Importacao real de extratos (CSV, OFX)
2. Exportacao de relatorios em PDF
3. Heatmap baseado em dados reais

## P3 - Low Priority
1. Multi-idioma
2. Tema claro/escuro
3. PWA para mobile
