import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Ticket, LogOut, Moon, Sun, Inbox, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import Notifications from './Notifications';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);

  const toggleTheme = () => {
    setDark(d => !d);
    document.documentElement.dataset.theme = dark ? 'light' : '';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = user?.role === 'User'
    ? [
        { to: '/my-tickets', label: 'My Tickets', icon: Inbox },
        { to: '/tickets/new', label: 'New Ticket', icon: PlusCircle }
      ]
    : [
        ...(user?.role === 'Admin' ? [{ to: '/admin', label: 'Admin', icon: LayoutDashboard }] : []),
        ...(user?.role === 'Agent' ? [{ to: '/agent', label: 'Agent', icon: LayoutDashboard }] : []),
        ...(user?.role === 'Manager' ? [{ to: '/manager', label: 'Manager', icon: LayoutDashboard }] : []),
        { to: '/tickets/new', label: 'New Ticket', icon: Ticket }
      ].filter(Boolean);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Ticky</div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="icon-btn" title="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={handleLogout} className="nav-item">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="header">
          <span className="user-info">{user?.name} ({user?.role})</span>
          {user?.role !== 'User' && <Notifications />}
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
