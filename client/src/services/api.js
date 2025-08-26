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
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Serviços para Itens
export const itemsAPI = {
  getAll: (params = {}) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
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
};

// Serviços para Contas a Receber
export const accountsReceivableAPI = {
  getAll: (params = {}) => api.get('/accounts/receivable', { params }),
  getById: (id) => api.get(`/accounts/receivable/${id}`),
  create: (data) => api.post('/accounts/receivable', data),
  update: (id, data) => api.put(`/accounts/receivable/${id}`, data),
  delete: (id) => api.delete(`/accounts/receivable/${id}`),
};

// Serviços para Estatísticas
export const statsAPI = {
  getAccountsStats: () => api.get('/accounts/stats'),
};

export default api; 