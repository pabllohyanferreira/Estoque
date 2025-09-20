# ✅ Checklist de Configuração - Lojify

## 🎯 **ANTES DE COMEÇAR**

### **📋 Pré-requisitos:**
- [ ] Computador com acesso à internet
- [ ] Documentos da empresa (CNPJ, dados bancários)
- [ ] Acesso ao banco para configurar PIX
- [ ] Domínio registrado (opcional, pode usar IP temporariamente)

---

## 🌐 **1. CONFIGURAÇÃO DO DOMÍNIO**

### **1.1 Registrar Domínio:**
- [ ] Escolher provedor (Registro.br, GoDaddy, etc.)
- [ ] Registrar domínio (ex: `minhaempresa.com.br`)
- [ ] Anotar domínio: ________________

### **1.2 Configurar DNS:**
- [ ] Acessar painel do provedor de domínio
- [ ] Configurar registro A apontando para IP do servidor
- [ ] Configurar www apontando para o mesmo IP
- [ ] Aguardar propagação (até 24h)

---

## 💳 **2. CONFIGURAÇÃO DO MERCADO PAGO**

### **2.1 Criar Conta:**
- [ ] Acessar: https://www.mercadopago.com.br/
- [ ] Criar conta pessoal/empresarial
- [ ] Confirmar email
- [ ] Completar verificação de identidade

### **2.2 Criar Aplicação:**
- [ ] Ir em "Desenvolvedores" → "Suas integrações"
- [ ] Clicar em "Criar aplicação"
- [ ] Preencher:
  - Nome: Lojify Sistema
  - Descrição: Sistema de vendas e pagamentos
  - Categoria: E-commerce
- [ ] Salvar aplicação

### **2.3 Obter Credenciais:**
- [ ] Copiar Access Token (começa com APP-): ________________
- [ ] Copiar Public Key (começa com APP-): ________________

### **2.4 Configurar Webhook:**
- [ ] Ir em "Webhooks" na aplicação
- [ ] Clicar em "Configurar webhooks"
- [ ] URL: `https://seu-dominio.com/api/payment/webhook/card`
- [ ] Eventos: Selecionar "payment"
- [ ] Salvar configuração

---

## 💳 **3. CONFIGURAÇÃO DO PIX**

### **3.1 Acessar Banco:**
- [ ] Fazer login no internet banking
- [ ] Ir em "PIX" → "Minhas chaves"

### **3.2 Criar Chave PIX:**
- [ ] Clicar em "Criar nova chave"
- [ ] Escolher tipo:
  - [ ] CPF/CNPJ (recomendado para empresas)
  - [ ] Email
  - [ ] Telefone
  - [ ] Chave aleatória
- [ ] Confirmar criação
- [ ] Copiar chave PIX: ________________

### **3.3 Dados da Empresa:**
- [ ] Nome da empresa: ________________
- [ ] Cidade: ________________
- [ ] Código IBGE (7 dígitos): ________________
  - Encontrar em: https://www.ibge.gov.br/explica/codigos-dos-municipios.php

---

## 🏦 **4. CONFIGURAÇÃO DO BOLETO**

### **4.1 Dados Bancários:**
- [ ] Código do banco: ________________
  - 001 = Banco do Brasil
  - 033 = Santander
  - 104 = Caixa Econômica
  - 237 = Bradesco
  - 341 = Itaú
- [ ] Agência: ________________
- [ ] Conta: ________________
- [ ] Dígito da conta: ________________

### **4.2 Dados da Empresa:**
- [ ] Nome da empresa: ________________
- [ ] CNPJ: ________________
- [ ] Endereço completo: ________________
- [ ] Cidade: ________________
- [ ] Estado: ________________
- [ ] CEP: ________________

---

## 🖥️ **5. CONFIGURAÇÃO DO SERVIDOR**

### **5.1 Escolher VPS:**
- [ ] DigitalOcean, Linode, Vultr, etc.
- [ ] Especificações: 2 vCPUs, 4GB RAM, 50GB SSD
- [ ] OS: Ubuntu 20.04 LTS
- [ ] Anotar IP do servidor: ________________

### **5.2 Configurar Servidor:**
- [ ] Conectar via SSH
- [ ] Atualizar sistema: `sudo apt update && sudo apt upgrade -y`
- [ ] Instalar Node.js 18
- [ ] Instalar PM2: `sudo npm install -g pm2`
- [ ] Instalar Nginx: `sudo apt install nginx -y`
- [ ] Instalar Certbot: `sudo apt install certbot python3-certbot-nginx -y`

---

## 📁 **6. CONFIGURAÇÃO DO PROJETO**

