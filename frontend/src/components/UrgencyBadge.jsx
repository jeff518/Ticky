import './UrgencyBadge.css';

const URGENCY_COLORS = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'critical'
};

export default function UrgencyBadge({ urgency }) {
  const cls = URGENCY_COLORS[urgency] || 'medium';
  return <span className={`urgency-badge ${cls}`}>{urgency || 'Medium'}</span>;
}
