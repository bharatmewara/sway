import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatPopup from './ChatPopup';

export default function DashboardLayout({ children }) {
  const { user, logout, counts, activeChatUserId, setActiveChatUserId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/home', icon: 'bi-house', label: 'Home' },
    { path: '/profile', icon: 'bi-person-circle', label: 'My Profile' },
    { path: '/chats', icon: 'bi-chat-square', label: 'Private Messages', badge: counts?.messages > 0 ? counts.messages : null },
    { path: '/requests', icon: 'bi-person', label: 'Requests', badge: counts?.requests > 0 ? counts.requests : null },
    { path: '/visitors', icon: 'bi-eye', label: 'Visitors' },
    { path: '/search', icon: 'bi-search', label: 'Search' },
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="main">
      <div className="topbar">
        <div className="row g-3 align-items-center">
          <div className="col-lg-auto col-12">
            <aside className="sidebar">
              <div className="sidebar-top me-md-5">
                <Link to="/home" className="logo text-decoration-none">
                  <img src="/img/logo-black.png" alt="SWAY logo" style={{ height: 50 }} />
                </Link>
              
                <button 
                  className="menu-toggle" 
                  type="button" 
                  onClick={() => setMobileMenuOpen(prev => !prev)}
                  title="toggler"
                >
                  <span className="icon-bar"><i className="bi bi-list"></i></span>
                </button>
              </div>

              <nav className={`menu navbar-collapse ${mobileMenuOpen ? 'show d-flex flex-wrap' : ''}`} id="multiCollapseExample2">
                {navItems.map(item => (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={location.pathname === item.path ? 'active' : ''}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <i className={`bi ${item.icon}`}></i> {item.label}
                    {item.badge ? <span className="badge-dot">{item.badge > 99 ? '99+' : item.badge}</span> : null}
                  </Link>
                ))}
                <Link 
                  to="/crush" 
                  className={location.pathname === '/crush' ? 'active' : ''}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img src="/img/rose.svg" className="rose" alt="rose" style={{ width: 18, height: 20, margin: '0 auto 2px', display: 'block' }} /> Crush
                </Link>
              </nav>

              <hr />

            </aside>
          </div>

          <div className="col-auto d-flex justify-content-xl-end align-items-center gap-3 ms-auto">
            <Link to="/purchase" className="connect_card py-2 px-2 text-decoration-none text-dark">
              Connect <b className="ms-2 text-danger">{user?.connect_credits || 14}</b>
            </Link>
            <Link to="/notifications" className="icon-btn text-dark text-decoration-none">
              <i className="bi bi-bell"></i>
              {(counts?.notifications > 0 ? counts.notifications : 3) && (
                <span className="notify">{counts?.notifications > 0 ? (counts.notifications > 99 ? '99+' : counts.notifications) : 3}</span>
              )}
            </Link>
            <Link to="/chats" className="icon-btn text-dark text-decoration-none">
              <i className="bi bi-chat"></i>
              {(counts?.messages > 0 ? counts.messages : 1) && (
                <span className="notify">{counts?.messages > 0 ? (counts.messages > 99 ? '99+' : counts.messages) : 1}</span>
              )}
            </Link>
            
            <div className="position-relative">
              <div 
                className="d-flex align-items-center gap-2 dropdown-toggle" 
                style={{ cursor: 'pointer' }}
                onClick={() => setDropdownOpen(prev => !prev)}
              >
                <div className="avatar" style={{ overflow: 'hidden' }}>
                  <img 
                    src={user?.profile_photo?.startsWith('http') || user?.profile_photo?.startsWith('/') ? user.profile_photo : (user?.profile_photo ? `http://localhost:5000${user.profile_photo}` : (user?.gender === 'female' ? '/img/girl.png' : '/img/profile-man.png'))} 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                    alt="avatar" 
                  />
                </div>
                <div className="d-none d-sm-block text-start">
                  <b>{user?.username || 'Michael Brown'}</b><br />
                  <small className="text-muted">{user?.is_premium ? 'Premium Member' : 'Standard Member'}</small>
                </div>
              </div>
              
              {dropdownOpen && (
                <ul className="dropdown-menu dropdown-menu-end shadow-sm border show position-absolute end-0 mt-2" style={{ zIndex: 1050 }}>
                  <li><Link className="dropdown-item" to="/profile" onClick={() => setDropdownOpen(false)}><i className="bi bi-person me-2"></i> My Profile</Link></li>
                  <li><Link className="dropdown-item" to="/settings/account" onClick={() => setDropdownOpen(false)}><i className="bi bi-gear me-2"></i> Settings</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger fw-bold" onClick={() => { setDropdownOpen(false); handleLogout(); }}>
                      <i className="bi bi-box-arrow-left me-2"></i> Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid px-2 px-md-3" style={{ maxWidth: 1400, margin: '0 auto' }}>
          {children}
        </div>
      </section>
      
      {/* Global Chat Popup */}
      {activeChatUserId && (
        <ChatPopup 
          userId={activeChatUserId} 
          onClose={() => setActiveChatUserId(null)} 
        />
      )}
    </main>
  );
}
