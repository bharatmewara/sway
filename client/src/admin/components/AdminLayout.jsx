import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { path: '/admin/users', label: 'Users', icon: 'bi-people' },
  { path: '/admin/verifications', label: 'Verifications', icon: 'bi-shield-check' },
  { path: '/admin/messages', label: 'Messages', icon: 'bi-chat-dots' },
  { path: '/admin/transactions', label: 'Transactions', icon: 'bi-currency-rupee' },
  { path: '/admin/reports', label: 'Reports', icon: 'bi-flag' },
  { path: '/admin/city-analytics', label: 'City Analytics', icon: 'bi-map' },
  { path: '/admin/settings', label: 'Settings', icon: 'bi-gear' },
];

const pageTitles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/verifications': 'Verifications',
  '/admin/messages': 'Messages',
  '/admin/transactions': 'Transactions',
  '/admin/reports': 'Reports',
  '/admin/city-analytics': 'City Analytics',
  '/admin/settings': 'Settings',
};

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();

  const currentTitle = Object.entries(pageTitles).find(([key]) =>
    location.pathname.startsWith(key)
  )?.[1] || 'Admin Panel';

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar-admin">
        {/* Logo */}
        <div className="logo">
          <h4>
            <span>S</span>WAY
          </h4>
          <small>Admin Console</small>
        </div>

        {/* Navigation */}
        <nav>
          <div className="nav-section-label">Main Menu</div>
          <ul className="list-unstyled mb-0">
            {navItems.slice(0, 4).map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-section-label" style={{ marginTop: 8 }}>
            Analytics
          </div>
          <ul className="list-unstyled mb-0">
            {navItems.slice(4, 7).map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-section-label" style={{ marginTop: 8 }}>
            System
          </div>
          <ul className="list-unstyled mb-0">
            {navItems.slice(7).map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer - Admin Info */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar-sm" style={{ fontSize: 13 }}>
              {getInitials(admin?.name || admin?.username)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {admin?.name || admin?.username || 'Admin'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                {admin?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-admin" style={{ flex: 1 }}>
        {/* Topbar */}
        <div className="admin-topbar">
          <div>
            <h5 className="topbar-title">{currentTitle}</h5>
            <div style={{ fontSize: 12, color: '#999' }}>
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
          <div className="topbar-right">
            {/* Notification Bell */}
            <button
              style={{
                background: '#f5f6fa',
                border: 'none',
                borderRadius: 10,
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
              title="Notifications"
            >
              <i className="bi bi-bell" style={{ fontSize: 18, color: '#555' }} />
              <span
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  background: '#e53935',
                  borderRadius: '50%',
                  border: '2px solid #fff',
                }}
              />
            </button>

            {/* Admin Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar-sm" style={{ fontSize: 13 }}>
                {getInitials(admin?.name || admin?.username)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', lineHeight: 1.2 }}>
                  {admin?.name || admin?.username || 'Admin'}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>
                  {admin?.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="btn-admin-outline"
              style={{ padding: '8px 14px' }}
              title="Logout"
            >
              <i className="bi bi-box-arrow-right" />
              Logout
            </button>
          </div>
        </div>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
