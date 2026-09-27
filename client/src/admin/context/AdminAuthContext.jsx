import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../api/axios';
import { io } from 'socket.io-client';

const AdminAuthContext = createContext(null);

export const ADMIN_ROLES = [
  'super_admin',
  'superadmin',
  'admin',
  'moderator',
  'finance_admin',
  'support_admin',
  'analyst',
];

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (admin) {
      const token = localStorage.getItem('admin_token');
      const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://127.0.0.1:5000', {
        auth: { token },
      });
      setSocket(newSocket);
      return () => newSocket.close();
    }
  }, [admin]);

  const verifyToken = async () => {
    try {
      const res = await api.get('/admin/me');
      const user = res.data.user || res.data;
      const role = String(user?.role || '').toLowerCase();
      if (user && ADMIN_ROLES.includes(role)) {
        setAdmin(user);
      } else {
        localStorage.removeItem('admin_token');
        setAdmin(null);
      }
    } catch {
      localStorage.removeItem('admin_token');
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/admin/login', { identifier: email, password });
    const { token, user } = res.data;
    const role = String(user?.role || '').toLowerCase();

    if (!user || !ADMIN_ROLES.includes(role)) {
      throw new Error('Access denied. Admin privileges required.');
    }

    localStorage.setItem('admin_token', token);
    setAdmin(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
    if (socket) socket.close();
    window.location.href = '/admin/login';
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, loading, socket, refreshAdmin: verifyToken }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

export default AdminAuthContext;
