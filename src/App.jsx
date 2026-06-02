import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import CompleteProfile from './pages/Auth/CompleteProfile';
import Layout from './components/Layout';
import StudentDashboard from './pages/Dashboard/StudentDashboard';
import RepDashboard from './pages/Dashboard/RepDashboard';
import CreateRequest from './pages/Dashboard/CreateRequest';
import AdminDashboard from './pages/Dashboard/AdminDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RootRedirect = () => {
  const { user, googleUser } = useAuth();
  if (!user && googleUser) return <Navigate to="/complete-profile" replace />;
  if (!user) return <Navigate to="/login" replace />;
  // Redirect based on role
  switch (user.role) {
    case 'student': return <Navigate to="/dashboard/student" replace />;
    case 'representative':
    case 'rep':
      return <Navigate to="/dashboard/rep" replace />;
    case 'admin': return <Navigate to="/dashboard/admin" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div className="spinner" style={{
          width: '36px',
          height: '36px',
          border: '3.5px solid var(--color-primary-light)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.02em' }}>Syncing secure session...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />

        <Route path="/dashboard" element={<Layout />}>
          <Route path="student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="rep" element={
            <ProtectedRoute allowedRoles={['representative']}>
              <RepDashboard />
            </ProtectedRoute>
          } />
          <Route path="rep/create" element={
            <ProtectedRoute allowedRoles={['representative']}>
              <CreateRequest />
            </ProtectedRoute>
          } />

          <Route path="admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="admin/create" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateRequest />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
};

export default App;

