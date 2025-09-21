const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🏭 CONFIGURAÇÃO DE PRODUÇÃO - LOJIFY');
console.log('=====================================\n');

const configs = {
  server: {
    env: {},
    production: {}
  },
  client: {
    env: {},
    production: {}
  }
};

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configurarServidor() {
  console.log('📡 CONFIGURAÇÃO DO SERVIDOR');
  console.log('----------------------------');
  
  configs.server.env.NODE_ENV = await question('Ambiente (production/development): ') || 'production';
  configs.server.env.PORT = await question('Porta do servidor (5000): ') || '5000';
  configs.server.env.FRONTEND_URL = await question('URL do frontend (https://seudominio.com): ') || 'https://seudominio.com';
  
  console.log('\n💳 MERCADO PAGO');
  configs.server.env.MERCADOPAGO_ACCESS_TOKEN = await question('Access Token do Mercado Pago: ');
  configs.server.env.MERCADOPAGO_PUBLIC_KEY = await question('Public Key do Mercado Pago: ');
  configs.server.env.MERCADOPAGO_WEBHOOK_URL = await question('Webhook URL: ') || 'https://seudominio.com/api/payment/webhook/card';
  
  console.log('\n💰 PIX');
  configs.server.env.PIX_KEY = await question('Chave PIX: ');
  configs.server.env.PIX_MERCHANT_NAME = await question('Nome do comerciante (Lojify): ') || 'Lojify';
  configs.server.env.PIX_MERCHANT_CITY = await question('Cidade: ') || 'São Paulo';
  configs.server.env.PIX_MERCHANT_CITY_CODE = await question('Código da cidade (3550308): ') || '3550308';
  
}

async function configurarCliente() {
  console.log('\n🌐 CONFIGURAÇÃO DO CLIENTE');
  console.log('----------------------------');
  
  configs.client.env.REACT_APP_API_URL = await question('URL da API (https://seudominio.com/api): ') || 'https://seudominio.com/api';
  configs.client.env.REACT_APP_APP_NAME = 'Lojify';
  configs.client.env.REACT_APP_VERSION = '1.0.0';
  configs.client.env.GENERATE_SOURCEMAP = 'false';
  configs.client.env.INLINE_RUNTIME_CHUNK = 'false';
}

async function salvarConfiguracoes() {
  console.log('\n💾 SALVANDO CONFIGURAÇÕES...');
  
  // Servidor .env
  const serverEnvContent = Object.entries(configs.server.env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync('server/.env', serverEnvContent);
  console.log('✅ server/.env criado');
  
  // Cliente .env
  const clientEnvContent = Object.entries(configs.client.env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync('client/.env', clientEnvContent);
  console.log('✅ client/.env criado');
  
  // Configuração de produção do servidor
  const serverProdConfig = {
    port: configs.server.env.PORT,
    cors: {
      origin: configs.server.env.FRONTEND_URL,
      credentials: true
    },
    mercadoPago: {
      accessToken: configs.server.env.MERCADOPAGO_ACCESS_TOKEN,
      publicKey: configs.server.env.MERCADOPAGO_PUBLIC_KEY,
      webhookUrl: configs.server.env.MERCADOPAGO_WEBHOOK_URL
    },
    pix: {
      key: configs.server.env.PIX_KEY,
      merchantName: configs.server.env.PIX_MERCHANT_NAME,
      merchantCity: configs.server.env.PIX_MERCHANT_CITY,
      merchantCityCode: configs.server.env.PIX_MERCHANT_CITY_CODE
    },
  };
  
  fs.writeFileSync('server/config/production.js', `module.exports = ${JSON.stringify(serverProdConfig, null, 2)};`);
  console.log('✅ server/config/production.js criado');
  
  // Configuração de produção do cliente
  const clientProdConfig = {
    apiUrl: configs.client.env.REACT_APP_API_URL,
    appName: configs.client.env.REACT_APP_APP_NAME,
    version: configs.client.env.REACT_APP_VERSION,
    build: {
      generateSourcemap: false,
      inlineRuntimeChunk: false
    }
  };
  
  fs.writeFileSync('client/config/production.js', `module.exports = ${JSON.stringify(clientProdConfig, null, 2)};`);
  console.log('✅ client/config/production.js criado');
}

async function main() {
  try {
    await configurarServidor();
    await configurarCliente();
    await salvarConfiguracoes();
    
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!');
    console.log('==========================');
    console.log('✅ Arquivos criados:');
    console.log('   - server/.env');
    console.log('   - client/.env');
    console.log('   - server/config/production.js');
    console.log('   - client/config/production.js');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Verificar configurações nos arquivos .env');
    console.log('2. Executar: npm run test:config');
    console.log('3. Fazer build: npm run build');
    console.log('4. Deploy do sistema');
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
  } finally {
    rl.close();
  }
}

main();
