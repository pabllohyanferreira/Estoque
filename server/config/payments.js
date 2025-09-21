const { v4: uuidv4 } = require('uuid');

// Configurações de pagamento
const PAYMENT_CONFIG = {
  
  // PIX
  pix: {
    // Chave PIX da empresa (pode ser CPF, CNPJ, email ou chave aleatória)
    key: process.env.PIX_KEY,
    // Nome da empresa
    merchantName: process.env.PIX_MERCHANT_NAME || 'Lojify',
    // Cidade da empresa
    merchantCity: process.env.PIX_MERCHANT_CITY || 'Caruaru',
    // Código da cidade (IBGE)
    merchantCityCode: process.env.PIX_MERCHANT_CITY_CODE || '260410'
  },
  
  
  // Configurações gerais
  general: {
    // Tempo de expiração dos pagamentos (em dias)
    expirationDays: 7,
    // Taxa de processamento (em %)
    processingFee: 3.5,
    // Moeda
    currency: 'BRL',
    // Ambiente
    environment: process.env.NODE_ENV || 'development'
  }
};

// Funções auxiliares
const generatePaymentId = () => uuidv4();
const generateTransactionId = () => `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Validações
const validatePaymentData = (data) => {
  const errors = [];
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Valor do pagamento é obrigatório e deve ser maior que zero');
  }
  
  if (!data.paymentMethod) {
    errors.push('Método de pagamento é obrigatório');
  }
  
  if (!data.customer) {
    errors.push('Dados do cliente são obrigatórios');
  } else {
    if (!data.customer.name) errors.push('Nome do cliente é obrigatório');
    if (!data.customer.email) errors.push('Email do cliente é obrigatório');
    if (!data.customer.document) errors.push('Documento do cliente é obrigatório');
  }
  
  return errors;
};

// Formatação de valores
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDocument = (document) => {
  // Remove caracteres não numéricos
  const cleanDoc = document.replace(/\D/g, '');
  
  // Formata CPF (11 dígitos) ou CNPJ (14 dígitos)
  if (cleanDoc.length === 11) {
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleanDoc.length === 14) {
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return document;
};

// Cálculo de taxas
const calculateFees = (amount, paymentMethod) => {
  const baseFee = PAYMENT_CONFIG.general.processingFee;
  let totalFee = 0;
  
  switch (paymentMethod) {
    case 'pix':
      totalFee = amount * 0.01; // 1% para PIX
      break;
    default:
      totalFee = amount * (baseFee / 100);
  }
  
  return {
    fee: totalFee,
    netAmount: amount - totalFee,
    feePercentage: (totalFee / amount) * 100
  };
};

module.exports = {
  PAYMENT_CONFIG,
  generatePaymentId,
  generateTransactionId,
  validatePaymentData,
  formatCurrency,
  formatDocument,
  calculateFees
};
