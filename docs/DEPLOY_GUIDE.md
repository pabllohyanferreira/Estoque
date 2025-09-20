# 🚀 Guia de Deploy - Lojify

## 📋 Pré-requisitos

### 1. **Configurações Obrigatórias**

#### **Mercado Pago (Produção)**
- [ ] Conta Mercado Pago ativa
- [ ] Access Token de produção
- [ ] Public Key de produção
- [ ] Webhook configurado

#### **PIX (Produção)**
- [ ] Chave PIX registrada
- [ ] Dados da empresa atualizados
- [ ] Código da cidade (IBGE)

#### **Boleto (Produção)**
- [ ] Conta bancária ativa
- [ ] Dados bancários completos
- [ ] Dados da empresa atualizados

### 2. **Domínio e SSL**
- [ ] Domínio registrado
- [ ] Certificado SSL configurado
- [ ] DNS configurado

## 🌐 Opções de Deploy

### **Opção 1: VPS/Cloud (Recomendado)**

#### **Servidor Recomendado:**
- **CPU:** 2 vCPUs
- **RAM:** 4GB
- **Storage:** 50GB SSD
- **OS:** Ubuntu 20.04+ ou CentOS 8+

#### **Passos:**

1. **Preparar Servidor:**
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt install nginx -y

# Instalar Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y
```

2. **Configurar Nginx:**
```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/ezstock

# Conteúdo:
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
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

# Ativar site
sudo ln -s /etc/nginx/sites-available/ezstock /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

3. **Configurar SSL:**
```bash
# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

4. **Deploy da Aplicação:**
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/ezstock.git
cd ezstock

# Instalar dependências
npm install
cd server && npm install
cd ../client && npm install

# Build do cliente
cd ../client && npm run build

# Configurar variáveis de ambiente
cp server/env.example server/.env
nano server/.env

# Iniciar com PM2
pm2 start server/start.js --name ezstock
pm2 startup
pm2 save
```

### **Opção 2: Heroku**

#### **Passos:**

1. **Preparar Aplicação:**
```bash
# Instalar Heroku CLI
# Criar Procfile
echo "web: cd server && node start.js" > Procfile

# Configurar buildpacks
heroku buildpacks:set heroku/nodejs
```

2. **Deploy:**
```bash
# Login no Heroku
heroku login

# Criar app
heroku create ezstock-prod

# Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set MERCADOPAGO_ACCESS_TOKEN=seu_token
heroku config:set PIX_KEY=sua_chave_pix
# ... outras variáveis

# Deploy
git push heroku main
```

### **Opção 3: DigitalOcean App Platform**

#### **Passos:**

1. **Preparar Aplicação:**
```yaml
# .do/app.yaml
name: ezstock
services:
- name: api
  source_dir: server
  github:
    repo: seu-usuario/ezstock
    branch: main
  run_command: node start.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: MERCADOPAGO_ACCESS_TOKEN
    value: ${MERCADOPAGO_ACCESS_TOKEN}
    type: SECRET
  - key: PIX_KEY
    value: ${PIX_KEY}
    type: SECRET
  # ... outras variáveis
```

2. **Deploy:**
```bash
# Instalar doctl
# Configurar token
doctl auth init

# Deploy
doctl apps create --spec .do/app.yaml
```

## 🔧 Configurações de Produção

### **Variáveis de Ambiente Obrigatórias:**

```env
# Servidor
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://seu-dominio.com

# Mercado Pago (PRODUÇÃO)
MERCADOPAGO_ACCESS_TOKEN=APP-1234567890-abcdef-1234567890abcdef-12345678
MERCADOPAGO_PUBLIC_KEY=APP-12345678-1234-1234-1234-123456789012
MERCADOPAGO_WEBHOOK_URL=https://seu-dominio.com/api/payment/webhook/card

# PIX (PRODUÇÃO)
PIX_KEY=sua_chave_pix_real
PIX_MERCHANT_NAME=Sua Empresa Ltda
PIX_MERCHANT_CITY=Sua Cidade
PIX_MERCHANT_CITY_CODE=1234567

# Boleto (PRODUÇÃO)
BANK_CODE=001
BANK_AGENCY=1234
BANK_ACCOUNT=12345678
BANK_ACCOUNT_DIGIT=9
COMPANY_NAME=Sua Empresa Ltda
COMPANY_DOCUMENT=12345678000199
COMPANY_ADDRESS=Rua da Empresa, 123
COMPANY_CITY=Sua Cidade
COMPANY_STATE=SP
COMPANY_ZIP_CODE=01234567

# Segurança
JWT_SECRET=seu_jwt_secret_super_seguro
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
```

## 🔒 Configurações de Segurança

### **1. Firewall:**
```bash
# UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### **2. Rate Limiting:**
```javascript
// Já implementado no código
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});
```

### **3. Headers de Segurança:**
```javascript
// Já implementado no código
app.use(helmet());
```

## 📊 Monitoramento

### **1. Logs:**
```bash
# PM2 logs
pm2 logs ezstock

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **2. Métricas:**
```bash
# PM2 monitor
pm2 monit

# Status da aplicação
pm2 status
```

### **3. Backup:**
```bash
# Backup do banco
cp server/database/estoque.db backup/estoque-$(date +%Y%m%d).db

# Backup automático (cron)
0 2 * * * /path/to/backup-script.sh
```

## 🧪 Testes Pós-Deploy

### **1. Health Check:**
```bash
curl https://seu-dominio.com/api/health
```

### **2. Teste de Pagamentos:**
```bash
# Teste PIX
curl -X POST https://seu-dominio.com/api/payment/process \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1.00,
    "paymentMethod": "pix",
    "customer": {
      "name": "Teste",
      "email": "teste@email.com",
      "document": "12345678901"
    },
    "description": "Teste de deploy"
  }'
```

### **3. Teste de Métodos:**
```bash
curl https://seu-dominio.com/api/payment/methods
```

## 🆘 Troubleshooting

### **Problemas Comuns:**

1. **Erro 500 - Mercado Pago:**
   - Verificar tokens de produção
   - Verificar webhook URL

2. **PIX não funciona:**
   - Verificar chave PIX
   - Verificar dados da empresa

3. **Boleto não gera:**
   - Verificar dados bancários
   - Verificar dados da empresa

4. **CORS errors:**
   - Verificar CORS_ORIGINS
   - Verificar FRONTEND_URL

### **Logs de Debug:**
```bash
# Logs detalhados
NODE_ENV=development pm2 restart ezstock
pm2 logs ezstock --lines 100
```

## 📞 Suporte

Para problemas de deploy:
1. Verificar logs da aplicação
2. Verificar logs do Nginx
3. Verificar variáveis de ambiente
4. Testar endpoints individualmente
5. Verificar conectividade com APIs externas

---

**Deploy Guide v1.0.0 - Lojify**
