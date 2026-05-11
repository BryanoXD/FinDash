/**
 * FinDash API Service
 * Handles all API calls to the backend
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Helper to make API calls with credentials.
// Uses XMLHttpRequest (instead of fetch) because the preview environment
// monkey-patches window.fetch and consumes error response bodies before the
// app can read them, causing "body stream already read" and preventing the
// real backend error message (e.g. "CSV vazio ou com apenas cabecalho")
// from reaching the UI.
function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body || null;
  const userHeaders = options.headers || {};

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.withCredentials = true;

    // Default Content-Type for JSON bodies
    const headers = { ...userHeaders };
    if (body && !Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) {
      headers['Content-Type'] = 'application/json';
    }
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    xhr.onload = () => {
      const status = xhr.status;
      const text = xhr.responseText || '';

      if (status === 401) {
        return reject(new Error('Sessao expirada. Faca login novamente.'));
      }

      if (status < 200 || status >= 300) {
        let detail = `Erro ${status}`;
        if (text) {
          try {
            const parsed = JSON.parse(text);
            if (parsed && parsed.detail) {
              detail = typeof parsed.detail === 'string'
                ? parsed.detail
                : JSON.stringify(parsed.detail);
            } else if (parsed && parsed.message) {
              detail = parsed.message;
            } else {
              detail = text.length < 300 ? text : detail;
            }
          } catch (_parseErr) {
            // Not JSON - use raw text if short and meaningful
            const trimmed = text.trim();
            if (trimmed && trimmed.length < 300 && !trimmed.startsWith('<')) {
              detail = trimmed;
            }
          }
        }
        return reject(new Error(detail));
      }

      // Success: parse JSON body
      if (!text) return resolve(null);
      try {
        resolve(JSON.parse(text));
      } catch (parseErr) {
        reject(new Error('Resposta invalida do servidor (JSON malformado)'));
      }
    };

    xhr.onerror = () => reject(new Error('Erro de rede: nao foi possivel conectar ao servidor. Verifique sua conexao.'));
    xhr.ontimeout = () => reject(new Error('Tempo esgotado ao processar a requisicao.'));
    xhr.onabort = () => reject(new Error('Requisicao cancelada.'));

    xhr.send(body);
  });
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

// ============== PLANEJAMENTOS ==============
export const planejamentosAPI = {
  getAll: () => apiCall('/api/planejamentos'),

  get: (id) => apiCall(`/api/planejamentos/${id}`),

  create: (data) =>
    apiCall('/api/planejamentos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiCall(`/api/planejamentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id, { deleteLinkedGoals = false } = {}) =>
    apiCall(`/api/planejamentos/${id}?delete_linked_goals=${deleteLinkedGoals ? 'true' : 'false'}`, {
      method: 'DELETE',
    }),

  deleteOrcamentoGoal: (planId, orcId) =>
    apiCall(`/api/planejamentos/${planId}/orcamentos/${orcId}/goal`, { method: 'DELETE' }),
};

// Import API
const importAPI = {
  upload: async (file) => {
    if (!file) throw new Error('Nenhum arquivo selecionado');
    if (file.size === 0) throw new Error('Arquivo vazio');
    if (file.size > 10 * 1024 * 1024) throw new Error('Arquivo muito grande. Maximo 10MB.');
    
    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'ofx', 'pdf'].includes(ext)) {
      throw new Error(`Formato .${ext} nao suportado. Use CSV, OFX ou PDF.`);
    }
    
    // Convert to base64
    let fileBase64;
    try {
      fileBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          const base64 = result.split(',')[1];
          if (!base64) reject(new Error('Falha ao converter arquivo para base64'));
          else resolve(base64);
        };
        reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
        reader.readAsDataURL(file);
      });
    } catch (e) {
      throw new Error(`Erro ao ler arquivo: ${e.message}`);
    }
    
    return apiCall('/api/import/upload', {
      method: 'POST',
      body: JSON.stringify({ file_base64: fileBase64, filename: file.name }),
    });
  },
  confirm: (data) =>
    apiCall('/api/import/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  history: () => apiCall('/api/import/history'),
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
  planejamentos: planejamentosAPI,
  import: importAPI,
};

export default api;
