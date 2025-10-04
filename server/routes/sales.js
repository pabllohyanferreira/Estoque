const express = require('express');
const { body, validationResult } = require('express-validator');
const { getUserDatabase } = require('../middleware/userDatabase');

const router = express.Router();

// Middleware para validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Erros de validação:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  console.log('✅ Validação passou com sucesso');
  next();
};

// Buscar todas as vendas
router.get('/', getUserDatabase, (req, res) => {
  const { status, client_id, start_date, end_date } = req.query;
  
  let query = `
    SELECT 
      s.*,
      c.name as client_name,
      c.email as client_email,
      c.phone as client_phone
    FROM sales s
    LEFT JOIN clients c ON s.client_id = c.id
  `;
  
  const conditions = [];
  const params = [];
  
  if (status) {
    conditions.push("s.status = ?");
    params.push(status);
  }
  
  if (client_id) {
    conditions.push("s.client_id = ?");
    params.push(client_id);
  }
  
  if (start_date && end_date) {
    conditions.push("DATE(s.created_at) BETWEEN ? AND ?");
    params.push(start_date, end_date);
  }
  
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  
  query += " ORDER BY s.created_at DESC";
  
  req.userDb.all(query, params, (err, sales) => {
    if (err) {
      console.error('Erro ao buscar vendas:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    
    res.json(sales);
  });
});

// Buscar venda por ID
router.get('/:id', getUserDatabase, (req, res) => {
  const { id } = req.params;
  
  // Buscar dados da venda
  req.userDb.get(`
    SELECT 
      s.*,
      c.name as client_name,
      c.email as client_email,
      c.phone as client_phone
    FROM sales s
    LEFT JOIN clients c ON s.client_id = c.id
    WHERE s.id = ?
  `, [id], (err, sale) => {
    if (err) {
      console.error('Erro ao buscar venda:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    
    if (!sale) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    
    // Buscar itens da venda
    req.userDb.all(`
      SELECT 
        si.*,
        i.name as item_name,
        i.description as item_description
      FROM sale_items si
      LEFT JOIN items i ON si.item_id = i.id
      WHERE si.sale_id = ?
    `, [id], (err, items) => {
      if (err) {
        console.error('Erro ao buscar itens da venda:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      res.json({
        ...sale,
        items: items
      });
    });
  });
});

// Criar nova venda
router.post('/', getUserDatabase, [
  body('client_id').isInt().withMessage('ID do cliente é obrigatório'),
  body('title').notEmpty().withMessage('Título é obrigatório'),
  body('total_amount').isFloat({ min: 0.01 }).withMessage('Valor total deve ser maior que zero'),
  body('items').isArray({ min: 1 }).withMessage('Pelo menos um item é obrigatório'),
  handleValidationErrors
], (req, res) => {
  const {
    client_id,
    title,
    total_amount,
    items,
    notes,
    payment_method = 'dinheiro',
    installments = 1,
    installment_value,
    installment_payment_method,
    due_date
  } = req.body;

  console.log('📝 Dados recebidos para criar venda:', {
    client_id,
    title,
    total_amount,
    items,
    payment_method,
    installments
  });

  // Buscar dados do cliente
  console.log('🔍 Buscando cliente com ID:', client_id);
  req.userDb.get('SELECT name FROM clients WHERE id = ?', [client_id], (err, client) => {
    if (err) {
      console.error('❌ Erro ao buscar cliente:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    
    console.log('👤 Cliente encontrado:', client);
    
    if (!client) {
      console.log('❌ Cliente não encontrado para ID:', client_id);
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Inserir venda
    const insertSaleQuery = `
      INSERT INTO sales (
        client_id, client_name, title, total_amount, notes,
        payment_method, installments, installment_value,
        installment_payment_method, due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    console.log('💾 Inserindo venda no banco...');
    req.userDb.run(insertSaleQuery, [
      client_id,
      client.name,
      title,
      total_amount,
      notes || null,
      payment_method,
      installments,
      installment_value || total_amount,
      installment_payment_method || payment_method,
      due_date || null
    ], function(err) {
      if (err) {
        console.error('❌ Erro ao criar venda:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      const saleId = this.lastID;
      console.log('✅ Venda criada com ID:', saleId);

      // Inserir itens da venda
      const insertItemQuery = `
        INSERT INTO sale_items (sale_id, item_id, item_name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      // Primeiro, validar estoque disponível para todos os itens
      console.log('🔍 Validando estoque disponível...');
      let stockValidationComplete = 0;
      let stockValidationError = false;
      let stockErrors = [];

      items.forEach((item) => {
        req.userDb.get('SELECT stock, name FROM items WHERE id = ?', [item.item_id], (err, itemData) => {
          if (err) {
            console.error('Erro ao verificar estoque do item:', err);
            stockValidationError = true;
            stockErrors.push(`Erro ao verificar estoque do item ${item.item_name}`);
          } else if (!itemData) {
            stockValidationError = true;
            stockErrors.push(`Item ${item.item_name} não encontrado`);
          } else if (itemData.stock < item.quantity) {
            stockValidationError = true;
            stockErrors.push(`Estoque insuficiente para ${item.item_name}. Disponível: ${itemData.stock}, Solicitado: ${item.quantity}`);
          }
          
          stockValidationComplete++;
          
          if (stockValidationComplete === items.length) {
            if (stockValidationError) {
              return res.status(400).json({ 
                error: 'Estoque insuficiente', 
                details: stockErrors 
              });
            }
            
            // Se validação passou, processar itens e reduzir estoque
            console.log('✅ Validação de estoque passou, processando itens...');
            
            let itemsProcessed = 0;
            let hasError = false;

            items.forEach((item) => {
              // Inserir item da venda
              req.userDb.run(insertItemQuery, [
                saleId,
                item.item_id,
                item.item_name,
                item.quantity,
                item.unit_price,
                item.total_price
              ], (err) => {
                if (err) {
                  console.error('Erro ao inserir item da venda:', err);
                  hasError = true;
                } else {
                  // Reduzir estoque do item
                  console.log(`📦 Reduzindo estoque do item ${item.item_name}: -${item.quantity}`);
                  req.userDb.run(
                    'UPDATE items SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [item.quantity, item.item_id],
                    (err) => {
                      if (err) {
                        console.error('Erro ao reduzir estoque:', err);
                        hasError = true;
                      } else {
                        // Criar movimentação de estoque
                        req.userDb.run(
                          'INSERT INTO stock_movements (item_id, type, quantity, reason) VALUES (?, ?, ?, ?)',
                          [item.item_id, 'sale', item.quantity, `Venda #${saleId} - ${item.item_name}`],
                          (err) => {
                            if (err) {
                              console.error('Erro ao criar movimentação de estoque:', err);
                              // Não falhar a venda por causa disso
                            } else {
                              console.log(`✅ Movimentação de estoque registrada para ${item.item_name}`);
                            }
                          }
                        );
                      }
                    }
                  );
                }
                
                itemsProcessed++;
                
                if (itemsProcessed === items.length) {
                  if (hasError) {
                    return res.status(500).json({ error: 'Erro ao processar itens da venda' });
                  }
                  
                  // As contas a receber serão criadas pelo frontend (parcelas individuais)
                  console.log('✅ Venda criada com sucesso. As parcelas serão criadas pelo frontend.');
                  
                  res.status(201).json({
                    id: saleId,
                    message: 'Venda criada com sucesso e estoque atualizado'
                  });
                }
              });
            });
          }
        });
      });
    });
  });
});

// Atualizar status da venda
router.patch('/:id/status', getUserDatabase, [
  body('status').isIn(['pending', 'completed', 'cancelled']).withMessage('Status inválido'),
  handleValidationErrors
], (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Se cancelando a venda, restaurar estoque
  if (status === 'cancelled') {
    console.log('🔄 Cancelando venda e restaurando estoque...');
    
    // Buscar itens da venda para restaurar estoque
    req.userDb.all('SELECT item_id, quantity, item_name FROM sale_items WHERE sale_id = ?', [id], (err, saleItems) => {
      if (err) {
        console.error('Erro ao buscar itens da venda:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (saleItems.length === 0) {
        // Se não há itens, apenas atualizar status
        req.userDb.run('UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id], function(err) {
          if (err) {
            console.error('Erro ao atualizar status da venda:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Venda não encontrada' });
          }
          
          res.json({ message: 'Venda cancelada com sucesso' });
        });
        return;
      }
      
      // Restaurar estoque de cada item
      let itemsRestored = 0;
      let hasError = false;
      
      saleItems.forEach((item) => {
        req.userDb.run(
          'UPDATE items SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [item.quantity, item.item_id],
          (err) => {
            if (err) {
              console.error('Erro ao restaurar estoque:', err);
              hasError = true;
            } else {
              // Criar movimentação de estoque para cancelamento
              req.userDb.run(
                'INSERT INTO stock_movements (item_id, type, quantity, reason) VALUES (?, ?, ?, ?)',
                [item.item_id, 'cancellation', item.quantity, `Cancelamento Venda #${id} - ${item.item_name}`],
                (err) => {
                  if (err) {
                    console.error('Erro ao criar movimentação de estoque:', err);
                    // Não falhar por causa disso
                  } else {
                    console.log(`✅ Estoque restaurado para ${item.item_name}: +${item.quantity}`);
                  }
                }
              );
            }
            
            itemsRestored++;
            
            if (itemsRestored === saleItems.length) {
              if (hasError) {
                return res.status(500).json({ error: 'Erro ao restaurar estoque de alguns itens' });
              }
              
              // Atualizar status da venda
              req.userDb.run('UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id], function(err) {
                if (err) {
                  console.error('Erro ao atualizar status da venda:', err);
                  return res.status(500).json({ error: 'Erro interno do servidor' });
                }
                
                if (this.changes === 0) {
                  return res.status(404).json({ error: 'Venda não encontrada' });
                }
                
                res.json({ message: 'Venda cancelada com sucesso e estoque restaurado' });
              });
            }
          }
        );
      });
    });
  } else {
    // Para outros status, apenas atualizar
    req.userDb.run('UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id], function(err) {
      if (err) {
        console.error('Erro ao atualizar status da venda:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Venda não encontrada' });
      }
      
      res.json({ message: 'Status da venda atualizado com sucesso' });
    });
  }
});

// Deletar venda
router.delete('/:id', getUserDatabase, (req, res) => {
  const { id } = req.params;

  console.log('🗑️ Deletando venda e restaurando estoque...');
  
  // Primeiro, buscar itens da venda para restaurar estoque
  req.userDb.all('SELECT item_id, quantity, item_name FROM sale_items WHERE sale_id = ?', [id], (err, saleItems) => {
    if (err) {
      console.error('Erro ao buscar itens da venda:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    
    if (saleItems.length === 0) {
      // Se não há itens, apenas deletar
      req.userDb.run('DELETE FROM sale_items WHERE sale_id = ?', [id], (err) => {
        if (err) {
          console.error('Erro ao deletar itens da venda:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        req.userDb.run('DELETE FROM sales WHERE id = ?', [id], function(err) {
          if (err) {
            console.error('Erro ao deletar venda:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Venda não encontrada' });
          }
          
          res.json({ message: 'Venda deletada com sucesso' });
        });
      });
      return;
    }
    
    // Restaurar estoque de cada item
    let itemsRestored = 0;
    let hasError = false;
    
    saleItems.forEach((item) => {
      req.userDb.run(
        'UPDATE items SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.quantity, item.item_id],
        (err) => {
          if (err) {
            console.error('Erro ao restaurar estoque:', err);
            hasError = true;
          } else {
            // Criar movimentação de estoque para exclusão
            req.userDb.run(
              'INSERT INTO stock_movements (item_id, type, quantity, reason) VALUES (?, ?, ?, ?)',
              [item.item_id, 'deletion', item.quantity, `Exclusão Venda #${id} - ${item.item_name}`],
              (err) => {
                if (err) {
                  console.error('Erro ao criar movimentação de estoque:', err);
                  // Não falhar por causa disso
                } else {
                  console.log(`✅ Estoque restaurado para ${item.item_name}: +${item.quantity}`);
                }
              }
            );
          }
          
          itemsRestored++;
          
          if (itemsRestored === saleItems.length) {
            if (hasError) {
              return res.status(500).json({ error: 'Erro ao restaurar estoque de alguns itens' });
            }
            
            // Deletar itens da venda
            req.userDb.run('DELETE FROM sale_items WHERE sale_id = ?', [id], (err) => {
              if (err) {
                console.error('Erro ao deletar itens da venda:', err);
                return res.status(500).json({ error: 'Erro interno do servidor' });
              }

              // Deletar a venda
              req.userDb.run('DELETE FROM sales WHERE id = ?', [id], function(err) {
                if (err) {
                  console.error('Erro ao deletar venda:', err);
                  return res.status(500).json({ error: 'Erro interno do servidor' });
                }
                
                if (this.changes === 0) {
                  return res.status(404).json({ error: 'Venda não encontrada' });
                }
                
                res.json({ message: 'Venda deletada com sucesso e estoque restaurado' });
              });
            });
          }
        }
      );
    });
  });
});

// Estatísticas de vendas
router.get('/stats/summary', getUserDatabase, (req, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  const params = [];
  
  if (start_date && end_date) {
    dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }
  
  const query = `
    SELECT 
      COUNT(*) as total_sales,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sales,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_sales,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sales,
      SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_revenue,
      AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END) as average_sale
    FROM sales 
    ${dateFilter}
  `;
  
  req.userDb.get(query, params, (err, stats) => {
    if (err) {
      console.error('Erro ao buscar estatísticas:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    
    res.json(stats);
  });
});

module.exports = router;