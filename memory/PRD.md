# FinDash - Product Requirements Document

## Original Problem Statement
Clone do FinPulse (https://finpulse-92.preview.emergentagent.com/) - aplicação de gestão financeira pessoal completa em português brasileiro.

## User Persona
- Usuários brasileiros que desejam gerenciar suas finanças pessoais
- Necessitam de controle de receitas, despesas, investimentos, cartões de crédito e metas financeiras

## Core Requirements

### Phase 1 (Completed)
- ✅ Login page com autenticação via Google (mockada)
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

## Architecture

### Frontend
- React 18 com React Router
- TailwindCSS para estilização
- Shadcn/UI para componentes
- Recharts para gráficos
- Lucide-react para ícones

### Backend (Não implementado)
- FastAPI (scaffolded)
- MongoDB (configurado)

### Data Layer
- Atualmente todos os dados são MOCKADOS em `/app/frontend/src/data/mockData.js`

## File Structure
```
/app/frontend/src/
├── pages/
│   ├── LoginPage.jsx
│   └── DashboardPage.jsx
│   └── sections/
│       ├── OverviewSection.jsx
│       ├── OtherSections.jsx (Receitas, Despesas, Categorias, Orçamento, Heatmap, Relatórios, Metas, Import, Settings)
│       ├── InvestmentsSection.jsx (+ SimuladorSection)
│       └── CardsAccountsSection.jsx
├── components/
│   ├── Sidebar.jsx
│   └── ui/ (shadcn components)
└── data/
    └── mockData.js
```

## What's Been Implemented (December 2025)

### 14/02/2026
- Corrigido rota do Simulador em DashboardPage.jsx
- Corrigido caracteres especiais (unicode escapes) em OtherSections.jsx
- Todas as 12 seções do dashboard funcionando:
  1. Dashboard (Overview)
  2. Receitas
  3. Despesas
  4. Categorias
  5. Orçamento
  6. Investimentos
  7. Simulador
  8. Contas e Cartões
  9. Heatmap de Gastos
  10. Importar Extratos
  11. Relatórios
  12. Metas Financeiras
  13. Configurações

## Testing Status
- Frontend: 100% testado e funcionando
- Backend: Não implementado

## P0 - Critical (Next Steps)
1. **Backend Implementation**
   - Criar schemas MongoDB para: Users, Accounts, Cards, Transactions, Investments, Budgets, Categories, Tags
   - Implementar endpoints FastAPI para CRUD de todas as entidades
   - Autenticação real com JWT ou Google OAuth

## P1 - High Priority
1. Refatorar `OtherSections.jsx` em arquivos menores para melhor manutenibilidade
2. Integração frontend com backend (substituir mockData por API calls)
3. Persistência de dados

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
