import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'User') navigate('/my-tickets');
      else if (user.role === 'Admin') navigate('/admin');
      else if (user.role === 'Agent') navigate('/agent');
      else if (user.role === 'Manager') navigate('/manager');
      else navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-brand">Ticky</h1>
        <p className="login-sub">Enterprise helpdesk</p>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="login-input"
          />
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="login-hint">Admin: admin@ticky.com / admin123 | User: user@ticky.com / user123</p>
      </div>
    </div>
  );
}
