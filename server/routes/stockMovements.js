const express = require('express');
const { db } = require('../database/init');

const router = express.Router();

// Buscar todas as movimentações com dados do item
router.get('/', (req, res) => {
  const query = `
    SELECT 
      sm.*,
      i.name as item_name,
      i.unit
    FROM stock_movements sm
    LEFT JOIN items i ON sm.item_id = i.id
    ORDER BY sm.created_at DESC
  `;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar movimentações', details: err.message });
    }
    res.json(rows);
  });
});

// Buscar movimentações por item
router.get('/item/:itemId', (req, res) => {
  const { itemId } = req.params;
  
  const query = `
    SELECT 
      sm.*,
      i.name as item_name,
      i.unit
    FROM stock_movements sm
    LEFT JOIN items i ON sm.item_id = i.id
    WHERE sm.item_id = ?
    ORDER BY sm.created_at DESC
  `;

  db.all(query, [itemId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar movimentações do item', details: err.message });
    }
    res.json(rows);
  });
});

// Criar nova movimentação
router.post('/', (req, res) => {
  const { item_id, type, quantity, reason } = req.body;

  if (!item_id || !type || !quantity || !reason) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  if (!['entrada', 'saida'].includes(type)) {
    return res.status(400).json({ error: 'Tipo deve ser entrada ou saida' });
  }

  if (quantity <= 0) {
    return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
  }

  // Verificar se o item existe
  db.get('SELECT id, quantity FROM items WHERE id = ?', [item_id], (err, item) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao verificar item', details: err.message });
    }
    
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Verificar se há estoque suficiente para saída
    if (type === 'saida' && item.quantity < quantity) {
      return res.status(400).json({ error: 'Estoque insuficiente' });
    }

    // Inserir movimentação
    const insertQuery = `
      INSERT INTO stock_movements (item_id, type, quantity, reason, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    db.run(insertQuery, [item_id, type, quantity, reason], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao criar movimentação', details: err.message });
      }

      // Atualizar quantidade do item
      const newQuantity = type === 'entrada' ? item.quantity + quantity : item.quantity - quantity;
      
      db.run('UPDATE items SET quantity = ? WHERE id = ?', [newQuantity, item_id], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ error: 'Erro ao atualizar estoque', details: updateErr.message });
        }

        res.status(201).json({
          id: this.lastID,
          message: 'Movimentação criada com sucesso',
          new_quantity: newQuantity
        });
      });
    });
  });
});

// Buscar resumo de movimentações por período
router.get('/summary', (req, res) => {
  const { month, year, type } = req.query;
  
  let query = `
    SELECT 
      sm.type,
      COUNT(*) as count,
      SUM(sm.quantity) as total_quantity
    FROM stock_movements sm
    WHERE 1=1
  `;
  
  const params = [];
  
  if (month !== undefined && year !== undefined) {
    query += ` AND strftime('%m', sm.created_at) = ? AND strftime('%Y', sm.created_at) = ?`;
    params.push(month.toString().padStart(2, '0'), year.toString());
  }
  
  if (type) {
    query += ` AND sm.type = ?`;
    params.push(type);
  }
  
  query += ` GROUP BY sm.type`;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar resumo', details: err.message });
    }
    
    const summary = {
      entrada: { count: 0, total_quantity: 0 },
      saida: { count: 0, total_quantity: 0 }
    };
    
    rows.forEach(row => {
      summary[row.type] = {
        count: row.count,
        total_quantity: row.total_quantity
      };
    });
    
    res.json(summary);
  });
});

module.exports = router; 