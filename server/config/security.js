// Configurações de Segurança do Sistema

const securityConfig = {
  // Configurações de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'lojify-secret-key-2024',
    expiresIn: '24h',
    issuer: 'lojify-system',
    audience: 'lojify-users'
  },

  // Configurações de Rate Limiting
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 tentativas por IP
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    },
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por IP
      message: 'Muitas requisições. Tente novamente em 15 minutos.'
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 3, // máximo 3 tentativas por IP
      message: 'Muitas tentativas de reset de senha. Tente novamente em 1 hora.'
    }
  },

  // Configurações de CORS
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'http://localhost:5001'
    ],
    credentials: true
  },

  // Configurações de Senha
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAttempts: 5,
    lockoutDuration: 30 * 60 * 1000 // 30 minutos
  },

  // Configurações de Sessão
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },

  // Configurações de Log
  logging: {
    logLevel: process.env.LOG_LEVEL || 'info',
    logSecurity: true,
    logAttempts: true,
    retentionDays: 30
  },

  // Configurações de Backup
  backup: {
    enabled: true,
    interval: '0 2 * * *', // Todo dia às 2h
    retention: 7, // 7 dias
    location: './backups'
  },

  // Configurações de Monitoramento
  monitoring: {
    enabled: true,
    alertThresholds: {
      failedLogins: 10,
      suspiciousRequests: 5,
      errorRate: 0.1 // 10%
    }
  }
};

// Validação de senha
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < securityConfig.password.minLength) {
    errors.push(`Senha deve ter pelo menos ${securityConfig.password.minLength} caracteres`);
  }
  
  if (securityConfig.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (securityConfig.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (securityConfig.password.requireNumbers && !/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (securityConfig.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Geração de senha segura
const generateSecurePassword = () => {
  const chars = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    special: '!@#$%^&*(),.?":{}|<>'
  };
  
  let password = '';
  
  // Garantir pelo menos um de cada tipo
  password += chars.uppercase[Math.floor(Math.random() * chars.uppercase.length)];
  password += chars.lowercase[Math.floor(Math.random() * chars.lowercase.length)];
  password += chars.numbers[Math.floor(Math.random() * chars.numbers.length)];
  password += chars.special[Math.floor(Math.random() * chars.special.length)];
  
  // Completar com caracteres aleatórios
  const allChars = chars.uppercase + chars.lowercase + chars.numbers + chars.special;
  for (let i = 4; i < securityConfig.password.minLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Embaralhar a senha
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Validação de email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitização de entrada
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/script/gi, '')
      .trim();
  }
  return input;
};

// Verificação de força da senha
const getPasswordStrength = (password) => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  if (password.length >= 16) score++;
  
  const levels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte', 'Muito forte', 'Excelente'];
  return {
    score,
    level: levels[Math.min(score, levels.length - 1)],
    percentage: Math.min((score / 7) * 100, 100)
  };
};

module.exports = {
  securityConfig,
  validatePassword,
  generateSecurePassword,
  validateEmail,
  sanitizeInput,
  getPasswordStrength
};
