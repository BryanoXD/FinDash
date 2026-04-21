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

## P3
- Multi-idioma, Tema claro/escuro, PWA mobile
- Refatorar OtherSections.jsx (quebrar ImportSection e ReportsSection em arquivos proprios)
