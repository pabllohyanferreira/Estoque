# Sistema de Gerenciamento de Estoque

Um sistema web completo para gerenciamento de estoque, clientes e contas a pagar/receber, desenvolvido com React, Node.js e SQLite.

## 🚀 Funcionalidades

### 📦 Gerenciamento de Produtos
- Cadastro completo de produtos com informações detalhadas
- Controle de estoque com alertas de estoque baixo
- Categorização de produtos
- Ajuste de estoque com histórico de movimentações
- Busca e filtros avançados

### 👥 Gerenciamento de Clientes
- Cadastro de clientes (pessoa física e jurídica)
- Informações completas de contato
- Histórico de contas a receber por cliente
- Busca e filtros por tipo de cliente

### 💰 Controle Financeiro
- **Contas a Pagar**: Gerenciamento de obrigações financeiras
- **Contas a Receber**: Controle de direitos financeiros
- Status de pagamento (Pendente, Pago, Vencido)
- Alertas de contas vencidas
- Categorização de contas

### 📊 Dashboard
- Visão geral do sistema
- Estatísticas em tempo real
- Alertas de estoque baixo
- Contas vencidas
- Produtos recentes

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** - Banco de dados
- **Express Validator** - Validação de dados
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - Biblioteca JavaScript
- **React Router** - Roteamento
- **React Hook Form** - Gerenciamento de formulários
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Ícones
- **React Hot Toast** - Notificações
- **Axios** - Cliente HTTP

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

## 🔧 Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd sistema-estoque
   ```

2. **Instale as dependências**
   ```bash
   npm run install-all
   ```

3. **Inicie o desenvolvimento**
   ```bash
   npm run dev
   ```

   Isso irá iniciar:
   - Backend na porta 5000
   - Frontend na porta 3000

## 🚀 Como Usar

### Acessando o Sistema
1. Abra seu navegador
2. Acesse `http://localhost:3000`
3. O sistema estará pronto para uso

### Primeiros Passos
1. **Cadastre Produtos**: Vá para "Produtos" e adicione seus primeiros itens
2. **Cadastre Clientes**: Vá para "Clientes" e adicione sua base de clientes
3. **Configure Contas**: Use "Contas a Pagar" e "Contas a Receber" para gerenciar finanças
4. **Monitore o Dashboard**: Acompanhe estatísticas e alertas na página inicial

## 📁 Estrutura do Projeto

```
sistema-estoque/
├── server/                 # Backend
│   ├── database/          # Configuração do banco
│   ├── routes/            # Rotas da API
│   └── index.js           # Servidor principal
├── client/                # Frontend
│   ├── public/            # Arquivos públicos
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── services/      # Serviços de API
│   │   └── App.js         # Componente principal
│   └── package.json
└── package.json           # Scripts principais
```

## 🔌 API Endpoints

### Produtos
- `GET /api/items` - Listar produtos
- `POST /api/items` - Criar produto
- `PUT /api/items/:id` - Atualizar produto
- `DELETE /api/items/:id` - Deletar produto
- `POST /api/items/:id/stock` - Ajustar estoque

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar cliente
- `PUT /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Deletar cliente

### Contas a Pagar
- `GET /api/accounts/payable` - Listar contas a pagar
- `POST /api/accounts/payable` - Criar conta a pagar
- `PUT /api/accounts/payable/:id` - Atualizar conta a pagar
- `DELETE /api/accounts/payable/:id` - Deletar conta a pagar

### Contas a Receber
- `GET /api/accounts/receivable` - Listar contas a receber
- `POST /api/accounts/receivable` - Criar conta a receber
- `PUT /api/accounts/receivable/:id` - Atualizar conta a receber
- `DELETE /api/accounts/receivable/:id` - Deletar conta a receber

## 🎨 Interface

O sistema possui uma interface moderna e responsiva com:
- Design limpo e intuitivo
- Navegação lateral com menu
- Modais para criação/edição
- Notificações toast
- Loading states
- Responsividade para mobile

## 🔒 Segurança

- Validação de dados no backend
- Sanitização de inputs
- Proteção contra SQL injection
- Validação de formulários no frontend

## 📈 Próximas Funcionalidades

- [ ] Sistema de usuários e autenticação
- [ ] Relatórios e gráficos
- [ ] Exportação de dados
- [ ] Backup automático
- [ ] Notificações por email
- [ ] Integração com sistemas externos
- [ ] App mobile

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para facilitar o gerenciamento de estoque e finanças** 