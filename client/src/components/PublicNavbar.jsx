import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './PublicNavbar.css'

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/about' },
    { label: 'FAQs', path: '/faq' },
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Terms & Conditions', path: '/terms-and-conditions' },
  ]

  return (
    <>
      <nav className="public-navbar fixed-top">
        <div className="container public-navbar-inner">
          {/* Brand Logo */}
          <Link className="public-navbar-brand" to="/" aria-label="SWAY Home">
            <img src="/img/logo.png" alt="SWAY" className="public-navbar-logo" />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="public-desktop-links d-none d-lg-flex">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`public-nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Action Buttons */}
          <div className="public-desktop-actions d-none d-lg-flex align-items-center gap-2">
            <Link className="btn btn-outline-light btn-sm px-3 py-2 fw-semibold" to="/login">
              Log In
            </Link>
            <Link className="btn btn-wine btn-sm px-3 py-2 fw-semibold" to="/register">
              Register <i className="bi bi-arrow-right ms-1" />
            </Link>
          </div>

          {/* Mobile Right Controls: Fast Login & Hamburger Toggle */}
          <div className="public-mobile-controls d-flex d-lg-none align-items-center gap-2">
            <Link to="/login" className="btn btn-sm btn-outline-light px-2 py-1 mobile-quick-login">
              Log In
            </Link>
            <Link to="/register" className="btn btn-sm btn-wine px-2 py-1 mobile-quick-register">
              Register
            </Link>
            <button
              className="public-mobile-toggler"
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="public-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <div
        className={`public-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="drawer-header d-flex align-items-center justify-content-between p-3 border-bottom border-dark">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="drawer-brand">
            <img src="/img/logo.png" alt="SWAY" style={{ height: 36 }} />
          </Link>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="drawer-body p-3">
          <ul className="drawer-nav-list list-unstyled mb-4">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <li key={item.path} className="mb-2">
                  <Link
                    to={item.path}
                    className={`drawer-nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{item.label}</span>
                    <i className="bi bi-chevron-right small text-muted" />
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="drawer-actions d-flex flex-column gap-2 mt-4 pt-3 border-top border-secondary border-opacity-25">
            <Link
              to="/register"
              className="btn btn-wine w-100 py-2 fw-semibold text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Account <i className="bi bi-arrow-right ms-1" />
            </Link>
            <Link
              to="/login"
              className="btn btn-outline-light w-100 py-2 fw-semibold text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log In to SWAY
            </Link>
          </div>

          <div className="drawer-footer mt-4 pt-3 text-center text-muted small border-top border-secondary border-opacity-10">
            <p className="mb-1 fw-semibold text-white-50">SWAY &bull; Private Verified Connections</p>
            <p className="mb-0" style={{ fontSize: 11 }}>Live AI Biometric &amp; Gender Verification</p>
          </div>
        </div>
      </div>
    </>
  )
}
