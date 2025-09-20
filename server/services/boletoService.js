const { PAYMENT_CONFIG, generatePaymentId, generateBoletoNumber, formatCurrency, formatDocument } = require('../config/payments');

class BoletoService {
  constructor() {
    this.config = PAYMENT_CONFIG.boleto;
  }

  // Gerar boleto
  async generateBoleto(paymentData) {
    try {
      const { amount, description, customer, dueDate } = paymentData;
      
      // Gerar ID único para o pagamento
      const paymentId = generatePaymentId();
      
      // Gerar número do boleto
      const boletoNumber = generateBoletoNumber();
      
      // Calcular data de vencimento
      const expirationDate = dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 dias
      
      // Gerar código de barras
      const barcode = this.generateBarcode(boletoNumber, amount, expirationDate);
      
      // Gerar linha digitável
      const digitableLine = this.generateDigitableLine(barcode);
      
      // Criar dados do boleto
      const boletoData = {
        paymentId,
        boletoNumber,
        barcode,
        digitableLine,
        amount: formatCurrency(amount),
        dueDate: expirationDate.toISOString().split('T')[0],
        customer: {
          name: customer.name,
          document: formatDocument(customer.document),
          address: customer.address || 'Não informado'
        },
        company: {
          name: this.config.companyName,
          document: formatDocument(this.config.companyDocument),
          address: this.config.companyAddress,
          city: this.config.companyCity,
          state: this.config.companyState,
          zipCode: this.config.companyZipCode
        },
        instructions: [
          'Não receber após o vencimento',
          'Em caso de dúvidas, entre em contato conosco',
          'Este boleto pode ser pago em qualquer banco'
        ],
        status: 'pending',
        expiresAt: expirationDate
      };
      
      return boletoData;
      
    } catch (error) {
      console.error('Erro ao gerar boleto:', error);
      throw new Error('Falha ao gerar boleto');
    }
  }

  // Gerar código de barras
  generateBarcode(boletoNumber, amount, dueDate) {
    // Formato simplificado do código de barras
    // Em produção, isso seria gerado conforme as especificações bancárias
    
    const bankCode = this.config.bankCode;
    const currencyCode = '9'; // Real
    const dueDateCode = this.formatDateForBarcode(dueDate);
    const amountCode = this.formatAmountForBarcode(amount);
    const agencyCode = this.config.agency.padStart(4, '0');
    const accountCode = this.config.account.padStart(8, '0');
    const accountDigit = this.config.accountDigit;
    
    // Montar código de barras
    const barcode = `${bankCode}${currencyCode}${dueDateCode}${amountCode}${agencyCode}${accountCode}${accountDigit}${boletoNumber}`;
    
    // Adicionar dígito verificador
    const checkDigit = this.calculateCheckDigit(barcode);
    
    return `${barcode}${checkDigit}`;
  }

  // Gerar linha digitável
  generateDigitableLine(barcode) {
    // Formato simplificado da linha digitável
    // Em produção, isso seria gerado conforme as especificações bancárias
    
    const bankCode = barcode.substring(0, 3);
    const currencyCode = barcode.substring(3, 4);
    const dueDateCode = barcode.substring(4, 12);
    const amountCode = barcode.substring(12, 20);
    const agencyCode = barcode.substring(20, 24);
    const accountCode = barcode.substring(24, 32);
    const accountDigit = barcode.substring(32, 33);
    const boletoNumber = barcode.substring(33, 43);
    const checkDigit = barcode.substring(43, 44);
    
    // Montar linha digitável
    const line1 = `${bankCode}${currencyCode}${dueDateCode}${amountCode}`;
    const line2 = `${agencyCode}${accountCode}${accountDigit}`;
    const line3 = `${boletoNumber}${checkDigit}`;
    
    return `${line1} ${line2} ${line3}`;
  }

  // Formatar data para código de barras
  formatDateForBarcode(date) {
    const baseDate = new Date('1997-10-07'); // Data base do sistema bancário
    const targetDate = new Date(date);
    const diffTime = targetDate - baseDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString().padStart(4, '0');
  }

  // Formatar valor para código de barras
  formatAmountForBarcode(amount) {
    const amountInCents = Math.round(amount * 100);
    return amountInCents.toString().padStart(10, '0');
  }

  // Calcular dígito verificador
  calculateCheckDigit(barcode) {
    // Algoritmo simplificado para cálculo do dígito verificador
    // Em produção, isso seria o algoritmo oficial do banco
    
    let sum = 0;
    let weight = 2;
    
    for (let i = barcode.length - 1; i >= 0; i--) {
      sum += parseInt(barcode[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }

  // Verificar status do boleto
  async checkBoletoStatus(paymentId) {
    try {
      // Simular verificação de status
      // Em produção, isso seria integrado com o banco ou sistema de cobrança
      const statuses = ['pending', 'paid', 'overdue', 'cancelled'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      return {
        paymentId,
        status: randomStatus,
        checkedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Erro ao verificar status do boleto:', error);
      throw new Error('Falha ao verificar status do boleto');
    }
  }

  // Gerar PDF do boleto
  async generateBoletoPDF(boletoData) {
    try {
      // Simular geração de PDF
      // Em produção, isso seria integrado com uma biblioteca de PDF
      const pdfData = {
        boletoNumber: boletoData.boletoNumber,
        amount: boletoData.amount,
        dueDate: boletoData.dueDate,
        digitableLine: boletoData.digitableLine,
        barcode: boletoData.barcode,
        customer: boletoData.customer,
        company: boletoData.company,
        instructions: boletoData.instructions,
        generatedAt: new Date().toISOString()
      };
      
      return {
        pdfUrl: `https://api.lojify.com/boletos/${boletoData.paymentId}/pdf`,
        pdfData,
        message: 'PDF do boleto gerado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro ao gerar PDF do boleto:', error);
      throw new Error('Falha ao gerar PDF do boleto');
    }
  }

  // Validar dados do boleto
  validateBoletoData(data) {
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
    
    if (data.dueDate && new Date(data.dueDate) < new Date()) {
      errors.push('Data de vencimento não pode ser no passado');
    }
    
    return errors;
  }
}

module.exports = new BoletoService();
