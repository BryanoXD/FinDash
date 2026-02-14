// Complete Mock Data for FinDash

export const mockUser = { name: "Carlos Silva", email: "carlos.silva@email.com", avatar: "CS" };

export const mockTags = [
  { id: 1, nome: "Essencial", cor: "#22c55e" },
  { id: 2, nome: "Lazer", cor: "#3b82f6" },
  { id: 3, nome: "Investimento", cor: "#a855f7" },
  { id: 4, nome: "Fixo", cor: "#f97316" },
  { id: 5, nome: "Variável", cor: "#ef4444" },
];

export const mockCategories = [
  { id: 1, nome: "Moradia", cor: "#6366f1", tipo: "despesa" },
  { id: 2, nome: "Alimentação", cor: "#8b5cf6", tipo: "despesa" },
  { id: 3, nome: "Transporte", cor: "#a78bfa", tipo: "despesa" },
  { id: 4, nome: "Entretenimento", cor: "#c4b5fd", tipo: "despesa" },
  { id: 5, nome: "Saúde", cor: "#818cf8", tipo: "despesa" },
  { id: 6, nome: "Educação", cor: "#7c3aed", tipo: "despesa" },
  { id: 7, nome: "Salário", cor: "#22c55e", tipo: "receita" },
  { id: 8, nome: "Freelance", cor: "#10b981", tipo: "receita" },
  { id: 9, nome: "Investimentos", cor: "#14b8a6", tipo: "receita" },
  { id: 10, nome: "Outros", cor: "#64748b", tipo: "ambos" },
];

export const mockTransactions = [
  { id: 1, descricao: "Salário janeiro", categoria: "Salário", categoriaId: 7, valor: 8500, tipo: "receita", data: "2025-07-01", metodo: "Transfer", tags: [4], recorrente: true, pago: true, detalhado: false, itens: [] },
  { id: 2, descricao: "Aluguel", categoria: "Moradia", categoriaId: 1, valor: 2200, tipo: "despesa", data: "2025-07-05", metodo: "Débito", tags: [1, 4], recorrente: true, pago: true, detalhado: false, itens: [] },
  { id: 3, descricao: "Supermercado Extra", categoria: "Alimentação", categoriaId: 2, valor: 687.45, tipo: "despesa", data: "2025-07-08", metodo: "Crédito", tags: [1], recorrente: false, pago: true, detalhado: true, itens: [{ nome: "Leite", valor: 12.50 }, { nome: "Frutas", valor: 45.00 }, { nome: "Carne", valor: 120.00 }, { nome: "Arroz/Feijão", valor: 35.00 }, { nome: "Outros", valor: 474.95 }] },
  { id: 4, descricao: "Freelance Design", categoria: "Freelance", categoriaId: 8, valor: 3200, tipo: "receita", data: "2025-07-10", metodo: "Pix", tags: [5], recorrente: false, pago: true, detalhado: false, itens: [] },
  { id: 5, descricao: "Netflix + Spotify", categoria: "Entretenimento", categoriaId: 4, valor: 89.80, tipo: "despesa", data: "2025-07-12", metodo: "Crédito", tags: [2, 4], recorrente: true, pago: true, detalhado: true, itens: [{ nome: "Netflix", valor: 55.90 }, { nome: "Spotify", valor: 33.90 }] },
  { id: 6, descricao: "Posto de Gasolina", categoria: "Transporte", categoriaId: 3, valor: 350, tipo: "despesa", data: "2025-07-14", metodo: "Débito", tags: [1, 5], recorrente: false, pago: true, detalhado: false, itens: [] },
  { id: 7, descricao: "Dividendos ITSA4", categoria: "Investimentos", categoriaId: 9, valor: 450, tipo: "receita", data: "2025-07-15", metodo: "Transfer", tags: [3], recorrente: false, pago: true, detalhado: false, itens: [] },
  { id: 8, descricao: "Farmácia", categoria: "Saúde", categoriaId: 5, valor: 156.30, tipo: "despesa", data: "2025-07-16", metodo: "Crédito", tags: [1], recorrente: false, pago: true, detalhado: false, itens: [] },
  { id: 9, descricao: "Curso Udemy", categoria: "Educação", categoriaId: 6, valor: 297, tipo: "despesa", data: "2025-07-18", metodo: "Crédito", tags: [3], recorrente: false, pago: false, detalhado: false, itens: [] },
  { id: 10, descricao: "Vendas de trufas", categoria: "Freelance", categoriaId: 8, valor: 1500, tipo: "receita", data: "2025-07-20", metodo: "Pix", tags: [5], recorrente: false, pago: true, detalhado: false, itens: [] },
  { id: 11, descricao: "Mercado Atacadão", categoria: "Alimentação", categoriaId: 2, valor: 423.10, tipo: "despesa", data: "2025-07-22", metodo: "Débito", tags: [1], recorrente: false, pago: true, detalhado: true, itens: [{ nome: "Carne", valor: 180.00 }, { nome: "Bebidas", valor: 85.00 }, { nome: "Limpeza", valor: 62.10 }, { nome: "Frutas", valor: 96.00 }] },
];

