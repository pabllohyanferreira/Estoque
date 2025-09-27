# 🏪 Lojify

Sistema completo de gerenciamento de estoque e vendas com foco em segurança e simplicidade.

## 🚀 Início Rápido

```bash
# Configurar segurança
configurar-seguranca.bat

# Instalar dependências
npm run install-all

# Iniciar sistema
npm start
```

## 📋 Funcionalidades

- ✅ **Gestão de Estoque** - Controle completo de produtos
- ✅ **Sistema de Vendas** - Processo de vendas integrado
- ✅ **Clientes** - Cadastro e gestão de clientes
- ✅ **Relatórios** - Relatórios de vendas e estoque
- ✅ **Catálogo Público** - Interface para clientes
- ✅ **Segurança Avançada** - Rate limiting e proteção contra ataques
- ✅ **Contas a Pagar/Receber** - Gestão financeira

## 🔐 Login Padrão

Configure as credenciais através do script de configuração de segurança.

## 📁 Estrutura

```
lojify/
├── client/                    # Frontend React
├── server/                    # Backend Node.js
├── docs/                      # Documentação
├── configurar-seguranca.js    # Configurador de segurança
├── CONFIGURACAO_SEGURANCA.md  # Guia de segurança
└── README.md                  # Este arquivo
```

## 🔧 Comandos

```bash
npm start                     # Iniciar servidor
npm run build                 # Build de produção
npm run install-all           # Instalar dependências
npm test                      # Testar sistema
```

## 🔒 Segurança Implementada

- **Rate Limiting**: Proteção contra ataques de força bruta
- **JWT**: Autenticação segura com expiração
- **Sanitização**: Limpeza de dados de entrada
- **CORS**: Configuração restritiva
- **Helmet**: Headers de segurança HTTP
- **Logs**: Monitoramento de atividades suspeitas

## 📚 Documentação

- [Configuração de Segurança](CONFIGURACAO_SEGURANCA.md)
- [Sistema de Bancos Isolados](docs/SISTEMA_BANCOS_ISOLADOS.md)
- [Documentação Completa](docs/DOCUMENTACAO_COMPLETA.md)

## 🎯 Acesso

- **Sistema:** http://localhost:5000
- **API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## 📞 Suporte

- **Email**: pablohyan64@gmail.com
- **WhatsApp**: (81) 99620-1464

---

**Lojify v2.0.0** - Sistema de Estoque e Vendas Seguro