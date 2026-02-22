import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'ticky.db');

const SQL = await initSqlJs();
let _db = fs.existsSync(dbPath)
  ? new SQL.Database(fs.readFileSync(dbPath))
  : new SQL.Database();

function save() {
  fs.writeFileSync(dbPath, Buffer.from(_db.export()));
}

// Compatibility layer: mimic better-sqlite3 API (prepare().run/get/all)
function prepare(sql) {
  return {
    run(...params) {
      _db.run(sql, params);
      save();
    },
    get(...params) {
      const stmt = _db.prepare(sql);
      stmt.bind(params);
      const row = stmt.step() ? stmt.getAsObject() : undefined;
      stmt.free();
      return row;
    },
    all(...params) {
      const stmt = _db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    }
  };
}

function exec(sql) {
  _db.exec(sql);
  save();
}

const db = { prepare, exec };

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Admin', 'Agent', 'Manager', 'User')),
    team TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    attachment_path TEXT,
    category TEXT NOT NULL,
<<<<<<< HEAD
    urgency TEXT NOT NULL,
    assigned_team TEXT NOT NULL,
=======
    subcategory TEXT,
    urgency TEXT NOT NULL,
    assigned_team TEXT NOT NULL,
    assigned_agent_id TEXT,
    assigned_agent_name TEXT,
>>>>>>> fb8869bc (Second Commit)
    status TEXT DEFAULT 'Open' CHECK(status IN ('Open', 'Assigned', 'In Progress', 'Resolved', 'Escalated', 'SLA Breached')),
    created_at TEXT DEFAULT (datetime('now')),
    assigned_at TEXT,
    sla_deadline TEXT,
    escalation_level INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ticket_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    status TEXT NOT NULL,
    changed_at TEXT DEFAULT (datetime('now')),
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS escalations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    escalated_at TEXT DEFAULT (datetime('now')),
    reason TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT,
    user_id TEXT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
  CREATE INDEX IF NOT EXISTS idx_tickets_urgency ON tickets(urgency);
  CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at);
`);

// Migration: add User role (for existing DBs)
const runUserRoleMigration = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _schema (version INT PRIMARY KEY);
  `);
  const hasV2 = db.prepare("SELECT 1 FROM _schema WHERE version = 2").get();
  if (hasV2) return;
  db.exec(`
    CREATE TABLE users_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Admin', 'Agent', 'Manager', 'User')),
      team TEXT,
      created_at TEXT
    );
    INSERT INTO users_new SELECT id, name, email, password, role, team, created_at FROM users;
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
    INSERT OR IGNORE INTO _schema VALUES (2);
  `);
};
try {
  runUserRoleMigration();
} catch (_) {}

<<<<<<< HEAD
=======
// Migration: add ticket subcategory column
const runTicketSubcategoryMigration = () => {
  try {
    db.exec('ALTER TABLE tickets ADD COLUMN subcategory TEXT;');
  } catch (_) {}
};
try {
  runTicketSubcategoryMigration();
} catch (_) {}

// Migration: add ticket assignee fields
const runTicketAssignmentMigration = () => {
  try {
    db.exec('ALTER TABLE tickets ADD COLUMN assigned_agent_id TEXT;');
  } catch (_) {}
  try {
    db.exec('ALTER TABLE tickets ADD COLUMN assigned_agent_name TEXT;');
  } catch (_) {}
};
try {
  runTicketAssignmentMigration();
} catch (_) {}

>>>>>>> fb8869bc (Second Commit)
// Don't save on schema - avoid overwriting with empty DB
if (!fs.existsSync(dbPath)) save();

export { db };
