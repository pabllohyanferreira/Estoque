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
    query += ' AND stock <= min_stock';
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
  body('installments').custom((value) => {
    if (value) {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 12) {
        throw new Error('Número de parcelas deve ser entre 1 e 12');
      }
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
  console.log('=== INÍCIO DA CRIAÇÃO DE PRODUTO ===');
  console.log('Dados recebidos:', req.body);
  console.log('Arquivo recebido:', req.file);
  console.log('Headers:', req.headers);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Erros de validação na criação:', errors.array());
    console.log('Dados recebidos na criação:', req.body);
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name, description, category, price, installments, quantity, min_quantity, barcode
  } = req.body;

  console.log('Dados para criação do item:', {
    name,
    price,
    installments,
    quantity,
    min_quantity
  });

  // Processar imagem se enviada
  let image_data = null;
  if (req.file) {
    image_data = req.file.buffer;
  }

  // Converter valores para os tipos corretos
  const priceFloat = parseFloat(price) || 0;
  const installmentsInt = parseInt(installments) || 1;
  const quantityInt = parseInt(quantity, 10) || 0;
  const minQuantityInt = parseInt(min_quantity, 10) || 0;

  console.log('Valores convertidos para criação:', {
    priceFloat,
    installmentsInt,
    quantityInt,
    minQuantityInt
  });

  // Validação adicional
  if (priceFloat <= 0) {
    return res.status(400).json({ error: 'Preço deve ser maior que zero' });
  }

  if (installmentsInt < 1 || installmentsInt > 12) {
    return res.status(400).json({ error: 'Número de parcelas deve ser entre 1 e 12' });
  }

  const query = `
    INSERT INTO items (name, description, category, price, cost, installments, stock, min_stock, barcode, sku, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  console.log('Executando query de criação:', query);
  console.log('Parâmetros da query:', [name, description, category, priceFloat, 0, installmentsInt, quantityInt, minQuantityInt, barcode, barcode, image_data ? 'data:image/jpeg;base64,' + image_data.toString('base64') : null]);

  try {
    db.run(query, [name, description, category, priceFloat, 0, installmentsInt, quantityInt, minQuantityInt, barcode, barcode, image_data ? 'data:image/jpeg;base64,' + image_data.toString('base64') : null], function(err) {
      if (err) {
        console.error('Erro no banco de dados ao criar item:', err);
        return res.status(500).json({ error: 'Erro ao criar item', details: err.message });
      }
      
      console.log('Item criado com sucesso, ID:', this.lastID);
      
      // Registrar movimentação inicial
      if (quantityInt > 0) {
        db.run(
          'INSERT INTO stock_movements (item_id, type, quantity, reason) VALUES (?, ?, ?, ?)',
          [this.lastID, 'entrada', quantityInt, 'Cadastro inicial'],
          (movementErr) => {
            if (movementErr) {
              console.error('Erro ao registrar movimentação inicial:', movementErr);
            } else {
              console.log('Movimentação inicial registrada com sucesso');
            }
          }
        );
      }
      
      res.status(201).json({ 
        id: this.lastID, 
        message: 'Item criado com sucesso',
        image_data: image_data ? `data:${req.file.mimetype};base64,${image_data.toString('base64')}` : null
      });
    });
  } catch (error) {
    console.error('Erro geral na criação de item:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
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
  body('installments').custom((value) => {
    if (value) {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > 12) {
        throw new Error('Número de parcelas deve ser entre 1 e 12');
      }
    }
    return true;
  }),
], (req, res) => {
  console.log('=== INÍCIO DA ATUALIZAÇÃO DE PRODUTO ===');
  console.log('ID do produto:', req.params.id);
  console.log('Dados recebidos:', req.body);
  console.log('Arquivo recebido:', req.file);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Erros de validação:', errors.array());
    console.log('Dados recebidos:', req.body);
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const {
    name, description, category, price, installments, min_quantity, barcode
  } = req.body;

  // Converter valores para os tipos corretos
  const priceFloat = parseFloat(price);
  const installmentsInt = parseInt(installments);
  const minQuantityInt = parseInt(min_quantity) || 0;

  console.log('Dados recebidos para atualização:', {
    id,
    name,
    price: priceFloat,
    installments: installmentsInt,
    min_quantity: minQuantityInt
  });

  console.log('Valores originais:', {
    price,
    installments,
    min_quantity
  });

  console.log('Valores convertidos:', {
    priceFloat,
    installmentsInt,
    minQuantityInt
  });

  // Validação adicional
  if (priceFloat <= 0) {
    return res.status(400).json({ error: 'Preço deve ser maior que zero' });
  }

  if (installmentsInt < 1 || installmentsInt > 12) {
    return res.status(400).json({ error: 'Número de parcelas deve ser entre 1 e 12' });
  }

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
      SET name = ?, description = ?, category = ?, price = ?, installments = ?, 
          min_stock = ?, barcode = ?, sku = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    params = [name, description, category, priceFloat, installmentsInt, minQuantityInt, barcode, barcode, 'data:image/jpeg;base64,' + image_data.toString('base64'), id];
  } else {
    query = `
      UPDATE items 
      SET name = ?, description = ?, category = ?, price = ?, installments = ?, 
          min_stock = ?, barcode = ?, sku = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    params = [name, description, category, priceFloat, installmentsInt, minQuantityInt, barcode, barcode, id];
  }

  console.log('Query SQL:', query);
  console.log('Parâmetros:', params);

  try {
    db.run(query, params, function(err) {
      if (err) {
        console.error('Erro no banco de dados:', err);
        return res.status(500).json({ error: 'Erro ao atualizar item', details: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }
      
      console.log('Item atualizado com sucesso. Linhas afetadas:', this.changes);
      
      res.json({ 
        message: 'Item atualizado com sucesso',
        image_data: image_data ? `data:${req.file.mimetype};base64,${image_data.toString('base64')}` : null
      });
    });
  } catch (error) {
    console.error('Erro geral na atualização de item:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
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

  // Converter para números inteiros para garantir precisão
  const quantityInt = parseInt(quantity, 10);

  console.log('Atualização de estoque:', {
    itemId: id,
    quantity: quantity,
    quantityInt: quantityInt,
    type: type,
    reason: reason
  });

  db.get('SELECT stock FROM items WHERE id = ?', [id], (err, item) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar item', details: err.message });
    }
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    // Converter o estoque atual para número inteiro
    const currentQuantity = parseInt(item.stock, 10);
    const newQuantity = type === 'entrada' ? currentQuantity + quantityInt : currentQuantity - quantityInt;
    
    console.log('Cálculo de estoque:', {
      currentQuantity: currentQuantity,
      quantityInt: quantityInt,
      type: type,
      newQuantity: newQuantity
    });
    
    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Quantidade insuficiente em estoque' });
    }

    db.run('UPDATE items SET stock = ? WHERE id = ?', [newQuantity, id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar estoque', details: err.message });
      }

      // Registrar movimentação
      db.run(
        'INSERT INTO stock_movements (item_id, type, quantity, reason) VALUES (?, ?, ?, ?)',
        [id, type, quantityInt, reason]
      );

      console.log('Estoque atualizado com sucesso:', {
        itemId: id,
        newQuantity: newQuantity
      });

      res.json({ 
        message: 'Estoque atualizado com sucesso',
        newQuantity 
      });
    });
  });
});

module.exports = router; 