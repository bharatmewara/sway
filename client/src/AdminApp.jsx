import React from 'react';
import './admin/admin.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './admin/context/AdminAuthContext';
import AdminLayout from './admin/components/AdminLayout';
import Login from './admin/pages/Login';
import Dashboard from './admin/pages/Dashboard';
import Users from './admin/pages/Users';
import UserDetail from './admin/pages/UserDetail';
import Verifications from './admin/pages/Verifications';
import Transactions from './admin/pages/Transactions';
import Reports from './admin/pages/Reports';
import CityAnalytics from './admin/pages/CityAnalytics';
import Settings from './admin/pages/Settings';
import Analytics from './admin/pages/Analytics';
import Subscriptions from './admin/pages/Subscriptions';

function ProtectedAdminRoute({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f5f6fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="text-center">
          <div
            className="spinner-border"
            style={{ color: '#e53935', width: 48, height: 48, borderWidth: 4 }}
          />
          <p style={{ color: '#888', marginTop: 16, fontWeight: 500 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        
        <Route
          path="*"
          element={
            <ProtectedAdminRoute>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="users" element={<Users />} />
                  <Route path="users/:id" element={<UserDetail />} />
                  <Route path="verifications" element={<Verifications />} />
                  <Route path="subscriptions" element={<Subscriptions />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="city-analytics" element={<CityAnalytics />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </AdminAuthProvider>
  );
}
