import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      hasToken: !!localStorage.getItem('token'),
      tokenLength: localStorage.getItem('token')?.length || 0
    });
    
    // Tratamento específico para erros de rede
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('🔌 Erro de conexão: Servidor não está respondendo');
    }
    
    // Tratamento para token expirado ou inválido
    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorData = error.response?.data;
      console.error('🔐 Erro de autenticação:', errorData);
      
      // Limpar dados de autenticação
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Mostrar mensagem específica se for token expirado
      if (errorData?.error === 'Token expirado') {
        console.log('⏰ Token expirado - redirecionando para login');
        // Aqui você pode adicionar um toast ou notificação
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      } else {
        console.log('🔐 Token inválido - redirecionando para login');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);



// Serviços para Autenticação
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  verify: () => api.get('/auth/verify'),
  logout: () => api.post('/auth/logout'),
};

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

// Serviços para Configurações
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  getByKey: (key) => api.get(`/settings/${key}`),
  save: (settings) => api.post('/settings', { settings }),
  saveByKey: (key, value) => api.put(`/settings/${key}`, { value }),
  delete: (key) => api.delete(`/settings/${key}`),
  deleteAll: () => api.delete('/settings')
};

export default api; 