const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database/init');
const itemRoutes = require('./routes/items');
const clientRoutes = require('./routes/clients');
const accountRoutes = require('./routes/accounts');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicializar banco de dados
initializeDatabase();

// Rotas
app.use('/api/items', itemRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/accounts', accountRoutes);

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Sistema de Estoque funcionando!' });
});

// Servir arquivos estáticos do React em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
}); 