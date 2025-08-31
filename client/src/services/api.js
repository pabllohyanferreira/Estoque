import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);



// Serviços para Itens
export const itemsAPI = {
  getAll: (params = {}) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/items', data);
    }
    return api.post('/items', data);
  },
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/items/${id}`, data);
    }
    return api.put(`/items/${id}`, data);
  },
  delete: (id) => api.delete(`/items/${id}`),
  updateStock: (id, data) => api.post(`/items/${id}/stock`, data),
  getCategories: () => api.get('/items/categories/list'),
};

// Serviços para Clientes
export const clientsAPI = {
  getAll: (params = {}) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Serviços para Contas a Pagar
export const accountsPayableAPI = {
  getAll: (params = {}) => api.get('/accounts/payable', { params }),
  getById: (id) => api.get(`/accounts/payable/${id}`),
  create: (data) => api.post('/accounts/payable', data),
  update: (id, data) => api.put(`/accounts/payable/${id}`, data),
  delete: (id) => api.delete(`/accounts/payable/${id}`),
  markAsPaid: (id) => api.post(`/accounts/payable/${id}/pay`),
};

// Serviços para Contas a Receber
export const accountsReceivableAPI = {
  getAll: (params = {}) => api.get('/accounts/receivable', { params }),
  getById: (id) => api.get(`/accounts/receivable/${id}`),
  create: (data) => api.post('/accounts/receivable', data),
  update: (id, data) => api.put(`/accounts/receivable/${id}`, data),
  delete: (id) => api.delete(`/accounts/receivable/${id}`),
  markAsPaid: (id) => api.post(`/accounts/receivable/${id}/pay`),
};

// Serviços para Estatísticas
export const statsAPI = {
  getAccountsStats: () => api.get('/accounts/stats'),
};

// Serviços para Movimentações de Estoque
export const stockMovementsAPI = {
  getAll: () => api.get('/stock-movements'),
  getByItem: (itemId) => api.get(`/stock-movements/item/${itemId}`),
  create: (data) => api.post('/stock-movements', data),
  getSummary: (params) => api.get('/stock-movements/summary', { params })
};

// Serviços para Vendas
export const salesAPI = {
  getAll: (params = {}) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  updateStatus: (id, status) => api.patch(`/sales/${id}/status`, { status }),
  delete: (id) => api.delete(`/sales/${id}`),
  getStats: (params = {}) => api.get('/sales/stats/summary', { params })
};

export default api; 