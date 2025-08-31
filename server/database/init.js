const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'estoque.db');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  console.log('Inicializando banco de dados...');
  
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
      barcode TEXT,
      supplier TEXT,
      image_data BLOB,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      email TEXT,
      phone TEXT,
      address TEXT,
      cpf_cnpj TEXT,
      type TEXT DEFAULT 'individual',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  console.log('Banco de dados inicializado com sucesso!');
}

module.exports = { initializeDatabase, db }; 