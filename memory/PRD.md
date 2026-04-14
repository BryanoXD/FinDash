# FinDash - Product Requirements Document

## Original Problem Statement
Clone do FinPulse - aplicacao de gestao financeira pessoal completa em portugues brasileiro.

## Architecture
- Frontend: React 18 + TailwindCSS + Shadcn/UI + Recharts + DataContext
- Backend: FastAPI + MongoDB (Motor) + Emergent Google OAuth

## Completed Phases

### Phase 1-7 (Completed)
- Login via Google OAuth, Dashboard, Sidebar, CRUD modais, Backend FastAPI + MongoDB
- Parcelas cartao, Modal unificado, Logout, InvestmentsSection real
- Dashboard cards clicaveis, Metas saque, Financiamento no modal
- Responsividade mobile/tablet/desktop, Auth segura para deploy

### Phase 8 (Completed - 14/04/2026)
- **Data de Vencimento em Despesas**: Campo substitui "Data" com toggle "Sem vencimento"
  - Sem vencimento = usa data atual do sistema como registro
  - Com vencimento = data picker para escolher vencimento
  - Recorrente + proximo mes = despesa reaparece
  - Ja pago = balanco do saldo
- **Finalizar pagamento recorrente**: Botao CheckCircle em despesas recorrentes pendentes
  - Modal para selecionar quantas parcelas pagar de uma vez
  - Cria N copias pagas e encerra recorrencia
- **Abas Pendentes/Finalizadas**: Despesas separadas por status pago
  - Aba Pendentes = pago=false, com contagem
  - Aba Finalizadas = pago=true, com contagem
  - Botao check para marcar como pago rapidamente

## P0/P1 - Nenhum pendente

## P2 - Medium Priority
1. Importacao real de extratos (CSV, OFX)
2. Exportacao de relatorios em PDF
3. Heatmap baseado em dados reais

## P3 - Low Priority
1. Multi-idioma
2. Tema claro/escuro
3. PWA para mobile
