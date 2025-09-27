#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔒 Configurador de Segurança - Sistema Lojify');
console.log('=============================================\n');

const questions = [
  {
    question: 'Digite o JWT Secret (ou pressione Enter para usar o padrão): ',
    default: 'lojify-secret-key-2024',
    key: 'JWT_SECRET'
  },
  {
    question: 'Digite a porta do servidor (ou pressione Enter para 5000): ',
    default: '5000',
    key: 'PORT'
  },
  {
    question: 'Digite o domínio do frontend em produção (ou pressione Enter para pular): ',
    default: '',
    key: 'FRONTEND_URL'
  },
  {
    question: 'Nível de log (debug, info, warn, error - padrão: info): ',
    default: 'info',
    key: 'LOG_LEVEL'
  }
];

const config = {};

function askQuestion(index) {
  if (index >= questions.length) {
    createEnvFile();
    return;
  }

  const q = questions[index];
  rl.question(q.question, (answer) => {
    config[q.key] = answer.trim() || q.default;
    askQuestion(index + 1);
  });
}

function createEnvFile() {
  const envContent = `# Configurações de Segurança - Sistema Lojify
# Gerado em: ${new Date().toISOString()}

# Configurações de Segurança
JWT_SECRET=${config.JWT_SECRET}
NODE_ENV=development

# Configurações do Servidor
PORT=${config.PORT}
${config.FRONTEND_URL ? `FRONTEND_URL=${config.FRONTEND_URL}` : '# FRONTEND_URL=https://seu-dominio.com'}

# Configurações de Log
LOG_LEVEL=${config.LOG_LEVEL}

# Configurações de Banco de Dados
DB_PATH=./database/estoque.db

# Configurações de Backup
BACKUP_ENABLED=true
BACKUP_INTERVAL=0 2 * * *
BACKUP_RETENTION=7
BACKUP_LOCATION=./backups
`;

  const envPath = path.join(__dirname, 'server', '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Arquivo .env criado com sucesso!');
    console.log(`📍 Localização: ${envPath}`);
    
    // Criar diretório de backups se não existir
    const backupDir = path.join(__dirname, 'server', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('📁 Diretório de backups criado');
    }
    
    // Criar diretório de logs se não existir
    const logsDir = path.join(__dirname, 'server', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('📁 Diretório de logs criado');
    }
    
    showNextSteps();
  } catch (error) {
    console.error('❌ Erro ao criar arquivo .env:', error.message);
    rl.close();
  }
}

function showNextSteps() {
  console.log('\n🚀 Próximos Passos:');
  console.log('==================');
  console.log('');
  console.log('1. Instalar dependências:');
  console.log('   cd server && npm install');
  console.log('');
  console.log('2. Inicializar banco de dados:');
  console.log('   node -e "const { initializeDatabase } = require(\'./database/init\'); initializeDatabase().then(() => console.log(\'✅ Banco inicializado\')).catch(console.error);"');
  console.log('');
  console.log('3. Iniciar servidor:');
  console.log('   npm start');
  console.log('');
  console.log('4. Acessar o sistema:');
  console.log(`   http://localhost:${config.PORT}`);
  console.log('');
  console.log('5. Fazer login com:');
  console.log('   Email: admin@lojify.com');
  console.log('   Senha: admin123');
  console.log('   ⚠️  ALTERE AS CREDENCIAIS PADRÃO IMEDIATAMENTE!');
  console.log('');
  console.log('📚 Consulte o arquivo CONFIGURACAO_SEGURANCA.md para mais detalhes');
  console.log('');
  console.log('🔒 Sistema de segurança configurado com sucesso!');
  
  rl.close();
}

// Verificar se já existe arquivo .env
const envPath = path.join(__dirname, 'server', '.env');
if (fs.existsSync(envPath)) {
  rl.question('⚠️  Arquivo .env já existe. Deseja sobrescrever? (s/N): ', (answer) => {
    if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
      askQuestion(0);
    } else {
      console.log('❌ Configuração cancelada.');
      rl.close();
    }
  });
} else {
  askQuestion(0);
}
