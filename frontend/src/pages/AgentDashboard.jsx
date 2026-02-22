import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import UrgencyBadge from '../components/UrgencyBadge';
import SLATimer from '../components/SLATimer';
import './Dashboard.css';

export default function AgentDashboard() {
  const { api, user } = useAuth();
  const [tickets, setTickets] = useState([]);

  const load = () => {
    if (user?.team) {
      api(`/tickets/assigned/${encodeURIComponent(user.team)}`).then(r => r.json()).then(setTickets);
    } else {
      api('/tickets?status=Assigned').then(r => r.json()).then(setTickets);
    }
  };

  useEffect(() => { load(); }, [user?.team]);
  useEffect(() => {
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const deleteTicket = async (id) => {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    await api(`/tickets/${id}`, { method: 'DELETE' });
    load();
  };

  const updateStatus = async (id, status) => {
    await api(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    load();
  };

  const open = tickets.filter(t => ['Open', 'Assigned'].includes(t.status));
  const inProgress = tickets.filter(t => t.status === 'In Progress');
  const resolved = tickets.filter(t => t.status === 'Resolved');

  return (
    <div className="dashboard">
      <h1>Agent Dashboard</h1>
      <p className="subtitle">Assigned to {user?.team || 'your team'}</p>
      <div className="stats-row">
        <div className="stat-card small">
          <span className="stat-value">{open.length}</span>
          <span className="stat-label">Open / Assigned</span>
        </div>
        <div className="stat-card small">
          <span className="stat-value">{inProgress.length}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card small resolved">
          <span className="stat-value">{resolved.length}</span>
          <span className="stat-label">Resolved</span>
        </div>
      </div>
      <div className="tickets-section">
        <h2>Assigned Tickets</h2>
        <div className="tickets-table-wrap">
          <table className="tickets-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>SLA Countdown</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td><code>{t.id}</code></td>
                  <td>
                    <Link to={`/tickets/${t.id}`} className="subject-link">{t.subject}</Link>
                  </td>
                  <td>{t.category}</td>
                  <td><UrgencyBadge urgency={t.urgency} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td><SLATimer deadline={t.sla_deadline} status={t.status} /></td>
                  <td className="actions">
                    {(t.status === 'Open' || t.status === 'Assigned') && (
                      <button onClick={() => updateStatus(t.id, 'In Progress')} className="btn-sm btn-primary">In Progress</button>
                    )}
                    {t.status !== 'Resolved' && (
                      <button onClick={() => updateStatus(t.id, 'Resolved')} className="btn-sm btn-success">Resolve</button>
                    )}
                    <button onClick={() => deleteTicket(t.id)} className="btn-sm btn-danger">Delete</button>
                    <Link to={`/tickets/${t.id}`} className="btn-sm btn-ghost">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tickets.length === 0 && <div className="empty">No assigned tickets</div>}
        </div>
      </div>
    </div>
  );
}
