import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Ticket, AlertTriangle, Clock, ArrowUpRight, Search, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatusBadge from '../components/StatusBadge';
import UrgencyBadge from '../components/UrgencyBadge';
import SLATimer from '../components/SLATimer';
import './Dashboard.css';

export default function AdminDashboard() {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', urgency: '' });

  const updateStatus = async (id, status) => {
    await api(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    load();
  };

  const deleteTicket = async (id) => {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    await api(`/tickets/${id}`, { method: 'DELETE' });
    load();
  };

  const load = () => {
    api('/tickets/stats').then(r => r.json()).then(setStats);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filters.status) params.set('status', filters.status);
    if (filters.urgency) params.set('urgency', filters.urgency);
    params.set('sort', 'urgency');
    params.set('order', 'asc');
    api(`/tickets?${params}`).then(r => r.json()).then(setTickets);
  };

  useEffect(() => { load(); }, [search, filters.status, filters.urgency]);
  useEffect(() => {
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  if (!stats) return <div className="loading">Loading...</div>;

  const chartData = stats.byCategory?.map(c => ({ name: c.category, count: c.count })) || [];

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <Ticket size={24} className="stat-icon" />
          <div>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Tickets</span>
          </div>
        </div>
        <div className="stat-card critical">
          <AlertTriangle size={24} className="stat-icon" />
          <div>
            <span className="stat-value">{stats.critical}</span>
            <span className="stat-label">Critical</span>
          </div>
        </div>
        <div className="stat-card breached">
          <Clock size={24} className="stat-icon" />
          <div>
            <span className="stat-value">{stats.slaBreached}</span>
            <span className="stat-label">SLA Breached</span>
          </div>
        </div>
        <div className="stat-card escalated">
          <ArrowUpRight size={24} className="stat-icon" />
          <div>
            <span className="stat-value">{stats.escalated}</span>
            <span className="stat-label">Escalated</span>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h2>Tickets by Category</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="tickets-section">
        <div className="section-header">
          <h2>All Tickets</h2>
          <div className="filters">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="Open">Open</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
              <option value="SLA Breached">SLA Breached</option>
            </select>
            <select value={filters.urgency} onChange={e => setFilters(f => ({ ...f, urgency: e.target.value }))}>
              <option value="">All urgency</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
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
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td><code>{t.id}</code></td>
                  <td>{t.subject}</td>
                  <td>{t.category}</td>
                  <td><UrgencyBadge urgency={t.urgency} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td><SLATimer deadline={t.sla_deadline} status={t.status} /></td>
                  <td>{t.assigned_team}</td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
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
          {tickets.length === 0 && <div className="empty">No tickets found</div>}
        </div>
      </div>
    </div>
  );
}
