const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.databases = new Map(); // Cache de conexões de banco
    this.mainDbPath = path.join(__dirname, 'estoque.db');
    this.userDatabasesPath = path.join(__dirname, 'user_databases');
    
    // Criar diretório para bancos de usuários se não existir
    if (!fs.existsSync(this.userDatabasesPath)) {
      fs.mkdirSync(this.userDatabasesPath, { recursive: true });
    }
  }

  // Obter conexão com o banco principal (para usuários)
  getMainDatabase() {
    if (!this.databases.has('main')) {
      const db = new sqlite3.Database(this.mainDbPath);
      this.databases.set('main', db);
    }
    return this.databases.get('main');
  }

  // Obter conexão com o banco de um usuário específico
  getUserDatabase(userId) {
    const dbKey = `user_${userId}`;
    
    if (!this.databases.has(dbKey)) {
      const userDbPath = path.join(this.userDatabasesPath, `user_${userId}.db`);
      const db = new sqlite3.Database(userDbPath);
      
      // Habilitar foreign keys
      db.run('PRAGMA foreign_keys = ON');
      
      // Criar tabelas se não existirem
      this.createUserTables(db);
      
      this.databases.set(dbKey, db);
    }
    
    return this.databases.get(dbKey);
  }

  // Criar tabelas para o banco de um usuário
  createUserTables(db) {
    const tables = [
      // Tabela de Itens (Produtos)
      `
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          price REAL NOT NULL,
          cost REAL DEFAULT 0,
          installments INTEGER DEFAULT 1,
          stock INTEGER DEFAULT 0,
          min_stock INTEGER DEFAULT 0,
          max_stock INTEGER DEFAULT 1000,
          image_url TEXT,
          barcode TEXT,
          sku TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
      
      // Tabela de Clientes
      `
        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          document TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,

      // Tabela de Contas a Pagar
      `
        CREATE TABLE IF NOT EXISTS accounts_payable (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          due_date DATE NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,

      // Tabela de Contas a Receber
      `
        CREATE TABLE IF NOT EXISTS accounts_receivable (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          due_date DATE NOT NULL,
          status TEXT DEFAULT 'pending',
          client_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id)
        )
      `,

      // Tabela de Movimentações de Estoque
      `
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES items(id)
        )
      `,

      // Tabela de Vendas
      `
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER,
          total_amount REAL NOT NULL,
          payment_method TEXT,
          installments INTEGER DEFAULT 1,
          status TEXT DEFAULT 'completed',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id)
        )
      `,

      // Tabela de Itens da Venda
      `
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          FOREIGN KEY (sale_id) REFERENCES sales(id),
          FOREIGN KEY (item_id) REFERENCES items(id)
        )
      `,

      // Tabela de Links de Pagamento
      `
        CREATE TABLE IF NOT EXISTS payment_links (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          payment_id TEXT UNIQUE NOT NULL,
          amount REAL NOT NULL,
          payment_method TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_document TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,

      // Tabela de Transações de Pagamento
      `
        CREATE TABLE IF NOT EXISTS payment_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          payment_id TEXT UNIQUE NOT NULL,
          amount REAL NOT NULL,
          payment_method TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_document TEXT NOT NULL,
          description TEXT,
          payment_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    ];

    tables.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`❌ Erro ao criar tabela ${index + 1}:`, err);
        } else {
          console.log(`✅ Tabela ${index + 1} criada/verificada para usuário`);
        }
      });
    });
  }

  // Fechar todas as conexões
  closeAll() {
    this.databases.forEach((db, key) => {
      db.close((err) => {
        if (err) {
          console.error(`❌ Erro ao fechar banco ${key}:`, err);
        } else {
          console.log(`✅ Banco ${key} fechado`);
        }
      });
    });
    this.databases.clear();
  }

  // Remover banco de dados de um usuário
  deleteUserDatabase(userId) {
    const dbKey = `user_${userId}`;
    
    // Fechar conexão se existir
    if (this.databases.has(dbKey)) {
      const db = this.databases.get(dbKey);
      db.close();
      this.databases.delete(dbKey);
    }
    
    // Remover arquivo do banco
    const userDbPath = path.join(this.userDatabasesPath, `user_${userId}.db`);
    if (fs.existsSync(userDbPath)) {
      fs.unlinkSync(userDbPath);
      console.log(`✅ Banco de dados do usuário ${userId} removido`);
    }
  }
}

// Instância singleton
const databaseManager = new DatabaseManager();

module.exports = databaseManager;
