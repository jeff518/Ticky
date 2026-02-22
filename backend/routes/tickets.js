import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { classifyTicket } from '../services/classificationEngine.js';
import { routeTicket } from '../services/routingEngine.js';
import { getSLADeadline, checkSLABreached } from '../services/slaService.js';
import { escalateTicket } from '../services/escalationService.js';
<<<<<<< HEAD
=======
import { getSubjectKeywordOptions } from '../services/ticketTaxonomy.js';
>>>>>>> fb8869bc (Second Commit)

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');
const upload = multer({ dest: uploadsDir, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

// Preview classification (no auth required for preview)
router.post('/preview', (req, res) => {
<<<<<<< HEAD
  const { description } = req.body || {};
  const { category, urgency } = classifyTicket(description);
  const assigned_team = routeTicket(category);
  res.json({ category, urgency, assigned_team });
=======
  const { subject = '', description = '' } = req.body || {};
  const text = `${subject} ${description}`.trim();
  const { category, subcategory, urgency } = classifyTicket(text);
  const assigned_team = routeTicket(category);
  res.json({ category, subcategory, urgency, assigned_team });
});

router.get('/subject-options', (req, res) => {
  const options = getSubjectKeywordOptions();
  res.json({ options });
>>>>>>> fb8869bc (Second Commit)
});

router.use(authMiddleware);

function addStatusHistory(ticketId, status, notes = '') {
  db.prepare('INSERT INTO ticket_status_history (ticket_id, status, notes) VALUES (?, ?, ?)')
    .run(ticketId, status, notes);
}

<<<<<<< HEAD
router.post('/', upload.single('attachment'), (req, res) => {
  let { name, email, department, subject, description } = req.body;
=======
function canManagerAccessCategory(req, category) {
  if (req.user?.role !== 'Manager') return true;
  return req.user?.team === category;
}

function canAgentAccessTicket(req, ticket) {
  if (req.user?.role !== 'Agent') return true;
  if (ticket.assigned_agent_id) return ticket.assigned_agent_id === req.user.id;
  return ticket.assigned_team === req.user.team;
}

router.post('/', upload.single('attachment'), (req, res) => {
  let { name, email, department, subject, description } = req.body;
  const allowedSubjects = new Set(
    getSubjectKeywordOptions().map(s => s.trim().toLowerCase())
  );
  const normalizedSubject = String(subject || '').trim().toLowerCase();
>>>>>>> fb8869bc (Second Commit)
  if (req.user?.role === 'User') {
    name = req.user.name;
    email = req.user.email;
  }
  if (!name || !email || !department || !subject || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
<<<<<<< HEAD
  const id = 'TKT-' + Date.now();
  const { category, urgency } = classifyTicket(description);
=======
  if (!allowedSubjects.has(normalizedSubject)) {
    return res.status(400).json({ error: 'Subject must be selected from the allowed keyword list' });
  }
  const id = 'TKT-' + Date.now();
  const { category, subcategory, urgency } = classifyTicket(`${subject} ${description}`.trim());
>>>>>>> fb8869bc (Second Commit)
  const assigned_team = routeTicket(category);
  const sla_deadline = getSLADeadline(urgency);
  const attachment_path = req.file ? req.file.path : null;

  db.prepare(`
    INSERT INTO tickets (id, name, email, department, subject, description, attachment_path,
<<<<<<< HEAD
      category, urgency, assigned_team, status, assigned_at, sla_deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', datetime('now'), ?)
  `).run(id, name, email, department, subject, description, attachment_path,
    category, urgency, assigned_team, sla_deadline.toISOString());
=======
      category, subcategory, urgency, assigned_team, status, assigned_at, sla_deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', datetime('now'), ?)
  `).run(id, name, email, department, subject, description, attachment_path,
    category, subcategory, urgency, assigned_team, sla_deadline.toISOString());
>>>>>>> fb8869bc (Second Commit)

  addStatusHistory(id, 'Open', 'Ticket created');

  if (urgency === 'Critical') {
    escalateTicket(id, 1, 'Critical urgency - immediate Level 1 alert');
  }

  db.prepare('INSERT INTO notifications (ticket_id, type, message) VALUES (?, ?, ?)')
    .run(id, 'created', `New ticket ${id}: ${subject}`);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  res.status(201).json(ticket);
});

router.get('/my', (req, res) => {
  if (req.user?.role !== 'User') return res.status(403).json({ error: 'Forbidden' });
  const tickets = db.prepare('SELECT * FROM tickets WHERE email = ? ORDER BY created_at DESC')
    .all(req.user.email);
  res.json(tickets);
});

router.get('/', (req, res) => {
  if (req.user?.role === 'User') return res.status(403).json({ error: 'Forbidden' });
  const { status, category, urgency, search, sort = 'created_at', order = 'desc' } = req.query;
  let sql = 'SELECT * FROM tickets WHERE 1=1';
  const params = [];

<<<<<<< HEAD
=======
  if (req.user?.role === 'Manager') {
    sql += ' AND category = ?';
    params.push(req.user.team);
  } else if (req.user?.role === 'Agent') {
    sql += ' AND (assigned_agent_id = ? OR (assigned_agent_id IS NULL AND assigned_team = ?))';
    params.push(req.user.id, req.user.team);
  }

>>>>>>> fb8869bc (Second Commit)
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (urgency) { sql += ' AND urgency = ?'; params.push(urgency); }
  if (search) {
    sql += ' AND (subject LIKE ? OR description LIKE ? OR id LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const validSort = ['created_at', 'urgency', 'status', 'category', 'sla_deadline'];
  const sortCol = validSort.includes(sort) ? sort : 'created_at';
  const dir = order === 'asc' ? 'ASC' : 'DESC';
  sql += ` ORDER BY ${sortCol} ${dir}`;

  const tickets = db.prepare(sql).all(...params);
  res.json(tickets);
});

<<<<<<< HEAD
router.get('/assigned/:team', (req, res) => {
  const tickets = db.prepare('SELECT * FROM tickets WHERE assigned_team = ? ORDER BY sla_deadline ASC')
    .all(decodeURIComponent(req.params.team));
  res.json(tickets);
});

=======
router.get('/assigned/me', (req, res) => {
  if (req.user?.role !== 'Agent') return res.status(403).json({ error: 'Forbidden' });
  const tickets = db.prepare(`
    SELECT * FROM tickets
    WHERE assigned_agent_id = ?
      OR (assigned_agent_id IS NULL AND assigned_team = ?)
    ORDER BY sla_deadline ASC
  `).all(req.user.id, req.user.team);
  res.json(tickets);
});

router.get('/assigned/:team', (req, res) => {
  const targetTeam = decodeURIComponent(req.params.team);
  if (req.user?.role === 'Agent' && req.user.team !== targetTeam) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.user?.role === 'Manager' && targetTeam !== routeTicket(req.user.team)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const tickets = db.prepare('SELECT * FROM tickets WHERE assigned_team = ? ORDER BY sla_deadline ASC')
    .all(targetTeam);
  res.json(tickets);
});

router.get('/agents', requireRole('Manager', 'Admin'), (req, res) => {
  const { category } = req.query;
  let team = null;
  if (req.user?.role === 'Manager') {
    team = routeTicket(req.user.team);
  } else if (category) {
    team = routeTicket(String(category));
  }
  let sql = "SELECT id, name, email, role, team FROM users WHERE role = 'Agent'";
  const params = [];
  if (team) {
    sql += ' AND team = ?';
    params.push(team);
  }
  sql += ' ORDER BY name';
  const agents = db.prepare(sql).all(...params);
  res.json(agents);
});

>>>>>>> fb8869bc (Second Commit)
router.get('/stats', requireRole('Admin'), (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM tickets').get().c;
  const critical = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE urgency = 'Critical'").get().c;
  const slaBreached = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'SLA Breached'").get().c;
  const escalated = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'Escalated'").get().c;
  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count FROM tickets GROUP BY category
  `).all();
  res.json({ total, critical, slaBreached, escalated, byCategory });
});

router.get('/:id', (req, res) => {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  if (req.user?.role === 'User' && ticket.email !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' });
  }
<<<<<<< HEAD
=======
  if (!canManagerAccessCategory(req, ticket.category) || !canAgentAccessTicket(req, ticket)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
>>>>>>> fb8869bc (Second Commit)
  const history = db.prepare('SELECT * FROM ticket_status_history WHERE ticket_id = ? ORDER BY changed_at')
    .all(req.params.id);
  const escalations = db.prepare('SELECT * FROM escalations WHERE ticket_id = ? ORDER BY escalated_at')
    .all(req.params.id);
  res.json({ ...ticket, history, escalations });
});

router.patch('/:id/status', (req, res) => {
  if (req.user?.role === 'User') return res.status(403).json({ error: 'Forbidden' });
  const { status } = req.body;
  if (!['Assigned', 'In Progress', 'Resolved', 'Escalated', 'SLA Breached'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Not found' });
<<<<<<< HEAD
=======
  if (!canManagerAccessCategory(req, ticket.category) || !canAgentAccessTicket(req, ticket)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
>>>>>>> fb8869bc (Second Commit)

  db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run(status, req.params.id);
  addStatusHistory(req.params.id, status);

  if (status === 'SLA Breached') {
    escalateTicket(req.params.id, 2, 'SLA time exceeded');
  }
  const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  if (req.user?.role === 'User' && ticket.email !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' });
  }
<<<<<<< HEAD
=======
  if (!canManagerAccessCategory(req, ticket.category) || !canAgentAccessTicket(req, ticket)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
>>>>>>> fb8869bc (Second Commit)

  db.prepare('DELETE FROM ticket_status_history WHERE ticket_id = ?').run(req.params.id);
  db.prepare('DELETE FROM escalations WHERE ticket_id = ?').run(req.params.id);
  db.prepare('DELETE FROM notifications WHERE ticket_id = ?').run(req.params.id);
  db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
  res.json({ ok: true, message: 'Ticket deleted' });
});

router.patch('/:id/override', requireRole('Manager', 'Admin'), (req, res) => {
  const { urgency, assigned_team } = req.body;
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Not found' });
<<<<<<< HEAD
=======
  if (!canManagerAccessCategory(req, ticket.category)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
>>>>>>> fb8869bc (Second Commit)

  if (urgency) {
    const sla = getSLADeadline(urgency, ticket.created_at);
    db.prepare('UPDATE tickets SET urgency = ?, sla_deadline = ? WHERE id = ?')
      .run(urgency, sla.toISOString(), req.params.id);
  }
  if (assigned_team) {
    db.prepare('UPDATE tickets SET assigned_team = ? WHERE id = ?').run(assigned_team, req.params.id);
  }
  const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  res.json(updated);
});

<<<<<<< HEAD
=======
router.patch('/:id/assign-agent', requireRole('Manager', 'Admin'), (req, res) => {
  const { agentId } = req.body || {};
  if (!agentId) return res.status(400).json({ error: 'agentId is required' });
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Not found' });
  if (!canManagerAccessCategory(req, ticket.category)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const agent = db.prepare("SELECT id, name, role, team FROM users WHERE id = ? AND role = 'Agent'").get(agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  if (agent.team !== ticket.assigned_team) {
    return res.status(400).json({ error: 'Agent team does not match ticket team' });
  }

  db.prepare('UPDATE tickets SET assigned_agent_id = ?, assigned_agent_name = ?, status = ? WHERE id = ?')
    .run(agent.id, agent.name, 'Assigned', req.params.id);
  addStatusHistory(req.params.id, 'Assigned', `Assigned to ${agent.name}`);
  const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  res.json(updated);
});

>>>>>>> fb8869bc (Second Commit)
setInterval(() => {
  const open = db.prepare("SELECT * FROM tickets WHERE status IN ('Open', 'Assigned', 'In Progress')").all();
  for (const t of open) {
    if (checkSLABreached(t.sla_deadline) && t.status !== 'SLA Breached') {
      db.prepare("UPDATE tickets SET status = 'SLA Breached' WHERE id = ?").run(t.id);
      addStatusHistory(t.id, 'SLA Breached', 'SLA exceeded');
      escalateTicket(t.id, 2, 'SLA exceeded');
      db.prepare('INSERT INTO notifications (ticket_id, type, message) VALUES (?, ?, ?)')
        .run(t.id, 'sla_breach', `Ticket ${t.id} SLA breached`);
    }
  }
}, 60000);

export default router;
