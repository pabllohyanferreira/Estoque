const fs = require('fs');
const path = require('path');

console.log('🧪 TESTE DE CONFIGURAÇÃO - LOJIFY');
console.log('==================================\n');

const tests = [];
let passedTests = 0;
let totalTests = 0;

function test(name, condition, message) {
  totalTests++;
  const passed = condition;
  if (passed) passedTests++;
  
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}: ${message}`);
  
  tests.push({ name, passed, message });
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  test(description, exists, exists ? 'Arquivo encontrado' : 'Arquivo não encontrado');
  return exists;
}

function checkEnvFile(filePath, requiredVars, description) {
  if (!fs.existsSync(filePath)) {
    test(description, false, 'Arquivo .env não encontrado');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  let allVarsPresent = true;
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    const hasVar = lines.some(line => line.startsWith(`${varName}=`));
    if (!hasVar) {
      missingVars.push(varName);
      allVarsPresent = false;
    }
  });
  
  test(description, allVarsPresent, 
    allVarsPresent ? 'Todas as variáveis presentes' : `Variáveis faltando: ${missingVars.join(', ')}`);
  
  return allVarsPresent;
}

async function testarConfiguracao() {
  console.log('📁 VERIFICANDO ARQUIVOS DE CONFIGURAÇÃO...\n');
  
  // Verificar arquivos .env
  const serverEnvExists = checkFileExists('server/.env', 'Arquivo server/.env');
  const clientEnvExists = checkFileExists('client/.env', 'Arquivo client/.env');
  
  // Verificar arquivos de configuração
  checkFileExists('server/config/production.js', 'Arquivo server/config/production.js');
  checkFileExists('client/config/production.js', 'Arquivo client/config/production.js');
  
  console.log('\n🔧 VERIFICANDO VARIÁVEIS DE AMBIENTE...\n');
  
  // Variáveis obrigatórias do servidor
  if (serverEnvExists) {
    const serverRequiredVars = [
      'NODE_ENV',
      'PORT',
      'FRONTEND_URL',
      'MERCADOPAGO_ACCESS_TOKEN',
      'MERCADOPAGO_PUBLIC_KEY',
      'PIX_KEY',
      'PIX_MERCHANT_NAME',
      'BANK_CODE',
      'BANK_AGENCY',
      'BANK_ACCOUNT',
      'COMPANY_NAME',
      'COMPANY_DOCUMENT'
    ];
    
    checkEnvFile('server/.env', serverRequiredVars, 'Variáveis do servidor');
  }
  
  // Variáveis obrigatórias do cliente
  if (clientEnvExists) {
    const clientRequiredVars = [
      'REACT_APP_API_URL',
      'REACT_APP_APP_NAME',
      'REACT_APP_VERSION'
    ];
    
    checkEnvFile('client/.env', clientRequiredVars, 'Variáveis do cliente');
  }
  
  console.log('\n📦 VERIFICANDO DEPENDÊNCIAS...\n');
  
  // Verificar package.json
  checkFileExists('package.json', 'Arquivo package.json raiz');
  checkFileExists('server/package.json', 'Arquivo server/package.json');
  checkFileExists('client/package.json', 'Arquivo client/package.json');
  
  // Verificar node_modules
  checkFileExists('server/node_modules', 'Dependências do servidor');
  checkFileExists('client/node_modules', 'Dependências do cliente');
  
  console.log('\n🗄️ VERIFICANDO BANCO DE DADOS...\n');
  
  // Verificar banco de dados
  checkFileExists('server/database/estoque.db', 'Banco de dados SQLite');
  checkFileExists('server/database/init.js', 'Script de inicialização do banco');
  
  console.log('\n🚀 VERIFICANDO SCRIPTS DE INICIALIZAÇÃO...\n');
  
  // Verificar scripts
  checkFileExists('server/start.js', 'Script de inicialização do servidor');
  checkFileExists('start-simple.bat', 'Script de inicialização simples');
  
  console.log('\n📊 RESULTADO DOS TESTES');
  console.log('========================');
  console.log(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
  console.log(`❌ Testes falharam: ${totalTests - passedTests}/${totalTests}`);
  
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  console.log(`📈 Taxa de sucesso: ${successRate}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 CONFIGURAÇÃO PERFEITA!');
    console.log('Sistema pronto para produção!');
  } else {
    console.log('\n⚠️ CONFIGURAÇÃO INCOMPLETA');
    console.log('Verifique os itens marcados com ❌');
  }
  
  console.log('\n📋 RESUMO DOS PROBLEMAS:');
  tests.filter(t => !t.passed).forEach(t => {
    console.log(`❌ ${t.name}: ${t.message}`);
  });
  
  if (tests.filter(t => !t.passed).length === 0) {
    console.log('✅ Nenhum problema encontrado!');
  }
  
  console.log('\n🔧 COMANDOS ÚTEIS:');
  console.log('npm run install-all  # Instalar dependências');
  console.log('npm run build        # Build de produção');
  console.log('npm start            # Iniciar sistema');
  console.log('start-simple.bat     # Iniciar com interface');
}

testarConfiguracao().catch(console.error);
