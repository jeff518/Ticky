import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

function DashboardRedirect() {
  const { user } = useAuth();
  if (user?.role === 'User') return <Navigate to="/my-tickets" replace />;
  if (user?.role === 'Agent') return <Navigate to="/agent" replace />;
  if (user?.role === 'Manager') return <Navigate to="/manager" replace />;
  return <Navigate to="/admin" replace />;
}
import Login from './pages/Login';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import TicketForm from './pages/TicketForm';
import TicketDetail from './pages/TicketDetail';
import MyTickets from './pages/MyTickets';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'User') return <Navigate to="/my-tickets" replace />;
    if (user.role === 'Admin') return <Navigate to="/admin" replace />;
    if (user.role === 'Agent') return <Navigate to="/agent" replace />;
    if (user.role === 'Manager') return <Navigate to="/manager" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardRedirect />} />
        <Route path="admin" element={
          <ProtectedRoute roles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="agent" element={
          <ProtectedRoute roles={['Agent']}>
            <AgentDashboard />
          </ProtectedRoute>
        } />
        <Route path="manager" element={
          <ProtectedRoute roles={['Manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        <Route path="my-tickets" element={
          <ProtectedRoute roles={['User']}>
            <MyTickets />
          </ProtectedRoute>
        } />
        <Route path="tickets/new" element={
          <ProtectedRoute>
            <TicketForm />
          </ProtectedRoute>
        } />
        <Route path="tickets/:id" element={
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