export const mockSummary = { saldoTotal: 45892.50, receitas: 12450.00, despesas: 8320.75, investimentos: 28500.00, saldoVariacao: 12.5, receitasVariacao: 8.3, despesasVariacao: -3.2, investimentosVariacao: 15.7 };

export const mockChartDataByPeriod = {
  "7d": [{ label: "Seg", receitas: 420, despesas: 310 }, { label: "Ter", receitas: 0, despesas: 687 }, { label: "Qua", receitas: 3200, despesas: 89 }, { label: "Qui", receitas: 0, despesas: 350 }, { label: "Sex", receitas: 450, despesas: 156 }, { label: "Sáb", receitas: 0, despesas: 297 }, { label: "Dom", receitas: 1500, despesas: 0 }],
  "1m": [{ label: "Sem 1", receitas: 8500, despesas: 2887 }, { label: "Sem 2", receitas: 3200, despesas: 439 }, { label: "Sem 3", receitas: 450, despesas: 803 }, { label: "Sem 4", receitas: 1500, despesas: 297 }],
  "3m": [{ label: "Mai", receitas: 10800, despesas: 9200 }, { label: "Jun", receitas: 12100, despesas: 8500 }, { label: "Jul", receitas: 12450, despesas: 8320 }],
  "6m": [{ label: "Fev", receitas: 9800, despesas: 7200 }, { label: "Mar", receitas: 10500, despesas: 8100 }, { label: "Abr", receitas: 11200, despesas: 7800 }, { label: "Mai", receitas: 10800, despesas: 9200 }, { label: "Jun", receitas: 12100, despesas: 8500 }, { label: "Jul", receitas: 12450, despesas: 8320 }],
  "1y": [{ label: "Ago/24", receitas: 8200, despesas: 6800 }, { label: "Set", receitas: 8500, despesas: 7100 }, { label: "Out", receitas: 9000, despesas: 7400 }, { label: "Nov", receitas: 9200, despesas: 7900 }, { label: "Dez", receitas: 11500, despesas: 10200 }, { label: "Jan/25", receitas: 9100, despesas: 7600 }, { label: "Fev", receitas: 9800, despesas: 7200 }, { label: "Mar", receitas: 10500, despesas: 8100 }, { label: "Abr", receitas: 11200, despesas: 7800 }, { label: "Mai", receitas: 10800, despesas: 9200 }, { label: "Jun", receitas: 12100, despesas: 8500 }, { label: "Jul", receitas: 12450, despesas: 8320 }],
  "5y": [{ label: "2021", receitas: 72000, despesas: 65000 }, { label: "2022", receitas: 89000, despesas: 78000 }, { label: "2023", receitas: 102000, despesas: 88000 }, { label: "2024", receitas: 118000, despesas: 96000 }, { label: "2025", receitas: 75000, despesas: 52000 }],
  "10y": [{ label: "2016", receitas: 42000, despesas: 39000 }, { label: "2017", receitas: 48000, despesas: 43000 }, { label: "2018", receitas: 54000, despesas: 48000 }, { label: "2019", receitas: 58000, despesas: 52000 }, { label: "2020", receitas: 52000, despesas: 50000 }, { label: "2021", receitas: 72000, despesas: 65000 }, { label: "2022", receitas: 89000, despesas: 78000 }, { label: "2023", receitas: 102000, despesas: 88000 }, { label: "2024", receitas: 118000, despesas: 96000 }, { label: "2025", receitas: 75000, despesas: 52000 }],
  "25y": [{ label: "2001", receitas: 12000, despesas: 11500 }, { label: "2005", receitas: 22000, despesas: 20000 }, { label: "2010", receitas: 36000, despesas: 32000 }, { label: "2015", receitas: 42000, despesas: 38000 }, { label: "2020", receitas: 52000, despesas: 50000 }, { label: "2025", receitas: 75000, despesas: 52000 }],
};

export const mockExpenseCategories = [
  { nome: "Moradia", valor: 2200, cor: "#6366f1" }, { nome: "Alimentação", valor: 1850, cor: "#8b5cf6" },
  { nome: "Transporte", valor: 980, cor: "#a78bfa" }, { nome: "Entretenimento", valor: 520, cor: "#c4b5fd" },
  { nome: "Saúde", valor: 450, cor: "#818cf8" }, { nome: "Educação", valor: 320, cor: "#7c3aed" },
];

