const express = require('express');
const { body, validationResult } = require('express-validator');
const { getUserDatabase } = require('../middleware/userDatabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticação e banco de dados em todas as rotas
router.use(authenticateToken);
router.use(getUserDatabase);

// Buscar todas as configurações do usuário
router.get('/', (req, res) => {
  try {
    console.log('🔍 Buscando configurações do usuário:', req.user.id);
    
    const query = 'SELECT setting_key, setting_value FROM user_settings ORDER BY setting_key';
    
    req.userDb.all(query, [], (err, rows) => {
      if (err) {
        console.error('❌ Erro ao buscar configurações:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Erro interno do servidor',
          details: err.message 
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
      
      console.log('✅ Configurações carregadas:', Object.keys(settings));
      res.json({ 
        success: true, 
        data: settings 
      });
    });
  } catch (error) {
    console.error('❌ Erro na rota de configurações:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Buscar uma configuração específica
router.get('/:key', (req, res) => {
  try {
    const { key } = req.params;
    console.log('🔍 Buscando configuração específica:', key);
    
    const query = 'SELECT setting_value FROM user_settings WHERE setting_key = ?';
    
    req.userDb.get(query, [key], (err, row) => {
      if (err) {
        console.error('❌ Erro ao buscar configuração:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Erro interno do servidor',
          details: err.message 
        });
      }
      
      if (!row) {
        return res.status(404).json({ 
          success: false, 
          error: 'Configuração não encontrada' 
        });
      }
      
      let value;
      try {
        value = JSON.parse(row.setting_value);
      } catch (parseError) {
        value = row.setting_value;
      }
      
      console.log('✅ Configuração encontrada:', key);
      res.json({ 
        success: true, 
        data: { [key]: value } 
      });
    });
  } catch (error) {
    console.error('❌ Erro na rota de configuração específica:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Salvar/atualizar configurações
router.post('/', [
  body('settings').isObject().withMessage('Configurações devem ser um objeto'),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { settings } = req.body;
    console.log('💾 Salvando configurações:', Object.keys(settings));
    
    // Preparar dados para inserção/atualização
    const settingsArray = Object.entries(settings).map(([key, value]) => [
      key,
      JSON.stringify(value)
    ]);
    
    // Usar INSERT OR REPLACE para salvar/atualizar
    const query = `
      INSERT OR REPLACE INTO user_settings (setting_key, setting_value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    
    let completed = 0;
    let hasError = false;
    
    // Salvar no banco do usuário
    settingsArray.forEach(([key, value], index) => {
      req.userDb.run(query, [key, value], function(err) {
        if (err) {
          console.error(`❌ Erro ao salvar configuração ${key}:`, err);
          hasError = true;
        } else {
          console.log(`✅ Configuração ${key} salva com sucesso`);
        }
        
        completed++;
        if (completed === settingsArray.length) {
          if (hasError) {
            return res.status(500).json({ 
              success: false, 
              error: 'Erro ao salvar algumas configurações' 
            });
          }
          
          // Também salvar no banco principal para acesso público
          const sqlite3 = require('sqlite3').verbose();
          const path = require('path');
          const dbPath = path.join(__dirname, '../database/estoque.db');
          const mainDb = new sqlite3.Database(dbPath);
          
          let mainCompleted = 0;
          let mainHasError = false;
          
          settingsArray.forEach(([key, value], index) => {
            mainDb.run(query, [key, value], function(err) {
              if (err) {
                console.error(`❌ Erro ao salvar configuração ${key} no banco principal:`, err);
                mainHasError = true;
              } else {
                console.log(`✅ Configuração ${key} salva no banco principal`);
              }
              
              mainCompleted++;
              if (mainCompleted === settingsArray.length) {
                mainDb.close();
                
                if (mainHasError) {
                  console.warn('⚠️ Algumas configurações não foram salvas no banco principal');
                } else {
                  console.log('✅ Todas as configurações foram salvas no banco principal');
                }
              }
            });
          });
          
          console.log('✅ Todas as configurações foram salvas');
          res.json({ 
            success: true, 
            message: 'Configurações salvas com sucesso',
            count: settingsArray.length 
          });
        }
      });
    });
  } catch (error) {
    console.error('❌ Erro na rota de salvar configurações:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Salvar/atualizar uma configuração específica
router.put('/:key', [
  body('value').notEmpty().withMessage('Valor é obrigatório'),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { key } = req.params;
    const { value } = req.body;
    
    console.log('💾 Salvando configuração específica:', key);
    
    const query = `
      INSERT OR REPLACE INTO user_settings (setting_key, setting_value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    
    req.userDb.run(query, [key, JSON.stringify(value)], function(err) {
      if (err) {
        console.error('❌ Erro ao salvar configuração:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Erro interno do servidor',
          details: err.message 
        });
      }
      
      console.log('✅ Configuração salva com sucesso:', key);
      res.json({ 
        success: true, 
        message: 'Configuração salva com sucesso' 
      });
    });
  } catch (error) {
    console.error('❌ Erro na rota de salvar configuração específica:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Deletar uma configuração específica
router.delete('/:key', (req, res) => {
  try {
    const { key } = req.params;
    console.log('🗑️ Deletando configuração:', key);
    
    const query = 'DELETE FROM user_settings WHERE setting_key = ?';
    
    req.userDb.run(query, [key], function(err) {
      if (err) {
        console.error('❌ Erro ao deletar configuração:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Erro interno do servidor',
          details: err.message 
        });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Configuração não encontrada' 
        });
      }
      
      console.log('✅ Configuração deletada com sucesso:', key);
      res.json({ 
        success: true, 
        message: 'Configuração deletada com sucesso' 
      });
    });
  } catch (error) {
    console.error('❌ Erro na rota de deletar configuração:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Deletar todas as configurações do usuário
router.delete('/', (req, res) => {
  try {
    console.log('🗑️ Deletando todas as configurações do usuário:', req.user.id);
    
    const query = 'DELETE FROM user_settings';
    
    req.userDb.run(query, [], function(err) {
      if (err) {
        console.error('❌ Erro ao deletar configurações:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Erro interno do servidor',
          details: err.message 
        });
      }
      
      console.log('✅ Todas as configurações foram deletadas');
      res.json({ 
        success: true, 
        message: 'Todas as configurações foram deletadas com sucesso',
        count: this.changes 
      });
    });
  } catch (error) {
    console.error('❌ Erro na rota de deletar todas as configurações:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

module.exports = router;