### **6.1 Preparar Código:**
- [ ] Clonar repositório no servidor
- [ ] Instalar dependências: `npm run install-all`
- [ ] Fazer build: `npm run build`

### **6.2 Configurar Variáveis:**
- [ ] Copiar `server/env.example` para `server/.env`
- [ ] Editar arquivo `.env` com suas configurações
- [ ] Verificar se todas as variáveis estão preenchidas

### **6.3 Testar Localmente:**
- [ ] Iniciar servidor: `cd server && node start.js`
- [ ] Testar health check: `curl http://localhost:5000/api/health`
- [ ] Testar API de pagamentos
- [ ] Parar servidor

---

## 🚀 **7. DEPLOY**

### **7.1 Configurar Nginx:**
- [ ] Criar arquivo de configuração
- [ ] Copiar configuração para `/etc/nginx/sites-available/`
- [ ] Criar link simbólico em `/etc/nginx/sites-enabled/`
- [ ] Testar configuração: `sudo nginx -t`
- [ ] Reiniciar Nginx: `sudo systemctl restart nginx`

### **7.2 Obter SSL:**
- [ ] Executar: `sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com`
- [ ] Verificar se certificado foi instalado
- [ ] Testar acesso HTTPS

### **7.3 Iniciar Aplicação:**
- [ ] Iniciar com PM2: `pm2 start server/start.js --name ezstock`
- [ ] Configurar startup: `pm2 startup`
- [ ] Salvar configuração: `pm2 save`
- [ ] Verificar status: `pm2 status`

---

## 🧪 **8. TESTES**

### **8.1 Testes Básicos:**
- [ ] Acessar site: `https://seu-dominio.com`
- [ ] Testar health check: `https://seu-dominio.com/api/health`
- [ ] Testar métodos de pagamento: `https://seu-dominio.com/api/payment/methods`

### **8.2 Testes de Pagamento:**
- [ ] Teste PIX (valor baixo: R$ 1,00)
- [ ] Teste cartão de crédito (valor baixo: R$ 10,00)
- [ ] Teste boleto (valor baixo: R$ 50,00)
- [ ] Verificar se transações aparecem no painel

### **8.3 Testes de Funcionalidade:**
- [ ] Cadastrar produto
- [ ] Fazer venda
- [ ] Gerar relatório
- [ ] Testar catálogo público

---

## 🔒 **9. SEGURANÇA**

### **9.1 Firewall:**
- [ ] Configurar UFW: `sudo ufw allow 22,80,443`
- [ ] Ativar firewall: `sudo ufw enable`
- [ ] Verificar status: `sudo ufw status`

### **9.2 Backup:**
- [ ] Criar script de backup
- [ ] Configurar cron para backup diário
- [ ] Testar restore do backup

### **9.3 Monitoramento:**
- [ ] Configurar logs
- [ ] Configurar alertas
- [ ] Monitorar performance

---

## 📊 **10. VERIFICAÇÃO FINAL**

### **10.1 Checklist de Produção:**
- [ ] Site acessível via HTTPS
- [ ] Todos os métodos de pagamento funcionando
- [ ] Webhooks configurados
- [ ] Logs funcionando
- [ ] Backup configurado
- [ ] Monitoramento ativo

### **10.2 Teste com Cliente Real:**
- [ ] Fazer uma venda real
- [ ] Processar pagamento real
- [ ] Verificar se dinheiro chegou na conta
- [ ] Testar todo o fluxo de venda

---

## 🎉 **SISTEMA PRONTO!**

### **✅ CONFIGURAÇÃO CONCLUÍDA:**
- [ ] Domínio configurado
- [ ] SSL ativo
- [ ] APIs de pagamento funcionando
- [ ] Sistema online e acessível
- [ ] Testes realizados com sucesso

### **🚀 PRÓXIMOS PASSOS:**
- [ ] Divulgar o sistema
- [ ] Treinar usuários
- [ ] Monitorar vendas
- [ ] Expandir funcionalidades

---

## 📞 **SUPORTE**

### **Em caso de problemas:**
1. Verificar logs: `pm2 logs ezstock`
2. Verificar status: `pm2 status`
3. Verificar Nginx: `sudo systemctl status nginx`
4. Verificar SSL: `sudo certbot certificates`
5. Testar conectividade: `curl -I https://seu-dominio.com`

### **Contatos úteis:**
- **Mercado Pago:** https://www.mercadopago.com.br/developers
- **PIX:** Suporte do seu banco
- **Domínio:** Suporte do provedor
- **Servidor:** Suporte do VPS

---

**Checklist v1.0.0 - Lojify**
