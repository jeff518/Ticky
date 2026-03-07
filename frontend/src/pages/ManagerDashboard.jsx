import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
<<<<<<< HEAD
import SLATimer from '../components/SLATimer';
import './Dashboard.css';

export default function ManagerDashboard() {
  const { api, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);

  const load = () => {
    api('/tickets').then(r => r.json()).then(setTickets);
    api('/tickets/agents').then(r => r.json()).then(setAgents);
=======
import UrgencyBadge from '../components/UrgencyBadge';
import SLATimer from '../components/SLATimer';
import './Dashboard.css';

const TEAMS = ['IT Support Team', 'Finance Team', 'Customer Support', 'Security Team', 'Product Team'];

export default function ManagerDashboard() {
  const { api } = useAuth();
  const [tickets, setTickets] = useState([]);

  const load = () => {
    api('/tickets?status=Escalated').then(r => r.json()).then(setTickets);
>>>>>>> 30dfe3f28086f4750f83352912032e5956f2437b
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const updateStatus = async (id, status) => {
    await api(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    load();
  };

  const deleteTicket = async (id) => {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    await api(`/tickets/${id}`, { method: 'DELETE' });
    load();
  };

<<<<<<< HEAD
  const assignAgent = async (id, agentId) => {
    await api(`/tickets/${id}/assign-agent`, {
      method: 'PATCH',
      body: JSON.stringify({ agentId })
=======
  const override = async (id, urgency, assigned_team) => {
    const body = {};
    if (urgency) body.urgency = urgency;
    if (assigned_team) body.assigned_team = assigned_team;
    if (Object.keys(body).length === 0) return;
    await api(`/tickets/${id}/override`, {
      method: 'PATCH',
      body: JSON.stringify(body)
>>>>>>> 30dfe3f28086f4750f83352912032e5956f2437b
    });
    load();
  };

<<<<<<< HEAD
  const grouped = tickets.reduce((acc, ticket) => {
    const key = ticket.subcategory || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(ticket);
    return acc;
  }, {});
  const subcategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  return (
    <div className="dashboard">
      <h1>Manager Dashboard</h1>
      <p className="subtitle">{user?.team || 'Category'} tickets grouped by subcategory</p>
      {subcategories.map(sub => (
        <div className="tickets-section" key={sub}>
          <h2>{sub}</h2>
          <div className="tickets-table-wrap">
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>Team</th>
                  <th>Assigned Agent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grouped[sub].map(t => {
                  const teamAgents = agents.filter(a => a.team === t.assigned_team);
                  return (
                    <tr key={t.id}>
                      <td><code>{t.id}</code></td>
                      <td>
                        <Link to={`/tickets/${t.id}`} className="subject-link">{t.subject}</Link>
                      </td>
                      <td>{t.category}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td><SLATimer deadline={t.sla_deadline} status={t.status} /></td>
                      <td>{t.assigned_team}</td>
                      <td>
                        <select
                          value={t.assigned_agent_id || ''}
                          onChange={e => assignAgent(t.id, e.target.value)}
                          className="override-select"
                        >
                          <option value="" disabled>Select agent</option>
                          {teamAgents.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="actions">
                        {t.status !== 'Resolved' && (
                          <button onClick={() => updateStatus(t.id, 'Resolved')} className="btn-sm btn-success">Resolve</button>
                        )}
                        <button onClick={() => deleteTicket(t.id)} className="btn-sm btn-danger">Delete</button>
                        <Link to={`/tickets/${t.id}`} className="btn-sm btn-ghost">View</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {tickets.length === 0 && <div className="empty">No tickets for this category</div>}
=======
  return (
    <div className="dashboard">
      <h1>Manager Dashboard</h1>
      <p className="subtitle">Escalated tickets – override urgency and reassign</p>
      <div className="tickets-section">
        <h2>Escalated Tickets</h2>
        <div className="tickets-table-wrap">
          <table className="tickets-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>SLA</th>
                <th>Team</th>
                <th>Level</th>
                <th>Override</th>
                <th></th>
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
                  <td>
                    <select
                      value={t.urgency}
                      onChange={e => override(t.id, e.target.value)}
                      className="override-select"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </td>
                  <td><StatusBadge status={t.status} /></td>
                  <td><SLATimer deadline={t.sla_deadline} status={t.status} /></td>
                  <td>
                    <select
                      value={t.assigned_team}
                      onChange={e => override(t.id, null, e.target.value)}
                      className="override-select"
                    >
                      {TEAMS.map(team => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </td>
                  <td>L{t.escalation_level || 1}</td>
                  <td>
                    <button onClick={() => override(t.id, 'Critical', null)} className="btn-sm btn-primary">Critical</button>
                  </td>
                  <td className="actions">
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
          {tickets.length === 0 && <div className="empty">No escalated tickets</div>}
        </div>
      </div>
>>>>>>> 30dfe3f28086f4750f83352912032e5956f2437b
    </div>
  );
}
