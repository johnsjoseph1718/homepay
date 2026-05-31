import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
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
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Redirect based on role
  switch (user.role) {
    case 'student': return <Navigate to="/dashboard/student" replace />;
    case 'rep': return <Navigate to="/dashboard/rep" replace />;
    case 'admin': return <Navigate to="/dashboard/admin" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

const App = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/dashboard" element={<Layout />}>
              <Route path="student" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } />

              <Route path="rep" element={
                <ProtectedRoute allowedRoles={['rep']}>
                  <RepDashboard />
                </ProtectedRoute>
              } />
              <Route path="rep/create" element={
                <ProtectedRoute allowedRoles={['rep']}>
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
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
