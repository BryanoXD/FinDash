// Mock data for FinDash financial dashboard - Complete

export const mockUser = {
  name: "Carlos Silva",
  email: "carlos.silva@email.com",
  avatar: "CS",
};

export const mockSummary = {
  saldoTotal: 45892.50,
  receitas: 12450.00,
  despesas: 8320.75,
  investimentos: 28500.00,
  saldoVariacao: 12.5,
  receitasVariacao: 8.3,
  despesasVariacao: -3.2,
  investimentosVariacao: 15.7,
};

export const mockTransactions = [
  { id: 1, descricao: "Salário", categoria: "Receita", valor: 8500.00, tipo: "receita", data: "2025-07-01", icone: "Briefcase" },
  { id: 2, descricao: "Aluguel", categoria: "Moradia", valor: 2200.00, tipo: "despesa", data: "2025-07-05", icone: "Home" },
  { id: 3, descricao: "Supermercado Extra", categoria: "Alimentação", valor: 687.45, tipo: "despesa", data: "2025-07-08", icone: "ShoppingCart" },
  { id: 4, descricao: "Freelance Design", categoria: "Receita", valor: 3200.00, tipo: "receita", data: "2025-07-10", icone: "Briefcase" },
  { id: 5, descricao: "Netflix + Spotify", categoria: "Entretenimento", valor: 89.80, tipo: "despesa", data: "2025-07-12", icone: "Tv" },
  { id: 6, descricao: "Posto de Gasolina", categoria: "Transporte", valor: 350.00, tipo: "despesa", data: "2025-07-14", icone: "Car" },
  { id: 7, descricao: "Dividendos ITSA4", categoria: "Investimentos", valor: 450.00, tipo: "receita", data: "2025-07-15", icone: "TrendingUp" },
  { id: 8, descricao: "Farmácia", categoria: "Saúde", valor: 156.30, tipo: "despesa", data: "2025-07-16", icone: "Heart" },
  { id: 9, descricao: "Curso Online", categoria: "Educação", valor: 297.00, tipo: "despesa", data: "2025-07-18", icone: "GraduationCap" },
  { id: 10, descricao: "Transferência Recebida", categoria: "Receita", valor: 1500.00, tipo: "receita", data: "2025-07-20", icone: "ArrowDownLeft" },
];

// Time-period based chart data
export const mockChartDataByPeriod = {
  "7d": [
    { label: "Seg", receitas: 420, despesas: 310 },
    { label: "Ter", receitas: 0, despesas: 687 },
    { label: "Qua", receitas: 3200, despesas: 89 },
    { label: "Qui", receitas: 0, despesas: 350 },
    { label: "Sex", receitas: 450, despesas: 156 },
    { label: "Sáb", receitas: 0, despesas: 297 },
    { label: "Dom", receitas: 1500, despesas: 0 },
  ],
  "1m": [
    { label: "Sem 1", receitas: 8500, despesas: 2887 },
    { label: "Sem 2", receitas: 3200, despesas: 439 },
    { label: "Sem 3", receitas: 450, despesas: 803 },
    { label: "Sem 4", receitas: 1500, despesas: 297 },
  ],
  "3m": [
    { label: "Mai", receitas: 10800, despesas: 9200 },
    { label: "Jun", receitas: 12100, despesas: 8500 },
    { label: "Jul", receitas: 12450, despesas: 8320 },
  ],
  "6m": [
    { label: "Fev", receitas: 9800, despesas: 7200 },
    { label: "Mar", receitas: 10500, despesas: 8100 },
    { label: "Abr", receitas: 11200, despesas: 7800 },
    { label: "Mai", receitas: 10800, despesas: 9200 },
    { label: "Jun", receitas: 12100, despesas: 8500 },
    { label: "Jul", receitas: 12450, despesas: 8320 },
  ],
  "1y": [
    { label: "Ago/24", receitas: 8200, despesas: 6800 },
    { label: "Set", receitas: 8500, despesas: 7100 },
    { label: "Out", receitas: 9000, despesas: 7400 },
    { label: "Nov", receitas: 9200, despesas: 7900 },
    { label: "Dez", receitas: 11500, despesas: 10200 },
    { label: "Jan/25", receitas: 9100, despesas: 7600 },
    { label: "Fev", receitas: 9800, despesas: 7200 },
    { label: "Mar", receitas: 10500, despesas: 8100 },
    { label: "Abr", receitas: 11200, despesas: 7800 },
    { label: "Mai", receitas: 10800, despesas: 9200 },
    { label: "Jun", receitas: 12100, despesas: 8500 },
    { label: "Jul", receitas: 12450, despesas: 8320 },
  ],
  "5y": [
    { label: "2021", receitas: 72000, despesas: 65000 },
    { label: "2022", receitas: 89000, despesas: 78000 },
    { label: "2023", receitas: 102000, despesas: 88000 },
    { label: "2024", receitas: 118000, despesas: 96000 },
    { label: "2025", receitas: 75000, despesas: 52000 },
  ],
  "10y": [
    { label: "2016", receitas: 42000, despesas: 39000 },
    { label: "2017", receitas: 48000, despesas: 43000 },
    { label: "2018", receitas: 54000, despesas: 48000 },
    { label: "2019", receitas: 58000, despesas: 52000 },
    { label: "2020", receitas: 52000, despesas: 50000 },
    { label: "2021", receitas: 72000, despesas: 65000 },
    { label: "2022", receitas: 89000, despesas: 78000 },
    { label: "2023", receitas: 102000, despesas: 88000 },
    { label: "2024", receitas: 118000, despesas: 96000 },
    { label: "2025", receitas: 75000, despesas: 52000 },
  ],
  "25y": [
    { label: "2001", receitas: 12000, despesas: 11500 },
    { label: "2005", receitas: 22000, despesas: 20000 },
    { label: "2010", receitas: 36000, despesas: 32000 },
    { label: "2015", receitas: 42000, despesas: 38000 },
    { label: "2020", receitas: 52000, despesas: 50000 },
    { label: "2025", receitas: 75000, despesas: 52000 },
  ],
};

