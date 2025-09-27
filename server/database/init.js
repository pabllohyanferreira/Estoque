const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'estoque.db');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log('🗄️ Inicializando banco de dados...');
    
    // Habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('❌ Erro ao habilitar foreign keys:', err);
        reject(err);
        return;
      }
      
      console.log('✅ Foreign keys habilitadas');
      createTables();
    });
    
    function createTables() {
      // Tabela de Usuários (Revendedores)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'reseller',
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela users:', err);
          reject(err);
        } else {
          console.log('✅ Tabela users criada/verificada');
          createOtherTables();
        }
      });
    }
    
    function createOtherTables() {
      // Tabela de Itens (Produtos)
      db.run(`
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
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela items:', err);
        } else {
          console.log('✅ Tabela items criada/verificada');
        }
      });

      // Tabela de Clientes
      db.run(`
        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          document TEXT,
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela clients:', err);
        } else {
          console.log('✅ Tabela clients criada/verificada');
        }
      });

      // Tabela de Contas a Pagar
      db.run(`
        CREATE TABLE IF NOT EXISTS accounts_payable (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          due_date DATE NOT NULL,
          status TEXT DEFAULT 'pending',
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela accounts_payable:', err);
        } else {
          console.log('✅ Tabela accounts_payable criada/verificada');
        }
      });

      // Tabela de Contas a Receber
      db.run(`
        CREATE TABLE IF NOT EXISTS accounts_receivable (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          due_date DATE NOT NULL,
          status TEXT DEFAULT 'pending',
          client_id INTEGER,
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela accounts_receivable:', err);
        } else {
          console.log('✅ Tabela accounts_receivable criada/verificada');
        }
      });

      // Tabela de Movimentações de Estoque
      db.run(`
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          reason TEXT,
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES items(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela stock_movements:', err);
        } else {
          console.log('✅ Tabela stock_movements criada/verificada');
        }
      });

      // Tabela de Vendas
      db.run(`
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER,
          total_amount REAL NOT NULL,
          payment_method TEXT,
          installments INTEGER DEFAULT 1,
          status TEXT DEFAULT 'completed',
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela sales:', err);
        } else {
          console.log('✅ Tabela sales criada/verificada');
        }
      });

      // Tabela de Itens da Venda
      db.run(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          price REAL NOT NULL,
          FOREIGN KEY (sale_id) REFERENCES sales(id),
          FOREIGN KEY (item_id) REFERENCES items(id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela sale_items:', err);
        } else {
          console.log('✅ Tabela sale_items criada/verificada');
        }
      });

      createAdminUser();
    }
    
    function createAdminUser() {
      // Criar usuário admin padrão se não existir
      const bcrypt = require('bcrypt');
      const adminPassword = bcrypt.hashSync('admin123', 10);
      
      db.get('SELECT id FROM users WHERE email = ?', ['admin@lojify.com'], (err, row) => {
        if (err) {
          console.error('❌ Erro ao verificar usuário admin:', err);
          reject(err);
        } else if (!row) {
          db.run(`
            INSERT INTO users (name, email, password, role, status) 
            VALUES (?, ?, ?, ?, ?)
          `, ['Administrador', 'admin@lojify.com', adminPassword, 'admin', 'active'], (err) => {
            if (err) {
              console.error('❌ Erro ao criar usuário admin:', err);
              reject(err);
            } else {
              console.log('✅ Usuário admin criado com sucesso');
              console.log('   Email: admin@lojify.com');
              console.log('   Senha: admin123');
              console.log('   ⚠️  ALTERE AS CREDENCIAIS PADRÃO IMEDIATAMENTE!');
              resolve();
            }
          });
        } else {
          console.log('✅ Usuário admin já existe');
          resolve();
        }
      });
    }
  });
}

module.exports = { initializeDatabase, db };