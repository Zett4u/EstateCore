import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { AgentDashboard } from './pages/AgentDashboard';
import { ClientDashboard } from './pages/ClientDashboard';
import { PropertiesList } from './pages/PropertiesList';
import { PropertyDetail } from './pages/PropertyDetail';
import { PropertyForm } from './pages/PropertyForm';
import { InquiriesList } from './pages/InquiriesList';
import { AppointmentsList } from './pages/AppointmentsList';
import { UsersList } from './pages/UsersList';
import { UserProfile } from './pages/UserProfile';

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'AGENT') return <Navigate to="/agent" replace />;
  return <Navigate to="/client" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Routes inside Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Admin Dashboard */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Agent Dashboard */}
              <Route path="/agent" element={<AgentDashboard />} />

              {/* Client Dashboard */}
              <Route path="/client" element={<ClientDashboard />} />

              {/* Properties */}
              <Route path="/properties" element={<PropertiesList />} />
              <Route path="/properties/new" element={<PropertyForm />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path="/properties/:id/edit" element={<PropertyForm />} />

              {/* Inquiries */}
              <Route path="/inquiries" element={<InquiriesList />} />

              {/* Appointments */}
              <Route path="/appointments" element={<AppointmentsList />} />

              {/* User Profile */}
              <Route path="/profile" element={<UserProfile />} />

              {/* Admin Only: Users Management */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/users" element={<UsersList />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
