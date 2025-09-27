// Suprimir warning de depreciação específico
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('util._extend')) {
    return; // Suprimir este warning específico
  }
  console.warn(warning.name, warning.message);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database/init');
const databaseManager = require('./database/databaseManager');
const { 
  loginLimiter, 
  apiLimiter, 
  corsOptions, 
  securityMiddleware, 
  securityLogger, 
  sanitizeInput 
} = require('./middleware/security');
const itemRoutes = require('./routes/items');
const clientRoutes = require('./routes/clients');
const accountRoutes = require('./routes/accounts');
const stockMovementRoutes = require('./routes/stockMovements');
const salesRoutes = require('./routes/sales');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de Segurança
app.use(securityMiddleware);
app.use(cors(corsOptions));
app.use(apiLimiter);
app.use(securityLogger);
app.use(sanitizeInput);

// Middleware para JSON e URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Inicializar banco de dados e servidor
initializeDatabase().then(() => {
  console.log('🎉 Banco de dados inicializado com sucesso!');
  
  // Rotas
  app.use('/api/auth', loginLimiter, authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/stock-movements', stockMovementRoutes);
  app.use('/api/sales', salesRoutes);

  // Rota de health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Servir arquivos estáticos do React em produção
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
  }

  // Middleware de tratamento de erros
  app.use((err, req, res, next) => {
    console.error('❌ Erro não tratado:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  });

  // Middleware para rotas não encontradas
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Rota não encontrada',
      path: req.originalUrl 
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Lojify Server rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 API base: http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('❌ Erro ao inicializar banco de dados:', err);
  process.exit(1);
});

// Tratamento de sinais para shutdown graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  databaseManager.closeAll();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, encerrando servidor...');
  databaseManager.closeAll();
  process.exit(0);
});
