// Configurações de produção para o cliente React
module.exports = {
  // URL da API em produção
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'https://api.seu-dominio.com/api',
  
  // Nome da aplicação
  REACT_APP_APP_NAME: process.env.REACT_APP_APP_NAME || 'Lojify',
  
  // Versão da aplicação
  REACT_APP_VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  
  // Configurações de build
  GENERATE_SOURCEMAP: false,
  FAST_REFRESH: false,
  INLINE_RUNTIME_CHUNK: false,
  
  // Configurações de otimização
  NODE_ENV: 'production',
  
  // Configurações de PWA
  REACT_APP_PWA_ENABLED: process.env.REACT_APP_PWA_ENABLED === 'true',
  
  // Configurações de analytics
  REACT_APP_GA_TRACKING_ID: process.env.REACT_APP_GA_TRACKING_ID,
  
  // Configurações de monitoramento
  REACT_APP_SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
  
  // Configurações de feature flags
  REACT_APP_FEATURE_PAYMENTS: process.env.REACT_APP_FEATURE_PAYMENTS !== 'false',
  REACT_APP_FEATURE_REPORTS: process.env.REACT_APP_FEATURE_REPORTS !== 'false',
  REACT_APP_FEATURE_INVENTORY: process.env.REACT_APP_FEATURE_INVENTORY !== 'false'
};
