import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="contact" className="py-5" style={{ background: '#0a0a0a', color: '#e0e0e0', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <div className="container">
        <div className="row g-4 justify-content-between">
          {/* Brand Info */}
          <div className="col-lg-4 col-md-6">
            <Link to="/" className="d-inline-block logo mb-3 text-decoration-none">
              <img src="/img/logo.png" alt="SWAY Logo" style={{ height: 46, objectFit: 'contain' }} />
            </Link>
            <p className="text-secondary small leading-relaxed pe-lg-4">
              SWAY is an AI-verified private social platform designed for adults who value discretion, dignity, and real human chemistry. Experience authentic connections with zero fake profiles.
            </p>
            <div className="d-flex align-items-center gap-2 mt-3">
              <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50 px-3 py-1 rounded-pill small">
                <i className="bi bi-shield-check me-1" /> 100% Live Verified
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-3 col-6">
            <h6 className="text-white fw-bold mb-3 text-uppercase tracking-wider" style={{ fontSize: '0.85rem' }}>
              Explore
            </h6>
            <ul className="footer_manu list-unstyled p-0 m-0 d-flex flex-column gap-2 small">
              <li>
                <Link to="/" className="text-secondary text-decoration-none hover-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-secondary text-decoration-none hover-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-secondary text-decoration-none hover-white">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-secondary text-decoration-none hover-white">
                  Member Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-secondary text-decoration-none hover-white">
                  Get Verified
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Safety */}
          <div className="col-lg-3 col-md-3 col-6">
            <h6 className="text-white fw-bold mb-3 text-uppercase tracking-wider" style={{ fontSize: '0.85rem' }}>
              Legal &amp; Privacy
            </h6>
            <ul className="footer_manu list-unstyled p-0 m-0 d-flex flex-column gap-2 small">
              <li>
                <Link to="/privacy-policy" className="text-secondary text-decoration-none hover-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="text-secondary text-decoration-none hover-white">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/about#what-we-do" className="text-secondary text-decoration-none hover-white">
                  Security &amp; Verification
                </Link>
              </li>
              <li>
                <a href="mailto:privacy@swaydating.com" className="text-secondary text-decoration-none hover-white">
                  Privacy Inquiries
                </a>
              </li>
            </ul>
          </div>

          {/* Support & Community */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3 text-uppercase tracking-wider" style={{ fontSize: '0.85rem' }}>
              Support &amp; Inquiries
            </h6>
            <p className="text-secondary small mb-3">
              Need assistance or have feedback regarding your experience? Reach our dedicated team anytime:
            </p>
            <a
              href="mailto:support@swaydating.com"
              className="btn btn-sm btn-outline-light rounded-pill px-3 py-2 fw-semibold d-inline-flex align-items-center mb-3"
            >
              <i className="bi bi-envelope-heart me-2" /> support@swaydating.com
            </a>
            <div className="d-flex gap-3 social_media">
              <a href="https://swaydating.com" aria-label="SWAY Platform" className="text-secondary hover-white">
                <i className="bi bi-globe2 fs-5" />
              </a>
              <a href="mailto:support@swaydating.com" aria-label="Email Support" className="text-secondary hover-white">
                <i className="bi bi-envelope fs-5" />
              </a>
              <a href="mailto:legal@swaydating.com" aria-label="Legal Inquiries" className="text-secondary hover-white">
                <i className="bi bi-shield-lock fs-5" />
              </a>
            </div>
          </div>
        </div>

        <hr className="my-4 border-secondary border-opacity-25" />

        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between small text-secondary gap-2">
          <div>
            &copy; {new Date().getFullYear()} SWAY (swaydating.com). All rights reserved.
          </div>
          <div className="d-flex gap-3">
            <Link to="/terms-and-conditions" className="text-secondary text-decoration-none hover-white">
              Terms
            </Link>
            <span>&bull;</span>
            <Link to="/privacy-policy" className="text-secondary text-decoration-none hover-white">
              Privacy
            </Link>
            <span>&bull;</span>
            <Link to="/faq" className="text-secondary text-decoration-none hover-white">
              FAQ
            </Link>
            <span>&bull;</span>
            <Link to="/about" className="text-secondary text-decoration-none hover-white">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
