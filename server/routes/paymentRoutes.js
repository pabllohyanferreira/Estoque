const express = require('express');
const { body, validationResult } = require('express-validator');
const paymentService = require('../services/paymentService');
const { db } = require('../database/init');

const router = express.Router();

// Middleware para validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Dados inválidos',
      details: errors.array() 
    });
  }
  next();
};

// Validação para dados de pagamento
const paymentValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
  body('paymentMethod').isIn(['pix', 'credit_card', 'debit_card', 'boleto']).withMessage('Método de pagamento inválido'),
  body('customer.name').notEmpty().withMessage('Nome do cliente é obrigatório'),
  body('customer.email').isEmail().withMessage('Email inválido'),
  body('customer.document').notEmpty().withMessage('Documento do cliente é obrigatório'),
  body('description').optional().isString().withMessage('Descrição deve ser um texto'),
  body('installments').optional().isInt({ min: 1, max: 12 }).withMessage('Parcelas deve estar entre 1 e 12'),
  body('dueDate').optional().isISO8601().withMessage('Data de vencimento inválida')
];

// Processar pagamento
router.post('/process', paymentValidation, handleValidationErrors, async (req, res) => {
  try {
    console.log('💳 Recebida requisição de pagamento:', JSON.stringify(req.body, null, 2));
    
    const paymentData = req.body;
    
    // Processar pagamento
    const result = await paymentService.processPayment(paymentData);
    
    // Salvar no banco de dados
    const insertQuery = `
      INSERT INTO payment_transactions (
        payment_id, payment_method, amount, customer_name, customer_email,
        customer_document, description, status, payment_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertQuery, [
      result.paymentId,
      paymentData.paymentMethod,
      paymentData.amount,
      paymentData.customer.name,
      paymentData.customer.email,
      paymentData.customer.document,
      paymentData.description || null,
      'pending',
      JSON.stringify(result),
      new Date().toISOString()
    ], function(err) {
      if (err) {
        console.error('❌ Erro ao salvar transação:', err);
        console.error('❌ Detalhes do erro:', err.message);
        return res.status(500).json({ 
          error: 'Erro ao salvar transação',
          details: err.message 
        });
      }
      
      console.log('✅ Transação salva com sucesso:', this.lastID);
      
      res.status(201).json({
        success: true,
        transactionId: this.lastID,
        payment: result,
        message: 'Pagamento processado com sucesso'
      });
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar pagamento:', error);
    res.status(500).json({ 
      error: 'Erro ao processar pagamento',
      message: error.message 
    });
  }
});

// Verificar status do pagamento
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { paymentMethod } = req.query;
    
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Método de pagamento é obrigatório' });
    }
    
    console.log(`🔍 Verificando status: ${paymentId} (${paymentMethod})`);
    
    // Verificar status
    const status = await paymentService.checkPaymentStatus(paymentId, paymentMethod);
    
    // Atualizar no banco de dados
    const updateQuery = `
      UPDATE payment_transactions 
      SET status = ?, updated_at = ?
      WHERE payment_id = ?
    `;
    
    db.run(updateQuery, [status.status, new Date().toISOString(), paymentId], (err) => {
      if (err) {
        console.error('❌ Erro ao atualizar status:', err);
      }
    });
    
    res.json({
      success: true,
      paymentId,
      status: status.status,
      checkedAt: status.checkedAt
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar status',
      message: error.message 
    });
  }
});

// Obter métodos de pagamento disponíveis
router.get('/methods', (req, res) => {
  try {
    const methods = paymentService.getAvailablePaymentMethods();
    
    res.json({
      success: true,
      methods,
      message: 'Métodos de pagamento disponíveis'
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter métodos:', error);
    res.status(500).json({ 
      error: 'Erro ao obter métodos de pagamento',
      message: error.message 
    });
  }
});

// Gerar PDF do boleto
router.get('/boleto/:paymentId/pdf', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    console.log(`📄 Gerando PDF do boleto: ${paymentId}`);
    
    const pdfData = await paymentService.generateBoletoPDF(paymentId);
    
    res.json({
      success: true,
      pdf: pdfData,
      message: 'PDF do boleto gerado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar PDF do boleto',
      message: error.message 
    });
  }
});

// Webhook para cartões
router.post('/webhook/card', async (req, res) => {
  try {
    console.log('🔔 Webhook de cartão recebido:', JSON.stringify(req.body, null, 2));
    
    const webhookData = req.body;
    
    // Processar webhook
    const result = await paymentService.processWebhook(webhookData, 'credit_card');
    
    if (result) {
      // Atualizar status no banco
      const updateQuery = `
        UPDATE payment_transactions 
        SET status = ?, updated_at = ?
        WHERE payment_id = ?
      `;
      
      db.run(updateQuery, [result.status, new Date().toISOString(), result.paymentId], (err) => {
        if (err) {
          console.error('❌ Erro ao atualizar status via webhook:', err);
        } else {
          console.log('✅ Status atualizado via webhook:', result.paymentId);
        }
      });
    }
    
    res.status(200).json({ success: true, message: 'Webhook processado' });
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ 
      error: 'Erro ao processar webhook',
      message: error.message 
    });
  }
});

// Obter transações
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentMethod } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM payment_transactions WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (paymentMethod) {
      query += ' AND payment_method = ?';
      params.push(paymentMethod);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('❌ Erro ao buscar transações:', err);
        return res.status(500).json({ error: 'Erro ao buscar transações' });
      }
      
      // Contar total
      let countQuery = 'SELECT COUNT(*) as total FROM payment_transactions WHERE 1=1';
      const countParams = [];
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      if (paymentMethod) {
        countQuery += ' AND payment_method = ?';
        countParams.push(paymentMethod);
      }
      
      db.get(countQuery, countParams, (err, countResult) => {
        if (err) {
          console.error('❌ Erro ao contar transações:', err);
          return res.status(500).json({ error: 'Erro ao contar transações' });
        }
        
        res.json({
          success: true,
          transactions: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult.total,
            pages: Math.ceil(countResult.total / limit)
          }
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter transações:', error);
    res.status(500).json({ 
      error: 'Erro ao obter transações',
      message: error.message 
    });
  }
});

// Obter estatísticas de pagamentos
router.get('/stats', async (req, res) => {
  try {
    const { period = '30' } = req.query; // últimos 30 dias
    
    const query = `
      SELECT 
        payment_method,
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM payment_transactions 
      WHERE created_at >= datetime('now', '-${period} days')
      GROUP BY payment_method, status
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('❌ Erro ao obter estatísticas:', err);
        return res.status(500).json({ error: 'Erro ao obter estatísticas' });
      }
      
      // Processar dados
      const stats = {
        byMethod: {},
        byStatus: {},
        total: {
          transactions: 0,
          amount: 0
        }
      };
      
      rows.forEach(row => {
        // Por método
        if (!stats.byMethod[row.payment_method]) {
          stats.byMethod[row.payment_method] = {
            transactions: 0,
            amount: 0
          };
        }
        stats.byMethod[row.payment_method].transactions += row.count;
        stats.byMethod[row.payment_method].amount += row.total_amount;
        
        // Por status
        if (!stats.byStatus[row.status]) {
          stats.byStatus[row.status] = {
            transactions: 0,
            amount: 0
          };
        }
        stats.byStatus[row.status].transactions += row.count;
        stats.byStatus[row.status].amount += row.total_amount;
        
        // Total
        stats.total.transactions += row.count;
        stats.total.amount += row.total_amount;
      });
      
      res.json({
        success: true,
        period: `${period} dias`,
        stats
      });
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro ao obter estatísticas',
      message: error.message 
    });
  }
});

module.exports = router;
