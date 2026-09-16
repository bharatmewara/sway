import React from 'react';
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

  return (
    <main className="main">
      <div className="topbar">
        <div className="row g-3 align-items-center">
          <div className="col-lg-auto col-12">
            <aside className="sidebar">
              <div className="sidebar-top me-md-5">
                <div className="logo"><img src="/img/logo-black.png" alt="SWAY logo" style={{height: 45}} /></div>
              
                <button className="menu-toggle" type="button" data-bs-toggle="collapse" title="toggler" data-bs-target="#multiCollapseExample2" aria-expanded="false" aria-controls="multiCollapseExample2">
                  <span className="icon-bar"><i className="bi bi-list"></i></span>
                </button>
              </div>

              <nav className="menu collapse navbar-collapse" id="multiCollapseExample2">
                {navItems.map(item => (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={location.pathname === item.path ? 'active' : ''}
                  >
                    <i className={`bi ${item.icon}`}></i> {item.label}
                    {item.badge && <span className="badge-dot">{item.badge > 99 ? '99+' : item.badge}</span>}
                  </Link>
                ))}
                <Link to="/crush" className={location.pathname === '/crush' ? 'active' : ''}>
                  <img src="/img/rose.svg" className="rose" alt="rose" style={{width: 16, marginRight: 5, verticalAlign: 'text-bottom'}} /> Crush
                </Link>
              </nav>

              <hr />

            </aside>
          </div>

          <div className="col-auto d-flex justify-content-xl-end align-items-center gap-3 ms-auto">
            <Link to="/purchase" className="connect_card py-2 px-2 text-decoration-none">
              Connect <b className="ms-2">{user?.connect_credits || 0}</b>
            </Link>
            <Link to="/notifications" className="icon-btn text-dark text-decoration-none">
              <i className="bi bi-bell"></i>
              {counts?.notifications > 0 && <span className="notify">{counts.notifications > 99 ? '99+' : counts.notifications}</span>}
            </Link>
            <Link to="/chats" className="icon-btn text-dark text-decoration-none">
              <i className="bi bi-chat"></i>
              {counts?.messages > 0 && <span className="notify">{counts.messages > 99 ? '99+' : counts.messages}</span>}
            </Link>
            
            <div className="d-flex align-items-center gap-2 dropdown-toggle" data-bs-toggle="dropdown" style={{cursor: 'pointer'}}>
              <div className="avatar">
                <img 
                  src={user?.profile_photo ? `http://localhost:5000${user.profile_photo}` : (user?.gender === 'female' ? '/img/girl.png' : '/img/boy.png')} 
                  style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} 
                  alt="avatar" 
                />
              </div>
              <div><b>{user?.username}</b><br /><small>{user?.is_premium ? 'Premium Member' : 'Standard Member'}</small></div>
            </div>
            
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
              <li><Link className="dropdown-item" to="/privacy"><i className="bi bi-gear me-2"></i> Settings</Link></li>
              <li>
                <button className="dropdown-item text-danger fw-bold" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-left me-2"></i> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid" style={{ maxWidth: 1200, margin: '0 auto', paddingTop: 30 }}>
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
