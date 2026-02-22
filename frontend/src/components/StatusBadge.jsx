import './StatusBadge.css';

const STATUS_COLORS = {
  Open: 'open',
  Assigned: 'assigned',
  'In Progress': 'progress',
  Resolved: 'resolved',
  Escalated: 'escalated',
  'SLA Breached': 'breached'
};

export default function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || 'default';
  return <span className={`status-badge ${cls}`}>{status || 'Open'}</span>;
}
