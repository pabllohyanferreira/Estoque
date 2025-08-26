const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');

const router = express.Router();

// Buscar todos os clientes
router.get('/', (req, res) => {
  const { search, type } = req.query;
  
  let query = 'SELECT * FROM clients WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR cpf_cnpj LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar clientes', details: err.message });
    }
    res.json(rows);
  });
});

// Buscar cliente por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM clients WHERE id = ?', [id], (err, row) => {
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
router.post('/', [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').optional().isEmail().withMessage('Email deve ser válido'),
  body('type').optional().isIn(['individual', 'company']).withMessage('Tipo deve ser individual ou company')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name, email, phone, address, cpf_cnpj, type
  } = req.body;

  const query = `
    INSERT INTO clients (name, email, phone, address, cpf_cnpj, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [name, email, phone, address, cpf_cnpj, type || 'individual'], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar cliente', details: err.message });
    }
    res.status(201).json({ 
      id: this.lastID, 
      message: 'Cliente criado com sucesso' 
    });
  });
});

// Atualizar cliente
router.put('/:id', [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').optional().isEmail().withMessage('Email deve ser válido'),
  body('type').optional().isIn(['individual', 'company']).withMessage('Tipo deve ser individual ou company')
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
    SET name = ?, email = ?, phone = ?, address = ?, cpf_cnpj = ?, type = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [name, email, phone, address, cpf_cnpj, type || 'individual', id], function(err) {
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
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Verificar se o cliente tem contas a receber
  db.get('SELECT COUNT(*) as count FROM accounts_receivable WHERE client_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar cliente', details: err.message });
    }
    
    if (result.count > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar cliente com contas a receber pendentes' 
      });
    }

    db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
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

// Buscar contas a receber do cliente
router.get('/:id/accounts', (req, res) => {
  const { id } = req.params;
  
  db.all(`
    SELECT ar.*, c.name as client_name 
    FROM accounts_receivable ar 
    LEFT JOIN clients c ON ar.client_id = c.id 
    WHERE ar.client_id = ?
    ORDER BY ar.due_date
  `, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar contas', details: err.message });
    }
    res.json(rows);
  });
});

// Estatísticas do cliente
router.get('/:id/stats', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT 
      COUNT(*) as total_accounts,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
      SUM(CASE WHEN due_date < DATE('now') AND status = 'pending' THEN amount ELSE 0 END) as overdue_amount
    FROM accounts_receivable 
    WHERE client_id = ?
  `, [id], (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar estatísticas', details: err.message });
    }
    res.json(stats);
  });
});

module.exports = router; 