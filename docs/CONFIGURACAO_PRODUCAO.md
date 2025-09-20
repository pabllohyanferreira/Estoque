# 🔧 Configuração para Produção - Lojify

## 📋 **PASSO A PASSO COMPLETO**

### 🎯 **1. CONFIGURAÇÃO DO MERCADO PAGO**

#### **1.1 Criar Conta no Mercado Pago:**
1. Acesse: https://www.mercadopago.com.br/
2. Clique em "Criar conta"
3. Preencha seus dados pessoais/empresariais
4. Confirme seu email
5. Complete a verificação de identidade

#### **1.2 Obter Credenciais de Produção:**
1. Faça login na sua conta
2. Vá em "Desenvolvedores" → "Suas integrações"
3. Clique em "Criar aplicação"
4. Preencha:
   - **Nome:** Lojify Sistema
   - **Descrição:** Sistema de vendas e pagamentos
   - **Categoria:** E-commerce
5. Após criar, você verá:
   - **Access Token** (começa com APP-)
   - **Public Key** (começa com APP-)

#### **1.3 Configurar Webhook:**
1. Na sua aplicação, vá em "Webhooks"
2. Clique em "Configurar webhooks"
3. **URL do webhook:** `https://seu-dominio.com/api/payment/webhook/card`
4. **Eventos:** Selecione "payment"
5. Salve a configuração

#### **1.4 Testar Credenciais:**
```bash
# Teste com cURL
curl -X GET "https://api.mercadopago.com/v1/payment_methods" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI"
```

---

### 💳 **2. CONFIGURAÇÃO DO PIX**

#### **2.1 Obter Chave PIX:**
1. Acesse seu banco (Itaú, Bradesco, Santander, etc.)
2. Vá em "PIX" → "Minhas chaves"
3. Crie uma nova chave PIX
4. Escolha o tipo:
   - **CPF/CNPJ** (recomendado para empresas)
   - **Email** (alternativa)
   - **Telefone** (alternativa)
   - **Chave aleatória** (mais segura)

#### **2.2 Configurar Dados da Empresa:**
```env
PIX_KEY=12345678901  # Sua chave PIX
PIX_MERCHANT_NAME=Sua Empresa Ltda
PIX_MERCHANT_CITY=São Paulo
PIX_MERCHANT_CITY_CODE=3550308  # Código IBGE da sua cidade
```

#### **2.3 Encontrar Código da Cidade (IBGE):**
1. Acesse: https://www.ibge.gov.br/explica/codigos-dos-municipios.php
2. Procure sua cidade
3. Use o código de 7 dígitos

---

### 🏦 **3. CONFIGURAÇÃO DO BOLETO**

#### **3.1 Dados Bancários:**
```env
BANK_CODE=001  # Código do banco (001 = Banco do Brasil)
BANK_AGENCY=1234  # Sua agência
BANK_ACCOUNT=12345678  # Sua conta
BANK_ACCOUNT_DIGIT=9  # Dígito da conta
```

#### **3.2 Dados da Empresa:**
```env
COMPANY_NAME=Sua Empresa Ltda
COMPANY_DOCUMENT=12345678000199  # CNPJ da empresa
COMPANY_ADDRESS=Rua da Empresa, 123
COMPANY_CITY=São Paulo
COMPANY_STATE=SP
COMPANY_ZIP_CODE=01234567
```

#### **3.3 Códigos dos Bancos:**
- **001** - Banco do Brasil
- **033** - Santander
- **104** - Caixa Econômica
- **237** - Bradesco
- **341** - Itaú
- **756** - Sicoob

---

### 🌐 **4. CONFIGURAÇÃO DO DOMÍNIO**

#### **4.1 Registrar Domínio:**
1. Escolha um provedor (Registro.br, GoDaddy, etc.)
2. Registre um domínio (ex: `minhaempresa.com.br`)
3. Configure o DNS

#### **4.2 Configurar DNS:**
```
Tipo: A
Nome: @
Valor: IP_DO_SEU_SERVIDOR

Tipo: A
Nome: www
Valor: IP_DO_SEU_SERVIDOR
```

#### **4.3 Obter Certificado SSL:**
```bash
# Com Certbot (gratuito)
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

---

### 🖥️ **5. CONFIGURAÇÃO DO SERVIDOR**

#### **5.1 Servidor Recomendado:**
- **VPS:** DigitalOcean, Linode, Vultr
- **Especificações:** 2 vCPUs, 4GB RAM, 50GB SSD
- **OS:** Ubuntu 20.04 LTS

#### **5.2 Configurar Servidor:**
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

# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y
```

---

### 📁 **6. CONFIGURAÇÃO DO PROJETO**

#### **6.1 Clonar Repositório:**
```bash
git clone https://github.com/seu-usuario/ezstock.git
cd ezstock
```

#### **6.2 Instalar Dependências:**
```bash
npm run install-all
```

#### **6.3 Build de Produção:**
```bash
npm run build
```

