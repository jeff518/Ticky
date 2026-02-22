import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import notificationRoutes from './routes/notifications.js';
import { db } from './db.js';

// Auto-seed default users if missing
function ensureSeed() {
  const defaults = [
    { name: 'Admin User', email: 'admin@ticky.com', password: 'admin123', role: 'Admin', team: null },
<<<<<<< HEAD
    { name: 'IT Agent', email: 'agent@ticky.com', password: 'agent123', role: 'Agent', team: 'IT Support Team' },
    { name: 'Manager User', email: 'manager@ticky.com', password: 'manager123', role: 'Manager', team: null },
=======
    { name: 'IT Manager', email: 'it.manager@ticky.com', password: 'manager123', role: 'Manager', team: 'IT Department' },
    { name: 'Finance Manager', email: 'finance.manager@ticky.com', password: 'manager123', role: 'Manager', team: 'Finance Department' },
    { name: 'Security Manager', email: 'security.manager@ticky.com', password: 'manager123', role: 'Manager', team: 'Security Department' },
    { name: 'Customer Service Manager', email: 'cs.manager@ticky.com', password: 'manager123', role: 'Manager', team: 'Customer Service' },
    { name: 'Billing Manager', email: 'billing.manager@ticky.com', password: 'manager123', role: 'Manager', team: 'Billing Department' },
    { name: 'IT Agent', email: 'it.agent@ticky.com', password: 'agent123', role: 'Agent', team: 'IT Support Team' },
    { name: 'Finance Agent', email: 'finance.agent@ticky.com', password: 'agent123', role: 'Agent', team: 'Finance Team' },
    { name: 'Security Agent', email: 'security.agent@ticky.com', password: 'agent123', role: 'Agent', team: 'Security Team' },
    { name: 'Customer Agent', email: 'cs.agent@ticky.com', password: 'agent123', role: 'Agent', team: 'Customer Support' },
    { name: 'Billing Agent', email: 'billing.agent@ticky.com', password: 'agent123', role: 'Agent', team: 'Billing Team' },
>>>>>>> fb8869bc (Second Commit)
    { name: 'End User', email: 'user@ticky.com', password: 'user123', role: 'User', team: null }
  ];
  for (const u of defaults) {
    try {
      const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(u.email);
      if (!exists) {
        db.prepare('INSERT INTO users (id, name, email, password, role, team) VALUES (?, ?, ?, ?, ?, ?)')
          .run(uuidv4(), u.name, u.email, bcrypt.hashSync(u.password, 10), u.role, u.team);
        console.log('Created user:', u.email);
      }
    } catch (e) {
      console.warn('Seed skip', u.email, e.message);
    }
  }
}
ensureSeed();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Ticky API running on http://localhost:${PORT}`));
