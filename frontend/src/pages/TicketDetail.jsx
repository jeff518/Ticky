import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import UrgencyBadge from '../components/UrgencyBadge';
import SLATimer from '../components/SLATimer';
import './TicketDetail.css';

const STATUSES = ['Assigned', 'In Progress', 'Resolved'];
const TEAMS = ['IT Support Team', 'Finance Team', 'Customer Support', 'Security Team', 'Product Team'];

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api(`/tickets/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setTicket)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    await api(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    load();
  };

  const deleteTicket = async () => {
    if (!window.confirm('Are you sure you want to delete this ticket? This cannot be undone.')) return;
    const res = await api(`/tickets/${id}`, { method: 'DELETE' });
    if (res.ok) navigate(-1);
    else load();
  };

  const override = async (urgency, assigned_team) => {
    const body = {};
    if (urgency) body.urgency = urgency;
    if (assigned_team) body.assigned_team = assigned_team;
    await api(`/tickets/${id}/override`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
    load();
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!ticket) return <div className="loading">Ticket not found</div>;

  const canUpdateStatus = ['Agent', 'Admin', 'Manager'].includes(user?.role);
  const canResolve = canUpdateStatus && ticket.status !== 'Resolved';
  const canOverride = ['Manager', 'Admin'].includes(user?.role);
  const canDelete = ['Agent', 'Admin', 'Manager', 'User'].includes(user?.role);

  return (
    <div className="ticket-detail">
      <button onClick={() => navigate(-1)} className="back-btn">
        <ArrowLeft size={18} />
        Back
      </button>
      <div className="ticket-header">
        <div>
          <h1>{ticket.subject}</h1>
          <div className="meta">
            <code>{ticket.id}</code>
            <span>•</span>
            <span>{new Date(ticket.created_at).toLocaleString()}</span>
          </div>
        </div>
        <div className="badges">
          <StatusBadge status={ticket.status} />
          <UrgencyBadge urgency={ticket.urgency} />
          <SLATimer deadline={ticket.sla_deadline} status={ticket.status} />
        </div>
      </div>

      <div className="ticket-grid">
        <div className="ticket-main">
          <div className="card">
            <h2>Description</h2>
            <p>{ticket.description}</p>
          </div>
          {ticket.history?.length > 0 && (
            <div className="card">
              <h2>Status History</h2>
              <ul className="history-list">
                {ticket.history.map((h, i) => (
                  <li key={i}>
                    <span className="status">{h.status}</span>
                    <span className="time">{new Date(h.changed_at).toLocaleString()}</span>
                    {h.notes && <span className="notes">{h.notes}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {ticket.escalations?.length > 0 && (
            <div className="card">
              <h2>Escalations</h2>
              <ul className="escalation-list">
                {ticket.escalations.map((e, i) => (
                  <li key={i}>
                    Level {e.level} – {new Date(e.escalated_at).toLocaleString()}
                    {e.reason && <span className="reason">{e.reason}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="ticket-sidebar">
          <div className="card">
            <h2>Details</h2>
            <dl className="details">
              <dt>From</dt>
              <dd>{ticket.name}</dd>
              <dt>Email</dt>
              <dd>{ticket.email}</dd>
              <dt>Department</dt>
              <dd>{ticket.department}</dd>
              <dt>Category</dt>
              <dd>{ticket.category}</dd>
              <dt>Assigned Team</dt>
              <dd>{ticket.assigned_team}</dd>
              {ticket.attachment_path && (
                <>
                  <dt>Attachment</dt>
                  <dd><a href={ticket.attachment_path ? `/uploads/${String(ticket.attachment_path).split(/[/\\]/).pop()}` : '#'} target="_blank" rel="noreferrer">View file</a></dd>
                </>
              )}
            </dl>
          </div>
          {(canUpdateStatus || canResolve || canOverride || canDelete) && (
            <div className="card">
              <h2>Actions</h2>
              <div className="action-btns">
                {canUpdateStatus && ticket.status !== 'Resolved' && (
                  <>
                    {(ticket.status === 'Open' || ticket.status === 'Assigned') && (
                      <button onClick={() => updateStatus('In Progress')} className="btn btn-primary">In Progress</button>
                    )}
                    {(ticket.status === 'In Progress' || ticket.status === 'Open' || ticket.status === 'Assigned' || ticket.status === 'Escalated' || ticket.status === 'SLA Breached') && (
                      <button onClick={() => updateStatus('Resolved')} className="btn btn-success">Resolve</button>
                    )}
                  </>
                )}
                {canDelete && (
                  <button onClick={deleteTicket} className="btn btn-danger">Delete Ticket</button>
                )}
              </div>
            </div>
          )}
          {canOverride && (
            <div className="card">
              <h2>Override</h2>
              <div className="override-form">
                <label>Urgency</label>
                <select value={ticket.urgency} onChange={e => override(e.target.value, null)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <label>Team</label>
                <select value={ticket.assigned_team} onChange={e => override(null, e.target.value)}>
                  {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
