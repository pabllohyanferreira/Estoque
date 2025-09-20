const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');

const router = express.Router();

// Middleware para validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Criar link de pagamento
router.post('/create-link', async (req, res) => {
  try {
    console.log('🔗 Recebida requisição para criar link de pagamento:', JSON.stringify(req.body, null, 2));
    
    const {
      sale_id,
      client_id,
      client_name,
      title,
      description,
      amount,
      payment_methods,
      expires_in_days = 7
    } = req.body;

    // Validações básicas
    if (!client_name || !title || !amount || !payment_methods) {
      console.error('❌ Dados obrigatórios faltando:', { client_name, title, amount, payment_methods });
      return res.status(400).json({ 
        error: 'Dados obrigatórios: client_name, title, amount, payment_methods' 
      });
    }

    // Validar métodos de pagamento
    const validMethods = ['pix', 'credit_card', 'debit_card'];
    const invalidMethods = payment_methods.filter(method => !validMethods.includes(method));
    if (invalidMethods.length > 0) {
      return res.status(400).json({ 
        error: `Métodos de pagamento inválidos: ${invalidMethods.join(', ')}` 
      });
    }

    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    // Simular resposta do Mercado Pago
    const response = {
      id: `test_${Date.now()}`,
      init_point: `https://test-payment-link.com/pay/${Date.now()}`,
      qr_code: payment_methods.includes('pix') ? `pix-test-${Date.now()}` : null
    };
    
    console.log('✅ Resposta simulada:', response);

    // Salvar link de pagamento no banco de dados
    const insertQuery = `
      INSERT INTO payment_links (
        sale_id, client_id, client_name, title, description, amount,
        payment_methods, mercado_pago_id, mercado_pago_url, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertQuery, [
      sale_id || null,
      client_id || null,
      client_name,
      title,
      description || null,
      amount,
      JSON.stringify(payment_methods),
      response.id,
      response.init_point,
      expiresAt.toISOString()
    ], function(err) {
      if (err) {
        console.error('Erro ao salvar link de pagamento:', err);
        return res.status(500).json({ error: 'Erro ao salvar link de pagamento' });
      }

      const paymentLinkId = this.lastID;

      const responseData = {
        id: paymentLinkId,
        mercado_pago_id: response.id,
        payment_url: response.init_point,
        qr_code: response.qr_code,
        expires_at: expiresAt.toISOString(),
        message: 'Link de pagamento criado com sucesso'
      };

      console.log('🎉 Link de pagamento criado com sucesso:', responseData);
      res.status(201).json(responseData);
    });

  } catch (error) {
    console.error('Erro ao criar link de pagamento:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Buscar links de pagamento
router.get('/', async (req, res) => {
  try {
    const { status, client_id, sale_id } = req.query;
    
    let query = `
      SELECT 
        pl.*,
        s.title as sale_title,
        s.total_amount as sale_amount
      FROM payment_links pl
      LEFT JOIN sales s ON pl.sale_id = s.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (status) {
      conditions.push("pl.status = ?");
      params.push(status);
    }
    
    if (client_id) {
      conditions.push("pl.client_id = ?");
      params.push(client_id);
    }
    
    if (sale_id) {
      conditions.push("pl.sale_id = ?");
      params.push(sale_id);
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    
    query += " ORDER BY pl.created_at DESC";
    
    db.all(query, params, (err, links) => {
      if (err) {
        console.error('Erro ao buscar links de pagamento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }
      
      // Parse dos métodos de pagamento
      const linksWithParsedMethods = links.map(link => ({
        ...link,
        payment_methods: JSON.parse(link.payment_methods || '[]')
      }));
      
      res.json(linksWithParsedMethods);
    });
  } catch (error) {
    console.error('Erro ao buscar links de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar link de pagamento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    db.get(`
      SELECT 
        pl.*,
        s.title as sale_title,
        s.total_amount as sale_amount
      FROM payment_links pl
      LEFT JOIN sales s ON pl.sale_id = s.id
      WHERE pl.id = ?
    `, [id], (err, link) => {
      if (err) {
        console.error('Erro ao buscar link de pagamento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }
      
      if (!link) {
        res.status(404).json({ error: 'Link de pagamento não encontrado' });
        return;
      }
      
      // Parse dos métodos de pagamento
      link.payment_methods = JSON.parse(link.payment_methods || '[]');
      
      res.json(link);
    });
  } catch (error) {
    console.error('Erro ao buscar link de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Webhook do Mercado Pago para notificações de pagamento
// TODO: Implementar webhook quando a integração com Mercado Pago estiver completa
router.post('/webhook', async (req, res) => {
  try {
    // Por enquanto, apenas retorna sucesso
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cancelar link de pagamento
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    db.run(`
      UPDATE payment_links 
      SET status = 'cancelled' 
      WHERE id = ? AND status = 'pending'
    `, [id], function(err) {
      if (err) {
        console.error('Erro ao cancelar link de pagamento:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Link de pagamento não encontrado ou já processado' });
        return;
      }
      
      res.json({ message: 'Link de pagamento cancelado com sucesso' });
    });
  } catch (error) {
    console.error('Erro ao cancelar link de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas de pagamentos
router.get('/stats/summary', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_links,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_links,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_links,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_links,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_received,
        AVG(CASE WHEN status = 'paid' THEN amount ELSE NULL END) as average_payment
      FROM payment_links 
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
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;