export const mockExpenseCategories = [
  { nome: "Moradia", valor: 2200, cor: "#6366f1" },
  { nome: "Alimentação", valor: 1850, cor: "#8b5cf6" },
  { nome: "Transporte", valor: 980, cor: "#a78bfa" },
  { nome: "Entretenimento", valor: 520, cor: "#c4b5fd" },
  { nome: "Saúde", valor: 450, cor: "#818cf8" },
  { nome: "Educação", valor: 320, cor: "#7c3aed" },
];

export const mockInvestments = [
  { id: 1, nome: "Tesouro Selic 2029", tipo: "Renda Fixa", valor: 12000.00, rendimento: 12.75, variacao: 0.89 },
  { id: 2, nome: "ITSA4", tipo: "Ações", valor: 8500.00, rendimento: 18.2, variacao: 2.34 },
  { id: 3, nome: "XPML11", tipo: "FIIs", valor: 5000.00, rendimento: 9.8, variacao: -0.45 },
  { id: 4, nome: "Bitcoin", tipo: "Crypto", valor: 3000.00, rendimento: 45.6, variacao: 5.12 },
];

export const mockInvestmentContributions = [
  { id: 1, investimentoId: 1, valor: 500, data: "2025-07-01", tipo: "aporte" },
  { id: 2, investimentoId: 2, valor: 1000, data: "2025-06-15", tipo: "aporte" },
  { id: 3, investimentoId: 1, valor: 500, data: "2025-06-01", tipo: "aporte" },
  { id: 4, investimentoId: 3, valor: 800, data: "2025-05-20", tipo: "aporte" },
  { id: 5, investimentoId: 4, valor: 300, data: "2025-05-10", tipo: "aporte" },
  { id: 6, investimentoId: 2, valor: 750, data: "2025-04-15", tipo: "aporte" },
];

export const mockInvestmentChartData = {
  "7d": [
    { label: "Seg", valor: 28100 },
    { label: "Ter", valor: 28250 },
    { label: "Qua", valor: 28180 },
    { label: "Qui", valor: 28320 },
    { label: "Sex", valor: 28450 },
    { label: "Sáb", valor: 28480 },
    { label: "Dom", valor: 28500 },
  ],
  "1m": [
    { label: "Sem 1", valor: 27200 },
    { label: "Sem 2", valor: 27600 },
    { label: "Sem 3", valor: 28100 },
    { label: "Sem 4", valor: 28500 },
  ],
  "3m": [
    { label: "Mai", valor: 25800 },
    { label: "Jun", valor: 27100 },
    { label: "Jul", valor: 28500 },
  ],
  "6m": [
    { label: "Fev", valor: 22000 },
    { label: "Mar", valor: 23500 },
    { label: "Abr", valor: 24800 },
    { label: "Mai", valor: 25800 },
    { label: "Jun", valor: 27100 },
    { label: "Jul", valor: 28500 },
  ],
  "1y": [
    { label: "Ago/24", valor: 15200 },
    { label: "Set", valor: 16000 },
    { label: "Out", valor: 17300 },
    { label: "Nov", valor: 18100 },
    { label: "Dez", valor: 19500 },
    { label: "Jan/25", valor: 20200 },
    { label: "Fev", valor: 22000 },
    { label: "Mar", valor: 23500 },
    { label: "Abr", valor: 24800 },
    { label: "Mai", valor: 25800 },
    { label: "Jun", valor: 27100 },
    { label: "Jul", valor: 28500 },
  ],
  "5y": [
    { label: "2021", valor: 5000 },
    { label: "2022", valor: 10200 },
    { label: "2023", valor: 16800 },
    { label: "2024", valor: 22500 },
    { label: "2025", valor: 28500 },
  ],
  "10y": [
    { label: "2016", valor: 0 },
    { label: "2017", valor: 800 },
    { label: "2018", valor: 2100 },
    { label: "2019", valor: 3500 },
    { label: "2020", valor: 3200 },
    { label: "2021", valor: 5000 },
    { label: "2022", valor: 10200 },
    { label: "2023", valor: 16800 },
    { label: "2024", valor: 22500 },
    { label: "2025", valor: 28500 },
  ],
  "25y": [
    { label: "2001", valor: 0 },
    { label: "2005", valor: 0 },
    { label: "2010", valor: 0 },
    { label: "2015", valor: 0 },
    { label: "2020", valor: 3200 },
    { label: "2025", valor: 28500 },
  ],
};

