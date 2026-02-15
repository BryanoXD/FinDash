"""
FinDash Business Rules and Data Consistency

## Regras de Negócio Principais:

### 1. TRANSAÇÕES
- Toda transação deve ter uma categoria válida
- Despesas pagas devem atualizar o orçamento da categoria correspondente
- Transações recorrentes podem ser marcadas como pago/pendente

### 2. CARTÕES DE CRÉDITO
- Fatura atual = soma das parcelas não pagas do mês
- Limite usado = soma de todas as parcelas não pagas
- Ao pagar fatura completa: todas parcelas são marcadas como pagas
- Ao pagar parcela individual: desconta da fatura e do limite usado

### 3. CONTAS BANCÁRIAS
- Saldo = valor inicial + receitas - despesas (quando vinculada)
- Cartões vinculados devem aparecer na conta
- Investimentos vinculados devem aparecer na conta

### 4. INVESTIMENTOS
- Valor atual = valor inicial + soma dos aportes - soma dos resgates
- Aportes atualizam o valor total do investimento
- Rendimento é calculado como percentual

### 5. FINANCIAMENTOS
- Valor pago = parcela_atual * valor_parcela
- Status muda para "quitado" quando parcela_atual >= parcelas
- Ao pagar parcela: incrementa parcela_atual e valor_pago

### 6. ORÇAMENTOS
- Gasto = soma das despesas pagas da categoria no mês
- Percentual = (gasto / limite) * 100
- Alerta quando > 90%

### 7. METAS FINANCEIRAS
- Progresso = (valor_atual / valor_meta) * 100
- Aportes incrementam valor_atual
"""
