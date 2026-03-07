import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db.js';

const users = [
  { name: 'Admin User', email: 'admin@ticky.com', password: 'admin123', role: 'Admin', team: null },
  { name: 'IT Agent', email: 'agent@ticky.com', password: 'agent123', role: 'Agent', team: 'IT Support Team' },
  { name: 'Manager User', email: 'manager@ticky.com', password: 'manager123', role: 'Manager', team: null },
  { name: 'End User', email: 'user@ticky.com', password: 'user123', role: 'User', team: null }
];

for (const u of users) {
  const id = uuidv4();
  const hash = bcrypt.hashSync(u.password, 10);
  try {
    db.prepare('INSERT INTO users (id, name, email, password, role, team) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, u.name, u.email, hash, u.role, u.team);
    console.log(`Created ${u.role}: ${u.email}`);
  } catch (e) {
    if (e.message.includes('UNIQUE')) console.log(`User ${u.email} already exists`);
    else throw e;
  }
}
console.log('Seed complete. Admin: admin@ticky.com / admin123 | User: user@ticky.com / user123');
