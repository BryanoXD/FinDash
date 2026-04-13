/**
 * FinDash API Service
 * Handles all API calls to the backend
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Helper to make API calls with credentials
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (response.status === 401) {
    throw new Error('Unauthorized');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  
  return response.json();
}

// ============== AUTH ==============
export const authAPI = {
  createSession: (sessionId) =>
    apiCall('/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),
  
  getMe: () => apiCall('/api/auth/me'),
  
  logout: () =>
    apiCall('/api/auth/logout', { method: 'POST' }),
};

// ============== CATEGORIES ==============
export const categoriesAPI = {
  getAll: () => apiCall('/api/categories'),
  
  create: (data) =>
    apiCall('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    apiCall(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    apiCall(`/api/categories/${id}`, { method: 'DELETE' }),
};

// ============== TAGS ==============
export const tagsAPI = {
  getAll: () => apiCall('/api/tags'),
  
  create: (data) =>
    apiCall('/api/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    apiCall(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    apiCall(`/api/tags/${id}`, { method: 'DELETE' }),
};

// ============== TRANSACTIONS ==============
export const transactionsAPI = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.tipo) queryParams.append('tipo', params.tipo);
    if (params.categoria_id) queryParams.append('categoria_id', params.categoria_id);
    const query = queryParams.toString();
    return apiCall(`/api/transactions${query ? `?${query}` : ''}`);
  },
  
  create: (data) =>
    apiCall('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    apiCall(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    apiCall(`/api/transactions/${id}`, { method: 'DELETE' }),
  
  getSummary: () => apiCall('/api/transactions/summary'),
  
  togglePaid: (id) =>
    apiCall(`/api/transactions/${id}/toggle-paid`, { method: 'PATCH' }),
};

// ============== ACCOUNTS ==============
export const accountsAPI = {
  getAll: () => apiCall('/api/accounts'),
  
  create: (data) =>
    apiCall('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    apiCall(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    apiCall(`/api/accounts/${id}`, { method: 'DELETE' }),
};

// ============== CARDS ==============
export const cardsAPI = {
  getAll: () => apiCall('/api/cards'),
  
  create: (data) =>
    apiCall('/api/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    apiCall(`/api/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    apiCall(`/api/cards/${id}`, { method: 'DELETE' }),
  
  payInvoice: (id) =>
    apiCall(`/api/cards/${id}/pay-invoice`, { method: 'POST' }),
  
  getInstallments: (cardId) =>
    apiCall(`/api/cards/${cardId}/installments`),
  
  getAllInstallments: () =>
    apiCall('/api/cards/installments/all'),
  
  createInstallment: (data) =>
    apiCall('/api/cards/installments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  createInstallmentBatch: (data) =>
    apiCall('/api/cards/installments/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateInstallment: (id, data) =>
    apiCall(`/api/cards/installments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  payInstallment: (id) =>
    apiCall(`/api/cards/installments/${id}/pay`, { method: 'POST' }),
  
  deleteInstallment: (id) =>
    apiCall(`/api/cards/installments/${id}`, { method: 'DELETE' }),
};

// ============== INVESTMENTS ==============
export const investmentsAPI = {
  getAll: () => apiCall('/api/investments'),
  
  create: (data) =>
    apiCall('/api/investments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    apiCall(`/api/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    apiCall(`/api/investments/${id}`, { method: 'DELETE' }),
  
  getTotal: () => apiCall('/api/investments/total'),
  
  getContributions: (investmentId) =>
    apiCall(`/api/investments/${investmentId}/contributions`),
  
  getAllContributions: () =>
    apiCall('/api/investments/contributions/all'),
  
  createContribution: (data) =>
    apiCall('/api/investments/contributions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============== FINANCINGS ==============
export const financingsAPI = {
  getAll: () => apiCall('/api/financings'),
  
  create: (data) =>
    apiCall('/api/financings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    apiCall(`/api/financings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    apiCall(`/api/financings/${id}`, { method: 'DELETE' }),
  
  payInstallment: (id) =>
    apiCall(`/api/financings/${id}/pay-installment`, { method: 'POST' }),
  
  payCustom: (id, valor) =>
    apiCall(`/api/financings/${id}/pay-custom`, {
      method: 'POST',
      body: JSON.stringify({ valor }),
    }),
};

// ============== BUDGETS ==============
export const budgetsAPI = {
  getAll: () => apiCall('/api/budgets'),
  
  create: (data) =>
    apiCall('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    apiCall(`/api/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    apiCall(`/api/budgets/${id}`, { method: 'DELETE' }),
  
  getSummary: () => apiCall('/api/budgets/summary'),
};

// ============== GOALS ==============
export const goalsAPI = {
  getAll: () => apiCall('/api/goals'),
  
  create: (data) =>
    apiCall('/api/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    apiCall(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    apiCall(`/api/goals/${id}`, { method: 'DELETE' }),
  
  contribute: (id, valor) =>
    apiCall(`/api/goals/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ valor }),
    }),
};

// Export all APIs
const api = {
  auth: authAPI,
  categories: categoriesAPI,
  tags: tagsAPI,
  transactions: transactionsAPI,
  accounts: accountsAPI,
  cards: cardsAPI,
  investments: investmentsAPI,
  financings: financingsAPI,
  budgets: budgetsAPI,
  goals: goalsAPI,
};

export default api;
