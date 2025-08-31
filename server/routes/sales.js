const express = require('express');
const { body, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../database/estoque.db');

// Middleware para validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Criar tabela de vendas se não existir
const initializeSalesTable = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    db.serialize(() => {
      // Tabela de vendas
      db.run(`
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          client_name TEXT NOT NULL,
          title TEXT,
          total_amount REAL NOT NULL,
          payment_method TEXT NOT NULL,
          installments INTEGER DEFAULT 1,
          installment_value REAL,
          installment_payment_method TEXT,
          due_date TEXT,
          status TEXT DEFAULT 'completed',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients (id)
        )
      `);

      // Tabela de itens da venda
      db.run(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          item_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          total REAL NOT NULL,
          FOREIGN KEY (sale_id) REFERENCES sales (id),
          FOREIGN KEY (item_id) REFERENCES items (id)
        )
      `);

      // Verificar se a coluna status existe na tabela sales
      db.get("PRAGMA table_info(sales)", (err, rows) => {
        if (err) {
          console.error('Erro ao verificar estrutura da tabela sales:', err);
          reject(err);
          return;
        }
        
        db.all("PRAGMA table_info(sales)", (err, columns) => {
          if (err) {
            console.error('Erro ao obter colunas da tabela sales:', err);
            reject(err);
            return;
          }
          
          const hasStatusColumn = columns.some(col => col.name === 'status');
          if (!hasStatusColumn) {
            db.run("ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'completed'", (err) => {
              if (err) {
                console.error('Erro ao adicionar coluna status:', err);
              } else {
                console.log('Coluna status adicionada à tabela sales');
              }
            });
          }
          
          // Verificar se a coluna title existe
          const hasTitleColumn = columns.some(col => col.name === 'title');
          if (!hasTitleColumn) {
            db.run("ALTER TABLE sales ADD COLUMN title TEXT", (err) => {
              if (err) {
                console.error('Erro ao adicionar coluna title:', err);
              } else {
                console.log('Coluna title adicionada à tabela sales');
              }
            });
          }
          
          resolve();
        });
      });
    });
    
    db.close();
  });
};

// Inicializar tabela ao carregar o módulo
initializeSalesTable().catch(console.error);

// Buscar todas as vendas
router.get('/', async (req, res) => {
  try {
    const db = new sqlite3.Database(dbPath);
    const { search, status, client_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        s.*,
        GROUP_CONCAT(si.item_name || ' (x' || si.quantity || ')') as items_summary
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
    `;
    
    const conditions = [];
    const params = [];
    
    if (search) {
      conditions.push("(s.client_name LIKE ? OR s.id LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (status) {
      conditions.push("s.status = ?");
      params.push(status);
    }
    
    if (client_id) {
      conditions.push("s.client_id = ?");
      params.push(client_id);
    }
    
    if (start_date) {
      conditions.push("DATE(s.created_at) >= ?");
      params.push(start_date);
    }
    
    if (end_date) {
      conditions.push("DATE(s.created_at) <= ?");
      params.push(end_date);
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    
    query += " GROUP BY s.id ORDER BY s.created_at DESC";
    
    db.all(query, params, (err, sales) => {
      if (err) {
        console.error('Erro ao buscar vendas:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }
      
      res.json(sales);
    });
    
    db.close();
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar venda por ID
router.get('/:id', async (req, res) => {
  try {
    const db = new sqlite3.Database(dbPath);
    const { id } = req.params;
    
    // Buscar dados da venda
    db.get("SELECT * FROM sales WHERE id = ?", [id], (err, sale) => {
      if (err) {
        console.error('Erro ao buscar venda:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }
      
      if (!sale) {
        res.status(404).json({ error: 'Venda não encontrada' });
        return;
      }
      
      // Buscar itens da venda
      db.all("SELECT * FROM sale_items WHERE sale_id = ?", [id], (err, items) => {
        if (err) {
          console.error('Erro ao buscar itens da venda:', err);
          res.status(500).json({ error: 'Erro interno do servidor' });
          return;
        }
        
        sale.items = items;
        res.json(sale);
      });
    });
    
    db.close();
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova venda
router.post('/', async (req, res) => {
  try {
    console.log('Recebendo dados da venda:', req.body);
    
    const db = new sqlite3.Database(dbPath);
    const {
      client_id,
      client_name,
      title,
      items,
      total_amount,
      payment_method,
      installments = 1,
      installment_value,
      installment_payment_method,
      due_date
    } = req.body;
    
    // Validações básicas
    if (!client_id || !client_name || !items || !total_amount || !payment_method) {
      console.error('Dados obrigatórios faltando:', { client_id, client_name, items, total_amount, payment_method });
      res.status(400).json({ error: 'Dados obrigatórios faltando' });
      return;
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      console.error('Items deve ser um array não vazio');
      res.status(400).json({ error: 'Pelo menos um item é obrigatório' });
      return;
    }
    
    // Validação de parcelas
    if (payment_method === 'installments') {
      if (!installments || installments < 1 || installments > 12) {
        console.error('Número de parcelas inválido:', installments);
        res.status(400).json({ error: 'Número de parcelas deve estar entre 1 e 12' });
        return;
      }
      
      if (!due_date) {
        console.error('Data de vencimento obrigatória para vendas parceladas');
        res.status(400).json({ error: 'Data de vencimento é obrigatória para vendas parceladas' });
        return;
      }
    }
    
    console.log('Criando venda:', { client_id, client_name, total_amount, payment_method });
    
    db.serialize(() => {
      // Inserir venda
      const saleQuery = `
        INSERT INTO sales (
          client_id, client_name, title, total_amount, payment_method, 
          installments, installment_value, installment_payment_method, due_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(saleQuery, [
        client_id, client_name, title || `Venda ${new Date().toLocaleDateString()}`, total_amount, payment_method,
        installments, installment_value, installment_payment_method, due_date
      ], function(err) {
        if (err) {
          console.error('Erro ao criar venda:', err);
          res.status(500).json({ error: 'Erro ao criar venda: ' + err.message });
          return;
        }
        
        const saleId = this.lastID;
        console.log('Venda criada com ID:', saleId);
        
        // Inserir itens da venda
        const itemPromises = items.map(item => {
          return new Promise((resolve, reject) => {
            const itemQuery = `
              INSERT INTO sale_items (sale_id, item_id, item_name, quantity, price, total)
              VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            db.run(itemQuery, [
              saleId, item.item_id, item.name, item.quantity, item.price, item.total
            ], function(err) {
              if (err) {
                console.error('Erro ao inserir item da venda:', err);
                reject(err);
              } else {
                resolve();
              }
            });
          });
        });
        
        Promise.all(itemPromises).then(() => {
          // Atualizar estoque dos produtos vendidos
          const stockPromises = items.map(item => {
            return new Promise((resolve, reject) => {
              // Buscar quantidade atual do produto
              db.get("SELECT quantity FROM items WHERE id = ?", [item.item_id], (err, row) => {
                if (err) {
                  console.error('Erro ao buscar estoque do item:', err);
                  reject(err);
                  return;
                }
                
                if (!row) {
                  console.error('Item não encontrado:', item.item_id);
                  reject(new Error('Item não encontrado'));
                  return;
                }
                
                const currentStock = row.quantity;
                const newStock = currentStock - item.quantity;
                
                if (newStock < 0) {
                  console.error('Estoque insuficiente para item:', item.item_id);
                  reject(new Error(`Estoque insuficiente para ${item.name}`));
                  return;
                }
                
                // Atualizar estoque do produto
                db.run("UPDATE items SET quantity = ? WHERE id = ?", [newStock, item.item_id], function(err) {
                  if (err) {
                    console.error('Erro ao atualizar estoque do item:', err);
                    reject(err);
                  } else {
                    console.log(`Estoque atualizado para item ${item.name}: ${currentStock} -> ${newStock}`);
                    
                    // Registrar movimentação de estoque
                    const movementQuery = `
                      INSERT INTO stock_movements (item_id, type, quantity, reason, reference)
                      VALUES (?, 'saida', ?, ?, ?)
                    `;
                    
                    db.run(movementQuery, [
                      item.item_id,
                      item.quantity,
                      'Venda',
                      `Venda #${saleId}`
                    ], function(movementErr) {
                      if (movementErr) {
                        console.error('Erro ao registrar movimentação de estoque:', movementErr);
                        // Não rejeitar a venda por erro na movimentação
                      } else {
                        console.log(`Movimentação de estoque registrada para item ${item.name}`);
                      }
                      resolve();
                    });
                  }
                });
              });
            });
          });
          
          Promise.all(stockPromises).then(() => {
            console.log('Estoque atualizado para todos os itens da venda');
            
            // Se for venda parcelada, criar contas a receber para cada parcela
            if (payment_method === 'installments' && installments > 1) {
              const installmentValue = installment_value || (total_amount / installments);
              const dueDateObj = new Date(due_date);
              
              // Criar uma conta a receber para cada parcela
              const accountPromises = [];
              
              for (let i = 1; i <= installments; i++) {
                const parcelDueDate = new Date(dueDateObj);
                parcelDueDate.setMonth(parcelDueDate.getMonth() + (i - 1));
                
                const accountQuery = `
                  INSERT INTO accounts_receivable (
                    client_id, client_name, description, amount, due_date, status, category
                  ) VALUES (?, ?, ?, ?, ?, 'pending', 'Venda Parcelada')
                `;
                
                const accountPromise = new Promise((resolve, reject) => {
                  db.run(accountQuery, [
                    client_id, 
                    client_name, 
                    `Venda #${saleId} - Parcela ${i}/${installments} - ${installmentValue.toFixed(2)}`,
                    installmentValue,
                    parcelDueDate.toISOString().split('T')[0] // Formato YYYY-MM-DD
                  ], function(err) {
                    if (err) {
                      console.error(`Erro ao criar conta a receber para parcela ${i}:`, err);
                      reject(err);
                    } else {
                      console.log(`Conta a receber criada para parcela ${i}/${installments}`);
                      resolve();
                    }
                  });
                });
                
                accountPromises.push(accountPromise);
              }
              
              Promise.all(accountPromises).then(() => {
                console.log(`${installments} contas a receber criadas automaticamente`);
                
                // Fechar banco de dados após todas as operações
                db.close();
                
                // Retornar resposta de sucesso
                res.status(201).json({
                  id: saleId,
                  message: 'Venda criada com sucesso',
                  account_created: true,
                  installments_created: installments,
                  stock_updated: true
                });
              }).catch(err => {
                console.error('Erro ao criar contas a receber:', err);
                
                // Fechar banco de dados mesmo com erro
                db.close();
                
                // Mesmo com erro nas contas, a venda foi criada e estoque atualizado
                res.status(201).json({
                  id: saleId,
                  message: 'Venda criada com sucesso e estoque atualizado, mas houve erro ao criar contas a receber',
                  account_created: false,
                  stock_updated: true,
                  error: err.message
                });
              });
            } else {
              // Fechar banco de dados para vendas à vista
              db.close();
              
              // Retornar resposta de sucesso para vendas à vista
              res.status(201).json({
                id: saleId,
                message: 'Venda criada com sucesso',
                account_created: false,
                stock_updated: true
              });
            }
          }).catch(err => {
            console.error('Erro ao atualizar estoque:', err);
            
            // Fechar banco de dados em caso de erro
            db.close();
            
            res.status(400).json({ 
              error: 'Erro ao atualizar estoque: ' + err.message,
              stock_error: true
            });
          });
        }).catch(err => {
          console.error('Erro ao processar itens da venda:', err);
          
          // Fechar banco de dados em caso de erro
          db.close();
          
          res.status(500).json({ error: 'Erro ao processar itens da venda: ' + err.message });
        });
      });
    });
    
    // Remover db.close() daqui pois será fechado dentro das operações
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
  }
});

// Atualizar status da venda
router.patch('/:id/status', [
  body('status').isIn(['completed', 'cancelled', 'refunded']).withMessage('Status inválido'),
  handleValidationErrors
], async (req, res) => {
  try {
    const db = new sqlite3.Database(dbPath);
    const { id } = req.params;
    const { status } = req.body;
    
    db.run("UPDATE sales SET status = ? WHERE id = ?", [status, id], function(err) {
      if (err) {
        console.error('Erro ao atualizar status da venda:', err);
        res.status(500).json({ error: 'Erro ao atualizar status da venda' });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Venda não encontrada' });
        return;
      }
      
      res.json({ message: 'Status da venda atualizado com sucesso' });
    });
    
    db.close();
  } catch (error) {
    console.error('Erro ao atualizar status da venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar venda
router.delete('/:id', async (req, res) => {
  try {
    const db = new sqlite3.Database(dbPath);
    const { id } = req.params;
    
    console.log('Tentando deletar venda:', id);
    
    db.serialize(() => {
      // Deletar contas a receber vinculadas primeiro
      db.run("DELETE FROM accounts_receivable WHERE description LIKE ?", [`Venda #${id}%`], function(err) {
        if (err) {
          console.error('Erro ao deletar contas a receber vinculadas:', err);
          db.close();
          res.status(500).json({ error: 'Erro ao deletar contas a receber vinculadas: ' + err.message });
          return;
        }
        
        console.log('Contas a receber vinculadas deletadas:', this.changes);
        
        // Deletar itens da venda
        db.run("DELETE FROM sale_items WHERE sale_id = ?", [id], function(err) {
          if (err) {
            console.error('Erro ao deletar itens da venda:', err);
            db.close();
            res.status(500).json({ error: 'Erro ao deletar itens da venda: ' + err.message });
            return;
          }
          
          console.log('Itens da venda deletados:', this.changes);
          
          // Deletar venda
          db.run("DELETE FROM sales WHERE id = ?", [id], function(err) {
            if (err) {
              console.error('Erro ao deletar venda:', err);
              db.close();
              res.status(500).json({ error: 'Erro ao deletar venda: ' + err.message });
              return;
            }
            
            if (this.changes === 0) {
              console.log('Venda não encontrada:', id);
              db.close();
              res.status(404).json({ error: 'Venda não encontrada' });
              return;
            }
            
            console.log('Venda deletada com sucesso:', id);
            db.close();
            res.json({ message: 'Venda deletada com sucesso' });
          });
        });
      });
    });
  } catch (error) {
    console.error('Erro ao deletar venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
  }
});

// Estatísticas de vendas
router.get('/stats/summary', async (req, res) => {
  try {
    const db = new sqlite3.Database(dbPath);
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
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_sale,
        COUNT(CASE WHEN payment_method = 'installments' THEN 1 END) as installment_sales,
        COUNT(CASE WHEN payment_method != 'installments' THEN 1 END) as immediate_sales
      FROM sales 
      ${dateFilter}
    `;
    
    db.get(query, params, (err, stats) => {
      if (err) {
        console.error('Erro ao buscar estatísticas:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }
      
      res.json(stats);
    });
    
    db.close();
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 