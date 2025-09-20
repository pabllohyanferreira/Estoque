const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🏭 BUILD DE PRODUÇÃO - LOJIFY');
console.log('==============================\n');

function executeCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} concluído!\n`);
    return true;
  } catch (error) {
    console.error(`❌ Erro em ${description}:`, error.message);
    return false;
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function createProductionConfig() {
  console.log('📝 CRIANDO CONFIGURAÇÕES DE PRODUÇÃO...\n');
  
  // Verificar se arquivos .env existem
  if (!checkFileExists('server/.env')) {
    console.log('⚠️ Arquivo server/.env não encontrado');
    console.log('Execute: node configurar-producao.js primeiro\n');
    return false;
  }
  
  if (!checkFileExists('client/.env')) {
    console.log('⚠️ Arquivo client/.env não encontrado');
    console.log('Execute: node configurar-producao.js primeiro\n');
    return false;
  }
  
  console.log('✅ Arquivos de configuração encontrados\n');
  return true;
}

function buildClient() {
  console.log('🌐 BUILD DO CLIENTE...\n');
  
  // Verificar se está no diretório correto
  if (!checkFileExists('client/package.json')) {
    console.log('❌ Diretório client não encontrado');
    return false;
  }
  
  // Instalar dependências se necessário
  if (!checkFileExists('client/node_modules')) {
    console.log('📦 Instalando dependências do cliente...');
    if (!executeCommand('cd client && npm install', 'Instalação de dependências do cliente')) {
      return false;
    }
  }
  
  // Build do cliente
  if (!executeCommand('cd client && npm run build', 'Build do cliente React')) {
    return false;
  }
  
  // Verificar se build foi criado
  if (!checkFileExists('client/build')) {
    console.log('❌ Build do cliente não foi criado');
    return false;
  }
  
  console.log('✅ Cliente buildado com sucesso!\n');
  return true;
}

function buildServer() {
  console.log('🖥️ PREPARANDO SERVIDOR...\n');
  
  // Verificar se está no diretório correto
  if (!checkFileExists('server/package.json')) {
    console.log('❌ Diretório server não encontrado');
    return false;
  }
  
  // Instalar dependências se necessário
  if (!checkFileExists('server/node_modules')) {
    console.log('📦 Instalando dependências do servidor...');
    if (!executeCommand('cd server && npm install', 'Instalação de dependências do servidor')) {
      return false;
    }
  }
  
  console.log('✅ Servidor preparado!\n');
  return true;
}

function createProductionFiles() {
  console.log('📄 CRIANDO ARQUIVOS DE PRODUÇÃO...\n');
  
  // Criar arquivo de inicialização de produção
  const productionStartScript = `const path = require('path');
const express = require('express');
const cors = require('cors');

// Importar configurações
const productionConfig = require('./config/production');

const app = express();
const PORT = process.env.PORT || productionConfig.port || 5000;

// Middleware
app.use(cors(productionConfig.cors));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Importar rotas
const itemsRoutes = require('./routes/items');
const clientsRoutes = require('./routes/clients');
const salesRoutes = require('./routes/sales');
const accountsRoutes = require('./routes/accounts');
const stockMovementsRoutes = require('./routes/stockMovements');
const paymentRoutes = require('./routes/payments');
const paymentApiRoutes = require('./routes/paymentRoutes');

// Usar rotas
app.use('/api/items', itemsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/stock-movements', stockMovementsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment', paymentApiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'production',
    app: 'Lojify'
  });
});

// Servir arquivos estáticos do React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`🚀 Lojify Server (Produção) rodando na porta \${PORT}\`);
  console.log(\`📱 Acesse: http://localhost:\${PORT}\`);
  console.log(\`🌍 Ambiente: Produção\`);
});

// Tratamento de sinais para shutdown graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, encerrando servidor...');
  process.exit(0);
});
`;

  fs.writeFileSync('server/start-production.js', productionStartScript);
  console.log('✅ server/start-production.js criado');
  
  // Criar script de inicialização de produção
  const productionPackageJson = {
    "name": "lojify-production",
    "version": "1.0.0",
    "description": "Lojify - Sistema de Estoque e Vendas (Produção)",
    "main": "start-production.js",
    "scripts": {
      "start": "node start-production.js",
      "test": "echo \"Sistema em produção\" && exit 0"
    },
    "dependencies": {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "sqlite3": "^5.1.6",
      "axios": "^1.12.2",
      "bcryptjs": "^2.4.3",
      "express-validator": "^7.0.1",
      "jsonwebtoken": "^9.0.2",
      "mercadopago": "^2.9.0",
      "multer": "^1.4.5-lts.1",
      "qrcode": "^1.5.4",
      "uuid": "^13.0.0"
    },
    "engines": {
      "node": ">=16.0.0",
      "npm": ">=8.0.0"
    }
  };
  
  fs.writeFileSync('server/package-production.json', JSON.stringify(productionPackageJson, null, 2));
  console.log('✅ server/package-production.json criado');
  
  console.log('✅ Arquivos de produção criados!\n');
  return true;
}

