# FinDash - Product Requirements Document

## Original Problem Statement
Clone do FinPulse - gestao financeira pessoal completa em portugues brasileiro.

## Architecture
- Frontend: React 18 + TailwindCSS + Shadcn/UI + Recharts + DataContext
- Backend: FastAPI + MongoDB (Motor) + Emergent Google OAuth

## Completed Phases (1-9)
- Phases 1-8: Full CRUD, Auth, Responsividade, PDF Export, Despesas com vencimento/recorrentes
- Phase 9 (21/04/2026): Importacao completa de extratos (CSV, OFX, PDF)
  - Backend: parsers modulares (csv, ofx, pdf), normalizacao, categorizacao automatica, deduplicacao
  - Frontend: UI completa com drag&drop, preview, revisao, confirmacao
  - 11 categorias com palavras-chave (Alimentacao, Transporte, Moradia, Saude, Lazer, Educacao, Assinaturas, Salario, Investimentos, Transferencias, Outros)
  - Integracao automatica com dashboard apos importacao

## File Structure
```
backend/
  services/
    import_service.py    # Parsers + categorizer + normalizer + deduplicator
  routes/
    imports.py           # Upload, confirm, history endpoints
frontend/
  src/services/
    reportGenerator.js   # PDF report generation
    api.js               # All API calls including import
```

## P0/P1 - Nenhum pendente

## P2
1. Fluxo de Caixa PDF
2. Analise de Gastos PDF
3. Heatmap com dados reais

## P3
- Multi-idioma, Tema claro/escuro, PWA mobile
