import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { unread } = req.query;
  let sql = 'SELECT n.*, t.subject as ticket_subject FROM notifications n LEFT JOIN tickets t ON n.ticket_id = t.id WHERE 1=1';
  const params = [];
  if (unread === 'true') { sql += ' AND n.read = 0'; }
  sql += ' ORDER BY n.created_at DESC LIMIT 50';
  const list = db.prepare(sql).all(...params);
  res.json(list);
});

router.patch('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.patch('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET read = 1').run();
  res.json({ ok: true });
});

export default router;
