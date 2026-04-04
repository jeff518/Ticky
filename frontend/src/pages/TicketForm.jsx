import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UrgencyBadge from '../components/UrgencyBadge';
import './TicketForm.css';

const DEPARTMENTS = ['Sales', 'IT', 'HR', 'Finance', 'Customer'];

export default function TicketForm() {
  const { api, user } = useAuth();
  const isUser = user?.role === 'User';
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [department, setDepartment] = useState('IT');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState({ category: null, subcategory: null, urgency: null, assigned_team: null });
  const navigate = useNavigate();

  const fetchPreview = useCallback(async (subj, desc) => {
    if (!subj?.trim() && !desc?.trim()) {
      setPreview({ category: null, subcategory: null, urgency: null, assigned_team: null });
      return;
    }
    try {
      const res = await fetch('/api/tickets/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subj, description: desc })
      });
      if (res.ok) {
        const data = await res.json();
        setPreview(data);
      }
    } catch {
      setPreview({ category: null, subcategory: null, urgency: null, assigned_team: null });
    }
  }, []);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
  }, [user?.name, user?.email]);

  useEffect(() => {
    fetch('/api/tickets/subject-options')
      .then(res => (res.ok ? res.json() : { options: [] }))
      .then(data => setSubjectOptions(Array.isArray(data?.options) ? data.options : []))
      .catch(() => setSubjectOptions([]));
  }, []);

  const allowedSubjects = useMemo(
    () => new Set(subjectOptions.map(s => String(s).trim().toLowerCase())),
    [subjectOptions]
  );

  useEffect(() => {
    const id = setTimeout(() => fetchPreview(subject, description), 400);
    return () => clearTimeout(id);
  }, [subject, description, fetchPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const normalizedSubject = subject.trim().toLowerCase();
    if (!allowedSubjects.has(normalizedSubject)) {
      setError('Please choose a subject from the approved keyword list.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', isUser ? user.name : name);
      formData.append('email', isUser ? user.email : email);
      formData.append('department', department);
      formData.append('subject', subject);
      formData.append('description', description);
      if (attachment) formData.append('attachment', attachment);

      const token = localStorage.getItem('token');
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create ticket');
      }
      const ticket = await res.json();
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ticket-form-page">
      <h1>Submit Ticket</h1>
      <p className="subtitle">Ticket ID, category, subcategory, urgency, and team are automatically assigned from your subject and description</p>
      <form onSubmit={handleSubmit} className="ticket-form">
        {error && <div className="form-error">{error}</div>}
        {!isUser && (
          <>
            <div className="form-row">
              <label>Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Your name"
              />
            </div>
            <div className="form-row">
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>
          </>
        )}
        {isUser && <p className="form-hint">Submitted as {user?.name} ({user?.email})</p>}
        <div className="form-row">
          <label>Department *</label>
          <select value={department} onChange={e => setDepartment(e.target.value)}>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Subject * (search and choose from keywords)</label>
          <input
            type="text"
            list="subject-keyword-options"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
            placeholder="Type to search keywords..."
          />
          <datalist id="subject-keyword-options">
            {subjectOptions.map(opt => <option key={opt} value={opt} />)}
          </datalist>
        </div>
        <div className="form-row">
          <label>Description *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Describe your issue in detail..."
          />
          {(subject.trim() || description.trim()) && (preview.category || preview.subcategory || preview.urgency || preview.assigned_team) && (
            <div className="auto-assign-preview">
              <span className="preview-label">Auto-assigned from your subject and description:</span>
              <div className="preview-badges">
                <span className="preview-item"><strong>Category:</strong> {preview.category}</span>
                <span className="preview-item"><strong>Subcategory:</strong> {preview.subcategory}</span>
                <span className="preview-item"><strong>Urgency:</strong> <UrgencyBadge urgency={preview.urgency} /></span>
                <span className="preview-item"><strong>Team:</strong> {preview.assigned_team}</span>
              </div>
            </div>
          )}
        </div>
        <div className="form-row">
          <label>Attachment (optional)</label>
          <input
            type="file"
            onChange={e => setAttachment(e.target.files[0] || null)}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          />
          {attachment && <span className="file-name">{attachment.name}</span>}
        </div>
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}