export const mockBudgets = [
  { categoria: "Moradia", limite: 2500, gasto: 2200 },
  { categoria: "Alimentação", limite: 2000, gasto: 1850 },
  { categoria: "Transporte", limite: 1200, gasto: 980 },
  { categoria: "Entretenimento", limite: 600, gasto: 520 },
  { categoria: "Saúde", limite: 500, gasto: 450 },
  { categoria: "Educação", limite: 400, gasto: 320 },
];

// Bank Accounts
export const mockBankAccounts = [
  { id: 1, nome: "Nubank", tipo: "Conta Corrente", saldo: 12450.00, cor: "#8b5cf6", agencia: "0001", conta: "12345-6" },
  { id: 2, nome: "Inter", tipo: "Conta Corrente", saldo: 8320.50, cor: "#ef4444", agencia: "0001", conta: "78901-2" },
  { id: 3, nome: "Itaú", tipo: "Conta Poupança", saldo: 25122.00, cor: "#f97316", agencia: "1234", conta: "56789-0" },
];

// Cards linked to banks
export const mockCards = [
  {
    id: 1, nome: "Nubank Platinum", numero: "**** **** **** 4532", bandeira: "Mastercard",
    limite: 15000, usado: 4320.50, vencimento: "15/08", cor: "from-purple-600 to-purple-800",
    bancoId: 1, bancoNome: "Nubank",
    faturaAtual: 4320.50, faturaStatus: "aberta",
  },
  {
    id: 2, nome: "Inter Black", numero: "**** **** **** 7891", bandeira: "Visa",
    limite: 20000, usado: 8750.00, vencimento: "22/08", cor: "from-gray-700 to-gray-900",
    bancoId: 2, bancoNome: "Inter",
    faturaAtual: 8750.00, faturaStatus: "aberta",
  },
];

// Card Installments (parcelas)
export const mockCardInstallments = [
  { id: 1, cardId: 1, descricao: "Shopee - Fone Bluetooth", valorParcela: 49.90, parcelaAtual: 2, totalParcelas: 5, valorTotal: 249.50, data: "2025-06-10" },
  { id: 2, cardId: 1, descricao: "Shopee - Capinha iPhone", valorParcela: 25.00, parcelaAtual: 1, totalParcelas: 3, valorTotal: 75.00, data: "2025-07-05" },
  { id: 3, cardId: 1, descricao: "Spotify Premium Anual", valorParcela: 23.25, parcelaAtual: 4, totalParcelas: 12, valorTotal: 279.00, data: "2025-04-01" },
  { id: 4, cardId: 1, descricao: "Magazine Luiza - TV 50\"", valorParcela: 199.90, parcelaAtual: 3, totalParcelas: 10, valorTotal: 1999.00, data: "2025-05-15" },
  { id: 5, cardId: 1, descricao: "Amazon - Kindle", valorParcela: 83.16, parcelaAtual: 2, totalParcelas: 6, valorTotal: 499.00, data: "2025-06-01" },
  { id: 6, cardId: 2, descricao: "Casas Bahia - Geladeira", valorParcela: 349.90, parcelaAtual: 5, totalParcelas: 12, valorTotal: 4198.80, data: "2025-03-10" },
  { id: 7, cardId: 2, descricao: "Shopee - Kit Cozinha", valorParcela: 89.90, parcelaAtual: 1, totalParcelas: 4, valorTotal: 359.60, data: "2025-07-12" },
  { id: 8, cardId: 2, descricao: "Udemy - Cursos Dev", valorParcela: 47.40, parcelaAtual: 2, totalParcelas: 3, valorTotal: 142.20, data: "2025-06-18" },
  { id: 9, cardId: 2, descricao: "AliExpress - Acessórios", valorParcela: 65.00, parcelaAtual: 1, totalParcelas: 2, valorTotal: 130.00, data: "2025-07-08" },
  { id: 10, cardId: 2, descricao: "iFood - Clube Mensal", valorParcela: 29.90, parcelaAtual: 6, totalParcelas: 12, valorTotal: 358.80, data: "2025-02-01" },
];

// Financial Goals (Metas)
export const mockFinancialGoals = [
  { id: 1, nome: "Fundo de emergência", valorAtual: 1.00, valorMeta: 12000.00, prazo: "2026-12-12", icone: "Shield" },
  { id: 2, nome: "Final do ano", valorAtual: 175.00, valorMeta: 10000.00, prazo: "2026-12-31", icone: "Target" },
];

// Due items for dashboard overview
export const mockDueItems = {
  vencidos: { receitas: 94.23, despesas: 5943.71 },
  vencendo: { receitas: 0, despesas: 764.78 },
  futuro: { receitas: 0, despesas: 0 },
};
