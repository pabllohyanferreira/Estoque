const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');

const router = express.Router();

// ==================== CONTAS A PAGAR ====================

// Buscar todas as contas a pagar
router.get('/payable', (req, res) => {
  const { status, supplier, dueDate } = req.query;
  
  let query = 'SELECT * FROM accounts_payable WHERE 1=1';
  const params = [];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  if (supplier) {
    query += ' AND supplier LIKE ?';
    params.push(`%${supplier}%`);
  }
  
  if (dueDate) {
    query += ' AND due_date = ?';
    params.push(dueDate);
  }
  
  query += ' ORDER BY due_date';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar contas a pagar', details: err.message });
    }
    res.json(rows);
  });
});

// Buscar conta a pagar por ID
router.get('/payable/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM accounts_payable WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar conta a pagar', details: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }
    res.json(row);
  });
});

// Criar nova conta a pagar
router.post('/payable', [
  body('description').notEmpty().withMessage('Descrição é obrigatória'),
  body('amount').isFloat({ min: 0 }).withMessage('Valor deve ser um número positivo'),
  body('due_date').isDate().withMessage('Data de vencimento deve ser válida'),
  body('status').optional().isIn(['pending', 'paid', 'overdue']).withMessage('Status deve ser pending, paid ou overdue')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    description, amount, due_date, status, supplier, category, notes
  } = req.body;

  const query = `
    INSERT INTO accounts_payable (description, amount, due_date, status, supplier, category, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [description, amount, due_date, status || 'pending', supplier, category, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar conta a pagar', details: err.message });
    }
    res.status(201).json({ 
      id: this.lastID, 
      message: 'Conta a pagar criada com sucesso' 
    });
  });
});

// Atualizar conta a pagar
router.put('/payable/:id', [
  body('description').notEmpty().withMessage('Descrição é obrigatória'),
  body('amount').isFloat({ min: 0 }).withMessage('Valor deve ser um número positivo'),
  body('due_date').isDate().withMessage('Data de vencimento deve ser válida'),
  body('status').optional().isIn(['pending', 'paid', 'overdue']).withMessage('Status deve ser pending, paid ou overdue')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const {
    description, amount, due_date, status, supplier, category, notes
  } = req.body;

  const query = `
    UPDATE accounts_payable 
    SET description = ?, amount = ?, due_date = ?, status = ?, supplier = ?, category = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [description, amount, due_date, status || 'pending', supplier, category, notes, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao atualizar conta a pagar', details: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }
    res.json({ message: 'Conta a pagar atualizada com sucesso' });
  });
});

// Deletar conta a pagar
router.delete('/payable/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM accounts_payable WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar conta a pagar', details: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }
    res.json({ message: 'Conta a pagar deletada com sucesso' });
  });
});

// ==================== CONTAS A RECEBER ====================

// Buscar todas as contas a receber
router.get('/receivable', (req, res) => {
  const { status, client_id, dueDate } = req.query;
  
  let query = `
    SELECT ar.*, c.name as client_name 
    FROM accounts_receivable ar 
    LEFT JOIN clients c ON ar.client_id = c.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    query += ' AND ar.status = ?';
    params.push(status);
  }
  
  if (client_id) {
    query += ' AND ar.client_id = ?';
    params.push(client_id);
  }
  
  if (dueDate) {
    query += ' AND ar.due_date = ?';
    params.push(dueDate);
  }
  
  query += ' ORDER BY ar.due_date';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar contas a receber', details: err.message });
    }
    res.json(rows);
  });
});

// Buscar conta a receber por ID
router.get('/receivable/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT ar.*, c.name as client_name 
    FROM accounts_receivable ar 
    LEFT JOIN clients c ON ar.client_id = c.id 
    WHERE ar.id = ?
  `, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar conta a receber', details: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }
    res.json(row);
  });
});

// Criar nova conta a receber
router.post('/receivable', [
  body('description').notEmpty().withMessage('Descrição é obrigatória'),
  body('amount').isFloat({ min: 0 }).withMessage('Valor deve ser um número positivo'),
  body('due_date').isDate().withMessage('Data de vencimento deve ser válida'),
  body('client_id').optional().isInt().withMessage('ID do cliente deve ser um número inteiro'),
  body('status').optional().isIn(['pending', 'paid', 'overdue']).withMessage('Status deve ser pending, paid ou overdue')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    description, amount, due_date, client_id, status, category, notes
  } = req.body;

  const query = `
    INSERT INTO accounts_receivable (description, amount, due_date, client_id, status, category, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [description, amount, due_date, client_id, status || 'pending', category, notes], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar conta a receber', details: err.message });
    }
    res.status(201).json({ 
      id: this.lastID, 
      message: 'Conta a receber criada com sucesso' 
    });
  });
});

// Atualizar conta a receber
router.put('/receivable/:id', [
  body('description').notEmpty().withMessage('Descrição é obrigatória'),
  body('amount').isFloat({ min: 0 }).withMessage('Valor deve ser um número positivo'),
  body('due_date').isDate().withMessage('Data de vencimento deve ser válida'),
  body('client_id').optional().isInt().withMessage('ID do cliente deve ser um número inteiro'),
  body('status').optional().isIn(['pending', 'paid', 'overdue']).withMessage('Status deve ser pending, paid ou overdue')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const {
    description, amount, due_date, client_id, status, category, notes
  } = req.body;

  const query = `
    UPDATE accounts_receivable 
    SET description = ?, amount = ?, due_date = ?, client_id = ?, status = ?, category = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [description, amount, due_date, client_id, status || 'pending', category, notes, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao atualizar conta a receber', details: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }
    res.json({ message: 'Conta a receber atualizada com sucesso' });
  });
});

// Deletar conta a receber
router.delete('/receivable/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM accounts_receivable WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar conta a receber', details: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }
    res.json({ message: 'Conta a receber deletada com sucesso' });
  });
});

// ==================== ESTATÍSTICAS GERAIS ====================

// Estatísticas gerais de contas
router.get('/stats', (req, res) => {
  db.get(`
    SELECT 
      (SELECT COUNT(*) FROM accounts_payable) as total_payable,
      (SELECT COUNT(*) FROM accounts_receivable) as total_receivable,
      (SELECT SUM(amount) FROM accounts_payable WHERE status = 'pending') as pending_payable,
      (SELECT SUM(amount) FROM accounts_receivable WHERE status = 'pending') as pending_receivable,
      (SELECT SUM(amount) FROM accounts_payable WHERE status = 'paid') as paid_payable,
      (SELECT SUM(amount) FROM accounts_receivable WHERE status = 'paid') as paid_receivable,
      (SELECT SUM(amount) FROM accounts_payable WHERE due_date < DATE('now') AND status = 'pending') as overdue_payable,
      (SELECT SUM(amount) FROM accounts_receivable WHERE due_date < DATE('now') AND status = 'pending') as overdue_receivable
  `, (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar estatísticas', details: err.message });
    }
    res.json(stats);
  });
});

module.exports = router; 