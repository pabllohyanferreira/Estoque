const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Rate limiting para prevenir ataques de força bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Rate limiting geral para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuração de CORS mais restritiva
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'http://localhost:5001'
    ];
    
    // Em produção, adicionar domínios específicos
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware de segurança com Helmet
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Middleware para validar JWT e prevenir ataques
const validateJWT = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lojify-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para log de segurança
const securityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /script/i,
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\.cookie/i,
    /window\.location/i,
    /\.\.\//i, // Directory traversal
    /union.*select/i, // SQL injection
    /drop.*table/i, // SQL injection
    /delete.*from/i, // SQL injection
    /insert.*into/i, // SQL injection
    /update.*set/i // SQL injection
  ];
  
  const checkForThreats = (data) => {
    if (typeof data === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(data));
    } else if (typeof data === 'object' && data !== null) {
      return Object.values(data).some(checkForThreats);
    }
    return false;
  };
  
  if (checkForThreats(req.body) || checkForThreats(req.query) || checkForThreats(req.params)) {
    console.warn(`🚨 Tentativa suspeita detectada: ${req.ip} - ${req.method} ${req.path}`);
    return res.status(400).json({ error: 'Requisição suspeita detectada' });
  }
  
  next();
};

// Middleware para sanitizar dados de entrada
const sanitizeInput = (req, res, next) => {
  const sanitize = (data) => {
    if (typeof data === 'string') {
      return data
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    } else if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return data;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  next();
};

module.exports = {
  loginLimiter,
  apiLimiter,
  corsOptions,
  securityMiddleware,
  validateJWT,
  securityLogger,
  sanitizeInput
};