export const mockInvestments = [
  { id: 1, nome: "Tesouro Selic 2029", tipo: "Renda Fixa", valor: 12000, rendimento: 12.75, variacao: 0.89, bancoId: 3, bancoNome: "Itaú" },
  { id: 2, nome: "ITSA4", tipo: "Ações", valor: 8500, rendimento: 18.2, variacao: 2.34, bancoId: 2, bancoNome: "Inter" },
  { id: 3, nome: "XPML11", tipo: "FIIs", valor: 5000, rendimento: 9.8, variacao: -0.45, bancoId: 2, bancoNome: "Inter" },
  { id: 4, nome: "Bitcoin", tipo: "Crypto", valor: 3000, rendimento: 45.6, variacao: 5.12, bancoId: 1, bancoNome: "Nubank" },
];

export const mockInvestmentContributions = [
  { id: 1, investimentoId: 1, valor: 500, data: "2025-07-01", tipo: "aporte" },
  { id: 2, investimentoId: 2, valor: 1000, data: "2025-06-15", tipo: "aporte" },
  { id: 3, investimentoId: 1, valor: 500, data: "2025-06-01", tipo: "aporte" },
  { id: 4, investimentoId: 3, valor: 800, data: "2025-05-20", tipo: "aporte" },
  { id: 5, investimentoId: 4, valor: 300, data: "2025-05-10", tipo: "aporte" },
];

export const mockInvestmentChartData = {
  "7d": [{ label: "Seg", valor: 28100 },{ label: "Ter", valor: 28250 },{ label: "Qua", valor: 28180 },{ label: "Qui", valor: 28320 },{ label: "Sex", valor: 28450 },{ label: "Sáb", valor: 28480 },{ label: "Dom", valor: 28500 }],
  "1m": [{ label: "Sem 1", valor: 27200 },{ label: "Sem 2", valor: 27600 },{ label: "Sem 3", valor: 28100 },{ label: "Sem 4", valor: 28500 }],
  "3m": [{ label: "Mai", valor: 25800 },{ label: "Jun", valor: 27100 },{ label: "Jul", valor: 28500 }],
  "6m": [{ label: "Fev", valor: 22000 },{ label: "Mar", valor: 23500 },{ label: "Abr", valor: 24800 },{ label: "Mai", valor: 25800 },{ label: "Jun", valor: 27100 },{ label: "Jul", valor: 28500 }],
  "1y": [{ label: "Ago/24", valor: 15200 },{ label: "Set", valor: 16000 },{ label: "Out", valor: 17300 },{ label: "Nov", valor: 18100 },{ label: "Dez", valor: 19500 },{ label: "Jan/25", valor: 20200 },{ label: "Fev", valor: 22000 },{ label: "Mar", valor: 23500 },{ label: "Abr", valor: 24800 },{ label: "Mai", valor: 25800 },{ label: "Jun", valor: 27100 },{ label: "Jul", valor: 28500 }],
  "5y": [{ label: "2021", valor: 5000 },{ label: "2022", valor: 10200 },{ label: "2023", valor: 16800 },{ label: "2024", valor: 22500 },{ label: "2025", valor: 28500 }],
  "10y": [{ label: "2016", valor: 0 },{ label: "2017", valor: 800 },{ label: "2018", valor: 2100 },{ label: "2019", valor: 3500 },{ label: "2020", valor: 3200 },{ label: "2021", valor: 5000 },{ label: "2022", valor: 10200 },{ label: "2023", valor: 16800 },{ label: "2024", valor: 22500 },{ label: "2025", valor: 28500 }],
  "25y": [{ label: "2001", valor: 0 },{ label: "2005", valor: 0 },{ label: "2010", valor: 0 },{ label: "2015", valor: 0 },{ label: "2020", valor: 3200 },{ label: "2025", valor: 28500 }],
};

export const mockBudgets = [
  { id: 1, categoriaId: 2, categoria: "Alimentação", limite: 1200, gasto: 1110.55 },
  { id: 2, categoriaId: 3, categoria: "Transporte", limite: 500, gasto: 350 },
  { id: 3, categoriaId: 1, categoria: "Moradia", limite: 2500, gasto: 2200 },
  { id: 4, categoriaId: 4, categoria: "Entretenimento", limite: 300, gasto: 89.80 },
  { id: 5, categoriaId: 5, categoria: "Saúde", limite: 400, gasto: 156.30 },
  { id: 6, categoriaId: 6, categoria: "Educação", limite: 500, gasto: 297 },
];

