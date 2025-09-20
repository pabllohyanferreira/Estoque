const QRCode = require('qrcode');
const { PAYMENT_CONFIG, generatePaymentId, formatCurrency } = require('../config/payments');

class PixService {
  constructor() {
    this.config = PAYMENT_CONFIG.pix;
  }

  // Gerar código PIX
  async generatePixCode(paymentData) {
    try {
      const { amount, description, customer } = paymentData;
      
      // Gerar ID único para o pagamento
      const paymentId = generatePaymentId();
      
      // Criar payload PIX
      const pixPayload = this.createPixPayload({
        paymentId,
        amount,
        description,
        customer
      });
      
      // Gerar QR Code
      const qrCodeDataURL = await QRCode.toDataURL(pixPayload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Gerar código PIX copia e cola
      const pixCopyPaste = this.generatePixCopyPaste({
        paymentId,
        amount,
        description,
        customer
      });
      
      return {
        paymentId,
        qrCode: qrCodeDataURL,
        pixCode: pixCopyPaste,
        amount: formatCurrency(amount),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
        status: 'pending'
      };
      
    } catch (error) {
      console.error('Erro ao gerar código PIX:', error);
      throw new Error('Falha ao gerar código PIX');
    }
  }

  // Criar payload PIX
  createPixPayload(data) {
    const { paymentId, amount, description, customer } = data;
    
    // Formato simplificado do PIX (EMV)
    const payload = {
      // Código do país
      '00': '01', // BR
      // Chave PIX
      '26': {
        '00': 'br.gov.bcb.pix',
        '01': this.config.key
      },
      // Descrição
      '52': '0000', // Código do sistema
      '53': '986', // Moeda (BRL)
      '54': amount.toFixed(2), // Valor
      '58': 'BR', // País
      '59': this.config.merchantName, // Nome do beneficiário
      '60': this.config.merchantCity, // Cidade
      '62': {
        '05': paymentId // ID da transação
      }
    };
    
    // Converter para string EMV
    return this.encodeEMV(payload);
  }

  // Gerar código PIX copia e cola
  generatePixCopyPaste(data) {
    const { paymentId, amount, description, customer } = data;
    
    // Formato simplificado para demonstração
    return `00020126580014br.gov.bcb.pix0136${this.config.key}520400005303986540${amount.toFixed(2)}5802BR5913${this.config.merchantName}6009${this.config.merchantCity}62070503${paymentId}6304`;
  }

  // Codificar EMV
  encodeEMV(data) {
    let result = '';
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object') {
        const subResult = this.encodeEMV(value);
        result += key.padStart(2, '0') + subResult.length.toString().padStart(2, '0') + subResult;
      } else {
        const valueStr = value.toString();
        result += key.padStart(2, '0') + valueStr.length.toString().padStart(2, '0') + valueStr;
      }
    }
    
    return result;
  }

  // Verificar status do pagamento PIX
  async checkPaymentStatus(paymentId) {
    try {
      // Simular verificação de status
      // Em produção, isso seria integrado com o banco ou gateway de pagamento
      const statuses = ['pending', 'paid', 'expired', 'cancelled'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        paymentId,
        status: randomStatus,
        checkedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Erro ao verificar status do PIX:', error);
      throw new Error('Falha ao verificar status do pagamento');
    }
  }

  // Validar dados do PIX
  validatePixData(data) {
    const errors = [];
    
    if (!data.amount || data.amount <= 0) {
      errors.push('Valor é obrigatório e deve ser maior que zero');
    }
    
    if (!data.customer || !data.customer.name) {
      errors.push('Nome do cliente é obrigatório');
    }
    
    if (!data.customer || !data.customer.document) {
      errors.push('Documento do cliente é obrigatório');
    }
    
    return errors;
  }
}

module.exports = new PixService();
