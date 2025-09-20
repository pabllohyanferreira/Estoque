# 🏪 Lojify - Sistema de Gerenciamento de Estoque

Sistema completo de gerenciamento de estoque com funcionalidades avançadas de vendas, clientes, contas a pagar/receber e links de pagamento.

## 🚀 Funcionalidades

### 📦 Gestão de Produtos
- ✅ Cadastro de produtos com imagens
- ✅ Controle de estoque em tempo real
- ✅ Categorização de produtos
- ✅ Código de barras
- ✅ Parcelamento de produtos
- ✅ Alertas de estoque baixo

### 👥 Gestão de Clientes
- ✅ Cadastro completo de clientes
- ✅ Suporte a pessoa física e jurídica
- ✅ Histórico de compras
- ✅ Dados de contato

### 💰 Gestão Financeira
- ✅ Contas a pagar
- ✅ Contas a receber
- ✅ Relatórios financeiros
- ✅ Controle de parcelamentos

### 🛒 Sistema de Vendas
- ✅ Criação de vendas
- ✅ Múltiplos métodos de pagamento
- ✅ Parcelamento de vendas
- ✅ Histórico completo

### 💳 Links de Pagamento
- ✅ Geração de links PIX
- ✅ Links para cartão de crédito/débito
- ✅ Integração com Mercado Pago
- ✅ QR Codes para PIX
- ✅ Controle de expiração

### 🌐 Catálogo Público
- ✅ Interface para consumidores finais
- ✅ Carrinho de compras
- ✅ Lista de desejos
- ✅ Filtros e busca avançada
- ✅ Página de checkout completa

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** - Banco de dados
- **Mercado Pago** - Gateway de pagamento
- **Multer** - Upload de arquivos
- **Express Validator** - Validação de dados

### Frontend
- **React.js** - Biblioteca de interface
- **React Router** - Roteamento
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Ícones
- **React Hot Toast** - Notificações
- **Axios** - Cliente HTTP

## 📋 Pré-requisitos

- Node.js 16+ 
- npm 8+
- Git

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd estoque
```

### 2. Instale as dependências
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp server/config.example.js server/.env

# Edite as configurações conforme necessário
```

### 4. Execute o sistema

#### Opção 1: Executar tudo de uma vez
```bash
node start-system.js
```

#### Opção 2: Executar separadamente
```bash
# Terminal 1 - Backend
cd server
node start.js

# Terminal 2 - Frontend
cd client
npm start
```

## 🌐 Acessos

- **Sistema Principal**: http://localhost:3000
- **Catálogo Público**: http://localhost:3000/public
- **API Backend**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- `items` - Produtos/Itens
- `clients` - Clientes
- `sales` - Vendas
- `sale_items` - Itens das vendas
- `payment_links` - Links de pagamento
- `payment_transactions` - Transações de pagamento
- `accounts_payable` - Contas a pagar
- `accounts_receivable` - Contas a receber
- `stock_movements` - Movimentações de estoque

## 🔧 Configuração do Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Obtenha suas credenciais
4. Configure no arquivo `.env`:
```env
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
MERCADOPAGO_PUBLIC_KEY=sua_chave_publica_aqui
```

## 📱 Funcionalidades do Catálogo Público

### Para Consumidores
- 🔍 Busca avançada de produtos
- 🏷️ Filtros por categoria e preço
- 🛒 Carrinho de compras
- ❤️ Lista de desejos
- 📱 Interface responsiva
- 💳 Checkout completo com PIX e cartão

### Para Vendedores
- 📊 Dashboard com estatísticas
- 📦 Gestão completa de produtos
- 👥 Controle de clientes
- 💰 Gestão financeira
- 🔗 Links de pagamento
- 📈 Relatórios detalhados

## 🎨 Interface

- **Tema Escuro/Claro** - Alternância automática
- **Design Responsivo** - Funciona em todos os dispositivos
- **Animações Suaves** - Experiência fluida
- **Ícones Intuitivos** - Navegação fácil
- **Notificações** - Feedback em tempo real

## 🔒 Segurança

- Validação de dados no backend e frontend
- Sanitização de inputs
- Controle de tipos de arquivo
- Limite de tamanho de upload
- Tratamento de erros robusto

## 📈 Performance

- Lazy loading de componentes
- Otimização de imagens
- Cache de dados
- Queries otimizadas
- Compressão de assets

## 🐛 Solução de Problemas

### Servidor não inicia
```bash
# Verifique se a porta 5000 está livre
netstat -an | findstr :5000

# Reinstale as dependências
cd server
rm -rf node_modules
npm install
```

### Cliente não carrega
```bash
# Verifique se a porta 3000 está livre
netstat -an | findstr :3000

# Reinstale as dependências
cd client
rm -rf node_modules
npm install
```

### Problemas com banco de dados
```bash
# Delete o banco e reinicie
rm server/database/estoque.db
cd server
node start.js
```

## 📝 Scripts Disponíveis

### Backend
- `npm start` - Inicia o servidor
- `npm run dev` - Inicia com nodemon (desenvolvimento)

### Frontend
- `npm start` - Inicia o cliente
- `npm run build` - Build para produção
- `npm test` - Executa testes

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato:
- 📧 Email: suporte@lojify.com
- 💬 WhatsApp: (81) 99620-1464

---

**Desenvolvido com ❤️ para facilitar o gerenciamento de estoque**