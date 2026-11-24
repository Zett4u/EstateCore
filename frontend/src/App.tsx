import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PropertiesList } from './pages/PropertiesList';
import { PropertyDetail } from './pages/PropertyDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Authenticated Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AgentDashboard } from './pages/AgentDashboard';
import { ClientDashboard } from './pages/ClientDashboard';
import { PropertyForm } from './pages/PropertyForm';
import { InquiriesList } from './pages/InquiriesList';
import { AppointmentsList } from './pages/AppointmentsList';
import { UsersList } from './pages/UsersList';
import { UserProfile } from './pages/UserProfile';

/**
 * Smart redirect helper for authenticated users hitting /dashboard route
 */
const DashboardRedirect: React.FC = () => {
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
          {/* Public Website Routes (Accessible without login) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/properties" element={<PropertiesList />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
          </Route>

          {/* Standalone Authentication Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Dashboard Smart Redirect */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Protected Business Operations */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* ADMIN ONLY ROUTES */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/users" element={<UsersList />} />
              </Route>

              {/* AGENT ONLY ROUTES */}
              <Route element={<ProtectedRoute allowedRoles={['AGENT']} />}>
                <Route path="/agent" element={<AgentDashboard />} />
              </Route>

              {/* CLIENT ONLY ROUTES */}
              <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
                <Route path="/client" element={<ClientDashboard />} />
              </Route>

              {/* ADMIN & AGENT SHARED ROUTES (Property Management) */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'AGENT']} />}>
                <Route path="/properties/new" element={<PropertyForm />} />
                <Route path="/properties/:id/edit" element={<PropertyForm />} />
              </Route>

              {/* ALL AUTHENTICATED ROLES (Scoped by backend ownership) */}
              <Route path="/inquiries" element={<InquiriesList />} />
              <Route path="/appointments" element={<AppointmentsList />} />
              <Route path="/profile" element={<UserProfile />} />
            </Route>
          </Route>

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
