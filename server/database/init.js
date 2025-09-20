const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'estoque.db');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log('🗄️ Inicializando banco de dados...');
    
    // Habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON');
  
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
      installment_value REAL,
      quantity INTEGER DEFAULT 0,
      min_quantity INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'unidade',
      barcode TEXT UNIQUE,
      supplier TEXT,
      image_data BLOB,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Erro ao criar tabela items:', err);
    } else {
      console.log('✅ Tabela items criada/verificada');
    }
  });

  // Adicionar colunas se não existirem (com tratamento de erro)
  const columnsToAdd = [
    { name: 'image_data', type: 'BLOB' },
    { name: 'installments', type: 'INTEGER DEFAULT 1' },
    { name: 'installment_value', type: 'REAL' },
    { name: 'cost', type: 'REAL DEFAULT 0' }
  ];

  columnsToAdd.forEach(column => {
    db.run(`ALTER TABLE items ADD COLUMN ${column.name} ${column.type}`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(`Erro ao adicionar coluna ${column.name}:`, err.message);
      } else if (!err) {
        console.log(`Coluna ${column.name} adicionada com sucesso`);
      }
    });
  });

  // Tabela de Clientes
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      cpf_cnpj TEXT UNIQUE,
      type TEXT DEFAULT 'individual',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      supplier TEXT,
      category TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de Contas a Receber
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts_receivable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date DATE NOT NULL,
      status TEXT DEFAULT 'pending',
      client_id INTEGER,
      client_name TEXT,
      category TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )
  `);

  // Adicionar coluna client_name se não existir
  db.run(`ALTER TABLE accounts_receivable ADD COLUMN client_name TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Erro ao adicionar coluna client_name:', err.message);
    } else if (!err) {
      console.log('Coluna client_name adicionada com sucesso');
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
      reference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items (id)
    )
  `);

  // Tabela de Vendas
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      client_name TEXT NOT NULL,
      title TEXT NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'dinheiro',
      installments INTEGER DEFAULT 1,
      installment_value REAL,
      installment_payment_method TEXT,
      due_date TEXT,
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )
  `);

  // Tabela de Itens da Venda
  db.run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales (id),
      FOREIGN KEY (item_id) REFERENCES items (id)
    )
  `);

  // Tabela de Links de Pagamento
  db.run(`
    CREATE TABLE IF NOT EXISTS payment_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      client_id INTEGER,
      client_name TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      payment_methods TEXT NOT NULL,
      mercado_pago_id TEXT,
      mercado_pago_url TEXT,
      status TEXT DEFAULT 'pending',
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME,
      FOREIGN KEY (sale_id) REFERENCES sales (id),
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )
  `);

  // Tabela de Transações de Pagamento
  db.run(`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id TEXT UNIQUE NOT NULL,
      payment_method TEXT NOT NULL,
      amount REAL NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_document TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      payment_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Erro ao criar tabela payment_transactions:', err);
    } else {
      console.log('✅ Tabela payment_transactions criada/verificada');
    }
  });

  // Adicionar colunas se não existirem
  const paymentColumns = [
    { name: 'payment_id', type: 'TEXT UNIQUE NOT NULL' },
    { name: 'customer_name', type: 'TEXT NOT NULL' },
    { name: 'customer_email', type: 'TEXT NOT NULL' },
    { name: 'customer_document', type: 'TEXT NOT NULL' },
    { name: 'description', type: 'TEXT' },
    { name: 'payment_data', type: 'TEXT' },
    { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
  ];

  paymentColumns.forEach(column => {
    db.run(`ALTER TABLE payment_transactions ADD COLUMN ${column.name} ${column.type}`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(`Erro ao adicionar coluna ${column.name}:`, err.message);
      }
    });
  });

    console.log('🎉 Banco de dados inicializado com sucesso!');
    console.log('📊 Tabelas disponíveis: items, clients, accounts_payable, accounts_receivable, stock_movements, sales, sale_items, payment_links, payment_transactions');
    resolve();
  });
}

module.exports = { initializeDatabase, db }; 