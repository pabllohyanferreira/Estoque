const { MercadoPagoConfig, Preference } = require('mercadopago');
const { PAYMENT_CONFIG, generatePaymentId, formatCurrency } = require('../config/payments');

class CardService {
  constructor() {
    this.config = PAYMENT_CONFIG.mercadoPago;
    this.client = new MercadoPagoConfig({
      accessToken: this.config.accessToken,
      options: {
        sandbox: this.config.sandbox
      }
    });
    this.preference = new Preference(this.client);
  }

  // Processar pagamento com cartão
  async processCardPayment(paymentData) {
    try {
      const { amount, description, customer, paymentMethod, installments = 1 } = paymentData;
      
      // Gerar ID único para o pagamento
      const paymentId = generatePaymentId();
      
      // Criar preferência no Mercado Pago
      const preferenceData = {
        items: [
          {
            id: paymentId,
            title: description || 'Pagamento Lojify',
            description: `Pagamento de ${formatCurrency(amount)}`,
            quantity: 1,
            unit_price: amount,
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: customer.name,
          email: customer.email,
          identification: {
            type: customer.document.length === 11 ? 'CPF' : 'CNPJ',
            number: customer.document
          }
        },
        payment_methods: {
          excluded_payment_methods: this.getExcludedPaymentMethods(paymentMethod),
          excluded_payment_types: [],
          installments: installments
        },
        external_reference: paymentId,
        notification_url: `${this.config.webhookUrl}/card`,
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failure`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/pending`
        },
        auto_return: 'approved'
      };

      // Criar preferência
      const preference = await this.preference.create({ body: preferenceData });
      
      return {
        paymentId,
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        amount: formatCurrency(amount),
        installments,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      };
      
    } catch (error) {
      console.error('Erro ao processar pagamento com cartão:', error);
      
      // Em caso de erro, retornar dados simulados para desenvolvimento
      if (this.config.sandbox) {
        return this.createSimulatedResponse(paymentData);
      }
      
      throw new Error('Falha ao processar pagamento com cartão');
    }
  }

  // Criar resposta simulada para desenvolvimento
  createSimulatedResponse(paymentData) {
    const { amount, description, customer, paymentMethod, installments = 1 } = paymentData;
    const paymentId = generatePaymentId();
    
    return {
      paymentId,
      preferenceId: `sim_${Date.now()}`,
      initPoint: `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=sim_${Date.now()}`,
      sandboxInitPoint: `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=sim_${Date.now()}`,
      amount: formatCurrency(amount),
      installments,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      simulated: true
    };
  }

  // Obter métodos de pagamento excluídos
  getExcludedPaymentMethods(paymentMethod) {
    const excluded = [];
    
    if (paymentMethod === 'credit_card') {
      // Excluir débito e PIX
      excluded.push(
        { id: 'debit_card' },
        { id: 'pix' }
      );
    } else if (paymentMethod === 'debit_card') {
      // Excluir crédito e PIX
      excluded.push(
        { id: 'credit_card' },
        { id: 'pix' }
      );
    }
    
    return excluded;
  }

  // Verificar status do pagamento
  async checkPaymentStatus(paymentId) {
    try {
      // Simular verificação de status
      // Em produção, isso seria integrado com o Mercado Pago
      const statuses = ['pending', 'approved', 'rejected', 'cancelled'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        paymentId,
        status: randomStatus,
        checkedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Erro ao verificar status do cartão:', error);
      throw new Error('Falha ao verificar status do pagamento');
    }
  }

  // Processar webhook do Mercado Pago
  async processWebhook(webhookData) {
    try {
      const { type, data } = webhookData;
      
      if (type === 'payment') {
        // Buscar informações do pagamento
        const paymentInfo = await this.getPaymentInfo(data.id);
        
        return {
          paymentId: paymentInfo.external_reference,
          status: paymentInfo.status,
          amount: paymentInfo.transaction_amount,
          paymentMethod: paymentInfo.payment_method_id,
          installments: paymentInfo.installments,
          processedAt: new Date().toISOString()
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw new Error('Falha ao processar webhook');
    }
  }

  // Obter informações do pagamento
  async getPaymentInfo(paymentId) {
    try {
      // Simular busca de informações
      // Em produção, isso seria uma chamada real para o Mercado Pago
      return {
        id: paymentId,
        status: 'approved',
        transaction_amount: 100.00,
        payment_method_id: 'credit_card',
        installments: 1,
        external_reference: `TXN_${Date.now()}`
      };
      
    } catch (error) {
      console.error('Erro ao obter informações do pagamento:', error);
      throw new Error('Falha ao obter informações do pagamento');
    }
  }

  // Validar dados do cartão
  validateCardData(data) {
    const errors = [];
    
    if (!data.amount || data.amount <= 0) {
      errors.push('Valor é obrigatório e deve ser maior que zero');
    }
    
    if (!data.customer || !data.customer.name) {
      errors.push('Nome do cliente é obrigatório');
    }
    
    if (!data.customer || !data.customer.email) {
      errors.push('Email do cliente é obrigatório');
    }
    
    if (!data.customer || !data.customer.document) {
      errors.push('Documento do cliente é obrigatório');
    }
    
    if (!data.paymentMethod || !['credit_card', 'debit_card'].includes(data.paymentMethod)) {
      errors.push('Método de pagamento deve ser credit_card ou debit_card');
    }
    
    if (data.installments && (data.installments < 1 || data.installments > 12)) {
      errors.push('Número de parcelas deve estar entre 1 e 12');
    }
    
    return errors;
  }
}

module.exports = new CardService();
