const jwt = require('jsonwebtoken');
const databaseManager = require('../database/databaseManager');

const getUserDatabase = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lojify-secret-key');
    
    // Adicionar informações do usuário à requisição
    req.user = decoded;
    req.userId = decoded.userId;
    
    // Obter o banco de dados específico do usuário
    req.userDb = databaseManager.getUserDatabase(decoded.userId);
    
    next();
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

module.exports = { getUserDatabase };