#### **6.4 Configurar Variáveis de Ambiente:**
```bash
# Copiar arquivo de exemplo
cp server/env.example server/.env

# Editar com suas configurações
nano server/.env
```

#### **6.5 Arquivo .env Completo:**
```env
# Configurações do Servidor
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://seu-dominio.com

# Configurações do Mercado Pago (PRODUÇÃO)
MERCADOPAGO_ACCESS_TOKEN=APP-1234567890-abcdef-1234567890abcdef-12345678
MERCADOPAGO_PUBLIC_KEY=APP-12345678-1234-1234-1234-123456789012
MERCADOPAGO_WEBHOOK_URL=https://seu-dominio.com/api/payment/webhook/card

# Configurações do PIX (PRODUÇÃO)
PIX_KEY=sua_chave_pix_real
PIX_MERCHANT_NAME=Sua Empresa Ltda
PIX_MERCHANT_CITY=Sua Cidade
PIX_MERCHANT_CITY_CODE=1234567

# Configurações do Boleto (PRODUÇÃO)
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
JWT_SECRET=seu_jwt_secret_super_seguro_de_pelo_menos_32_caracteres
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
```

---

### 🚀 **7. DEPLOY DA APLICAÇÃO**

#### **7.1 Configurar Nginx:**
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

#### **7.2 Obter Certificado SSL:**
```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

#### **7.3 Iniciar Aplicação:**
```bash
# Com PM2
pm2 start server/start.js --name ezstock
pm2 startup
pm2 save

# Verificar status
pm2 status
pm2 logs ezstock
```

---

### 🧪 **8. TESTES PÓS-DEPLOY**

#### **8.1 Teste de Health Check:**
```bash
curl https://seu-dominio.com/api/health
```

#### **8.2 Teste de PIX:**
```bash
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

#### **8.3 Teste de Cartão:**
```bash
curl -X POST https://seu-dominio.com/api/payment/process \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10.00,
    "paymentMethod": "credit_card",
    "customer": {
      "name": "Teste",
      "email": "teste@email.com",
      "document": "12345678901"
    },
    "description": "Teste cartão",
    "installments": 1
  }'
```

#### **8.4 Teste de Boleto:**
```bash
curl -X POST https://seu-dominio.com/api/payment/process \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00,
    "paymentMethod": "boleto",
    "customer": {
      "name": "Teste",
      "email": "teste@email.com",
      "document": "12345678901"
    },
    "description": "Teste boleto"
  }'
```

---

### 🔒 **9. CONFIGURAÇÕES DE SEGURANÇA**

#### **9.1 Firewall:**
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

#### **9.2 Backup Automático:**
```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-ezstock.sh

# Conteúdo:
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /path/to/ezstock/server/database/estoque.db /backup/estoque_$DATE.db
find /backup -name "estoque_*.db" -mtime +30 -delete

# Tornar executável
sudo chmod +x /usr/local/bin/backup-ezstock.sh

# Agendar no cron
sudo crontab -e
# Adicionar: 0 2 * * * /usr/local/bin/backup-ezstock.sh
```

---

### 📊 **10. MONITORAMENTO**

#### **10.1 Logs:**
```bash
# Logs da aplicação
pm2 logs ezstock

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### **10.2 Métricas:**
```bash
# Status da aplicação
pm2 status

# Monitor em tempo real
pm2 monit
```

---

### 🆘 **11. TROUBLESHOOTING**

#### **11.1 Problemas Comuns:**

**Erro 500 - Mercado Pago:**
- Verificar se os tokens são de produção
- Verificar se a webhook URL está correta

**PIX não funciona:**
- Verificar se a chave PIX está correta
- Verificar dados da empresa

**Boleto não gera:**
- Verificar dados bancários
- Verificar dados da empresa

**CORS errors:**
- Verificar CORS_ORIGINS
- Verificar FRONTEND_URL

#### **11.2 Comandos de Debug:**
```bash
# Verificar variáveis de ambiente
pm2 env ezstock

# Reiniciar aplicação
pm2 restart ezstock

# Ver logs em tempo real
pm2 logs ezstock --lines 100
```

---

### 📞 **12. SUPORTE**

#### **12.1 Em caso de problemas:**
1. Verificar logs da aplicação
2. Verificar logs do Nginx
3. Verificar variáveis de ambiente
4. Testar endpoints individualmente
5. Verificar conectividade com APIs externas

#### **12.2 Contatos úteis:**
- **Mercado Pago:** https://www.mercadopago.com.br/developers
- **PIX:** Seu banco
- **Domínio:** Seu provedor de domínio
- **Servidor:** Suporte do seu VPS

---

## 🎉 **SISTEMA PRONTO!**

Após seguir todos os passos, seu sistema estará:
- ✅ **Online e funcionando**
- ✅ **Processando pagamentos reais**
- ✅ **Pronto para receber clientes**
- ✅ **Seguro e monitorado**

**Boa sorte com suas vendas!** 🚀💰
