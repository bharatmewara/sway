import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatPopup from './ChatPopup';
import InsufficientConnectsModal from './InsufficientConnectsModal';
import './DashboardLayout.css';

export default function DashboardLayout({ children }) {
  const { user, logout, counts, activeChatUserId, setActiveChatUserId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isFemale = (user?.verified_gender || user?.gender) === 'female' || user?.connect_required_for_chat === false;

  const navItems = [
    { path: '/home',          icon: 'bi-house',         label: 'Home' },
    { path: '/profile',       icon: 'bi-person-circle', label: 'Profile' },
    { path: '/private-chats', icon: 'bi-envelope',      label: 'Private Messages', badge: counts?.messages > 0 ? counts.messages : null },
    { path: '/requests',      icon: 'bi-images',        label: 'Private Photo Requests', badge: counts?.requests > 0 ? counts.requests : null },
    { path: '/visitors',      icon: 'bi-eye',           label: 'Visitors' },
    { path: '/search',        icon: 'bi-search',        label: 'Search' },
  ];

  // Mobile bottom-nav items (5 essential shortcuts)
  const mobileNav = [
    { path: '/home',          icon: 'bi-house-fill',  label: 'Home' },
    { path: '/chat',          icon: 'bi-chat-dots',   label: 'Chat', badge: counts?.messages },
    { path: '/requests',      icon: 'bi-images',      label: 'Photo Req', badge: counts?.requests },
    { path: '/crush',         icon: null,             label: 'Crush',    rose: true },
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const defaultAvatar = user?.gender === 'female' ? '/img/girl.png' : '/img/profile-man.png';
  const avatarSrc = user?.profile_photo
    ? (user.profile_photo.startsWith('http') || user.profile_photo.startsWith('/') || user.profile_photo.startsWith('data:') ? user.profile_photo : `/${user.profile_photo}`)
    : defaultAvatar;

  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = defaultAvatar;
  };

  return (
    <div className="main">
      {/* ── TOPBAR ── */}
      <header className="topbar">
        <div className="topbar-inner">
          {/* Left: Brand + Desktop Nav */}
          <div className="topbar-left">
            <button
              className="menu-toggle"
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
              title="Menu"
            >
              <i className="bi bi-list" />
            </button>

            <Link to="/home" className="logo">
              <img src="/img/logo-black.png" alt="SWAY" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="desktop-menu" aria-label="Main Navigation">
              {navItems.map(item => {
                const isActive = location.pathname === item.path ||
                  (item.path === '/private-chats' && (
                    location.pathname.startsWith('/private-chats') ||
                    location.pathname.startsWith('/messages')
                  )) ||
                  (item.path === '/chat' && (
                    location.pathname === '/chat' ||
                    location.pathname.startsWith('/chat/') ||
                    location.pathname.startsWith('/chats')
                  ));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={isActive ? 'active' : ''}
                  >
                    <i className={`bi ${item.icon}`} />
                    <span>{item.label}</span>
                    {item.badge ? <span className="badge-dot">{item.badge > 99 ? '99+' : item.badge}</span> : null}
                  </Link>
                );
              })}
              <Link
                to="/crush"
                className={location.pathname === '/crush' ? 'active' : ''}
              >
                <img src="/img/rose.svg" className="rose" alt="" />
                <span>Crush</span>
              </Link>
            </nav>
          </div>

          {/* Right: Credits, Notifications, User Profile */}
          <div className="topbar-right">
            {isFemale ? (
              <span className="connect-pill" title="Verified profile — Free Chat & Private Messages">
                <i className="bi bi-gift-fill text-danger" />
                <span>Free Chat</span>
              </span>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link
                  to={`/purchase-connect?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
                  className="connect-pill"
                  title="Your Connect Balance"
                >
                  <i className="bi bi-lightning-charge-fill text-danger" />
                  <span>Connects:</span>
                  <span className="credit-num">{user?.connect_credits ?? 0}</span>
                </Link>
                <Link
                  to={`/purchase-connect?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
                  className="btn btn-sm btn-danger rounded-pill px-3 py-1 fw-semibold d-none d-sm-inline-flex align-items-center"
                  style={{ fontSize: 12 }}
                >
                  <i className="bi bi-plus-circle me-1" /> Buy Connects
                </Link>
              </div>
            )}

            <Link to="/notifications" className="icon-btn" title="Notifications" aria-label="Notifications">
              <i className="bi bi-bell" />
              {counts?.notifications > 0 && (
                <span className="notify">{counts.notifications > 99 ? '99+' : counts.notifications}</span>
              )}
            </Link>

            <Link to="/private-chats" className="icon-btn" title="Private Messages" aria-label="Private Messages">
              <i className="bi bi-chat" />
              {counts?.messages > 0 && (
                <span className="notify">{counts.messages > 99 ? '99+' : counts.messages}</span>
              )}
            </Link>

            {/* User Dropdown */}
            <div className="position-relative" ref={dropdownRef}>
              <div
                className="topbar-user"
                onClick={() => setDropdownOpen(prev => !prev)}
                role="button"
                tabIndex={0}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <div className="avatar">
                  <img
                    src={avatarSrc}
                    onError={handleImgError}
                    alt={user?.username || 'user'}
                  />
                </div>
                <div className="d-none d-lg-block text-start lh-1">
                  <div className="fw-semibold text-dark" style={{ fontSize: 13 }}>
                    {user?.username || user?.email?.split('@')[0] || 'Member'}
                  </div>
                  <small className="text-muted" style={{ fontSize: 11 }}>
                    {isFemale ? 'Verified profile' : `Connects: ${user?.connect_credits ?? 0}`}
                  </small>
                </div>
                <i className="bi bi-chevron-down text-muted d-none d-lg-block" style={{ fontSize: 11 }} />
              </div>

              {dropdownOpen && (
                <div className="user-dropdown">
                  <Link className="dropdown-item" to="/profile">
                    <i className="bi bi-person text-danger" />
                    <span>My Profile</span>
                  </Link>
                  <Link className="dropdown-item" to="/settings/privacy">
                    <i className="bi bi-shield-lock text-danger" />
                    <span>Privacy Controls</span>
                  </Link>
                  <Link className="dropdown-item" to="/settings/account">
                    <i className="bi bi-gear" />
                    <span>Settings</span>
                  </Link>
                  {!isFemale && (
                    <Link className="dropdown-item" to="/purchase-connect">
                      <i className="bi bi-coin text-warning" />
                      <span>Buy Connects</span>
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item text-danger fw-semibold" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-left" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE SLIDE-OVER DRAWER MENU ── */}
      <div
        className={`mobile-drawer-overlay ${mobileDrawerOpen ? 'open' : ''}`}
        onClick={() => setMobileDrawerOpen(false)}
      />
      <aside className={`mobile-drawer ${mobileDrawerOpen ? 'open' : ''}`} aria-hidden={!mobileDrawerOpen}>
        <div className="mobile-drawer-header">
          <img src="/img/logo-black.png" alt="SWAY" style={{ height: 38 }} />
          <button
            className="btn btn-sm btn-light rounded-circle p-2 lh-1"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close menu"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <nav className="mobile-drawer-nav">
          {navItems.map(item => {
            const isActive = location.pathname === item.path ||
              (item.path === '/chats' && (
                location.pathname.startsWith('/chats') ||
                location.pathname.startsWith('/private-chats') ||
                location.pathname.startsWith('/message-details') ||
                location.pathname.startsWith('/chat') ||
                location.pathname.startsWith('/messages')
              ));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={isActive ? 'active' : ''}
                onClick={() => setMobileDrawerOpen(false)}
              >
                <i className={`bi ${item.icon}`} />
                <span>{item.label}</span>
                {item.badge ? <span className="badge bg-danger rounded-pill ms-auto">{item.badge}</span> : null}
              </Link>
            );
          })}
          <Link
            to="/crush"
            className={location.pathname === '/crush' ? 'active' : ''}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <img src="/img/rose.svg" style={{ width: 20, height: 20 }} alt="" />
            <span>Crush</span>
          </Link>
          <div className="dropdown-divider my-2" />
          {!isFemale && (
            <Link
              to="/purchase-connect"
              className={location.pathname === '/purchase-connect' ? 'active' : ''}
              onClick={() => setMobileDrawerOpen(false)}
            >
              <i className="bi bi-lightning-charge text-danger" />
              <span>Buy Connects</span>
            </Link>
          )}
          <Link
            to="/settings/privacy"
            className={location.pathname === '/settings/privacy' ? 'active' : ''}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <i className="bi bi-shield-lock text-danger" />
            <span>Privacy Controls</span>
          </Link>
          <Link
            to="/settings/account"
            className={location.pathname === '/settings/account' ? 'active' : ''}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <i className="bi bi-gear" />
            <span>Settings</span>
          </Link>
          <button className="dropdown-item text-danger fw-semibold mt-2" onClick={handleLogout}>
            <i className="bi bi-box-arrow-left" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="content">
        <div className="container-fluid p-0" style={{ maxWidth: 1400, margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {mobileNav.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path === '/chats' && (
              location.pathname.startsWith('/chats') ||
              location.pathname.startsWith('/private-chats') ||
              location.pathname.startsWith('/message-details') ||
              location.pathname.startsWith('/chat') ||
              location.pathname.startsWith('/messages')
            ));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              {item.rose
                ? <img src="/img/rose.svg" className="mobile-rose" alt="" />
                : <i className={`bi ${item.icon}`} />
              }
              {item.badge > 0 && <span className="mobile-badge">{item.badge > 99 ? '99+' : item.badge}</span>}
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
        <Link to="/profile" className={`mobile-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
          <div className="mobile-avatar">
            <img src={avatarSrc} onError={handleImgError} alt="" />
          </div>
          <span className="mobile-nav-label">Me</span>
        </Link>
      </nav>

      {/* ── GLOBAL CHAT POPUP ── */}
      {activeChatUserId && (
        <ChatPopup
          userId={activeChatUserId}
          onClose={() => setActiveChatUserId(null)}
        />
      )}

      {/* ── INSUFFICIENT CONNECTS POPUP ── */}
      <InsufficientConnectsModal />
    </div>
  );
}
