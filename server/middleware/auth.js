const jwt = require('jsonwebtoken');
const { db } = require('../database/init');

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 Verificando autenticação para:', req.path);
  console.log('🔑 Token recebido:', token ? 'SIM' : 'NÃO');

  if (!token) {
    console.log('❌ Token não fornecido');
    return res.status(401).json({
      success: false,
      message: 'Token de acesso necessário'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'lojify-secret-key', (err, decoded) => {
    if (err) {
      console.log('❌ Token inválido:', err.message);
      return res.status(403).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    console.log('✅ Token válido, usuário ID:', decoded.userId);

    // Buscar usuário no banco para verificar se ainda está ativo
    db.get(
      'SELECT id, name, email, role, status FROM users WHERE id = ? AND status = "active"',
      [decoded.userId],
      (err, user) => {
        if (err) {
          console.error('❌ Erro ao verificar usuário:', err);
          return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
          });
        }

        if (!user) {
          return res.status(403).json({
            success: false,
            message: 'Usuário não encontrado ou inativo'
          });
        }

        // Adicionar informações do usuário à requisição
        req.user = user;
        next();
      }
    );
  });
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.'
    });
  }
  next();
};

// Middleware para verificar se é admin ou o próprio usuário
const requireAdminOrOwner = (req, res, next) => {
  const userId = parseInt(req.params.userId || req.body.userId || req.query.userId);
  
  if (req.user.role === 'admin' || req.user.id === userId) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Você só pode acessar seus próprios dados.'
    });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminOrOwner
};
