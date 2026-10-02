import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../../components/PublicNavbar';
import Footer from '../../../components/Footer';
import './Landing.css';

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(0); // First FAQ open by default

  const toggleFaq = (index) => {
    setOpenFaq(prev => (prev === index ? -1 : index));
  };

  const keyValues = [
    {
      icon: 'bi-people-fill',
      title: 'Genuine Connections',
      desc: 'Connect with real, verified adults seeking meaningful conversation, mutual chemistry, and discretion.',
    },
    {
      icon: 'bi-shield-lock-fill',
      title: 'Privacy First',
      desc: 'You hold absolute authority over your photos, phone number, and social media handles at all times.',
    },
    {
      icon: 'bi-person-check-fill',
      title: 'User Safety',
      desc: 'Multi-layer defense with live camera biometric verification, one-tap blocking, and 24/7 administrative oversight.',
    },
    {
      icon: 'bi-lightning-charge-fill',
      title: 'Transparent Experience',
      desc: 'Clear, predictable Connect costs for male members and full communication exemptions for verified women.',
    },
    {
      icon: 'bi-compass-fill',
      title: 'Better Discovery',
      desc: 'Explore nearby members by approximate distance in kilometers without ever exposing your exact coordinates.',
    },
    {
      icon: 'bi-hand-thumbs-up-fill',
      title: 'Respect & Control',
      desc: 'Strict community standards that foster courteous, non-judgmental, and mutually consensual relationships.',
    },
  ];

  const testimonials = [
    {
      name: 'Rohit S.',
      location: 'Mumbai',
      tag: 'Verified Member',
      avatar: 'R',
      quote: 'The live selfie check took just 10 seconds, but it makes a world of difference. You know everyone you talk with is a real human, not a bot or stolen profile picture.',
    },
    {
      name: 'Ananya M.',
      location: 'Bangalore',
      tag: 'Verified Female Member',
      avatar: 'A',
      quote: 'I love that my exact address is never displayed—just general kilometers. Having full control over who can see my private photos and social handles is exactly what I wanted.',
    },
    {
      name: 'Sameer K.',
      location: 'Delhi NCR',
      tag: 'Verified Member',
      avatar: 'S',
      quote: 'Pay-as-you-go Connect packs instead of hidden monthly auto-renewals is so refreshing. The conversations feel intentional, mature, and respectful.',
    },
    {
      name: 'Pooja V.',
      location: 'Pune',
      tag: 'Verified Female Member',
      avatar: 'P',
      quote: 'The private messaging feature and female privacy permissions give me total peace of mind. Highly recommended for anyone who values discretion.',
    },
  ];

  const landingFaqs = [
    {
      q: 'How does live selfie verification work on SWAY?',
      a: 'During sign-up, your device camera performs a quick 10-second facial detection and liveness check to verify your biological presence and confirm your gender. Static photo uploads from galleries are prohibited to eliminate synthetic media and catfishing.',
    },
    {
      q: 'Are Government ID or Aadhaar cards required to join?',
      a: 'No. SWAY operates on a zero-ID architecture. We never ask for or store Aadhaar, passports, or government-issued identification cards. Biometric liveness verifies human presence without compromising your civic documents.',
    },
    {
      q: 'Is my exact GPS location visible to other members?',
      a: 'Never. Other members only see an approximate calculated distance in kilometers (e.g. "Within 10 km"). Your exact GPS coordinates, IP address, and street location are strictly confidential.',
    },
    {
      q: 'What is the difference between Chat and Private Messages?',
      a: 'Chat is designed for real-time live messaging when both members are active and auto-closes after periods of inactivity. Private Messages remain in your inbox for up to 72 hours, providing a relaxed, pressure-free connection.',
    },
    {
      q: 'Do women have to pay for messaging on SWAY?',
      a: 'No. All verified female members enjoy 100% complimentary access to start, read, and reply to all Chats and Private Messages. Male members utilize transparent Connect packs with zero monthly subscriptions.',
    },
  ];

  return (
    <>
      <PublicNavbar />

      {/* ── HERO SECTION ── */}
      <section className="hero">
        <div className="container">
          <div className="col-lg-7 col-xl-6">
            <h1>Where Privacy <br /><span>Meets Chemistry</span></h1>
            <p className="my-4">
              A private, AI-verified platform for discerning adults seeking authentic, discreet, and meaningful connections. Real people, verified identities, and complete personal discretion.
            </p>
            <div className="d-flex flex-wrap gap-3 gap-sm-4 mb-4 text-white-50">
              <span className="text-white"><i className="bi bi-shield-check text-warning me-1"></i> Live AI Verified</span>
              <span className="text-white"><i className="bi bi-lock text-warning me-1"></i> 100% Private</span>
              <span className="text-white"><i className="bi bi-eye-slash text-warning me-1"></i> Complete Discretion</span>
            </div>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-wine px-4 py-2 fw-semibold">
                Start Verification <i className="bi bi-arrow-right ms-1"></i>
              </Link>
              <Link to="/about" className="btn btn-outline-light px-4 py-2 fw-semibold">
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="trust-bar">
        <div className="container">
          <div className="trust-inner row g-3 text-center text-md-start">
            <div className="col-md trust-item">
              <i className="bi bi-shield-check"></i>
              <div><b>AI Verified</b><br /><small className="text-white-50">100% Live Members</small></div>
            </div>
            <div className="col-md trust-item">
              <i className="bi bi-person-check"></i>
              <div><b>Real Identity</b><br /><small className="text-white-50">Zero Stolen Photos</small></div>
            </div>
            <div className="col-md trust-item">
              <i className="bi bi-incognito"></i>
              <div><b>Zero Civic ID</b><br /><small className="text-white-50">No Aadhaar Required</small></div>
            </div>
            <div className="col-md trust-item">
              <i className="bi bi-lock"></i>
              <div><b>Discreet Nearby</b><br /><small className="text-white-50">No Raw GPS Shown</small></div>
            </div>
            <div className="col-md trust-item">
              <i className="bi bi-patch-check"></i>
              <div><b>Verified Only</b><br /><small className="text-white-50">Protected Community</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DISCOVERY & INTRO SECTION ── */}
      <section className="section-pad">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-4">
              <div className="title-small">More Than A Platform</div>
              <h2 className="section-title">Rediscover <span>Connection</span></h2>
              <p className="text-secondary leading-relaxed">
                SWAY provides a secure and confidential environment where verified members can build genuine connections with people who understand them. No public feeds, no social media exposure, and zero fake accounts.
              </p>
              <Link to="/about" className="btn btn-wine mt-3 px-4 py-2 fw-semibold">
                Learn More About Us <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>

            <div className="col-lg-8">
              <div className="row g-4">
                <div className="col-sm-6 col-md-3">
                  <div className="feature-card h-100">
                    <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600" alt="Genuine Connections" />
                    <div className="icon"><i className="bi bi-heart"></i></div>
                    <div className="p-3"><h6>Genuine Connections</h6><p className="small text-muted mb-0">Meet verified, like-minded people privately.</p></div>
                  </div>
                </div>
                <div className="col-sm-6 col-md-3">
                  <div className="feature-card h-100">
                    <img src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=600" alt="Private Conversations" />
                    <div className="icon"><i className="bi bi-chat-heart"></i></div>
                    <div className="p-3"><h6>Private Chats</h6><p className="small text-muted mb-0">Secure messaging with verified members only.</p></div>
                  </div>
                </div>
                <div className="col-sm-6 col-md-3">
                  <div className="feature-card h-100">
                    <img src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=600" alt="Discretion" />
                    <div className="icon"><i className="bi bi-lock"></i></div>
                    <div className="p-3"><h6>Absolute Discretion</h6><p className="small text-muted mb-0">Your identity and contacts stay fully shielded.</p></div>
                  </div>
                </div>
                <div className="col-sm-6 col-md-3">
                  <div className="feature-card h-100">
                    <img src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600" alt="Compatibility" />
                    <div className="icon"><i className="bi bi-compass"></i></div>
                    <div className="p-3"><h6>Nearby Discovery</h6><p className="small text-muted mb-0">Smart proximity filters for local compatibility.</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECURITY & VERIFICATION PROCESS SECTION (GOVERNMENT ID REMOVED) ── */}
      <section className="verify-section">
        <div className="container">
          <div className="text-center mb-5 max-w-700 mx-auto">
            <h1 className="main-title">
              <span>The Balanced Vault:</span> Eradicating Fraud <br />
              Through Live Biometric Verification.
            </h1>
            <p className="sub-title">
              Secure Gender Validation for Women. Authentic Identity Verification for Men.
              Parallel Security for Shared Peace of Mind.
            </p>
          </div>

          <div className="row g-4 align-items-stretch">
            {/* Women's Security Card */}
            <div className="col-lg-6">
              <div className="security-card women-card h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex gap-3 align-items-start mb-4">
                    <div className="card-icon women-icon">
                      <i className="bi bi-person-heart"></i>
                    </div>
                    <div>
                      <h3 className="section-heading fs-4 mb-2">The Veil: Women's Absolute Anonymity</h3>
                      <ul className="feature-list list-unstyled mb-0">
                        <li><i className="bi bi-check2-circle text-danger me-2"></i> Zero Government ID Requirement</li>
                        <li><i className="bi bi-check2-circle text-danger me-2"></i> Real-Time AI Gender Authenticity Check</li>
                        <li><i className="bi bi-check2-circle text-danger me-2"></i> Data Sovereign Identity &amp; Photo Controls</li>
                        <li><i className="bi bi-check2-circle text-danger me-2"></i> Guaranteed Anonymous Female Privacy</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="process-box mt-3">
                  <div className="row align-items-center g-2 text-center">
                    <div className="col-5 process-item">
                      <i className="bi bi-camera-video fs-2 d-block text-wine mb-1"></i>
                      <small className="fw-bold">LIVE SELFIE SCAN</small>
                    </div>
                    <div className="col-2 arrow">
                      <i className="bi bi-arrow-right fs-4"></i>
                    </div>
                    <div className="col-5 process-item">
                      <div className="badge-round mx-auto">
                        BIOMETRIC<br />GENDER<br />MATCH
                      </div>
                    </div>
                  </div>
                  <div className="bottom-note text-center mt-3 pt-2 border-top border-light border-opacity-10 small text-white-50">
                    Identity remains 100% private. No Aadhaar or ID cards required.
                  </div>
                </div>
              </div>
            </div>

            {/* Men's Security Card (GOVERNMENT ID REMOVED & REBALANCED) */}
            <div className="col-lg-6">
              <div className="security-card men-card h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex gap-3 align-items-start mb-4">
                    <div className="card-icon men-icon">
                      <i className="bi bi-shield-lock"></i>
                    </div>
                    <div>
                      <h3 className="section-heading fs-4 mb-2">The Shield: Men's Trusted Validation</h3>
                      <ul className="feature-list list-unstyled mb-0">
                        <li><i className="bi bi-check2-circle text-primary me-2"></i> Live Camera Liveness &amp; Biometric Scan</li>
                        <li><i className="bi bi-check2-circle text-primary me-2"></i> Elimination of Bots, Spammers &amp; Catfish</li>
                        <li><i className="bi bi-check2-circle text-primary me-2"></i> True Biological Identity Authenticated</li>
                        <li><i className="bi bi-check2-circle text-primary me-2"></i> High-Intent, Courteous Member Community</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="process-box mt-3">
                  <div className="row align-items-center g-2 text-center">
                    <div className="col-5 process-item">
                      <i className="bi bi-person-bounding-box fs-2 d-block text-primary mb-1"></i>
                      <small className="fw-bold">LIVE CAMERA SCAN</small>
                    </div>
                    <div className="col-2 arrow">
                      <i className="bi bi-arrow-right fs-4"></i>
                    </div>
                    <div className="col-5 process-item">
                      <div className="badge-round badge-round2 mx-auto">
                        BIOMETRIC<br />LIVENESS<br />VERIFIED
                      </div>
                    </div>
                  </div>
                  <div className="bottom-note text-center mt-3 pt-2 border-top border-light border-opacity-10 small text-white-50">
                    Authenticity validated. Zero identity documents stored or collected.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="center-lock my-4">
            <i className="bi bi-lock-fill"></i>
          </div>

          <p className="text-center text-secondary small mb-0">
            Ecosystem Trust Loop: 100% Verified Biological Profiles + 100% Genuine, Authenticated People.
          </p>
        </div>
      </section>

      {/* ── HOW SWAY WORKS ── */}
      <section id="works" className="section-pad">
        <div className="container text-center">
          <h2 className="section-title mb-5">How SWAY Works</h2>
          <div className="row g-4">
            <div className="col-6 col-md"><div className="step-box"><div className="step-no">1</div><h6>Create Profile</h6><p className="small text-muted mb-0">Sign up with basic preferences and location.</p></div></div>
            <div className="col-6 col-md"><div className="step-box"><div className="step-no">2</div><h6>Live Selfie Check</h6><p className="small text-muted mb-0">10-second camera biometric verification.</p></div></div>
            <div className="col-6 col-md"><div className="step-box"><div className="step-no">3</div><h6>Instant Approval</h6><p className="small text-muted mb-0">Receive your Verified badge automatically.</p></div></div>
            <div className="col-6 col-md"><div className="step-box"><div className="step-no">4</div><h6>Find Connections</h6><p className="small text-muted mb-0">Discover verified people nearby.</p></div></div>
            <div className="col-6 col-md"><div className="step-box"><div className="step-no">5</div><h6>Connect Securely</h6><p className="small text-muted mb-0">Chat and exchange Private Messages safely.</p></div></div>
          </div>
        </div>
      </section>

      {/* ── OUR KEY VALUES (REWRITTEN & AUTHENTIC) ── */}
      <section id="plans" className="section-pad pt-0">
        <div className="container">
          <div className="text-center max-w-700 mx-auto mb-5">
            <span className="title-small">Core Philosophy</span>
            <h2 className="section-title">Our Key Values</h2>
            <p className="text-secondary">
              Everything we build centers on the dignity, safety, and mutual respect of our community members.
            </p>
          </div>

          <div className="row g-4">
            {keyValues.map((val, idx) => (
              <div key={idx} className="col-md-6 col-lg-4">
                <div className="plan-card text-start h-100 p-4">
                  <div className="icon-circle mb-3">
                    <i className={`bi ${val.icon} text-wine fs-3`}></i>
                  </div>
                  <h4 className="fw-bold mb-2 text-dark">{val.title}</h4>
                  <p className="text-secondary small leading-relaxed mb-0">{val.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOBILE STEALTH / APP SECTION ── */}
      <section className="section-pad bg-purple-gradient">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className="mb-4">
                <h2 className="section-title text-white mb-3">
                  Complete Discretion. Wherever You Go.
                </h2>
                <p className="lead text-white-50 mb-4" style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
                  Engineered with privacy controls from the ground up. Access SWAY on your mobile browser with stealth privacy toggles, face-blur options, and granular social permissions.
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="feature-icon me-3">
                    <i className="bi bi-shield-check text-white"></i>
                  </div>
                  <span className="fw-semibold text-white">Guaranteed Women’s Anonymity &amp; Free Chat</span>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <div className="feature-icon me-3">
                    <i className="bi bi-eye-slash text-white"></i>
                  </div>
                  <span className="fw-semibold text-white">One-Tap Face Blur for Public Feed Discretion</span>
                </div>
                <div className="d-flex align-items-center mb-3">
                  <div className="feature-icon me-3">
                    <i className="bi bi-sliders text-white"></i>
                  </div>
                  <span className="fw-semibold text-white">Selective Social &amp; Phone Permission Toggles</span>
                </div>
                <div className="d-flex align-items-center mb-4">
                  <div className="feature-icon me-3">
                    <i className="bi bi-lock text-white"></i>
                  </div>
                  <span className="fw-semibold text-white">Encrypted Real-Time WebSocket Messaging</span>
                </div>
              </div>

              <div>
                <Link to="/register" className="btn btn-wine px-4 py-2 fw-semibold">
                  Get Started Today <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            <div className="col-lg-6 hero-img-container text-center">
              <div className="position-relative d-inline-block">
                <img src="/img/app-ui.png" alt="SWAY App Interface" className="mockup-img img-fluid" style={{ maxHeight: 480, borderRadius: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS (REDESIGNED & AUTHENTIC) ── */}
      <section className="testimonial py-5">
        <div className="container">
          <div className="text-center max-w-700 mx-auto mb-5">
            <span className="badge-wine mb-2">Member Feedback</span>
            <h2 className="section-title text-white">What Our Verified Members Say</h2>
            <p className="text-white-50">Authentic experiences from members who value privacy and genuine connection.</p>
          </div>

          <div className="row g-4">
            {testimonials.map((t, idx) => (
              <div key={idx} className="col-md-6 col-lg-3">
                <div className="testimonial-card p-4 rounded-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="avatar-circle">
                        {t.avatar}
                      </div>
                      <div>
                        <h6 className="fw-bold text-white mb-0">{t.name}</h6>
                        <small className="text-warning" style={{ fontSize: '11px' }}>
                          <i className="bi bi-patch-check-fill me-1" />{t.tag}
                        </small>
                      </div>
                    </div>
                    <p className="testimonial-quote text-light small mb-3">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="d-flex align-items-center justify-content-between pt-2 border-top border-white border-opacity-10 small text-white-50">
                    <span><i className="bi bi-geo-alt me-1" />{t.location}</span>
                    <span className="text-warning">
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                      <i className="bi bi-star-fill" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE FAQ SECTION ── */}
      <section id="faq" className="section-pad">
        <div className="container">
          <div className="text-center max-w-700 mx-auto mb-5">
            <span className="title-small">Got Questions?</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="text-secondary">
              Clear answers regarding verification, privacy settings, Connect packs, and safety.
            </p>
          </div>

          <div className="faq-accordion-wrapper mx-auto" style={{ maxWidth: 840 }}>
            <div className="d-flex flex-column gap-3">
              {landingFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className={`faq-card ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                    >
                      <span className="faq-question-text">{faq.q}</span>
                      <span className="faq-toggle-icon">
                        <i className={`bi ${isOpen ? 'bi-dash-lg' : 'bi-plus-lg'}`} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="faq-answer-body">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-5">
              <Link to="/faq" className="btn btn-outline-danger px-4 py-2 rounded-pill fw-semibold">
                View All FAQs &amp; Knowledge Base <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}