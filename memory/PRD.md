# FinDash - Product Requirements Document

## Original Problem Statement
Clone do FinPulse - gestao financeira pessoal completa em portugues brasileiro.

## Architecture
- Frontend: React 18 + TailwindCSS + Shadcn/UI + Recharts + DataContext
- Backend: FastAPI + MongoDB (Motor) + Emergent Google OAuth

## Completed Phases (1-11)
- Phases 1-8: Full CRUD, Auth, Responsividade, PDF Export, Despesas com vencimento/recorrentes
- Phase 9 (21/04/2026): Importacao completa de extratos (CSV, OFX, PDF)
- Phase 10 (11/05/2026): Modulo Planejamentos (Notion-style Markdown), Ritmo de Gastos, Assinaturas, Cartoes 4-digit
- Phase 11 (19/05/2026): Seguranca + Compartilhamento de Workspaces (base monetizacao)
  - Backend: routes/workspaces.py com CRUD de workspaces, members, invites, roles (owner/editor/viewer/custom) e PLAN_LIMITS por plano (free/premium/family). FEATURES flag FAMILY_SHARING_ENABLED.
  - Backend: session_version no User + UserSession; GET /api/auth/validate (e alias /api/auth/session) usado pelo guard do frontend.
  - Backend: POST /api/auth/revoke-all-sessions bumpa session_version + delete_many user_sessions + clear cookie (encerra TODAS as sessoes incluindo a do caller).
  - Backend: middleware workspace_header_guard - bloqueia 403 qualquer X-Workspace-Id que nao seja membro ativo (cross-tenant protection).
  - Frontend: hooks/useSessionGuard.js (revalida sessao on mount/focus/visibility/5min, redireciona pra / em 401).
  - Frontend: Modal de confirmacao "Sair" no Sidebar.
  - Frontend: pages/sections/CompartilhamentoSection.jsx + pages/AcceptInvitePage.jsx (UI base com role presets e listagem de members/invites).
  - Validado em iteration_10.json: 19/19 pytest cases PASS (security + sharing + regressao).
  - Hotfix (19/05/2026): accept_invite + list_my_workspaces agora chamam _ensure_personal_workspace para usuarios convidados que nunca abriram o app antes. Frontend parseia 422 Pydantic em mensagem amigavel ("Email invalido"). Validado em iteration_12.json (3/3 backend + frontend Playwright PASS).


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

### Verificacao (21/04/2026) - Import Flow
- Backend `/api/import/upload` aceita JSON `{file_base64, filename}` com wrapper FakeFile (server.py:578-646)
- Backend tambem aceita multipart FormData como fallback
- Frontend api.js converte arquivo para base64 e envia via JSON (api.js:311-352)
- Tabela de preview em `ImportSection` (OtherSections.jsx:708-755) estruturada corretamente: `<div><table><thead><tr><th></th></tr></thead><tbody><tr><td></td></tr></tbody></table></div>` - sem erro de DOM nesting
- Mensagens de erro descritivas: "Formato nao suportado", "Arquivo vazio", "Arquivo muito grande", "Sessao expirada", erros de rede
- Lint: limpo em todos os arquivos editados

### FIX (21/04/2026) - "Erro 400" Generico na UI
- **Causa raiz**: O script de dev do Emergent (`assets.emergent.sh/scripts/emergent-main.js`)
  faz monkey-patch de `window.fetch` e **consome o body de responses 4xx/5xx** antes
  que o codigo da app consiga ler. Resultado: `response.json()` falhava com
  "body stream already read", o `detail` nao era extraido e a UI mostrava "Erro 400".
- **Correcao**: Substituido `fetch` por `XMLHttpRequest` em `apiCall` (api.js:9-74).
  XHR nao e interceptado pelo script de dev, permitindo ler o body de qualquer status
  (200, 400, 401, 500) e extrair corretamente o campo `detail` do JSON de erro.
- **Validado no app real**: `CSV vazio` -> "CSV vazio ou com apenas cabecalho",
  PDF sem texto -> "PDF nao contem texto extraivel", OFX invalido ->
  "Erro ao interpretar arquivo OFX: The ofx file is empty!", CSV/OFX validos ->
  preview com tabela correta.

## P2
1. Feedback loop de auto-categorizacao (salvar correcoes do usuario para melhorar sugestoes futuras)
2. Fluxo de Caixa PDF
3. Analise de Gastos PDF
4. Heatmap com dados reais

## P3 (Completed)
- (11/05/2026) Markdown preview com `react-markdown` (toggle Editar/Lado a lado/Visualizar)
- (11/05/2026) Orcamento vinculado a categoria - mostra "Realizado mes atual" com barra de progresso (verde <100%, vermelho >100%)

## P3 (Remaining)
- Multi-idioma, Tema claro/escuro, PWA mobile
- Refatorar OtherSections.jsx (quebrar ImportSection e ReportsSection em arquivos proprios)
