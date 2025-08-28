const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const { db } = require('../database/init');

const router = express.Router();

// Configurar multer para processar BLOB em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'), false);
    }
  }
});

// Buscar categorias (deve vir antes das rotas com parâmetros)
router.get('/categories/list', (req, res) => {
  db.all('SELECT DISTINCT category FROM items WHERE category IS NOT NULL AND category != "" ORDER BY category', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar categorias', details: err.message });
    }
    res.json(rows.map(row => row.category));
  });
});

// Buscar todos os itens
router.get('/', (req, res) => {
  const { search, category, lowStock } = req.query;
  
  let query = 'SELECT * FROM items WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ? OR barcode LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (lowStock === 'true') {
    query += ' AND quantity <= min_quantity';
  }
  
  query += ' ORDER BY name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar itens', details: err.message });
    }

    // Converter BLOB para base64
    const itemsWithBase64 = rows.map(item => ({
      ...item,
      image_data: item.image_data ? `data:image/png;base64,${item.image_data.toString('base64')}` : null
    }));

    res.json(itemsWithBase64);
  });
});

// Buscar item por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar item', details: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    
    // Converter BLOB para base64
    const itemWithBase64 = {
      ...row,
      image_data: row.image_data ? `data:image/png;base64,${row.image_data.toString('base64')}` : null
    };
    
    res.json(itemWithBase64);
  });
});

// Criar novo item
router.post('/', upload.single('image'), [
  body('name').custom((value) => {
    if (!value || value.trim() === '') {
      throw new Error('Nome é obrigatório');
    }
    return true;
  }),
  body('price').custom((value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error('Preço deve ser um número positivo');
    }
    return true;
  }),
  body('cost').custom((value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error('Custo deve ser um número positivo');
    }
    return true;
  }),
  body('quantity').custom((value) => {
    const num = parseInt(value);
    if (isNaN(num) || num < 0) {
      throw new Error('Quantidade deve ser um número inteiro não negativo');
    }
    return true;
  })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name, description, category, price, cost, quantity, min_quantity, unit, barcode, supplier
  } = req.body;

  // Processar imagem se enviada
  let image_data = null;
  if (req.file) {
    image_data = req.file.buffer;
  }

  const query = `
    INSERT INTO items (name, description, category, price, cost, quantity, min_quantity, unit, barcode, supplier, image_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [name, description, category, price, cost, quantity, min_quantity || 0, unit || 'un', barcode, supplier, image_data], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao criar item', details: err.message });
    }
    
    // Registrar movimentação inicial
    if (quantity > 0) {
      db.run(
        'INSERT INTO stock_movements (item_id, type, quantity, reason) VALUES (?, ?, ?, ?)',
        [this.lastID, 'entrada', quantity, 'Cadastro inicial']
      );
    }
    
    res.status(201).json({ 
      id: this.lastID, 
      message: 'Item criado com sucesso',
      image_data: image_data ? `data:${req.file.mimetype};base64,${image_data.toString('base64')}` : null
    });
  });
});

// Atualizar item
router.put('/:id', upload.single('image'), [
  body('name').custom((value) => {
    if (!value || value.trim() === '') {
      throw new Error('Nome é obrigatório');
    }
    return true;
  }),
  body('price').custom((value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error('Preço deve ser um número positivo');
    }
    return true;
  }),
  body('cost').custom((value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error('Custo deve ser um número positivo');
    }
    return true;
  })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const {
    name, description, category, price, cost, min_quantity, unit, barcode, supplier
  } = req.body;

  // Processar imagem se enviada
  let image_data = null;
  if (req.file) {
    image_data = req.file.buffer;
  }

  // Se não há nova imagem, manter a existente
  let query;
  let params;
  
  if (image_data) {
    query = `
      UPDATE items 
      SET name = ?, description = ?, category = ?, price = ?, cost = ?, 
          min_quantity = ?, unit = ?, barcode = ?, supplier = ?, image_data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    params = [name, description, category, price, cost, min_quantity || 0, unit || 'un', barcode, supplier, image_data, id];
  } else {
    query = `
      UPDATE items 
      SET name = ?, description = ?, category = ?, price = ?, cost = ?, 
          min_quantity = ?, unit = ?, barcode = ?, supplier = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    params = [name, description, category, price, cost, min_quantity || 0, unit || 'un', barcode, supplier, id];
  }

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao atualizar item', details: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    res.json({ 
      message: 'Item atualizado com sucesso',
      image_data: image_data ? `data:${req.file.mimetype};base64,${image_data.toString('base64')}` : null
    });
  });
});

// Deletar item
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM items WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar item', details: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    res.json({ message: 'Item deletado com sucesso' });
  });
});

// Ajustar estoque
router.post('/:id/stock', [
  body('quantity').isInt().withMessage('Quantidade deve ser um número inteiro'),
  body('type').isIn(['entrada', 'saida']).withMessage('Tipo deve ser entrada ou saida'),
  body('reason').notEmpty().withMessage('Motivo é obrigatório')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { quantity, type, reason } = req.body;

  db.get('SELECT quantity FROM items WHERE id = ?', [id], (err, item) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar item', details: err.message });
    }
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    const newQuantity = type === 'entrada' ? item.quantity + quantity : item.quantity - quantity;
    
    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Quantidade insuficiente em estoque' });
    }

    db.run('UPDATE items SET quantity = ? WHERE id = ?', [newQuantity, id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar estoque', details: err.message });
      }

      // Registrar movimentação
      db.run(
        'INSERT INTO stock_movements (item_id, type, quantity, reason) VALUES (?, ?, ?, ?)',
        [id, type, quantity, reason]
      );

      res.json({ 
        message: 'Estoque atualizado com sucesso',
        newQuantity 
      });
    });
  });
});

module.exports = router; 