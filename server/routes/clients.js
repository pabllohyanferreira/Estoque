const express = require('express');
const { body, validationResult } = require('express-validator');
const { getUserDatabase } = require('../middleware/userDatabase');

const router = express.Router();

// Buscar todos os clientes
router.get('/', getUserDatabase, (req, res) => {
  const { search, type } = req.query;
  
  let query = 'SELECT * FROM clients WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR document LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  
  query += ' ORDER BY name';
  
  req.userDb.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar clientes', details: err.message });
    }
    res.json(rows);
  });
});

// Buscar cliente por ID
router.get('/:id', getUserDatabase, (req, res) => {
  const { id } = req.params;
  
  req.userDb.get('SELECT * FROM clients WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar cliente', details: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(row);
  });
});

// Criar novo cliente
router.post('/', getUserDatabase, [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').optional().isEmail().withMessage('Email deve ser válido')
], (req, res) => {
  console.log('📝 Dados recebidos para criar cliente:', req.body);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Erros de validação:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name, email, phone, address, cpf_cnpj, type
  } = req.body;
  
  console.log('✅ Validação passou, criando cliente:', { name, email, type });

  const query = `
    INSERT INTO clients (name, email, phone, address, document, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  console.log('💾 Inserindo cliente no banco...');
  req.userDb.run(query, [name, email, phone, address, cpf_cnpj, type || 'individual'], function(err) {
    if (err) {
      console.error('❌ Erro ao criar cliente:', err);
      return res.status(500).json({ error: 'Erro ao criar cliente', details: err.message });
    }
    
    console.log('✅ Cliente criado com ID:', this.lastID);
    res.status(201).json({ 
      id: this.lastID, 
      message: 'Cliente criado com sucesso' 
    });
  });
});

// Atualizar cliente
router.put('/:id', getUserDatabase, [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').optional().isEmail().withMessage('Email deve ser válido')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const {
    name, email, phone, address, cpf_cnpj, type
  } = req.body;

  const query = `
    UPDATE clients 
    SET name = ?, email = ?, phone = ?, address = ?, document = ?, type = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  req.userDb.run(query, [name, email, phone, address, cpf_cnpj, type || 'individual', id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao atualizar cliente', details: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json({ message: 'Cliente atualizado com sucesso' });
  });
});

// Deletar cliente
router.delete('/:id', getUserDatabase, (req, res) => {
  const { id } = req.params;

  // Verificar se o cliente tem contas a receber
  req.userDb.get('SELECT COUNT(*) as count FROM accounts_receivable WHERE client_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar cliente', details: err.message });
    }
    
    if (result.count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar cliente com contas a receber pendentes' 
      });
    }

    req.userDb.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao deletar cliente', details: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      res.json({ message: 'Cliente deletado com sucesso' });
    });
  });
});



module.exports = router; 