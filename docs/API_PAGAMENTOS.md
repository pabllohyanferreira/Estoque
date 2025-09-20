# 💳 API de Pagamentos - Lojify

## 📋 Visão Geral

A API de pagamentos do Lojify oferece suporte completo para processamento de pagamentos via:
- **PIX** - Pagamento instantâneo
- **Cartão de Crédito** - Com parcelamento
- **Cartão de Débito** - Pagamento à vista
- **Boleto Bancário** - Pagamento tradicional

## 🚀 Endpoints Disponíveis

### 1. **Processar Pagamento**
```http
POST /api/payment/process
```

**Body:**
```json
{
  "amount": 100.00,
  "paymentMethod": "pix|credit_card|debit_card|boleto",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "document": "12345678901"
  },
  "description": "Descrição do pagamento",
  "installments": 3,
  "dueDate": "2024-01-15T00:00:00.000Z"
}
```

**Resposta:**
```json
{
  "success": true,
  "transactionId": 1,
  "payment": {
    "paymentId": "uuid-gerado",
    "amount": "R$ 100,00",
    "paymentMethod": "pix",
    "qrCode": "data:image/png;base64...",
    "pixCode": "00020126580014...",
    "expiresAt": "2024-01-15T00:30:00.000Z",
    "status": "pending"
  }
}
```

### 2. **Verificar Status do Pagamento**
```http
GET /api/payment/status/:paymentId?paymentMethod=pix
```

**Resposta:**
```json
{
  "success": true,
  "paymentId": "uuid-gerado",
  "status": "paid|pending|expired|cancelled",
  "checkedAt": "2024-01-15T10:30:00.000Z"
}
```

### 3. **Obter Métodos de Pagamento**
```http
GET /api/payment/methods
```

**Resposta:**
```json
{
  "success": true,
  "methods": {
    "pix": {
      "name": "PIX",
      "description": "Pagamento instantâneo via PIX",
      "fees": "1%",
      "processingTime": "Instantâneo"
    },
    "credit_card": {
      "name": "Cartão de Crédito",
      "description": "Pagamento com cartão de crédito",
      "fees": "3.5%",
      "processingTime": "Imediato"
    }
  }
}
```

### 4. **Gerar PDF do Boleto**
```http
GET /api/payment/boleto/:paymentId/pdf
```

**Resposta:**
```json
{
  "success": true,
  "pdf": {
    "pdfUrl": "https://api.ezstock.com/boletos/uuid/pdf",
    "message": "PDF do boleto gerado com sucesso"
  }
}
```

### 5. **Obter Transações**
```http
GET /api/payment/transactions?page=1&limit=10&status=paid&paymentMethod=pix
```

**Resposta:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "payment_id": "uuid-gerado",
      "payment_method": "pix",
      "amount": 100.00,
      "customer_name": "João Silva",
      "status": "paid",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 6. **Obter Estatísticas**
```http
GET /api/payment/stats?period=30
```

**Resposta:**
```json
{
  "success": true,
  "period": "30 dias",
  "stats": {
    "byMethod": {
      "pix": {
        "transactions": 15,
        "amount": 1500.00
      },
      "credit_card": {
        "transactions": 8,
        "amount": 2000.00
      }
    },
    "byStatus": {
      "paid": {
        "transactions": 20,
        "amount": 3000.00
      },
      "pending": {
        "transactions": 3,
        "amount": 500.00
      }
    },
    "total": {
      "transactions": 23,
      "amount": 3500.00
    }
  }
}
```

### 7. **Webhook para Cartões**
```http
POST /api/payment/webhook/card
```

**Body:**
```json
{
  "type": "payment",
  "data": {
    "id": "123456789"
  }
}
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` no diretório `server/` com as seguintes configurações:

```env
# Servidor
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
MERCADOPAGO_PUBLIC_KEY=sua_chave_publica_aqui
MERCADOPAGO_WEBHOOK_URL=http://localhost:5000/api/payment/webhook/card

# PIX
PIX_KEY=sua_chave_pix_aqui
PIX_MERCHANT_NAME=Lojify
PIX_MERCHANT_CITY=São Paulo

# Boleto
BANK_CODE=001
BANK_AGENCY=1234
BANK_ACCOUNT=12345678
COMPANY_NAME=Lojify Ltda
COMPANY_DOCUMENT=12345678000199
```

## 📊 Códigos de Status

### Status de Pagamento
- `pending` - Aguardando pagamento
- `paid` - Pago com sucesso
- `expired` - Expirado
- `cancelled` - Cancelado
- `rejected` - Rejeitado

### Métodos de Pagamento
- `pix` - PIX
- `credit_card` - Cartão de Crédito
- `debit_card` - Cartão de Débito
- `boleto` - Boleto Bancário

## 🧪 Testando a API

### 1. Iniciar o Servidor
```bash
cd server
npm install
node start.js
```

### 2. Executar Testes
```bash
node test-payment-api.js
```

### 3. Teste Manual com cURL

**PIX:**
```bash
curl -X POST http://localhost:5000/api/payment/process \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "paymentMethod": "pix",
    "customer": {
      "name": "João Silva",
      "email": "joao@email.com",
      "document": "12345678901"
    },
    "description": "Teste PIX"
  }'
```

**Cartão:**
```bash
curl -X POST http://localhost:5000/api/payment/process \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250.00,
    "paymentMethod": "credit_card",
    "customer": {
      "name": "Maria Santos",
      "email": "maria@email.com",
      "document": "98765432100"
    },
    "description": "Teste Cartão",
    "installments": 3
  }'
```

**Boleto:**
```bash
curl -X POST http://localhost:5000/api/payment/process \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500.00,
    "paymentMethod": "boleto",
    "customer": {
      "name": "Pedro Costa",
      "email": "pedro@email.com",
      "document": "11122233344"
    },
    "description": "Teste Boleto"
  }'
```

## 🔒 Segurança

- Todas as transações são validadas
- Dados sensíveis são criptografados
- Webhooks são verificados
- Logs detalhados para auditoria

## 📈 Monitoramento

- Logs estruturados com emojis
- Métricas de performance
- Alertas de erro
- Dashboard de estatísticas

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Consulte a documentação
3. Execute os testes automatizados
4. Entre em contato com o suporte

---

**API de Pagamentos Lojify v1.0.0**
