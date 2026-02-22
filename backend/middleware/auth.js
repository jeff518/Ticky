import jwt from 'jsonwebtoken';
<<<<<<< HEAD
=======
import { db } from '../db.js';
>>>>>>> fb8869bc (Second Commit)

const JWT_SECRET = process.env.JWT_SECRET || 'ticky-secret-key-change-in-production';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
<<<<<<< HEAD
    req.user = decoded;
=======
    const dbUser = db.prepare('SELECT id, name, email, role, team FROM users WHERE id = ?').get(decoded.id);
    req.user = dbUser || decoded;
>>>>>>> fb8869bc (Second Commit)
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

export { JWT_SECRET };