export const mockBankAccounts = [
  { id: 1, nome: "Nubank", tipo: "Conta Corrente", saldo: 12450, cor: "#8b5cf6", agencia: "0001", conta: "12345-6" },
  { id: 2, nome: "Inter", tipo: "Conta Corrente", saldo: 8320.50, cor: "#ef4444", agencia: "0001", conta: "78901-2" },
  { id: 3, nome: "Itaú", tipo: "Conta Poupança", saldo: 25122, cor: "#f97316", agencia: "1234", conta: "56789-0" },
  { id: 4, nome: "Caixa", tipo: "Conta Corrente", saldo: 3200, cor: "#3b82f6", agencia: "4567", conta: "11223-4" },
];

export const mockCards = [
  { id: 1, nome: "Nubank Platinum", numero: "**** **** **** 4532", bandeira: "Mastercard", limite: 15000, usado: 4320.50, vencimento: "15/08", cor: "from-purple-600 to-purple-800", bancoId: 1, bancoNome: "Nubank", faturaAtual: 4320.50, faturaStatus: "aberta" },
  { id: 2, nome: "Inter Black", numero: "**** **** **** 7891", bandeira: "Visa", limite: 20000, usado: 8750, vencimento: "22/08", cor: "from-gray-700 to-gray-900", bancoId: 2, bancoNome: "Inter", faturaAtual: 8750, faturaStatus: "aberta" },
];

export const mockCardInstallments = [
  { id: 1, cardId: 1, descricao: "Shopee - Fone Bluetooth", valorParcela: 49.90, parcelaAtual: 2, totalParcelas: 5, valorTotal: 249.50, data: "2025-06-10", pago: false },
  { id: 2, cardId: 1, descricao: "Shopee - Capinha iPhone", valorParcela: 25, parcelaAtual: 1, totalParcelas: 3, valorTotal: 75, data: "2025-07-05", pago: false },
  { id: 3, cardId: 1, descricao: "Spotify Premium Anual", valorParcela: 23.25, parcelaAtual: 4, totalParcelas: 12, valorTotal: 279, data: "2025-04-01", pago: true },
  { id: 4, cardId: 1, descricao: "Magazine Luiza - TV 50\"", valorParcela: 199.90, parcelaAtual: 3, totalParcelas: 10, valorTotal: 1999, data: "2025-05-15", pago: false },
  { id: 5, cardId: 1, descricao: "Amazon - Kindle", valorParcela: 83.16, parcelaAtual: 2, totalParcelas: 6, valorTotal: 499, data: "2025-06-01", pago: false },
  { id: 6, cardId: 2, descricao: "Casas Bahia - Geladeira", valorParcela: 349.90, parcelaAtual: 5, totalParcelas: 12, valorTotal: 4198.80, data: "2025-03-10", pago: false },
  { id: 7, cardId: 2, descricao: "Shopee - Kit Cozinha", valorParcela: 89.90, parcelaAtual: 1, totalParcelas: 4, valorTotal: 359.60, data: "2025-07-12", pago: false },
  { id: 8, cardId: 2, descricao: "Udemy - Cursos Dev", valorParcela: 47.40, parcelaAtual: 2, totalParcelas: 3, valorTotal: 142.20, data: "2025-06-18", pago: true },
  { id: 9, cardId: 2, descricao: "AliExpress - Acessórios", valorParcela: 65, parcelaAtual: 1, totalParcelas: 2, valorTotal: 130, data: "2025-07-08", pago: false },
  { id: 10, cardId: 2, descricao: "iFood - Clube Mensal", valorParcela: 29.90, parcelaAtual: 6, totalParcelas: 12, valorTotal: 358.80, data: "2025-02-01", pago: true },
];

export const mockFinancings = [
  { id: 1, nome: "Financiamento Apartamento", bancoId: 4, bancoNome: "Caixa", valorTotal: 320000, valorPago: 48000, parcelas: 360, parcelaAtual: 36, valorParcela: 1850, taxa: 8.5, status: "ativo" },
];

export const mockFinancialGoals = [
  { id: 1, nome: "Fundo de emergência", valorAtual: 1, valorMeta: 12000, prazo: "2026-12-12", icone: "Shield" },
  { id: 2, nome: "Final do ano", valorAtual: 175, valorMeta: 10000, prazo: "2026-12-31", icone: "Target" },
];

export const mockDueItems = {
  vencidos: { receitas: 94.23, despesas: 5943.71 },
  vencendo: { receitas: 0, despesas: 764.78 },
  futuro: { receitas: 0, despesas: 0 },
};
