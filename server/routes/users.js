const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken, requireAdmin, requireAdminOrOwner } = require('../middleware/auth');

const router = express.Router();

// Middleware para validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      error: 'Dados inválidos',
      details: errors.array() 
    });
  }
  next();
};

// Validação para criação de usuário
const createUserValidation = [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('role').optional().isIn(['admin', 'reseller']).withMessage('Role inválido')
];

// Validação para atualização de usuário
const updateUserValidation = [
  body('name').optional().notEmpty().withMessage('Nome não pode estar vazio'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('password').optional().isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('role').optional().isIn(['admin', 'reseller']).withMessage('Role inválido'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status inválido')
];

// Listar todos os usuários (apenas admin)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const { page = 1, limit = 10, status, role } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT id, name, email, role, status, created_at, last_login FROM users WHERE 1=1';
  const params = [];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('❌ Erro ao buscar usuários:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Erro ao buscar usuários' 
      });
    }
    
    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('❌ Erro ao contar usuários:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Erro ao contar usuários' 
        });
      }
      
      res.json({
        success: true,
        users: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// Obter usuário por ID
router.get('/:id', authenticateToken, requireAdminOrOwner, (req, res) => {
  const userId = req.params.id;
  
  db.get(
    'SELECT id, name, email, role, status, mercadopago_access_token, mercadopago_public_key, pix_key, pix_merchant_name, pix_merchant_city, pix_merchant_city_code, created_at, last_login FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        console.error('❌ Erro ao buscar usuário:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Erro ao buscar usuário' 
        });
      }
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'Usuário não encontrado' 
        });
      }
      
      res.json({
        success: true,
        user
      });
    }
  );
});

// Criar novo usuário (apenas admin)
router.post('/', authenticateToken, requireAdmin, createUserValidation, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, role = 'reseller' } = req.body;
    
    // Verificar se email já existe
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
      if (err) {
        console.error('❌ Erro ao verificar email:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Erro interno do servidor' 
        });
      }
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: 'Email já está em uso' 
        });
      }
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Criar usuário
      db.run(
        'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, role, 'active'],
        function(err) {
          if (err) {
            console.error('❌ Erro ao criar usuário:', err);
            return res.status(500).json({ 
              success: false,
              error: 'Erro ao criar usuário' 
            });
          }
          
          console.log('✅ Usuário criado com sucesso:', email);
          
          res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            userId: this.lastID
          });
        }
      );
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// Atualizar usuário
router.put('/:id', authenticateToken, requireAdminOrOwner, updateUserValidation, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, password, role, status } = req.body;
    
    // Verificar se usuário existe
    db.get('SELECT id FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        console.error('❌ Erro ao verificar usuário:', err);
        return res.status(500).json({ 
          success: false,
          error: 'Erro interno do servidor' 
        });
      }
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'Usuário não encontrado' 
        });
      }
      
      // Verificar se email já existe (se estiver sendo alterado)
      if (email) {
        db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], async (err, existingUser) => {
          if (err) {
            console.error('❌ Erro ao verificar email:', err);
            return res.status(500).json({ 
              success: false,
              error: 'Erro interno do servidor' 
            });
          }
          
          if (existingUser) {
            return res.status(400).json({ 
              success: false,
              error: 'Email já está em uso' 
            });
          }
          
          await updateUser();
        });
      } else {
        await updateUser();
      }
      
      async function updateUser() {
        let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
        const params = [];
        
        if (name) {
          updateQuery += ', name = ?';
          params.push(name);
        }
        
        if (email) {
          updateQuery += ', email = ?';
          params.push(email);
        }
        
        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          updateQuery += ', password = ?';
          params.push(hashedPassword);
        }
        
        if (role && req.user.role === 'admin') {
          updateQuery += ', role = ?';
          params.push(role);
        }
        
        if (status && req.user.role === 'admin') {
          updateQuery += ', status = ?';
          params.push(status);
        }
        
        updateQuery += ' WHERE id = ?';
        params.push(userId);
        
        db.run(updateQuery, params, (err) => {
          if (err) {
            console.error('❌ Erro ao atualizar usuário:', err);
            return res.status(500).json({ 
              success: false,
              error: 'Erro ao atualizar usuário' 
            });
          }
          
          console.log('✅ Usuário atualizado com sucesso:', userId);
          
          res.json({
            success: true,
            message: 'Usuário atualizado com sucesso'
          });
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// Atualizar configurações de pagamento do usuário
router.put('/:id/payment-settings', authenticateToken, requireAdminOrOwner, (req, res) => {
  const userId = req.params.id;
  const { mercadopago_access_token, mercadopago_public_key, pix_key, pix_merchant_name, pix_merchant_city, pix_merchant_city_code } = req.body;
  
  const updateQuery = `
    UPDATE users SET 
      mercadopago_access_token = ?,
      mercadopago_public_key = ?,
      pix_key = ?,
      pix_merchant_name = ?,
      pix_merchant_city = ?,
      pix_merchant_city_code = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  const params = [
    mercadopago_access_token,
    mercadopago_public_key,
    pix_key,
    pix_merchant_name,
    pix_merchant_city,
    pix_merchant_city_code,
    userId
  ];
  
  db.run(updateQuery, params, (err) => {
    if (err) {
      console.error('❌ Erro ao atualizar configurações de pagamento:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Erro ao atualizar configurações de pagamento' 
      });
    }
    
    console.log('✅ Configurações de pagamento atualizadas:', userId);
    
    res.json({
      success: true,
      message: 'Configurações de pagamento atualizadas com sucesso'
    });
  });
});

// Deletar usuário (apenas admin)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  
  // Verificar se não é o próprio admin
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ 
      success: false,
      error: 'Não é possível deletar seu próprio usuário' 
    });
  }
  
  db.run('UPDATE users SET status = "inactive" WHERE id = ?', [userId], (err) => {
    if (err) {
      console.error('❌ Erro ao desativar usuário:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Erro ao desativar usuário' 
      });
    }
    
    console.log('✅ Usuário desativado:', userId);
    
    res.json({
      success: true,
      message: 'Usuário desativado com sucesso'
    });
  });
});

module.exports = router;
