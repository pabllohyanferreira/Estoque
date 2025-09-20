const pixService = require('./pixService');
const cardService = require('./cardService');
const boletoService = require('./boletoService');
const { validatePaymentData, calculateFees, formatCurrency } = require('../config/payments');

class PaymentService {
  constructor() {
    this.pixService = pixService;
    this.cardService = cardService;
    this.boletoService = boletoService;
  }

  // Processar pagamento
  async processPayment(paymentData) {
    try {
      console.log('💳 Processando pagamento:', JSON.stringify(paymentData, null, 2));
      
      // Validar dados
      const validationErrors = validatePaymentData(paymentData);
      if (validationErrors.length > 0) {
        throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`);
      }
      
      // Calcular taxas
      const fees = calculateFees(paymentData.amount, paymentData.paymentMethod);
      
      // Processar conforme método de pagamento
      let result;
      
      switch (paymentData.paymentMethod) {
        case 'pix':
          result = await this.pixService.generatePixCode(paymentData);
          break;
          
        case 'credit_card':
        case 'debit_card':
          result = await this.cardService.processCardPayment(paymentData);
          break;
          
        case 'boleto':
          result = await this.boletoService.generateBoleto(paymentData);
          break;
          
        default:
          throw new Error(`Método de pagamento não suportado: ${paymentData.paymentMethod}`);
      }
      
      // Adicionar informações de taxas
      result.fees = {
        processingFee: formatCurrency(fees.fee),
        netAmount: formatCurrency(fees.netAmount),
        feePercentage: fees.feePercentage.toFixed(2)
      };
      
      // Adicionar informações gerais
      result.paymentMethod = paymentData.paymentMethod;
      result.amount = formatCurrency(paymentData.amount);
      result.customer = paymentData.customer;
      result.description = paymentData.description;
      result.createdAt = new Date().toISOString();
      
      console.log('✅ Pagamento processado com sucesso:', result.paymentId);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      throw error;
    }
  }

  // Verificar status do pagamento
  async checkPaymentStatus(paymentId, paymentMethod) {
    try {
      console.log(`🔍 Verificando status do pagamento: ${paymentId} (${paymentMethod})`);
      
      let result;
      
      switch (paymentMethod) {
        case 'pix':
          result = await this.pixService.checkPaymentStatus(paymentId);
          break;
          
        case 'credit_card':
        case 'debit_card':
          result = await this.cardService.checkPaymentStatus(paymentId);
          break;
          
        case 'boleto':
          result = await this.boletoService.checkBoletoStatus(paymentId);
          break;
          
        default:
          throw new Error(`Método de pagamento não suportado: ${paymentMethod}`);
      }
      
      console.log('✅ Status verificado:', result.status);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      throw error;
    }
  }

  // Processar webhook
  async processWebhook(webhookData, paymentMethod) {
    try {
      console.log(`🔔 Processando webhook: ${paymentMethod}`, JSON.stringify(webhookData, null, 2));
      
      let result;
      
      switch (paymentMethod) {
        case 'credit_card':
        case 'debit_card':
          result = await this.cardService.processWebhook(webhookData);
          break;
          
        default:
          throw new Error(`Webhook não suportado para: ${paymentMethod}`);
      }
      
      console.log('✅ Webhook processado:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      throw error;
    }
  }

  // Gerar PDF do boleto
  async generateBoletoPDF(paymentId) {
    try {
      console.log(`📄 Gerando PDF do boleto: ${paymentId}`);
      
      const result = await this.boletoService.generateBoletoPDF(paymentId);
      
      console.log('✅ PDF gerado com sucesso');
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      throw error;
    }
  }

  // Obter métodos de pagamento disponíveis
  getAvailablePaymentMethods() {
    return {
      pix: {
        name: 'PIX',
        description: 'Pagamento instantâneo via PIX',
        icon: 'pix',
        fees: '1%',
        processingTime: 'Instantâneo',
        features: ['Pagamento instantâneo', 'Sem taxas de processamento', 'Disponível 24/7']
      },
      credit_card: {
        name: 'Cartão de Crédito',
        description: 'Pagamento com cartão de crédito',
        icon: 'credit-card',
        fees: '3.5%',
        processingTime: 'Imediato',
        features: ['Parcelamento em até 12x', 'Pagamento seguro', 'Aceito em todo o Brasil']
      },
      debit_card: {
        name: 'Cartão de Débito',
        description: 'Pagamento com cartão de débito',
        icon: 'debit-card',
        fees: '2%',
        processingTime: 'Imediato',
        features: ['Pagamento à vista', 'Desconto na conta', 'Processamento rápido']
      },
      boleto: {
        name: 'Boleto Bancário',
        description: 'Pagamento via boleto bancário',
        icon: 'boleto',
        fees: 'R$ 3,50',
        processingTime: '1-3 dias úteis',
        features: ['Pagamento à vista', 'Vencimento em 3 dias', 'Aceito em qualquer banco']
      }
    };
  }

  // Validar dados de pagamento
  validatePaymentData(data) {
    return validatePaymentData(data);
  }

  // Calcular taxas
  calculateFees(amount, paymentMethod) {
    return calculateFees(amount, paymentMethod);
  }
}

module.exports = new PaymentService();
