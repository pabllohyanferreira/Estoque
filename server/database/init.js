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

      // Tabela de Configurações dos Revendedores
      db.run(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          setting_key TEXT NOT NULL,
          setting_value TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, setting_key)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela user_settings:', err);
        } else {
          console.log('✅ Tabela user_settings criada/verificada');
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
          type TEXT DEFAULT 'individual',
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

      // Adicionar coluna type se não existir (migração)
      db.run(`
        ALTER TABLE clients ADD COLUMN type TEXT DEFAULT 'individual'
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('❌ Erro ao adicionar coluna type:', err);
        } else if (!err) {
          console.log('✅ Coluna type adicionada à tabela clients');
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
          client_name TEXT,
          title TEXT,
          total_amount REAL NOT NULL,
          notes TEXT,
          payment_method TEXT,
          installments INTEGER DEFAULT 1,
          installment_value REAL,
          installment_payment_method TEXT,
          due_date DATETIME,
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
          migrateSalesTable();
        }
      });

      function migrateSalesTable() {
        // Adicionar campos que podem não existir na tabela sales
        const migrations = [
          "ALTER TABLE sales ADD COLUMN client_name TEXT",
          "ALTER TABLE sales ADD COLUMN title TEXT", 
          "ALTER TABLE sales ADD COLUMN notes TEXT",
          "ALTER TABLE sales ADD COLUMN installment_value REAL",
          "ALTER TABLE sales ADD COLUMN installment_payment_method TEXT",
          "ALTER TABLE sales ADD COLUMN due_date DATETIME"
        ];

        let migrationIndex = 0;
        
        function runNextMigration() {
          if (migrationIndex >= migrations.length) {
            console.log('✅ Migrações da tabela sales concluídas');
            return;
          }
          
          const migration = migrations[migrationIndex];
          db.run(migration, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error(`❌ Erro na migração ${migration}:`, err.message);
            } else if (!err) {
              console.log(`✅ Migração aplicada: ${migration}`);
            }
            migrationIndex++;
            runNextMigration();
          });
        }
        
        runNextMigration();
      }

      // Tabela de Itens da Venda
      db.run(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          item_name TEXT,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          total_price REAL NOT NULL,
          FOREIGN KEY (sale_id) REFERENCES sales(id),
          FOREIGN KEY (item_id) REFERENCES items(id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela sale_items:', err);
        } else {
          console.log('✅ Tabela sale_items criada/verificada');
          migrateSaleItemsTable();
        }
      });

      function migrateSaleItemsTable() {
        // Adicionar campos que podem não existir na tabela sale_items
        const migrations = [
          "ALTER TABLE sale_items ADD COLUMN item_name TEXT",
          "ALTER TABLE sale_items ADD COLUMN unit_price REAL",
          "ALTER TABLE sale_items ADD COLUMN total_price REAL"
        ];

        let migrationIndex = 0;
        
        function runNextMigration() {
          if (migrationIndex >= migrations.length) {
            console.log('✅ Migrações da tabela sale_items concluídas');
            return;
          }
          
          const migration = migrations[migrationIndex];
          db.run(migration, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error(`❌ Erro na migração ${migration}:`, err.message);
            } else if (!err) {
              console.log(`✅ Migração aplicada: ${migration}`);
            }
            migrationIndex++;
            runNextMigration();
          });
        }
        
        runNextMigration();
      }

      createAdminUser();
    }
    
    function createAdminUser() {
      // Criar usuário admin padrão se não existir
      const bcrypt = require('bcryptjs');
      const adminPassword = bcrypt.hashSync('12345', 10);
      
      db.get('SELECT id FROM users WHERE email = ?', ['detty@lojify.com'], (err, row) => {
        if (err) {
          console.error('❌ Erro ao verificar usuário admin:', err);
          reject(err);
        } else if (!row) {
          db.run(`
            INSERT INTO users (name, email, password, role, status) 
            VALUES (?, ?, ?, ?, ?)
          `, ['detty', 'detty@lojify.com', adminPassword, 'reseller', 'active'], (err) => {
            if (err) {
              console.error('❌ Erro ao criar usuário admin:', err);
              reject(err);
            } else {
              console.log('✅ Usuário revendedor criado com sucesso');
              console.log('   Email: detty@lojify.com');
              console.log('   Senha: 12345');
              console.log('   Role: revendedor');
              resolve();
            }
          });
        } else {
          console.log('✅ Usuário revendedor já existe');
          resolve();
        }
      });
    }
  });
}

module.exports = { initializeDatabase, db };