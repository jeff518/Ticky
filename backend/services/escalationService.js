import { db } from '../db.js';
import { checkSLABreached } from './slaService.js';

export function getEscalationLevel(ticket) {
  if (ticket.status === 'SLA Breached') return 3;
  if (ticket.status === 'Escalated') return ticket.escalation_level || 1;
  if (ticket.urgency === 'Critical') return 1;
  if (checkSLABreached(ticket.sla_deadline)) return 2;
  return 0;
}

export function escalateTicket(ticketId, level, reason) {
  const stmt = db.prepare(`
    UPDATE tickets SET status = 'Escalated', escalation_level = ?
    WHERE id = ?
  `);
  stmt.run(level, ticketId);

  const ins = db.prepare(`
    INSERT INTO escalations (ticket_id, level, reason) VALUES (?, ?, ?)
  `);
  ins.run(ticketId, level, reason || 'Auto-escalation');

  const hist = db.prepare(`
    INSERT INTO ticket_status_history (ticket_id, status, notes) VALUES (?, 'Escalated', ?)
  `);
  hist.run(ticketId, `Level ${level}: ${reason}`);

  const notif = db.prepare(`
    INSERT INTO notifications (ticket_id, type, message) VALUES (?, 'escalation', ?)
  `);
  notif.run(ticketId, `Ticket escalated to Level ${level}`);
}
