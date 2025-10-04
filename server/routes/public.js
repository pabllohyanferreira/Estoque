const express = require('express');
const { getUserDatabase } = require('../middleware/userDatabase');
const router = express.Router();

// Rota de teste simples (sem middleware)
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Rota pública funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas públicas que não precisam de autenticação
const getPublicDatabase = (req, res, next) => {
  try {
    // Para rotas públicas, usar o banco do usuário padrão (admin)
    const databaseManager = require('../database/databaseManager');
    
    // Usar o banco do usuário admin (ID 1) para dados públicos
    const db = databaseManager.getUserDatabase(1);
    req.userDb = db;
    next();
  } catch (error) {
    console.error('❌ Erro ao configurar banco público:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};

// Rota pública para obter produtos do catálogo (sem autenticação)
router.get('/catalog/items', (req, res) => {
  try {
    console.log('📦 Carregando produtos para catálogo público...');
    
    // Usar banco principal para rotas públicas
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.join(__dirname, '../database/estoque.db');
    const db = new sqlite3.Database(dbPath);
    
    const query = `
      SELECT 
        id, name, description, price, stock as quantity, category, 
        image_url, created_at, updated_at
      FROM items 
      WHERE stock > 0
      ORDER BY created_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('❌ Erro ao carregar produtos:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Erro interno do servidor',
          details: err.message 
        });
      }
      
      console.log(`✅ ${rows.length} produtos carregados para catálogo público`);
      res.json({ 
        success: true, 
        data: rows,
        count: rows.length 
      });
    });
  } catch (error) {
    console.error('❌ Erro na rota pública de catálogo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Rota pública para obter categorias
router.get('/catalog/categories', (req, res) => {
  try {
    console.log('📂 Carregando categorias para catálogo público...');
    
    // Usar banco principal para rotas públicas
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.join(__dirname, '../database/estoque.db');
    const db = new sqlite3.Database(dbPath);
    
    const query = `
      SELECT DISTINCT category 
      FROM items 
      WHERE category IS NOT NULL AND category != '' AND stock > 0
      ORDER BY category
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('❌ Erro ao carregar categorias:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Erro interno do servidor',
          details: err.message 
        });
      }
      
      const categories = rows.map(row => row.category);
      console.log(`✅ ${categories.length} categorias carregadas para catálogo público`);
      res.json({ 
        success: true, 
        data: categories,
        count: categories.length 
      });
    });
  } catch (error) {
    console.error('❌ Erro na rota pública de categorias:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Rota pública para obter informações da loja
router.get('/catalog/store-info', (req, res) => {
  try {
    console.log('🏪 Carregando informações da loja...');
    
    // Informações padrão da loja (pode ser expandido futuramente)
    const storeInfo = {
      name: 'DETTY FERRAZ',
      subtitle: 'SEMIJOIAS',
      phone: '(81) 99726-9325',
      whatsapp: '5581997269325',
      instagram: '@dettyferrazsemijoias',
      email: 'contato@dettyferraz.com',
      address: 'Recife, PE',
      description: 'Semi-joias de qualidade com os melhores preços',
      socialMedia: {
        instagram: '@dettyferrazsemijoias',
        whatsapp: '5581997269325'
      }
    };
    
    console.log('✅ Informações da loja carregadas');
    res.json({ 
      success: true, 
      data: storeInfo 
    });
  } catch (error) {
    console.error('❌ Erro ao carregar informações da loja:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Rota pública para obter configurações do catálogo
router.get('/catalog/settings', (req, res) => {
  try {
    console.log('⚙️ Carregando configurações do catálogo...');
    
    // Usar banco principal para rotas públicas
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.join(__dirname, '../database/estoque.db');
    const db = new sqlite3.Database(dbPath);
    
    // Buscar configurações do banco de dados
    const query = 'SELECT setting_key, setting_value FROM user_settings ORDER BY setting_key';
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('❌ Erro ao buscar configurações:', err);
        // Fallback para configurações padrão
        const defaultSettings = {
          backgroundColor: '#ffffff',
          logoUrl: '',
          businessName: 'DETTY FERRAZ',
          businessSubtitle: 'SEMIJOIAS',
          phoneNumber: '(81) 99726-9325',
          instagramHandle: '@dettyferrazsemijoias',
          whatsappNumber: '5581997269325',
          email: 'contato@dettyferraz.com',
          address: 'Recife, PE',
          description: 'Semi-joias de qualidade com os melhores preços',
          showPrices: true,
          showInstallments: true
        };
        
        return res.json({ 
          success: true, 
          data: defaultSettings 
        });
      }
      
      // Converter array de rows em objeto
      const settings = {};
      rows.forEach(row => {
        try {
          settings[row.setting_key] = JSON.parse(row.setting_value);
        } catch (parseError) {
          // Se não conseguir fazer parse, usar como string
          settings[row.setting_key] = row.setting_value;
        }
      });
      
      // Se não há configurações salvas, usar padrões
      if (Object.keys(settings).length === 0) {
        settings.backgroundColor = '#ffffff';
        settings.logoUrl = '';
        settings.businessName = 'DETTY FERRAZ';
        settings.businessSubtitle = 'SEMIJOIAS';
        settings.phoneNumber = '(81) 99726-9325';
        settings.instagramHandle = '@dettyferrazsemijoias';
        settings.whatsappNumber = '5581997269325';
        settings.email = 'contato@dettyferraz.com';
        settings.address = 'Recife, PE';
        settings.description = 'Semi-joias de qualidade com os melhores preços';
        settings.showPrices = true;
        settings.showInstallments = true;
      }
      
      console.log('✅ Configurações do catálogo carregadas do banco:', Object.keys(settings));
      res.json({ 
        success: true, 
        data: settings 
      });
    });
  } catch (error) {
    console.error('❌ Erro ao carregar configurações do catálogo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

module.exports = router;
