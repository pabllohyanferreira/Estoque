// Configurações de produção
module.exports = {
  // Configurações do Servidor
  PORT: process.env.PORT || 5000,
  NODE_ENV: 'production',

  // Configurações do Banco de Dados
  DB_PATH: process.env.DB_PATH || './database/estoque.db',

  // Configurações do Mercado Pago (PRODUÇÃO)
  MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
  MERCADOPAGO_PUBLIC_KEY: process.env.MERCADOPAGO_PUBLIC_KEY,
  MERCADOPAGO_WEBHOOK_URL: process.env.MERCADOPAGO_WEBHOOK_URL,

  // Configurações do Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://seu-dominio.com',

  // Configurações de Segurança
  JWT_SECRET: process.env.JWT_SECRET,
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

  // Configurações de Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp',

  // Configurações do PIX (PRODUÇÃO)
  PIX_KEY: process.env.PIX_KEY,
  PIX_MERCHANT_NAME: process.env.PIX_MERCHANT_NAME || 'Lojify',
  PIX_MERCHANT_CITY: process.env.PIX_MERCHANT_CITY || 'São Paulo',
  PIX_MERCHANT_CITY_CODE: process.env.PIX_MERCHANT_CITY_CODE || '3550308',


  // Configurações de CORS
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://seu-dominio.com'],

  // Configurações de Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // Configurações de Log
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || './logs/app.log',

  // Configurações de Backup
  BACKUP_ENABLED: process.env.BACKUP_ENABLED === 'true',
  BACKUP_SCHEDULE: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Diário às 2h
  BACKUP_RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30
};
