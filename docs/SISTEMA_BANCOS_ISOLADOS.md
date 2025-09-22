# 🗄️ Sistema de Bancos de Dados Isolados por Usuário

## 📋 **Visão Geral**

O sistema agora implementa **bancos de dados completamente isolados** para cada usuário/revendedor. Isso significa que:

- ✅ **Cada conta tem seu próprio banco de dados**
- ✅ **Produtos de uma conta não aparecem em outra**
- ✅ **Clientes são isolados por usuário**
- ✅ **Contas a pagar/receber são individuais**
- ✅ **Estoque é independente por revendedor**

## 🏗️ **Arquitetura do Sistema**

### **Estrutura de Arquivos**
```
server/database/
├── estoque.db                    # Banco principal (apenas usuários)
├── user_databases/              # Diretório dos bancos individuais
│   ├── user_1.db               # Banco do usuário ID 1
│   ├── user_2.db               # Banco do usuário ID 2
│   └── user_N.db               # Banco do usuário ID N
├── init.js                      # Inicialização do banco principal
└── databaseManager.js           # Gerenciador de bancos isolados
```

### **Banco Principal (estoque.db)**
- **Tabela `users`**: Informações dos usuários/revendedores
- **Autenticação**: Login, senhas, roles
- **Configurações**: Mercado Pago, PIX, etc.

### **Bancos Individuais (user_N.db)**
- **Tabela `items`**: Produtos do usuário
- **Tabela `clients`**: Clientes do usuário
- **Tabela `accounts_payable`**: Contas a pagar
- **Tabela `accounts_receivable`**: Contas a receber
- **Tabela `stock_movements`**: Movimentações de estoque
- **Tabela `sales`**: Vendas
- **Tabela `sale_items`**: Itens das vendas
- **Tabela `payment_links`**: Links de pagamento
- **Tabela `payment_transactions`**: Transações

## 🔧 **Como Funciona**

### **1. Autenticação**
```javascript
// Usuário faz login
POST /api/auth/login
{
  "email": "revendedor@email.com",
  "password": "senha123"
}

// Sistema retorna JWT com userId
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "João Revendedor",
    "role": "reseller"
  }
}
```

### **2. Middleware de Banco de Dados**
```javascript
// middleware/userDatabase.js
const getUserDatabase = (req, res, next) => {
  // Extrai userId do JWT
  const decoded = jwt.verify(token, JWT_SECRET);
  req.userId = decoded.userId;
  
  // Obtém banco específico do usuário
  req.userDb = databaseManager.getUserDatabase(decoded.userId);
  
  next();
};
```

### **3. Rotas Protegidas**
```javascript
// Todas as rotas agora usam o middleware
router.get('/items', getUserDatabase, (req, res) => {
  // req.userDb aponta para o banco específico do usuário
  req.userDb.all('SELECT * FROM items', (err, rows) => {
    // Retorna apenas produtos do usuário logado
    res.json(rows);
  });
});
```

## 🚀 **Vantagens do Sistema**

### **✅ Isolamento Completo**
- Cada revendedor vê apenas seus próprios dados
- Impossível acessar dados de outros usuários
- Segurança máxima de informações

### **✅ Performance**
- Bancos menores e mais rápidos
- Consultas mais eficientes
- Cache de conexões por usuário

### **✅ Escalabilidade**
- Fácil backup individual
- Possibilidade de migração por usuário
- Suporte a milhares de revendedores

### **✅ Manutenção**
- Problemas isolados por usuário
- Atualizações independentes
- Debugging mais fácil

## 📊 **Exemplo Prático**

### **Cenário: Dois Revendedores**

**Revendedor A (ID: 1)**
- Produto: "Smartphone Samsung" - R$ 1.200
- Cliente: "Maria Silva"
- Estoque: 5 unidades

**Revendedor B (ID: 2)**
- Produto: "Notebook Dell" - R$ 2.500
- Cliente: "João Santos"
- Estoque: 3 unidades

### **Resultado:**
- ✅ Revendedor A **NÃO** vê o notebook Dell
- ✅ Revendedor B **NÃO** vê o smartphone Samsung
- ✅ Cada um tem seus próprios clientes
- ✅ Estoque é completamente independente

## 🔒 **Segurança**

### **Proteção por Camadas**
1. **JWT Token**: Verificação de autenticação
2. **Middleware**: Extração do userId
3. **Database Manager**: Conexão com banco específico
4. **Isolamento**: Impossível acessar outros bancos

### **Validações**
- Token válido obrigatório
- userId extraído do token
- Banco específico por usuário
- Sem acesso cruzado entre contas

## 🛠️ **Implementação Técnica**

### **DatabaseManager**
```javascript
class DatabaseManager {
  getUserDatabase(userId) {
    const dbKey = `user_${userId}`;
    
    if (!this.databases.has(dbKey)) {
      const userDbPath = `user_databases/user_${userId}.db`;
      const db = new sqlite3.Database(userDbPath);
      
      // Criar tabelas se não existirem
      this.createUserTables(db);
      
      this.databases.set(dbKey, db);
    }
    
    return this.databases.get(dbKey);
  }
}
```

### **Middleware de Autenticação**
```javascript
const getUserDatabase = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  
  req.userId = decoded.userId;
  req.userDb = databaseManager.getUserDatabase(decoded.userId);
  
  next();
};
```

## 📈 **Monitoramento**

### **Logs do Sistema**
```
✅ Banco de dados do usuário 1 criado/verificada
✅ Banco de dados do usuário 2 criado/verificada
✅ Conexão com banco user_1.db estabelecida
✅ Conexão com banco user_2.db estabelecida
```

### **Métricas**
- Número de bancos ativos
- Conexões por usuário
- Tamanho dos bancos
- Performance por usuário

## 🎯 **Próximos Passos**

1. **Backup Automático**: Sistema de backup por usuário
2. **Migração**: Ferramentas para migrar dados
3. **Monitoramento**: Dashboard de uso por usuário
4. **Otimização**: Índices específicos por banco

---

## ✅ **Status: IMPLEMENTADO**

O sistema de bancos isolados está **100% funcional** e garante que cada revendedor tenha seus dados completamente separados e seguros.
