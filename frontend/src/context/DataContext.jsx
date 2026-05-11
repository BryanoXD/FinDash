/**
 * DataContext - Global state management for FinDash
 * Handles API calls and provides data to all components
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';

const DataContext = createContext(null);

export function DataProvider({ children, user }) {
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [financings, setFinancings] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [planejamentos, setPlanejamentos] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  // Load all data on mount
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        categoriesData,
        tagsData,
        transactionsData,
        accountsData,
        cardsData,
        installmentsData,
        investmentsData,
        contributionsData,
        financingsData,
        budgetsData,
        goalsData,
        planejamentosData,
        subscriptionsData,
      ] = await Promise.all([
        api.categories.getAll(),
        api.tags.getAll(),
        api.transactions.getAll(),
        api.accounts.getAll(),
        api.cards.getAll(),
        api.cards.getAllInstallments(),
        api.investments.getAll(),
        api.investments.getAllContributions(),
        api.financings.getAll(),
        api.budgets.getAll(),
        api.goals.getAll(),
        api.planejamentos.getAll(),
        api.subscriptions.getAll(),
      ]);

      setCategories(categoriesData);
      setTags(tagsData);
      setTransactions(transactionsData);
      setAccounts(accountsData);
      setCards(cardsData);
      setInstallments(installmentsData);
      setInvestments(investmentsData);
      setContributions(contributionsData);
      setFinancings(financingsData);
      setBudgets(budgetsData);
      setGoals(goalsData);
      setPlanejamentos(planejamentosData);
      setSubscriptions(subscriptionsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ============== CATEGORY ACTIONS ==============
  const createCategory = async (data) => {
    const newCat = await api.categories.create(data);
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = async (id, data) => {
    const updated = await api.categories.update(id, data);
    setCategories(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  };

  const deleteCategory = async (id) => {
    await api.categories.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // ============== TAG ACTIONS ==============
  const createTag = async (data) => {
    const newTag = await api.tags.create(data);
    setTags(prev => [...prev, newTag]);
    return newTag;
  };

  const updateTag = async (id, data) => {
    const updated = await api.tags.update(id, data);
    setTags(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteTag = async (id) => {
    await api.tags.delete(id);
    setTags(prev => prev.filter(t => t.id !== id));
  };

  // ============== TRANSACTION ACTIONS ==============
  const createTransaction = async (data) => {
    const newTx = await api.transactions.create(data);
    setTransactions(prev => [newTx, ...prev]);
    // Reload budgets to get updated spent values
    const updatedBudgets = await api.budgets.getAll();
    setBudgets(updatedBudgets);
    return newTx;
  };

  const updateTransaction = async (id, data) => {
    const updated = await api.transactions.update(id, data);
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    // Reload budgets to get updated spent values
    const updatedBudgets = await api.budgets.getAll();
    setBudgets(updatedBudgets);
    return updated;
  };

  const deleteTransaction = async (id) => {
    await api.transactions.delete(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    // Reload budgets to get updated spent values
    const updatedBudgets = await api.budgets.getAll();
    setBudgets(updatedBudgets);
  };

  const toggleTransactionPaid = async (id) => {
    const result = await api.transactions.togglePaid(id);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, pago: result.pago } : t));
    // Reload budgets to get updated spent values
    const updatedBudgets = await api.budgets.getAll();
    setBudgets(updatedBudgets);
    return result;
  };

  // ============== ACCOUNT ACTIONS ==============
  const createAccount = async (data) => {
    const newAcc = await api.accounts.create(data);
    setAccounts(prev => [...prev, newAcc]);
    return newAcc;
  };

  const updateAccount = async (id, data) => {
    const updated = await api.accounts.update(id, data);
    setAccounts(prev => prev.map(a => a.id === id ? updated : a));
    return updated;
  };

  const deleteAccount = async (id) => {
    await api.accounts.delete(id);
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  // ============== CARD ACTIONS ==============
  const createCard = async (data) => {
    const newCard = await api.cards.create(data);
    setCards(prev => [...prev, newCard]);
    return newCard;
  };

  const updateCard = async (id, data) => {
    const updated = await api.cards.update(id, data);
    setCards(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  };

  const deleteCard = async (id) => {
    await api.cards.delete(id);
    setCards(prev => prev.filter(c => c.id !== id));
    setInstallments(prev => prev.filter(i => i.card_id !== id));
  };

  const payCardInvoice = async (cardId) => {
    const result = await api.cards.payInvoice(cardId);
    // Reload cards and installments to get updated values
    const [updatedCards, updatedInstallments] = await Promise.all([
      api.cards.getAll(),
      api.cards.getAllInstallments(),
    ]);
    setCards(updatedCards);
    setInstallments(updatedInstallments);
    return result;
  };

  const createInstallment = async (data) => {
    const newInst = await api.cards.createInstallment(data);
    setInstallments(prev => [...prev, newInst]);
    // Reload cards to get updated totals
    const updatedCards = await api.cards.getAll();
    setCards(updatedCards);
    return newInst;
  };

  const createInstallmentBatch = async (data) => {
    const result = await api.cards.createInstallmentBatch(data);
    // Reload cards and installments to get updated totals
    const [updatedCards, updatedInstallments] = await Promise.all([
      api.cards.getAll(),
      api.cards.getAllInstallments(),
    ]);
    setCards(updatedCards);
    setInstallments(updatedInstallments);
    return result;
  };

  const payInstallment = async (id) => {
    const result = await api.cards.payInstallment(id);
    // Reload cards and installments
    const [updatedCards, updatedInstallments] = await Promise.all([
      api.cards.getAll(),
      api.cards.getAllInstallments(),
    ]);
    setCards(updatedCards);
    setInstallments(updatedInstallments);
    return result;
  };

  const deleteInstallment = async (id) => {
    await api.cards.deleteInstallment(id);
    setInstallments(prev => prev.filter(i => i.id !== id));
    // Reload cards to get updated totals
    const updatedCards = await api.cards.getAll();
    setCards(updatedCards);
  };

  // ============== INVESTMENT ACTIONS ==============
  const createInvestment = async (data) => {
    const newInv = await api.investments.create(data);
    setInvestments(prev => [...prev, newInv]);
    return newInv;
  };

  const updateInvestment = async (id, data) => {
    const updated = await api.investments.update(id, data);
    setInvestments(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  };

  const deleteInvestment = async (id) => {
    await api.investments.delete(id);
    setInvestments(prev => prev.filter(i => i.id !== id));
    setContributions(prev => prev.filter(c => c.investimento_id !== id));
  };

  const createContribution = async (data) => {
    const newContrib = await api.investments.createContribution(data);
    setContributions(prev => [newContrib, ...prev]);
    // Reload investments to get updated values
    const updatedInvestments = await api.investments.getAll();
    setInvestments(updatedInvestments);
    return newContrib;
  };

  // ============== FINANCING ACTIONS ==============
  const createFinancing = async (data) => {
    const newFin = await api.financings.create(data);
    setFinancings(prev => [...prev, newFin]);
    return newFin;
  };

  const updateFinancing = async (id, data) => {
    const updated = await api.financings.update(id, data);
    setFinancings(prev => prev.map(f => f.id === id ? updated : f));
    return updated;
  };

  const deleteFinancing = async (id) => {
    await api.financings.delete(id);
    setFinancings(prev => prev.filter(f => f.id !== id));
  };

  const payFinancingInstallment = async (id) => {
    const result = await api.financings.payInstallment(id);
    const updatedFinancings = await api.financings.getAll();
    setFinancings(updatedFinancings);
    return result;
  };

  const payFinancingCustom = async (id, valor) => {
    const result = await api.financings.payCustom(id, valor);
    const updatedFinancings = await api.financings.getAll();
    setFinancings(updatedFinancings);
    return result;
  };

  // ============== BUDGET ACTIONS ==============
  const createBudget = async (data) => {
    const newBudget = await api.budgets.create(data);
    setBudgets(prev => [...prev, newBudget]);
    return newBudget;
  };

  const updateBudget = async (id, data) => {
    const updated = await api.budgets.update(id, data);
    setBudgets(prev => prev.map(b => b.id === id ? updated : b));
    return updated;
  };

  const deleteBudget = async (id) => {
    await api.budgets.delete(id);
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  // ============== GOAL ACTIONS ==============
  const createGoal = async (data) => {
    const newGoal = await api.goals.create(data);
    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  };

  const updateGoal = async (id, data) => {
    const updated = await api.goals.update(id, data);
    setGoals(prev => prev.map(g => g.id === id ? updated : g));
    return updated;
  };

  const deleteGoal = async (id) => {
    await api.goals.delete(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const contributeToGoal = async (id, valor) => {
    const result = await api.goals.contribute(id, valor);
    setGoals(prev => prev.map(g => g.id === id ? { ...g, valor_atual: result.valor_atual } : g));
    return result;
  };

  // ============== PLANEJAMENTO ACTIONS ==============
  const createPlanejamento = async (data) => {
    const novo = await api.planejamentos.create(data);
    setPlanejamentos(prev => [novo, ...prev]);
    return novo;
  };

  const updatePlanejamento = async (id, data) => {
    const updated = await api.planejamentos.update(id, data);
    setPlanejamentos(prev => prev.map(p => p.id === id ? updated : p));
    // Goal may have been created/updated/synced server-side; refresh goals
    if (
      data.orcamentos !== undefined ||
      data.titulo !== undefined ||
      data.criar_meta !== undefined ||
      data.prazo !== undefined
    ) {
      const updatedGoals = await api.goals.getAll();
      setGoals(updatedGoals);
    }
    return updated;
  };

  const deletePlanejamento = async (id, { deleteLinkedGoals = false } = {}) => {
    const result = await api.planejamentos.delete(id, { deleteLinkedGoals });
    setPlanejamentos(prev => prev.filter(p => p.id !== id));
    if (deleteLinkedGoals) {
      const updatedGoals = await api.goals.getAll();
      setGoals(updatedGoals);
    }
    return result;
  };

  const deletePlanGoal = async (planId) => {
    const result = await api.planejamentos.deletePlanGoal(planId);
    const [updatedPlan, updatedGoals] = await Promise.all([
      api.planejamentos.get(planId),
      api.goals.getAll(),
    ]);
    setPlanejamentos(prev => prev.map(p => p.id === planId ? updatedPlan : p));
    setGoals(updatedGoals);
    return result;
  };

  // ============== SUBSCRIPTION ACTIONS ==============
  const reloadSubscriptions = async () => {
    const list = await api.subscriptions.getAll();
    setSubscriptions(list);
    return list;
  };

  const createSubscription = async (data) => {
    await api.subscriptions.create(data);
    return reloadSubscriptions();
  };

  const updateSubscription = async (id, data) => {
    await api.subscriptions.update(id, data);
    return reloadSubscriptions();
  };

  const deleteSubscription = async (id) => {
    await api.subscriptions.delete(id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const chargeSubscriptionNow = async (id) => {
    const result = await api.subscriptions.chargeNow(id);
    const [subs, txs] = await Promise.all([
      api.subscriptions.getAll(),
      api.transactions.getAll(),
    ]);
    setSubscriptions(subs);
    setTransactions(txs);
    return result;
  };

  // ============== COMPUTED VALUES ==============
  const getSummary = () => {
    const receitas = transactions.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const despesas = transactions.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
    const totalInvestido = investments.reduce((sum, i) => sum + i.valor, 0);
    
    return {
      saldoTotal: receitas - despesas + totalInvestido,
      receitas,
      despesas,
      investimentos: totalInvestido,
    };
  };

  const value = {
    // User
    user,
    
    // Loading states
    isLoading,
    error,
    
    // Data
    categories,
    tags,
    transactions,
    accounts,
    cards,
    installments,
    investments,
    contributions,
    financings,
    budgets,
    goals,
    planejamentos,
    subscriptions,
    
    // Actions
    loadAllData,
    refreshData: loadAllData,
    createCategory, updateCategory, deleteCategory,
    createTag, updateTag, deleteTag,
    createTransaction, updateTransaction, deleteTransaction, toggleTransactionPaid,
    createAccount, updateAccount, deleteAccount,
    createCard, updateCard, deleteCard, payCardInvoice,
    createInstallment, createInstallmentBatch, payInstallment, deleteInstallment,
    createInvestment, updateInvestment, deleteInvestment, createContribution,
    createFinancing, updateFinancing, deleteFinancing, payFinancingInstallment, payFinancingCustom,
    createBudget, updateBudget, deleteBudget,
    createGoal, updateGoal, deleteGoal, contributeToGoal,
    createPlanejamento, updatePlanejamento, deletePlanejamento, deletePlanGoal,
    createSubscription, updateSubscription, deleteSubscription, chargeSubscriptionNow, reloadSubscriptions,
    
    // Computed
    getSummary,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

export default DataContext;
