# 🔒 Configuração de Segurança - Sistema Lojify

## 📋 Visão Geral

Este documento descreve as configurações de segurança implementadas no sistema Lojify após a remoção das funcionalidades de pagamento.

## 🚀 Configurações Implementadas

### 1. **Autenticação e Autorização**
- **Usuário padrão:** detty@lojify.com
- **Senha padrão:** 12345
- **JWT Token:** Expira em 24 horas
- **Rate Limiting:** Máximo 5 tentativas de login por IP a cada 15 minutos

### 2. **Middleware de Segurança**
- **Helmet:** Headers de segurança HTTP
- **CORS:** Configuração restritiva de origens
- **Rate Limiting:** Proteção contra ataques de força bruta
- **Sanitização:** Limpeza de dados de entrada
- **Validação:** Detecção de padrões suspeitos

### 3. **Proteção de Dados**
- **Sanitização de Input:** Remove scripts e caracteres perigosos
- **Validação de Senha:** Requisitos mínimos de segurança
- **Logs de Segurança:** Monitoramento de tentativas suspeitas

## 🛠️ Como Configurar

### 1. **Variáveis de Ambiente**
Crie um arquivo `.env` na pasta `server/` com as seguintes variáveis:

```env
# Configurações de Segurança
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
NODE_ENV=production

# Configurações do Servidor
PORT=5000
FRONTEND_URL=https://seu-dominio.com

# Configurações de Log
LOG_LEVEL=info

# Configurações de Banco de Dados
DB_PATH=./database/estoque.db
```

### 2. **Configuração de Produção**

#### 2.1. **Servidor Web (Nginx)**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;
    
    # Certificados SSL
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Headers de Segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy para aplicação
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 2.2. **Firewall (UFW)**
```bash
# Instalar UFW
sudo apt update
sudo apt install ufw

# Configurar regras básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP e HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Ativar firewall
sudo ufw enable
```

#### 2.3. **Docker (Opcional)**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código
COPY . .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Mudar para usuário não-root
USER nodejs

EXPOSE 5000

CMD ["npm", "start"]
```

### 3. **Configuração do Sistema**

#### 3.1. **Atualizar CORS para Produção**
Edite o arquivo `server/middleware/security.js` e adicione seu domínio:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
  'http://localhost:5001',
  'https://seu-dominio.com', // Adicione seu domínio aqui
  'https://www.seu-dominio.com'
];
```

#### 3.2. **Configurar Backup Automático**
```bash
# Criar script de backup
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/lojify"
DB_PATH="/app/database/estoque.db"

mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/estoque_$DATE.db"

# Manter apenas os últimos 7 backups
cd $BACKUP_DIR
ls -t | tail -n +8 | xargs -r rm
EOF

chmod +x backup.sh

# Adicionar ao crontab
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## 🔧 Comandos de Configuração

### 1. **Instalar Dependências**
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. **Configurar Banco de Dados**
```bash
cd server
node -e "
const { initializeDatabase } = require('./database/init');
initializeDatabase().then(() => {
  console.log('✅ Banco de dados inicializado');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
"
```

### 3. **Iniciar Sistema**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📊 Monitoramento

### 1. **Logs de Segurança**
Os logs são salvos em:
- `server/logs/security.log` - Tentativas de login e atividades suspeitas
- `server/logs/access.log` - Acesso geral à API

### 2. **Métricas Importantes**
- Tentativas de login falhadas
- Requisições suspeitas
- Taxa de erro da API
- Uso de recursos do servidor

### 3. **Alertas Configurados**
- Mais de 10 tentativas de login falhadas por hora
- Mais de 5 requisições suspeitas por minuto
- Taxa de erro superior a 10%

## 🚨 Procedimentos de Emergência

### 1. **Bloquear Usuário Suspeito**
```sql
UPDATE users SET status = 'blocked' WHERE email = 'usuario@suspeito.com';
```

### 2. **Resetar Senha de Admin**
```bash
cd server
node -e "
const bcrypt = require('bcrypt');
const { db } = require('./database/init');
const newPassword = bcrypt.hashSync('nova_senha_segura', 10);
db.run('UPDATE users SET password = ? WHERE email = ?', [newPassword, 'admin@lojify.com'], (err) => {
  if (err) console.error('Erro:', err);
  else console.log('✅ Senha atualizada');
  process.exit(0);
});
"
```

### 3. **Backup de Emergência**
```bash
# Parar aplicação
pm2 stop lojify

# Fazer backup
cp database/estoque.db backups/emergency_$(date +%Y%m%d_%H%M%S).db

# Reiniciar aplicação
pm2 start lojify
```

## 📞 Suporte

Para suporte técnico:
- **Email:** pablohyan64@gmail.com
- **WhatsApp:** (81) 99620-1464

## 🔄 Atualizações de Segurança

### Checklist Mensal
- [ ] Verificar logs de segurança
- [ ] Atualizar dependências
- [ ] Revisar permissões de usuários
- [ ] Testar procedimentos de backup
- [ ] Verificar certificados SSL

### Checklist Trimestral
- [ ] Auditoria de segurança completa
- [ ] Teste de penetração
- [ ] Revisão de políticas de senha
- [ ] Atualização de documentação

---

**⚠️ IMPORTANTE:** Sempre mantenha este documento atualizado e guarde as credenciais de acesso em local seguro!
