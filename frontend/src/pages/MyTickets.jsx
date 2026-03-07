import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import UrgencyBadge from '../components/UrgencyBadge';
import './Dashboard.css';

export default function MyTickets() {
  const { api } = useAuth();
  const [tickets, setTickets] = useState([]);

  const load = () => {
    api('/tickets/my').then(r => r.json()).then(setTickets);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const deleteTicket = async (id) => {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    await api(`/tickets/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="dashboard">
      <h1>My Tickets</h1>
      <p className="subtitle">View and manage your submitted tickets</p>
      <div className="tickets-section">
        <div className="section-header">
          <h2>Your Tickets</h2>
          <Link to="/tickets/new" className="btn-sm btn-primary">+ New Ticket</Link>
        </div>
        <div className="tickets-table-wrap">
          <table className="tickets-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Department</th>
                <th>Category</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Created</th>
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
                  <td>{t.department}</td>
                  <td>{t.category}</td>
                  <td><UrgencyBadge urgency={t.urgency} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <button onClick={() => deleteTicket(t.id)} className="btn-sm btn-danger">Delete</button>
                    <Link to={`/tickets/${t.id}`} className="btn-sm btn-ghost">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tickets.length === 0 && (
            <div className="empty">
              <p>No tickets yet.</p>
              <Link to="/tickets/new" className="btn-sm btn-primary">Submit your first ticket</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