function createDeployScript() {
  console.log('🚀 CRIANDO SCRIPT DE DEPLOY...\n');
  
  const deployScript = `#!/bin/bash
echo "🚀 DEPLOY LOJIFY - PRODUÇÃO"
echo "============================"

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na raiz do projeto"
    exit 1
fi

# Verificar configurações
echo "🔍 Verificando configurações..."
if [ ! -f "server/.env" ]; then
    echo "❌ Arquivo server/.env não encontrado"
    echo "Execute: node configurar-producao.js"
    exit 1
fi

if [ ! -f "client/.env" ]; then
    echo "❌ Arquivo client/.env não encontrado"
    echo "Execute: node configurar-producao.js"
    exit 1
fi

# Build do sistema
echo "🏭 Fazendo build do sistema..."
node build-production.js

if [ $? -ne 0 ]; then
    echo "❌ Erro no build"
    exit 1
fi

# Copiar arquivos necessários
echo "📁 Copiando arquivos de produção..."
cp server/start-production.js server/start.js
cp server/package-production.json server/package.json

# Instalar dependências de produção
echo "📦 Instalando dependências de produção..."
cd server && npm install --production && cd ..

echo "✅ Deploy concluído!"
echo "🚀 Para iniciar: cd server && npm start"
`;

  fs.writeFileSync('deploy.sh', deployScript);
  console.log('✅ deploy.sh criado');
  
  // Tornar executável no Linux/Mac
  try {
    execSync('chmod +x deploy.sh');
    console.log('✅ deploy.sh tornou-se executável');
  } catch (error) {
    console.log('⚠️ Não foi possível tornar deploy.sh executável (Windows)');
  }
  
  console.log('✅ Script de deploy criado!\n');
  return true;
}

async function main() {
  try {
    console.log('🔍 VERIFICANDO CONFIGURAÇÕES...\n');
    
    if (!createProductionConfig()) {
      console.log('❌ Configurações de produção não encontradas');
      console.log('Execute: node configurar-producao.js primeiro');
      return;
    }
    
    console.log('🏗️ INICIANDO BUILD...\n');
    
    // Build do cliente
    if (!buildClient()) {
      console.log('❌ Falha no build do cliente');
      return;
    }
    
    // Preparar servidor
    if (!buildServer()) {
      console.log('❌ Falha na preparação do servidor');
      return;
    }
    
    // Criar arquivos de produção
    if (!createProductionFiles()) {
      console.log('❌ Falha na criação dos arquivos de produção');
      return;
    }
    
    // Criar script de deploy
    if (!createDeployScript()) {
      console.log('❌ Falha na criação do script de deploy');
      return;
    }
    
    console.log('🎉 BUILD DE PRODUÇÃO CONCLUÍDO!');
    console.log('===============================');
    console.log('✅ Cliente buildado');
    console.log('✅ Servidor preparado');
    console.log('✅ Arquivos de produção criados');
    console.log('✅ Script de deploy criado');
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Verificar configurações nos arquivos .env');
    console.log('2. Executar: ./deploy.sh (Linux/Mac) ou deploy.bat (Windows)');
    console.log('3. Ou manualmente: cd server && npm start');
    
    console.log('\n🌍 ARQUIVOS CRIADOS:');
    console.log('- server/start-production.js');
    console.log('- server/package-production.json');
    console.log('- deploy.sh');
    console.log('- client/build/ (pasta do build)');
    
  } catch (error) {
    console.error('❌ Erro no build:', error.message);
  }
}

main();
