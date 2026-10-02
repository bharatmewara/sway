import React from 'react'
import { Link } from 'react-router-dom'
import PublicNavbar from '../../../components/PublicNavbar'
import Footer from '../../../components/Footer'
import './PrivacyPolicy.css'

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <PublicNavbar />

      {/* Header */}
      <section className="legal-hero text-center">
        <div className="container">
          <span className="badge-wine mb-3">Legal &amp; Privacy Transparency</span>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-subtitle">
            Version 1.0 &bull; Last Updated: October 2026
          </p>
        </div>
      </section>

      {/* Document Body */}
      <section className="legal-content py-5">
        <div className="container">
          <div className="legal-paper mx-auto p-4 p-md-5 bg-white rounded-4 shadow-sm border">
            
            <div className="legal-section">
              <h3>1. Introduction &amp; Commitment to Privacy</h3>
              <p>
                Welcome to <strong>SWAY</strong> ("we", "our", or "us"), operated at <code>swaydating.com</code>. We are deeply committed to safeguarding the confidentiality, dignity, and privacy of our members. This Privacy Policy details how we collect, process, protect, and handle your information when you access our platform, mobile web application, APIs, and associated services.
              </p>
              <p>
                By registering an account or accessing SWAY, you acknowledge that you have read and understood this Privacy Policy and agree to our collection and use of your information as described herein.
              </p>
            </div>

            <div className="legal-section">
              <h3>2. Information We Collect</h3>
              <p>
                To maintain a verified, high-trust community and operate our matchmaking and communication services, we collect only information that is strictly relevant:
              </p>
              <ul>
                <li>
                  <strong>Account Registration Information:</strong> Your chosen username, email address, salted password hash, declared biological gender, and date of birth (to enforce our strict 18+ age restriction).
                </li>
                <li>
                  <strong>Profile Information:</strong> Optional profile details you choose to furnish, including lifestyle attributes (education, profession, interests, smoking/drinking preferences), relationship expectations, nicknames, and bio descriptions.
                </li>
                <li>
                  <strong>Verification Selfie &amp; Biometric Signals:</strong> During our mandatory verification step, we capture a real-time live camera feed to extract facial landmarks and verify biological gender match and liveness. We do NOT collect government-issued identity cards, Aadhaar cards, or passports.
                </li>
                <li>
                  <strong>Approximate Location Data:</strong> General geographic coordinates (latitude and longitude) provided via your browser or device location services to compute proximity for nearby member discovery.
                </li>
                <li>
                  <strong>Communications &amp; Interactions:</strong> Chat messages, Private Messages, Likes, Crushes, Profile Visits, and Private Photo Access Requests exchanged within the platform.
                </li>
                <li>
                  <strong>Transaction &amp; Connect Records:</strong> Purchase history, Connect pack balances, transaction IDs, and payment statuses generated through our authorized payment processor (Razorpay). We do NOT store credit card numbers, CVVs, or bank net-banking passwords.
                </li>
                <li>
                  <strong>Technical &amp; Log Data:</strong> Device IP address, browser type, operating system, session timestamps, and error diagnostic logs used strictly to ensure platform stability and prevent malicious intrusion.
                </li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>3. Location Privacy &amp; Proximity Calculations</h3>
              <p>
                SWAY incorporates nearby discovery to connect you with verified individuals in your geographical vicinity. We adhere to rigorous location privacy practices:
              </p>
              <ul>
                <li>
                  <strong>No Exact Coordinate Sharing:</strong> Other users are <em>never</em> shown your exact GPS location, street address, or residential area. Only an approximate calculated distance (e.g., "Within 15 km") is presented.
                </li>
                <li>
                  <strong>Device-Level Permission:</strong> Location access is requested explicitly through your browser or device operating system. You retain the right to deny or revoke location access at any time through your device settings.
                </li>
                <li>
                  <strong>Location Freshness:</strong> Stored coordinates are periodically refreshed and only utilized for relative mathematical distance comparisons against discovery preferences.
                </li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>4. AI &amp; Biometric Live Selfie Verification Privacy</h3>
              <p>
                Authenticity is fundamental to our platform's safety. Our selfie verification adheres to the following safeguards:
              </p>
              <ul>
                <li>
                  <strong>Live Camera Only:</strong> We explicitly prohibit the upload of pre-existing gallery photos, screenshots, or third-party digital images during verification to eliminate synthetic media and catfishing.
                </li>
                <li>
                  <strong>Limited Purpose:</strong> Facial detection and liveness scoring are processed solely to verify biological gender conformity and ensure that each account corresponds to an actual living individual.
                </li>
                <li>
                  <strong>No Sale or Third-Party AI Training:</strong> Your verification biometric signals are never sold, leased, or utilized to train commercial generative AI models.
                </li>
                <li>
                  <strong>Internal Moderation Storage:</strong> Encrypted selfie snapshots are retained internally in secure, access-controlled storage solely to verify identity integrity, prevent banned members from re-registering, and resolve trust &amp; safety disputes.
                </li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>5. Communication &amp; Privacy Controls</h3>
              <p>
                SWAY equips every member with granular privacy tools designed to place you in absolute control of your digital presence:
              </p>
              <ul>
                <li>
                  <strong>Face Blur Feature:</strong> Members can enable one-tap photo blurring to obscure their primary avatar on public discovery feeds.
                </li>
                <li>
                  <strong>Social Link Shielding:</strong> Your Instagram, Facebook, and Telegram handles remain hidden by default unless you explicitly toggle visibility in Privacy Settings.
                </li>
                <li>
                  <strong>Female Permission Authority:</strong> Verified female members possess exclusive controls to grant or revoke social links and contact access on a connection-by-connection basis.
                </li>
                <li>
                  <strong>Locked Private Photos:</strong> Private album photos remain locked behind our Private Photo Request system. No member can view private photos without your explicit authorization.
                </li>
                <li>
                  <strong>Session-Based Chats:</strong> Live chats operate in controlled sessions with automated expiration after periods of inactivity, preventing unattended message accumulation.
                </li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>6. Data Security Practices</h3>
              <p>
                We implement robust technical and organizational security measures to protect your personal data against unauthorized access, loss, alteration, or disclosure:
              </p>
              <ul>
                <li>All data in transit is encrypted using modern Transport Layer Security (TLS 1.3 / HTTPS).</li>
                <li>All user passwords are encrypted using salted one-way hashing algorithms (bcrypt).</li>
                <li>Database servers and backend processes are hosted within secure, firewall-protected virtual private server infrastructure with isolated ports and regular security updates.</li>
              </ul>
              <p className="text-muted small">
                <em>Disclaimer:</em> While we implement industry-standard commercial safeguards, no electronic transmission over the internet or computer storage method can be guaranteed 100% invulnerable against unforeseen zero-day events.
              </p>
            </div>

            <div className="legal-section">
              <h3>7. Third-Party Service Providers</h3>
              <p>
                We only engage trusted third-party providers necessary for operational execution:
              </p>
              <ul>
                <li>
                  <strong>Payment Gateways:</strong> We partner with Razorpay to process payments for Connect packages. Razorpay is certified PCI-DSS Level 1 compliant. Your financial card details are handled directly by Razorpay under their independent privacy policy.
                </li>
                <li>
                  <strong>Hosting &amp; Infrastructure:</strong> Our servers are hosted on enterprise cloud infrastructure located in compliant, certified data center facilities.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> We may disclose information if required to comply with a valid court order, governmental subpoena, or mandatory statutory law enforcement inquiry.
                </li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>8. Your Rights &amp; Data Control</h3>
              <p>
                As a valued member, you possess clear rights regarding your personal information:
              </p>
              <ul>
                <li><strong>Access &amp; Review:</strong> You can review your profile information, activity history, and Connect balance anytime within the application.</li>
                <li><strong>Correction &amp; Modification:</strong> You can update or modify your bio, lifestyle preferences, photos, and privacy toggles directly from your profile settings.</li>
                <li><strong>Account Deletion:</strong> You have the right to request permanent account termination. Upon confirmed deletion, your profile is removed from active discovery and your stored personal data is purged in accordance with our data retention schedule.</li>
                <li><strong>Instant Blocking:</strong> You can block any member at will, immediately terminating mutual visibility and messaging capabilities.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h3>9. Policy Updates &amp; Versioning</h3>
              <p>
                We reserve the right to revise this Privacy Policy periodically to reflect technological advancements, legal amendments, or platform enhancements. When material updates are introduced, we will update the version number (currently <strong>Version 1.0</strong>) and notify registered users via in-app notification or email. Continued use of SWAY following notification constitutes acceptance of the amended terms.
              </p>
            </div>

            <div className="legal-section mb-0">
              <h3>10. Contacting Us</h3>
              <p>
                If you have inquiries, concerns, or requests regarding this Privacy Policy or your personal data handling, please reach out to our dedicated Privacy &amp; Grievance Officer:
              </p>
              <div className="contact-card p-3 rounded-3 bg-light border">
                <strong>SWAY Privacy &amp; Data Protection Team</strong><br />
                Email: <a href="mailto:privacy@swaydating.com" className="text-wine">privacy@swaydating.com</a><br />
                General Support: <a href="mailto:support@swaydating.com" className="text-wine">support@swaydating.com</a><br />
                Website: <a href="https://swaydating.com" className="text-wine">https://swaydating.com</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
