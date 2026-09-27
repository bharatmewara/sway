import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const navGroups = [
  {
    section: 'Core Management',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
      { path: '/admin/users', label: 'Users', icon: 'bi-people' },
      { path: '/admin/verifications', label: 'Verifications', icon: 'bi-shield-check' },
      { path: '/admin/messages', label: 'Chats & Messages', icon: 'bi-chat-dots' },
    ],
  },
  {
    section: 'Economy & Moderation',
    items: [
      { path: '/admin/connects', label: 'Connects & Packs', icon: 'bi-coin' },
      { path: '/admin/transactions', label: 'Transactions', icon: 'bi-currency-rupee' },
      { path: '/admin/reports', label: 'Reports & Blocks', icon: 'bi-flag' },
      { path: '/admin/notifications', label: 'Notifications', icon: 'bi-megaphone' },
    ],
  },
  {
    section: 'Insights & System',
    items: [
      { path: '/admin/analytics', label: 'Engagement Analytics', icon: 'bi-bar-chart-line' },
      { path: '/admin/city-analytics', label: 'City Analytics', icon: 'bi-geo-alt' },
      { path: '/admin/audit-logs', label: 'Admins & Audit Logs', icon: 'bi-journal-check' },
      { path: '/admin/settings', label: 'Platform Settings', icon: 'bi-sliders' },
    ],
  },
];

const pageTitles = {
  '/admin/dashboard': 'Executive Dashboard',
  '/admin/users': 'User Management',
  '/admin/verifications': 'Live Selfie & Gender Verification',
  '/admin/messages': 'Chats & Private Messages Control',
  '/admin/connects': 'Connect Economy & Packages',
  '/admin/transactions': 'Payments, Transactions & Refunds',
  '/admin/reports': 'Reports & Blocks Moderation',
  '/admin/notifications': 'Broadcast & Targeted Notifications',
  '/admin/analytics': 'Engagement & Funnel Analytics',
  '/admin/city-analytics': 'City & Regional Analytics',
  '/admin/audit-logs': 'Admin Roles & Security Audit Logs',
  '/admin/settings': 'Central Platform & Communication Settings',
};

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

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

  const formatRole = (role) => {
    if (!role) return 'Admin';
    return String(role)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar-admin">
        <div className="logo">
          <h4>
            <span>S</span>WAY
          </h4>
          <small>Admin Console</small>
        </div>

        <nav style={{ overflowY: 'auto' }}>
          {navGroups.map((group, idx) => (
            <div key={group.section} style={{ marginTop: idx > 0 ? 10 : 0 }}>
              <div className="nav-section-label">{group.section}</div>
              <ul className="list-unstyled mb-0">
                {group.items.map((item) => (
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
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="avatar-sm" style={{ fontSize: 13 }}>
              {getInitials(admin?.nickname || admin?.username)}
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
                {admin?.nickname || admin?.username || 'Admin'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                {formatRole(admin?.role)}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-admin" style={{ flex: 1, minWidth: 0 }}>
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
            <button
              onClick={() => navigate('/admin/notifications')}
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
              title="Broadcast Notifications"
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar-sm" style={{ fontSize: 13 }}>
                {getInitials(admin?.nickname || admin?.username)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', lineHeight: 1.2 }}>
                  {admin?.nickname || admin?.username || 'Admin'}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>
                  {formatRole(admin?.role)}
                </div>
              </div>
            </div>

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

        <div style={{ padding: '24px 32px', flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
