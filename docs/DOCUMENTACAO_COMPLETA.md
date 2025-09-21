# 📚 Documentação Completa - Lojify

## 🏪 Sistema de Gerenciamento de Estoque

Sistema completo de gerenciamento de estoque com funcionalidades avançadas de vendas, clientes, contas a pagar/receber e links de pagamento.

---

## 📋 Índice

1. [🚀 Funcionalidades](#-funcionalidades)
2. [🛠️ Tecnologias](#️-tecnologias)
3. [💳 API de Pagamentos](#-api-de-pagamentos)
4. [🔧 Configuração para Produção](#-configuração-para-produção)
5. [✅ Checklist de Configuração](#-checklist-de-configuração)
6. [🚀 Guia de Deploy](#-guia-de-deploy)
7. [📊 Status do Projeto](#-status-do-projeto)
8. [🎯 Resumo de Configuração](#-resumo-de-configuração)

---

## 🚀 Funcionalidades

### 📦 Gestão de Produtos
- ✅ Cadastro de produtos com imagens
- ✅ Controle de estoque em tempo real
- ✅ Categorização de produtos
- ✅ Código de barras
- ✅ Alertas de estoque baixo

### 👥 Gestão de Clientes
- ✅ Cadastro completo de clientes
- ✅ Suporte a pessoa física e jurídica
- ✅ Histórico de compras

### 💰 Gestão Financeira
- ✅ Contas a pagar
- ✅ Contas a receber
- ✅ Relatórios financeiros

### 🛒 Sistema de Vendas
- ✅ Criação de vendas
- ✅ Múltiplos métodos de pagamento
- ✅ Parcelamento de vendas

### 💳 Sistema de Pagamentos
- ✅ **PIX** - QR Code e código copia e cola

### 🌐 Catálogo Público
- ✅ Interface para consumidores finais
- ✅ Carrinho de compras
- ✅ Lista de desejos
- ✅ Página de checkout completa

---

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** - Banco de dados
- **Mercado Pago** - Gateway de pagamento

### Frontend
- **React.js** - Biblioteca de interface
- **Tailwind CSS** - Framework CSS
- **React Router** - Roteamento
- **Axios** - Cliente HTTP

---

## 💳 API de Pagamentos

### Endpoints Principais

#### 1. Processar Pagamento
```http
POST /api/payment/process
```
**Body:**
```json
{
  "amount": 100.00,
  "paymentMethod": "pix",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "document": "12345678901"
  },
  "description": "Descrição do pagamento"
}
```

#### 2. Verificar Status
```http
GET /api/payment/status/:paymentId
```

#### 3. Obter Métodos
```http
GET /api/payment/methods
```

### Configuração de Pagamentos

#### Mercado Pago
```env
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
MERCADOPAGO_PUBLIC_KEY=sua_chave_publica_aqui
MERCADOPAGO_WEBHOOK_URL=https://seu-dominio.com/api/payment/webhook/card
```

#### PIX
```env
PIX_KEY=sua_chave_pix_aqui
PIX_MERCHANT_NAME=Lojify
PIX_MERCHANT_CITY=São Paulo
```


---

## 🔧 Configuração para Produção

### 1. Configuração do Mercado Pago
1. Acesse: https://www.mercadopago.com.br/
2. Crie uma aplicação
3. Obtenha Access Token e Public Key
4. Configure webhook

### 2. Configuração do PIX
1. Acesse seu banco
2. Crie uma chave PIX
3. Configure dados da empresa


### 3. Configuração do Servidor
```bash
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

### 4. Arquivo .env Completo
```env
# Servidor
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://seu-dominio.com

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP-1234567890-abcdef
MERCADOPAGO_PUBLIC_KEY=APP-12345678-1234-1234
MERCADOPAGO_WEBHOOK_URL=https://seu-dominio.com/api/payment/webhook/card

# PIX
PIX_KEY=sua_chave_pix_real
PIX_MERCHANT_NAME=Sua Empresa Ltda
PIX_MERCHANT_CITY=Sua Cidade

```

---

## ✅ Checklist de Configuração

### Pré-requisitos
- [ ] Computador com acesso à internet
- [ ] Documentos da empresa (CNPJ, dados bancários)
- [ ] Acesso ao banco para configurar PIX
- [ ] Domínio registrado

### Configurações Obrigatórias
- [ ] **Mercado Pago:** Conta + Access Token + Public Key
- [ ] **PIX:** Chave PIX + Dados da empresa
- [ ] **Domínio:** Registrado + DNS configurado
- [ ] **Servidor:** VPS configurado + SSL

### Pós-Deploy
- [ ] Teste de todos os endpoints
- [ ] Teste de pagamentos
- [ ] Verificação de logs
- [ ] Monitoramento ativo
- [ ] Backup configurado

---

## 🚀 Guia de Deploy

### Opções de Deploy

#### Opção 1: VPS/Cloud (Recomendado)
**Servidor:** 2 vCPUs, 4GB RAM, 50GB SSD, Ubuntu 20.04+

**Passos:**
1. Preparar servidor
2. Configurar Nginx
3. Configurar SSL
4. Deploy da aplicação

#### Opção 2: Heroku
```bash
heroku create lojify-prod
heroku config:set NODE_ENV=production
git push heroku main
```

#### Opção 3: DigitalOcean App Platform
```yaml
name: lojify
services:
- name: api
  source_dir: server
  run_command: node start.js
```

### Configurações de Segurança
```bash
# Firewall
sudo ufw allow 22,80,443
sudo ufw enable

# Rate Limiting (já implementado)
# Headers de Segurança (já implementado)
```

### Testes Pós-Deploy
```bash
# Health Check
curl https://seu-dominio.com/api/health

# Teste PIX
curl -X POST https://seu-dominio.com/api/payment/process \
  -H "Content-Type: application/json" \
  -d '{"amount":1.00,"paymentMethod":"pix","customer":{"name":"Teste","email":"teste@email.com","document":"12345678901"},"description":"Teste"}'
```

---

## 📊 Status do Projeto

### ✅ PROJETO PRONTO PARA DEPLOY!

#### Funcionalidades Implementadas
- ✅ Sistema de estoque completo
- ✅ Sistema de pagamentos robusto (PIX)
- ✅ Interface moderna e responsiva
- ✅ Segurança implementada
- ✅ Documentação completa

#### Checklist de Deploy
- [x] Código funcional e testado
- [x] Banco de dados estruturado
- [x] APIs funcionando
- [x] Sistema de pagamentos integrado
- [x] Configurações de segurança
- [x] Documentação completa

#### Métricas do Projeto
- **Backend:** ~15 arquivos, ~2000 linhas
- **Frontend:** ~25 arquivos, ~3000 linhas
- **APIs:** 50+ endpoints
- **Páginas:** 10+ páginas
- **Integrações:** PIX

### 🎉 CONCLUSÃO
**✅ PROJETO 100% FUNCIONAL E PRONTO PARA PRODUÇÃO!**

---

## 🎯 Resumo de Configuração

### Opções de Configuração

#### 1. Configuração Automática (Recomendado)
```bash
npm run config
```
- ✅ Configuração interativa
- ✅ Cria arquivos automaticamente
- ✅ Valida configurações

#### 2. Configuração Manual
- ✅ Seguir checklist passo a passo
- ✅ Configurar cada serviço individualmente

### Testar Configuração
```bash
npm run test:config
```

### Checklist Rápido
- [ ] Mercado Pago configurado
- [ ] PIX configurado
- [ ] Domínio configurado
- [ ] Servidor configurado

### Serviços a Configurar
1. **Mercado Pago** (10 min) - https://www.mercadopago.com.br/developers
2. **PIX** (5 min) - Internet banking
3. **Domínio** (15 min) - Provedor de domínio
4. **Servidor** (20 min) - VPS

### Deploy
```bash
# Build de produção
npm run build

# Deploy no servidor
# Seguir DEPLOY_GUIDE.md

# Configurar SSL
sudo certbot --nginx -d seu-dominio.com

# Iniciar aplicação
pm2 start server/start.js --name lojify
```

### Resultado Final
Após configurar, você terá:
- ✅ Sistema online em https://seu-dominio.com
- ✅ Pagamentos funcionando (PIX)
- ✅ Clientes podem comprar via catálogo público
- ✅ Sistema seguro e monitorado

---

## 📞 Suporte

### Em caso de problemas
1. Verificar logs: `pm2 logs lojify`
2. Testar configuração: `npm run test:config`
3. Verificar variáveis: `cat server/.env`
4. Consultar documentação

### Contatos úteis
- **Mercado Pago:** https://www.mercadopago.com.br/developers
- **PIX:** Suporte do seu banco
- **Domínio:** Suporte do provedor
- **Servidor:** Suporte do VPS

---

## 🎉 Sistema Pronto!

**O sistema Lojify está completamente implementado e pronto para produção!**

Seus clientes poderão:
- ✅ Gerenciar estoque
- ✅ Processar vendas
- ✅ Receber pagamentos via PIX
- ✅ Acessar relatórios
- ✅ Usar o catálogo público

**Boa sorte com suas vendas!** 🚀💰

---

**Documentação Consolidada - Lojify v1.0.0**
*Atualizada em: $(date)*
