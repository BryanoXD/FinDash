// Mock data for FinDash financial dashboard

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
  {
    id: 1,
    descricao: "Salário",
    categoria: "Receita",
    valor: 8500.00,
    tipo: "receita",
    data: "2025-07-01",
    icone: "Briefcase",
  },
  {
    id: 2,
    descricao: "Aluguel",
    categoria: "Moradia",
    valor: 2200.00,
    tipo: "despesa",
    data: "2025-07-05",
    icone: "Home",
  },
  {
    id: 3,
    descricao: "Supermercado Extra",
    categoria: "Alimentação",
    valor: 687.45,
    tipo: "despesa",
    data: "2025-07-08",
    icone: "ShoppingCart",
  },
  {
    id: 4,
    descricao: "Freelance Design",
    categoria: "Receita",
    valor: 3200.00,
    tipo: "receita",
    data: "2025-07-10",
    icone: "Palette",
  },
  {
    id: 5,
    descricao: "Netflix + Spotify",
    categoria: "Entretenimento",
    valor: 89.80,
    tipo: "despesa",
    data: "2025-07-12",
    icone: "Tv",
  },
  {
    id: 6,
    descricao: "Posto de Gasolina",
    categoria: "Transporte",
    valor: 350.00,
    tipo: "despesa",
    data: "2025-07-14",
    icone: "Car",
  },
  {
    id: 7,
    descricao: "Dividendos ITSA4",
    categoria: "Investimentos",
    valor: 450.00,
    tipo: "receita",
    data: "2025-07-15",
    icone: "TrendingUp",
  },
  {
    id: 8,
    descricao: "Farmácia",
    categoria: "Saúde",
    valor: 156.30,
    tipo: "despesa",
    data: "2025-07-16",
    icone: "Heart",
  },
  {
    id: 9,
    descricao: "Curso Online",
    categoria: "Educação",
    valor: 297.00,
    tipo: "despesa",
    data: "2025-07-18",
    icone: "GraduationCap",
  },
  {
    id: 10,
    descricao: "Transferência Recebida",
    categoria: "Receita",
    valor: 1500.00,
    tipo: "receita",
    data: "2025-07-20",
    icone: "ArrowDownLeft",
  },
];

export const mockMonthlyData = [
  { mes: "Fev", receitas: 9800, despesas: 7200 },
  { mes: "Mar", receitas: 10500, despesas: 8100 },
  { mes: "Abr", receitas: 11200, despesas: 7800 },
  { mes: "Mai", receitas: 10800, despesas: 9200 },
  { mes: "Jun", receitas: 12100, despesas: 8500 },
  { mes: "Jul", receitas: 12450, despesas: 8320 },
];

export const mockExpenseCategories = [
  { nome: "Moradia", valor: 2200, cor: "#6366f1" },
  { nome: "Alimentação", valor: 1850, cor: "#8b5cf6" },
  { nome: "Transporte", valor: 980, cor: "#a78bfa" },
  { nome: "Entretenimento", valor: 520, cor: "#c4b5fd" },
  { nome: "Saúde", valor: 450, cor: "#818cf8" },
  { nome: "Educação", valor: 320, cor: "#7c3aed" },
];

export const mockInvestments = [
  {
    id: 1,
    nome: "Tesouro Selic 2029",
    tipo: "Renda Fixa",
    valor: 12000.00,
    rendimento: 12.75,
    variacao: 0.89,
  },
  {
    id: 2,
    nome: "ITSA4",
    tipo: "Ações",
    valor: 8500.00,
    rendimento: 18.2,
    variacao: 2.34,
  },
  {
    id: 3,
    nome: "XPML11",
    tipo: "FIIs",
    valor: 5000.00,
    rendimento: 9.8,
    variacao: -0.45,
  },
  {
    id: 4,
    nome: "Bitcoin",
    tipo: "Crypto",
    valor: 3000.00,
    rendimento: 45.6,
    variacao: 5.12,
  },
];

export const mockBudgets = [
  { categoria: "Moradia", limite: 2500, gasto: 2200 },
  { categoria: "Alimentação", limite: 2000, gasto: 1850 },
  { categoria: "Transporte", limite: 1200, gasto: 980 },
  { categoria: "Entretenimento", limite: 600, gasto: 520 },
  { categoria: "Saúde", limite: 500, gasto: 450 },
  { categoria: "Educação", limite: 400, gasto: 320 },
];

export const mockCards = [
  {
    id: 1,
    nome: "Nubank Platinum",
    numero: "**** **** **** 4532",
    bandeira: "Mastercard",
    limite: 15000,
    usado: 4320.50,
    vencimento: "15/08",
    cor: "from-purple-600 to-purple-800",
  },
  {
    id: 2,
    nome: "Inter Black",
    numero: "**** **** **** 7891",
    bandeira: "Visa",
    limite: 20000,
    usado: 8750.00,
    vencimento: "22/08",
    cor: "from-gray-700 to-gray-900",
  },
];
