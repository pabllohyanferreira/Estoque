const jwt = require('jsonwebtoken');
const databaseManager = require('../database/databaseManager');

const getUserDatabase = (req, res, next) => {
  try {
    console.log('🗄️ Configurando banco de dados do usuário para:', req.path);
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ Token não fornecido no getUserDatabase');
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lojify-secret-key');
    console.log('✅ Token decodificado, usuário ID:', decoded.userId);
    
    // Adicionar informações do usuário à requisição
    req.user = decoded;
    req.userId = decoded.userId;
    
    // Obter o banco de dados específico do usuário
    req.userDb = databaseManager.getUserDatabase(decoded.userId);
    console.log('✅ Banco de dados do usuário configurado:', req.userDb ? 'SIM' : 'NÃO');
    
    next();
  } catch (error) {
    console.error('❌ Erro na verificação do token no getUserDatabase:', error);
    
    // Verificar se é erro de token expirado
    if (error.name === 'TokenExpiredError') {
      console.log('⏰ Token expirado em:', error.expiredAt);
      return res.status(401).json({ 
        error: 'Token expirado', 
        message: 'Sua sessão expirou. Faça login novamente.',
        expiredAt: error.expiredAt
      });
    }
    
    // Outros erros de token
    return res.status(403).json({ 
      error: 'Token inválido',
      message: 'Token de autenticação inválido. Faça login novamente.'
    });
  }
};

module.exports = { getUserDatabase };
