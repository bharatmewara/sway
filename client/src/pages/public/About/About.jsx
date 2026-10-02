import React from 'react'
import { Link } from 'react-router-dom'
import PublicNavbar from '../../../components/PublicNavbar'
import Footer from '../../../components/Footer'
import './About.css'

export default function About() {
  return (
    <div className="about-page">
      <PublicNavbar />

      {/* Hero Banner */}
      <section className="about-hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8 mx-auto text-center">
              <span className="badge-wine mb-3">About SWAY</span>
              <h1 className="about-title">
                Where Genuine Privacy Meets <span>Authentic Connection</span>
              </h1>
              <p className="about-subtitle">
                SWAY is an AI-verified, privacy-first social platform designed for adults who value discretion, dignity, and real human chemistry without compromising their digital safety.
              </p>
              <div className="d-flex justify-content-center gap-3 mt-4">
                <Link to="/register" className="btn btn-wine">
                  Join Verified Members <i className="bi bi-arrow-right ms-1" />
                </Link>
                <a href="#what-we-do" className="btn btn-outline-custom">
                  Explore Features
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Who We Are */}
      <section className="about-section py-5">
        <div className="container">
          <div className="row g-5 align-items-center">
            <div className="col-lg-6">
              <div className="about-card p-4 p-md-5">
                <span className="section-tag">Who We Are</span>
                <h2 className="section-heading mb-4">
                  A Safe, Verified Sanctuary for Intentional Connections
                </h2>
                <p className="text-secondary leading-relaxed">
                  Traditional social and dating apps are overwhelmed by bots, catfish profiles, commercial spammers, and casual anonymity that erodes trust. SWAY was founded on a simple yet unyielding principle: <strong>privacy and authenticity are not mutually exclusive</strong>.
                </p>
                <p className="text-secondary leading-relaxed">
                  We engineered SWAY for modern, discerning adults—individuals who value discretion, emotional maturity, and mutual respect. Whether you are rediscovering romance, seeking private conversations, or looking for a meaningful friendship with someone who understands your lifestyle, SWAY creates the safe space you need.
                </p>
                <div className="about-highlights mt-4">
                  <div className="highlight-item">
                    <i className="bi bi-shield-check text-wine" />
                    <div>
                      <strong>100% Biometrically Verified</strong>
                      <p className="small text-muted mb-0">Every member completes live camera face &amp; gender verification.</p>
                    </div>
                  </div>
                  <div className="highlight-item mt-3">
                    <i className="bi bi-eye-slash text-wine" />
                    <div>
                      <strong>Zero Digital Exposure</strong>
                      <p className="small text-muted mb-0">No Aadhaar or Government ID cards required. Your personal life remains strictly yours.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="about-visual-box text-center">
                <div className="stat-grid">
                  <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-person-check-fill" /></div>
                    <h3>100%</h3>
                    <p>Live Verified Profiles</p>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-incognito" /></div>
                    <h3>0 ID</h3>
                    <p>No Govt Document Stored</p>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-chat-heart-fill" /></div>
                    <h3>1-on-1</h3>
                    <p>Discreet Encrypted Chat</p>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><i className="bi bi-geo-alt-fill" /></div>
                    <h3>Smart</h3>
                    <p>Nearby Discovery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: What We Do */}
      <section id="what-we-do" className="about-section bg-light-wine py-5">
        <div className="container">
          <div className="text-center max-w-700 mx-auto mb-5">
            <span className="section-tag">What We Do</span>
            <h2 className="section-heading">Core Platform Features Built Around Your Discretion</h2>
            <p className="text-secondary">
              Every feature on SWAY has been designed with precision to give you complete control over who contacts you, how you connect, and what information you share.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className="feature-box h-100">
                <div className="feature-icon-circle"><i className="bi bi-camera-video" /></div>
                <h4>Live Selfie &amp; Gender Verification</h4>
                <p>Real-time facial detection and gender matching using device cameras prevents catfishing and impersonation without collecting government identity documents.</p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="feature-box h-100">
                <div className="feature-icon-circle"><i className="bi bi-compass" /></div>
                <h4>Discreet Nearby Discovery</h4>
                <p>Discover verified members in your city or region based on approximate distance in kilometers. Your exact GPS coordinates and address are never revealed.</p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="feature-box h-100">
                <div className="feature-icon-circle"><i className="bi bi-heart-pulse" /></div>
                <h4>Likes &amp; Mutual Crushes</h4>
                <p>Send discreet Likes and special Crushes to profiles that capture your attention. When interest is mutual, a Match is formed instantly with reciprocal consent.</p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="feature-box h-100">
                <div className="feature-icon-circle"><i className="bi bi-chat-dots" /></div>
                <h4>Session-Based Live Chat</h4>
                <p>Engage in focused, real-time messaging powered by WebSockets. Chat sessions are structured and respectful, giving both participants peace of mind.</p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="feature-box h-100">
                <div className="feature-icon-circle"><i className="bi bi-envelope-paper-heart" /></div>
                <h4>Private Messages</h4>
                <p>Direct communication designed for deeper conversations with female privacy protections and transparent Connect-based male initiation.</p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="feature-box h-100">
                <div className="feature-icon-circle"><i className="bi bi-images" /></div>
                <h4>Private Photo Requests</h4>
                <p>Keep sensitive photos strictly locked. Other members must submit a formal access request, and you decide whether to grant or deny viewing permission.</p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="feature-box h-100">
                <div className="feature-icon-circle"><i className="bi bi-sliders" /></div>
                <h4>Granular Social Privacy</h4>
                <p>Choose whether your Instagram, Facebook, Telegram, or phone number are visible. Women have dedicated permissions to approve social access individually.</p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="feature-box h-100">
                <div className="feature-icon-circle"><i className="bi bi-shield-slash" /></div>
                <h4>Instant Block &amp; Report</h4>
                <p>One-tap blocking completely severs contact, visibility, and messaging across the entire app. Our administrative team swiftly reviews all reported infractions.</p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="feature-box h-100">
                <div className="feature-icon-circle"><i className="bi bi-lightning-charge" /></div>
                <h4>Transparent Connects</h4>
                <p>Simple, pay-as-you-go Connect packs for male members ensure high intent and courteous interactions, with zero hidden monthly recurring subscriptions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Our Mission */}
      <section className="about-section py-5">
        <div className="container">
          <div className="mission-card p-4 p-md-5 text-center max-w-900 mx-auto">
            <span className="section-tag">Our Mission</span>
            <h2 className="section-heading text-white mb-3">Empowering Dignified, Trustworthy Connections</h2>
            <p className="mission-text">
              Our mission is to foster meaningful relationships built on verified human identity, genuine chemistry, and unmatched personal security. We believe every individual deserves the freedom to connect without the fear of judgment, spam, extortion, or privacy leaks.
            </p>
            <div className="d-flex justify-content-center flex-wrap gap-4 mt-4">
              <div className="mission-pill"><i className="bi bi-check2-circle me-1" /> Respect &amp; Consent</div>
              <div className="mission-pill"><i className="bi bi-check2-circle me-1" /> Zero False Profiles</div>
              <div className="mission-pill"><i className="bi bi-check2-circle me-1" /> Privacy by Architecture</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Safety & Privacy */}
      <section className="about-section bg-light-wine py-5">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <span className="section-tag">Safety &amp; Compliance</span>
              <h2 className="section-heading mb-3">Your Security Is Non-Negotiable</h2>
              <p className="text-secondary">
                From photo blurring to end-to-end HTTPS encryption, your comfort is woven into every screen of the SWAY platform. We encourage all members to review our legal commitments:
              </p>
              <div className="d-flex flex-column gap-3 mt-4">
                <Link to="/privacy-policy" className="legal-link-card">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-1 text-dark fw-bold"><i className="bi bi-file-earmark-lock me-2 text-wine" />Privacy Policy</h6>
                      <small className="text-muted">How we collect, protect, and respect your personal information.</small>
                    </div>
                    <i className="bi bi-chevron-right text-wine" />
                  </div>
                </Link>
                <Link to="/terms-and-conditions" className="legal-link-card">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-1 text-dark fw-bold"><i className="bi bi-journal-text me-2 text-wine" />Terms &amp; Conditions</h6>
                      <small className="text-muted">Platform guidelines, communication rules, and community standards.</small>
                    </div>
                    <i className="bi bi-chevron-right text-wine" />
                  </div>
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="safety-checklist p-4 p-md-5 rounded-4 bg-white shadow-sm border">
                <h5 className="fw-bold mb-3 text-dark">Our Safety Principles</h5>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                  <li className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-success mt-1" />
                    <span className="small text-secondary"><strong>Live Camera Only:</strong> We prohibit static photo uploads during verification to stop deepfakes.</span>
                  </li>
                  <li className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-success mt-1" />
                    <span className="small text-secondary"><strong>No Raw GPS Sharing:</strong> Other users only see approximate distance in kilometers.</span>
                  </li>
                  <li className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-success mt-1" />
                    <span className="small text-secondary"><strong>Strict Anti-Harassment:</strong> Zero tolerance for abuse with permanent hardware/IP bans.</span>
                  </li>
                  <li className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-success mt-1" />
                    <span className="small text-secondary"><strong>Secure Payment Processing:</strong> Payments handled via PCI-DSS certified gateway (Razorpay).</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="about-cta py-5 text-center">
        <div className="container">
          <h2 className="fw-bold text-white mb-3">Ready to Experience Connection with Complete Discretion?</h2>
          <p className="text-white-50 mb-4 max-w-600 mx-auto">
            Join verified, like-minded individuals in an environment engineered for your peace of mind.
          </p>
          <Link to="/register" className="btn btn-wine btn-lg px-5">
            Create Your Private Profile <i className="bi bi-arrow-right ms-2" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
